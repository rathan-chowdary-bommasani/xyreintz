# WindDesk

Day-ahead wind forecast monitoring for a GB utility's power procurement desk.

The desk buys power on the GB day-ahead market before gate closure on D-1, and needs to know how much wind it can count on for delivery day D. The product does exactly two things, one screen each, for every decision day in the pilot window (January 2026).

Two shared controls set the moment in time: **Today** (the decision day) and the **Buying deadline** (default 09:50 UK). Both screens show only what was known at that moment, so the pilot can be replayed day by day exactly as the desk would have seen it.

| Requirement                                                                                               | Screen                        | What it shows                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Clearly understand the latest renewable generation forecast available when the buying decision is made | **Forecast at decision time** | Tomorrow's wind forecast as it stood at today's deadline: which forecast was the latest published before it, the day's total, and the forecast hour by hour. No actuals.                                 |
| 2. Evaluate the accuracy of those forecasts quantitatively, to decide with the error in mind              | **Forecast accuracy**         | Accuracy up to today: only delivery days that had finished by today's deadline (up to yesterday) are scored. The typical error (average miss per hour) and a chart of forecast vs actual for every hour. |

Data: Elexon Insights API, national level. Actuals from `FUELHH` (`fuelType = WIND`, half-hourly), forecasts from `WINDFOR` (hourly targets, ~8 runs a day). No other data is used.

---

## Modelling decisions

These are the choices that shape every number in the app.

| Decision                       | Choice                                                                                                                                                | Why                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate closure (buying deadline) | **09:50 UK time on D-1** by default (N2EX GB day-ahead auction), adjustable in the UI                                                                 | The forecast that matters is the one available when the bid goes in.                                                                                                            |
| Pilot window                   | Decisions on **1 to 31 Jan 2026**, i.e. delivery days **2 Jan to 1 Feb 2026**                                                                         | The brief scopes to purchase decisions made in January 2026.                                                                                                                    |
| Delivery day                   | 00:00 to 24:00 UK local time (48 settlement periods; 46/50 on clock-change days)                                                                      | Matches GB settlement days.                                                                                                                                                     |
| Forecast used                  | For each target period, the **latest WINDFOR run with `publishTime ≤ gate`**                                                                          | Anything published later would leak information the desk did not have.                                                                                                          |
| Resolution                     | Forecast is hourly, outturn half-hourly. Errors are scored where both exist (on the hour). Energy totals integrate each series at its own resolution. | No values are invented by interpolation.                                                                                                                                        |
| Accuracy "up to today"         | For decision day T, score delivery days **≤ T-1** only                                                                                                | Yesterday's outturn is complete by midnight, so it is known at today's deadline; today's delivery is still under way. On 1–2 Jan nothing has finished yet, so screen 2 says so. |
| Normalised error               | MAE as % of mean actual output (nMAE), not MAPE                                                                                                       | MAPE explodes when wind output is near zero.                                                                                                                                    |

### Accuracy metrics (screen 2)

- **Typical error** (mean absolute error, MAE): the average size of the miss per hour, in MW. Also shown as a % of average wind output.

---

## Architecture

```
 Browser ──► frontend/   React app, built to static files
                │
                │  GET {VITE_API_BASE}/api/*
                ▼
             backend/    FastAPI (uvicorn), Docker image; JSON API only (/docs)
                routes/ ──► WindDataService ── loads once, on first request ──► Elexon Insights
                                  │
                                  ▼  per request
                            picks the latest run before each gate, scores it
```

- **Deployed separately.** The frontend is static files that call the backend at `VITE_API_BASE`; the backend is a Docker image that serves only `/api` and accepts requests from any origin (CORS `*`; the data is public and read-only).
- **Small backend.** Routes stay thin; `services/wind_data_service.py` holds all the logic in Python(FastAPI).
- **Data lifecycle.** The first request fetches the month from Elexon (about a second): one request per dataset, retried on rate limits and server errors. The data is historical, so it is held in memory and never refreshed. Nothing is written to disk, so every restart fetches it again.
- **Frontend state in the URL.** Today, deadline and tab live in the query string, so every view is shareable. Each screen keeps its previous data on screen (dimmed) while the next one loads, so there are no loading flashes.

### API

| Endpoint                                        | Returns                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /api/meta`                                 | Window, decision and delivery dates, default deadline, data provenance                                 |
| `GET /api/day-ahead/{delivery_date}?gate=HH:MM` | Screen 1: hourly forecast at the deadline, the run used, energy total. No actuals.                     |
| `GET /api/accuracy?as_of=YYYY-MM-DD&gate=HH:MM` | Screen 2, scored through the day before `as_of`: typical error, days scored, hourly forecast vs actual |

Interactive docs at `/docs` when the backend is running.

---

Styling: Tailwind utilities for layout and spacing in JSX; CSS modules (`index.module.css`) for component-specific visuals. Both read the same CSS custom properties defined in `src/App.css`.

---

## Running it

Requires Python 3.12+ and Node 22+. Each backend start downloads January 2026 from Elexon (a few seconds) and keeps it in memory.

### Backend

```bash
# http://127.0.0.1:8000 (API docs at /docs)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py                   # or: uvicorn app:app --reload --log-level warning
```

With Docker:

```bash
docker build -t winddesk-backend backend
docker run -p 8000:8000 winddesk-backend
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to the backend on port 8000
```

---

## Configuration

Backend settings are environment variables prefixed `WINDDESK_`, or the same names in `backend/.env` (see `backend/.env.example`).

| Variable                                     | Default                                 | Meaning                            |
| -------------------------------------------- | --------------------------------------- | ---------------------------------- |
| `DEFAULT_GATE`                               | `09:50`                                 | Gate closure on D-1, UK local time |
| `FIRST_DECISION_DATE` / `LAST_DECISION_DATE` | `2026-01-01` / `2026-01-31`             | Decision window                    |
| `ELEXON_BASE_URL`                            | `https://data.elexon.co.uk/bmrs/api/v1` | API base                           |

Frontend: `VITE_API_BASE` (build time) is the backend URL, without a trailing slash. Unset, the app calls `/api` on its own origin.

---

## Use of AI tools

Some AI assistance (Claude) was used along the way, mainly to help with:

- Writing and improving documentation
- Exploring UI design ideas and some parts of ui for faster development
- Researching the domain and related concepts
- Assistance in some parts of development to improve quality and speed up the process

All core decisions, including the architecture, data handling, and final code, were made and implemented by me.

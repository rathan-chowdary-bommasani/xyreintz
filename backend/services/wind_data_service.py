"""
Loads January's wind data from Elexon once and builds the app's two screens:
the forecast available at the buying deadline, and how accurate it has been.
"""

import asyncio
from datetime import UTC, date, datetime, time, timedelta
from typing import NamedTuple
from zoneinfo import ZoneInfo

from config import Settings, config
from services.elexon_client import ElexonClient


class DataUnavailableError(RuntimeError):
    """Elexon returned no data."""


class HourlyForecast(NamedTuple):
    delivery_date: date
    start_time: datetime
    publish_time: datetime
    forecast: float


def local_midnight(day: date, tz: str) -> datetime:
    """00:00 local time on the given day, in UTC."""
    return datetime.combine(day, time(0, 0), tzinfo=ZoneInfo(tz)).astimezone(UTC)


def gate_closure(day: date, gate: time, tz: str) -> datetime:
    """Gate closure for a delivery day: the gate time, local, on the day before. In UTC."""
    local = datetime.combine(day - timedelta(days=1), gate, tzinfo=ZoneInfo(tz))
    return local.astimezone(UTC)


class WindDataService:
    """Holds the month of Elexon data and builds the API responses from it."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.tz = settings.market_timezone
        self.lock = asyncio.Lock()
        self.fetched_at: datetime | None = None
        # settlement period start -> MW
        self.actuals: dict[datetime, float] = {}
        # (publish time, target hour) -> MW
        self.forecasts: dict[tuple[datetime, datetime], float] = {}
        # target hour -> [(publish time, MW)], oldest run first
        self.runs: dict[datetime, list[tuple[datetime, float]]] = {}

    @property
    def delivery_dates(self) -> list[date]:
        """Each decision day buys for the next day."""
        s = self.settings
        span = (s.last_decision_date - s.first_decision_date).days
        return [s.first_decision_date + timedelta(days=i + 1) for i in range(span + 1)]

    async def load(self) -> None:
        """Fetch the month from Elexon on first use. Concurrent callers share one fetch."""
        async with self.lock:
            if self.fetched_at is None:
                await self._fetch()

    async def _fetch(self) -> None:
        s = self.settings
        days = self.delivery_dates
        # Every run that could be the latest before a gate: from the day before
        # the first decision day to the end of the last one.
        publish_from = local_midnight(
            s.first_decision_date - timedelta(days=1), self.tz
        )
        publish_to = local_midnight(s.last_decision_date + timedelta(days=1), self.tz)

        async with ElexonClient(
            s.elexon_base_url, s.elexon_timeout_s, s.elexon_max_retries
        ) as client:
            raw_actuals, raw_forecasts = await asyncio.gather(
                client.wind_actuals(days[0], days[-1]),
                client.wind_forecasts(publish_from, publish_to),
            )
        if not raw_actuals or not raw_forecasts:
            raise DataUnavailableError(
                f"Elexon returned {len(raw_actuals)} actuals and {len(raw_forecasts)} forecasts"
            )

        # A settlement period can be republished; the latest publication wins.
        actuals = {}
        for r in sorted(raw_actuals, key=lambda r: r["publishTime"]):
            actuals[datetime.fromisoformat(r["startTime"])] = float(r["generation"])

        forecasts = {}
        for r in raw_forecasts:
            key = (
                datetime.fromisoformat(r["publishTime"]),
                datetime.fromisoformat(r["startTime"]),
            )
            forecasts[key] = float(r["generation"])

        # Skip rows where a run restates an hour that had already started.
        runs = {}
        for (published, start), mw in sorted(forecasts.items()):
            if start > published:
                runs.setdefault(start, []).append((published, mw))

        self.actuals, self.forecasts, self.runs = (
            actuals,
            forecasts,
            dict(sorted(runs.items())),
        )
        self.fetched_at = datetime.now(UTC)

    def get_meta(self) -> dict:
        s = self.settings
        return {
            "timezone": self.tz,
            "first_decision_date": s.first_decision_date,
            "last_decision_date": s.last_decision_date,
            "decision_dates": [d - timedelta(days=1) for d in self.delivery_dates],
            "delivery_dates": self.delivery_dates,
            "default_gate": s.default_gate.strftime("%H:%M"),
            "data": {
                "source": "elexon",
                "fetched_at": self.fetched_at,
                "actual_periods": len(self.actuals),
                "forecast_rows": len(self.forecasts),
                "forecast_runs": len({published for published, _ in self.forecasts}),
            },
        }

    def get_day_ahead(self, day: date, gate: time | None = None) -> dict:
        """Screen 1: the forecast as it stood at the buying deadline. No actuals."""
        gate = gate or self.settings.default_gate
        hours = self._forecasts_at_gate(gate, [day])
        gate_time = gate_closure(day, gate, self.tz)
        runs = sorted({h.publish_time for h in hours})
        run_age_min = (gate_time - runs[-1]).total_seconds() / 60 if runs else None

        return {
            "delivery_date": day,
            "gate_time": gate_time,
            "forecast_runs": runs,
            "latest_run_age_min": round(run_age_min) if runs else None,
            # Hourly values, so the day's energy in MWh is their sum.
            "summary": {
                "forecast_energy_mwh": round(sum(h.forecast for h in hours))
                if hours
                else None
            },
            "points": [
                {"start_time": h.start_time, "forecast": round(h.forecast, 1)}
                for h in hours
            ],
        }

    def get_accuracy(self, as_of: date, gate: time | None = None) -> dict:
        """
        Screen 2: typical error of the deadline forecast over the delivery days
        finished by as_of's deadline, i.e. up to the day before.
        """
        gate = gate or self.settings.default_gate
        scored_through = as_of - timedelta(days=1)
        days = [d for d in self.delivery_dates if d <= scored_through]
        pairs = [
            (h, self.actuals[h.start_time])
            for h in self._forecasts_at_gate(gate, days)
            if h.start_time in self.actuals
        ]

        n = len(pairs)
        mae = sum(abs(h.forecast - actual) for h, actual in pairs) / n if n else None
        mean_actual = sum(actual for _, actual in pairs) / n if n else 0
        scored_days = sorted({h.delivery_date for h, _ in pairs})

        return {
            "gate": gate.strftime("%H:%M"),
            "as_of": as_of,
            "deadline": gate_closure(as_of + timedelta(days=1), gate, self.tz),
            "scored_through": scored_through,
            "summary": {
                "stats": {
                    "n": n,
                    "mae": round(mae, 1) if n else None,
                    # As a share of average output, so it reads as "about 10% off".
                    "nmae_pct": round(100 * mae / mean_actual, 1)
                    if mean_actual > 0
                    else None,
                },
                "days": len(scored_days),
                "first_day": scored_days[0] if scored_days else None,
                "last_day": scored_days[-1] if scored_days else None,
            },
            "series": [
                {
                    "start_time": h.start_time,
                    "delivery_date": h.delivery_date,
                    "forecast": round(h.forecast, 1),
                    "actual": round(actual, 1),
                }
                for h, actual in pairs
            ],
        }

    def _forecasts_at_gate(self, gate: time, days: list[date]) -> list[HourlyForecast]:
        """Each hour of the given delivery days with the latest run published by that day's gate."""
        hours = []
        for day in days:
            gate_time = gate_closure(day, gate, self.tz)
            day_start = local_midnight(day, self.tz)
            day_end = local_midnight(day + timedelta(days=1), self.tz)
            for start, runs in self.runs.items():
                if not day_start <= start < day_end:
                    continue
                at_gate = [run for run in runs if run[0] <= gate_time]
                if at_gate:
                    published, mw = at_gate[-1]
                    hours.append(HourlyForecast(day, start, published, mw))
        return hours


wind_data_service = WindDataService(config)

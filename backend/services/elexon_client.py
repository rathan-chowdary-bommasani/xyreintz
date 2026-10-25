import asyncio
from datetime import date, datetime, timedelta

import httpx

RETRYABLE_STATUS = {429, 500, 502, 503, 504}
TIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"


class ElexonClient:
    """
    Async client for the two Elexon Insights datasets the app uses:
    FUELHH (half-hourly outturn by fuel type) and WINDFOR (wind forecast runs).
    """

    def __init__(self, base_url: str, timeout_s: float = 30.0, max_retries: int = 3):
        self.max_retries = max_retries
        self.http = httpx.AsyncClient(
            base_url=base_url,
            timeout=timeout_s,
            headers={"Accept": "application/json"},
            transport=httpx.AsyncHTTPTransport(retries=max_retries),
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.http.aclose()

    async def wind_actuals(self, first_day: date, last_day: date) -> list[dict]:
        """FUELHH wind outturn for settlement dates first_day..last_day inclusive."""
        params = {
            "settlementDateFrom": first_day.isoformat(),
            "settlementDateTo": last_day.isoformat(),
            "fuelType": "WIND",
        }
        return await self._get("/datasets/FUELHH/stream", params)

    async def wind_forecasts(
        self, publish_from: datetime, publish_to: datetime
    ) -> list[dict]:
        """Every WINDFOR run published in [publish_from, publish_to). Times are UTC."""
        params = {
            "publishDateTimeFrom": publish_from.strftime(TIME_FORMAT),
            "publishDateTimeTo": (publish_to - timedelta(seconds=1)).strftime(
                TIME_FORMAT
            ),
        }
        return await self._get("/datasets/WINDFOR/stream", params)

    async def _get(self, path: str, params: dict) -> list[dict]:
        """GET a stream endpoint, retrying rate limits and server errors with backoff."""
        for attempt in range(self.max_retries + 1):
            response = await self.http.get(path, params=params)
            if (
                response.status_code not in RETRYABLE_STATUS
                or attempt == self.max_retries
            ):
                break
            await asyncio.sleep(0.5 * 2**attempt)
        response.raise_for_status()
        return response.json()

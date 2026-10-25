from datetime import date, time

from fastapi import APIRouter, HTTPException

from response_models.wind_models import AccuracyResponse, DayAheadResponse, MetaResponse
from services.wind_data_service import wind_data_service as service

router = APIRouter(tags=["Wind data"])


async def load_data() -> None:
    """Make sure the Elexon data is loaded; 503 if it could not be fetched."""
    try:
        await service.load()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Elexon data unavailable: {type(exc).__name__}: {exc}",
        ) from exc


@router.get("/meta", response_model=MetaResponse)
async def get_meta():
    """Decision and delivery dates, the default deadline and where the data came from."""
    await load_data()
    return service.get_meta()


@router.get("/day-ahead/{delivery_date}", response_model=DayAheadResponse)
async def get_day_ahead(delivery_date: date, gate: time | None = None):
    """Screen 1: the latest forecast available at the buying deadline for one delivery day."""
    await load_data()
    days = service.delivery_dates
    if delivery_date not in days:
        raise HTTPException(
            status_code=404,
            detail=f"delivery_date must be between {days[0]} and {days[-1]}",
        )
    return service.get_day_ahead(delivery_date, gate)


@router.get("/accuracy", response_model=AccuracyResponse)
async def get_accuracy(as_of: date | None = None, gate: time | None = None):
    """Screen 2: accuracy of the deadline forecast up to the day before as_of."""
    await load_data()
    s = service.settings
    as_of = as_of or s.last_decision_date
    if not s.first_decision_date <= as_of <= s.last_decision_date:
        raise HTTPException(
            status_code=404,
            detail=f"as_of must be between {s.first_decision_date} and {s.last_decision_date}",
        )
    return service.get_accuracy(as_of, gate)

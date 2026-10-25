"""
Response models. Pydantic turns dates and datetimes into ISO-8601 strings
(UTC times end in Z). Power is in MW, energy in MWh.
"""

from datetime import date, datetime

from pydantic import BaseModel


class DataStatus(BaseModel):
    source: str
    fetched_at: datetime
    actual_periods: int
    forecast_rows: int
    forecast_runs: int


class MetaResponse(BaseModel):
    timezone: str
    first_decision_date: date
    last_decision_date: date
    decision_dates: list[date]
    delivery_dates: list[date]
    default_gate: str
    data: DataStatus


class DaySummary(BaseModel):
    forecast_energy_mwh: float | None


class DayPoint(BaseModel):
    start_time: datetime
    forecast: float


class DayAheadResponse(BaseModel):
    delivery_date: date
    gate_time: datetime
    forecast_runs: list[datetime]
    latest_run_age_min: float | None
    summary: DaySummary
    points: list[DayPoint]


class ErrorStats(BaseModel):
    n: int
    mae: float | None
    nmae_pct: float | None


class AccuracySummary(BaseModel):
    stats: ErrorStats
    days: int
    first_day: date | None
    last_day: date | None


class SeriesPoint(BaseModel):
    start_time: datetime
    delivery_date: date
    forecast: float
    actual: float


class AccuracyResponse(BaseModel):
    gate: str
    as_of: date
    deadline: datetime
    scored_through: date
    summary: AccuracySummary
    series: list[SeriesPoint]

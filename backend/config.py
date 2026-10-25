from datetime import date, time

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    WindDesk settings. Every value can be overridden with an environment
    variable prefixed WINDDESK_, e.g. WINDDESK_DEFAULT_GATE=09:20.
    """

    model_config = SettingsConfigDict(
        env_prefix="WINDDESK_", env_file=".env", extra="ignore"
    )

    # ============ Elexon Insights API ============
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    elexon_timeout_s: float = 30.0
    elexon_max_retries: int = 3

    # ============ Market ============
    market_timezone: str = "Europe/London"
    # Decisions are taken on D-1 for delivery day (D), so decisions made in
    # January 2026 cover delivery days 2 Jan to 1 Feb 2026.
    first_decision_date: date = date(2026, 1, 1)
    last_decision_date: date = date(2026, 1, 31)

    # default day ahead auction gate closure time (UK local time)
    default_gate: time = time(9, 50)


config = Settings()

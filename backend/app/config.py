from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smartagri"
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SARVAM_API_KEY: str = ""
    SARVAM_API_URL: str = "https://api.sarvam.ai"
    MAPS_API_KEY: Optional[str] = None
    MAPS_PROVIDER: str = "haversine"
    TRANSPORT_RATE_PER_KM_PER_TON: float = 4.0
    MARKET_FEE_PERCENT: float = 1.0
    DEMO_MODE: bool = True

settings = Settings()

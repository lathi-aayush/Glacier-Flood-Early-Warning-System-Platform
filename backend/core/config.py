import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"

load_dotenv(_ENV_FILE, override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "GlacierGuard API"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast")
    USGS_EARTHQUAKE_URL: str = os.getenv("USGS_EARTHQUAKE_URL", "https://earthquake.usgs.gov/fdsnws/event/1/query")
    COPERNICUS_CLIENT_ID: str = os.getenv("COPERNICUS_CLIENT_ID", "")
    COPERNICUS_CLIENT_SECRET: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")
    COPERNICUS_USERNAME: str = os.getenv("COPERNICUS_USERNAME", "")
    COPERNICUS_PASSWORD: str = os.getenv("COPERNICUS_PASSWORD", "")
    BHOONIDHI_USER: str = os.getenv("BHOONIDHI_USER", "")
    BHOONIDHI_PASS: str = os.getenv("BHOONIDHI_PASS", "")
    COPERNICUS_CATALOGUE_URL: str = os.getenv(
        "COPERNICUS_CATALOGUE_URL", "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    )
    COPERNICUS_TOKEN_URL: str = os.getenv(
        "COPERNICUS_TOKEN_URL", "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    )
    SATELLITE_SYNC_INTERVAL_HOURS: float = float(os.getenv("SATELLITE_SYNC_INTERVAL_HOURS", "24"))

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def resolved_database_url(self) -> str:
        # ponytail: default to local sqlite if DATABASE_URL is unset; auto-fix postgres:// -> postgresql:// for SQLAlchemy
        url = self.DATABASE_URL.strip()
        if not url:
            return "sqlite:///./glacierguard.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = str(_ENV_FILE)
        extra = "ignore"

settings = Settings()

def reload_settings() -> Settings:
    global settings
    load_dotenv(_ENV_FILE, override=True)
    settings = Settings()
    return settings

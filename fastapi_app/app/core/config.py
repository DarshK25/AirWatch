from pathlib import Path
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to this file's location (fastapi_app/.env)
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    # Database Settings
    DATABASE_URL: str

    # JWT Settings
    JWT_SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # OpenAQ
    OPENAQ_API_KEY: str = ""

    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "https://air-watch-theta.vercel.app,"
        "https://airwatch-p0bo.onrender.com"
    )
    ALLOWED_ORIGIN_REGEX: str = (
        r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost(:\d+)?"
    )

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    @computed_field
    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()

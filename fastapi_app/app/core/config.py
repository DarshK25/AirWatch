from pydantic_settings import BaseSettings
from pathlib import Path

# Resolve .env relative to this file's location (fastapi_app/.env)
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str

    # JWT Settings
    JWT_SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # OpenAQ
    OPENAQ_API_KEY: str = ""

    class Config:
        env_file = str(ENV_FILE)

settings = Settings()

from pathlib import Path
import tempfile
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
    SQLITE_PATH: str = ""
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://localhost:4028,"
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

    @computed_field
    @property
    def database_url(self) -> str:
        if not self.DATABASE_URL.startswith("sqlite:///"):
            return self.DATABASE_URL

        sqlite_target = self.DATABASE_URL.removeprefix("sqlite:///")

        if sqlite_target.startswith("/"):
            return self.DATABASE_URL

        if self.SQLITE_PATH:
            normalized_path = self.SQLITE_PATH.replace("\\", "/")
            if not normalized_path.startswith("/"):
                normalized_path = f"/{normalized_path}"
            return f"sqlite:///{normalized_path}"

        if self.ENVIRONMENT.lower() in {"production", "staging"}:
            temp_db_path = Path(tempfile.gettempdir()) / "airwatch.db"
            return f"sqlite:///{temp_db_path.as_posix()}"

        return self.DATABASE_URL

settings = Settings()

"""
Application configuration settings
"""
from typing import List, Optional
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AirWatch Pro"
    VERSION: str = "1.0.0"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4028"
    ]
    
    # Model Settings
    MODEL_PATH: str = "models/"
    DATA_PATH: str = "../dataset/"
    
    # API Settings
    API_PREFIX: str = "/api"
    
    # Security (add your security settings here)
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (if you're using one)
    DATABASE_URL: Optional[str] = None
    
    # Validator for CORS origins
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Initialize settings
settings = Settings()

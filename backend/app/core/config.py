import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AirWatch"
    MODEL_PATH: str = os.getenv("MODEL_PATH", "app/models/hourly_model.pkl")

settings = Settings()

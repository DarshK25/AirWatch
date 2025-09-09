from fastapi import APIRouter
from pydantic import BaseModel
import joblib
import numpy as np
from app.core.config import settings

router = APIRouter()

# Input schema
class AQIRequest(BaseModel):
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float

# Load model once
model = joblib.load(settings.MODEL_PATH)

@router.post("/predict")
def predict_aqi(data: AQIRequest):
    features = np.array([[data.pm25, data.pm10, data.no2, data.so2, data.co, data.o3]])
    prediction = model.predict(features)
    return {"aqi": float(prediction[0])}

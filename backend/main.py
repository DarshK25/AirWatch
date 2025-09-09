from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import prediction
from app.core.config import settings

app = FastAPI(title="AirWatchPro API", version="0.1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(prediction.router, prefix="/api/v1", tags=["Prediction"])


@app.get("/")
def root():
    return {"message": "AirWatchPro backend is running 🚀"}

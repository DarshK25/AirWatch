from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

# This base is used to define all your models
Base = declarative_base()

class Station(Base):
    """Database model for an AQI Monitoring Station (metadata)."""
    __tablename__ = "stations"
    
    # Matches 'location_id' from CSV
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, index=True) # Matches 'location' from CSV
    lat = Column(Float)
    lon = Column(Float)
    
    # Relationships for easy querying
    readings = relationship("Reading", back_populates="station")
    predictions = relationship("Prediction", back_populates="station")

class Reading(Base):
    """Database model for individual sensor measurements."""
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    datetime = Column(DateTime(timezone=True), default=func.now(), index=True)
    parameter = Column(String)
    unit = Column(String)
    value = Column(Float)

    station = relationship("Station", back_populates="readings")

    # Unique constraint enables INSERT OR IGNORE upserts — no duplicate checks needed
    __table_args__ = (
        UniqueConstraint("station_id", "datetime", "parameter", name="uq_reading"),
    )

class Prediction(Base):
    """Database model for forecasted AQI values."""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    
    prediction_time = Column(DateTime(timezone=True), index=True) # The future timestamp the prediction is for
    predicted_aqi = Column(Float)
    
    # Columns for MLOps tracking and detailed forecast
    predicted_pm25 = Column(Float, nullable=True) # Optional detailed forecast
    predicted_pm10 = Column(Float, nullable=True)
    model_version = Column(String, default="xgb_tuned_v2.0") 
    
    station = relationship("Station", back_populates="predictions")
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.core.db import engine
from app.services.aqi_calculator import calculate_sub_index, AQI_BREAKPOINTS, ppb_to_ugm3, GAS_MW
import os

# Define the storage path for the generated ML Feature Store CSV
FEATURE_STORE_PATH = "ml_data/ml_feature_store.csv"

def prepare_ml_features() -> pd.DataFrame:
    """
    Fetches all historical data from the database, cleans units, calculates AQI, 
    adds temporal features for high accuracy, and pivots the data into a wide 
    format ready for ML model training/prediction.
    """
    print("Starting ML feature preparation (Ultimate Accuracy)...")

    # 1. Load ALL historical readings from the database
    query = """
    SELECT 
        r.station_id, 
        r.datetime, 
        r.parameter, 
        r.unit, 
        r.value,
        s.lat,
        s.lon
    FROM readings r
    JOIN stations s ON r.station_id = s.id
    ORDER BY r.datetime;
    """
    try:
        # Use a context manager for the engine connection
        with engine.connect() as conn:
            df = pd.read_sql(query, conn)
    except Exception as e:
        print(f"Error loading data for ML: {e}")
        return pd.DataFrame()
    
    print(f"Loaded {len(df)} historical records.")

    # 2. Unit Conversion (ppb -> µg/m³)
    # Assume 25°C for standard conversion factor since temperature data is sparse
    DEFAULT_TEMP_C = 25.0 

    def apply_unit_conversion(row):
        """Converts ppb values to µg/m³ based on the gas MW and a default temp."""
        if row['unit'].lower() == 'ppb' and row['parameter'] in GAS_MW:
            row['value'] = ppb_to_ugm3(row['value'], GAS_MW[row['parameter']], DEFAULT_TEMP_C)
            row['unit'] = 'µg/m³_converted'
        return row

    df = df.apply(apply_unit_conversion, axis=1)
    
    # 3. Pivot Data to Wide Format
    
    # We drop the original 'unit' and 'sensors_id' columns before pivoting
    df = df.drop(columns=['unit', 'sensors_id'], errors='ignore') 
    
    # Pivot: Index by time and station, columns are the parameters
    feature_df = df.pivot_table(
        index=['datetime', 'station_id', 'lat', 'lon'],
        columns='parameter',
        values='value'
    ).reset_index()

    # 4. Calculate AQI (Target Variable Base)
    
    # Define a list of pollutant columns needed for AQI calculation
    aqi_pollutants = list(AQI_BREAKPOINTS.keys())

    def calculate_overall_aqi_row(row):
        """Calculates the max sub-index (overall AQI) for a single timestamp/station."""
        sub_indices = []
        for pollutant in aqi_pollutants:
            # Ensure the pollutant column exists and is not null
            if pollutant in row and pd.notna(row[pollutant]):
                sub_index = calculate_sub_index(row[pollutant], pollutant)
                sub_indices.append(sub_index)
                
        return max(sub_indices) if sub_indices else 0

    feature_df['overall_aqi'] = feature_df.apply(calculate_overall_aqi_row, axis=1)

    # 5. Feature Engineering for Ultimate Accuracy (Temporal & Cyclical)
    
    feature_df['datetime'] = pd.to_datetime(feature_df['datetime'], utc=True)
    
    # Temporal Features
    feature_df['hour'] = feature_df['datetime'].dt.hour
    feature_df['day_of_week'] = feature_df['datetime'].dt.dayofweek # Monday=0, Sunday=6
    feature_df['month'] = feature_df['datetime'].dt.month

    # Cyclical Encoding (crucial for time-series models)
    feature_df['hour_sin'] = np.sin(2 * np.pi * feature_df['hour'] / 24)
    feature_df['hour_cos'] = np.cos(2 * np.pi * feature_df['hour'] / 24)
    
    # Drop the base 'hour' column to avoid multicollinearity
    feature_df = feature_df.drop(columns=['hour'])


    print(f"Feature Store ready with {len(feature_df)} unique timestamp/station rows.")
    
    # 6. Save Feature Store
    os.makedirs(os.path.dirname(FEATURE_STORE_PATH), exist_ok=True)
    feature_df.to_csv(FEATURE_STORE_PATH, index=False) 
    print(f"ML Feature Store saved to {FEATURE_STORE_PATH}")
    
    return feature_df

if __name__ == '__main__':
    # This block is for testing the feature generation locally
    features = prepare_ml_features()
    if not features.empty:
        print("\nFirst 5 rows of ML Feature Store (with new features):")
        print(features.head().to_markdown(index=False))
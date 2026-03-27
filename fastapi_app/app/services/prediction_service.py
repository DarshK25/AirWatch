import joblib
pd = None
np = None
from sqlalchemy.orm import Session
from app.models.aqi import Prediction
from datetime import timedelta, datetime
import os
import math

def _import_ml_deps():
    global pd, np, ML_AVAILABLE
    if pd is None:
        try:
            import pandas
            import numpy
            pd = pandas
            np = numpy
            ML_AVAILABLE = True
        except ImportError as e:
            print(f"Warning: ML dependencies not available: {e}")
            ML_AVAILABLE = False

# Check if ML dependencies are available (lazy)
ML_AVAILABLE = None  # Will be set on first use

def _check_ml():
    global ML_AVAILABLE
    if ML_AVAILABLE is None:
        _import_ml_deps()
    return ML_AVAILABLE

# Define file paths for model assets
MODEL_DIR = "ml_models"
MODEL_PATH = os.path.join(MODEL_DIR, "xgb_tuned_aqi_model.joblib")
FEATURE_STORE_PATH = "ml_data/ml_feature_store.csv"
FORECAST_HORIZON_HOURS = 48 # Predict next 48 hours

def load_model_assets():
    """Loads the trained model, scaler, and feature list."""
    if not _check_ml():
        print("ERROR: ML dependencies not available. Cannot load model.")
        return None, None, None
    try:
        # The ML pipeline saves a tuple: (model, scaler, feature_list)
        model, scaler, features = joblib.load(MODEL_PATH)
        return model, scaler, features
    except FileNotFoundError:
        print(f"ERROR: Model file not found at {MODEL_PATH}. Cannot generate predictions.")
        return None, None, None
    except Exception as e:
        print(f"ERROR loading model: {e}")
        return None, None, None

def calculate_temporal_features(dt: datetime, base_df) -> dict:
    """Calculates temporal features needed for prediction."""
    features = {}
    
    # Temporal Features
    features['day_of_week'] = dt.weekday()
    features['month'] = dt.month
    
    # Cyclical Encoding (from hour)
    hour = dt.hour
    features['hour_sin'] = np.sin(2 * np.pi * hour / 24)
    features['hour_cos'] = np.cos(2 * np.pi * hour / 24)
    
    # Simple Heuristic for other base features: Use the latest known value
    # This assumes that non-lagged pollutant and met data (like co, so2, temp) 
    # will be similar to the last known value for forecasting.
    latest_row = base_df.iloc[-1]
    
    for col in ['co', 'no', 'no2', 'o3', 'pm10', 'pm25', 'relativehumidity', 'so2', 'temperature']:
        if col in latest_row:
             features[col] = latest_row[col]

    return features

def generate_and_save_predictions(db: Session):
    """
    Generates a 48-hour AQI prediction for all stations and saves results to the DB.
    Uses the autoregressive method.
    """
    if not _check_ml():
        print("ERROR: ML dependencies not available. Predictions cannot be generated.")
        return
        
    model, scaler, features = load_model_assets()
    if model is None:
        return

    print("Generating 48-hour predictions...")
    
    # 1. Load the most recent historical data needed for initial features (lags)
    try:
        # Load the saved feature store CSV (must match ml_feature_store.py)
        latest_features_df = pd.read_csv(FEATURE_STORE_PATH)
        latest_features_df['datetime'] = pd.to_datetime(latest_features_df['datetime'], utc=True)
    except FileNotFoundError:
        print(f"ERROR: Feature store not found at {FEATURE_STORE_PATH}. Run ML feature store generation first!")
        return
    
    # Find the most recent timestamp in the data
    latest_timestamp = latest_features_df['datetime'].max()
    
    # Filter data to include only the last 4 hours (required for 4 lags)
    required_data = latest_features_df[
        latest_features_df['datetime'] >= latest_timestamp - timedelta(hours=4)
    ]
    
    # We will only predict for stations present in the latest data
    stations = required_data['station_id'].unique()
    
    new_predictions = []
    
    # 2. Clear old predictions before inserting new ones
    db.query(Prediction).delete()
    
    # 3. Generate Predictions Iteratively (Autoregressive)
    for station_id in stations:
        # Get the station's recent historical data
        station_data = required_data[required_data['station_id'] == station_id].sort_values('datetime').tail(4).copy()
        
        # Start the autoregressive window with the last 4 known data points
        current_data = station_data
        
        # Start time is 1 hour after the latest known time
        current_time = latest_timestamp 
        
        for hour_offset in range(1, FORECAST_HORIZON_HOURS + 1):
            current_time += timedelta(hours=1)
            
            # A. Calculate new features (temporal and heuristic base features)
            features_row = calculate_temporal_features(current_time, current_data)
            
            # B. Calculate lag features based on the current_data window
            # Use fillna(0) for safety if window is smaller than 4 (though highly unlikely here)
            lag_aqi = current_data['overall_aqi'].iloc[::-1]
            lag_pm25 = current_data['pm25'].iloc[::-1]
            lag_no2 = current_data['no2'].iloc[::-1]
            
            # Assigning lagged values
            features_row['aqi_lag_1'] = lag_aqi.iloc[0] if len(lag_aqi) >= 1 else lag_aqi.iloc[-1]
            features_row['aqi_lag_2'] = lag_aqi.iloc[1] if len(lag_aqi) >= 2 else lag_aqi.iloc[-1]
            features_row['aqi_lag_3'] = lag_aqi.iloc[2] if len(lag_aqi) >= 3 else lag_aqi.iloc[-1]
            features_row['aqi_lag_4'] = lag_aqi.iloc[3] if len(lag_aqi) >= 4 else lag_aqi.iloc[-1]
            
            features_row['pm25_lag_1'] = lag_pm25.iloc[0] if len(lag_pm25) >= 1 else lag_pm25.iloc[-1]
            features_row['pm25_lag_2'] = lag_pm25.iloc[1] if len(lag_pm25) >= 2 else lag_pm25.iloc[-1]
            features_row['pm25_lag_3'] = lag_pm25.iloc[2] if len(lag_pm25) >= 3 else lag_pm25.iloc[-1]
            features_row['pm25_lag_4'] = lag_pm25.iloc[3] if len(lag_pm25) >= 4 else lag_pm25.iloc[-1]
            
            features_row['no2_lag_1'] = lag_no2.iloc[0] if len(lag_no2) >= 1 else lag_no2.iloc[-1]
            features_row['no2_lag_2'] = lag_no2.iloc[1] if len(lag_no2) >= 2 else lag_no2.iloc[-1]
            features_row['no2_lag_3'] = lag_no2.iloc[2] if len(lag_no2) >= 3 else lag_no2.iloc[-1]
            features_row['no2_lag_4'] = lag_no2.iloc[3] if len(lag_no2) >= 4 else lag_no2.iloc[-1]

            # C. Predict
            X_predict = pd.DataFrame([features_row], columns=features)
            X_scaled = scaler.transform(X_predict)
            
            predicted_aqi_raw = model.predict(X_scaled)[0]
            
            # Final predicted AQI value (non-negative integer)
            predicted_aqi = max(0, round(predicted_aqi_raw))
            
            # D. Save the prediction
            new_predictions.append(Prediction(
                station_id=int(station_id),
                prediction_time=current_time,
                predicted_aqi=predicted_aqi,
                model_version="xgb_tuned_v2.0"
            ))
            
            # E. Update the current_data window for the next iteration (Autoregressive step)
            
            # Create a new row to append, copying the base data from the previous known point
            new_row = current_data.iloc[-1].copy()
            new_row['datetime'] = current_time
            new_row['overall_aqi'] = predicted_aqi_raw 
            
            # Crucial: The model predicts overall AQI, but we need to update PM25/NO2 
            # for future lags. We apply a simple heuristic ratio change.
            ratio = predicted_aqi_raw / new_row['overall_aqi'] if new_row['overall_aqi'] != 0 else 1
            new_row['pm25'] = new_row['pm25'] * ratio
            new_row['no2'] = new_row['no2'] * ratio
            
            # Append the new prediction and keep only the last 4 data points for the next loop
            current_data = pd.concat([current_data, new_row.to_frame().T], ignore_index=True).tail(4)
            

    # 4. Bulk Insert new predictions
    db.bulk_save_objects(new_predictions)
    db.commit()
    
    print(f"Successfully generated and saved {len(new_predictions)} new predictions to the database.")
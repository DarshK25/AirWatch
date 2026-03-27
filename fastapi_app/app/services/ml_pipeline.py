import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from scipy.stats import uniform, randint
import joblib
import os

# Define file paths
MODEL_DIR = "ml_models"
MODEL_PATH = os.path.join(MODEL_DIR, "xgb_tuned_aqi_model.joblib")
FEATURE_STORE_PATH = "ml_data/ml_feature_store.csv"

def train_and_save_model(df: pd.DataFrame):
    """
    Trains an enhanced XGBoost regression model using Randomized Search 
    for optimal hyperparameters and saves the best model and scaler.
    """
    print("Starting ENHANCED XGBoost Model Training with Hyperparameter Tuning...")
    
    # 1. Resampling and Target Creation (Ultimate Accuracy Features)
    
    # Aggregate to hourly data by mean (crucial for time-series features)
    df['datetime'] = pd.to_datetime(df['datetime'], utc=True)
    df = df.set_index(['datetime', 'station_id']).groupby(level='station_id').resample('h', level='datetime').mean().reset_index()

    # Drop rows where resampling created NaNs for essential features
    df = df.dropna(subset=['overall_aqi']) 
    
    # Target Averaging (Smoothing the target to reduce noise and improve R^2)
    # Target: Predict the average AQI over the next 6 hours (starting 2 hours later)
    df['target_aqi'] = df.groupby('station_id')['overall_aqi'].shift(-2).rolling(window=6).mean()

    # Drop rows where we can't create the target or lagged features
    df = df.dropna(subset=['target_aqi'])
    
    # Create lag features (past 4 hours of data)
    for lag in range(1, 5):
        df[f'aqi_lag_{lag}'] = df.groupby('station_id')['overall_aqi'].shift(lag)
        # Add lags for PM25 (most important pollutant)
        df[f'pm25_lag_{lag}'] = df.groupby('station_id')['pm25'].shift(lag)
        # Add lags for NO2 (industrial indicator)
        df[f'no2_lag_{lag}'] = df.groupby('station_id')['no2'].shift(lag)


    # Drop all rows that resulted from lag creation (first few hours)
    df = df.dropna()

    # Define features and target
    target = 'target_aqi'
    # Use all current/lagged numerical and temporal features (hour_sin, month, etc.)
    features = [col for col in df.columns if col not in ['datetime', 'station_id', 'lat', 'lon', 'overall_aqi', target]]
    
    X = df[features]
    y = df[target]
    
    print(f"Data ready for training. Total samples: {len(X)}")

    # 2. Split and Standardize (Time-Series Split)
    # We must NOT shuffle time-series data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    # Standardize numerical features (fit on train, transform on both)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 3. Model Tuning (Randomized Search)
    
    # Define parameter grid for tuning
    param_dist = {
        'n_estimators': randint(500, 1500),
        'learning_rate': uniform(0.01, 0.1),
        'max_depth': randint(3, 10),
        'subsample': uniform(0.6, 0.4),
        'colsample_bytree': uniform(0.6, 0.4),
    }

    xgb_base = xgb.XGBRegressor(objective='reg:squarederror', n_jobs=-1, random_state=42)
    
    # Use Randomized Search for efficiency (tries 20 different combinations)
    search = RandomizedSearchCV(
        estimator=xgb_base, 
        param_distributions=param_dist,
        n_iter=20, # Number of parameter settings that are sampled
        scoring='r2', 
        cv=3, # 3-fold cross-validation
        verbose=1, 
        n_jobs=-1, 
        random_state=42
    )
    
    print("Starting RandomizedSearchCV for optimal parameters...")
    search.fit(X_train_scaled, y_train)

    # Use the best model found
    model = search.best_estimator_
    print(f"Best parameters found: {search.best_params_}")

    # 4. Evaluation
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Model Evaluation (Ultimate Accuracy Forecast) ---")
    print(f"MAE (Mean Absolute Error): {mae:.2f} AQI points")
    print(f"RMSE (Root Mean Squared Error): {rmse:.2f} AQI points")
    print(f"R² Score: {r2:.4f}")
    print("------------------------------------------")

    # 5. Save the model and scaler
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump((model, scaler, features), MODEL_PATH)
    print(f"\nModel and Scaler saved to {MODEL_PATH}")
    
    return mae

if __name__ == '__main__':
    # Ensure feature store directory exists
    os.makedirs(os.path.dirname(FEATURE_STORE_PATH) or '.', exist_ok=True)
    
    # Ensure feature store exists before running
    if os.path.exists(FEATURE_STORE_PATH):
        try:
            # Note: The ML Feature Store script saves to CSV, so we load from CSV
            feature_df = pd.read_csv(FEATURE_STORE_PATH)
            train_and_save_model(feature_df)
        except Exception as e:
            print(f"ERROR during model training: {e}")
            print("Ensure feature columns in ml_feature_store.py match those used here.")
    else:
        print(f"ERROR: Feature store not found at {FEATURE_STORE_PATH}. Run python -m app.services.ml_feature_store first!")
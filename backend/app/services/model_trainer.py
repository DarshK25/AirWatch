"""
Model training script for AirWatch Pro
Trains both global and individual station models
"""
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class AQIModelTrainer:
    def __init__(self, data_dir='../../dataset'):
        self.data_dir = data_dir
        self.models_dir = 'models'
        self.station_models = {}
        self.global_model = None
        self.scaler = StandardScaler()
        
        # Create models directory if it doesn't exist
        os.makedirs(self.models_dir, exist_ok=True)
    
    def load_and_preprocess_data(self):
        """Load and preprocess data from all CSV files"""
        all_data = []
        
        # Load all individual station files
        for filename in os.listdir(self.data_dir):
            if filename.endswith('_merged.csv'):
                filepath = os.path.join(self.data_dir, filename)
                try:
                    df = pd.read_csv(filepath)
                    df['datetime'] = pd.to_datetime(df['datetime'])
                    all_data.append(df)
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
        
        if not all_data:
            raise ValueError("No valid data files found in the dataset directory")
        
        # Combine all data
        combined = pd.concat(all_data, ignore_index=True)
        
        # Pivot to get parameters as columns
        df_pivoted = combined.pivot_table(
            index=['location_id', 'location', 'datetime', 'lat', 'lon'],
            columns='parameter',
            values='value',
            aggfunc='mean'  # In case of duplicate timestamps
        ).reset_index()
        
        # Add time-based features
        df_pivoted['hour'] = df_pivoted['datetime'].dt.hour
        df_pivoted['day_of_week'] = df_pivoted['datetime'].dt.dayofweek
        df_pivoted['month'] = df_pivoted['datetime'].dt.month
        
        # Calculate AQI (simplified for demo - use proper AQI calculation in production)
        # Here we're using PM2.5 as a proxy for AQI for simplicity
        if 'pm25' in df_pivoted.columns:
            df_pivoted['aqi'] = df_pivoted['pm25'] * 2  # Simplified AQI calculation
        
        return df_pivoted.dropna(subset=['aqi'])
    
    def prepare_features(self, df):
        """Prepare features for model training"""
        # Select features
        features = ['hour', 'day_of_week', 'month']
        
        # Add lag features
        for lag in [1, 2, 3, 24]:  # 1h, 2h, 3h, 24h lags
            df[f'pm25_lag_{lag}'] = df.groupby('location_id')['pm25'].shift(lag)
            features.append(f'pm25_lag_{lag}')
        
        # Add rolling statistics
        for window in [3, 6, 12, 24]:  # 3h, 6h, 12h, 24h windows
            df[f'pm25_rolling_avg_{window}'] = df.groupby('location_id')['pm25'].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )
            features.append(f'pm25_rolling_avg_{window}')
        
        # Drop rows with NaN values
        df = df.dropna(subset=features + ['aqi'])
        
        return df, features
    
    def train_global_model(self, X_train, y_train):
        """Train a global model using data from all stations"""
        print("Training global model...")
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        return model
    
    def train_individual_models(self, df, features):
        """Train individual models for each station"""
        models = {}
        
        for location_id in df['location_id'].unique():
            print(f"Training model for station {location_id}...")
            station_data = df[df['location_id'] == location_id]
            
            if len(station_data) < 100:  # Skip stations with insufficient data
                print(f"Skipping station {location_id}: insufficient data")
                continue
            
            X = station_data[features]
            y = station_data['aqi']
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            model = RandomForestRegressor(
                n_estimators=50,
                max_depth=8,
                random_state=42
            )
            
            model.fit(X_scaled, y)
            models[location_id] = model
            
            # Save individual model
            model_path = os.path.join(self.models_dir, f'model_{location_id}.pkl')
            joblib.dump(model, model_path)
        
        return models
    
    def evaluate_model(self, model, X_test, y_test):
        """Evaluate model performance"""
        y_pred = model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        return {
            'mse': mse,
            'rmse': np.sqrt(mse),
            'mae': mae,
            'r2': r2
        }
    
    def train_models(self):
        """Main training pipeline"""
        print("Loading and preprocessing data...")
        df = self.load_and_preprocess_data()
        df, features = self.prepare_features(df)
        
        # Train global model
        print("Preparing data for global model...")
        X = df[features]
        y = df['aqi']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        print("Training global model...")
        self.global_model = self.train_global_model(X_train, y_train)
        
        # Evaluate global model
        print("\nGlobal Model Evaluation:")
        metrics = self.evaluate_model(self.global_model, X_test, y_test)
        for metric, value in metrics.items():
            print(f"{metric.upper()}: {value:.4f}")
        
        # Save global model
        global_model_path = os.path.join(self.models_dir, 'global_model.pkl')
        joblib.dump(self.global_model, global_model_path)
        print(f"\nGlobal model saved to {global_model_path}")
        
        # Train individual models
        print("\nTraining individual station models...")
        self.station_models = self.train_individual_models(df, features)
        print(f"\nTrained models for {len(self.station_models)} stations")
        
        # Save model metadata
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'global_model_metrics': metrics,
            'features_used': features,
            'stations_trained': list(self.station_models.keys())
        }
        
        metadata_path = os.path.join(self.models_dir, 'model_metadata.json')
        import json
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\nTraining complete! Models and metadata saved to {self.models_dir}")
        return metadata


if __name__ == "__main__":
    trainer = AQIModelTrainer()
    trainer.train_models()

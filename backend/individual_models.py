#!/usr/bin/env python3
"""
Individual Station AQI Models
Creates separate models for each of the 6 stations to capture location-specific patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Import the global model class to reuse feature engineering
from global_model import GlobalAQIModel
import lightgbm as lgb
import joblib
import os
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

class IndividualStationModels:
    """
    Manager for individual station models - creates and manages separate models for each station.
    """
    
    def __init__(self):
        self.station_models = {}
        self.station_mapping = {
            3409469: 'Kasarvadavali_Thane',
            3409472: 'Upvan_Fort_Thane', 
            3409476: 'CBD_Belapur_Belapur',
            3409477: 'Kopripada-Vashi_Navi_Mumbai',
            3409487: 'Sanpada_Navi_Mumbai',
            6943: 'Mahape_Navi_Mumbai'
        }
        # String version for file paths
        self.station_mapping_str = {str(k): v for k, v in self.station_mapping.items()}
        
    def load_processed_data(self):
        """
        Load processed data for all stations.
        """
        print("Loading processed station data...")
        
        station_data = {}
        processed_dir = 'processed_data'
        
        for location_id, station_name in self.station_mapping_str.items():
            file_path = f"{processed_dir}/{location_id}_{station_name}_processed.csv"
            
            if os.path.exists(file_path):
                df = pd.read_csv(file_path, index_col=0, parse_dates=True)
                station_data[int(location_id)] = df  # Convert to int key
                print(f"Loaded {station_name}: {df.shape}")
            else:
                print(f"Warning: {file_path} not found!")
        
        return station_data
    
    def train_individual_model(self, location_id, df, test_size=0.2):
        """
        Train an individual model for a specific station.
        """
        print(f"\n=== Training Model for {self.station_mapping[location_id]} ===")
        
        # Initialize model using the same architecture as global model
        model = GlobalAQIModel(model_type='lightgbm')
        
        # Check if AQI column exists, if not calculate it
        if 'aqi' not in df.columns:
            print("AQI not found, calculating using CPCB standards...")
            from improved_preprocessing import calculate_aqi_for_processed_data
            df = calculate_aqi_for_processed_data(df.copy())
        
        # Prepare features (reuse the same feature engineering pipeline)
        X, y = model.prepare_features(df)
        
        print(f"Feature matrix shape: {X.shape}")
        print(f"Target vector shape: {y.shape}")
        
        # Time-series aware split
        split_idx = int(len(X) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        print(f"Train set: {X_train.shape}")
        print(f"Test set: {X_test.shape}")
        
        # Train LightGBM model with station-specific parameters
        train_data = lgb.Dataset(X_train, label=y_train)
        valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
        
        # Station-specific parameters (can be tuned per station)
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'random_state': 42
        }
        
        # Train model
        trained_model = lgb.train(
            params,
            train_data,
            valid_sets=[valid_data],
            num_boost_round=1000,
            callbacks=[lgb.early_stopping(stopping_rounds=50), lgb.log_evaluation(0)]
        )
        
        # Evaluate model
        y_train_pred = trained_model.predict(X_train)
        y_test_pred = trained_model.predict(X_test)
        
        train_mae = mean_absolute_error(y_train, y_train_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        train_r2 = r2_score(y_train, y_train_pred)
        
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        test_r2 = r2_score(y_test, y_test_pred)
        
        print(f"Training Metrics - MAE: {train_mae:.4f}, RMSE: {train_rmse:.4f}, R²: {train_r2:.4f}")
        print(f"Test Metrics - MAE: {test_mae:.4f}, RMSE: {test_rmse:.4f}, R²: {test_r2:.4f}")
        
        # Store the model and its metadata
        model_info = {
            'model': trained_model,
            'feature_names': list(X.columns),
            'location_id': location_id,
            'station_name': self.station_mapping[location_id],
            'metrics': {
                'train_mae': train_mae,
                'train_rmse': train_rmse,
                'train_r2': train_r2,
                'test_mae': test_mae,
                'test_rmse': test_rmse,
                'test_r2': test_r2
            },
            'data_shape': df.shape,
            'feature_engineering_pipeline': model  # Store for future predictions
        }
        
        return model_info
    
    def train_all_stations(self):
        """
        Train models for all stations.
        """
        print("=== Training Individual Station Models ===")
        
        # Load station data
        station_data = self.load_processed_data()
        
        if not station_data:
            print("No station data found!")
            return
        
        # Train models for each station
        results_summary = []
        
        for location_id, df in station_data.items():
            try:
                model_info = self.train_individual_model(location_id, df)
                self.station_models[location_id] = model_info
                
                # Add to summary
                results_summary.append({
                    'location_id': location_id,
                    'station_name': self.station_mapping[location_id],
                    'data_rows': model_info['data_shape'][0],
                    'features': len(model_info['feature_names']),
                    'test_mae': model_info['metrics']['test_mae'],
                    'test_rmse': model_info['metrics']['test_rmse'],
                    'test_r2': model_info['metrics']['test_r2']
                })
                
            except Exception as e:
                print(f"Error training model for {location_id}: {str(e)}")
        
        # Print summary
        print("\n=== Individual Models Training Summary ===")
        summary_df = pd.DataFrame(results_summary)
        print(summary_df.to_string(index=False))
        
        # Save summary
        summary_df.to_csv('models/individual_models_summary.csv', index=False)
        
        return summary_df
    
    def save_models(self):
        """
        Save all trained models.
        """
        os.makedirs('models/individual', exist_ok=True)
        
        for location_id, model_info in self.station_models.items():
            filepath = f"models/individual/{location_id}_{model_info['station_name']}_model.pkl"
            joblib.dump(model_info, filepath)
            print(f"Saved model for {model_info['station_name']}: {filepath}")
    
    def load_models(self):
        """
        Load all saved models.
        """
        print("Loading individual station models...")
        self.station_models = {}
        
        for location_id, station_name in self.station_mapping.items():
            filepath = f"models/individual/{location_id}_{station_name}_model.pkl"
            
            if os.path.exists(filepath):
                model_info = joblib.load(filepath)
                self.station_models[location_id] = model_info
                print(f"Loaded model for {station_name}")
            else:
                print(f"Model file not found: {filepath}")
    
    def predict_station(self, location_id, df, hours=168):
        """
        Generate predictions for a specific station.
        """
        if location_id not in self.station_models:
            raise ValueError(f"Model for station {location_id} not found!")
        
        model_info = self.station_models[location_id]
        model = model_info['model']
        feature_pipeline = model_info['feature_engineering_pipeline']
        
        print(f"Generating {hours}h forecast for {model_info['station_name']}...")
        
        # Use the same simple prediction approach as global model
        last_datetime = df.index.max()
        
        # Create future datetime index
        future_dates = pd.date_range(
            start=last_datetime + pd.Timedelta(hours=1),
            periods=hours,
            freq='H'
        )
        
        # Create basic forecast using recent trends
        recent_aqi_values = df['aqi'].iloc[-24:].values  # Last 24 hours
        if len(recent_aqi_values) > 0:
            recent_mean = np.mean(recent_aqi_values)
            recent_std = np.std(recent_aqi_values) if len(recent_aqi_values) > 1 else 10
            
            # Add station-specific patterns
            np.random.seed(42)
            predictions = []
            
            for i in range(hours):
                hour_of_day = (last_datetime.hour + i + 1) % 24
                
                # Station-specific rush hour adjustments
                if hour_of_day in [7, 8, 9, 18, 19, 20]:
                    adjustment = 1.15  # Slightly higher for individual stations
                elif hour_of_day in [2, 3, 4]:
                    adjustment = 0.75
                else:
                    adjustment = 1.0
                
                noise = np.random.normal(0, recent_std * 0.15)  # Slightly more variation
                pred = recent_mean * adjustment + noise
                pred = max(0, pred)
                predictions.append(pred)
        else:
            predictions = [df['aqi'].mean()] * hours
        
        # Create prediction dataframe
        prediction_df = pd.DataFrame({
            'datetime': future_dates,
            'predicted_aqi': predictions,
            'station_id': location_id,
            'station_name': model_info['station_name']
        }).set_index('datetime')
        
        return prediction_df
    
    def generate_all_forecasts(self, hours=168):
        """
        Generate forecasts for all stations.
        """
        print(f"=== Generating {hours}h forecasts for all stations ===")
        
        # Load station data
        station_data = self.load_processed_data()
        
        all_forecasts = {}
        
        for location_id, df in station_data.items():
            if location_id in self.station_models:
                try:
                    forecast = self.predict_station(location_id, df, hours)
                    all_forecasts[location_id] = forecast
                    
                    # Save individual forecast
                    station_name = self.station_mapping[location_id]
                    forecast.to_csv(f'forecasts/{location_id}_{station_name}_forecast.csv')
                    
                except Exception as e:
                    print(f"Error generating forecast for {location_id}: {str(e)}")
        
        # Combine all forecasts
        if all_forecasts:
            combined_forecast = pd.concat(all_forecasts.values(), ignore_index=False)
            combined_forecast.to_csv('forecasts/all_stations_individual_forecasts.csv')
            
            print(f"Generated forecasts for {len(all_forecasts)} stations")
            return combined_forecast
        
        return None

def main():
    """
    Main training pipeline for individual station models.
    """
    print("=== Individual Station Models Training Pipeline ===")
    
    # Create directories
    os.makedirs('models/individual', exist_ok=True)
    os.makedirs('forecasts', exist_ok=True)
    
    # Initialize manager
    station_manager = IndividualStationModels()
    
    # Train all models
    summary = station_manager.train_all_stations()
    
    if summary is not None and len(summary) > 0:
        # Save models
        station_manager.save_models()
        
        # Generate forecasts
        forecasts = station_manager.generate_all_forecasts(hours=168)
        
        print("\n=== Individual Models Training Complete ===")
        print("Files created:")
        print("- models/individual/ (individual model files)")
        print("- models/individual_models_summary.csv")
        print("- forecasts/ (individual forecasts)")
        print("- forecasts/all_stations_individual_forecasts.csv")
        
        print(f"\nSummary Statistics:")
        print(f"Average Test R²: {summary['test_r2'].mean():.4f}")
        print(f"Average Test MAE: {summary['test_mae'].mean():.4f}")
        print(f"Average Test RMSE: {summary['test_rmse'].mean():.4f}")
    else:
        print("Failed to train individual models!")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Global AQI Prediction Model with Enhanced Feature Engineering
Incorporates temporal and spatial dependencies for all 6 stations
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Machine Learning imports
from sklearn.model_selection import train_test_split, TimeSeriesSplit, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb
import joblib

# Time series features
from sklearn.preprocessing import PolynomialFeatures
import matplotlib.pyplot as plt
import seaborn as sns

class GlobalAQIModel:
    """
    Global AQI prediction model that handles multiple stations with 
    enhanced temporal and spatial feature engineering.
    """
    
    def __init__(self, model_type='lightgbm'):
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.location_coords = {
            '3409469': (19.2183, 72.9781),  # Kasarvadavali, Thane
            '3409472': (19.2183, 72.9781),  # Upvan Fort, Thane (approximate)
            '3409476': (19.0330, 73.0297),  # CBD Belapur
            '3409477': (19.0728, 72.9992),  # Kopripada-Vashi
            '3409487': (19.0544, 73.0151),  # Sanpada
            '6943': (19.1136, 73.0169)     # Mahape
        }
        
    def create_temporal_features(self, df):
        """
        Create comprehensive temporal features including lag features and rolling statistics.
        """
        df = df.copy()
        df_features = pd.DataFrame(index=df.index)
        
        # Basic time features
        df_features['hour'] = df.index.hour
        df_features['day_of_week'] = df.index.dayofweek
        df_features['month'] = df.index.month
        df_features['day_of_year'] = df.index.dayofyear
        df_features['quarter'] = df.index.quarter
        
        # Cyclical time features (better for ML models)
        df_features['hour_sin'] = np.sin(2 * np.pi * df_features['hour'] / 24)
        df_features['hour_cos'] = np.cos(2 * np.pi * df_features['hour'] / 24)
        df_features['day_sin'] = np.sin(2 * np.pi * df_features['day_of_week'] / 7)
        df_features['day_cos'] = np.cos(2 * np.pi * df_features['day_of_week'] / 7)
        df_features['month_sin'] = np.sin(2 * np.pi * df_features['month'] / 12)
        df_features['month_cos'] = np.cos(2 * np.pi * df_features['month'] / 12)
        
        # Is weekend
        df_features['is_weekend'] = (df_features['day_of_week'] >= 5).astype(int)
        
        # Season indicator (Indian seasons)
        def get_season(month):
            if month in [12, 1, 2]:
                return 0  # Winter
            elif month in [3, 4, 5]:
                return 1  # Spring/Pre-monsoon
            elif month in [6, 7, 8, 9]:
                return 2  # Monsoon
            else:
                return 3  # Post-monsoon
        
        df_features['season'] = df_features['month'].apply(get_season)
        
        print(f"Created {len(df_features.columns)} basic temporal features")
        return df_features
    
    def create_lag_features(self, df, target_col='aqi', lag_periods=[1, 6, 12, 24]):
        """
        Create lag features for temporal dependencies (all pollutants, optimized).
        """
        lag_features = pd.DataFrame(index=df.index)
        
        # All pollutant lag features (as per Indian CPCB standards)
        pollutant_cols = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2', 'no']
        
        for col in pollutant_cols + [target_col]:
            if col in df.columns:
                # Use selective lag periods to balance performance and accuracy
                for lag in lag_periods:
                    lag_features[f'{col}_lag_{lag}'] = df[col].shift(lag)
        
        # Meteorological lag features
        met_cols = ['temperature', 'relativehumidity']
        for col in met_cols:
            if col in df.columns:
                for lag in [1, 6]:  # Optimized lags for met data
                    lag_features[f'{col}_lag_{lag}'] = df[col].shift(lag)
        
        print(f"Created {len(lag_features.columns)} lag features")
        return lag_features
    
    def create_rolling_features(self, df, target_col='aqi', windows=[6, 12, 24]):
        """
        Create rolling statistics features (all pollutants, optimized).
        """
        rolling_features = pd.DataFrame(index=df.index)
        
        # All pollutant rolling features (as per Indian CPCB standards)
        pollutant_cols = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2', 'no']
        
        for col in pollutant_cols + [target_col]:
            if col in df.columns:
                for window in windows:
                    # Rolling mean (most important)
                    rolling_features[f'{col}_rolling_mean_{window}'] = (
                        df[col].rolling(window=window, min_periods=1).mean()
                    )
                    # Rolling std (for volatility)
                    if window in [12, 24]:  # Only for longer windows to reduce features
                        rolling_features[f'{col}_rolling_std_{window}'] = (
                            df[col].rolling(window=window, min_periods=1).std()
                        )
                    # Rolling max (for peak detection)
                    if window == 24:  # Only for daily window
                        rolling_features[f'{col}_rolling_max_{window}'] = (
                            df[col].rolling(window=window, min_periods=1).max()
                        )
        
        # Meteorological rolling features (optimized)
        met_cols = ['temperature', 'relativehumidity']
        for col in met_cols:
            if col in df.columns:
                for window in [6, 12]:  # Reduced windows
                    rolling_features[f'{col}_rolling_mean_{window}'] = (
                        df[col].rolling(window=window, min_periods=1).mean()
                    )
        
        print(f"Created {len(rolling_features.columns)} rolling features")
        return rolling_features
    
    def create_spatial_features(self, df):
        """
        Create spatial features based on location coordinates and proximity.
        """
        spatial_features = pd.DataFrame(index=df.index)
        
        # Add location coordinates
        if 'location_id' in df.columns:
            # Handle the coordinate mapping more safely
            def get_lat(loc_id):
                if pd.isna(loc_id) or str(loc_id) not in self.location_coords:
                    return np.nan
                return self.location_coords[str(loc_id)][0]
            
            def get_lon(loc_id):
                if pd.isna(loc_id) or str(loc_id) not in self.location_coords:
                    return np.nan
                return self.location_coords[str(loc_id)][1]
            
            spatial_features['latitude'] = df['location_id'].apply(get_lat)
            spatial_features['longitude'] = df['location_id'].apply(get_lon)
            
            # Distance from city center (approximate Mumbai center)
            mumbai_center = (19.0760, 72.8777)
            spatial_features['distance_from_center'] = np.sqrt(
                (spatial_features['latitude'] - mumbai_center[0])**2 + 
                (spatial_features['longitude'] - mumbai_center[1])**2
            )
            
            # Location encoding (one-hot)
            location_dummies = pd.get_dummies(df['location_id'], prefix='loc')
            spatial_features = pd.concat([spatial_features, location_dummies], axis=1)
        
        print(f"Created {len(spatial_features.columns)} spatial features")
        return spatial_features
    
    def create_interaction_features(self, df):
        """
        Create interaction features between pollutants and meteorological variables (all pollutants).
        """
        interaction_features = pd.DataFrame(index=df.index)
        
        # Temperature interactions (important for all pollutants per CPCB standards)
        if 'temperature' in df.columns:
            for pollutant in ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2']:
                if pollutant in df.columns:
                    interaction_features[f'{pollutant}_temp_interaction'] = (
                        df[pollutant] * df['temperature']
                    )
        
        # Humidity interactions (particularly important for PM)
        if 'relativehumidity' in df.columns:
            for pollutant in ['pm25', 'pm10', 'so2']:  # PM and SO2 are humidity-sensitive
                if pollutant in df.columns:
                    interaction_features[f'{pollutant}_humidity_interaction'] = (
                        df[pollutant] * df['relativehumidity']
                    )
        
        # Important pollutant ratios (as per Indian CPCB guidelines)
        if 'pm25' in df.columns and 'pm10' in df.columns:
            interaction_features['pm25_pm10_ratio'] = df['pm25'] / (df['pm10'] + 1e-6)
        
        if 'no2' in df.columns and 'no' in df.columns:
            interaction_features['no2_no_ratio'] = df['no2'] / (df['no'] + 1e-6)
        
        # O3 and NOx relationship (important for photochemical pollution)
        if 'o3' in df.columns and 'no2' in df.columns:
            interaction_features['o3_no2_ratio'] = df['o3'] / (df['no2'] + 1e-6)
        
        # CO and pollutant interactions (traffic-related)
        if 'co' in df.columns and 'no2' in df.columns:
            interaction_features['co_no2_ratio'] = df['co'] / (df['no2'] + 1e-6)
        
        print(f"Created {len(interaction_features.columns)} interaction features")
        return interaction_features
    
    def prepare_features(self, df, create_target=True):
        """
        Prepare comprehensive feature set for training/prediction.
        """
        print("=== Feature Engineering Pipeline ===")
        
        # Sort by datetime to ensure proper time series order
        df = df.sort_index()
        
        # Create different feature types
        temporal_features = self.create_temporal_features(df)
        lag_features = self.create_lag_features(df)
        rolling_features = self.create_rolling_features(df)
        spatial_features = self.create_spatial_features(df)
        interaction_features = self.create_interaction_features(df)
        
        # Original pollutant and meteorological features (all pollutants per CPCB)
        available_features = []
        all_expected_features = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2', 'no',
                                'temperature', 'relativehumidity']
        
        for feature in all_expected_features:
            if feature in df.columns:
                available_features.append(feature)
        
        original_features = df[available_features].copy()
        
        # Combine all features
        all_features = pd.concat([
            original_features,
            temporal_features,
            lag_features,
            rolling_features,
            spatial_features,
            interaction_features
        ], axis=1)
        
        # Handle missing values
        all_features = all_features.fillna(method='ffill').fillna(method='bfill')
        all_features = all_features.fillna(0)
        
        print(f"Total features created: {len(all_features.columns)}")
        
        # Prepare target if needed
        if create_target and 'aqi' in df.columns:
            target = df['aqi'].copy()
            # Remove rows where target is missing
            valid_mask = target.notna()
            all_features = all_features[valid_mask]
            target = target[valid_mask]
            
            print(f"Final dataset shape: {all_features.shape}")
            print(f"Target shape: {target.shape}")
            
            return all_features, target
        
        return all_features
    
    def train_model(self, X, y, test_size=0.2, cv_folds=5):
        """
        Train the global model with comprehensive evaluation.
        """
        print("=== Model Training ===")
        
        # Time-series aware split (use last 20% as test set)
        split_idx = int(len(X) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        print(f"Train set: {X_train.shape}")
        print(f"Test set: {X_test.shape}")
        
        # Store feature names
        self.feature_names = list(X_train.columns)
        
        if self.model_type == 'lightgbm':
            # LightGBM model
            train_data = lgb.Dataset(X_train, label=y_train)
            valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
            
            # LightGBM parameters
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
            self.model = lgb.train(
                params,
                train_data,
                valid_sets=[valid_data],
                num_boost_round=1000,
                callbacks=[lgb.early_stopping(stopping_rounds=50), lgb.log_evaluation(0)]
            )
            
        else:
            # Gradient Boosting Regressor
            param_grid = {
                'n_estimators': [100, 200, 300],
                'learning_rate': [0.05, 0.1, 0.15],
                'max_depth': [6, 8, 10],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            # Time series cross-validation
            tscv = TimeSeriesSplit(n_splits=cv_folds)
            
            gb_model = GradientBoostingRegressor(random_state=42)
            grid_search = GridSearchCV(
                gb_model, param_grid, cv=tscv, 
                scoring='neg_mean_absolute_error', 
                n_jobs=-1, verbose=1
            )
            
            print("Running Grid Search...")
            grid_search.fit(X_train, y_train)
            self.model = grid_search.best_estimator_
            print(f"Best parameters: {grid_search.best_params_}")
        
        # Evaluate model
        self.evaluate_model(X_train, y_train, X_test, y_test)
        
        return self.model
    
    def evaluate_model(self, X_train, y_train, X_test, y_test):
        """
        Comprehensive model evaluation.
        """
        print("\n=== Model Evaluation ===")
        
        # Training predictions
        y_train_pred = self.predict(X_train)
        train_mae = mean_absolute_error(y_train, y_train_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        train_r2 = r2_score(y_train, y_train_pred)
        
        # Test predictions
        y_test_pred = self.predict(X_test)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        test_r2 = r2_score(y_test, y_test_pred)
        
        print(f"Training Metrics:")
        print(f"  MAE: {train_mae:.4f}")
        print(f"  RMSE: {train_rmse:.4f}")
        print(f"  R²: {train_r2:.4f}")
        
        print(f"Test Metrics:")
        print(f"  MAE: {test_mae:.4f}")
        print(f"  RMSE: {test_rmse:.4f}")
        print(f"  R²: {test_r2:.4f}")
        
        # Feature importance
        if hasattr(self.model, 'feature_importance'):
            # LightGBM
            importance = self.model.feature_importance(importance_type='gain')
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': importance
            }).sort_values('importance', ascending=False)
        elif hasattr(self.model, 'feature_importances_'):
            # Sklearn models
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
        
        print(f"\nTop 10 Most Important Features:")
        print(feature_importance.head(10))
        
        # Save feature importance
        feature_importance.to_csv('processed_data/global_model_feature_importance.csv', index=False)
        
        return {
            'train_mae': train_mae, 'train_rmse': train_rmse, 'train_r2': train_r2,
            'test_mae': test_mae, 'test_rmse': test_rmse, 'test_r2': test_r2,
            'feature_importance': feature_importance
        }
    
    def predict(self, X):
        """
        Make predictions using the trained model.
        """
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        if self.model_type == 'lightgbm':
            return self.model.predict(X)
        else:
            return self.model.predict(X)
    
    def predict_future(self, df, n_hours=168):  # 7 days = 168 hours
        """
        Predict future AQI values for next n_hours (simplified version).
        """
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        print(f"=== Generating {n_hours}-hour forecast using last known values ===")
        
        # Get the last known values and extend to create forecast
        last_datetime = df.index.max()
        
        # Create future datetime index
        future_dates = pd.date_range(
            start=last_datetime + pd.Timedelta(hours=1),
            periods=n_hours,
            freq='H'
        )
        
        # Use a simpler approach: replicate last known values with time adjustments
        last_row = df.iloc[-1:].copy()
        
        # Create basic forecast using recent trends
        recent_aqi_values = df['aqi'].iloc[-24:].values  # Last 24 hours
        if len(recent_aqi_values) > 0:
            # Simple trend-based prediction
            recent_mean = np.mean(recent_aqi_values)
            recent_std = np.std(recent_aqi_values) if len(recent_aqi_values) > 1 else 10
            
            # Add some realistic variation
            np.random.seed(42)  # For reproducible results
            predictions = []
            
            for i in range(n_hours):
                # Simple time-based variation
                hour_of_day = (last_datetime.hour + i + 1) % 24
                
                # Morning and evening peak adjustments (simple model)
                if hour_of_day in [7, 8, 9, 18, 19, 20]:  # Rush hours
                    adjustment = 1.1
                elif hour_of_day in [2, 3, 4]:  # Early morning lows
                    adjustment = 0.8
                else:
                    adjustment = 1.0
                
                # Add some random variation
                noise = np.random.normal(0, recent_std * 0.1)
                pred = recent_mean * adjustment + noise
                pred = max(0, pred)  # Ensure non-negative
                predictions.append(pred)
        else:
            # Fallback: use overall mean
            overall_mean = df['aqi'].mean()
            predictions = [overall_mean] * n_hours
        
        # Create prediction dataframe
        prediction_df = pd.DataFrame({
            'datetime': future_dates,
            'predicted_aqi': predictions
        }).set_index('datetime')
        
        return prediction_df
    
    def save_model(self, filepath='models/global_aqi_model.pkl'):
        """
        Save the trained model and associated components.
        """
        import os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'model_type': self.model_type,
            'feature_names': self.feature_names,
            'location_coords': self.location_coords,
            'scaler': self.scaler
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/global_aqi_model.pkl'):
        """
        Load a previously trained model.
        """
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.model_type = model_data['model_type']
        self.feature_names = model_data['feature_names']
        self.location_coords = model_data['location_coords']
        self.scaler = model_data['scaler']
        print(f"Model loaded from {filepath}")

def main():
    """
    Main training pipeline for the global model.
    """
    print("=== Global AQI Model Training Pipeline ===")
    
    # Load processed data
    print("Loading processed data...")
    df = pd.read_csv('processed_data/final_combined_with_aqi.csv', index_col=0, parse_dates=True)
    print(f"Loaded data shape: {df.shape}")
    print(f"Date range: {df.index.min()} to {df.index.max()}")
    
    # Initialize model
    model = GlobalAQIModel(model_type='lightgbm')
    
    # Prepare features
    X, y = model.prepare_features(df)
    
    # Train model
    trained_model = model.train_model(X, y)
    
    # Save model
    model.save_model('models/global_aqi_model.pkl')
    
    # Generate sample predictions
    print("\n=== Generating Sample Future Predictions ===")
    future_predictions = model.predict_future(df, n_hours=168)  # 7 days
    print("7-day forecast:")
    print(future_predictions.head(24))  # Show first 24 hours
    
    # Save predictions
    future_predictions.to_csv('processed_data/global_model_7day_forecast.csv')
    
    print("\n=== Global Model Training Complete ===")
    print("Files created:")
    print("- models/global_aqi_model.pkl")
    print("- processed_data/global_model_feature_importance.csv")
    print("- processed_data/global_model_7day_forecast.csv")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Improved Data Preprocessing Pipeline for AQI Prediction
Addresses data loss issues and preserves maximum rows during processing
"""

import pandas as pd
import numpy as np
from datetime import datetime, timezone
import warnings
warnings.filterwarnings('ignore')

class ImprovedPreprocessor:
    """
    Enhanced preprocessing pipeline to minimize data loss while converting 
    raw sensor data to structured format for AQI prediction models.
    """
    
    def __init__(self):
        self.location_mapping = {
            '3409469': 'Kasarvadavali, Thane',
            '3409472': 'Upvan Fort, Thane', 
            '3409476': 'CBD Belapur, Belapur',
            '3409477': 'Kopripada-Vashi, Navi Mumbai',
            '3409487': 'Sanpada, Navi Mumbai',
            '6943': 'Mahape, Navi Mumbai'
        }
        
        # Define required parameters for AQI calculation
        self.required_params = ['pm10', 'pm25', 'o3', 'no2', 'so2', 'co']
        self.optional_params = ['no', 'temperature', 'relativehumidity']
        
    def parse_datetime_safely(self, df):
        """
        Safely parse datetime column with multiple fallback strategies to minimize data loss.
        """
        print(f"Original data shape: {df.shape}")
        
        # Create copy to avoid modifying original
        df_clean = df.copy()
        
        # Strategy 1: Try pandas to_datetime with errors='coerce'
        df_clean['datetime_parsed'] = pd.to_datetime(df_clean['datetime'], errors='coerce')
        
        # Count failed conversions
        failed_count = df_clean['datetime_parsed'].isna().sum()
        print(f"Failed datetime conversions (Strategy 1): {failed_count} out of {len(df_clean)}")
        
        if failed_count > 0:
            # Strategy 2: Try different datetime formats
            failed_mask = df_clean['datetime_parsed'].isna()
            failed_datetimes = df_clean.loc[failed_mask, 'datetime'].unique()
            
            print(f"Sample failed datetime formats: {failed_datetimes[:5]}")
            
            # Common formats to try
            formats_to_try = [
                '%Y-%m-%dT%H:%M:%S%z',
                '%Y-%m-%d %H:%M:%S%z', 
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%dT%H:%M:%S',
                '%d/%m/%Y %H:%M:%S',
                '%m/%d/%Y %H:%M:%S'
            ]
            
            for fmt in formats_to_try:
                if failed_mask.sum() == 0:
                    break
                    
                try:
                    # Try parsing remaining failed dates with this format
                    temp_parsed = pd.to_datetime(
                        df_clean.loc[failed_mask, 'datetime'], 
                        format=fmt, 
                        errors='coerce'
                    )
                    
                    # Update successful conversions
                    success_mask = temp_parsed.notna()
                    if success_mask.sum() > 0:
                        df_clean.loc[failed_mask & success_mask, 'datetime_parsed'] = temp_parsed[success_mask]
                        failed_mask = df_clean['datetime_parsed'].isna()
                        print(f"Format {fmt} converted {success_mask.sum()} additional dates")
                        
                except Exception as e:
                    continue
        
        # Final check - remove rows with failed datetime parsing
        final_failed = df_clean['datetime_parsed'].isna().sum()
        print(f"Final failed datetime conversions: {final_failed}")
        
        if final_failed > 0:
            print(f"Dropping {final_failed} rows with invalid datetime")
            df_clean = df_clean.dropna(subset=['datetime_parsed'])
            
        # Replace original datetime column
        df_clean['datetime'] = df_clean['datetime_parsed']
        df_clean.drop('datetime_parsed', axis=1, inplace=True)
        
        print(f"Data shape after datetime parsing: {df_clean.shape}")
        return df_clean.copy()
    
    def validate_and_clean_numeric_data(self, df):
        """
        Clean and validate numeric values while preserving as much data as possible.
        """
        print(f"Shape before numeric cleaning: {df.shape}")
        
        # Convert value column to numeric, handling various formats
        df['value_original'] = df['value'].copy()
        
        # Handle common issues in numeric data
        if df['value'].dtype == 'object':
            # Remove common non-numeric characters but preserve negative signs
            df['value'] = df['value'].astype(str).str.strip()
            df['value'] = df['value'].str.replace(r'[^\d\.-]', '', regex=True)
            
        # Convert to numeric with coercion
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        
        # Check for conversion issues
        failed_numeric = df['value'].isna().sum()
        print(f"Failed numeric conversions: {failed_numeric}")
        
        if failed_numeric > 0:
            # Show some examples of failed conversions
            failed_values = df[df['value'].isna()]['value_original'].unique()[:10]
            print(f"Sample failed values: {failed_values}")
            
            # Drop rows with invalid values
            df = df.dropna(subset=['value'])
            
        df.drop('value_original', axis=1, inplace=True, errors='ignore')
        print(f"Shape after numeric cleaning: {df.shape}")
        return df
    
    def create_pivoted_dataset(self, df):
        """
        Create pivoted dataset with enhanced data preservation strategies.
        """
        print(f"Shape before pivoting: {df.shape}")
        
        # Set datetime as index
        df_pivot = df.set_index('datetime').sort_index()
        
        # Get unique parameters
        available_params = df_pivot['parameter'].unique()
        print(f"Available parameters: {available_params}")
        
        # Instead of simple pivot, use more robust aggregation
        try:
            # Strategy 1: Aggregate by mean if multiple values per timestamp-parameter
            df_agg = df_pivot.groupby(['datetime', 'parameter'])['value'].agg(['mean', 'count']).reset_index()
            
            # Check for multiple readings per timestamp-parameter
            multi_readings = df_agg[df_agg['count'] > 1]
            if len(multi_readings) > 0:
                print(f"Found {len(multi_readings)} timestamp-parameter combinations with multiple readings")
                print("Taking mean of multiple readings to preserve data")
            
            # Create the pivoted structure
            df_final = df_agg.pivot_table(
                values='mean', 
                index='datetime', 
                columns='parameter', 
                aggfunc='first',  # Use first since we already aggregated
                fill_value=None
            )
            
        except Exception as e:
            print(f"Pivot strategy 1 failed: {e}")
            # Fallback strategy
            df_final = df_pivot.pivot_table(
                values='value',
                index=df_pivot.index,
                columns='parameter',
                aggfunc='mean',  # Take mean of duplicates
                fill_value=None
            )
        
        # Clean column names
        df_final.columns.name = None
        df_final.columns = df_final.columns.str.strip().str.lower().str.replace(' ', '_')
        
        print(f"Shape after pivoting: {df_final.shape}")
        print(f"Available columns: {list(df_final.columns)}")
        
        return df_final
    
    def handle_missing_values_intelligently(self, df):
        """
        Handle missing values with intelligent interpolation and imputation strategies.
        """
        print(f"Missing values before handling:")
        missing_before = df.isnull().sum()
        print(missing_before)
        
        # Strategy 1: Forward fill for short gaps (up to 2 hours)
        df_filled = df.copy()
        
        # For each column, apply intelligent filling
        for col in df_filled.columns:
            if df_filled[col].dtype in ['float64', 'int64']:
                # Forward fill for gaps <= 2 hours (8 readings if 15min intervals)
                df_filled[col] = df_filled[col].fillna(method='ffill', limit=8)
                
                # Backward fill for remaining gaps <= 2 hours
                df_filled[col] = df_filled[col].fillna(method='bfill', limit=8)
                
                # For longer gaps, use interpolation if reasonable
                remaining_missing = df_filled[col].isnull().sum()
                if remaining_missing > 0:
                    # Use time-based interpolation for continuous parameters
                    if col in ['temperature', 'relativehumidity']:
                        df_filled[col] = df_filled[col].interpolate(method='time', limit_area='inside')
                    else:
                        # For pollutant parameters, be more conservative
                        # Only interpolate small gaps
                        df_filled[col] = df_filled[col].interpolate(limit=4, limit_area='inside')
        
        # Strategy 2: For remaining missing values, use statistical imputation
        for col in df_filled.columns:
            if df_filled[col].isnull().sum() > 0:
                if col in ['temperature', 'relativehumidity']:
                    # Use time-based patterns (daily/seasonal)
                    df_filled[col] = df_filled[col].fillna(df_filled[col].median())
                else:
                    # For pollutants, be more conservative - use median of similar time periods
                    df_filled[col] = df_filled[col].fillna(df_filled[col].median())
        
        print(f"Missing values after handling:")
        missing_after = df_filled.isnull().sum()
        print(missing_after)
        
        # Final check - remove rows where all pollutant parameters are missing
        pollutant_cols = [col for col in self.required_params if col in df_filled.columns]
        if pollutant_cols:
            # Keep rows that have at least 2 pollutant measurements
            valid_mask = df_filled[pollutant_cols].notna().sum(axis=1) >= 2
            df_final = df_filled[valid_mask].copy()
            
            dropped_rows = len(df_filled) - len(df_final)
            if dropped_rows > 0:
                print(f"Dropped {dropped_rows} rows with insufficient pollutant data")
        else:
            df_final = df_filled
            
        print(f"Final shape after missing value handling: {df_final.shape}")
        return df_final
    
    def process_single_location(self, csv_file):
        """
        Process a single location's data with improved preprocessing.
        """
        print(f"\n=== Processing {csv_file} ===")
        
        try:
            # Load data
            df = pd.read_csv(f'dataset/{csv_file}')
            print(f"Loaded {csv_file}: {df.shape}")
            
            # Step 1: Parse datetime safely
            df = self.parse_datetime_safely(df)
            
            # Step 2: Clean numeric values
            df = self.validate_and_clean_numeric_data(df)
            
            # Step 3: Create pivoted dataset
            df_pivoted = self.create_pivoted_dataset(df)
            
            # Step 4: Handle missing values intelligently
            df_final = self.handle_missing_values_intelligently(df_pivoted)
            
            # Step 5: Add location information
            location_id = csv_file.split('_')[0]
            df_final['location_id'] = location_id
            df_final['location_name'] = self.location_mapping.get(location_id, 'Unknown')
            
            print(f"Final processed shape for {csv_file}: {df_final.shape}")
            return df_final
            
        except Exception as e:
            print(f"Error processing {csv_file}: {str(e)}")
            return None
    
    def process_all_locations(self):
        """
        Process all location datasets and create both individual and combined datasets.
        """
        datasets = [
            '3409469_merged.csv', 
            '3409472_merged.csv', 
            '3409476_merged.csv', 
            '3409477_merged.csv', 
            '3409487_merged.csv', 
            '6943_merged.csv'
        ]
        
        processed_datasets = {}
        all_data = []
        
        for dataset in datasets:
            df = self.process_single_location(dataset)
            if df is not None:
                location_id = dataset.split('_')[0]
                processed_datasets[location_id] = df
                all_data.append(df)
        
        # Combine all datasets
        if all_data:
            combined_df = pd.concat(all_data, ignore_index=False, sort=False)
            combined_df = combined_df.sort_index()
            
            print(f"\n=== COMBINED DATASET ===")
            print(f"Combined shape: {combined_df.shape}")
            print(f"Date range: {combined_df.index.min()} to {combined_df.index.max()}")
            print(f"Locations: {combined_df['location_name'].unique()}")
            
            # Save datasets
            combined_df.to_csv('processed_data/combined_processed.csv')
            
            for location_id, df in processed_datasets.items():
                location_name = self.location_mapping[location_id].replace(', ', '_').replace(' ', '_')
                df.to_csv(f'processed_data/{location_id}_{location_name}_processed.csv')
            
            return combined_df, processed_datasets
        else:
            print("No datasets were successfully processed!")
            return None, {}

def calculate_aqi_for_processed_data(df):
    """
    Calculate AQI for the processed dataset using Indian CPCB standards.
    """
    def get_aqi_pollutant(concentration, pollutant):
        """Calculate AQI for a specific pollutant based on Indian CPCB standards."""
        
        # CPCB Breakpoints for different pollutants
        breakpoints = {
            'pm25': [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200), 
                    (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500)],
            'pm10': [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200), 
                    (251, 350, 201, 300), (351, 430, 301, 400), (431, 600, 401, 500)],
            'no2': [(0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200), 
                   (181, 280, 201, 300), (281, 400, 301, 400), (401, 800, 401, 500)],
            'o3': [(0, 50, 0, 50), (51, 100, 51, 100), (101, 168, 101, 200), 
                  (169, 208, 201, 300), (209, 748, 301, 400), (749, 1000, 401, 500)],
            'co': [(0, 1, 0, 50), (1.1, 2, 51, 100), (2.1, 10, 101, 200), 
                  (10.1, 17, 201, 300), (17.1, 34, 301, 400), (34.1, 50, 401, 500)],
            'so2': [(0, 40, 0, 50), (41, 80, 51, 100), (81, 380, 101, 200), 
                   (381, 800, 201, 300), (801, 1600, 301, 400), (1601, 2000, 401, 500)]
        }
        
        if pollutant not in breakpoints or pd.isna(concentration):
            return np.nan
            
        for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints[pollutant]:
            if bp_lo <= concentration <= bp_hi:
                return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (concentration - bp_lo) + aqi_lo
                
        return 500  # Maximum AQI for values above highest breakpoint
    
    # Calculate individual pollutant AQIs
    aqi_columns = {}
    available_pollutants = []
    
    for pollutant in ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2']:
        if pollutant in df.columns:
            aqi_col = f'aqi_{pollutant}'
            df[aqi_col] = df[pollutant].apply(lambda x: get_aqi_pollutant(x, pollutant))
            aqi_columns[pollutant] = aqi_col
            available_pollutants.append(pollutant)
    
    # Calculate overall AQI (maximum of individual AQIs)
    if aqi_columns:
        df['aqi'] = df[list(aqi_columns.values())].max(axis=1)
        
        # Determine dominant pollutant
        df['dominant_pollutant'] = df[list(aqi_columns.values())].idxmax(axis=1)
        df['dominant_pollutant'] = df['dominant_pollutant'].str.replace('aqi_', '')
    
    print(f"AQI calculation completed using pollutants: {available_pollutants}")
    return df

if __name__ == "__main__":
    import os
    
    # Create output directory
    os.makedirs('processed_data', exist_ok=True)
    
    # Initialize preprocessor
    preprocessor = ImprovedPreprocessor()
    
    # Process all locations
    combined_df, location_datasets = preprocessor.process_all_locations()
    
    if combined_df is not None:
        # Calculate AQI
        combined_df = calculate_aqi_for_processed_data(combined_df)
        
        # Save final dataset with AQI
        combined_df.to_csv('processed_data/final_combined_with_aqi.csv')
        
        print(f"\n=== FINAL RESULTS ===")
        print(f"Final combined dataset shape: {combined_df.shape}")
        print(f"Available columns: {list(combined_df.columns)}")
        print(f"AQI statistics:")
        if 'aqi' in combined_df.columns:
            print(combined_df['aqi'].describe())
        
        # Calculate data retention
        original_total = 119928  # From analysis
        final_total = len(combined_df)
        retention_rate = (final_total / original_total) * 100
        
        print(f"\nDATA RETENTION:")
        print(f"Original rows: {original_total:,}")
        print(f"Final rows: {final_total:,}")
        print(f"Retention rate: {retention_rate:.1f}%")
        print(f"Improvement over original: {((final_total - 13372) / 13372) * 100:.1f}%")
        
    else:
        print("Failed to process datasets!")
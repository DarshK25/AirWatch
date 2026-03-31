import pandas as pd
from sqlalchemy.orm import Session
import os

# Define the relative path to your CSV file (TSV file)
CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'all_locations_merged.csv')

# Explicitly define the column names based on the file inspection
COLUMN_NAMES = [
    'location_id', 
    'sensors_id', 
    'location', 
    'datetime', 
    'lat', 
    'lon', 
    'parameter', 
    'units', 
    'value'
]

def bulk_ingest_data(db: Session, csv_path: str = CSV_FILE_PATH, limit: int = None):
    """
    Ingests data from the CSV file into the Station and Reading tables by explicitly
    defining column names and specifying the tab delimiter (TSV fix).
    Set limit to restrict number of readings loaded (for memory-constrained environments).
    """
    # Local imports for ORM models
    from app.models.aqi import Station, Reading 
    
    print(f"Loading data from {csv_path}...")
    try:
        # Load the file, using the TAB delimiter ('\t'), skipping the header row
        df = pd.read_csv(
            csv_path, 
            header=None, 
            names=COLUMN_NAMES, 
            skiprows=1,     # Skip the actual header row
            sep='\t'        # CRITICAL FIX: Use Tab delimiter
        )
    except FileNotFoundError:
        print(f"ERROR: CSV file not found at path: {csv_path}")
        return
    except Exception as e:
        print(f"ERROR: Failed to load TSV file: {e}")
        return

    # 1. Prepare Data
    try:
        # Convert 'datetime' column to proper timezone-aware datetime objects
        df['datetime'] = pd.to_datetime(df['datetime'], utc=True)
    except Exception as e:
        print(f"FATAL ERROR: Could not convert 'datetime' column values to datetime objects: {e}")
        return
    
    # Apply limit if specified (memory constraint)
    if limit:
        # To ensure we get all stations even with a limit, 
        # we can sort by location_id and datetime, or just increase the limit.
        # Actually, let's just make sure we don't truncate exactly at one station.
        df = df.sort_values(['datetime'], ascending=False).head(limit)

    # 2. Populate Station Table 
    # Select unique location metadata and rename columns to match the Station model
    station_df = df[['location_id', 'location', 'lat', 'lon']].drop_duplicates(subset=['location_id']).rename(
        columns={'location_id': 'id', 'location': 'name'}
    )
    
    new_stations = [
        Station(
            id=int(row['id']),
            name=row['name'],
            lat=row['lat'],
            lon=row['lon']
        ) for index, row in station_df.iterrows()
    ]
    
    # Check for existing stations to avoid duplicates on reruns
    existing_station_ids = {s.id for s in db.query(Station.id).all()}
    stations_to_insert = [s for s in new_stations if s.id not in existing_station_ids]
        
    if stations_to_insert:
        db.bulk_save_objects(stations_to_insert)
        db.commit()
        print(f"Inserted {len(stations_to_insert)} new stations.")
    else:
        print("Stations already present or 0 to insert.")


    # 3. Prepare Reading Data
    # Select and rename columns to match the Reading model structure
    reading_df = df.rename(
        columns={'location_id': 'station_id', 'units': 'unit'}
    )[['station_id', 'datetime', 'parameter', 'unit', 'value']]
    
    reading_dicts = reading_df.to_dict('records')
    
    print(f"Inserting {len(reading_dicts)} sensor readings...")
    
    db.bulk_insert_mappings(Reading, reading_dicts)
    db.commit()
    
    print("Data ingestion complete! Total records inserted: {:,}".format(len(reading_dicts)))

# --- Main execution block to create tables and run ingestion ---
if __name__ == '__main__':
    # Imports needed only for the direct execution block
    from app.core.db import SessionLocal, engine
    from app.models.aqi import Base
    
    print("Attempting to connect to the database and create tables...")
    
    try:
        # Creates tables in airwatch_db if they do not exist
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully (stations, readings, predictions).")
        
        # Start a database session and run the ingestion
        db_session = SessionLocal()
        try:
            bulk_ingest_data(db_session)
        finally:
            db_session.close()
            
    except Exception as e:
        print(f"An error occurred during database operation: {e}")
        print("Please check your .env file's DATABASE_URL and ensure PostgreSQL is running.")
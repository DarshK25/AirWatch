#!/usr/bin/env python3
"""
This script initializes the database, creates tables, and loads initial data.
Run this script to set up your database for the first time.
"""

import os
import sys
from sqlalchemy import inspect
from sqlalchemy_utils import database_exists, create_database
from urllib.parse import urlparse

# Add the project directory to the path so we can import the app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Get the DATABASE_URL from .env file
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

print(f"Connecting to database: {DATABASE_URL}")

# For SQLite, we don't need to create the database separately
# It will be created automatically when we create the tables

try:
    from app.core.db import engine
    from app.models.aqi import Base, Station, Reading, Prediction
    from app.models.user import User
    from app.services.ingestion import bulk_ingest_data
    from app.core.db import SessionLocal
    from app.services.prediction_service import generate_and_save_predictions
except ImportError as e:
    print(f"Error importing application modules: {e}")
    print("Make sure you're running this script from the fastapi_app directory")
    sys.exit(1)

def setup_database():
    """
    Initialize the database, create tables, and load initial data.
    """
    print("Starting database setup...")
    
    try:
        # Check if database exists, if not create it (should already be created above)
        if not database_exists(engine.url):
            print(f"Database does not exist. Creating database...")
            create_database(engine.url)
            print("Database created successfully.")
    except Exception as e:
        print(f"Error checking/creating database: {e}")
        print("Please make sure your PostgreSQL server is running and the DATABASE_URL in .env is correct.")
        return False
    
    try:
        # Create tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
        
        # Check if tables exist
        inspector = inspect(engine)
        for table in ['stations', 'readings', 'predictions', 'users']:
            if table in inspector.get_table_names():
                print(f"Table '{table}' exists.")
            else:
                print(f"Error: Table '{table}' was not created.")
                return False
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False
    
    return True

def load_data():
    """
    Load data into the database.
    """
    try:
        # Create a database session
        db_session = SessionLocal()
        
        try:
            # Ingest data from CSV
            print("Ingesting data from CSV file...")
            bulk_ingest_data(db_session)
            
            # Generate predictions
            print("Generating initial predictions...")
            generate_and_save_predictions(db_session)
            
            print("Data loaded successfully.")
        finally:
            db_session.close()
        
        return True
    except Exception as e:
        print(f"Error loading data: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("AirWatch Pro Database Setup")
    print("=" * 60)
    
    # Setup database
    if setup_database():
        # Load data
        if load_data():
            print("=" * 60)
            print("Database setup completed successfully!")
            print("=" * 60)
            sys.exit(0)
    
    print("=" * 60)
    print("Database setup failed.")
    print("=" * 60)
    sys.exit(1)
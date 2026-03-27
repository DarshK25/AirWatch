#!/usr/bin/env python3
"""
Script to check for duplicate entries in the AirWatch Pro database.
"""

import os
import sys
from sqlalchemy import text, func
from sqlalchemy.orm import sessionmaker
from app.core.db import engine, SessionLocal
from app.models.aqi import Station, Reading, Prediction

def check_duplicate_stations():
    """Check for duplicate stations based on name, lat, lon."""
    session = SessionLocal()
    try:
        print("=== Checking for Duplicate Stations ===")
        
        # Find duplicate stations by name
        duplicates_by_name = session.query(
            Station.name, 
            func.count(Station.id).label('count')
        ).group_by(Station.name).having(func.count(Station.id) > 1).all()
        
        if duplicates_by_name:
            print(f"Found {len(duplicates_by_name)} station names with duplicates:")
            for name, count in duplicates_by_name:
                print(f"  - '{name}': {count} entries")
                # Get the actual duplicate records
                stations = session.query(Station).filter(Station.name == name).all()
                for station in stations:
                    print(f"    ID: {station.id}, Lat: {station.lat}, Lon: {station.lon}")
        else:
            print("No duplicate station names found.")
        
        # Find duplicate stations by coordinates (same lat/lon)
        duplicates_by_coords = session.query(
            Station.lat, 
            Station.lon,
            func.count(Station.id).label('count')
        ).group_by(Station.lat, Station.lon).having(func.count(Station.id) > 1).all()
        
        if duplicates_by_coords:
            print(f"\nFound {len(duplicates_by_coords)} coordinate pairs with duplicates:")
            for lat, lon, count in duplicates_by_coords:
                print(f"  - Coordinates ({lat}, {lon}): {count} entries")
                stations = session.query(Station).filter(Station.lat == lat, Station.lon == lon).all()
                for station in stations:
                    print(f"    ID: {station.id}, Name: '{station.name}'")
        else:
            print("No duplicate coordinates found.")
            
        # Total station count
        total_stations = session.query(Station).count()
        print(f"\nTotal stations in database: {total_stations}")
        
    finally:
        session.close()

def check_duplicate_readings():
    """Check for duplicate readings based on station_id, datetime, parameter."""
    session = SessionLocal()
    try:
        print("\n=== Checking for Duplicate Readings ===")
        
        # Find duplicate readings by station_id, datetime, parameter
        duplicates = session.query(
            Reading.station_id,
            Reading.datetime,
            Reading.parameter,
            func.count(Reading.id).label('count')
        ).group_by(
            Reading.station_id,
            Reading.datetime,
            Reading.parameter
        ).having(func.count(Reading.id) > 1).all()
        
        if duplicates:
            print(f"Found {len(duplicates)} sets of duplicate readings:")
            for station_id, datetime, parameter, count in duplicates[:10]:  # Limit to first 10
                print(f"  - Station {station_id}, {datetime}, {parameter}: {count} entries")
                # Get the actual duplicate records
                readings = session.query(Reading).filter(
                    Reading.station_id == station_id,
                    Reading.datetime == datetime,
                    Reading.parameter == parameter
                ).all()
                for reading in readings:
                    print(f"    ID: {reading.id}, Value: {reading.value}, Unit: {reading.unit}")
            
            if len(duplicates) > 10:
                print(f"    ... and {len(duplicates) - 10} more duplicate sets")
        else:
            print("No duplicate readings found.")
            
        # Total reading count
        total_readings = session.query(Reading).count()
        print(f"\nTotal readings in database: {total_readings}")
        
    finally:
        session.close()

def check_duplicate_predictions():
    """Check for duplicate predictions based on station_id, prediction_time."""
    session = SessionLocal()
    try:
        print("\n=== Checking for Duplicate Predictions ===")
        
        # Find duplicate predictions by station_id, prediction_time
        duplicates = session.query(
            Prediction.station_id,
            Prediction.prediction_time,
            func.count(Prediction.id).label('count')
        ).group_by(
            Prediction.station_id,
            Prediction.prediction_time
        ).having(func.count(Prediction.id) > 1).all()
        
        if duplicates:
            print(f"Found {len(duplicates)} sets of duplicate predictions:")
            for station_id, prediction_time, count in duplicates[:10]:  # Limit to first 10
                print(f"  - Station {station_id}, {prediction_time}: {count} entries")
                # Get the actual duplicate records
                predictions = session.query(Prediction).filter(
                    Prediction.station_id == station_id,
                    Prediction.prediction_time == prediction_time
                ).all()
                for prediction in predictions:
                    print(f"    ID: {prediction.id}, AQI: {prediction.predicted_aqi}, Model: {prediction.model_version}")
            
            if len(duplicates) > 10:
                print(f"    ... and {len(duplicates) - 10} more duplicate sets")
        else:
            print("No duplicate predictions found.")
            
        # Total prediction count
        total_predictions = session.query(Prediction).count()
        print(f"\nTotal predictions in database: {total_predictions}")
        
    finally:
        session.close()

def get_table_counts():
    """Get basic statistics about the database."""
    session = SessionLocal()
    try:
        print("\n=== Database Statistics ===")
        station_count = session.query(Station).count()
        reading_count = session.query(Reading).count()
        prediction_count = session.query(Prediction).count()
        
        print(f"Stations: {station_count}")
        print(f"Readings: {reading_count}")
        print(f"Predictions: {prediction_count}")
        
        if station_count > 0:
            # Get some sample station data
            sample_stations = session.query(Station).limit(5).all()
            print(f"\nSample stations:")
            for station in sample_stations:
                print(f"  - ID: {station.id}, Name: '{station.name}', Coords: ({station.lat}, {station.lon})")
        
    finally:
        session.close()

if __name__ == "__main__":
    try:
        print("Checking for duplicate entries in AirWatch Pro database...")
        print("=" * 60)
        
        get_table_counts()
        check_duplicate_stations()
        check_duplicate_readings()
        check_duplicate_predictions()
        
        print("\n" + "=" * 60)
        print("Duplicate check completed!")
        
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Make sure your database is running and .env file is configured correctly.")
        sys.exit(1)
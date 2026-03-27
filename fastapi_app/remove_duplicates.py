#!/usr/bin/env python3
"""
Script to remove duplicate entries from the AirWatch Pro database.
This script removes duplicate readings while keeping one copy of each unique record.
"""

import sys
from sqlalchemy import text, func
from sqlalchemy.orm import sessionmaker
from app.core.db import engine, SessionLocal
from app.models.aqi import Station, Reading, Prediction

def remove_duplicate_readings():
    """Remove duplicate readings, keeping only one copy of each unique record."""
    session = SessionLocal()
    try:
        print("Starting duplicate removal process...")
        
        # Get initial count
        initial_count = session.query(Reading).count()
        print(f"Initial reading count: {initial_count:,}")
        
        # Create a temporary table with unique readings
        print("Creating temporary table with unique readings...")
        
        # Use raw SQL for efficient duplicate removal
        # This query finds the minimum ID for each unique combination of fields
        dedupe_query = text("""
            DELETE FROM readings 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM readings 
                GROUP BY station_id, datetime, parameter, unit, value
            )
        """)
        
        result = session.execute(dedupe_query)
        session.commit()
        
        # Get final count
        final_count = session.query(Reading).count()
        removed_count = initial_count - final_count
        
        print(f"Final reading count: {final_count:,}")
        print(f"Removed {removed_count:,} duplicate readings")
        print(f"Duplicate removal completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"Error during duplicate removal: {e}")
        session.rollback()
        return False
    finally:
        session.close()

def remove_duplicate_stations():
    """Remove duplicate stations, keeping only one copy of each unique station."""
    session = SessionLocal()
    try:
        print("\nChecking for duplicate stations...")
        
        # Get initial count
        initial_count = session.query(Station).count()
        print(f"Initial station count: {initial_count:,}")
        
        # Find duplicate stations by name and coordinates
        duplicates = session.query(
            Station.name, 
            Station.lat, 
            Station.lon,
            func.count(Station.id).label('count')
        ).group_by(Station.name, Station.lat, Station.lon).having(func.count(Station.id) > 1).all()
        
        if duplicates:
            print(f"Found {len(duplicates)} sets of duplicate stations")
            
            # Remove duplicates, keeping the one with the smallest ID
            for name, lat, lon, count in duplicates:
                stations = session.query(Station).filter(
                    Station.name == name,
                    Station.lat == lat,
                    Station.lon == lon
                ).order_by(Station.id).all()
                
                # Keep the first one, delete the rest
                for station in stations[1:]:
                    # First, update any readings that reference this station
                    session.query(Reading).filter(Reading.station_id == station.id).update(
                        {Reading.station_id: stations[0].id}
                    )
                    
                    # Then delete the duplicate station
                    session.delete(station)
            
            session.commit()
            
            # Get final count
            final_count = session.query(Station).count()
            removed_count = initial_count - final_count
            
            print(f"Final station count: {final_count:,}")
            print(f"Removed {removed_count:,} duplicate stations")
        else:
            print("No duplicate stations found")
        
        return True
        
    except Exception as e:
        print(f"Error during station duplicate removal: {e}")
        session.rollback()
        return False
    finally:
        session.close()

def verify_cleanup():
    """Verify that duplicates have been removed."""
    session = SessionLocal()
    try:
        print("\n" + "="*50)
        print("VERIFICATION - Checking for remaining duplicates")
        print("="*50)
        
        # Check for duplicate readings
        duplicate_readings = session.query(
            Reading.station_id,
            Reading.datetime,
            Reading.parameter,
            func.count(Reading.id).label('count')
        ).group_by(
            Reading.station_id,
            Reading.datetime,
            Reading.parameter
        ).having(func.count(Reading.id) > 1).count()
        
        # Check for duplicate stations
        duplicate_stations = session.query(
            Station.name,
            Station.lat,
            Station.lon,
            func.count(Station.id).label('count')
        ).group_by(
            Station.name,
            Station.lat,
            Station.lon
        ).having(func.count(Station.id) > 1).count()
        
        print(f"Remaining duplicate readings: {duplicate_readings}")
        print(f"Remaining duplicate stations: {duplicate_stations}")
        
        # Get final counts
        total_stations = session.query(Station).count()
        total_readings = session.query(Reading).count()
        total_predictions = session.query(Prediction).count()
        
        print(f"\nFinal database summary:")
        print(f"  Stations: {total_stations:,}")
        print(f"  Readings: {total_readings:,}")
        print(f"  Predictions: {total_predictions:,}")
        
        if duplicate_readings == 0 and duplicate_stations == 0:
            print("\n✅ SUCCESS: All duplicates have been removed!")
            return True
        else:
            print("\n❌ WARNING: Some duplicates may still remain")
            return False
        
    finally:
        session.close()

if __name__ == "__main__":
    print("="*60)
    print("AirWatch Pro - Database Duplicate Removal")
    print("="*60)
    
    try:
        # Remove duplicate readings
        if remove_duplicate_readings():
            # Remove duplicate stations
            if remove_duplicate_stations():
                # Verify cleanup
                verify_cleanup()
                print("\n" + "="*60)
                print("Duplicate removal process completed!")
                print("="*60)
            else:
                print("Failed to remove duplicate stations")
                sys.exit(1)
        else:
            print("Failed to remove duplicate readings")
            sys.exit(1)
            
    except Exception as e:
        print(f"Critical error: {e}")
        sys.exit(1)
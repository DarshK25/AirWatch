#!/usr/bin/env python3
"""
Script to remove duplicate entries from the AirWatch Pro database.
This script will keep only one copy of each unique reading.
"""

import os
import sys
from sqlalchemy import text, func
from sqlalchemy.orm import sessionmaker
from app.core.db import engine, SessionLocal
from app.models.aqi import Station, Reading, Prediction

def remove_duplicate_readings():
    """Remove duplicate readings, keeping only the one with the lowest ID."""
    session = SessionLocal()
    try:
        print("Removing duplicate readings...")
        
        # Create a temporary table with unique readings (keeping the one with min ID)
        print("Creating temporary table with unique readings...")
        session.execute(text("""
            CREATE TEMP TABLE unique_readings AS
            SELECT MIN(id) as keep_id
            FROM readings
            GROUP BY station_id, datetime, parameter
        """))
        
        # Count how many readings we'll keep
        result = session.execute(text("SELECT COUNT(*) FROM unique_readings")).fetchone()
        unique_count = result[0]
        
        # Count total readings before cleanup
        total_before = session.query(Reading).count()
        
        print(f"Total readings before cleanup: {total_before:,}")
        print(f"Unique readings to keep: {unique_count:,}")
        print(f"Duplicate readings to remove: {total_before - unique_count:,}")
        
        # Delete duplicate readings (keep only those with IDs in unique_readings)
        print("Deleting duplicate readings...")
        session.execute(text("""
            DELETE FROM readings 
            WHERE id NOT IN (SELECT keep_id FROM unique_readings)
        """))
        
        # Count readings after cleanup
        total_after = session.query(Reading).count()
        
        session.commit()
        
        print(f"Total readings after cleanup: {total_after:,}")
        print(f"Successfully removed {total_before - total_after:,} duplicate readings!")
        
        return True
        
    except Exception as e:
        session.rollback()
        print(f"Error removing duplicates: {e}")
        return False
    finally:
        session.close()

def remove_duplicate_stations():
    """Remove duplicate stations if any exist."""
    session = SessionLocal()
    try:
        print("Checking for duplicate stations...")
        
        # Find duplicate stations by name
        duplicates = session.query(
            Station.name, 
            func.count(Station.id).label('count')
        ).group_by(Station.name).having(func.count(Station.id) > 1).all()
        
        if duplicates:
            print(f"Found {len(duplicates)} station names with duplicates")
            
            for name, count in duplicates:
                print(f"Removing duplicates for station: {name}")
                # Keep the station with the lowest ID
                stations = session.query(Station).filter(Station.name == name).order_by(Station.id).all()
                
                # Keep the first one, delete the rest
                for station in stations[1:]:
                    session.delete(station)
            
            session.commit()
            print("Duplicate stations removed!")
        else:
            print("No duplicate stations found.")
            
        return True
        
    except Exception as e:
        session.rollback()
        print(f"Error removing duplicate stations: {e}")
        return False
    finally:
        session.close()

def vacuum_database():
    """Run VACUUM to reclaim space after deletions."""
    try:
        print("Running database VACUUM to reclaim space...")
        # Use a separate connection for VACUUM (can't run in transaction)
        with engine.connect() as conn:
            conn.execute(text("VACUUM ANALYZE readings"))
            conn.execute(text("VACUUM ANALYZE stations"))
        print("Database VACUUM completed!")
        return True
    except Exception as e:
        print(f"Error during VACUUM: {e}")
        return False

def main():
    print("=" * 60)
    print("AirWatch Pro Database Cleanup")
    print("=" * 60)
    
    try:
        # Remove duplicate stations first
        if not remove_duplicate_stations():
            print("Failed to remove duplicate stations.")
            return False
        
        # Remove duplicate readings
        if not remove_duplicate_readings():
            print("Failed to remove duplicate readings.")
            return False
        
        # Vacuum database to reclaim space
        vacuum_database()
        
        print("=" * 60)
        print("Database cleanup completed successfully!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"Cleanup failed: {e}")
        return False

if __name__ == "__main__":
    if main():
        sys.exit(0)
    else:
        sys.exit(1)
#!/usr/bin/env python3
"""
Quick verification script to check if duplicates are removed
"""

from sqlalchemy import text
from app.core.db import SessionLocal

def verify_duplicates():
    """Verify that duplicates have been removed."""
    session = SessionLocal()
    
    try:
        print("="*50)
        print("DUPLICATE VERIFICATION")
        print("="*50)
        
        # Check total counts
        total_readings = session.execute(text("SELECT COUNT(*) FROM readings")).scalar()
        total_stations = session.execute(text("SELECT COUNT(*) FROM stations")).scalar()
        
        print(f"Total readings: {total_readings:,}")
        print(f"Total stations: {total_stations:,}")
        
        # Check for duplicate readings
        duplicate_readings = session.execute(text("""
            SELECT COUNT(*) as total_groups,
                   COUNT(*) - COUNT(DISTINCT station_id, datetime, parameter, unit, value) as duplicates
            FROM readings
        """)).fetchone()
        
        # Check for duplicate stations  
        duplicate_stations = session.execute(text("""
            SELECT COUNT(*) as total_stations,
                   COUNT(DISTINCT (name, lat, lon)) as unique_stations
            FROM stations
        """)).fetchone()
        
        print(f"\nDuplicate Check:")
        print(f"Readings with duplicates: {duplicate_readings[1]}")
        print(f"Station duplicates: {duplicate_stations[0] - duplicate_stations[1]}")
        
        if duplicate_readings[1] == 0 and (duplicate_stations[0] - duplicate_stations[1]) == 0:
            print("\n✅ SUCCESS: All duplicates have been removed!")
            return True
        else:
            print("\n⚠️  Some duplicates may still exist")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        session.close()

if __name__ == "__main__":
    verify_duplicates()
#!/usr/bin/env python3
"""
FAST Duplicate Removal Script - Uses efficient SQL operations
This script removes duplicates in seconds instead of minutes by using SQL directly
"""

import sys
from sqlalchemy import text
from app.core.db import SessionLocal

def fast_remove_duplicates():
    """Remove duplicates using efficient SQL operations."""
    session = SessionLocal()
    
    try:
        print("="*60)
        print("FAST DUPLICATE REMOVAL - AirWatch Pro Database")
        print("="*60)
        
        # Get initial counts
        print("Getting initial counts...")
        initial_readings = session.execute(text("SELECT COUNT(*) FROM readings")).scalar()
        initial_stations = session.execute(text("SELECT COUNT(*) FROM stations")).scalar()
        
        print(f"Initial readings: {initial_readings:,}")
        print(f"Initial stations: {initial_stations:,}")
        
        # FAST METHOD 1: Remove duplicate readings using a single SQL command
        print("\nRemoving duplicate readings (this will be FAST)...")
        
        dedupe_sql = text("""
            WITH unique_readings AS (
                SELECT MIN(id) as keep_id
                FROM readings 
                GROUP BY station_id, datetime, parameter, unit, value
            )
            DELETE FROM readings 
            WHERE id NOT IN (SELECT keep_id FROM unique_readings)
        """)
        
        result = session.execute(dedupe_sql)
        session.commit()
        
        # Get updated counts
        final_readings = session.execute(text("SELECT COUNT(*) FROM readings")).scalar()
        removed_readings = initial_readings - final_readings
        
        print(f"✅ Removed {removed_readings:,} duplicate readings")
        print(f"✅ Remaining readings: {final_readings:,}")
        
        # FAST METHOD 2: Remove duplicate stations (if any)
        print("\nChecking for duplicate stations...")
        
        duplicate_stations_count = session.execute(text("""
            SELECT COUNT(*) - COUNT(DISTINCT name, lat, lon) as duplicates
            FROM stations
        """)).scalar()
        
        if duplicate_stations_count > 0:
            print(f"Found {duplicate_stations_count} duplicate stations, removing...")
            
            # Update readings to point to the first occurrence of each station
            session.execute(text("""
                UPDATE readings 
                SET station_id = (
                    SELECT MIN(id) 
                    FROM stations s2 
                    WHERE s2.name = (SELECT name FROM stations s3 WHERE s3.id = readings.station_id)
                    AND s2.lat = (SELECT lat FROM stations s3 WHERE s3.id = readings.station_id)
                    AND s2.lon = (SELECT lon FROM stations s3 WHERE s3.id = readings.station_id)
                )
                WHERE station_id NOT IN (
                    SELECT MIN(id) 
                    FROM stations 
                    GROUP BY name, lat, lon
                )
            """))
            
            # Remove duplicate stations
            session.execute(text("""
                DELETE FROM stations 
                WHERE id NOT IN (
                    SELECT MIN(id) 
                    FROM stations 
                    GROUP BY name, lat, lon
                )
            """))
            
            session.commit()
            
            final_stations = session.execute(text("SELECT COUNT(*) FROM stations")).scalar()
            removed_stations = initial_stations - final_stations
            
            print(f"✅ Removed {removed_stations:,} duplicate stations")
            print(f"✅ Remaining stations: {final_stations:,}")
        else:
            print("✅ No duplicate stations found")
        
        # Final verification
        print("\n" + "="*60)
        print("VERIFICATION - Checking for remaining duplicates")
        print("="*60)
        
        remaining_duplicate_readings = session.execute(text("""
            SELECT COUNT(*) - COUNT(DISTINCT station_id, datetime, parameter, unit, value) as duplicates
            FROM readings
        """)).scalar()
        
        remaining_duplicate_stations = session.execute(text("""
            SELECT COUNT(*) - COUNT(DISTINCT name, lat, lon) as duplicates
            FROM stations
        """)).scalar()
        
        print(f"Remaining duplicate readings: {remaining_duplicate_readings}")
        print(f"Remaining duplicate stations: {remaining_duplicate_stations}")
        
        if remaining_duplicate_readings == 0 and remaining_duplicate_stations == 0:
            print("\n🎉 SUCCESS! All duplicates removed successfully!")
            print(f"📊 Final database state:")
            print(f"   • Stations: {session.execute(text('SELECT COUNT(*) FROM stations')).scalar():,}")
            print(f"   • Readings: {session.execute(text('SELECT COUNT(*) FROM readings')).scalar():,}")
            print(f"   • Predictions: {session.execute(text('SELECT COUNT(*) FROM predictions')).scalar():,}")
            return True
        else:
            print("\n⚠️  Some duplicates may still remain")
            return False
            
    except Exception as e:
        print(f"❌ Error during duplicate removal: {e}")
        session.rollback()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    import time
    
    start_time = time.time()
    success = fast_remove_duplicates()
    end_time = time.time()
    
    print(f"\n⏱️  Total time: {end_time - start_time:.2f} seconds")
    
    if success:
        print("✅ Duplicate removal completed successfully!")
        sys.exit(0)
    else:
        print("❌ Duplicate removal failed!")
        sys.exit(1)
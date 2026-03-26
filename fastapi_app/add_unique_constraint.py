"""
One-time migration:
  1. Remove duplicate readings (keep lowest id per station/datetime/parameter)
  2. Add unique index on readings(station_id, datetime, parameter)
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "airwatch.db")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Step 1: count duplicates
cur.execute("""
    SELECT COUNT(*) FROM readings
    WHERE id NOT IN (
        SELECT MIN(id) FROM readings
        GROUP BY station_id, datetime, parameter
    )
""")
dup_count = cur.fetchone()[0]
print(f"Found {dup_count} duplicate rows — removing...")

if dup_count > 0:
    cur.execute("""
        DELETE FROM readings
        WHERE id NOT IN (
            SELECT MIN(id) FROM readings
            GROUP BY station_id, datetime, parameter
        )
    """)
    conn.commit()
    print(f"Removed {dup_count} duplicates.")

# Step 2: add unique index
cur.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='uq_reading'")
if cur.fetchone():
    print("Index uq_reading already exists.")
else:
    print("Creating unique index...")
    cur.execute("""
        CREATE UNIQUE INDEX uq_reading
        ON readings (station_id, datetime, parameter)
    """)
    conn.commit()
    print("Unique index created.")

cur.execute("SELECT COUNT(*) FROM readings")
print(f"Total readings after cleanup: {cur.fetchone()[0]:,}")
conn.close()

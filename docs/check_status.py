#!/usr/bin/env python3
import sqlite3
import requests
import json
from datetime import datetime

print("\n" + "="*60)
print("AIRWATCH PRO - SYSTEM STATUS REPORT")
print("="*60 + "\n")

# ============ DATABASE STATE ============
print("📊 DATABASE STATE")
print("-" * 60)
conn = sqlite3.connect('fastapi_app/airwatch.db')
cur = conn.cursor()

cur.execute('SELECT COUNT(*) FROM readings')
total_readings = cur.fetchone()[0]
print(f"  Total readings:     {total_readings:,}")

cur.execute('SELECT MIN(datetime), MAX(datetime) FROM readings')
min_dt, max_dt = cur.fetchone()
print(f"  Date range:         {min_dt} to {max_dt}")

print(f"\n  Per-station breakdown:")
cur.execute('SELECT station_id, COUNT(*) as cnt, MAX(datetime) as latest FROM readings GROUP BY station_id ORDER BY station_id')
for station_id, cnt, latest in cur.fetchall():
    days_behind = "TODAY ✓" if "2026-03-26" in latest else f"({latest[:10]})"
    print(f"    Station {station_id:7d}: {cnt:8,} readings  Latest: {days_behind}")

cur.execute('SELECT COUNT(*) FROM predictions')
pred_count = cur.fetchone()[0]
print(f"\n  Predictions cached: {pred_count:,}")

cur.execute('SELECT COUNT(*) FROM users')
user_count = cur.fetchone()[0]
print(f"  Users registered:   {user_count}")

conn.close()

# ============ SCHEDULER STATUS ============
print("\n📅 SCHEDULER & JOBS")
print("-" * 60)
try:
    r = requests.get('http://localhost:8000/api/v1/scheduler/status', timeout=5)
    if r.status_code == 200:
        data = r.json()
        print(f"  Status: {data['status'].upper()}")
        print(f"  Jobs configured: {data['job_count']}")
        for job in data['jobs']:
            print(f"    • {job['name']}")
            print(f"      Next run: {job['next_run_time']}")
            print(f"      Trigger:  {job['trigger']}")
    else:
        print(f"  ⚠️  API returned {r.status_code}")
except Exception as e:
    print(f"  ❌ Backend not responding: {e}")

# ============ API ENDPOINTS ============
print("\n🔌 API ENDPOINTS")
print("-" * 60)
endpoints = [
    ("GET  /api/v1/stations", "List all monitoring stations"),
    ("GET  /api/v1/readings/{station_id}", "Get latest readings for a station"),
    ("GET  /api/v1/predictions/{station_id}", "Get AQI predictions for 48h"),
    ("POST /api/v1/scheduler/run/ingestion", "Manually trigger live data fetch"),
    ("POST /api/v1/scheduler/run/predictions", "Manually trigger AQI predictions"),
    ("POST /api/v1/scheduler/run/retrain", "Manually trigger model retraining"),
]
for endpoint, desc in endpoints:
    print(f"  {endpoint:40s} → {desc}")

print("\n" + "="*60 + "\n")

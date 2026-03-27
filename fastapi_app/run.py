#!/usr/bin/env python3
"""
AirWatch Pro - Entry point script for the FastAPI application

This script starts the FastAPI server using uvicorn. It also checks if the
database is initialized and can optionally run initial data loading.
"""

import os
import sys
import uvicorn
import argparse
from dotenv import load_dotenv

def parse_args():
    parser = argparse.ArgumentParser(description="AirWatch Pro FastAPI Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind the server to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on code changes")
    parser.add_argument("--setup-db", action="store_true", help="Run database setup before starting")
    return parser.parse_args()

def setup_database():
    """Run the database setup script"""
    print("Setting up database...")
    # Import here to avoid importing before dotenv is loaded
    from setup_db import setup_database, load_data
    
    if setup_database():
        print("Database setup successful.")
        if load_data():
            print("Data loaded successfully.")
            return True
    
    print("Database setup failed.")
    return False

def main():
    # Load environment variables from .env file
    load_dotenv()
    
    args = parse_args()
    
    if args.setup_db:
        if not setup_database():
            sys.exit(1)
    
    # Get host and port from environment variables or command line arguments
    host = os.getenv("API_HOST", args.host)
    port = int(os.getenv("API_PORT", args.port))
    
    print(f"Starting AirWatch Pro API server at {host}:{port}")
    
    # Start the FastAPI application
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()
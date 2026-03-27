#!/usr/bin/env python3
"""
Simple startup script to run the FastAPI server
"""

import uvicorn
import sys
import os
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    print("="*50)
    print("Starting AirWatch Pro API Server")
    print("="*50)
    
    try:
        # Start the FastAPI application
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
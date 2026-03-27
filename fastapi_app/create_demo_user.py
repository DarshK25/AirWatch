#!/usr/bin/env python3
"""
Create a demo user account for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import SessionLocal
from app.models.user import User
from app.core.auth import get_password_hash
from datetime import datetime

def create_demo_user():
    """Create a demo user account"""
    db = SessionLocal()
    
    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "admin@airwatch.pro").first()
        if existing_user:
            print("Demo user already exists!")
            return
        
        # Create demo user
        demo_user = User(
            full_name="Environmental Admin",
            email="admin@airwatch.pro",
            hashed_password=get_password_hash("airwatch123"[:72]),  # Truncate to 72 bytes for bcrypt
            user_type="government-official",
            location="thane-belapur",
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        print("Demo user created successfully!")
        print(f"Email: admin@airwatch.pro")
        print(f"Password: airwatch123")
        print(f"User ID: {demo_user.id}")
        
    except Exception as e:
        print(f"Error creating demo user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_user()
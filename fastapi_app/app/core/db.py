from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator
from app.core.config import settings
import sys

# Database URL is loaded from settings and normalized for writable SQLite paths.
SQLALCHEMY_DATABASE_URL = settings.database_url

print(f"Connecting to database: {SQLALCHEMY_DATABASE_URL}")

try:
    # Create the SQLAlchemy engine (the connection pool)
    # Note: In a production environment, you would use asyncpg and async SQLAlchemy,
    # but for this setup, the synchronous engine is appropriate.
    engine_kwargs = {"echo": True}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        **engine_kwargs
    )
    
    # Test the connection
    with engine.connect() as connection:
        from sqlalchemy import text
        result = connection.execute(text("SELECT 1"))
        print("Database connection successful!")
except Exception as e:
    print(f"ERROR: Could not connect to the database: {e}")
    print("Please check your DATABASE_URL and ensure PostgreSQL is running.")
    sys.exit(1)

# Create a configured "Session" class
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Dependency function to get a session for FastAPI endpoints
def get_db() -> Generator:
    """A FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        # 'yield' makes this a context manager, automatically closing the session
        yield db
    finally:
        db.close()

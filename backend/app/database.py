import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Defaulting to an isolated SQLite file inside backend folder, with a fallback to /tmp for Vercel/read-only filesystems
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("VERCEL") or not os.access(".", os.W_OK):
        DATABASE_URL = "sqlite:////tmp/placify.db"
    else:
        DATABASE_URL = "sqlite:///./placify.db"

# Disable thread-check enforcement for SQLite compatibility
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI DB session dependency generator"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

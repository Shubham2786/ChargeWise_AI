"""Database configuration and session management."""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# SQLAlchemy 2.x requires postgresql://, Supabase/Render may give postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SSL cert — resolve relative to this file so it works both locally and on Render
_cert_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "prod-ca-2021.crt")
_cert_path = os.path.normpath(_cert_path)

connect_args = {}
if os.path.exists(_cert_path) and DATABASE_URL.startswith("postgresql"):
    connect_args["sslrootcert"] = _cert_path
    connect_args["sslmode"] = "verify-ca"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""SQLAlchemy models for ChargeWise AI."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Index, UniqueConstraint
from app.chargewise.database import Base

class ChargingSession(Base):
    """EV charging session data."""
    __tablename__ = "charging_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String, nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    max_power_kw = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    
    __table_args__ = (
        Index('ix_station_start', 'station_id', 'start_time'),
        UniqueConstraint('station_id', 'start_time', name='uix_station_start')
    )

class FeederLoad(Base):
    """Aggregated feeder load time-series."""
    __tablename__ = "feeder_load"
    
    id = Column(Integer, primary_key=True, index=True)
    feeder_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    load_kw = Column(Float, nullable=False)
    
    __table_args__ = (
        Index('ix_feeder_timestamp', 'feeder_id', 'timestamp'),
    )

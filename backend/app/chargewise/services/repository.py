"""Database repository for ChargeWise AI."""
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.chargewise.models import ChargingSession, FeederLoad

class Repository:
    """Handle database operations for charging sessions and feeder load."""
    
    @staticmethod
    def insert_sessions(db: Session, sessions_df: pd.DataFrame) -> int:
        """
        Bulk insert charging sessions.
        
        Args:
            db: SQLAlchemy session
            sessions_df: DataFrame with session data
            
        Returns:
            Number of rows inserted
        """
        if sessions_df.empty:
            return 0
        
        records = sessions_df.to_dict('records')
        stmt = insert(ChargingSession).values(records)
        stmt = stmt.on_conflict_do_nothing(index_elements=['station_id', 'start_time'])
        
        result = db.execute(stmt)
        db.commit()
        return result.rowcount if hasattr(result, 'rowcount') else len(records)
    
    @staticmethod
    def insert_load(db: Session, load_df: pd.DataFrame) -> int:
        """
        Bulk insert feeder load data.
        
        Args:
            db: SQLAlchemy session
            load_df: DataFrame with load data
            
        Returns:
            Number of rows inserted
        """
        if load_df.empty:
            return 0
        
        records = load_df.to_dict('records')
        db.bulk_insert_mappings(FeederLoad, records)
        db.commit()
        return len(records)
    
    @staticmethod
    def get_sessions(db: Session, station_id: str = None, start_time_gte=None, start_time_lte=None, offset: int = 0, limit: int = 100):
        """Fetch latest charging sessions."""
        query = db.query(ChargingSession)
        if station_id:
            query = query.filter(ChargingSession.station_id == station_id)
        if start_time_gte:
            query = query.filter(ChargingSession.start_time >= start_time_gte)
        if start_time_lte:
            query = query.filter(ChargingSession.start_time <= start_time_lte)
            
        return query.order_by(ChargingSession.start_time.desc()).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_load(db: Session, feeder_id: str = None, limit: int = 1000):
        """Fetch feeder load time-series."""
        query = db.query(FeederLoad)
        if feeder_id:
            query = query.filter(FeederLoad.feeder_id == feeder_id)
        return query.order_by(FeederLoad.timestamp.desc()).limit(limit).all()

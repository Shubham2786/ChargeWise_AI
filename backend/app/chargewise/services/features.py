"""Feature engineering for ChargeWise AI forecasting."""
import pandas as pd
from sqlalchemy.orm import Session
from app.chargewise.models import ChargingSession

class FeatureEngineer:
    """Pipeline to aggregate DB sessions and build model features."""
    
    @staticmethod
    def _fetch_hourly_data(db: Session, station_id: str = None) -> pd.DataFrame:
        """Fetch and aggregate sessions into hourly data."""
        query = db.query(
            ChargingSession.start_time,
            ChargingSession.energy_kwh
        )
        
        if station_id:
            query = query.filter(ChargingSession.station_id == station_id)
            
        sessions = query.all()
        if not sessions:
            return pd.DataFrame()
            
        df = pd.DataFrame([{"timestamp": s.start_time, "energy_kwh": s.energy_kwh} for s in sessions])
        
        # Ensure UTC timezone and proper index
        df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
        df = df.set_index("timestamp")
        
        # Group by hour to get total energy and session count
        hourly_df = df.resample("1h").agg(
            total_energy_kwh=("energy_kwh", "sum"),
            session_count=("energy_kwh", "count")
        )
        
        # Ensure continuous time index and fill missing hours with 0
        hourly_df = hourly_df.asfreq("1h").fillna(0)
        
        return hourly_df
        
    @staticmethod
    def _add_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add time and lag features to the hourly dataframe."""
        df = df.copy()
        
        # Time features
        df["hour_of_day"] = df.index.hour
        df["day_of_week"] = df.index.dayofweek
        df["is_weekend"] = (df.index.dayofweek >= 5).astype(int)
        
        # Lag features
        df["lag_1h"] = df["total_energy_kwh"].shift(1)
        df["lag_24h"] = df["total_energy_kwh"].shift(24)
        df["lag_168h"] = df["total_energy_kwh"].shift(168)
        
        return df

    def build_training_data(self, db: Session, station_id: str = None) -> pd.DataFrame:
        """Build the full feature set for training with proper leakage guard."""
        df = self._fetch_hourly_data(db, station_id)
        if df.empty:
            return pd.DataFrame()
            
        df = self._add_features(df)
        
        # Target: Next hour's energy consumption
        df["target"] = df["total_energy_kwh"].shift(-1)
        
        # Drop NaNs (first 168 rows due to lag, last row due to target shift)
        df = df.dropna()
        
        return df
        
    def build_inference_history(self, db: Session, station_id: str = None) -> pd.DataFrame:
        """Build the recent history required for autoregressive forecasting."""
        df = self._fetch_hourly_data(db, station_id)
        if df.empty:
            return pd.DataFrame()
            
        df = self._add_features(df)
        
        # We need to keep the latest row (which might have NaNs for lags if data < 168h)
        # We will let the model module handle the cold start fallback if len(df) < 168
        return df

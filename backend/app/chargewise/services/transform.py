"""Data transformation for ACN sessions."""
import pandas as pd
from typing import List, Dict

class SessionTransformer:
    """Transform raw ACN session data to normalized format."""
    
    @staticmethod
    def transform(raw_sessions: List[Dict], default_max_power_kw: float = 7.0) -> pd.DataFrame:
        """
        Convert raw API data to clean DataFrame.
        
        Args:
            raw_sessions: List of raw session dicts from ACN API
            default_max_power_kw: Default max power if not provided
            
        Returns:
            DataFrame with columns: station_id, start_time, end_time, energy_kwh, max_power_kw
        """
        if not raw_sessions:
            return pd.DataFrame(columns=['station_id', 'start_time', 'end_time', 'energy_kwh', 'max_power_kw', 'duration_minutes'])
        
        df = pd.DataFrame(raw_sessions)
        
        # Map fields
        field_map = {
            'stationID': 'station_id',
            'connectionTime': 'start_time',
            'disconnectTime': 'end_time',
            'kWhDelivered': 'energy_kwh'
        }
        
        df = df.rename(columns=field_map)
        
        # Select and validate required columns
        required = ['station_id', 'start_time', 'end_time', 'energy_kwh']
        df = df[required].copy()
        
        # Convert timestamps and ensure they are UTC-aware to prevent issues
        df['start_time'] = pd.to_datetime(df['start_time'], utc=True)
        df['end_time'] = pd.to_datetime(df['end_time'], utc=True)
        
        # Calculate duration_minutes
        df['duration_minutes'] = ((df['end_time'] - df['start_time']).dt.total_seconds() // 60).astype(int)
        
        # Add max_power_kw
        df['max_power_kw'] = default_max_power_kw
        
        # Drop invalid rows
        df = df.dropna()
        df = df[df['energy_kwh'] > 0]
        df = df[df['end_time'] > df['start_time']]
        
        return df.reset_index(drop=True)

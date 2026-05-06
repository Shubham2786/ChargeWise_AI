"""Load time-series generation from charging sessions."""
import pandas as pd
from datetime import datetime, timedelta

class LoadBuilder:
    """Generate feeder load time-series from charging sessions."""
    
    @staticmethod
    def build_load(sessions_df: pd.DataFrame, feeder_id: str = "default", interval_minutes: int = 15) -> pd.DataFrame:
        """
        Convert sessions to time-series load data.
        
        Args:
            sessions_df: DataFrame with start_time, end_time, max_power_kw
            feeder_id: Feeder identifier
            interval_minutes: Time interval for aggregation
            
        Returns:
            DataFrame with columns: timestamp, feeder_id, load_kw
        """
        if sessions_df.empty:
            return pd.DataFrame(columns=['timestamp', 'feeder_id', 'load_kw'])
        
        # Determine time range
        min_time = sessions_df['start_time'].min()
        max_time = sessions_df['end_time'].max()
        
        # Generate time intervals
        timestamps = pd.date_range(
            start=min_time.floor(f'{interval_minutes}min'),
            end=max_time.ceil(f'{interval_minutes}min'),
            freq=f'{interval_minutes}min'
        )
        
        # Calculate load for each interval
        loads = []
        for ts in timestamps:
            interval_end = ts + timedelta(minutes=interval_minutes)
            
            # Find active sessions
            active = sessions_df[
                (sessions_df['start_time'] < interval_end) &
                (sessions_df['end_time'] > ts)
            ]
            
            load_kw = active['max_power_kw'].sum()
            loads.append({'timestamp': ts, 'feeder_id': feeder_id, 'load_kw': load_kw})
        
        return pd.DataFrame(loads)

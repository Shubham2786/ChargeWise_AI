"""Probabilistic Forecasting Engine with Cache."""
import xgboost as xgb
import pandas as pd
import datetime
import time
from typing import List, Dict, Any

# Simple In-Memory Cache for Feature 5.5
# Structure: {(station_id, horizon_hours): (timestamp, result)}
_FORECAST_CACHE = {}
CACHE_TTL_SECONDS = 300 # 5 minutes

class ProbabilisticModel:
    def __init__(self):
        # We will train 3 models on the fly (or load them)
        # Using squared error for MVP simulation if quantile isn't perfectly supported in some old XGB versions,
        # but XGBoost 2.1.3 supports reg:quantileerror natively.
        self.model_10 = xgb.XGBRegressor(objective='reg:quantileerror', quantile_alpha=0.1, n_estimators=50, max_depth=3)
        self.model_50 = xgb.XGBRegressor(objective='reg:quantileerror', quantile_alpha=0.5, n_estimators=50, max_depth=3)
        self.model_90 = xgb.XGBRegressor(objective='reg:quantileerror', quantile_alpha=0.9, n_estimators=50, max_depth=3)
        self.is_trained = False
        self.feature_columns = []

    def _check_cache(self, station_id: str, horizon: int) -> List[Dict[str, Any]]:
        key = (station_id, horizon)
        if key in _FORECAST_CACHE:
            ts, data = _FORECAST_CACHE[key]
            if time.time() - ts < CACHE_TTL_SECONDS:
                return data
        return None

    def _set_cache(self, station_id: str, horizon: int, data: List[Dict[str, Any]]):
        key = (station_id, horizon)
        _FORECAST_CACHE[key] = (time.time(), data)

    def train(self, df: pd.DataFrame):
        """Train all 3 quantile models."""
        if len(df) < 24:
            return # Not enough data
            
        X = df.drop(columns=['target'])
        y = df['target']
        self.feature_columns = X.columns.tolist()
        
        # XGBoost requires numeric data, ensure it's clean
        X_num = X.fillna(0)
        
        self.model_10.fit(X_num, y)
        self.model_50.fit(X_num, y)
        self.model_90.fit(X_num, y)
        self.is_trained = True

    def predict(self, history_df: pd.DataFrame, horizon: int = 24, station_id: str = None) -> List[Dict[str, Any]]:
        """Autoregressive prediction with 3 quantiles."""
        cached = self._check_cache(station_id, horizon)
        if cached is not None:
            return cached
            
        if not self.is_trained or len(history_df) == 0:
            # Fallback baseline
            return self._baseline_forecast(history_df, horizon, station_id)
            
        current_df = history_df.copy()
        
        # Ensure 'timestamp' column exists
        if 'timestamp' not in current_df.columns:
            current_df = current_df.reset_index()
            if 'timestamp' not in current_df.columns and 'index' in current_df.columns:
                current_df = current_df.rename(columns={'index': 'timestamp'})
                
        last_timestamp = current_df['timestamp'].max()
        if pd.isna(last_timestamp):
            last_timestamp = datetime.datetime.now(datetime.timezone.utc)
            
        predictions = []
        
        for i in range(horizon):
            next_time = last_timestamp + datetime.timedelta(hours=i+1)
            X = current_df[self.feature_columns].iloc[-1:]
            X_num = X.fillna(0)
            
            p10_val = float(self.model_10.predict(X_num)[0])
            p50_val = float(self.model_50.predict(X_num)[0])
            p90_val = float(self.model_90.predict(X_num)[0])
            
            # Post-process to prevent crossing quantiles (CRITICAL USER FIX)
            p10_clean = max(0.0, min(p10_val, p50_val, p90_val))
            p50_clean = max(0.0, sorted([p10_val, p50_val, p90_val])[1])
            p90_clean = max(0.0, max(p10_val, p50_val, p90_val))
            
            predictions.append({
                "timestamp": next_time,
                "p10": p10_clean,
                "p50": p50_clean,
                "p90": p90_clean
            })
            
            # Autoregressive update (use p50 as the "actual" next state)
            new_row = current_df.iloc[-1].copy()
            new_row['timestamp'] = next_time
            new_row['total_energy_kwh'] = p50_clean
            
            # Shift lags (simplified for speed)
            if 'lag_1h' in new_row: new_row['lag_1h'] = p50_clean
            if 'lag_24h' in new_row and len(current_df) >= 24:
                new_row['lag_24h'] = current_df.iloc[-24]['total_energy_kwh']
            if 'lag_168h' in new_row and len(current_df) >= 168:
                new_row['lag_168h'] = current_df.iloc[-168]['total_energy_kwh']
                
            current_df = pd.concat([current_df, pd.DataFrame([new_row])], ignore_index=True)
            
        self._set_cache(station_id, horizon, predictions)
        return predictions

    def _baseline_forecast(self, history_df: pd.DataFrame, horizon: int, station_id: str) -> List[Dict[str, Any]]:
        # Same cache logic
        cached = self._check_cache(station_id, horizon)
        if cached is not None:
            return cached
            
        now = datetime.datetime.now(datetime.timezone.utc)
        if not history_df.empty and 'timestamp' in history_df.columns:
            now = history_df['timestamp'].max()
            
        preds = []
        for i in range(horizon):
            preds.append({
                "timestamp": now + datetime.timedelta(hours=i+1),
                "p10": 5.0,
                "p50": 10.0,
                "p90": 20.0
            })
        self._set_cache(station_id, horizon, preds)
        return preds

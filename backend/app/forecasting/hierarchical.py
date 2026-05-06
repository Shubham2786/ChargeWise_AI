"""Hierarchical Forecasting Engine."""
import pandas as pd
from typing import List, Dict, Any
from app.forecasting.probabilistic import ProbabilisticModel

class HierarchicalModel:
    def __init__(self, global_model: ProbabilisticModel):
        self.global_model = global_model
        
    def forecast_hierarchy(self, station_histories: Dict[str, pd.DataFrame], global_history: pd.DataFrame, horizon: int = 24) -> Dict[str, Any]:
        """
        Aggregate station -> system.
        Validate against global model.
        """
        # 1. Generate Global Baseline Forecast
        global_forecast = self.global_model.predict(global_history, horizon=horizon, station_id="GLOBAL")
        
        # 2. Bottom-Up Forecast per Station
        station_forecasts = {}
        for st_id, hist_df in station_histories.items():
            station_forecasts[st_id] = self.global_model.predict(hist_df, horizon=horizon, station_id=st_id)
            
        # 3. Aggregate Stations -> System
        system_aggregate = []
        for i in range(horizon):
            sum_p10 = sum(station_forecasts[st_id][i]["p10"] for st_id in station_forecasts)
            sum_p50 = sum(station_forecasts[st_id][i]["p50"] for st_id in station_forecasts)
            sum_p90 = sum(station_forecasts[st_id][i]["p90"] for st_id in station_forecasts)
            
            # 4. Fallback Validation Check
            global_p50 = global_forecast[i]["p50"]
            
            # If deviation > 20%, fallback to global model for safety
            if global_p50 > 0 and abs(sum_p50 - global_p50) / global_p50 > 0.20:
                sys_p10 = global_forecast[i]["p10"]
                sys_p50 = global_forecast[i]["p50"]
                sys_p90 = global_forecast[i]["p90"]
                fallback_used = True
            else:
                sys_p10 = sum_p10
                sys_p50 = sum_p50
                sys_p90 = sum_p90
                fallback_used = False
                
            system_aggregate.append({
                "timestamp": global_forecast[i]["timestamp"],
                "p10": sys_p10,
                "p50": sys_p50,
                "p90": sys_p90,
                "fallback_active": fallback_used
            })
            
        return {
            "system_forecast": system_aggregate,
            "station_forecasts": station_forecasts
        }

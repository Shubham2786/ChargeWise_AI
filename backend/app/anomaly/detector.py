"""Anomaly Detection Engine."""
from typing import List, Dict, Any
import datetime

class AnomalyDetector:
    def detect_anomalies(self, recent_actuals: List[Dict[str, Any]], recent_forecasts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect abnormal charging spikes.
        Logic: if actual > (p90 * 1.2): anomaly = True
        """
        # Map forecasts by timestamp for quick lookup
        forecast_map = {}
        for f in recent_forecasts:
            # Assumes f["timestamp"] is a datetime object
            # In a real app, we'd ensure precise timezone matching or truncate to hour
            ts = f["timestamp"]
            # Just store the hour to handle slight mismatches
            key = ts.strftime("%Y-%m-%dT%H")
            forecast_map[key] = f["p90"]
            
        anomalies = []
        
        for act in recent_actuals:
            ts = act["timestamp"]
            key = ts.strftime("%Y-%m-%dT%H")
            
            actual_load = act["actual_kwh"]
            p90_load = forecast_map.get(key)
            
            if p90_load is not None:
                threshold = p90_load * 1.2
                if actual_load > threshold:
                    anomalies.append({
                        "timestamp": ts,
                        "anomaly": True,
                        "actual": actual_load,
                        "expected_p90": p90_load,
                        "reason": f"Unexpected spike: {actual_load} kW exceeded strict P90 threshold of {threshold:.2f} kW"
                    })
                    
        return anomalies

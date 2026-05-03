from app.services.forecaster import get_forecast
from app.utils.config import config

def detect_risk():
    forecast = get_forecast()
    predictions = forecast["predictions"]
    max_load = max(predictions)
    
    percent = (max_load / config.MAX_CAPACITY) * 100
    
    if percent > config.RISK_HIGH_THRESHOLD:
        risk_level = "HIGH"
    elif percent > config.RISK_MEDIUM_THRESHOLD:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    return {
        "risk_level": risk_level,
        "max_load": round(max_load, 2),
        "capacity_percent": round(percent, 2)
    }

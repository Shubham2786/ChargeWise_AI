from app.services.forecaster import get_forecast
from app.services.risk_detector import detect_risk
from app.utils.config import config

def optimize_schedule():
    forecast = get_forecast()
    risk = detect_risk()
    
    before = forecast["predictions"]
    after = before.copy()
    
    if risk["risk_level"] == "HIGH":
        for i in range(config.EV_SPIKE_START_HOUR, config.EV_SPIKE_END_HOUR):
            if i < len(after):
                shift_amount = after[i] * config.LOAD_SHIFT_PERCENT
                after[i] -= shift_amount
                if i + 4 < len(after):
                    after[i + 4] += shift_amount
    
    before_peak = max(before)
    after_peak = max(after)
    improvement = ((before_peak - after_peak) / before_peak) * 100 if before_peak > 0 else 0
    
    return {
        "before": [round(x, 2) for x in before],
        "after": [round(x, 2) for x in after],
        "improvement_percent": round(improvement, 2)
    }

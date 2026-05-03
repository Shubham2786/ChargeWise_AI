import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.utils.config import config

def generate_data():
    zones = config.ZONES
    start = datetime.now() - timedelta(days=config.DATA_DAYS)
    hours = config.DATA_DAYS * 24
    
    data = []
    for zone in zones:
        for h in range(hours):
            ts = start + timedelta(hours=h)
            hour = ts.hour
            
            base = 50 + 20 * np.sin(2 * np.pi * hour / 24)
            
            if config.EV_SPIKE_START_HOUR <= hour <= config.EV_SPIKE_END_HOUR:
                ev_spike = np.random.uniform(20, 40)
            else:
                ev_spike = 0
            
            noise = np.random.uniform(-5, 5)
            load = base + ev_spike + noise
            
            data.append({
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "zone": zone,
                "load": round(load, 2)
            })
    
    df = pd.DataFrame(data)
    import os
    os.makedirs("app/data", exist_ok=True)
    path = "app/data/grid_data.csv"
    df.to_csv(path, index=False)
    return path

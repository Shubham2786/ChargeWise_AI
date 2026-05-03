import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime, timedelta
from app.utils.config import config

model = None
last_data = None

def train_model():
    global model, last_data
    df = pd.read_csv("app/data/grid_data.csv")
    df = df[df["zone"] == config.ZONES[0]].copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    for i in range(1, config.LAG_FEATURES + 1):
        df[f"lag_{i}"] = df["load"].shift(i)
    
    df["hour"] = df["timestamp"].dt.hour
    df = df.dropna()
    
    lag_cols = [f"lag_{i}" for i in range(1, config.LAG_FEATURES + 1)]
    X = df[lag_cols + ["hour"]]
    y = df["load"]
    
    model = xgb.XGBRegressor(
        n_estimators=config.MODEL_N_ESTIMATORS,
        max_depth=config.MODEL_MAX_DEPTH,
        random_state=config.MODEL_RANDOM_STATE
    )
    model.fit(X, y)
    last_data = df.tail(config.LAG_FEATURES)

def get_forecast():
    global model, last_data
    if model is None:
        train_model()
    
    predictions = []
    current = last_data[["load"]].values.flatten().tolist()
    last_ts = pd.to_datetime(last_data.iloc[-1]["timestamp"])
    
    for i in range(24):
        hour = (last_ts + timedelta(hours=i+1)).hour
        X_pred = np.array([[current[-j] for j in range(1, config.LAG_FEATURES + 1)] + [hour]])
        pred = float(model.predict(X_pred)[0])
        predictions.append(round(pred, 2))
        current.append(pred)
    
    peak_hour = int(np.argmax(predictions))
    
    return {
        "predictions": predictions,
        "peak_hour": peak_hour
    }

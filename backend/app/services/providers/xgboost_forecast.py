"""
XGBoost Forecast Provider — real production implementation.

Houses the existing XGBoost-based forecasting logic.
This provider is activated when USE_AI_DEMO_DATA=False.
"""
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import timedelta
from app.utils.config import config
from app.services.providers.base import ForecastProvider


class XGBoostForecastProvider(ForecastProvider):
    """Production-grade XGBoost forecast using historical CSV data."""

    def __init__(self):
        self._model = None
        self._last_data = None

    def _train(self):
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

        self._model = xgb.XGBRegressor(
            n_estimators=config.MODEL_N_ESTIMATORS,
            max_depth=config.MODEL_MAX_DEPTH,
            random_state=config.MODEL_RANDOM_STATE,
        )
        self._model.fit(X, y)
        self._last_data = df.tail(config.LAG_FEATURES)

    async def get_forecast(self, zone: str = "Zone_A") -> dict:
        if self._model is None:
            self._train()

        predictions = []
        current = self._last_data[["load"]].values.flatten().tolist()
        last_ts = pd.to_datetime(self._last_data.iloc[-1]["timestamp"])

        for i in range(24):
            hour = (last_ts + timedelta(hours=i + 1)).hour
            X_pred = np.array(
                [[current[-j] for j in range(1, config.LAG_FEATURES + 1)] + [hour]]
            )
            pred = float(self._model.predict(X_pred)[0])
            predictions.append(round(pred, 2))
            current.append(pred)

        peak_hour = int(np.argmax(predictions))
        return {"predictions": predictions, "peak_hour": peak_hour}

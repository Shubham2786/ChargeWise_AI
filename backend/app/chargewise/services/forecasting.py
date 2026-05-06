"""Model training and prediction for Demand Forecasting."""
import os
import json
import joblib
import pandas as pd
from typing import List, Dict, Any
from sklearn.metrics import root_mean_squared_error

try:
    import xgboost as xgb
except ImportError:
    xgb = None

class ForecastModel:
    """XGBoost model wrapper for hourly forecasting."""
    
    def __init__(self, model_path: str = "app/data/forecast_model.pkl", meta_path: str = "app/data/forecast_meta.json"):
        self.model_path = model_path
        self.meta_path = meta_path
        self.model = None
        self.feature_columns = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.meta_path):
            self.model = joblib.load(self.model_path)
            with open(self.meta_path, "r") as f:
                meta = json.load(f)
                self.feature_columns = meta.get("feature_columns")

    def train(self, df: pd.DataFrame) -> float:
        """Train the model, compare to baseline, and save."""
        if xgb is None:
            raise ImportError("xgboost is not installed.")
            
        if df.empty or len(df) < 168:
            print("Not enough data to train. Need at least 168 hours.")
            return -1.0

        # Features vs Target
        drop_cols = ["target", "total_energy_kwh", "session_count"]
        X = df.drop(columns=drop_cols, errors="ignore")
        y = df["target"]

        self.feature_columns = X.columns.tolist()
        
        # Train/Test Split (80/20 temporal)
        split_idx = int(len(df) * 0.8)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        # Train XGBoost
        model = xgb.XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        rmse_model = root_mean_squared_error(y_test, y_pred)
        
        # Baseline (lag_1h)
        # Using the lag_1h from X_test directly
        y_baseline = X_test["lag_1h"]
        rmse_baseline = root_mean_squared_error(y_test, y_baseline)

        print(f"XGBoost RMSE: {rmse_model:.2f} | Baseline RMSE: {rmse_baseline:.2f}")

        if rmse_model > rmse_baseline:
            print("Warning: Model performs worse than baseline (lag_1h)!")
            # In a strict pipeline, we might abort saving here, but we save for completeness
            
        # Save model and feature columns
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(model, self.model_path)
        with open(self.meta_path, "w") as f:
            json.dump({"feature_columns": self.feature_columns}, f)
            
        self.model = model
        return rmse_model

    def predict(self, history_df: pd.DataFrame, horizon: int = 24) -> List[Dict[str, Any]]:
        """Autoregressive prediction for 'horizon' hours."""
        if history_df.empty:
            return []

        # Cold Start check: If less than 168 hours of history, use baseline fallback (e.g. lag_1h or rolling average)
        if len(history_df) < 168 or self.model is None or self.feature_columns is None:
            # Fallback Baseline Forecast: Flatline the last known total_energy_kwh
            last_known = history_df["total_energy_kwh"].iloc[-1] if not history_df.empty else 0.0
            last_time = history_df.index[-1] if not history_df.empty else pd.Timestamp.utcnow()
            
            preds = []
            for i in range(1, horizon + 1):
                preds.append({
                    "timestamp": last_time + pd.Timedelta(hours=i),
                    "predicted_kwh": last_known,
                    "features": {} # Baseline has no features
                })
            return preds

        # Prepare recursive forecasting
        working_df = history_df.copy()
        predictions = []
        
        for _ in range(horizon):
            # The current state to predict from is the LAST row of the working dataframe
            current_row = working_df.iloc[[-1]].copy()
            current_time = current_row.index[0]
            next_time = current_time + pd.Timedelta(hours=1)
            
            # Enforce feature consistency
            for col in self.feature_columns:
                if col not in current_row.columns:
                    current_row[col] = 0.0
            X = current_row[self.feature_columns]
            
            # Predict
            pred_val = self.model.predict(X)[0]
            pred_val = max(0.0, float(pred_val)) # Cap predictions at 0
            
            # Save prediction
            predictions.append({
                "timestamp": next_time,
                "predicted_kwh": pred_val,
                "features": X.iloc[0].to_dict()
            })
            
            # Update working_df for next step
            # We append the prediction as the new reality
            new_row = pd.DataFrame({
                "total_energy_kwh": [pred_val],
                "session_count": [0], # unknown future session count
            }, index=[next_time])
            
            working_df = pd.concat([working_df, new_row])
            
            # Recompute time and lag features for the newly appended row
            working_df["hour_of_day"] = working_df.index.hour
            working_df["day_of_week"] = working_df.index.dayofweek
            working_df["is_weekend"] = (working_df.index.dayofweek >= 5).astype(int)
            working_df["lag_1h"] = working_df["total_energy_kwh"].shift(1)
            working_df["lag_24h"] = working_df["total_energy_kwh"].shift(24)
            working_df["lag_168h"] = working_df["total_energy_kwh"].shift(168)
            
        return predictions

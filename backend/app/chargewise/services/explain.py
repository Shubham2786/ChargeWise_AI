"""Explainability for forecasting models using SHAP."""
import os
import joblib
import pandas as pd
import numpy as np
try:
    import shap
except ImportError:
    shap = None

class ForecastExplainer:
    """Precomputed SHAP explainer for XGBoost."""
    
    def __init__(self, model_path: str = "app/data/forecast_model.pkl"):
        self.model_path = model_path
        self.explainer = None
        self._load_explainer()

    def _load_explainer(self):
        if shap is None:
            return
            
        if os.path.exists(self.model_path):
            model = joblib.load(self.model_path)
            # TreeExplainer is fast for XGBoost. We precompute it once here.
            self.explainer = shap.TreeExplainer(model)

    def explain_prediction(self, features_dict: dict) -> str:
        """Generate structured string explanation for a single prediction based on its features."""
        if self.explainer is None:
            return "Explainability not available (model missing or shap not installed)."
            
        if not features_dict:
            return "Baseline forecast (no explanatory features available)."

        # Convert dict to DataFrame for SHAP
        df = pd.DataFrame([features_dict])
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(df)
        
        # shap_values for a single prediction is a 1D array
        vals = shap_values[0]
        feature_names = df.columns.tolist()
        
        # Find top 2 driving features (highest absolute impact)
        # Sort by absolute value descending
        top_indices = np.argsort(np.abs(vals))[::-1]
        
        top_features = []
        for idx in top_indices[:2]:
            impact = vals[idx]
            fname = feature_names[idx]
            
            # Map technical feature names to readable text
            readable_name = fname
            if fname == "lag_1h":
                readable_name = "previous hour's load"
            elif fname == "lag_24h":
                readable_name = "yesterday's pattern"
            elif fname == "lag_168h":
                readable_name = "last week's pattern"
            elif fname == "hour_of_day":
                # Check actual value to be more descriptive
                hour_val = int(df.iloc[0][fname])
                readable_name = f"time of day ({hour_val}:00)"
            elif fname == "is_weekend":
                val = int(df.iloc[0][fname])
                readable_name = "weekend pattern" if val else "weekday pattern"
                
            direction = "increasing" if impact > 0 else "decreasing"
            top_features.append(f"{readable_name} ({direction} impact)")
            
        explanation = f"Forecast driven heavily by {top_features[0]}"
        if len(top_features) > 1:
            explanation += f" and {top_features[1]}"
            
        return explanation + "."

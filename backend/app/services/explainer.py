import pandas as pd
import numpy as np
from app.services.forecaster import model, last_data
from app.utils.config import config

def explain_forecast():
    if model is None:
        return {"summary": "Model not trained"}
    
    try:
        # Use XGBoost's built-in feature importance
        feature_importance = model.get_booster().get_score(importance_type='gain')
        
        # Sort by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:config.SHAP_TOP_FEATURES]
        
        # Create human-readable names
        feature_map = {
            'f0': 'lag_1 (1 hour ago)',
            'f1': 'lag_2 (2 hours ago)',
            'f2': 'lag_3 (3 hours ago)',
            'f3': 'hour (time of day)'
        }
        
        feature_names = [feature_map.get(f[0], f[0]) for f in sorted_features]
        summary = f"Top factors: {', '.join(feature_names)}"
        
        return {"summary": summary}
    except Exception as e:
        # Fallback to simple explanation
        return {"summary": "Top factors: lag_1 (1 hour ago), lag_2 (2 hours ago), hour (time of day)"}

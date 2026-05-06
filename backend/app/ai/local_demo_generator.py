import numpy as np
from app.utils.config import config

class LocalDemoGenerator:
    """Emergency Deterministic Numpy-based Generators"""

    @staticmethod
    def generate_forecast():
        base_curve = [50 + 20 * np.sin(np.pi * i / 12) for i in range(24)]
        multiplier = 1.5 if config.SCENARIO_MODE in ["HIGH_LOAD", "CRITICAL_GRID"] else 1.0
        curve = [val * multiplier for val in base_curve]
        return {
            "predictions": [round(v, 2) for v in curve],
            "peak_hour": int(np.argmax(curve))
        }

    @staticmethod
    def generate_risk():
        score = 85 if config.SCENARIO_MODE == "CRITICAL_GRID" else 20
        max_load = 180 if config.SCENARIO_MODE == "CRITICAL_GRID" else 65
        capacity_percent = (max_load / 200) * 100
        risk_level = "HIGH" if score > 70 else "MEDIUM" if score > 40 else "LOW"
        return {
            "risk_level": risk_level,
            "max_load": round(max_load, 2),
            "capacity_percent": round(capacity_percent, 2),
            "risk_score": score,
            "risk_factors": ["Simulated Fallback Risk — Groq API unavailable"]
        }

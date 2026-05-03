import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    
    MAX_CAPACITY = int(os.getenv("MAX_CAPACITY", 100))
    ZONES = os.getenv("ZONES", "Zone_A,Zone_B,Zone_C").split(",")
    DATA_DAYS = int(os.getenv("DATA_DAYS", 30))
    
    MODEL_N_ESTIMATORS = int(os.getenv("MODEL_N_ESTIMATORS", 50))
    MODEL_MAX_DEPTH = int(os.getenv("MODEL_MAX_DEPTH", 4))
    MODEL_RANDOM_STATE = int(os.getenv("MODEL_RANDOM_STATE", 42))
    LAG_FEATURES = int(os.getenv("LAG_FEATURES", 3))
    
    RISK_HIGH_THRESHOLD = int(os.getenv("RISK_HIGH_THRESHOLD", 80))
    RISK_MEDIUM_THRESHOLD = int(os.getenv("RISK_MEDIUM_THRESHOLD", 60))
    
    LOAD_SHIFT_PERCENT = float(os.getenv("LOAD_SHIFT_PERCENT", 25)) / 100
    EV_SPIKE_START_HOUR = int(os.getenv("EV_SPIKE_START_HOUR", 18))
    EV_SPIKE_END_HOUR = int(os.getenv("EV_SPIKE_END_HOUR", 22))
    
    SHAP_TOP_FEATURES = int(os.getenv("SHAP_TOP_FEATURES", 3))
    
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./grid_optimizer.db")

config = Config()

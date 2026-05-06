"""Automated tests for Feature 2: Forecasting + Explainability."""
import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.chargewise.database import SessionLocal
from app.chargewise.services.features import FeatureEngineer
from app.chargewise.services.forecasting import ForecastModel
from app.chargewise.services.explain import ForecastExplainer

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    db_session = SessionLocal()
    yield db_session
    db_session.close()

def test_feature_engineering(db):
    """Test 2: Feature Pipeline works and handles time correctly."""
    fe = FeatureEngineer()
    df = fe.build_training_data(db)
    
    if len(df) == 0:
        pytest.skip("No data available in test DB to run feature engineering.")
        
    assert "lag_1h" in df.columns
    assert "lag_24h" in df.columns
    assert "lag_168h" in df.columns
    assert "target" in df.columns
    assert not df.isnull().any().any()

def test_model_training(db):
    """Test 1: Training Works."""
    # Use synthetic data to ensure test runs even if DB is empty
    df = pd.DataFrame({
        "total_energy_kwh": np.random.uniform(10, 50, 200),
        "session_count": np.random.randint(1, 10, 200),
        "hour_of_day": np.random.randint(0, 24, 200),
        "day_of_week": np.random.randint(0, 7, 200),
        "is_weekend": np.random.randint(0, 2, 200),
        "lag_1h": np.random.uniform(10, 50, 200),
        "lag_24h": np.random.uniform(10, 50, 200),
        "lag_168h": np.random.uniform(10, 50, 200),
        "target": np.random.uniform(10, 50, 200)
    })
    
    model = ForecastModel()
    rmse = model.train(df)
    
    assert rmse > 0

def test_prediction(db):
    """Test 3: Prediction Works."""
    fe = FeatureEngineer()
    history = fe.build_inference_history(db)
    
    model = ForecastModel()
    preds = model.predict(history, horizon=3)
    
    assert len(preds) == 3
    assert all(p["predicted_kwh"] >= 0 for p in preds)

def test_shap_explanation():
    """Test 4: SHAP Works."""
    explainer = ForecastExplainer()
    
    # Fake feature dictionary simulating a prediction step (Must match trained features)
    sample_features = {
        "hour_of_day": 18.0,
        "day_of_week": 1.0,
        "is_weekend": 0.0,
        "lag_1h": 45.0,
        "lag_24h": 52.0,
        "lag_168h": 48.0
    }
    
    explanation = explainer.explain_prediction(sample_features)
    
    assert isinstance(explanation, str)
    assert len(explanation) > 0

def test_forecast_api():
    """Test 5: API End-to-End."""
    response = client.get("/v1/forecast?horizon_hours=3")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "forecast" in data
    assert len(data["forecast"]) == 3
    
    for item in data["forecast"]:
        assert "predicted_kwh" in item
        assert "explanation" in item
        assert item["predicted_kwh"] >= 0

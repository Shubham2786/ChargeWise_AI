"""Tests for Advanced Grid Intelligence Layer (Features 5-10)."""
import pytest
import datetime
import time
from app.forecasting.probabilistic import ProbabilisticModel
from app.risk.engine import RiskEngine
from app.optimization.scheduler import ChargingScheduler, Session
from app.optimization.constraints import GridConstraints
from app.dashboard.summary import DashboardAggregator

class MockDB:
    def query(self, *args, **kwargs):
        return self
    def filter(self, *args, **kwargs):
        return self
    def order_by(self, *args, **kwargs):
        return self
    def limit(self, *args, **kwargs):
        return self
    def all(self):
        return []
        
def test_quantile_sanity():
    """Test: p10 <= p50 <= p90 (No crossing quantiles)."""
    model = ProbabilisticModel()
    
    # Empty dataframe will trigger the baseline fallback which uses the cache
    import pandas as pd
    df = pd.DataFrame()
    preds = model.predict(df, horizon=24, station_id="test")
    
    for p in preds:
        assert p["p10"] <= p["p50"]
        assert p["p50"] <= p["p90"]

def test_risk_consistency():
    """Test: if p90 > capacity, assert risk == 'HIGH'."""
    engine = RiskEngine()
    engine.constraints.MAX_CAPACITY_KW = 100.0
    
    now = datetime.datetime.now()
    
    # Inject a forecast where only p90 breaks capacity
    forecast = [
        {"timestamp": now, "p10": 50.0, "p50": 90.0, "p90": 110.0}
    ]
    
    res = engine.evaluate_risk(forecast)
    assert res["risk_level"] == "HIGH"
    
    # Inject a forecast where nothing breaks capacity
    forecast_safe = [
        {"timestamp": now, "p10": 10.0, "p50": 50.0, "p90": 80.0}
    ]
    
    res_safe = engine.evaluate_risk(forecast_safe)
    assert res_safe["risk_level"] == "LOW"

def test_scheduler_safety():
    """Test: optimized peak <= capacity."""
    scheduler = ChargingScheduler()
    scheduler.constraints.MAX_CAPACITY_KW = 150.0
    
    now = datetime.datetime.now()
    
    # Base load is 100, leaves 50 capacity
    forecast = [{"timestamp": now + datetime.timedelta(hours=i), "predicted_kwh": 100.0} for i in range(24)]
    
    # 20 cars wanting 10kW each = 200kW demand. 
    # Uncontrolled peak would be 100 + 200 = 300kW
    sessions = [
        Session(id=str(i), remaining_energy=20.0, deadline=now + datetime.timedelta(hours=5), max_power=10.0)
        for i in range(20)
    ]
    
    res = scheduler.schedule(forecast, sessions)
    
    assert res["uncontrolled_peak"] == 300.0
    assert res["optimized_peak"] <= 150.0

def test_dashboard_latency():
    """Test: Dashboard aggregator shared context resolves in < 2 seconds."""
    aggregator = DashboardAggregator()
    db = MockDB()
    
    start_time = time.time()
    
    # This invokes all the models. Since we use MockDB, it runs baseline logic,
    # but the architectural orchestration overhead is tested here.
    summary = aggregator.get_summary(db=db, station_id="test_latency", horizon_hours=24)
    
    end_time = time.time()
    latency = end_time - start_time
    
    assert latency < 2.0
    
    # Ensure all modules are populated
    assert "forecast" in summary
    assert "risk" in summary
    assert "pricing" in summary
    assert "schedule" in summary
    assert "anomalies" in summary
    assert "planning_candidates" in summary

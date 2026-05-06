"""ChargeWise AI API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
from app.chargewise.database import get_db
from app.chargewise.services.repository import Repository
from app.chargewise.services.features import FeatureEngineer
from app.chargewise.services.forecasting import ForecastModel
from app.chargewise.services.explain import ForecastExplainer
from app.optimization.service import OptimizationService
from app.planning.service import PlanningService
from app.dashboard.summary import DashboardAggregator
from app.forecasting.hierarchical import HierarchicalModel
from app.utils.config import config

router = APIRouter(prefix="/v1", tags=["ChargeWise AI"])

# Precompute/load models globally for performance
feature_engineer = FeatureEngineer()
forecast_model = ForecastModel()
forecast_explainer = ForecastExplainer()
optimization_service = OptimizationService()
planning_service = PlanningService()
dashboard_aggregator = DashboardAggregator()
hierarchical_model = HierarchicalModel(dashboard_aggregator.prob_model)

# Response models
class SessionResponse(BaseModel):
    id: int
    station_id: str
    start_time: datetime
    end_time: datetime
    energy_kwh: float
    max_power_kw: float
    duration_minutes: int
    
    class Config:
        from_attributes = True

class LoadResponse(BaseModel):
    id: int
    feeder_id: str
    timestamp: datetime
    load_kw: float
    
    class Config:
        from_attributes = True

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    station_id: Optional[str] = None,
    start_time_gte: Optional[datetime] = None,
    start_time_lte: Optional[datetime] = None,
    offset: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get latest charging sessions."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_sessions(limit)
    
    return Repository.get_sessions(
        db, 
        station_id=station_id, 
        start_time_gte=start_time_gte, 
        start_time_lte=start_time_lte, 
        offset=offset, 
        limit=limit
    )

@router.get("/load", response_model=List[LoadResponse])
async def get_load(feeder_id: Optional[str] = None, limit: int = 1000, db: Session = Depends(get_db)):
    """Get feeder load time-series."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_load(limit)
    
    return Repository.get_load(db, feeder_id=feeder_id, limit=limit)

class ForecastPoint(BaseModel):
    timestamp: datetime
    predicted_kwh: float
    explanation: str

class ForecastOutput(BaseModel):
    forecast: List[ForecastPoint]

@router.get("/forecast", response_model=ForecastOutput)
async def get_forecast(
    station_id: Optional[str] = None,
    horizon_hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get hourly EV demand forecast with SHAP explainability."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        prob_forecast = await get_demo_service().get_probabilistic_forecast(horizon_hours, station_id or "Zone_A")
        # Convert probabilistic to point forecast format
        result = []
        for f in prob_forecast:
            result.append({
                "timestamp": f["timestamp"],
                "predicted_kwh": f["p50"],
                "explanation": f.get("explanation", "Baseline forecast."),
            })
        return {"forecast": result}
    
    history = feature_engineer.build_inference_history(db, station_id)
    predictions = forecast_model.predict(history, horizon=horizon_hours)
    
    result = []
    for i, p in enumerate(predictions):
        explanation = "Baseline forecast."
        if p.get("features"):
            if i < 3:
                explanation = forecast_explainer.explain_prediction(p["features"])
            else:
                explanation = "Trend continues based on initial factors."
        
        result.append({
            "timestamp": p["timestamp"],
            "predicted_kwh": p["predicted_kwh"],
            "explanation": explanation
        })
        
    return {"forecast": result}

@router.get("/schedule/recommendation")
async def get_schedule_recommendation(
    station_id: Optional[str] = None,
    horizon_hours: int = 24,
    db: Session = Depends(get_db)
):
    """Generate smart charging schedule recommendation using Hybrid EDF."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_schedule(horizon_hours)
    
    return optimization_service.get_schedule_recommendation(
        db=db,
        station_id=station_id,
        horizon_hours=horizon_hours
    )

@router.get("/planning/candidates")
async def get_planning_candidates(db: Session = Depends(get_db)):
    """Identify optimal locations for new EV charging stations."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_planning_candidates()
    
    return planning_service.get_candidates(db=db)

@router.get("/forecast/probabilistic")
async def get_probabilistic_forecast(station_id: Optional[str] = None, horizon_hours: int = 24, db: Session = Depends(get_db)):
    """Advanced forecast with P10, P50, P90 uncertainty bounds."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_probabilistic_forecast(horizon_hours, station_id or "Zone_A")
    
    history = feature_engineer.build_inference_history(db, station_id)
    return dashboard_aggregator.prob_model.predict(history, horizon=horizon_hours, station_id=station_id)

@router.get("/risk")
async def get_grid_risk(station_id: Optional[str] = None, horizon_hours: int = 24, db: Session = Depends(get_db)):
    """Compute probability of grid overload."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_risk(horizon_hours)
    
    history = feature_engineer.build_inference_history(db, station_id)
    forecast = dashboard_aggregator.prob_model.predict(history, horizon=horizon_hours, station_id=station_id)
    return dashboard_aggregator.risk_engine.evaluate_risk(forecast)

@router.get("/pricing")
async def get_dynamic_pricing(station_id: Optional[str] = None, horizon_hours: int = 24, db: Session = Depends(get_db)):
    """Simulate dynamic electricity pricing based on projected load."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_pricing(horizon_hours)
    
    history = feature_engineer.build_inference_history(db, station_id)
    forecast = dashboard_aggregator.prob_model.predict(history, horizon=horizon_hours, station_id=station_id)
    return dashboard_aggregator.pricing_sim.simulate_pricing(forecast)

@router.get("/anomalies")
async def get_anomalies(station_id: Optional[str] = None, horizon_hours: int = 24, db: Session = Depends(get_db)):
    """Detect abnormal charging spikes based on P90 threshold."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_anomalies(horizon_hours)
    
    # We re-use dashboard code to fetch actuals
    from app.chargewise.models import ChargingSession
    recent_sessions = db.query(ChargingSession).order_by(ChargingSession.start_time.desc()).limit(50).all()
    actuals = [{"timestamp": s.start_time, "actual_kwh": s.energy_kwh} for s in recent_sessions]
    
    history = feature_engineer.build_inference_history(db, station_id)
    forecast = dashboard_aggregator.prob_model.predict(history, horizon=horizon_hours, station_id=station_id)
    return dashboard_aggregator.anomaly_detector.detect_anomalies(actuals, forecast)

@router.get("/forecast/hierarchy")
async def get_hierarchical_forecast(horizon_hours: int = 24, db: Session = Depends(get_db)):
    """Hierarchical forecast (System aggregation from Stations)."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_hierarchical_forecast(horizon_hours)
    
    # Build dictionary of historical dfs
    from app.chargewise.models import ChargingSession
    stations = db.query(ChargingSession.station_id).distinct().all()
    
    histories = {}
    for st in stations:
        st_id = st[0]
        histories[st_id] = feature_engineer.build_inference_history(db, st_id)
        
    global_hist = feature_engineer.build_inference_history(db, None)
    return hierarchical_model.forecast_hierarchy(histories, global_hist, horizon=horizon_hours)

@router.get("/dashboard/summary")
async def get_dashboard_summary(station_id: Optional[str] = None, horizon_hours: int = 24, db: Session = Depends(get_db)):
    """Unified system dashboard aggregator returning all advanced features."""
    if config.USE_AI_DEMO_DATA:
        from app.ai.groq_demo_service import get_demo_service
        return await get_demo_service().get_dashboard_summary(horizon_hours)
    
    return dashboard_aggregator.get_summary(db=db, station_id=station_id, horizon_hours=horizon_hours)

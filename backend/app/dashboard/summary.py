"""Unified Dashboard Aggregator."""
from sqlalchemy.orm import Session as DBSession
from app.chargewise.services.features import FeatureEngineer
from app.forecasting.probabilistic import ProbabilisticModel
from app.risk.engine import RiskEngine
from app.pricing.simulator import PricingSimulator
from app.anomaly.detector import AnomalyDetector
from app.optimization.service import OptimizationService
from app.planning.service import PlanningService
from app.chargewise.models import ChargingSession
import datetime

class DashboardAggregator:
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.prob_model = ProbabilisticModel()
        self.risk_engine = RiskEngine()
        self.pricing_sim = PricingSimulator()
        self.anomaly_detector = AnomalyDetector()
        self.optimization_service = OptimizationService() # Has internal FeatureEngineer and ProbModel, but we can bypass or override
        self.planning_service = PlanningService()
        
    def get_summary(self, db: DBSession, station_id: str = None, horizon_hours: int = 24) -> dict:
        """
        Builds the unified intelligence summary using a shared execution context
        to guarantee < 2 sec response times and prevent duplicate compute.
        """
        context = {}
        
        # 1. Shared Forecast
        history = self.feature_engineer.build_inference_history(db, station_id)
        context["forecast"] = self.prob_model.predict(history, horizon=horizon_hours, station_id=station_id)
        
        # 2. Risk Evaluation
        context["risk"] = self.risk_engine.evaluate_risk(context["forecast"])
        
        # 3. Dynamic Pricing
        context["pricing"] = self.pricing_sim.simulate_pricing(context["forecast"])
        
        # 4. Anomaly Detection
        # Fetch some recent actuals for the detector
        now = datetime.datetime.now(datetime.timezone.utc)
        recent_sessions = db.query(ChargingSession).order_by(ChargingSession.start_time.desc()).limit(50).all()
        # Mock recent actuals structure from sessions
        recent_actuals = []
        for s in recent_sessions:
            recent_actuals.append({
                "timestamp": s.start_time,
                "actual_kwh": s.energy_kwh
            })
        context["anomalies"] = self.anomaly_detector.detect_anomalies(recent_actuals, context["forecast"])
        
        # 5. Smart Schedule (Injecting shared forecast logic)
        # Instead of calling optimization_service which recalculates forecast, we can run the scheduler directly
        # using the hybrid logic.
        risk_level = context["risk"]["risk_level"]
        forecast_load = []
        for p in context["forecast"]:
            base_load = p["p90"] if risk_level == "HIGH" else p["p50"]
            forecast_load.append({
                "timestamp": p["timestamp"],
                "predicted_kwh": base_load
            })
            
        active_sessions = self.optimization_service._derive_active_sessions(db, limit=15)
        context["schedule"] = self.optimization_service.scheduler.schedule(forecast_load, active_sessions)
        
        # 6. Planning Candidates
        context["planning_candidates"] = self.planning_service.get_candidates(db)["candidates"]
        
        return context

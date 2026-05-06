"""Optimization orchestration service."""
import random
import datetime
from sqlalchemy.orm import Session as DBSession
from app.chargewise.models import ChargingSession
from app.chargewise.services.features import FeatureEngineer
from app.forecasting.probabilistic import ProbabilisticModel
from app.risk.engine import RiskEngine
from app.optimization.scheduler import ChargingScheduler, Session as SchedulerSession

class OptimizationService:
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.prob_model = ProbabilisticModel()
        self.risk_engine = RiskEngine()
        self.scheduler = ChargingScheduler()
        
    def _derive_active_sessions(self, db: DBSession, limit: int = 20) -> list[SchedulerSession]:
        """
        Derive pseudo-active sessions from real DB historical data for MVP.
        In production, this would query a live 'active_sessions' table.
        """
        # Fetch the most recent sessions
        recent_sessions = db.query(ChargingSession).order_by(ChargingSession.start_time.desc()).limit(limit).all()
        
        active_sessions = []
        now = datetime.datetime.now(datetime.timezone.utc)
        
        for idx, s in enumerate(recent_sessions):
            # Transform as per instructions:
            # energy_kwh_required = energy_kwh * random(0.3-0.8)
            # deadline_time = now + duration_minutes
            
            # Ensure deterministic-ish randomness using session id as seed
            random.seed(s.id)
            factor = random.uniform(0.3, 0.8)
            energy_req = s.energy_kwh * factor
            
            # If historical energy was very low, give it a realistic minimum
            if energy_req < 5.0:
                energy_req = 15.0 * factor
                
            duration = s.duration_minutes
            if duration < 60:
                duration = random.randint(120, 360) # Ensure they have reasonable deadlines
                
            deadline = now + datetime.timedelta(minutes=duration)
            
            active_sessions.append(SchedulerSession(
                id=f"{s.station_id}_{idx}",
                remaining_energy=energy_req,
                deadline=deadline,
                max_power=s.max_power_kw if s.max_power_kw > 0 else 11.0 # fallback 11kW
            ))
            
        return active_sessions

    def get_schedule_recommendation(self, db: DBSession, station_id: str = None, horizon_hours: int = 24) -> dict:
        """Generate smart charging schedule."""
        # 1. Fetch probabilistic baseline load
        history = self.feature_engineer.build_inference_history(db, station_id)
        
        # In a real shared-context scenario, the forecast might be passed in.
        # But for the standalone API, we generate it here.
        predictions = self.prob_model.predict(history, horizon=horizon_hours, station_id=station_id)
        
        # Calculate Risk to determine base load strategy
        risk_result = self.risk_engine.evaluate_risk(predictions)
        risk_level = risk_result["risk_level"]
        
        now = datetime.datetime.now(datetime.timezone.utc).replace(minute=0, second=0, microsecond=0)
        forecast_load = []
        for i, p in enumerate(predictions):
            # Hybrid Scheduling Logic
            if risk_level == "HIGH":
                base_load = p["p90"]
            else:
                base_load = p["p50"]
                
            forecast_load.append({
                "timestamp": now + datetime.timedelta(hours=i),
                "predicted_kwh": base_load
            })
            
        if not forecast_load:
            # Fallback if forecast is empty
            for i in range(horizon_hours):
                forecast_load.append({
                    "timestamp": now + datetime.timedelta(hours=i),
                    "predicted_kwh": 0.0
                })
                
        # 2. Fetch pseudo-active sessions
        active_sessions = self._derive_active_sessions(db, limit=15)
        
        # 3. Run scheduler
        result = self.scheduler.schedule(forecast_load, active_sessions)
        
        return result

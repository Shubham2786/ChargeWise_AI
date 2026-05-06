"""Planning service for infrastructure siting."""
from sqlalchemy.orm import Session as DBSession
from app.chargewise.models import ChargingSession
from app.planning.clustering import SpatialClusterer, ZONES
from app.planning.scoring import CandidateScorer

class PlanningService:
    def __init__(self):
        self.clusterer = SpatialClusterer()
        self.scorer = CandidateScorer(min_session_threshold=10) # Set to 10 to match DBSCAN min_samples for MVP
        
    def get_candidates(self, db: DBSession) -> dict:
        """Identify optimal locations for new EV charging stations."""
        # 1. Fetch historical sessions
        sessions = db.query(ChargingSession).all()
        
        # 2. Cluster demand
        clusters = self.clusterer.cluster_demand(sessions)
        
        # 3. Score candidates
        # For MVP, assume our defined ZONES are the existing stations
        existing_stations = ZONES
        
        candidates = self.scorer.score_candidates(clusters, existing_stations)
        
        return {"candidates": candidates}

"""Scoring engine for infrastructure siting candidates."""
import numpy as np
from typing import List, Dict, Any

class CandidateScorer:
    def __init__(self, min_session_threshold: int = 15):
        self.min_session_threshold = min_session_threshold
        # Weights: demand, growth, grid_capacity, distance (negative impact handled in formula)
        self.weights = {
            "demand": 0.35,
            "growth": 0.25,
            "grid_capacity": 0.20,
            "distance_penalty": 0.20
        }

    def _euclidean_distance(self, p1, p2):
        return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    def _normalize(self, values: List[float]) -> List[float]:
        """Min-Max normalize a list of values."""
        if not values:
            return []
        v_min = min(values)
        v_max = max(values)
        if v_max == v_min:
            return [1.0 if v_max > 0 else 0.0 for _ in values]
        return [(v - v_min) / (v_max - v_min) for v in values]

    def score_candidates(self, clusters: List[Dict[str, Any]], existing_stations: List[tuple]) -> List[Dict[str, Any]]:
        # Candidate Filtering
        valid_clusters = [c for c in clusters if c["session_count"] >= self.min_session_threshold]
        
        if not valid_clusters:
            return []

        raw_metrics = []
        for c in valid_clusters:
            # Demand
            demand = c["total_energy_kwh"]
            
            # Growth Proxy: recent (last 30%) / old (first 70%)
            sessions = c["sessions"]  # Already sorted by time
            split_idx = int(len(sessions) * 0.7)
            old_sessions_count = max(1, split_idx)
            recent_sessions_count = len(sessions) - split_idx
            growth = recent_sessions_count / old_sessions_count
            
            # Grid Capacity Proxy: 1 / demand_density
            grid_capacity = 1.0 / max(1.0, demand)
            
            # Distance Penalty
            centroid = c["centroid"]
            if existing_stations:
                distances = [self._euclidean_distance(centroid, st) for st in existing_stations]
                min_distance = min(distances)
            else:
                min_distance = 1.0 # Default if no known stations
                
            raw_metrics.append({
                "cluster_id": c["cluster_id"],
                "centroid": centroid,
                "demand": demand,
                "growth": growth,
                "grid_capacity": grid_capacity,
                "distance": min_distance
            })
            
        # Normalize metrics
        norm_demands = self._normalize([m["demand"] for m in raw_metrics])
        norm_growths = self._normalize([m["growth"] for m in raw_metrics])
        norm_grids = self._normalize([m["grid_capacity"] for m in raw_metrics])
        norm_distances = self._normalize([m["distance"] for m in raw_metrics])
        
        results = []
        for i, m in enumerate(raw_metrics):
            n_demand = norm_demands[i]
            n_growth = norm_growths[i]
            n_grid = norm_grids[i]
            n_distance = norm_distances[i]
            
            # Formula: score = w1*norm_demand + w2*norm_growth - w3*norm_distance + w4*norm_grid_capacity
            # Actually distance is a PENALTY. The user requested:
            # score = w1 * normalized_demand + w2 * normalized_growth - w3 * normalized_distance + w4 * normalized_grid_capacity
            # But wait, if distance is high, it's an underserved area! A new station should have a HIGHER score if distance is high!
            # The prompt said: w3 * distance_penalty (subtracted). Wait, if we penalize distance, we prefer putting stations near existing ones.
            # But the prompt also said reason: "Underserved area" (implies high distance is GOOD).
            # Let's strictly follow the user's formula: "- w3 * normalized_distance". 
            
            score = (
                self.weights["demand"] * n_demand +
                self.weights["growth"] * n_growth -
                self.weights["distance_penalty"] * n_distance +
                self.weights["grid_capacity"] * n_grid
            )
            
            # Generate structured reasons
            reasons = []
            if n_demand > 0.7:
                reasons.append("High demand")
            if n_growth > 0.7:
                reasons.append("Rapid growth")
            if n_distance > 0.7:
                reasons.append("Underserved area")
            if n_grid > 0.7:
                reasons.append("High available capacity")
                
            if not reasons:
                reasons.append("Balanced metrics")
                
            results.append({
                "location": f"{m['centroid'][0]:.4f}, {m['centroid'][1]:.4f}",
                "score": float(score),
                "reason": " + ".join(reasons)
            })
            
        # Sort descending by score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

"""Spatial clustering for infrastructure siting."""
import numpy as np
import hashlib
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any, Tuple

# Predefined zone anchors (Bangalore-like layout)
ZONES = [
    (12.9716, 77.5946),  # Central
    (12.9352, 77.6245),  # South-East
    (13.0358, 77.5970),  # North
    (12.9121, 77.6446),  # Far South-East
    (12.9850, 77.5500),  # West
]

class SpatialClusterer:
    def __init__(self, eps: float = 0.01, min_samples: int = 10):
        self.eps = eps
        self.min_samples = min_samples

    def _get_base_location(self, station_id: str) -> Tuple[float, float]:
        """Map station to a deterministic anchor zone."""
        hash_val = int(hashlib.md5(station_id.encode('utf-8')).hexdigest(), 16)
        return ZONES[hash_val % len(ZONES)]

    def generate_event_coordinates(self, sessions: List[Any]) -> List[Tuple[float, float, Any]]:
        """Generate spatial points for sessions with natural density variation."""
        # Use a fixed seed for reproducibility across multiple identical calls
        np.random.seed(42)
        
        points = []
        for s in sessions:
            base_lat, base_lon = self._get_base_location(s.station_id)
            lat = base_lat + np.random.normal(0, 0.0005)
            lon = base_lon + np.random.normal(0, 0.0005)
            points.append((lat, lon, s))
        return points

    def cluster_demand(self, sessions: List[Any]) -> List[Dict[str, Any]]:
        """Cluster high-demand areas using DBSCAN."""
        if not sessions:
            return []
            
        points_data = self.generate_event_coordinates(sessions)
        
        # Ensure points is purely lat/lon array for DBSCAN
        coords = np.array([[p[0], p[1]] for p in points_data])
        
        if len(coords) < self.min_samples:
            return [] # Cannot form even one cluster
            
        db = DBSCAN(eps=self.eps, min_samples=self.min_samples).fit(coords)
        labels = db.labels_
        
        # Group by cluster label (excluding noise: label == -1)
        clusters = {}
        for idx, label in enumerate(labels):
            if label == -1:
                continue
                
            lat, lon, session = points_data[idx]
            
            if label not in clusters:
                clusters[label] = {
                    "sessions": [],
                    "lats": [],
                    "lons": []
                }
                
            clusters[label]["sessions"].append(session)
            clusters[label]["lats"].append(lat)
            clusters[label]["lons"].append(lon)
            
        result = []
        for label, data in clusters.items():
            sessions_list = data["sessions"]
            
            # Sort chronologically to compute growth later
            sessions_list.sort(key=lambda x: x.start_time)
            
            total_energy = sum(s.energy_kwh for s in sessions_list)
            
            # Extract basic properties for scoring
            result.append({
                "cluster_id": str(label),
                "centroid": (float(np.mean(data["lats"])), float(np.mean(data["lons"]))),
                "session_count": len(sessions_list),
                "total_energy_kwh": total_energy,
                "sessions": sessions_list
            })
            
        return result

"""Dynamic Pricing Simulation."""
from typing import List, Dict, Any
from app.optimization.constraints import GridConstraints

class PricingSimulator:
    def __init__(self, base_price: float = 0.15, constraints: GridConstraints = GridConstraints()):
        self.base_price = base_price
        self.constraints = constraints
        
    def simulate_pricing(self, probabilistic_forecast: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Simulate pricing based on load.
        price = base_price * (load / capacity)
        We use p50 as the expected load for pricing.
        """
        if not probabilistic_forecast:
            return []
            
        capacity = self.constraints.MAX_CAPACITY_KW
        pricing_curve = []
        
        for f in probabilistic_forecast:
            load = f["p50"]
            
            # price = base_price * (load / capacity)
            # Add a floor to the price so it doesn't drop to exactly 0 if load is 0
            ratio = load / capacity
            # Make the price dynamic but bounded
            multiplier = max(0.5, ratio * 2.0) # e.g. at 50% capacity, multiplier is 1.0.
            
            price = self.base_price * multiplier
            
            pricing_curve.append({
                "timestamp": f["timestamp"],
                "price": round(price, 4)
            })
            
        return pricing_curve

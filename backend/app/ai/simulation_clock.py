from datetime import datetime
import random
from app.utils.config import config

class SimulationClock:
    """Time-Coherent Simulation"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SimulationClock, cls).__new__(cls)
            cls._instance.last_tick = datetime.now()
            cls._instance.ticks = 0
        return cls._instance

    def tick(self) -> float:
        """Returns a small delta to evolve state smoothly. Returns 0 if frozen."""
        if config.FREEZE_DEMO_STATE:
            return 0.0

        now = datetime.now()
        self.last_tick = now
        self.ticks += 1
        
        # small random walk drift
        return random.uniform(-0.02, 0.02) # +/- 2% drift

simulation_clock = SimulationClock()

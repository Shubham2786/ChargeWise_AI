from app.utils.config import config

class ScenarioEngine:
    """Deterministic Scenario Engine"""
    SCENARIO_MULTIPLIERS = {
        "NORMAL": 1.0,
        "HIGH_LOAD": 1.35,
        "CRITICAL_GRID": 1.8,
        "FESTIVAL_TRAFFIC": 1.55,
        "RAINY_DAY": 0.72,
        "WEEKEND": 0.85,
    }

    @classmethod
    def get_multiplier(cls) -> float:
        return cls.SCENARIO_MULTIPLIERS.get(config.SCENARIO_MODE, 1.0)

    @classmethod
    def apply(cls, base_value: float) -> float:
        return base_value * cls.get_multiplier()

scenario_engine = ScenarioEngine()

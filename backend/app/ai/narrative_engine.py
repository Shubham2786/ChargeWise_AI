from app.utils.config import config

class NarrativeEngine:
    """Narrative Consistency Layer"""
    GLOBAL_CONTEXTS = {
        "NORMAL": {"weather": "clear", "event": "none", "renewables": "optimal"},
        "HIGH_LOAD": {"weather": "heatwave", "event": "none", "renewables": "moderate"},
        "CRITICAL_GRID": {"weather": "heatwave", "event": "power plant maintenance", "renewables": "low"},
        "FESTIVAL_TRAFFIC": {"weather": "clear", "event": "festival traffic", "renewables": "optimal"},
        "RAINY_DAY": {"weather": "heavy rain", "event": "none", "renewables": "minimal solar"},
        "WEEKEND": {"weather": "clear", "event": "weekend getaway", "renewables": "optimal"},
    }

    @classmethod
    def get_context(cls) -> dict:
        return cls.GLOBAL_CONTEXTS.get(config.SCENARIO_MODE, cls.GLOBAL_CONTEXTS["NORMAL"])

from datetime import datetime
from typing import Dict, Any

class StateStore:
    """Unified Synthetic State Store as a singleton source of truth."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StateStore, cls).__new__(cls)
            cls._instance.state = {
                "last_updated": datetime.now(),
                "forecast": None,
                "risk": None,
                "pricing": None,
                "scheduling": None,
                "anomalies": []
            }
        return cls._instance

    def update(self, key: str, value: Any):
        self.state[key] = value
        self.state["last_updated"] = datetime.now()

    def get(self, key: str) -> Any:
        return self.state.get(key)

    def get_all(self) -> Dict[str, Any]:
        return self.state

state_store = StateStore()

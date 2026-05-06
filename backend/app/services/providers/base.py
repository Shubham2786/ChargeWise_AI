"""
Abstract Provider Base Classes — stable interfaces for domain services.

API routes depend ONLY on these abstract interfaces.
Concrete implementations (Groq, XGBoost, telemetry) live in subdirectories.
Swap providers by changing the resolver — no frontend or route changes needed.
"""
from abc import ABC, abstractmethod


class ForecastProvider(ABC):
    """Abstract forecast provider. Implement for each data source."""

    @abstractmethod
    async def get_forecast(self, zone: str = "Zone_A") -> dict:
        """
        Returns:
            {
                "predictions": List[float],   # 24-hour load forecast
                "peak_hour": int,             # hour index of peak
                "p10": List[float],           # optional lower percentile
                "p50": List[float],           # optional median
                "p90": List[float],           # optional upper percentile
            }
        """
        ...


class RiskProvider(ABC):
    """Abstract risk detection provider."""

    @abstractmethod
    async def detect_risk(self, max_load: float) -> dict:
        """
        Returns:
            {
                "risk_level": str,          # LOW | MEDIUM | HIGH | CRITICAL
                "max_load": float,
                "capacity_percent": float,
                "risk_score": float,
                "risk_factors": List[str],
            }
        """
        ...


class SchedulerProvider(ABC):
    """Abstract smart scheduling provider."""

    @abstractmethod
    async def optimize_schedule(self, before: list) -> dict:
        """
        Returns:
            {
                "before": List[float],          # original 24h curve
                "after": List[float],           # optimized 24h curve
                "improvement_percent": float,
            }
        """
        ...

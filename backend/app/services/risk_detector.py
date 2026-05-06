"""
Risk Detector Service — Provider Resolver

Selects the active RiskProvider based on USE_AI_DEMO_DATA config flag.
The API route (routes/risk.py) remains completely unchanged.

Future migration: set USE_AI_DEMO_DATA=False to restore original threshold logic.
"""
import asyncio
import logging
from app.utils.config import config

logger = logging.getLogger(__name__)

_groq_provider = None
_xgboost_provider = None


def _get_provider():
    global _groq_provider, _xgboost_provider
    if config.USE_AI_DEMO_DATA:
        if _groq_provider is None:
            from app.ai.providers.groq_risk import GroqRiskProvider
            _groq_provider = GroqRiskProvider()
        return _groq_provider
    else:
        return None  # Use inline logic below


def _detect_risk_xgboost():
    """Original threshold-based risk detection (real production logic)."""
    from app.services.forecaster import get_forecast
    forecast = get_forecast()
    predictions = forecast["predictions"]
    max_load = max(predictions)
    percent = (max_load / config.MAX_CAPACITY) * 100

    if percent > config.RISK_HIGH_THRESHOLD:
        risk_level = "HIGH"
    elif percent > config.RISK_MEDIUM_THRESHOLD:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "risk_level": risk_level,
        "max_load": round(max_load, 2),
        "capacity_percent": round(percent, 2),
    }


def detect_risk() -> dict:
    """
    Resolve and call the active RiskProvider.
    Returns dict with 'risk_level', 'max_load', 'capacity_percent'.
    """
    provider = _get_provider()

    if provider is None:
        return _detect_risk_xgboost()

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, provider.detect_risk())
                return future.result(timeout=10)
        else:
            return loop.run_until_complete(provider.detect_risk())
    except Exception as e:
        logger.error(f"[RiskResolver] Provider failed: {e}, falling back to XGBoost")
        return _detect_risk_xgboost()

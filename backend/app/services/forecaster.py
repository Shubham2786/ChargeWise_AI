"""
Forecast Service — Provider Resolver

Selects the active ForecastProvider based on USE_AI_DEMO_DATA config flag.
The API route (routes/forecast.py) remains completely unchanged.

Future migration: set USE_AI_DEMO_DATA=False and point to a real ML provider.
"""
import asyncio
import logging
from app.utils.config import config

logger = logging.getLogger(__name__)

# Provider singletons — instantiated lazily on first request
_groq_provider = None
_xgboost_provider = None

# Expose module-level model/last_data for backward compatibility with explainer.py
model = None
last_data = None


def _get_provider():
    """Resolve and return the active forecast provider."""
    global _groq_provider, _xgboost_provider, model, last_data

    if config.USE_AI_DEMO_DATA:
        if _groq_provider is None:
            from app.ai.providers.groq_forecast import GroqForecastProvider
            _groq_provider = GroqForecastProvider()
        return _groq_provider
    else:
        if _xgboost_provider is None:
            from app.services.providers.xgboost_forecast import XGBoostForecastProvider
            _xgboost_provider = XGBoostForecastProvider()
            # keep module-level refs in sync for explainer.py backward-compat
            model = _xgboost_provider._model
            last_data = _xgboost_provider._last_data
        return _xgboost_provider


def get_forecast(zone: str = "Zone_A") -> dict:
    """
    Resolve and call the active ForecastProvider.
    Returns a dict with 'predictions' (List[float]) and 'peak_hour' (int).
    """
    provider = _get_provider()

    # Run async provider in a sync context (FastAPI route compatibility)
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Already inside an async context (e.g., async FastAPI route)
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, provider.get_forecast(zone))
                return future.result(timeout=10)
        else:
            return loop.run_until_complete(provider.get_forecast(zone))
    except Exception as e:
        logger.error(f"[ForecastResolver] Provider failed: {e}, using local fallback")
        from app.ai.local_demo_generator import LocalDemoGenerator
        return LocalDemoGenerator.generate_forecast()

"""
Scheduler Service — Provider Resolver

Selects the active SchedulerProvider based on USE_AI_DEMO_DATA config flag.
The API route (routes/schedule.py) remains completely unchanged.

Future migration: set USE_AI_DEMO_DATA=False to restore EDF/LP optimizer logic.
"""
import asyncio
import logging
from app.utils.config import config

logger = logging.getLogger(__name__)

_groq_provider = None


def _get_provider():
    global _groq_provider
    if config.USE_AI_DEMO_DATA:
        if _groq_provider is None:
            from app.ai.providers.groq_scheduler import GroqSchedulerProvider
            _groq_provider = GroqSchedulerProvider()
        return _groq_provider
    return None


def _optimize_schedule_xgboost():
    """Original load-shifting scheduling logic (real production logic)."""
    from app.services.forecaster import get_forecast
    from app.services.risk_detector import detect_risk
    forecast = get_forecast()
    risk = detect_risk()

    before = forecast["predictions"]
    after = before.copy()

    if risk["risk_level"] == "HIGH":
        for i in range(config.EV_SPIKE_START_HOUR, config.EV_SPIKE_END_HOUR):
            if i < len(after):
                shift_amount = after[i] * config.LOAD_SHIFT_PERCENT
                after[i] -= shift_amount
                if i + 4 < len(after):
                    after[i + 4] += shift_amount

    before_peak = max(before)
    after_peak = max(after)
    improvement = ((before_peak - after_peak) / before_peak) * 100 if before_peak > 0 else 0

    return {
        "before": [round(x, 2) for x in before],
        "after": [round(x, 2) for x in after],
        "improvement_percent": round(improvement, 2),
    }


def optimize_schedule() -> dict:
    """
    Resolve and call the active SchedulerProvider.
    Returns dict with 'before', 'after', 'improvement_percent'.
    """
    provider = _get_provider()

    if provider is None:
        return _optimize_schedule_xgboost()

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, provider.optimize_schedule())
                return future.result(timeout=10)
        else:
            return loop.run_until_complete(provider.optimize_schedule())
    except Exception as e:
        logger.error(f"[SchedulerResolver] Provider failed: {e}, falling back to XGBoost")
        return _optimize_schedule_xgboost()

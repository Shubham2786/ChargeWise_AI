"""
Groq Forecast Provider — TEMPORARY_PROVIDER / DEMO_ONLY

Flow:
  state_store (baseline) → scenario_engine (multiplier) →
  prompt_templates → groq_client → post_processing → ForecastSchema

Removing this file and switching USE_AI_DEMO_DATA=False
will fall back seamlessly to XGBoostForecastProvider.
"""
import numpy as np
import logging

from app.services.providers.base import ForecastProvider
from app.ai import groq_client
from app.ai.prompt_templates import build_forecast_prompt
from app.ai.post_processing import MathematicalPostProcessor
from app.ai.scenario_engine import ScenarioEngine
from app.ai.state_store import state_store
from app.ai.schemas.forecast_schema import ForecastSchema
from app.ai.local_demo_generator import LocalDemoGenerator

logger = logging.getLogger(__name__)


class GroqForecastProvider(ForecastProvider):
    """
    TEMPORARY_PROVIDER: Groq-backed AI synthetic forecast generation.

    Designed for complete removal when real telemetry replaces demo data.
    Annotated as DEMO_ONLY throughout to prevent accidental production use.
    """

    async def get_forecast(self, zone: str = "Zone_A") -> dict:  # DEMO_ONLY
        # 1. Get baseline from state store (time-coherent evolution)
        cached_state = state_store.get("forecast")

        # 2. Build prompts with scenario context, seed, and narrative
        system_prompt, user_prompt = build_forecast_prompt(zone)

        # 3. Call Groq with coalescing, cache, and fallback
        raw = await groq_client.generate(
            feature="forecast",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_fn=LocalDemoGenerator.generate_forecast,
        )

        # 4. Mathematical post-processing
        if "predictions" in raw:
            raw["predictions"] = MathematicalPostProcessor.process_forecast(
                raw["predictions"]
            )

        # 5. Validate and auto-repair with Pydantic schema
        try:
            validated = ForecastSchema(**raw)
            result = validated.model_dump()
        except Exception as e:
            logger.warning(f"[GroqForecast] Schema validation failed: {e}, using fallback")
            result = LocalDemoGenerator.generate_forecast()

        # 6. Apply scenario multiplier to any remaining raw values (safety net)
        multiplier = ScenarioEngine.get_multiplier()
        result["predictions"] = [
            round(min(v * multiplier, 220), 2)
            if multiplier != 1.0 and cached_state is None
            else v
            for v in result["predictions"]
        ]

        # 7. Update state store for time-coherent future evolution
        state_store.update("forecast", result)

        return result

"""
Groq Scheduler Provider — TEMPORARY_PROVIDER / DEMO_ONLY

Flow:
  state_store (forecast) → prompt_templates → groq_client →
  post_processing → SchedulingSchema
"""
import logging

from app.services.providers.base import SchedulerProvider
from app.ai import groq_client
from app.ai.prompt_templates import build_scheduling_prompt
from app.ai.post_processing import MathematicalPostProcessor
from app.ai.state_store import state_store
from app.ai.schemas.scheduling_schema import SchedulingSchema
from app.ai.local_demo_generator import LocalDemoGenerator

logger = logging.getLogger(__name__)


class GroqSchedulerProvider(SchedulerProvider):
    """TEMPORARY_PROVIDER: Groq-backed smart scheduling generation."""

    async def optimize_schedule(self, before: list = None) -> dict:  # DEMO_ONLY
        # Pull baseline from shared state store for consistency
        forecast_state = state_store.get("forecast")
        if before is None:
            before = (
                forecast_state["predictions"]
                if forecast_state and "predictions" in forecast_state
                else [70.0] * 24
            )

        system_prompt, user_prompt = build_scheduling_prompt(before)

        raw = await groq_client.generate(
            feature="scheduling",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        # Inject the real baseline if Groq tried to replace it
        raw["before"] = before

        # Post-process the 'after' curve
        if "after" in raw:
            raw["after"] = MathematicalPostProcessor.process_forecast(raw["after"])

        try:
            validated = SchedulingSchema(**raw)
            result = validated.model_dump()
        except Exception as e:
            logger.warning(f"[GroqScheduler] Schema validation failed: {e}, using fallback")
            after = [max(0, v * 0.82) for v in before]
            result = {
                "before": [round(v, 2) for v in before],
                "after": [round(v, 2) for v in after],
                "improvement_percent": 18.0,
            }

        state_store.update("scheduling", result)
        return result

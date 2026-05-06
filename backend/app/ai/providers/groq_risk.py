"""
Groq Risk Provider — TEMPORARY_PROVIDER / DEMO_ONLY

Flow:
  state_store (forecast baseline) → prompt_templates → groq_client →
  post_processing → RiskSchema

Removing this file and switching USE_AI_DEMO_DATA=False
will fall back seamlessly to the existing risk_detector logic.
"""
import logging

from app.services.providers.base import RiskProvider
from app.ai import groq_client
from app.ai.prompt_templates import build_risk_prompt
from app.ai.state_store import state_store
from app.ai.schemas.risk_schema import RiskSchema
from app.ai.local_demo_generator import LocalDemoGenerator
from app.utils.config import config

logger = logging.getLogger(__name__)


class GroqRiskProvider(RiskProvider):
    """TEMPORARY_PROVIDER: Groq-backed risk assessment generation."""

    async def detect_risk(self, max_load: float = 80.0) -> dict:  # DEMO_ONLY
        # Use state store's latest forecast peak if available
        forecast_state = state_store.get("forecast")
        if forecast_state and "predictions" in forecast_state:
            max_load = max(forecast_state["predictions"])

        system_prompt, user_prompt = build_risk_prompt(max_load)

        raw = await groq_client.generate(
            feature="risk",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_fn=LocalDemoGenerator.generate_risk,
        )

        try:
            validated = RiskSchema(**raw)
            result = validated.model_dump()
        except Exception as e:
            logger.warning(f"[GroqRisk] Schema validation failed: {e}, using fallback")
            result = LocalDemoGenerator.generate_risk()

        state_store.update("risk", result)
        return result

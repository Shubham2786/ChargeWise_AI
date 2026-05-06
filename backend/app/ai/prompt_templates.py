"""
Structured Prompt Templates — DEMO_ONLY / PROTOTYPE_LAYER

All prompts include:
- PROMPT_VERSION for cache invalidation and debugging
- Deterministic seed injection for stable chart outputs
- Strict numerical constraints to prevent LLM hallucinations
- Scenario and narrative context injection

Replace this module with real model inference calls during production migration.
"""
from datetime import datetime
from app.ai.scenario_engine import ScenarioEngine
from app.ai.narrative_engine import NarrativeEngine
from app.utils.config import config

# Version bump triggers cache invalidation for all cached Groq responses
PROMPT_VERSION = "v1"


def _seed(feature_name: str) -> int:
    """
    Generate deterministic seed from feature name + current hour.
    Same hour always yields same stable chart — prevents jitter on refresh.
    """
    current_hour = datetime.now().hour
    return abs(hash(f"{feature_name}:{current_hour}:{PROMPT_VERSION}")) % 99999


def build_forecast_prompt(zone: str = "Zone_A") -> tuple[str, str]:
    """Returns (system_prompt, user_prompt) for EV load forecast generation."""
    ctx = NarrativeEngine.get_context()
    multiplier = ScenarioEngine.get_multiplier()
    seed = _seed(f"forecast:{zone}")
    scenario = config.SCENARIO_MODE

    system_prompt = f"""You are a power grid AI assistant generating realistic 24-hour EV load forecasts.
You MUST return a valid JSON object only — no markdown, no explanation text.
Prompt version: {PROMPT_VERSION}

SCENARIO: {scenario}
CONTEXT: Weather={ctx['weather']}, Event={ctx['event']}, Renewables={ctx['renewables']}
LOAD MULTIPLIER: {multiplier:.2f}x versus normal baseline

STRICT NUMERICAL CONSTRAINTS:
- Predictions array: exactly 24 float values
- Each value: between 30 and {config.MAX_GRID_LOAD} kWh
- Peak load must occur between hours 17-23 (5PM-11PM)
- Overnight load (hours 0-6) must be below 45% of peak value
- Values must be smooth — avoid sudden jumps greater than 25 kWh between consecutive hours
- No negative values under any circumstance
- Apply {multiplier:.2f}x multiplier to normal baseline of 70 kWh
- Use deterministic randomness based on seed: {seed}

OUTPUT JSON FORMAT:
{{
  "predictions": [<24 floats>],
  "peak_hour": <int 0-23>,
  "p10": [<24 floats, lower bound>],
  "p50": [<24 floats, median>],
  "p90": [<24 floats, upper bound>]
}}"""

    user_prompt = (
        f"Generate a 24-hour EV load forecast for grid zone {zone} "
        f"under {scenario} scenario conditions. "
        f"Context: {ctx}. Apply {multiplier:.2f}x load multiplier."
    )
    return system_prompt, user_prompt


def build_risk_prompt(max_load: float) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt) for risk assessment generation."""
    ctx = NarrativeEngine.get_context()
    multiplier = ScenarioEngine.get_multiplier()
    seed = _seed("risk")
    scenario = config.SCENARIO_MODE

    system_prompt = f"""You are a power grid risk assessment AI.
You MUST return a valid JSON object only — no markdown, no explanation text.
Prompt version: {PROMPT_VERSION}

SCENARIO: {scenario}
CONTEXT: Weather={ctx['weather']}, Event={ctx['event']}, Renewables={ctx['renewables']}
OBSERVED MAX LOAD: {max_load:.1f} kWh

STRICT NUMERICAL CONSTRAINTS:
- risk_level: one of "LOW", "MEDIUM", "HIGH", "CRITICAL"
- max_load: between 30 and {config.MAX_GRID_LOAD} kWh
- capacity_percent: 0 to 100
- risk_score: 0 to {config.MAX_RISK_SCORE}
- For CRITICAL_GRID scenario, risk_score must be above 80
- For NORMAL scenario, risk_score must be below 40
- risk_factors: 2-4 concise strings describing contributing factors
- Use deterministic randomness based on seed: {seed}

OUTPUT JSON FORMAT:
{{
  "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "max_load": <float>,
  "capacity_percent": <float>,
  "risk_score": <float 0-100>,
  "risk_factors": ["<factor1>", "<factor2>"]
}}"""

    user_prompt = (
        f"Assess grid risk for {scenario} scenario with observed max load {max_load:.1f} kWh. "
        f"Context: {ctx}."
    )
    return system_prompt, user_prompt


def build_scheduling_prompt(before: list) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt) for smart scheduling generation."""
    ctx = NarrativeEngine.get_context()
    seed = _seed("scheduling")
    scenario = config.SCENARIO_MODE
    peak_before = max(before) if before else 80

    system_prompt = f"""You are a smart EV charging scheduler AI.
You MUST return a valid JSON object only — no markdown, no explanation text.
Prompt version: {PROMPT_VERSION}

SCENARIO: {scenario}
CONTEXT: Weather={ctx['weather']}, Event={ctx['event']}, Renewables={ctx['renewables']}
BASELINE PEAK LOAD: {peak_before:.1f} kWh

STRICT NUMERICAL CONSTRAINTS:
- before: exactly 24 floats (the input baseline — use the provided values)
- after: exactly 24 floats (the optimized schedule)
- No value in after may exceed the corresponding before value by more than 10%
- improvement_percent: 5 to {config.MAX_PEAK_REDUCTION} (real optimization, not fake 99%)
- For HIGH_LOAD/CRITICAL_GRID, improvement_percent should be 25-45
- All values between 0 and {config.MAX_GRID_LOAD} kWh
- Use deterministic randomness based on seed: {seed}

OUTPUT JSON FORMAT:
{{
  "before": [<24 floats>],
  "after": [<24 floats>],
  "improvement_percent": <float>
}}"""

    user_prompt = (
        f"Optimize EV charging schedule under {scenario} scenario. "
        f"Shift peak hours 18-22 load to off-peak. Context: {ctx}."
    )
    return system_prompt, user_prompt

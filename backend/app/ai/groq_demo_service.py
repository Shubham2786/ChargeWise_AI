"""
GroqDemoService — Unified Groq-powered data generator for all /v1/* endpoints.

When USE_AI_DEMO_DATA=True, all ChargeWise API routes return Groq-generated
realistic dummy data instead of querying the database or running ML models.

Architecture:
  - Single async service with per-feature generation methods
  - All data is time-coherent (shared state via state_store)
  - Groq generates the "seed" data; post-processing enforces constraints
  - Deterministic fallbacks ensure the UI never breaks
"""
import asyncio
import logging
import math
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from app.ai import groq_client
from app.ai.state_store import state_store
from app.ai.scenario_engine import ScenarioEngine
from app.ai.narrative_engine import NarrativeEngine
from app.ai.post_processing import MathematicalPostProcessor
from app.utils.config import config

logger = logging.getLogger(__name__)

# ── Bangalore EV charging zones (realistic coordinates) ──────────────────────
BANGALORE_ZONES = [
    {"name": "Koramangala",    "lat": 12.9352, "lon": 77.6245, "tier": "premium"},
    {"name": "Whitefield",     "lat": 12.9698, "lon": 77.7499, "tier": "tech_hub"},
    {"name": "Indiranagar",    "lat": 12.9784, "lon": 77.6408, "tier": "premium"},
    {"name": "HSR Layout",     "lat": 12.9116, "lon": 77.6412, "tier": "residential"},
    {"name": "Electronic City","lat": 12.8399, "lon": 77.6770, "tier": "industrial"},
    {"name": "Marathahalli",   "lat": 12.9591, "lon": 77.6974, "tier": "tech_hub"},
    {"name": "Hebbal",         "lat": 13.0358, "lon": 77.5970, "tier": "mixed"},
]

STATION_IDS = ["ACN-BLR-001", "ACN-BLR-002", "ACN-BLR-003", "ACN-BLR-004", "ACN-BLR-005"]


# ── Deterministic noise helper ────────────────────────────────────────────────
def _noise(x: float, amp: float = 1.0) -> float:
    return math.sin(x * 127.1 + 311.7) * math.cos(x * 269.5 + 183.3) * amp


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ── Fallback generators (NumPy-free, pure Python) ────────────────────────────
def _fallback_probabilistic(horizon: int = 24) -> List[dict]:
    now = _now_utc()
    result = []
    multiplier = ScenarioEngine.get_multiplier()
    for i in range(horizon):
        # Start from next hour so all forecast points are in the future
        h = (now.hour + i + 1) % 24
        evening = max(0, math.sin(math.pi * ((h - 15) / 8))) * 90
        morning = max(0, math.sin(math.pi * ((h - 6) / 6))) * 30
        base = (22 + morning + evening + _noise(h, 5)) * multiplier
        spread = 12 + (18 if 17 <= h <= 21 else 0)
        p50 = max(10, base)
        p10 = max(5, p50 - spread * 0.7)
        p90 = p50 + spread * 1.1
        ts = now + timedelta(hours=i + 1)
        ts = ts.replace(minute=0, second=0, microsecond=0)
        result.append({
            "timestamp": ts.isoformat(),
            "p10": round(p10, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "explanation": (
                f"Evening residential EV charging surge at {h}:00"
                if 17 <= h <= 21 else
                "Morning commercial charging activity" if 8 <= h <= 10 else
                "Low overnight baseline — fleet idle"
            ),
        })
    return result


def _fallback_risk(forecast: List[dict]) -> dict:
    max_p90 = max((f["p90"] for f in forecast), default=80)
    max_p50 = max((f["p50"] for f in forecast), default=60)
    capacity = 200.0
    if max_p90 > capacity:
        level, prob = "HIGH", min(0.95, 0.55 + (max_p90 - capacity) / capacity * 0.5)
    elif max_p50 > capacity * 0.8:
        level, prob = "MEDIUM", 0.35
    else:
        level, prob = "LOW", 0.08
    details = [
        {"timestamp": f["timestamp"], "risk": "HIGH" if f["p90"] > capacity else "MEDIUM" if f["p50"] > capacity * 0.8 else "LOW"}
        for f in forecast
    ]
    return {
        "risk_level": level,
        "probability": round(prob, 3),
        "max_load": round(max_p90, 2),
        "capacity_percent": round(min(100, max_p90 / capacity * 100), 2),
        "risk_score": round(min(100, prob * 100), 1),
        "risk_factors": ["Evening EV charging peak", "Fleet arrival clustering", "Reduced grid headroom"],
        "details": details,
    }


def _fallback_pricing(forecast: List[dict]) -> List[dict]:
    result = []
    for f in forecast:
        ratio = f["p50"] / 200.0
        inr = round(7 * (0.5 + ratio * 2.5) + _noise(f["p50"], 0.4), 2)
        inr = max(3.5, min(inr, 18.0))
        result.append({
            "timestamp": f["timestamp"],
            "price": inr,
            "price_inr": inr,
            "price_usd": round(inr * 0.012, 4),
            "load_kw": f["p50"],
        })
    return result


def _fallback_schedule(forecast: List[dict]) -> dict:
    before = [f["p50"] * 1.45 for f in forecast]
    after = []
    for i, v in enumerate(before):
        h = (datetime.fromisoformat(forecast[i]["timestamp"]).hour) if forecast else i
        if 18 <= h <= 22:
            after.append(round(v * 0.72, 2))
        else:
            after.append(round(min(v * 1.08, 164), 2))
    peak_before = max(before)
    peak_after = max(after)
    reduction = ((peak_before - peak_after) / peak_before * 100) if peak_before > 0 else 0
    schedule_items = []
    for i, f in enumerate(forecast):
        schedule_items.append({
            "timestamp": f["timestamp"],
            "uncontrolled_load_kw": round(before[i], 2),
            "total_load_kw": round(after[i], 2),
            "status": "at_risk" if after[i] > 164 else "normal",
            "session_allocations": {},
        })
    return {
        "schedule": schedule_items,
        "peak_reduction_percent": round(reduction, 1),
        "uncontrolled_peak": round(peak_before, 1),
        "optimized_peak": round(peak_after, 1),
        "strategy": "Hybrid EDF — shift 18-22h load to off-peak windows",
        "at_risk": peak_after > 164,
    }


def _fallback_anomalies(forecast: List[dict]) -> List[dict]:
    spike_hours = [7, 14, 20]
    result = []
    for h in spike_hours[:2]:
        if h < len(forecast):
            f = forecast[h]
            actual = round(f["p90"] * 1.35 + _noise(h, 8), 1)
            result.append({
                "timestamp": f["timestamp"],
                "anomaly": True,
                "actual": actual,
                "expected_p90": f["p90"],
                "reason": (
                    f"Morning surge — {actual:.0f} kW exceeded safety bound of {f['p90'] * 1.2:.0f} kW"
                    if h < 10 else
                    "Midday fleet arrival at commercial hub exceeded P90 threshold"
                    if h < 16 else
                    f"Evening peak overrun — {actual:.0f} kW vs expected {f['p90']:.0f} kW"
                ),
            })
    return result


def _fallback_planning() -> List[dict]:
    result = []
    for i, z in enumerate(BANGALORE_ZONES):
        demand = 0.55 + _noise(i, 0.3)
        growth = 0.40 + _noise(i * 3, 0.35)
        score = min(0.98, max(0.45, demand * 0.45 + growth * 0.35 + 0.2))
        reasons = []
        if demand > 0.6: reasons.append("High EV demand density")
        if growth > 0.5: reasons.append("Rapid fleet growth")
        if z["tier"] in ("tech_hub", "premium"): reasons.append("High-income EV adoption zone")
        if not reasons: reasons.append("Balanced infrastructure metrics")
        result.append({
            "location": f"{z['lat']:.4f}, {z['lon']:.4f}",
            "zone_name": z["name"],
            "score": round(score, 3),
            "score_pct": round(score * 100),
            "reason": " + ".join(reasons),
            "lat": z["lat"],
            "lon": z["lon"],
            "tier": z["tier"],
        })
    return sorted(result, key=lambda x: x["score"], reverse=True)


def _fallback_sessions(limit: int = 100) -> List[dict]:
    now = _now_utc()
    sessions = []
    for i in range(min(limit, 50)):
        station = STATION_IDS[i % len(STATION_IDS)]
        start = now - timedelta(hours=i * 0.5 + _noise(i, 0.3))
        duration = int(45 + _noise(i * 7, 20))
        energy = round(max(2, 8 + _noise(i * 3, 4)), 2)
        sessions.append({
            "id": i + 1,
            "station_id": station,
            "start_time": start.isoformat(),
            "end_time": (start + timedelta(minutes=duration)).isoformat(),
            "energy_kwh": energy,
            "max_power_kw": round(energy / (duration / 60) * 1.2, 2),
            "duration_minutes": duration,
        })
    return sessions


def _fallback_load(limit: int = 288) -> List[dict]:
    now = _now_utc()
    result = []
    for i in range(min(limit, 288)):
        ts = now - timedelta(minutes=i * 5)
        h = ts.hour
        evening = max(0, math.sin(math.pi * ((h - 15) / 8))) * 95
        morning = max(0, math.sin(math.pi * ((h - 6) / 6))) * 35
        load = max(15, 20 + morning + evening + _noise(i, 6))
        result.append({
            "id": i + 1,
            "feeder_id": "FEEDER-BLR-01",
            "timestamp": ts.isoformat(),
            "load_kw": round(load, 2),
        })
    return list(reversed(result))


# ── Groq prompt builders for new features ────────────────────────────────────

def _build_probabilistic_prompt(horizon: int, zone: str) -> tuple[str, str]:
    ctx = NarrativeEngine.get_context()
    multiplier = ScenarioEngine.get_multiplier()
    scenario = config.SCENARIO_MODE
    seed = abs(hash(f"prob:{zone}:{datetime.now().hour}")) % 99999

    system = f"""You are a power grid AI generating realistic probabilistic EV load forecasts for Bangalore, India.
Return ONLY a valid JSON object. No markdown, no explanation.
SCENARIO: {scenario} | MULTIPLIER: {multiplier:.2f}x | SEED: {seed}
CONTEXT: weather={ctx['weather']}, event={ctx['event']}, renewables={ctx['renewables']}

CONSTRAINTS:
- "forecast" array: exactly {horizon} objects
- Each object: timestamp (ISO8601), p10 (float), p50 (float), p90 (float), explanation (string)
- p10 < p50 < p90 always
- p50 range: 25-{config.MAX_GRID_LOAD} kWh
- Peak (p50) between hours 17-22, overnight below 45 kWh
- Spread (p90-p10) widens to 25-35 during peak hours, narrows to 8-15 overnight
- Apply {multiplier:.2f}x to baseline of 65 kWh
- explanations: 1 sentence, mention specific driver (time-of-day, weather, fleet behavior)

OUTPUT FORMAT:
{{"forecast": [{{"timestamp": "<ISO>", "p10": <float>, "p50": <float>, "p90": <float>, "explanation": "<str>"}}]}}"""

    user = f"Generate {horizon}-hour probabilistic EV load forecast for {zone} under {scenario} conditions. Context: {ctx}."
    return system, user


def _build_pricing_prompt(forecast_summary: dict) -> tuple[str, str]:
    ctx = NarrativeEngine.get_context()
    scenario = config.SCENARIO_MODE
    seed = abs(hash(f"pricing:{datetime.now().hour}")) % 99999

    system = f"""You are a dynamic electricity pricing AI for an Indian EV grid operator.
Return ONLY a valid JSON object. No markdown, no explanation.
SCENARIO: {scenario} | SEED: {seed}
CONTEXT: weather={ctx['weather']}, event={ctx['event']}
PEAK_LOAD: {forecast_summary.get('peak_p50', 80):.1f} kWh

CONSTRAINTS:
- "pricing" array: exactly 24 objects
- Each: timestamp (ISO8601), price_inr (float), price_usd (float)
- price_inr range: 4.50 to {config.MAX_PRICE:.1f} INR/kWh
- price_usd = price_inr * 0.012
- Peak pricing (18-22h): 11-{config.MAX_PRICE:.1f} INR/kWh
- Off-peak (0-6h): 4.50-6.50 INR/kWh
- Smooth curve — no sudden jumps > 2 INR between consecutive hours
- DR events: at least 3 hours above 11 INR during evening peak

OUTPUT FORMAT:
{{"pricing": [{{"timestamp": "<ISO>", "price_inr": <float>, "price_usd": <float>}}]}}"""

    user = f"Generate 24-hour dynamic pricing curve for {scenario} scenario. Peak load: {forecast_summary.get('peak_p50', 80):.1f} kWh."
    return system, user


def _build_planning_prompt() -> tuple[str, str]:
    ctx = NarrativeEngine.get_context()
    scenario = config.SCENARIO_MODE
    seed = abs(hash(f"planning:{datetime.now().hour}")) % 99999

    zones_str = ", ".join(z["name"] for z in BANGALORE_ZONES)

    system = f"""You are an EV infrastructure planning AI for Bangalore, India.
Return ONLY a valid JSON object. No markdown, no explanation.
SCENARIO: {scenario} | SEED: {seed}
CONTEXT: weather={ctx['weather']}, event={ctx['event']}

CONSTRAINTS:
- "candidates" array: exactly 7 objects (one per zone)
- Zones: {zones_str}
- Each: zone_name (str), score (float 0.45-0.98), score_pct (int), reason (str), lat (float), lon (float)
- Scores must vary realistically — tech hubs and premium zones score higher
- reason: 1-2 sentences mentioning demand density, growth rate, or infrastructure gap
- Sort by score descending

ZONE COORDINATES (use these exactly):
Koramangala: 12.9352, 77.6245 | Whitefield: 12.9698, 77.7499 | Indiranagar: 12.9784, 77.6408
HSR Layout: 12.9116, 77.6412 | Electronic City: 12.8399, 77.6770 | Marathahalli: 12.9591, 77.6974
Hebbal: 13.0358, 77.5970

OUTPUT FORMAT:
{{"candidates": [{{"zone_name": "<str>", "score": <float>, "score_pct": <int>, "reason": "<str>", "lat": <float>, "lon": <float>}}]}}"""

    user = f"Identify top EV charging infrastructure candidates in Bangalore under {scenario} scenario."
    return system, user


# ── Main GroqDemoService ──────────────────────────────────────────────────────

class GroqDemoService:
    """
    Unified Groq-powered demo data service.
    All /v1/* endpoints delegate here when USE_AI_DEMO_DATA=True.
    """

    async def get_probabilistic_forecast(self, horizon: int = 24, zone: str = "Zone_A") -> List[dict]:
        """Returns list of {timestamp, p10, p50, p90, explanation} dicts."""
        # Check state store for cached result
        cached = state_store.get("prob_forecast")
        if cached and len(cached) >= horizon:
            return cached[:horizon]

        system, user = _build_probabilistic_prompt(horizon, zone)
        raw = await groq_client.generate(
            feature="prob_forecast",
            system_prompt=system,
            user_prompt=user,
            fallback_fn=lambda: {"forecast": _fallback_probabilistic(horizon)},
        )

        forecast = raw.get("forecast", [])
        if not forecast or len(forecast) < horizon:
            forecast = _fallback_probabilistic(horizon)

        # Post-process: enforce p10 <= p50 <= p90, clip negatives
        now = _now_utc()
        processed = []
        for i, f in enumerate(forecast[:horizon]):
            p10 = max(0, float(f.get("p10", 20)))
            p50 = max(0, float(f.get("p50", 50)))
            p90 = max(0, float(f.get("p90", 80)))
            p10, p50, p90 = sorted([p10, p50, p90])
            p90 = min(p90, config.MAX_GRID_LOAD)
            # Start from next hour so all forecast points are in the future
            ts = now + timedelta(hours=i + 1)
            ts = ts.replace(minute=0, second=0, microsecond=0)
            processed.append({
                "timestamp": ts.isoformat(),
                "p10": round(p10, 2),
                "p50": round(p50, 2),
                "p90": round(p90, 2),
                "explanation": f.get("explanation", "Baseline load driven by historical patterns."),
                "predicted_kwh": round(p50, 2),
            })

        state_store.update("prob_forecast", processed)
        return processed

    async def get_risk(self, horizon: int = 24) -> dict:
        """Returns risk assessment dict."""
        forecast = await self.get_probabilistic_forecast(horizon)

        # Use Groq risk provider (already exists)
        from app.ai.providers.groq_risk import GroqRiskProvider
        provider = GroqRiskProvider()
        try:
            result = await provider.detect_risk()
        except Exception:
            result = _fallback_risk(forecast)

        # Ensure required fields exist
        if "risk_level" not in result:
            result = _fallback_risk(forecast)

        # Enrich with timeline details from forecast
        details = [
            {
                "timestamp": f["timestamp"],
                "risk": "HIGH" if f["p90"] > 200 else "MEDIUM" if f["p50"] > 160 else "LOW",
            }
            for f in forecast
        ]
        result["details"] = details
        # Normalize probability field
        if "probability" not in result:
            result["probability"] = result.get("risk_score", 50) / 100
        return result

    async def get_pricing(self, horizon: int = 24) -> List[dict]:
        """Returns list of {timestamp, price_inr, price_usd, price} dicts."""
        cached = state_store.get("pricing")
        if cached and len(cached) >= horizon:
            return cached[:horizon]

        forecast = await self.get_probabilistic_forecast(horizon)
        peak_p50 = max((f["p50"] for f in forecast), default=80)

        system, user = _build_pricing_prompt({"peak_p50": peak_p50})
        raw = await groq_client.generate(
            feature="pricing",
            system_prompt=system,
            user_prompt=user,
            fallback_fn=lambda: {"pricing": _fallback_pricing(forecast)},
        )

        pricing_list = raw.get("pricing", [])
        if not pricing_list or len(pricing_list) < horizon:
            pricing_list = _fallback_pricing(forecast)

        now = _now_utc()
        processed = []
        for i, p in enumerate(pricing_list[:horizon]):
            inr = max(3.5, min(float(p.get("price_inr", 7)), config.MAX_PRICE))
            ts = now + timedelta(hours=i)
            ts = ts.replace(minute=0, second=0, microsecond=0)
            processed.append({
                "timestamp": ts.isoformat(),
                "price": round(inr, 2),
                "price_inr": round(inr, 2),
                "price_usd": round(inr * 0.012, 4),
                "load_kw": forecast[i]["p50"] if i < len(forecast) else 60.0,
            })

        state_store.update("pricing", processed)
        return processed

    async def get_schedule(self, horizon: int = 24) -> dict:
        """Returns schedule recommendation dict."""
        forecast = await self.get_probabilistic_forecast(horizon)

        # Use existing Groq scheduler provider
        from app.ai.providers.groq_scheduler import GroqSchedulerProvider
        provider = GroqSchedulerProvider()
        before = [f["p50"] * 1.45 for f in forecast]
        raw = await provider.optimize_schedule(before=before)

        # Build schedule items with timestamps
        schedule_items = []
        for i, f in enumerate(forecast):
            b = raw["before"][i] if i < len(raw["before"]) else before[i]
            a = raw["after"][i] if i < len(raw["after"]) else b * 0.82
            schedule_items.append({
                "timestamp": f["timestamp"],
                "uncontrolled_load_kw": round(b, 2),
                "total_load_kw": round(a, 2),
                "status": "at_risk" if a > 164 else "normal",
                "session_allocations": {},
            })

        peak_before = max(raw["before"]) if raw["before"] else 120
        peak_after = max(raw["after"]) if raw["after"] else 90
        return {
            "schedule": schedule_items,
            "peak_reduction_percent": round(raw.get("improvement_percent", 18), 1),
            "uncontrolled_peak": round(peak_before, 1),
            "optimized_peak": round(peak_after, 1),
            "strategy": "Hybrid EDF — shift 18-22h load to off-peak windows",
            "at_risk": peak_after > 164,
        }

    async def get_anomalies(self, horizon: int = 24) -> List[dict]:
        """Returns list of anomaly events."""
        forecast = await self.get_probabilistic_forecast(horizon)
        return _fallback_anomalies(forecast)

    async def get_planning_candidates(self) -> dict:
        """Returns infrastructure planning candidates."""
        cached = state_store.get("planning")
        if cached:
            return {"candidates": cached}

        system, user = _build_planning_prompt()
        raw = await groq_client.generate(
            feature="planning",
            system_prompt=system,
            user_prompt=user,
            fallback_fn=lambda: {"candidates": _fallback_planning()},
        )

        candidates = raw.get("candidates", [])
        if not candidates or len(candidates) < 3:
            candidates = _fallback_planning()

        # Validate and enrich
        processed = []
        zone_map = {z["name"]: z for z in BANGALORE_ZONES}
        for c in candidates:
            name = c.get("zone_name", "Unknown")
            z = zone_map.get(name, BANGALORE_ZONES[0])
            score = max(0.45, min(float(c.get("score", 0.7)), 0.98))
            processed.append({
                "location": f"{z['lat']:.4f}, {z['lon']:.4f}",
                "zone_name": name,
                "score": round(score, 3),
                "score_pct": round(score * 100),
                "reason": c.get("reason", "High EV demand density and growth potential"),
                "lat": float(c.get("lat", z["lat"])),
                "lon": float(c.get("lon", z["lon"])),
            })

        processed.sort(key=lambda x: x["score"], reverse=True)
        state_store.update("planning", processed)
        return {"candidates": processed}

    async def get_hierarchical_forecast(self, horizon: int = 24) -> dict:
        """Returns hierarchical forecast (system + per-station)."""
        system_forecast = await self.get_probabilistic_forecast(horizon)

        station_forecasts: Dict[str, List[dict]] = {}
        for si, station_id in enumerate(STATION_IDS):
            share = 0.15 + _noise(si * 31, 0.06)
            share = max(0.10, min(share, 0.30))
            station_forecasts[station_id] = [
                {
                    "timestamp": f["timestamp"],
                    "p10": round(f["p10"] * share, 2),
                    "p50": round(f["p50"] * share, 2),
                    "p90": round(f["p90"] * share, 2),
                    "fallback_active": False,
                }
                for f in system_forecast
            ]

        return {
            "system_forecast": system_forecast,
            "station_forecasts": station_forecasts,
        }

    async def get_sessions(self, limit: int = 100) -> List[dict]:
        """Returns realistic charging session records."""
        return _fallback_sessions(limit)

    async def get_load(self, limit: int = 288) -> List[dict]:
        """Returns feeder load time-series."""
        return _fallback_load(limit)

    async def get_dashboard_summary(self, horizon: int = 24) -> dict:
        """Returns unified dashboard summary (all features)."""
        forecast, risk, pricing, schedule, anomalies, planning = await asyncio.gather(
            self.get_probabilistic_forecast(horizon),
            self.get_risk(horizon),
            self.get_pricing(horizon),
            self.get_schedule(horizon),
            self.get_anomalies(horizon),
            self.get_planning_candidates(),
        )
        return {
            "forecast": forecast,
            "risk": risk,
            "pricing": pricing,
            "schedule": schedule,
            "anomalies": anomalies,
            "planning_candidates": planning.get("candidates", []),
        }


# Singleton
_demo_service: GroqDemoService | None = None


def get_demo_service() -> GroqDemoService:
    global _demo_service
    if _demo_service is None:
        _demo_service = GroqDemoService()
    return _demo_service

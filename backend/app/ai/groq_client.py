"""
Groq API Client — DEMO_ONLY / TEMPORARY_PROVIDER

Features:
- Request coalescing: concurrent identical requests share one Groq call
- Timeout protection: 8s hard limit, immediate fallback on failure
- Response caching: TTL-based via cachetools
- Structured JSON parsing with fallback

This entire module is safe to delete when migrating to real providers.
"""
import asyncio
import json
import logging
from datetime import datetime
from cachetools import TTLCache

from groq import AsyncGroq
from app.utils.config import config
from app.ai.local_demo_generator import LocalDemoGenerator

logger = logging.getLogger(__name__)

# TTL cache: responses valid for 45 seconds (aligns with frontend refresh)
_response_cache: TTLCache = TTLCache(maxsize=64, ttl=45)

# Request coalescing: map of cache_key -> asyncio.Future
_pending_requests: dict[str, asyncio.Future] = {}
_coalesce_lock = asyncio.Lock()

# Groq client singleton
_groq_client: AsyncGroq | None = None


def _get_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        if not config.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY not set in environment.")
        _groq_client = AsyncGroq(api_key=config.GROQ_API_KEY)
    return _groq_client


def _make_cache_key(feature: str, system_prompt: str) -> str:
    """Cache key based on feature name + current hour (stable within same hour)."""
    hour = datetime.now().hour
    return f"{feature}:{hour}:{hash(system_prompt[:64])}"


async def _call_groq(system_prompt: str, user_prompt: str) -> dict:
    """
    Raw call to Groq API with timeout protection.
    Returns parsed JSON dict or raises on failure.
    """
    client = _get_client()
    response = await asyncio.wait_for(
        client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"},
        ),
        timeout=8.0,
    )
    content = response.choices[0].message.content
    return json.loads(content)


async def generate(
    feature: str,
    system_prompt: str,
    user_prompt: str,
    fallback_fn=None,
) -> dict:
    """
    Main entry point for all Groq generation calls.

    Flow:
      1. Cache hit → return cached response
      2. Pending coalesced request → await same future
      3. New request → call Groq, cache, resolve futures
      4. Groq failure → cached response or fallback_fn()

    Args:
        feature: Unique feature name (e.g., "forecast", "risk")
        system_prompt: Groq system prompt
        user_prompt: Groq user prompt
        fallback_fn: Callable that returns a dict on total Groq failure
    """
    cache_key = _make_cache_key(feature, system_prompt)

    # 1. Check cache
    if cache_key in _response_cache:
        logger.debug(f"[Groq] Cache hit for '{feature}'")
        return _response_cache[cache_key]

    async with _coalesce_lock:
        # 2. Re-check cache under lock (another coroutine may have just filled it)
        if cache_key in _response_cache:
            return _response_cache[cache_key]

        # 3. Check for pending coalesced request
        if cache_key in _pending_requests:
            logger.debug(f"[Groq] Coalescing onto pending request for '{feature}'")
            future = _pending_requests[cache_key]
        else:
            # 4. Create new pending future, register it
            loop = asyncio.get_event_loop()
            future = loop.create_future()
            _pending_requests[cache_key] = future

            # Launch the actual Groq call outside the lock
            asyncio.ensure_future(_execute_groq_call(
                cache_key, feature, system_prompt, user_prompt, future, fallback_fn
            ))

    # Await the shared future (either ours or a coalesced one)
    return await asyncio.shield(future)


async def _execute_groq_call(
    cache_key: str,
    feature: str,
    system_prompt: str,
    user_prompt: str,
    future: asyncio.Future,
    fallback_fn,
):
    """Executes the actual Groq call and resolves the shared future."""
    try:
        result = await _call_groq(system_prompt, user_prompt)
        _response_cache[cache_key] = result
        if not future.done():
            future.set_result(result)
        logger.info(f"[Groq] Successfully generated '{feature}'")
    except asyncio.TimeoutError:
        logger.warning(f"[Groq] Timeout on '{feature}' — using fallback")
        result = _get_fallback(feature, fallback_fn)
        _response_cache[cache_key] = result
        if not future.done():
            future.set_result(result)
    except Exception as e:
        logger.error(f"[Groq] Error on '{feature}': {e} — using fallback")
        result = _get_fallback(feature, fallback_fn)
        _response_cache[cache_key] = result
        if not future.done():
            future.set_result(result)
    finally:
        _pending_requests.pop(cache_key, None)


def _get_fallback(feature: str, fallback_fn) -> dict:
    """Resolve fallback: custom fn > LocalDemoGenerator > empty dict."""
    if fallback_fn:
        try:
            return fallback_fn()
        except Exception:
            pass
    if feature == "forecast":
        return LocalDemoGenerator.generate_forecast()
    if feature == "risk":
        return LocalDemoGenerator.generate_risk()
    return {}

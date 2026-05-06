"""
Pydantic Synthetic Data Contracts — DEMO_ONLY / PROTOTYPE_LAYER

Pricing output validation schema. Replace with real utility pricing engine
outputs during production migration.
"""
from pydantic import BaseModel, field_validator
from typing import List
from app.utils.config import config


class PricingSchema(BaseModel):
    """
    DEMO_ONLY: Validated contract for dynamic pricing outputs.

    Enforces:
    - 24-hour price curve, non-negative and below MAX_PRICE
    - peak_price within MAX_PRICE
    - off_peak_price >= 0 and below peak_price
    """
    prices: List[float]
    peak_price: float
    off_peak_price: float
    currency: str = "INR/kWh"

    @field_validator("prices", mode="before")
    @classmethod
    def validate_prices(cls, v):
        if not isinstance(v, list) or len(v) == 0:
            return [5.0] * 24
        v = v[:24]
        v = [max(0.0, min(float(x), config.MAX_PRICE)) for x in v]
        while len(v) < 24:
            v.append(v[-1] if v else 5.0)
        return v

    @field_validator("peak_price", mode="before")
    @classmethod
    def validate_peak_price(cls, v):
        try:
            v = float(v)
        except (TypeError, ValueError):
            return config.MAX_PRICE * 0.8
        return round(max(0.0, min(v, config.MAX_PRICE)), 2)

    @field_validator("off_peak_price", mode="before")
    @classmethod
    def validate_off_peak_price(cls, v):
        try:
            v = float(v)
        except (TypeError, ValueError):
            return 3.0
        return round(max(0.0, min(v, config.MAX_PRICE)), 2)

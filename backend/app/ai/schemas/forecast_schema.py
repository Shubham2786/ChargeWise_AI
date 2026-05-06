"""
Pydantic Synthetic Data Contracts — DEMO_ONLY / PROTOTYPE_LAYER

These schemas enforce strict structural validation on all AI-generated
forecast outputs, auto-repairing values that violate constraints.
Replace this file with real ML model output schemas when migrating.
"""
from pydantic import BaseModel, field_validator, model_validator
from typing import List, Optional
from app.utils.config import config


class ForecastSchema(BaseModel):
    """
    DEMO_ONLY: Validated contract for 24-hour load forecast outputs.

    Enforces:
    - Exactly 24 hourly predictions
    - All values non-negative and below MAX_GRID_LOAD
    - peak_hour within 0-23 range
    - Optional probabilistic bands with p10 <= p50 <= p90
    """
    predictions: List[float]
    peak_hour: int
    p10: Optional[List[float]] = None
    p50: Optional[List[float]] = None
    p90: Optional[List[float]] = None

    @field_validator("predictions", mode="before")
    @classmethod
    def validate_predictions(cls, v):
        if not isinstance(v, list) or len(v) == 0:
            # Auto-repair: return flat baseline on empty
            return [50.0] * 24

        # Clip to 24 hours, clip values to valid range
        v = v[:24]
        v = [max(0.0, min(float(x), config.MAX_GRID_LOAD)) for x in v]

        # Pad to 24 if truncated
        while len(v) < 24:
            v.append(v[-1] if v else 50.0)
        return v

    @field_validator("peak_hour", mode="before")
    @classmethod
    def validate_peak_hour(cls, v):
        try:
            v = int(v)
        except (TypeError, ValueError):
            return 18  # sensible default: evening peak
        return max(0, min(v, 23))

    @model_validator(mode="after")
    def repair_probabilistic_bands(self):
        """Ensure p10 <= p50 <= p90 at every index, auto-repair if violated."""
        if self.p10 and self.p50 and self.p90:
            fixed_p10, fixed_p50, fixed_p90 = [], [], []
            for a, b, c in zip(self.p10, self.p50, self.p90):
                a, b, c = float(a), float(b), float(c)
                # sort to enforce monotonic order
                a, b, c = sorted([a, b, c])
                fixed_p10.append(round(a, 2))
                fixed_p50.append(round(b, 2))
                fixed_p90.append(round(c, 2))
            self.p10, self.p50, self.p90 = fixed_p10, fixed_p50, fixed_p90
        return self

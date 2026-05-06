"""
Pydantic Synthetic Data Contracts — DEMO_ONLY / PROTOTYPE_LAYER

Scheduling output validation schema. Replace with real EDF/LP optimizer
outputs during production migration.
"""
from pydantic import BaseModel, field_validator, model_validator
from typing import List
from app.utils.config import config


class SchedulingSchema(BaseModel):
    """
    DEMO_ONLY: Validated contract for smart schedule optimization outputs.

    Enforces:
    - Both before/after curves have 24 values, non-negative
    - improvement_percent clipped to 0-MAX_PEAK_REDUCTION
    - after values <= before values at each peak spike hour (load can only shift, not increase beyond original)
    """
    before: List[float]
    after: List[float]
    improvement_percent: float

    @field_validator("before", "after", mode="before")
    @classmethod
    def validate_curve(cls, v):
        if not isinstance(v, list) or len(v) == 0:
            return [50.0] * 24
        v = v[:24]
        v = [max(0.0, min(float(x), config.MAX_GRID_LOAD)) for x in v]
        while len(v) < 24:
            v.append(v[-1] if v else 50.0)
        return v

    @field_validator("improvement_percent", mode="before")
    @classmethod
    def validate_improvement(cls, v):
        try:
            v = float(v)
        except (TypeError, ValueError):
            return 10.0
        return round(max(0.0, min(v, config.MAX_PEAK_REDUCTION)), 2)

    @model_validator(mode="after")
    def ensure_same_length(self):
        n = min(len(self.before), len(self.after), 24)
        self.before = self.before[:n]
        self.after = self.after[:n]
        return self

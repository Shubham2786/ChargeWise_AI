"""
Pydantic Synthetic Data Contracts — DEMO_ONLY / PROTOTYPE_LAYER

Risk output validation schema. Replace with real risk model outputs
during production migration.
"""
from pydantic import BaseModel, field_validator
from typing import List
from app.utils.config import config


class RiskSchema(BaseModel):
    """
    DEMO_ONLY: Validated contract for risk detection outputs.

    Enforces:
    - risk_level in allowed values
    - max_load non-negative and below MAX_GRID_LOAD
    - capacity_percent clipped to 0-100
    - risk_score clipped to 0-MAX_RISK_SCORE
    """
    risk_level: str
    max_load: float
    capacity_percent: float
    risk_score: float = 50.0
    risk_factors: List[str] = []

    @field_validator("risk_level", mode="before")
    @classmethod
    def validate_risk_level(cls, v):
        allowed = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        v = str(v).upper()
        return v if v in allowed else "MEDIUM"

    @field_validator("max_load", mode="before")
    @classmethod
    def validate_max_load(cls, v):
        try:
            v = float(v)
        except (TypeError, ValueError):
            return 50.0
        return round(max(0.0, min(v, config.MAX_GRID_LOAD)), 2)

    @field_validator("capacity_percent", mode="before")
    @classmethod
    def validate_capacity_percent(cls, v):
        try:
            v = float(v)
        except (TypeError, ValueError):
            return 50.0
        return round(max(0.0, min(v, 100.0)), 2)

    @field_validator("risk_score", mode="before")
    @classmethod
    def validate_risk_score(cls, v):
        try:
            v = float(v)
        except (TypeError, ValueError):
            return 50.0
        return round(max(0.0, min(v, config.MAX_RISK_SCORE)), 2)

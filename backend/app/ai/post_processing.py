"""
Mathematical Post-Processor — DEMO_ONLY / PROTOTYPE_LAYER

Enforces hard mathematical guarantees on all AI-generated outputs
AFTER Groq generation and BEFORE schema validation. This is the
last line of defense against LLM hallucinations.

Replace this module when migrating to real ML models — real model
outputs should already be numerically sound.
"""
import numpy as np
from typing import List
from app.utils.config import config


class MathematicalPostProcessor:
    """
    DEMO_ONLY: Applies mathematical constraints and curve corrections
    to raw LLM-generated numeric outputs.
    """

    @staticmethod
    def smooth_curve(values: List[float], window: int = 3) -> List[float]:
        """Apply moving average to smooth jagged LLM-generated curves."""
        arr = np.array(values, dtype=float)
        kernel = np.ones(window) / window
        # Use 'same' mode and handle edges with padding
        padded = np.pad(arr, (window // 2, window // 2), mode="edge")
        smoothed = np.convolve(padded, kernel, mode="valid")
        return [round(float(v), 2) for v in smoothed[: len(values)]]

    @staticmethod
    def clip_non_negative(values: List[float]) -> List[float]:
        """Remove any negative values by clipping to 0."""
        return [max(0.0, round(float(v), 2)) for v in values]

    @staticmethod
    def clip_to_max(values: List[float], max_val: float) -> List[float]:
        """Clip all values to a defined ceiling."""
        return [min(max_val, round(float(v), 2)) for v in values]

    @staticmethod
    def enforce_percentile_bands(
        p10: List[float], p50: List[float], p90: List[float]
    ):
        """
        Enforce monotonic ordering: p10 <= p50 <= p90 at every index.
        Sorts each triplet individually to auto-repair violations.
        """
        fixed_p10, fixed_p50, fixed_p90 = [], [], []
        for a, b, c in zip(p10, p50, p90):
            a, b, c = sorted([float(a), float(b), float(c)])
            fixed_p10.append(round(a, 2))
            fixed_p50.append(round(b, 2))
            fixed_p90.append(round(c, 2))
        return fixed_p10, fixed_p50, fixed_p90

    @staticmethod
    def normalize_hierarchy(values: List[float], target_sum: float) -> List[float]:
        """
        Normalize a list of values so they sum to a target total.
        Used for hierarchical decompositions (e.g., zone splits).
        """
        total = sum(values)
        if total == 0:
            n = len(values)
            return [round(target_sum / n, 2)] * n
        return [round((v / total) * target_sum, 2) for v in values]

    @classmethod
    def process_forecast(cls, predictions: List[float]) -> List[float]:
        """Full forecast post-processing pipeline."""
        result = cls.clip_non_negative(predictions)
        result = cls.clip_to_max(result, config.MAX_GRID_LOAD)
        result = cls.smooth_curve(result, window=3)
        return result

    @classmethod
    def process_prices(cls, prices: List[float]) -> List[float]:
        """Full pricing post-processing pipeline."""
        result = cls.clip_non_negative(prices)
        result = cls.clip_to_max(result, config.MAX_PRICE)
        result = cls.smooth_curve(result, window=2)
        return result

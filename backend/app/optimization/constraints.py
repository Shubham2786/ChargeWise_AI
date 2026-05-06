"""Grid constraints and scheduling configuration."""

class GridConstraints:
    # Maximum total feeder load capacity in kW
    # Assume static for MVP
    MAX_CAPACITY_KW: float = 150.0

    # Minimal allowed allocation to prevent toggling (e.g., 1 kW)
    MIN_ALLOCATION_KW: float = 1.0

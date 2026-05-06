"""Smart Charging Scheduler implementing Hybrid EDF."""
from typing import List, Dict, Any
import datetime
from pydantic import BaseModel
from app.optimization.constraints import GridConstraints

class Session(BaseModel):
    id: str
    remaining_energy: float
    deadline: datetime.datetime
    max_power: float
    allocated_power: float = 0.0
    status: str = "normal"
    
class ChargingScheduler:
    def __init__(self, constraints: GridConstraints = GridConstraints()):
        self.constraints = constraints
        self.flags_overload = False

    def schedule(self, forecast: List[Dict[str, Any]], active_sessions: List[Session]) -> Dict[str, Any]:
        """
        Schedule active sessions over the forecasted horizon using Hybrid EDF.
        forecast: list of {"timestamp": datetime, "predicted_kwh": float}
        """
        schedule_output = []
        sessions = [s.copy() for s in active_sessions]
        
        # Calculate Uncontrolled Baseline Peak
        uncontrolled_peak = 0.0
        optimized_peak = 0.0
        
        for t_idx, f in enumerate(forecast):
            current_time = f["timestamp"]
            base_load = f["predicted_kwh"]
            
            # Remove completed sessions
            sessions = [s for s in sessions if s.remaining_energy > 0 and s.deadline > current_time]
            
            if not sessions:
                # No active sessions, just output base load
                schedule_output.append({
                    "timestamp": current_time,
                    "allocated_power_kw": 0.0,
                    "total_load_kw": base_load,
                    "uncontrolled_load_kw": base_load,
                    "status": "normal",
                    "session_allocations": {}
                })
                uncontrolled_peak = max(uncontrolled_peak, base_load)
                optimized_peak = max(optimized_peak, base_load)
                continue
                
            # Uncontrolled baseline: all cars charge at max power immediately
            uncontrolled_charging = sum(min(s.max_power, s.remaining_energy) for s in sessions)
            uncontrolled_peak = max(uncontrolled_peak, base_load + uncontrolled_charging)
            
            # Available capacity for EV charging
            available_capacity = max(0.0, self.constraints.MAX_CAPACITY_KW - base_load)
            
            # Feasibility Check: Is total required energy > total available capacity in horizon?
            # We do a simplified check for MVP: if total remaining energy > available_capacity * remaining_hours
            remaining_hours = len(forecast) - t_idx
            total_required = sum(s.remaining_energy for s in sessions)
            if total_required > available_capacity * remaining_hours:
                self.flags_overload = True
                for s in sessions:
                    s.status = "at_risk"
                    
            # Hybrid EDF Allocation
            # Step 1: Sort by deadline (EDF priority)
            sessions.sort(key=lambda x: x.deadline)
            
            # Step 2: Compute urgency
            total_urgency = 0.0
            urgencies = {}
            for s in sessions:
                # Time remaining in hours
                time_remaining = (s.deadline - current_time).total_seconds() / 3600.0
                time_remaining = max(1.0, time_remaining) # Avoid div by zero
                urgency = s.remaining_energy / time_remaining
                urgencies[s.id] = urgency
                total_urgency += urgency
                
            # Step 3: Allocate proportionally
            allocated_this_step = 0.0
            session_allocs = {}
            remaining_capacity = available_capacity
            
            # First pass: Proportional
            for s in sessions:
                power_share = (urgencies[s.id] / total_urgency) if total_urgency > 0 else 0
                ideal_power = power_share * available_capacity
                
                # Cap by what the EV can actually take
                actual_allocation = min(ideal_power, s.max_power, s.remaining_energy)
                s.allocated_power = actual_allocation
                remaining_capacity -= actual_allocation
                
            # Second pass: EDF rollover (if proportional left capacity unused because of caps)
            if remaining_capacity > 0:
                for s in sessions:
                    if remaining_capacity <= 0:
                        break
                    shortfall = min(s.max_power, s.remaining_energy) - s.allocated_power
                    if shortfall > 0:
                        extra = min(shortfall, remaining_capacity)
                        s.allocated_power += extra
                        remaining_capacity -= extra
                        
            # Apply allocations
            for s in sessions:
                s.remaining_energy -= s.allocated_power
                allocated_this_step += s.allocated_power
                session_allocs[s.id] = s.allocated_power
                
                # Determine status
                if s.allocated_power < min(s.max_power, s.remaining_energy + s.allocated_power) and s.status != "at_risk":
                    s.status = "throttled"
                elif s.status != "at_risk":
                    s.status = "normal"
                    
            total_load = base_load + allocated_this_step
            optimized_peak = max(optimized_peak, total_load)
            
            overall_status = "normal"
            if self.flags_overload:
                overall_status = "at_risk"
            elif any(s.status == "throttled" for s in sessions):
                overall_status = "throttled"
                
            schedule_output.append({
                "timestamp": current_time,
                "allocated_power_kw": allocated_this_step,
                "total_load_kw": total_load,
                "uncontrolled_load_kw": base_load + uncontrolled_charging,
                "status": overall_status,
                "session_allocations": session_allocs
            })
            
        peak_reduction_percent = 0.0
        if uncontrolled_peak > 0:
            peak_reduction_percent = ((uncontrolled_peak - optimized_peak) / uncontrolled_peak) * 100.0
            
        return {
            "schedule": schedule_output,
            "peak_reduction_percent": peak_reduction_percent,
            "uncontrolled_peak": uncontrolled_peak,
            "optimized_peak": optimized_peak
        }

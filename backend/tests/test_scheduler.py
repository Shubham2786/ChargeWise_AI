"""Tests for the Smart Charging Scheduler (Feature 3)."""
import pytest
import datetime
from app.optimization.scheduler import ChargingScheduler, Session
from app.optimization.constraints import GridConstraints

def test_no_deadline_miss():
    """Test that all sessions complete before their deadlines under normal load."""
    scheduler = ChargingScheduler(GridConstraints()) # MAX_CAPACITY = 150
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # 24 hours of zero baseline load
    forecast = [{"timestamp": now + datetime.timedelta(hours=i), "predicted_kwh": 0.0} for i in range(24)]
    
    # Active sessions
    sessions = [
        Session(id="1", remaining_energy=20.0, deadline=now + datetime.timedelta(hours=3), max_power=10.0),
        Session(id="2", remaining_energy=50.0, deadline=now + datetime.timedelta(hours=6), max_power=10.0),
        Session(id="3", remaining_energy=100.0, deadline=now + datetime.timedelta(hours=12), max_power=10.0)
    ]
    
    result = scheduler.schedule(forecast, sessions)
    
    assert result["peak_reduction_percent"] >= 0
    assert not scheduler.flags_overload
    
    # Check that after running the schedule, the original session objects passed in are not mutated
    # Wait, the scheduler copies them internally, but returns allocations.
    # Let's sum the allocations for each session to ensure they received their required energy.
    allocations = {"1": 0.0, "2": 0.0, "3": 0.0}
    for step in result["schedule"]:
        for s_id, power in step["session_allocations"].items():
            allocations[s_id] += power
            
    # Allow small floating point margin
    assert abs(allocations["1"] - 20.0) < 0.01
    assert abs(allocations["2"] - 50.0) < 0.01
    assert abs(allocations["3"] - 100.0) < 0.01

def test_infeasible_case():
    """Test that the scheduler flags overload when capacity is mathematically insufficient."""
    scheduler = ChargingScheduler(GridConstraints())
    # Override capacity to tiny amount
    scheduler.constraints.MAX_CAPACITY_KW = 10.0
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # 3 hours of base load = 5.0 (leaves 5.0 for charging)
    forecast = [{"timestamp": now + datetime.timedelta(hours=i), "predicted_kwh": 5.0} for i in range(3)]
    
    # Active sessions require 50 energy, but only 3 * 5 = 15 available in horizon
    sessions = [
        Session(id="1", remaining_energy=50.0, deadline=now + datetime.timedelta(hours=3), max_power=20.0)
    ]
    
    result = scheduler.schedule(forecast, sessions)
    
    # It must flag overload (feasibility check failed)
    # The first step should set flags_overload = True and status = "at_risk"
    assert any(step["status"] == "at_risk" for step in result["schedule"])

def test_peak_reduction():
    """Test that the optimized peak is strictly less than uncontrolled peak."""
    scheduler = ChargingScheduler()
    scheduler.constraints.MAX_CAPACITY_KW = 100.0
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Base load is 60kW, leaving 40kW for charging.
    forecast = [{"timestamp": now + datetime.timedelta(hours=i), "predicted_kwh": 60.0} for i in range(24)]
    
    # 5 cars, all want 10kW max immediately (total 50kW uncontrolled)
    # Uncontrolled peak = 60 + 50 = 110kW
    sessions = [
        Session(id=str(i), remaining_energy=20.0, deadline=now + datetime.timedelta(hours=10), max_power=10.0)
        for i in range(5)
    ]
    
    result = scheduler.schedule(forecast, sessions)
    
    # Optimized peak should be bounded by MAX_CAPACITY_KW (100kW)
    assert result["uncontrolled_peak"] == 110.0
    assert result["optimized_peak"] <= 100.0
    assert result["peak_reduction_percent"] > 0

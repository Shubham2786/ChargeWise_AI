"""
Quick test script to verify Groq integration works.
Run: python test_groq_integration.py
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ai.groq_demo_service import get_demo_service
from app.utils.config import config

async def test_all_features():
    print("=" * 60)
    print("ChargeWise AI — Groq Integration Test")
    print("=" * 60)
    print(f"USE_AI_DEMO_DATA: {config.USE_AI_DEMO_DATA}")
    print(f"SCENARIO_MODE: {config.SCENARIO_MODE}")
    print(f"GROQ_API_KEY: {'Set' if config.GROQ_API_KEY else 'Missing'}")
    print("=" * 60)
    
    service = get_demo_service()
    
    # Test 1: Probabilistic Forecast
    print("\n[1/9] Testing Probabilistic Forecast...")
    try:
        forecast = await service.get_probabilistic_forecast(horizon=6)
        print(f"[OK] Generated {len(forecast)} forecast points")
        print(f"  Sample: {forecast[0]['timestamp'][:19]} -> P50={forecast[0]['p50']} kWh")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 2: Risk Assessment
    print("\n[2/9] Testing Risk Assessment...")
    try:
        risk = await service.get_risk(horizon=6)
        print(f"[OK] Risk Level: {risk['risk_level']}")
        print(f"  Probability: {risk['probability']:.1%}")
        print(f"  Max Load: {risk['max_load']} kW")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 3: Dynamic Pricing
    print("\n[3/9] Testing Dynamic Pricing...")
    try:
        pricing = await service.get_pricing(horizon=6)
        print(f"[OK] Generated {len(pricing)} pricing points")
        print(f"  Sample: Rs.{pricing[0]['price_inr']}/kWh (${pricing[0]['price_usd']}/kWh)")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 4: Smart Schedule
    print("\n[4/9] Testing Smart Schedule...")
    try:
        schedule = await service.get_schedule(horizon=6)
        print(f"[OK] Peak Reduction: {schedule['peak_reduction_percent']}%")
        print(f"  Before: {schedule['uncontrolled_peak']} kW -> After: {schedule['optimized_peak']} kW")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 5: Anomaly Detection
    print("\n[5/9] Testing Anomaly Detection...")
    try:
        anomalies = await service.get_anomalies(horizon=6)
        print(f"[OK] Detected {len(anomalies)} anomalies")
        if anomalies:
            print(f"  Sample: {anomalies[0]['actual']} kW vs expected {anomalies[0]['expected_p90']} kW")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 6: Planning Candidates
    print("\n[6/9] Testing Planning Candidates...")
    try:
        planning = await service.get_planning_candidates()
        candidates = planning.get("candidates", [])
        print(f"[OK] Found {len(candidates)} candidates")
        if candidates:
            top = candidates[0]
            print(f"  Top: {top['zone_name']} (score: {top['score_pct']}%)")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 7: Hierarchical Forecast
    print("\n[7/9] Testing Hierarchical Forecast...")
    try:
        hierarchy = await service.get_hierarchical_forecast(horizon=6)
        print(f"[OK] System forecast: {len(hierarchy['system_forecast'])} points")
        print(f"  Stations: {len(hierarchy['station_forecasts'])} tracked")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 8: Charging Sessions
    print("\n[8/9] Testing Charging Sessions...")
    try:
        sessions = await service.get_sessions(limit=10)
        print(f"[OK] Generated {len(sessions)} sessions")
        if sessions:
            print(f"  Sample: {sessions[0]['station_id']} — {sessions[0]['energy_kwh']} kWh")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 9: Feeder Load
    print("\n[9/9] Testing Feeder Load...")
    try:
        load = await service.get_load(limit=12)
        print(f"[OK] Generated {len(load)} load points")
        if load:
            print(f"  Sample: {load[0]['timestamp'][:19]} -> {load[0]['load_kw']} kW")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    # Test 10: Dashboard Summary
    print("\n[BONUS] Testing Dashboard Summary...")
    try:
        summary = await service.get_dashboard_summary(horizon=6)
        print(f"[OK] Unified summary generated")
        print(f"  Forecast: {len(summary['forecast'])} points")
        print(f"  Risk: {summary['risk']['risk_level']}")
        print(f"  Pricing: {len(summary['pricing'])} points")
        print(f"  Schedule: {summary['schedule']['peak_reduction_percent']}% reduction")
        print(f"  Anomalies: {len(summary['anomalies'])} detected")
        print(f"  Planning: {len(summary['planning_candidates'])} candidates")
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    if not config.USE_AI_DEMO_DATA:
        print("[WARNING] USE_AI_DEMO_DATA=False")
        print("   Set USE_AI_DEMO_DATA=true in backend/.env to test Groq integration")
        print()
    
    asyncio.run(test_all_features())

"""Tests for load time-series generation."""
import pytest
import pandas as pd
from datetime import datetime
from app.chargewise.services.load_builder import LoadBuilder

def test_build_load_basic():
    """Test basic load generation."""
    sessions_df = pd.DataFrame([
        {
            'station_id': 'S1',
            'start_time': pd.Timestamp('2024-01-01 10:00:00'),
            'end_time': pd.Timestamp('2024-01-01 11:00:00'),
            'energy_kwh': 7.0,
            'max_power_kw': 7.0
        }
    ])
    
    builder = LoadBuilder()
    load_df = builder.build_load(sessions_df, feeder_id="test_feeder")
    
    assert len(load_df) > 0
    assert list(load_df.columns) == ['timestamp', 'feeder_id', 'load_kw']
    assert load_df['feeder_id'].iloc[0] == "test_feeder"
    assert load_df['load_kw'].max() == 7.0

def test_build_load_overlapping_sessions():
    """Test load generation with overlapping sessions."""
    sessions_df = pd.DataFrame([
        {
            'station_id': 'S1',
            'start_time': pd.Timestamp('2024-01-01 10:00:00'),
            'end_time': pd.Timestamp('2024-01-01 11:00:00'),
            'energy_kwh': 7.0,
            'max_power_kw': 7.0
        },
        {
            'station_id': 'S2',
            'start_time': pd.Timestamp('2024-01-01 10:30:00'),
            'end_time': pd.Timestamp('2024-01-01 11:30:00'),
            'energy_kwh': 11.0,
            'max_power_kw': 11.0
        }
    ])
    
    builder = LoadBuilder()
    load_df = builder.build_load(sessions_df)
    
    # During overlap (10:30-11:00), load should be 7 + 11 = 18 kW
    overlap_load = load_df[
        (load_df['timestamp'] >= pd.Timestamp('2024-01-01 10:30:00')) &
        (load_df['timestamp'] < pd.Timestamp('2024-01-01 11:00:00'))
    ]
    assert overlap_load['load_kw'].iloc[0] == 18.0

def test_build_load_empty_input():
    """Test load generation with empty input."""
    sessions_df = pd.DataFrame(columns=['station_id', 'start_time', 'end_time', 'energy_kwh', 'max_power_kw'])
    
    builder = LoadBuilder()
    load_df = builder.build_load(sessions_df)
    
    assert len(load_df) == 0
    assert list(load_df.columns) == ['timestamp', 'feeder_id', 'load_kw']

def test_build_load_custom_interval():
    """Test load generation with custom interval."""
    sessions_df = pd.DataFrame([
        {
            'station_id': 'S1',
            'start_time': pd.Timestamp('2024-01-01 10:00:00'),
            'end_time': pd.Timestamp('2024-01-01 11:00:00'),
            'energy_kwh': 7.0,
            'max_power_kw': 7.0
        }
    ])
    
    builder = LoadBuilder()
    load_df_15 = builder.build_load(sessions_df, interval_minutes=15)
    load_df_30 = builder.build_load(sessions_df, interval_minutes=30)
    
    # 30-min intervals should have fewer rows than 15-min
    assert len(load_df_30) < len(load_df_15)

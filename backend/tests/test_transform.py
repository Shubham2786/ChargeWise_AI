"""Tests for session data transformation."""
import pytest
import pandas as pd
from datetime import datetime
from app.chargewise.services.transform import SessionTransformer

def test_transform_valid_sessions():
    """Test transformation of valid session data."""
    raw_sessions = [
        {
            "stationID": "S1",
            "connectionTime": "2024-01-01T10:00:00",
            "disconnectTime": "2024-01-01T12:00:00",
            "kWhDelivered": 15.5
        },
        {
            "stationID": "S2",
            "connectionTime": "2024-01-01T14:00:00",
            "disconnectTime": "2024-01-01T16:00:00",
            "kWhDelivered": 20.0
        }
    ]
    
    transformer = SessionTransformer()
    df = transformer.transform(raw_sessions)
    
    assert len(df) == 2
    assert list(df.columns) == ['station_id', 'start_time', 'end_time', 'energy_kwh', 'max_power_kw']
    assert df.iloc[0]['station_id'] == "S1"
    assert df.iloc[0]['energy_kwh'] == 15.5
    assert df.iloc[0]['max_power_kw'] == 7.0
    assert isinstance(df.iloc[0]['start_time'], pd.Timestamp)

def test_transform_filters_invalid_rows():
    """Test that invalid rows are filtered out."""
    raw_sessions = [
        {
            "stationID": "S1",
            "connectionTime": "2024-01-01T10:00:00",
            "disconnectTime": "2024-01-01T12:00:00",
            "kWhDelivered": 15.5
        },
        {
            "stationID": "S2",
            "connectionTime": "2024-01-01T14:00:00",
            "disconnectTime": "2024-01-01T16:00:00",
            "kWhDelivered": 0  # Invalid: zero energy
        },
        {
            "stationID": "S3",
            "connectionTime": "2024-01-01T18:00:00",
            "disconnectTime": "2024-01-01T17:00:00",  # Invalid: end before start
            "kWhDelivered": 10.0
        }
    ]
    
    transformer = SessionTransformer()
    df = transformer.transform(raw_sessions)
    
    assert len(df) == 1
    assert df.iloc[0]['station_id'] == "S1"

def test_transform_empty_input():
    """Test transformation with empty input."""
    transformer = SessionTransformer()
    df = transformer.transform([])
    
    assert len(df) == 0
    assert list(df.columns) == ['station_id', 'start_time', 'end_time', 'energy_kwh', 'max_power_kw']

def test_transform_custom_max_power():
    """Test transformation with custom max power."""
    raw_sessions = [
        {
            "stationID": "S1",
            "connectionTime": "2024-01-01T10:00:00",
            "disconnectTime": "2024-01-01T12:00:00",
            "kWhDelivered": 15.5
        }
    ]
    
    transformer = SessionTransformer()
    df = transformer.transform(raw_sessions, default_max_power_kw=11.0)
    
    assert df.iloc[0]['max_power_kw'] == 11.0

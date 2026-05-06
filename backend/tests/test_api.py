"""Tests for ChargeWise AI API endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from datetime import datetime
from app.main import app

client = TestClient(app)

def test_get_sessions_endpoint():
    """Test GET /v1/sessions endpoint."""
    mock_session = Mock()
    mock_session.id = 1
    mock_session.station_id = "S1"
    mock_session.start_time = datetime(2024, 1, 1, 10, 0)
    mock_session.end_time = datetime(2024, 1, 1, 12, 0)
    mock_session.energy_kwh = 15.5
    mock_session.max_power_kw = 7.0
    
    with patch('app.chargewise.services.repository.Repository.get_sessions', return_value=[mock_session]):
        response = client.get("/v1/sessions?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["station_id"] == "S1"
        assert data[0]["energy_kwh"] == 15.5

def test_get_load_endpoint():
    """Test GET /v1/load endpoint."""
    mock_load = Mock()
    mock_load.id = 1
    mock_load.feeder_id = "test_feeder"
    mock_load.timestamp = datetime(2024, 1, 1, 10, 0)
    mock_load.load_kw = 25.5
    
    with patch('app.chargewise.services.repository.Repository.get_load', return_value=[mock_load]):
        response = client.get("/v1/load?feeder_id=test_feeder")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["feeder_id"] == "test_feeder"
        assert data[0]["load_kw"] == 25.5

def test_get_load_endpoint_no_filter():
    """Test GET /v1/load without feeder_id filter."""
    with patch('app.chargewise.services.repository.Repository.get_load', return_value=[]):
        response = client.get("/v1/load")
        
        assert response.status_code == 200
        assert response.json() == []

"""Tests for ACN API client."""
import pytest
from unittest.mock import Mock, patch
from app.chargewise.services.acn_client import ACNClient

def test_fetch_sessions_single_page():
    """Test fetching sessions without pagination."""
    client = ACNClient(token="test_token", base_url="https://test.api")
    
    mock_response = Mock()
    mock_response.json.return_value = {
        "_items": [
            {"stationID": "S1", "kWhDelivered": 10.5},
            {"stationID": "S2", "kWhDelivered": 8.2}
        ],
        "_links": {}
    }
    mock_response.raise_for_status = Mock()
    
    with patch('requests.get', return_value=mock_response) as mock_get:
        sessions = client.fetch_sessions(min_kwh=5.0)
        
        assert len(sessions) == 2
        assert sessions[0]["stationID"] == "S1"
        mock_get.assert_called_once()

def test_fetch_sessions_with_pagination():
    """Test fetching sessions with multiple pages."""
    client = ACNClient(token="test_token", base_url="https://test.api")
    
    # First page
    mock_response1 = Mock()
    mock_response1.json.return_value = {
        "_items": [{"stationID": "S1"}],
        "_links": {"next": {"href": "https://test.api/sessions?page=2"}}
    }
    mock_response1.raise_for_status = Mock()
    
    # Second page
    mock_response2 = Mock()
    mock_response2.json.return_value = {
        "_items": [{"stationID": "S2"}],
        "_links": {}
    }
    mock_response2.raise_for_status = Mock()
    
    with patch('requests.get', side_effect=[mock_response1, mock_response2]) as mock_get:
        sessions = client.fetch_sessions()
        
        assert len(sessions) == 2
        assert mock_get.call_count == 2

def test_fetch_sessions_empty():
    """Test fetching when no sessions available."""
    client = ACNClient(token="test_token", base_url="https://test.api")
    
    mock_response = Mock()
    mock_response.json.return_value = {"_items": [], "_links": {}}
    mock_response.raise_for_status = Mock()
    
    with patch('requests.get', return_value=mock_response):
        sessions = client.fetch_sessions()
        assert len(sessions) == 0

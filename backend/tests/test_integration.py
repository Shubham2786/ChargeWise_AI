import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.chargewise.services.transform import SessionTransformer
from app.chargewise.services.repository import Repository
from app.chargewise.database import SessionLocal
from app.chargewise.models import ChargingSession

client = TestClient(app)

def test_pipeline_e2e():
    """Test full ingestion pipeline including idempotency and API filters."""
    # 1. Mock Data
    raw_sessions = [
        {
            "stationID": "TEST_E2E_01",
            "connectionTime": "2024-01-01T10:00:00Z",
            "disconnectTime": "2024-01-01T12:00:00Z",
            "kWhDelivered": 15.0
        }
    ]
    
    db = SessionLocal()
    try:
        # Cleanup any previous failed runs
        db.query(ChargingSession).filter(ChargingSession.station_id == "TEST_E2E_01").delete()
        db.commit()
        
        # 2. Transform
        transformer = SessionTransformer()
        df = transformer.transform(raw_sessions)
        assert len(df) == 1
        assert df.iloc[0]['duration_minutes'] == 120
        
        # 3. Insert into DB (First time)
        repo = Repository()
        repo.insert_sessions(db, df)
        
        # Verify it was inserted
        count = db.query(ChargingSession).filter(ChargingSession.station_id == "TEST_E2E_01").count()
        assert count == 1
        
        # 4. Idempotency Check (Insert again)
        repo.insert_sessions(db, df)
        count_after = db.query(ChargingSession).filter(ChargingSession.station_id == "TEST_E2E_01").count()
        assert count_after == 1  # Should still be 1!
        
        # 5. API Fetch with filters
        response = client.get("/v1/sessions?station_id=TEST_E2E_01")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["station_id"] == "TEST_E2E_01"
        assert data[0]["duration_minutes"] == 120
        
    finally:
        # Cleanup
        db.query(ChargingSession).filter(ChargingSession.station_id == "TEST_E2E_01").delete()
        db.commit()
        db.close()

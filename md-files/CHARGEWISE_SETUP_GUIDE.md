# ChargeWise AI - Complete Setup & Execution Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Running the System](#running-the-system)
5. [Testing](#testing)
6. [API Usage](#api-usage)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- ✅ Python 3.11 or higher
- ✅ PostgreSQL 14+ (running on port 5433)
- ✅ Git (for version control)

### Database Configuration
- **Host:** localhost
- **Port:** 5433
- **Database:** chargewise
- **User:** postgres
- **Password:** Postgre@7482

### API Access
- **ACN Token:** X3qkitDb1LBQlRYdFxpheUcege3WGOyGQY7aqYWKQAg
- **ACN API:** https://ev.caltech.edu/api/v1

---

## Installation

### Step 1: Navigate to Backend Directory
```bash
cd AI4bharat\backend
```

### Step 2: Create Virtual Environment
```bash
python -m venv venv
```

### Step 3: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

Expected packages:
- fastapi==0.115.5
- uvicorn==0.32.1
- sqlalchemy==2.0.23
- alembic==1.13.1
- psycopg2-binary==2.9.9
- pandas==2.2.3
- requests==2.31.0
- pytest==7.4.3
- python-dotenv==1.0.1

### Step 5: Verify Installation
```bash
python -c "import fastapi, sqlalchemy, pandas, requests; print('✅ All packages installed')"
```

---

## Database Setup

### Step 1: Verify PostgreSQL is Running
```bash
# Check if PostgreSQL is accessible
psql -h localhost -p 5433 -U postgres -c "SELECT version();"
```

### Step 2: Create Database (if not exists)
```bash
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE chargewise;"
```

### Step 3: Run Migrations

**Option A: Use Batch Script (Windows)**
```bash
cd ..
run-migrations.bat
```

**Option B: Manual**
```bash
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial schema for ChargeWise AI
```

### Step 4: Verify Tables Created
```bash
psql -h localhost -p 5433 -U postgres -d chargewise -c "\dt"
```

Expected tables:
- charging_sessions
- feeder_load
- alembic_version

---

## Running the System

### Phase 1: Data Ingestion

#### Run Ingestion Pipeline

**Option A: Use Batch Script (Windows)**
```bash
cd ..
run-ingestion.bat
```

**Option B: Manual**
```bash
python scripts\ingest_acn.py
```

#### Expected Output
```
🚀 Starting ACN data ingestion...
📡 Fetching sessions from ACN API...
✅ Fetched 150 sessions
🔄 Transforming data...
✅ Transformed 145 valid sessions
⚡ Generating feeder load time-series...
✅ Generated 2880 load intervals
💾 Storing data in PostgreSQL...
✅ Inserted 145 sessions and 2880 load records
🎉 Ingestion complete!
```

#### Verify Data in Database
```sql
-- Connect to database
psql -h localhost -p 5433 -U postgres -d chargewise

-- Check session count
SELECT COUNT(*) FROM charging_sessions;

-- View sample sessions
SELECT * FROM charging_sessions LIMIT 5;

-- Check load count
SELECT COUNT(*) FROM feeder_load;

-- View load summary
SELECT 
    feeder_id,
    DATE(timestamp) as date,
    COUNT(*) as intervals,
    AVG(load_kw) as avg_load,
    MAX(load_kw) as peak_load
FROM feeder_load
GROUP BY feeder_id, DATE(timestamp);
```

### Phase 2: Start API Server

#### Start FastAPI Server

**Option A: Use Existing Script (Windows)**
```bash
cd ..
start-backend.bat
```

**Option B: Manual**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Expected Output
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Verify API is Running
Open browser: http://localhost:8000

Expected response:
```json
{
  "status": "ok",
  "message": "ChargeWise AI + Grid Optimizer API"
}
```

---

## Testing

### Run All Tests

**Option A: Use Batch Script (Windows)**
```bash
cd ..
run-tests.bat
```

**Option B: Manual**
```bash
pytest -v
```

### Expected Test Results
```
tests/test_acn_client.py::test_fetch_sessions_single_page PASSED      [ 7%]
tests/test_acn_client.py::test_fetch_sessions_with_pagination PASSED  [14%]
tests/test_acn_client.py::test_fetch_sessions_empty PASSED            [21%]
tests/test_transform.py::test_transform_valid_sessions PASSED         [28%]
tests/test_transform.py::test_transform_filters_invalid_rows PASSED   [35%]
tests/test_transform.py::test_transform_empty_input PASSED            [42%]
tests/test_transform.py::test_transform_custom_max_power PASSED       [50%]
tests/test_load_builder.py::test_build_load_basic PASSED              [57%]
tests/test_load_builder.py::test_build_load_overlapping_sessions PASSED [64%]
tests/test_load_builder.py::test_build_load_empty_input PASSED        [71%]
tests/test_load_builder.py::test_build_load_custom_interval PASSED    [78%]
tests/test_api.py::test_get_sessions_endpoint PASSED                  [85%]
tests/test_api.py::test_get_load_endpoint PASSED                      [92%]
tests/test_api.py::test_get_load_endpoint_no_filter PASSED            [100%]

============================== 14 passed in 0.8s ===============================
```

### Run Specific Test File
```bash
pytest tests/test_acn_client.py -v
```

### Run with Coverage
```bash
pytest --cov=app.chargewise --cov-report=html
```

---

## API Usage

### Interactive API Documentation

**Swagger UI:** http://localhost:8000/docs
**ReDoc:** http://localhost:8000/redoc

### Endpoint 1: Get Charging Sessions

**Request:**
```bash
GET http://localhost:8000/v1/sessions?limit=10
```

**cURL:**
```bash
curl http://localhost:8000/v1/sessions?limit=10
```

**Response:**
```json
[
  {
    "id": 1,
    "station_id": "CA-1234",
    "start_time": "2024-01-01T10:00:00",
    "end_time": "2024-01-01T12:00:00",
    "energy_kwh": 15.5,
    "max_power_kw": 7.0
  },
  {
    "id": 2,
    "station_id": "CA-5678",
    "start_time": "2024-01-01T14:00:00",
    "end_time": "2024-01-01T16:00:00",
    "energy_kwh": 20.0,
    "max_power_kw": 7.0
  }
]
```

### Endpoint 2: Get Feeder Load

**Request:**
```bash
GET http://localhost:8000/v1/load?feeder_id=caltech_main&limit=20
```

**cURL:**
```bash
curl "http://localhost:8000/v1/load?feeder_id=caltech_main&limit=20"
```

**Response:**
```json
[
  {
    "id": 1,
    "feeder_id": "caltech_main",
    "timestamp": "2024-01-01T10:00:00",
    "load_kw": 25.5
  },
  {
    "id": 2,
    "feeder_id": "caltech_main",
    "timestamp": "2024-01-01T10:15:00",
    "load_kw": 32.0
  }
]
```

### Python Client Example

```python
import requests

# Get sessions
response = requests.get('http://localhost:8000/v1/sessions', params={'limit': 5})
sessions = response.json()
print(f"Found {len(sessions)} sessions")

# Get load data
response = requests.get('http://localhost:8000/v1/load', params={
    'feeder_id': 'caltech_main',
    'limit': 100
})
load_data = response.json()
print(f"Found {len(load_data)} load intervals")
```

---

## Troubleshooting

### Issue 1: Database Connection Error

**Error:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5433
   ```
2. Check credentials in `.env` file
3. Ensure database exists:
   ```bash
   psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE chargewise;"
   ```

### Issue 2: ACN API Authentication Failed

**Error:**
```
requests.exceptions.HTTPError: 401 Client Error: Unauthorized
```

**Solution:**
1. Verify ACN_TOKEN in `.env` file
2. Check token hasn't expired
3. Test token manually:
   ```bash
   curl -u "X3qkitDb1LBQlRYdFxpheUcege3WGOyGQY7aqYWKQAg:" https://ev.caltech.edu/api/v1/sessions?limit=1
   ```

### Issue 3: Migration Error

**Error:**
```
alembic.util.exc.CommandError: Target database is not up to date
```

**Solution:**
1. Check current version:
   ```bash
   alembic current
   ```
2. Drop tables and re-migrate:
   ```sql
   DROP TABLE IF EXISTS charging_sessions, feeder_load, alembic_version CASCADE;
   ```
3. Re-run migration:
   ```bash
   alembic upgrade head
   ```

### Issue 4: Import Error

**Error:**
```
ModuleNotFoundError: No module named 'app.chargewise'
```

**Solution:**
1. Ensure virtual environment is activated
2. Verify you're in the correct directory (backend/)
3. Reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Issue 5: Port Already in Use

**Error:**
```
OSError: [Errno 98] Address already in use
```

**Solution:**
1. Find process using port 8000:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   
   # Linux/Mac
   lsof -i :8000
   ```
2. Kill the process or use different port:
   ```bash
   python -m uvicorn app.main:app --reload --port 8001
   ```

### Issue 6: Tests Failing

**Error:**
```
ImportError: cannot import name 'ChargingSession'
```

**Solution:**
1. Ensure all `__init__.py` files exist
2. Run tests from backend directory
3. Clear Python cache:
   ```bash
   find . -type d -name __pycache__ -exec rm -r {} +
   ```

---

## Quick Reference Commands

### Daily Workflow

```bash
# 1. Activate environment
cd backend
venv\Scripts\activate

# 2. Ingest new data
python scripts\ingest_acn.py

# 3. Start API server
python -m uvicorn app.main:app --reload

# 4. Run tests (optional)
pytest -v
```

### Database Commands

```bash
# Connect to database
psql -h localhost -p 5433 -U postgres -d chargewise

# View all sessions
SELECT * FROM charging_sessions ORDER BY start_time DESC LIMIT 10;

# View load summary
SELECT feeder_id, COUNT(*), AVG(load_kw), MAX(load_kw) 
FROM feeder_load 
GROUP BY feeder_id;

# Clear all data (keep schema)
TRUNCATE TABLE charging_sessions, feeder_load;
```

### Alembic Commands

```bash
# Check current version
alembic current

# View migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Downgrade one version
alembic downgrade -1

# Create new migration
alembic revision -m "description"
```

---

## File Locations

### Configuration Files
- `.env` - Environment variables (DATABASE_URL, ACN_TOKEN)
- `alembic.ini` - Alembic configuration
- `pytest.ini` - Pytest configuration
- `requirements.txt` - Python dependencies

### Source Code
- `app/chargewise/` - ChargeWise AI modules
- `app/chargewise/models/` - SQLAlchemy models
- `app/chargewise/services/` - Business logic
- `app/chargewise/routes/` - API endpoints
- `scripts/ingest_acn.py` - Ingestion pipeline

### Tests
- `tests/test_acn_client.py` - ACN client tests
- `tests/test_transform.py` - Transformer tests
- `tests/test_load_builder.py` - Load builder tests
- `tests/test_api.py` - API endpoint tests

### Documentation
- `CHARGEWISE_README.md` - Technical documentation
- `CHARGEWISE_QUICKSTART.md` - Quick start guide
- `CHARGEWISE_IMPLEMENTATION.md` - Implementation summary
- `CHARGEWISE_ARCHITECTURE.md` - Architecture diagrams

---

## Success Checklist

- [ ] Virtual environment created and activated
- [ ] All dependencies installed
- [ ] PostgreSQL running on port 5433
- [ ] Database `chargewise` created
- [ ] Migrations applied successfully
- [ ] Data ingestion completed
- [ ] API server running on port 8000
- [ ] All 14 tests passing
- [ ] API endpoints returning data
- [ ] Documentation reviewed

---

## Next Steps

After successful setup:

1. **Explore API:** Visit http://localhost:8000/docs
2. **Query Data:** Use SQL to analyze charging patterns
3. **Schedule Ingestion:** Set up cron job or Task Scheduler
4. **Monitor Performance:** Check database size and query times
5. **Read Documentation:** Review architecture and implementation docs

---

## Support & Resources

- **API Documentation:** http://localhost:8000/docs
- **Technical Docs:** CHARGEWISE_README.md
- **Architecture:** CHARGEWISE_ARCHITECTURE.md
- **Quick Start:** CHARGEWISE_QUICKSTART.md
- **Implementation:** CHARGEWISE_IMPLEMENTATION.md

---

## Version Information

- **Feature:** 1 (Telemetry Integration)
- **Version:** 1.0.0
- **Status:** Production Ready
- **Last Updated:** 2024

---

**🎉 You're all set! ChargeWise AI is ready to use.**

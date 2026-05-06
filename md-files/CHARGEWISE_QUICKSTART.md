# ChargeWise AI - Quick Start Guide

## 🎯 What You're Building

A production-ready EV charging grid telemetry system that:
1. Fetches real charging session data from ACN API
2. Normalizes and stores it in PostgreSQL
3. Generates feeder load time-series
4. Exposes data via REST API

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Verify Database

Ensure PostgreSQL is running:
- Host: localhost
- Port: 5433
- Database: chargewise
- User: postgres
- Password: Postgre@7482

### Step 3: Run Migrations

```bash
# Option A: Use batch script
..\run-migrations.bat

# Option B: Manual
alembic upgrade head
```

This creates two tables:
- `charging_sessions`
- `feeder_load`

### Step 4: Ingest Data

```bash
# Option A: Use batch script
..\run-ingestion.bat

# Option B: Manual
python scripts\ingest_acn.py
```

Expected output:
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

### Step 5: Start API Server

```bash
# Option A: Use existing script
..\start-backend.bat

# Option B: Manual
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Test API

Open browser: http://localhost:8000/docs

Try these endpoints:
- `GET /v1/sessions` - View charging sessions
- `GET /v1/load` - View feeder load data

## 🧪 Run Tests

```bash
# Option A: Use batch script
..\run-tests.bat

# Option B: Manual
pytest -v
```

All tests should pass:
```
tests/test_acn_client.py::test_fetch_sessions_single_page PASSED
tests/test_acn_client.py::test_fetch_sessions_with_pagination PASSED
tests/test_transform.py::test_transform_valid_sessions PASSED
tests/test_load_builder.py::test_build_load_basic PASSED
tests/test_api.py::test_get_sessions_endpoint PASSED
```

## 📊 Verify Data

### Check Database

```sql
-- Connect to PostgreSQL
psql -h localhost -p 5433 -U postgres -d chargewise

-- Count sessions
SELECT COUNT(*) FROM charging_sessions;

-- View sample sessions
SELECT * FROM charging_sessions LIMIT 5;

-- Count load records
SELECT COUNT(*) FROM feeder_load;

-- View load summary
SELECT 
    feeder_id,
    DATE(timestamp) as date,
    AVG(load_kw) as avg_load,
    MAX(load_kw) as peak_load
FROM feeder_load
GROUP BY feeder_id, DATE(timestamp);
```

### Test API with curl

```bash
# Get sessions
curl http://localhost:8000/v1/sessions?limit=5

# Get load data
curl http://localhost:8000/v1/load?feeder_id=caltech_main&limit=10
```

## 🏗️ Architecture Overview

```
┌─────────────┐
│  ACN API    │
└──────┬──────┘
       │ fetch_sessions()
       ▼
┌─────────────┐
│ ACN Client  │ (pagination, auth)
└──────┬──────┘
       │ raw sessions
       ▼
┌─────────────┐
│ Transformer │ (normalize, validate)
└──────┬──────┘
       │ clean DataFrame
       ▼
┌─────────────┐
│Load Builder │ (15-min intervals)
└──────┬──────┘
       │ time-series
       ▼
┌─────────────┐
│ Repository  │ (bulk insert)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FastAPI    │ (REST endpoints)
└─────────────┘
```

## 🔧 Configuration

All settings in `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:Postgre@7482@localhost:5433/chargewise

# ACN API
ACN_TOKEN=X3qkitDb1LBQlRYdFxpheUcege3WGOyGQY7aqYWKQAg
ACN_BASE_URL=https://ev.caltech.edu/api/v1

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

## 📁 File Structure

```
backend/
├── app/chargewise/
│   ├── models/__init__.py          # SQLAlchemy models
│   ├── services/
│   │   ├── acn_client.py           # API client
│   │   ├── transform.py            # Data normalization
│   │   ├── load_builder.py         # Time-series generation
│   │   └── repository.py           # Database operations
│   ├── routes/api.py               # FastAPI endpoints
│   └── database.py                 # DB config
├── scripts/ingest_acn.py           # Ingestion pipeline
├── tests/                          # Pytest tests
└── alembic/                        # Database migrations
```

## 🚨 Troubleshooting

### "Connection refused" error
- Check PostgreSQL is running: `pg_isready -h localhost -p 5433`
- Verify credentials in `.env`

### "Table already exists" error
```bash
# Drop and recreate
alembic downgrade base
alembic upgrade head
```

### "ACN API authentication failed"
- Verify ACN_TOKEN in `.env`
- Check token hasn't expired

### Tests failing
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run with verbose output
pytest -v -s
```

## ✅ Success Criteria

You've successfully completed Feature 1 when:

1. ✅ `python scripts/ingest_acn.py` runs without errors
2. ✅ Data is visible in PostgreSQL tables
3. ✅ API endpoints return data at http://localhost:8000/docs
4. ✅ All tests pass with `pytest`
5. ✅ Code is modular and follows Deep Module principles

## 🎓 Key Design Principles

1. **Deep Modules**: Each module has simple interface, hides complexity
2. **Single Responsibility**: Each class does one thing well
3. **Test-First**: All core logic has unit tests
4. **No Overengineering**: Batch processing only, no streaming/ML yet
5. **Production-Ready**: Error handling, type hints, documentation

## 📚 Next Steps

This is Feature 1 only. Future features (NOT implemented):
- Load forecasting with ML
- Real-time streaming
- Advanced analytics
- Multi-feeder optimization

## 🆘 Support

Check these files for more details:
- `CHARGEWISE_README.md` - Full documentation
- `tests/` - Example usage patterns
- API docs - http://localhost:8000/docs

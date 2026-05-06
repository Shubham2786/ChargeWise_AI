# ChargeWise AI - Backend Setup

## Overview

ChargeWise AI is an EV charging grid optimization system that integrates real-time telemetry from the ACN (Adaptive Charging Network) API.

**Feature 1: Real Grid + Charger Telemetry Integration**
- Fetch EV charging session data from ACN API
- Normalize and store in PostgreSQL
- Generate feeder load time-series
- Expose via FastAPI endpoints

## Architecture

### Modules (Deep Module Design)

1. **ACN Client** (`services/acn_client.py`)
   - Fetches sessions from ACN API
   - Handles pagination automatically
   - Supports filtering by kWhDelivered

2. **Transformer** (`services/transform.py`)
   - Normalizes raw API data
   - Validates and cleans sessions
   - Converts timestamps

3. **Load Builder** (`services/load_builder.py`)
   - Generates time-series load data
   - 15-minute interval aggregation
   - Handles overlapping sessions

4. **Repository** (`services/repository.py`)
   - Database operations (bulk insert)
   - Query methods for API endpoints

5. **API Layer** (`routes/api.py`)
   - FastAPI endpoints
   - Pydantic response models

## Prerequisites

- Python 3.11+
- PostgreSQL 14+ (running on port 5433)
- Database: `chargewise`

## Installation

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file (already configured):
```
DATABASE_URL=postgresql://postgres:Postgre@7482@localhost:5433/chargewise
ACN_TOKEN=X3qkitDb1LBQlRYdFxpheUcege3WGOyGQY7aqYWKQAg
ACN_BASE_URL=https://ev.caltech.edu/api/v1
```

### 3. Run Database Migrations

```bash
# Apply migrations
alembic upgrade head
```

### 4. Ingest ACN Data

```bash
# Run ingestion pipeline
python scripts/ingest_acn.py
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

### 5. Start API Server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### GET /v1/sessions
Get latest charging sessions.

**Query Parameters:**
- `limit` (int, default=100): Max number of sessions

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
  }
]
```

### GET /v1/load
Get feeder load time-series.

**Query Parameters:**
- `feeder_id` (str, optional): Filter by feeder
- `limit` (int, default=1000): Max number of records

**Response:**
```json
[
  {
    "id": 1,
    "feeder_id": "caltech_main",
    "timestamp": "2024-01-01T10:00:00",
    "load_kw": 25.5
  }
]
```

## Testing

Run all tests:
```bash
pytest
```

Run specific test file:
```bash
pytest tests/test_acn_client.py -v
```

## Database Schema

### charging_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| station_id | String | Charging station ID (indexed) |
| start_time | DateTime | Session start (indexed) |
| end_time | DateTime | Session end |
| energy_kwh | Float | Energy delivered |
| max_power_kw | Float | Max power rating |

### feeder_load
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| feeder_id | String | Feeder identifier (indexed) |
| timestamp | DateTime | Time interval start (indexed) |
| load_kw | Float | Aggregated load |

## Project Structure

```
backend/
├── app/
│   ├── chargewise/
│   │   ├── models/
│   │   │   └── __init__.py          # SQLAlchemy models
│   │   ├── routes/
│   │   │   └── api.py               # FastAPI endpoints
│   │   ├── services/
│   │   │   ├── acn_client.py        # ACN API client
│   │   │   ├── transform.py         # Data transformation
│   │   │   ├── load_builder.py      # Load generation
│   │   │   └── repository.py        # Database operations
│   │   └── database.py              # DB configuration
│   └── main.py                      # FastAPI app
├── alembic/
│   ├── versions/
│   │   └── 001_initial_schema.py    # Initial migration
│   └── env.py                       # Alembic config
├── scripts/
│   └── ingest_acn.py                # Ingestion pipeline
├── tests/
│   ├── test_acn_client.py
│   ├── test_transform.py
│   ├── test_load_builder.py
│   └── test_api.py
├── requirements.txt
├── alembic.ini
├── pytest.ini
└── .env
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running on port 5433
- Check credentials in `.env`
- Ensure database `chargewise` exists

### ACN API Error
- Verify ACN_TOKEN is valid
- Check network connectivity
- API may have rate limits

### Migration Error
- Drop tables: `DROP TABLE charging_sessions, feeder_load CASCADE;`
- Re-run: `alembic upgrade head`

## Next Steps

This implementation covers Feature 1 only:
- ✅ ACN API integration
- ✅ Data normalization
- ✅ Load time-series generation
- ✅ PostgreSQL storage
- ✅ FastAPI endpoints
- ✅ Comprehensive tests

Future features (NOT implemented):
- ❌ Load forecasting
- ❌ ML models
- ❌ Real-time streaming
- ❌ Advanced analytics

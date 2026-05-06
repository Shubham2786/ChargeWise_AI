# ChargeWise AI - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChargeWise AI                             │
│                   Feature 1: Telemetry Integration               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   ACN API    │  External Data Source
│ (Caltech EV) │  https://ev.caltech.edu/api/v1/sessions
└──────┬───────┘
       │ HTTP GET (Basic Auth)
       │ Pagination via _links.next
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐                                            │
│  │  ACN Client     │  fetch_sessions(min_kwh, limit)            │
│  │                 │  → List[Dict]                              │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  Transformer    │  transform(raw_sessions)                   │
│  │                 │  → DataFrame[station_id, start_time, ...]  │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  Load Builder   │  build_load(sessions_df, feeder_id)        │
│  │                 │  → DataFrame[timestamp, feeder_id, load]   │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  Repository     │  insert_sessions(db, df)                   │
│  │                 │  insert_load(db, df)                       │
│  └────────┬────────┘  get_sessions(db, limit)                   │
│           │           get_load(db, feeder_id, limit)            │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PostgreSQL (localhost:5433/chargewise)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  charging_sessions                                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  id (PK)                                                 │   │
│  │  station_id (indexed)                                    │   │
│  │  start_time (indexed)                                    │   │
│  │  end_time                                                │   │
│  │  energy_kwh                                              │   │
│  │  max_power_kw                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  feeder_load                                             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  id (PK)                                                 │   │
│  │  feeder_id (indexed)                                     │   │
│  │  timestamp (indexed)                                     │   │
│  │  load_kw                                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                        API LAYER                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FastAPI (localhost:8000)                                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  GET /v1/sessions?limit=100                            │     │
│  │  → List[SessionResponse]                               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  GET /v1/load?feeder_id=X&limit=1000                   │     │
│  │  → List[LoadResponse]                                  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Clients     │
                    │ (Browser/API) │
                    └───────────────┘
```

## Module Interfaces (Deep Modules)

### 1. ACN Client
```python
class ACNClient:
    def fetch_sessions(
        min_kwh: float = 0.0,
        limit: int = 1000
    ) -> List[Dict]
```
**Hides:** Auth, pagination, retries, error handling

### 2. Transformer
```python
class SessionTransformer:
    @staticmethod
    def transform(
        raw_sessions: List[Dict],
        default_max_power_kw: float = 7.0
    ) -> pd.DataFrame
```
**Hides:** Field mapping, validation, type conversion, filtering

### 3. Load Builder
```python
class LoadBuilder:
    @staticmethod
    def build_load(
        sessions_df: pd.DataFrame,
        feeder_id: str = "default",
        interval_minutes: int = 15
    ) -> pd.DataFrame
```
**Hides:** Time range calculation, interval generation, aggregation

### 4. Repository
```python
class Repository:
    @staticmethod
    def insert_sessions(db: Session, sessions_df: pd.DataFrame) -> int
    
    @staticmethod
    def insert_load(db: Session, load_df: pd.DataFrame) -> int
    
    @staticmethod
    def get_sessions(db: Session, limit: int = 100) -> List[ChargingSession]
    
    @staticmethod
    def get_load(db: Session, feeder_id: str = None, limit: int = 1000) -> List[FeederLoad]
```
**Hides:** Bulk insert optimization, transactions, ORM mapping

## Data Flow Example

### Ingestion Pipeline

```
Step 1: Fetch
─────────────
ACN API Response:
{
  "_items": [
    {
      "stationID": "CA-1234",
      "connectionTime": "2024-01-01T10:00:00Z",
      "disconnectTime": "2024-01-01T12:00:00Z",
      "kWhDelivered": 15.5
    }
  ],
  "_links": {"next": {"href": "..."}}
}

Step 2: Transform
─────────────────
DataFrame:
  station_id | start_time          | end_time            | energy_kwh | max_power_kw
  CA-1234    | 2024-01-01 10:00:00 | 2024-01-01 12:00:00 | 15.5       | 7.0

Step 3: Build Load
──────────────────
DataFrame:
  timestamp           | feeder_id     | load_kw
  2024-01-01 10:00:00 | caltech_main  | 7.0
  2024-01-01 10:15:00 | caltech_main  | 7.0
  2024-01-01 10:30:00 | caltech_main  | 7.0
  ...

Step 4: Store
─────────────
PostgreSQL:
  INSERT INTO charging_sessions (145 rows)
  INSERT INTO feeder_load (2880 rows)
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Language:      Python 3.11                                 │
│  Web Framework: FastAPI 0.115.5                             │
│  Database:      PostgreSQL 14+                              │
│  ORM:           SQLAlchemy 2.0.23                           │
│  Migrations:    Alembic 1.13.1                              │
│  Data:          Pandas 2.2.3                                │
│  HTTP:          Requests 2.31.0                             │
│  Testing:       Pytest 7.4.3                                │
│  Server:        Uvicorn 0.32.1                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   PostgreSQL     │         │   FastAPI        │         │
│  │   Port: 5433     │◄────────┤   Port: 8000     │         │
│  │   DB: chargewise │         │   Workers: 1     │         │
│  └──────────────────┘         └────────┬─────────┘         │
│                                         │                    │
│                                         ▼                    │
│                              ┌──────────────────┐           │
│                              │   Browser        │           │
│                              │   localhost:8000 │           │
│                              └──────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Ingestion: Manual trigger via scripts/ingest_acn.py
Frequency: On-demand (can be scheduled with cron/Task Scheduler)
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ACN API Authentication                                  │
│     └─ HTTP Basic Auth (token in .env)                     │
│                                                              │
│  2. Database Access                                         │
│     └─ PostgreSQL credentials (in .env)                    │
│     └─ Local network only (localhost:5433)                 │
│                                                              │
│  3. API Endpoints                                           │
│     └─ No authentication (internal tool)                   │
│     └─ CORS enabled for localhost origins                  │
│                                                              │
│  4. Environment Variables                                   │
│     └─ Stored in .env (not in version control)            │
│     └─ Loaded via python-dotenv                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ACN API Error                                              │
│  └─ requests.HTTPError                                      │
│     └─ Raised by response.raise_for_status()               │
│        └─ Propagates to ingestion script                   │
│           └─ Logged and script exits                       │
│                                                              │
│  Data Validation Error                                      │
│  └─ Invalid rows filtered silently                         │
│     └─ Logged count of filtered rows                       │
│                                                              │
│  Database Error                                             │
│  └─ SQLAlchemy exceptions                                  │
│     └─ Transaction rolled back                             │
│        └─ Error logged and propagated                      │
│                                                              │
│  API Request Error                                          │
│  └─ FastAPI automatic validation                           │
│     └─ 422 Unprocessable Entity                            │
│        └─ Pydantic error details in response               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│                      PERFORMANCE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Ingestion Pipeline (1000 sessions):                        │
│  ├─ ACN API Fetch:        2-5 seconds                       │
│  ├─ Data Transform:       <1 second                         │
│  ├─ Load Generation:      1-2 seconds                       │
│  └─ Database Insert:      <1 second                         │
│     Total:                5-10 seconds                       │
│                                                              │
│  API Endpoints:                                             │
│  ├─ GET /v1/sessions:     <100ms (indexed)                  │
│  └─ GET /v1/load:         <200ms (indexed)                  │
│                                                              │
│  Database Size (1000 sessions):                             │
│  ├─ charging_sessions:    ~100 KB                           │
│  └─ feeder_load:          ~2 MB (15-min intervals)          │
│                                                              │
│  Test Suite:                                                │
│  └─ 14 tests:             <1 second                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
Current Implementation (MVP):
├─ Batch processing (manual trigger)
├─ Single-threaded ingestion
├─ No caching
└─ Suitable for: <10K sessions/day

Future Optimizations (if needed):
├─ Scheduled ingestion (cron/Celery)
├─ Parallel processing (multiprocessing)
├─ Redis caching for API responses
├─ TimescaleDB for time-series optimization
└─ Suitable for: >100K sessions/day
```

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        ▲                                     │
│                       ╱ ╲                                    │
│                      ╱   ╲                                   │
│                     ╱ E2E ╲     (Not implemented)           │
│                    ╱───────╲                                 │
│                   ╱         ╲                                │
│                  ╱Integration╲  (Not implemented)           │
│                 ╱─────────────╲                              │
│                ╱               ╲                             │
│               ╱   Unit Tests    ╲  (14 tests)               │
│              ╱─────────────────── ╲                          │
│             ╱                      ╲                         │
│            ╱    Mocked External     ╲                        │
│           ╱      Dependencies        ╲                       │
│          ╱──────────────────────────── ╲                     │
│                                                              │
│  Unit Tests (14):                                           │
│  ├─ ACN Client (3 tests)                                    │
│  ├─ Transformer (4 tests)                                   │
│  ├─ Load Builder (4 tests)                                  │
│  └─ API Endpoints (3 tests)                                 │
│                                                              │
│  All external dependencies mocked:                          │
│  ├─ ACN API (requests.get)                                  │
│  ├─ Database (Repository methods)                           │
│  └─ Fast execution (<1 second)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

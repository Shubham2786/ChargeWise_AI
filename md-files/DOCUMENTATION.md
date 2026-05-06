# ChargeWise AI — Complete Technical Documentation

## 1. What Is ChargeWise AI?

ChargeWise AI is a full-stack EV grid intelligence platform designed for utility operators, fleet managers, and smart city infrastructure teams. It ingests real EV charging session data from the ACN (Adaptive Charging Network) API at Caltech, stores it in a PostgreSQL database, and runs a suite of ML models and optimization algorithms to answer a core question:

> **How do we manage EV charging demand on the grid without causing overloads, price spikes, or wasted capacity?**

The platform exposes all results through a FastAPI REST API and renders them in a React dashboard with 9 dedicated intelligence views. Every feature in the system feeds from a shared data pipeline, ensuring numbers are always consistent across views.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                   │
│  Dashboard · Forecast · Risk · Schedule · Pricing        │
│  Anomaly · Hierarchy · Planning · System Overview        │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP (Axios)
┌────────────────────▼─────────────────────────────────────┐
│              FastAPI Backend (Uvicorn)                   │
│  /v1/* routes → ChargeWise AI feature endpoints          │
│  /forecast, /risk, /schedule → Legacy resolver layer     │
└──┬──────────────┬──────────────────────────────┬─────────┘
   │              │                              │
   ▼              ▼                              ▼
PostgreSQL    ML Models                    Provider Resolver
(sessions,    (XGBoost,                   (USE_AI_DEMO_DATA)
 feeder_load)  SHAP, DBSCAN)               ├── GroqProvider
                                           └── XGBoostProvider
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Framer Motion, Axios |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Database | PostgreSQL (via SQLAlchemy ORM + Alembic) |
| ML Models | XGBoost (quantile regression), scikit-learn, SHAP |
| Spatial | DBSCAN clustering (scikit-learn) |
| AI Demo Layer | Groq (llama-3.1-8b-instant), Pydantic, cachetools |
| Config | python-dotenv, Pydantic Settings |

---

## 3. Data Sources & Ingestion

### 3.1 ACN (Adaptive Charging Network) API

- **Provider**: Caltech EV Research Group (`https://ev.caltech.edu/api/v1`)
- **Sites supported**: `caltech`, `jpl`
- **Authentication**: Token-based HTTP Basic Auth (`ACN_TOKEN`)
- **Client**: `backend/app/chargewise/services/acn_client.py`
- **Behaviour**: Paginated fetch with exponential-backoff retry (up to 3 retries, 2^n second delay). Supports `min_kwh` filter and `max_pages` limit.

### 3.2 Database Schema (PostgreSQL)

**Table: `charging_sessions`**

| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `station_id` | String | Charger identifier |
| `start_time` | DateTime | Session start (UTC) |
| `end_time` | DateTime | Session end (UTC) |
| `energy_kwh` | Float | Total energy delivered |
| `max_power_kw` | Float | Peak power during session |
| `duration_minutes` | Integer | Session length |

Unique constraint: `(station_id, start_time)` — prevents duplicate ingestion.

**Table: `feeder_load`**

| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `feeder_id` | String | Grid feeder identifier |
| `timestamp` | DateTime | Reading time |
| `load_kw` | Float | Measured feeder load |

---

## 4. Feature Engineering Pipeline

**Module**: `backend/app/chargewise/services/features.py`

All ML features are derived from raw charging sessions. The pipeline:

1. **Fetch hourly aggregates**: Sessions are grouped into 1-hour buckets using `resample("1h")`, producing `total_energy_kwh` and `session_count` per hour.
2. **Fill gaps**: Missing hours filled with 0 via `asfreq("1h").fillna(0)`.
3. **Add time features**:
   - `hour_of_day` — 0 to 23
   - `day_of_week` — 0 (Mon) to 6 (Sun)
   - `is_weekend` — binary flag
4. **Add lag features** (autoregressive inputs):
   - `lag_1h` — demand 1 hour ago
   - `lag_24h` — demand yesterday same hour
   - `lag_168h` — demand 1 week ago (same hour/day)
5. **Training target**: `total_energy_kwh` shifted by -1 (next hour's demand). Rows with any NaN are dropped, enforcing a strict no-leakage guarantee.

---

## 5. Core ML Models

### 5.1 Demand Forecast Model (XGBoost Point Forecast)

**Module**: `backend/app/chargewise/services/forecasting.py`

- **Algorithm**: XGBoost Regressor (100 estimators, depth 4, lr 0.1)
- **Split**: Temporal 80/20 train/test
- **Baseline comparison**: Training logs RMSE vs. naive `lag_1h` baseline
- **Persistence**: Model saved to `app/data/forecast_model.pkl`, feature columns to `app/data/forecast_meta.json`
- **Inference**: Fully **autoregressive** — each predicted hour is appended to the working DataFrame, lags are recomputed, and the next hour is predicted using those updated lags. This continues for the full `horizon_hours` (default 24).
- **Cold start**: If fewer than 168 hours of history exist or the model is untrained, falls back to a flat forecast using the last known `total_energy_kwh`.
- **Training trigger**: Via ingestion pipeline (not on every request)

### 5.2 Probabilistic Forecast Model (XGBoost Quantile Regression)

**Module**: `backend/app/forecasting/probabilistic.py`

- **Three models trained independently**:
  - `model_10`: `objective='reg:quantileerror', quantile_alpha=0.1` → **P10** (lower bound)
  - `model_50`: `quantile_alpha=0.5` → **P50** (median / best estimate)
  - `model_90`: `quantile_alpha=0.9` → **P90** (upper bound / worst case)
- **Post-processing**: After each prediction step, quantiles are sorted to prevent crossing: `p10 = min(p10,p50,p90)`, `p50 = median`, `p90 = max` — ensuring the statistical ordering is always valid.
- **Autoregressive**: Uses P50 as the "actual" value to propagate lags forward.
- **In-memory cache**: 5-minute TTL keyed on `(station_id, horizon_hours)` — prevents redundant recalculation across the same request cycle.

### 5.3 SHAP Explainability

**Module**: `backend/app/chargewise/services/explain.py`

- Uses `shap.TreeExplainer` (fast, exact SHAP values for tree models).
- For each forecast point (first 3 hours), computes SHAP values on the feature vector.
- Identifies top 2 driving features by absolute SHAP magnitude.
- Maps internal feature names to human-readable text:
  - `lag_1h` → "previous hour's load"
  - `lag_24h` → "yesterday's pattern"
  - `lag_168h` → "last week's pattern"
  - `hour_of_day` → "time of day (HH:00)"
  - `is_weekend` → "weekend/weekday pattern"
- Returns explanation strings like: *"Forecast driven heavily by previous hour's load (increasing impact) and time of day (decreasing impact)."*

---

## 6. API Endpoints (Full Reference)

Base URL: `http://localhost:8000`

### Legacy / Resolver Routes

| Method | Path | Description |
|---|---|---|
| GET | `/generate-data` | Regenerate synthetic CSV data |
| GET | `/forecast` | XGBoost point forecast (24h) |
| GET | `/risk` | Risk level from forecast peak |
| GET | `/schedule` | EDF load-shifting schedule |
| GET | `/explain` | SHAP feature importance summary |

### ChargeWise AI Routes (`/v1/`)

| Method | Path | Description |
|---|---|---|
| GET | `/v1/sessions` | Charging sessions (filterable) |
| GET | `/v1/load` | Feeder load time-series |
| GET | `/v1/forecast` | XGBoost point forecast + SHAP |
| GET | `/v1/schedule/recommendation` | Hybrid EDF smart schedule |
| GET | `/v1/planning/candidates` | DBSCAN infrastructure sites |
| GET | `/v1/forecast/probabilistic` | P10/P50/P90 quantile forecast |
| GET | `/v1/risk` | Overload probability from P90 |
| GET | `/v1/pricing` | Dynamic pricing curve |
| GET | `/v1/anomalies` | Charging spike detection |
| GET | `/v1/forecast/hierarchy` | Station→System hierarchical forecast |
| GET | `/v1/dashboard/summary` | All 6 features in one response |

**Query parameters** (most endpoints):
- `station_id` — filter to specific charger (optional)
- `horizon_hours` — forecast window in hours (default 24)

---

## 7. Grid Risk Engine

**Module**: `backend/app/risk/engine.py`

**Input**: Probabilistic forecast (list of `{timestamp, p10, p50, p90}`)

**Logic**: Evaluates worst-case hour across the entire horizon against `MAX_CAPACITY_KW = 150 kW`.

```
if max_p90 > capacity → risk_level = HIGH
elif max_p50 > capacity → risk_level = MEDIUM
else → risk_level = LOW
```

**Probability calculation**:
- HIGH: `0.50 + ((max_p90 - capacity) / capacity) * 0.5`, capped at 1.0
- MEDIUM: `0.10 + ((max_p50 - capacity) / capacity) * 0.4`
- LOW: fixed `0.05`

**Output**: `{risk_level, probability, details[]}` where `details` is per-hour risk classification for chart rendering.

---

## 8. Smart Charging Scheduler (Hybrid EDF)

**Module**: `backend/app/optimization/scheduler.py`

The scheduler implements a **Hybrid Earliest Deadline First (EDF)** algorithm combining proportional urgency allocation with EDF rollover for unused capacity.

**Grid constraint**: `MAX_CAPACITY_KW = 150 kW`, `MIN_ALLOCATION_KW = 1 kW`

**Input**:
- `forecast`: 24-hour predicted base load (kWh per hour)
- `active_sessions`: list of EVs currently plugged in (`id`, `remaining_energy`, `deadline`, `max_power`)

**Algorithm per time slot**:

1. Remove completed sessions (`remaining_energy = 0`) and expired deadlines.
2. Calculate `available_capacity = MAX_CAPACITY - base_load`.
3. **Feasibility check**: if `sum(remaining_energy) > available_capacity × remaining_hours` → flag sessions as `at_risk`.
4. **Urgency score per EV**: `urgency = remaining_energy / time_remaining_hours`
5. **Proportional first pass**: each EV gets `(urgency/total_urgency) × available_capacity`, capped at its `max_power` and `remaining_energy`.
6. **EDF rollover second pass**: any unused capacity (because EVs hit their caps) is redistributed to EVs sorted by earliest deadline.
7. Update `remaining_energy` and determine slot status: `normal`, `throttled`, or `at_risk`.

**Output**:
```json
{
  "schedule": [{ "timestamp", "allocated_power_kw", "total_load_kw", 
                 "uncontrolled_load_kw", "status", "session_allocations" }],
  "peak_reduction_percent": 18.4,
  "uncontrolled_peak": 142.0,
  "optimized_peak": 115.9
}
```

**Peak reduction formula**: `((uncontrolled_peak - optimized_peak) / uncontrolled_peak) × 100`

**Hybrid scheduling logic** (in `OptimizationService`): When grid risk is HIGH, uses **P90** as the conservative base load; otherwise uses **P50**.

---

## 9. Dynamic Pricing Simulation

**Module**: `backend/app/pricing/simulator.py`

**Formula**: `price = base_price × max(0.5, (load / capacity) × 2.0)`

- `base_price = $0.15/kWh`
- Uses **P50** load as the expected demand
- Multiplier is floored at 0.5 (minimum 50% of base price at zero load)
- At 50% capacity utilisation → multiplier = 1.0 → price = $0.15
- At 100% capacity → multiplier = 2.0 → price = $0.30

The frontend displays prices in both INR and USD.

---

## 10. Anomaly Detection

**Module**: `backend/app/anomaly/detector.py`

**Trigger condition**: `actual_kwh > p90 × 1.2`

Logic:
1. Map probabilistic forecast by hour key (`YYYY-MM-DDTHH`)
2. For each recent actual session, check if its `energy_kwh` exceeds 120% of the forecasted P90 threshold for that hour
3. Return flagged anomalies with timestamp, actual value, expected P90, and a human-readable reason string

**Example output**:
```json
{
  "timestamp": "2024-11-01T18:00:00",
  "anomaly": true,
  "actual": 45.2,
  "expected_p90": 31.0,
  "reason": "Unexpected spike: 45.2 kW exceeded strict P90 threshold of 37.20 kW"
}
```

---

## 11. Hierarchical Forecasting

**Module**: `backend/app/forecasting/hierarchical.py`

Produces a two-level forecast hierarchy:
- **Level 1 (Bottom)**: Per-station probabilistic forecast (P10/P50/P90)
- **Level 2 (Top)**: System-level aggregate

**Aggregation**:
- `system_p10 = Σ station_p10` across all stations (same for P50, P90)
- **Consistency check**: if `|aggregated_p50 - global_p50| / global_p50 > 20%` → fallback to global model for that hour
- `fallback_active: true` is flagged in the output for that hour

**Output**:
```json
{
  "system_forecast": [{"timestamp", "p10", "p50", "p90", "fallback_active"}],
  "station_forecasts": { "station_id": [{"timestamp", "p10", "p50", "p90"}] }
}
```

---

## 12. Infrastructure Planning (DBSCAN + Scoring)

**Module**: `backend/app/planning/clustering.py` + `scoring.py`

### Step 1: Spatial Clustering (DBSCAN)

- Assigns each charging session a geographic coordinate using a deterministic hash of `station_id` mapped to one of 5 predefined Bangalore-area zone anchors.
- Adds Gaussian spatial noise (`σ = 0.0005°`) for realism.
- Runs DBSCAN (`eps=0.01°`, `min_samples=10`) to find high-density demand clusters.
- Noise points (label `-1`) are discarded.

### Step 2: Candidate Scoring

**Minimum threshold**: clusters with fewer than 15 sessions are excluded.

**Four metrics** (all min-max normalised to [0,1]):

| Metric | Weight | Derivation |
|---|---|---|
| Demand | 35% | `total_energy_kwh` of cluster |
| Growth | 25% | `recent_sessions / old_sessions` ratio (30/70 split) |
| Grid Capacity | 20% | `1 / total_energy_kwh` (inverse — lower load areas have more headroom) |
| Distance Penalty | 20% | Euclidean distance to nearest existing station (penalises proximity) |

**Scoring formula**:
```
score = 0.35×demand + 0.25×growth - 0.20×distance + 0.20×grid_capacity
```

**Reason generation**: Thresholds at `normalised > 0.7` trigger labels like "High demand", "Rapid growth", "Underserved area", "High available capacity".

**Output**: Sorted descending by score, each with `{location, score, reason}`.

---

## 13. Dashboard Aggregator (Unified Execution Context)

**Module**: `backend/app/dashboard/summary.py`

The `/v1/dashboard/summary` endpoint executes a **shared execution context** — a single forecast is computed once and reused by all downstream engines, preventing duplicated compute.

**Execution order**:
1. `FeatureEngineer.build_inference_history()` — fetch and featurise sessions
2. `ProbabilisticModel.predict()` — compute P10/P50/P90 forecast (cached 5 min)
3. `RiskEngine.evaluate_risk(forecast)` — overload probability
4. `PricingSimulator.simulate_pricing(forecast)` — dynamic price curve
5. `AnomalyDetector.detect_anomalies(actuals, forecast)` — spike flags
6. `ChargingScheduler.schedule(forecast_load, active_sessions)` — EDF optimisation
7. `PlanningService.get_candidates()` — DBSCAN site recommendations

All six results are returned in a single JSON response.

---

## 14. Frontend — Pages & Views

**Stack**: React 18, Vite, React Router v6, Recharts, Framer Motion, Axios

**Navigation**: Sliding side menu (260px) with translateX animation. On desktop the main panel shifts right to reveal the menu. On mobile the menu overlays with a dimming backdrop.

**Page transitions**: AnimatePresence with 220ms ease-in-out fade+slide.

### Pages

| Route | Page | Data Source | Key Charts |
|---|---|---|---|
| `/` | Dashboard | `/v1/forecast`, `/v1/load`, `/risk` | LineChart (historical + AI forecast), grid health bar |
| `/forecast` | Forecasting | `/v1/forecast` | 24h prediction with SHAP explanations |
| `/schedule` | Recommendation | `/v1/schedule/recommendation` | Before/after load curves, EDF timeline |
| `/risk` | Risk Monitoring | `/v1/risk` | Probability gauge, per-hour risk heatmap |
| `/pricing` | Pricing Intelligence | `/v1/pricing` | 24h price curve, peak/off-peak bands |
| `/planning` | Planning | `/v1/planning/candidates` | Location cards with scores and reasons |
| `/anomalies` | Anomaly Detection | `/v1/anomalies` | Spike events list with expected vs actual |
| `/hierarchy` | Hierarchical Forecast | `/v1/forecast/hierarchy` | System + per-station P10/P50/P90 bands |
| `/system` | System Overview | `/v1/dashboard/summary` | All 6 features — master KPI grid |

### Auto-Refresh (Stale-While-Revalidate)

- Dashboard refreshes every **45 seconds** in the background
- Old data remains visible during refresh — charts never blank
- A subtle "Updating..." pill badge appears during background fetch
- On background fetch error, stale data is preserved silently

### Scenario Transition Animation

- When grid risk level changes between refreshes, the capacity bar animates smoothly over **7 seconds** (35 steps × 200ms intervals)
- The `displayedRisk` state interpolates `capacity_percent` gradually
- Prevents visual shock from sudden KPI jumps between scenario changes

---

## 15. Backend Configuration Reference

**File**: `backend/app/utils/config.py` | Source: `.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | SQLite fallback | PostgreSQL connection string |
| `ACN_TOKEN` | — | Caltech ACN API token |
| `ACN_BASE_URL` | `https://ev.caltech.edu/api/v1` | ACN API base URL |
| `HOST` | `0.0.0.0` | Uvicorn bind host |
| `PORT` | `8000` | Uvicorn port |
| `DEBUG` | `True` | FastAPI debug mode |
| `CORS_ORIGINS` | `localhost:5173` | Allowed frontend origins |
| `MAX_CAPACITY` | `100` | Legacy grid capacity (kW) |
| `ZONES` | `Zone_A,Zone_B,Zone_C` | Legacy zone list |
| `RISK_HIGH_THRESHOLD` | `80` | Legacy risk % threshold |
| `RISK_MEDIUM_THRESHOLD` | `60` | Legacy risk % threshold |
| `EV_SPIKE_START_HOUR` | `18` | Legacy EV peak start |
| `EV_SPIKE_END_HOUR` | `22` | Legacy EV peak end |
| `GROQ_API_KEY` | — | Groq API key (AI demo layer) |
| `USE_AI_DEMO_DATA` | `False` | Toggle AI synthetic data |
| `SCENARIO_MODE` | `NORMAL` | Active scenario name |
| `FREEZE_DEMO_STATE` | `False` | Freeze all demo outputs |
| `MAX_GRID_LOAD` | `220` | Hard cap for AI outputs (kWh) |
| `MAX_PRICE` | `18` | Hard cap for AI pricing |
| `MAX_PEAK_REDUCTION` | `65` | Hard cap for schedule improvement |
| `MAX_RISK_SCORE` | `100` | Hard cap for risk score |

---

## 16. How to Run the Project

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env — set DATABASE_URL and ACN_TOKEN

# Create database tables
python -m alembic upgrade head

# Ingest data from ACN API
python ingest.py   # or run-ingestion.bat

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev       # starts at http://localhost:5173
```

### Windows Batch Scripts

| Script | Purpose |
|---|---|
| `create-database.bat` | Create PostgreSQL database |
| `run-migrations.bat` | Run Alembic schema migrations |
| `run-ingestion.bat` | Fetch ACN data and seed DB |
| `start-backend.bat` | Start FastAPI server |
| `start-frontend.bat` | Start Vite dev server |
| `verify-installation.bat` | Check all dependencies |

---

## 17. Module Map

```
backend/app/
├── main.py                      # FastAPI app, CORS, router registration
├── utils/config.py              # Centralised config from .env
├── chargewise/
│   ├── database.py              # SQLAlchemy engine + session factory
│   ├── models/__init__.py       # ChargingSession, FeederLoad ORM models
│   ├── services/
│   │   ├── acn_client.py        # ACN API HTTP client with retry
│   │   ├── features.py          # Hourly aggregation + lag feature engineering
│   │   ├── forecasting.py       # XGBoost point forecast (train + autoregressive predict)
│   │   ├── explain.py           # SHAP TreeExplainer wrapper
│   │   ├── repository.py        # DB query helpers (sessions, load)
│   │   ├── load_builder.py      # Feeder load aggregation utilities
│   │   └── transform.py         # ACN raw response → DB model mapping
│   └── routes/api.py            # All /v1/* REST endpoints
├── forecasting/
│   ├── probabilistic.py         # P10/P50/P90 quantile XGBoost + 5-min cache
│   └── hierarchical.py          # Station→System hierarchy with fallback check
├── risk/engine.py               # P90-based overload probability engine
├── optimization/
│   ├── constraints.py           # MAX_CAPACITY_KW = 150, MIN_ALLOCATION_KW = 1
│   ├── scheduler.py             # Hybrid EDF algorithm
│   └── service.py               # OptimizationService (derives pseudo-active sessions)
├── planning/
│   ├── clustering.py            # DBSCAN spatial clustering
│   ├── scoring.py               # Weighted candidate scoring (4 metrics)
│   └── service.py               # PlanningService orchestrator
├── pricing/simulator.py         # Dynamic pricing formula
├── anomaly/detector.py          # P90 × 1.2 spike detection
├── dashboard/summary.py         # Unified aggregator (shared forecast context)
├── ai/                          # AI Synthetic Demo Layer (USE_AI_DEMO_DATA=True)
│   ├── state_store.py           # Singleton cross-feature state store
│   ├── scenario_engine.py       # Deterministic multipliers per scenario
│   ├── simulation_clock.py      # Time-coherent state evolution
│   ├── narrative_engine.py      # Semantic context per scenario
│   ├── local_demo_generator.py  # NumPy fallback generator
│   ├── groq_client.py           # Async client, coalescing, TTL cache, 8s timeout
│   ├── prompt_templates.py      # PROMPT_VERSION, seed injection, constraints
│   ├── post_processing.py       # Smoothing, clipping, p10≤p50≤p90 enforcement
│   ├── schemas/                 # Pydantic contracts (auto-repair on violation)
│   │   ├── forecast_schema.py
│   │   ├── risk_schema.py
│   │   ├── scheduling_schema.py
│   │   └── pricing_schema.py
│   └── providers/
│       ├── groq_forecast.py     # GroqForecastProvider (TEMPORARY)
│       ├── groq_risk.py         # GroqRiskProvider (TEMPORARY)
│       └── groq_scheduler.py    # GroqSchedulerProvider (TEMPORARY)
├── services/                    # Legacy / Provider Resolver layer
│   ├── forecaster.py            # Resolver → GroqProvider or XGBoostProvider
│   ├── risk_detector.py         # Resolver → GroqProvider or threshold logic
│   ├── scheduler.py             # Resolver → GroqProvider or EDF logic
│   └── providers/
│       ├── base.py              # Abstract ForecastProvider, RiskProvider, SchedulerProvider
│       └── xgboost_forecast.py  # XGBoostForecastProvider implementation
└── routes/                      # Legacy route handlers (unchanged)
    ├── forecast.py
    ├── risk.py
    ├── schedule.py
    ├── explain.py
    └── data.py

frontend/src/
├── App.jsx                      # BrowserRouter, SlidingMenu, AnimatedRoutes
├── services/api.js              # Axios API client (all endpoints)
├── components/
│   ├── SlidingMenu.jsx          # Side nav with all 9 page links
│   ├── TopBar.jsx               # Header bar with embedded controls
│   ├── HamburgerButton.jsx      # Animated open/close button
│   ├── MetricCard.jsx           # KPI card component
│   └── ChartCard.jsx            # Chart wrapper card
└── pages/
    ├── Dashboard.jsx            # Main overview (stale-while-revalidate, 45s refresh)
    ├── Forecasting.jsx          # 24h XGBoost forecast + SHAP
    ├── Recommendation.jsx       # EDF smart schedule before/after
    ├── RiskMonitoring.jsx        # Grid risk probability view
    ├── PricingIntelligence.jsx  # Dynamic pricing curve
    ├── Planning.jsx             # DBSCAN infrastructure candidates
    ├── AnomalyDetection.jsx     # Spike detection events
    ├── HierarchicalForecast.jsx # Station→System P10/P50/P90
    └── SystemOverview.jsx       # Unified 6-in-1 intelligence view
```

---

## 18. Key Design Decisions

### Why XGBoost Quantile Regression for Probabilistic Forecasts?
XGBoost natively supports `reg:quantileerror` objective (v2.1+), enabling three independent quantile models trained on the same feature set. This is faster and more accurate than post-hoc uncertainty estimation and avoids assumptions about the error distribution.

### Why Hybrid EDF Instead of Pure LP Optimisation?
Pure LP optimisation requires solving a linear program per time slot (expensive at scale). Hybrid EDF achieves near-optimal schedules in O(n log n) time using urgency-proportional allocation followed by an EDF rollover pass for unused capacity.

### Why DBSCAN for Infrastructure Planning?
DBSCAN finds arbitrarily shaped clusters without requiring a predefined cluster count, and naturally handles outliers (noise) which are stations with insufficient session density to justify new infrastructure.

### Why a Unified Dashboard Aggregator?
Without a shared execution context, each widget would independently call the probabilistic forecast model and recompute P10/P50/P90, causing 6× redundant ML inference per page load. The aggregator runs it once and passes the result to all downstream engines.

### Why a Provider Resolver Architecture?
The resolver pattern (`USE_AI_DEMO_DATA` flag) allows the AI synthetic demo layer to be swapped in or out at configuration time without touching any API routes, frontend code, or response schemas.

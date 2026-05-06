# Graph Report - AI4bharat  (2026-05-06)

## Corpus Check
- 105 files · ~60,471 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 623 nodes · 838 edges · 57 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 183 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]

## God Nodes (most connected - your core abstractions)
1. `GroqDemoService` - 18 edges
2. `DashboardAggregator` - 17 edges
3. `useDemoData()` - 17 edges
4. `OptimizationService` - 16 edges
5. `FeatureEngineer` - 15 edges
6. `get_demo_service()` - 14 edges
7. `ProbabilisticModel` - 14 edges
8. `ForecastModel` - 13 edges
9. `MockDB` - 13 edges
10. `PlanningService` - 12 edges

## Surprising Connections (you probably didn't know these)
- `test_all_features()` --calls--> `get_demo_service()`  [INFERRED]
  backend\test_groq_integration.py → backend\app\ai\groq_demo_service.py
- `GroqDemoService` --uses--> `ScenarioEngine`  [INFERRED]
  backend\app\ai\groq_demo_service.py → backend\app\ai\scenario_engine.py
- `GroqDemoService` --uses--> `MathematicalPostProcessor`  [INFERRED]
  backend\app\ai\groq_demo_service.py → backend\app\ai\post_processing.py
- `GroqDemoService` --uses--> `GroqSchedulerProvider`  [INFERRED]
  backend\app\ai\groq_demo_service.py → backend\app\ai\providers\groq_scheduler.py
- `GroqRiskProvider` --uses--> `LocalDemoGenerator`  [INFERRED]
  backend\app\ai\providers\groq_risk.py → backend\app\ai\local_demo_generator.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (49): AnomalyDetector, Anomaly Detection Engine., Detect abnormal charging spikes.         Logic: if actual > (p90 * 1.2): anomaly, BaseModel, DashboardAggregator, Unified Dashboard Aggregator., Builds the unified intelligence summary using a shared execution context, HierarchicalModel (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (45): formatCurrency(), generateAnomalies(), generateDashboardKPIs(), generateDashboardSummary(), generateForecast(), generateHierarchy(), generateHourlyLoad(), generateHourlyTimeline() (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (29): ProbabilisticModel, Probabilistic Forecasting Engine with Cache., Train all 3 quantile models., Autoregressive prediction with 3 quantiles., GridConstraints, Grid constraints and scheduling configuration., ChargingScheduler, Smart Charging Scheduler implementing Hybrid EDF. (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (31): _build_planning_prompt(), _build_pricing_prompt(), _build_probabilistic_prompt(), _fallback_anomalies(), _fallback_load(), _fallback_planning(), _fallback_pricing(), _fallback_probabilistic() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (22): build_forecast_prompt(), build_risk_prompt(), build_scheduling_prompt(), Structured Prompt Templates — DEMO_ONLY / PROTOTYPE_LAYER  All prompts include:, Returns (system_prompt, user_prompt) for smart scheduling generation., Generate deterministic seed from feature name + current hour.     Same hour alwa, Returns (system_prompt, user_prompt) for EV load forecast generation., Returns (system_prompt, user_prompt) for risk assessment generation. (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (36): get_demo_service(), Quick test script to verify Groq integration works. Run: python test_groq_integ, test_all_features(), get_anomalies(), get_dashboard_summary(), get_dynamic_pricing(), get_forecast(), get_grid_risk() (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (21): ABC, LocalDemoGenerator, Emergency Deterministic Numpy-based Generators, apply(), get_multiplier(), Deterministic Scenario Engine, ScenarioEngine, ForecastProvider (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (25): main(), ACN data ingestion pipeline., Run the complete ingestion pipeline., ACNClient, Client for fetching EV charging session data from ACN API., Fetch charging sessions with pagination support and basic retry logic., LoadBuilder, Load time-series generation from charging sessions. (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (16): Spatial clustering for infrastructure siting., Map station to a deterministic anchor zone., Generate spatial points for sessions with natural density variation., Cluster high-demand areas using DBSCAN., SpatialClusterer, CandidateScorer, Scoring engine for infrastructure siting candidates., Min-Max normalize a list of values. (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): forecast_endpoint(), risk_endpoint(), schedule_endpoint(), get_forecast(), _get_provider(), Forecast Service — Provider Resolver  Selects the active ForecastProvider based, Resolve and return the active forecast provider., Resolve and call the active ForecastProvider.     Returns a dict with 'predictio (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (14): Data transformation for ACN sessions., Transform raw ACN session data to normalized format., SessionTransformer, Test full ingestion pipeline including idempotency and API filters., test_pipeline_e2e(), Tests for session data transformation., Test that invalid rows are filtered out., Test transformation with empty input. (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (12): _call_groq(), _execute_groq_call(), generate(), _get_client(), _get_fallback(), _make_cache_key(), Groq API Client — DEMO_ONLY / TEMPORARY_PROVIDER  Features: - Request coalescing, Executes the actual Groq call and resolves the shared future. (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (8): clip_non_negative(), clip_to_max(), MathematicalPostProcessor, process_forecast(), process_prices(), Mathematical Post-Processor — DEMO_ONLY / PROTOTYPE_LAYER  Enforces hard mathema, DEMO_ONLY: Applies mathematical constraints and curve corrections     to raw LLM, smooth_curve()

### Community 13 - "Community 13"
Cohesion: 0.32
Nodes (5): _add_features(), _fetch_hourly_data(), Feature engineering for ChargeWise AI forecasting., Build the full feature set for training with proper leakage guard., Build the recent history required for autoregressive forecasting.

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (7): Tests for ChargeWise AI API endpoints., Test GET /v1/sessions endpoint., Test GET /v1/load endpoint., Test GET /v1/load without feeder_id filter., test_get_load_endpoint(), test_get_load_endpoint_no_filter(), test_get_sessions_endpoint()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (2): Unified Synthetic State Store as a singleton source of truth., StateStore

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (3): PricingSchema, Pydantic Synthetic Data Contracts — DEMO_ONLY / PROTOTYPE_LAYER  Pricing output, DEMO_ONLY: Validated contract for dynamic pricing outputs.      Enforces:     -

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (6): Base, ChargingSession, FeederLoad, SQLAlchemy models for ChargeWise AI., Aggregated feeder load time-series., EV charging session data.

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): Alembic environment configuration., Run migrations in 'offline' mode., Run migrations in 'online' mode., run_migrations_offline(), run_migrations_online()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (3): Returns a small delta to evolve state smoothly. Returns 0 if frozen., Time-Coherent Simulation, SimulationClock

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (1): Database repository for ChargeWise AI.

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (1): Initial schema for ChargeWise AI  Revision ID: 001 Revises:  Create Date: 2024-0

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): add duration and uix  Revision ID: b027d99c3d0a Revises: 001 Create Date: 2026-0

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (3): get_db(), Database configuration and session management., Dependency for FastAPI routes.

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (2): generate_data_endpoint(), generate_data()

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (2): explain_endpoint(), explain_forecast()

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (3): create_database(), Create the chargewise database., Create the chargewise database if it doesn't exist.

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (1): Provider implementations for domain services.

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): AI Synthetic Data Generation module.

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Pydantic Schemas for Synthetic Data Contracts — PROTOTYPE_LAYER

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Anomaly detection package.

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): ChargeWise AI package.

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): ChargeWise AI routes.

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): ChargeWise AI services.

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Advanced forecasting package.

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): Optimization package.

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Planning package for infrastructure siting.

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): Config

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): Apply moving average to smooth jagged LLM-generated curves.

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): Remove any negative values by clipping to 0.

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): Clip all values to a defined ceiling.

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): Enforce monotonic ordering: p10 <= p50 <= p90 at every index.         Sorts each

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Normalize a list of values so they sum to a target total.         Used for hiera

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Full forecast post-processing pipeline.

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Full pricing post-processing pipeline.

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): Ensure p10 <= p50 <= p90 at every index, auto-repair if violated.

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): Fetch and aggregate sessions into hourly data.

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): Add time and lag features to the hourly dataframe.

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): Convert sessions to time-series load data.                  Args:             se

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): Bulk insert charging sessions.                  Args:             db: SQLAlchemy

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): Bulk insert feeder load data.                  Args:             db: SQLAlchemy

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Fetch latest charging sessions.

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Fetch feeder load time-series.

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Convert raw API data to clean DataFrame.                  Args:             raw_

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Returns:             {                 "predictions": List[float],   # 24-hour l

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): Returns:             {                 "risk_level": str,          # LOW | MEDIU

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Returns:             {                 "before": List[float],          # origina

## Knowledge Gaps
- **209 isolated node(s):** `Quick test script to verify Groq integration works. Run: python test_groq_integ`, `Alembic environment configuration.`, `Run migrations in 'offline' mode.`, `Run migrations in 'online' mode.`, `Initial schema for ChargeWise AI  Revision ID: 001 Revises:  Create Date: 2024-0` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 15`** (7 nodes): `Unified Synthetic State Store as a singleton source of truth.`, `StateStore`, `.get()`, `.get_all()`, `.__new__()`, `.update()`, `state_store.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (6 nodes): `repository.py`, `get_load()`, `get_sessions()`, `insert_load()`, `insert_sessions()`, `Database repository for ChargeWise AI.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (4 nodes): `001_initial_schema.py`, `downgrade()`, `Initial schema for ChargeWise AI  Revision ID: 001 Revises:  Create Date: 2024-0`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `b027d99c3d0a_add_duration_and_uix.py`, `downgrade()`, `add duration and uix  Revision ID: b027d99c3d0a Revises: 001 Create Date: 2026-0`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (4 nodes): `data.py`, `data_generator.py`, `generate_data_endpoint()`, `generate_data()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (4 nodes): `explain.py`, `explainer.py`, `explain_endpoint()`, `explain_forecast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `__init__.py`, `__init__.py`, `Provider implementations for domain services.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AI Synthetic Data Generation module.`, `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `__init__.py`, `Pydantic Schemas for Synthetic Data Contracts — PROTOTYPE_LAYER`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `Anomaly detection package.`, `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `__init__.py`, `ChargeWise AI package.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `__init__.py`, `ChargeWise AI routes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `__init__.py`, `ChargeWise AI services.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `__init__.py`, `Advanced forecasting package.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `__init__.py`, `Optimization package.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `__init__.py`, `Planning package for infrastructure siting.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `config.py`, `Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Apply moving average to smooth jagged LLM-generated curves.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `Remove any negative values by clipping to 0.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Clip all values to a defined ceiling.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Enforce monotonic ordering: p10 <= p50 <= p90 at every index.         Sorts each`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Normalize a list of values so they sum to a target total.         Used for hiera`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Full forecast post-processing pipeline.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Full pricing post-processing pipeline.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `Ensure p10 <= p50 <= p90 at every index, auto-repair if violated.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `Fetch and aggregate sessions into hourly data.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `Add time and lag features to the hourly dataframe.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `Convert sessions to time-series load data.                  Args:             se`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `Bulk insert charging sessions.                  Args:             db: SQLAlchemy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `Bulk insert feeder load data.                  Args:             db: SQLAlchemy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Fetch latest charging sessions.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Fetch feeder load time-series.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Convert raw API data to clean DataFrame.                  Args:             raw_`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `Returns:             {                 "predictions": List[float],   # 24-hour l`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `Returns:             {                 "risk_level": str,          # LOW | MEDIU`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `Returns:             {                 "before": List[float],          # origina`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Repository` connect `Community 0` to `Community 10`, `Community 20`, `Community 7`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 7` to `Community 0`, `Community 10`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `GroqDemoService` connect `Community 3` to `Community 4`, `Community 12`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `GroqDemoService` (e.g. with `ScenarioEngine` and `NarrativeEngine`) actually correct?**
  _`GroqDemoService` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `DashboardAggregator` (e.g. with `SessionResponse` and `Config`) actually correct?**
  _`DashboardAggregator` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useDemoData()` (e.g. with `AnomalyDetection()` and `Forecasting()`) actually correct?**
  _`useDemoData()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `OptimizationService` (e.g. with `SessionResponse` and `Config`) actually correct?**
  _`OptimizationService` has 12 INFERRED edges - model-reasoned connections that need verification._
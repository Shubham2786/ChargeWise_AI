# ChargeWise AI — Engineering Specification & Execution Blueprint

**Document Type:** Unified PRD + System Design + Architecture + Implementation Plan
**Target Audience:** Engineering, MLOps, SRE, Product, BESCOM Planning Stakeholders
**Status:** Hackathon MVP → Production-Ready Roadmap
**Version:** 1.0

---

## Table of Contents

1. Product Requirements Document (PRD)
2. App Flow & System Interaction Design
3. Tech Stack & Architecture Decisions
4. Backend & Data Architecture
5. Implementation Plan

---

# 1. Product Requirements Document (PRD)

## 1.1 Problem Definition

### Domain Context: EV–Grid Interaction

Electric vehicle charging is fundamentally different from conventional electrical load. It is **spatially clustered** (apartment complexes, IT parks, fleet depots), **temporally concentrated** (6 PM–10 PM coincident peak), **stochastic at the session level** but **deterministic in aggregate**, and **deferrable** within user-defined service-level constraints (SOC target by departure time). This deferrability is the lever ChargeWise AI exploits.

A distribution utility like BESCOM operates a radial network where each 11 kV feeder serves a defined geography via distribution transformers (DTs) rated typically 100–1000 kVA. Adding even a few Level-2 (7.4 kW) or DC fast (50–150 kW) chargers to a feeder near its thermal limit can:

- Trigger DT thermal overload (insulation aging, premature failure).
- Cause voltage drop beyond IEEE 1159 / CEA limits (±5%).
- Increase neutral current and harmonic distortion.
- Force expensive reactive capex (transformer upgrades, feeder reinforcement).

### Pain Points in Current Systems

The current state at most Indian DISCOMs, BESCOM included, is reactive: charger placement is driven by CPO (Charge Point Operator) commercial requests rather than predictive grid awareness; load growth is observed retrospectively via SCADA breaches rather than forecast; charging is uncontrolled (plug-and-go); and infrastructure planning relies on aggregated annual reports rather than zonal hourly intelligence. There is no closed-loop link between *where EVs are growing*, *when they charge*, and *which feeders can absorb that load*.

---

## 1.2 Stakeholders & Users

| Persona | Role | Primary Needs | Interaction Surface |
|---|---|---|---|
| **Grid Operations Engineer** | Real-time feeder/DT health | Peak alerts, load shift recommendations, what-if simulation | Operations dashboard |
| **Infrastructure Planner** | Multi-year charger rollout | Candidate site ranking, ROI, feeder headroom maps | Planning dashboard |
| **Policy Analyst (KERC/BESCOM Strategy)** | Tariff design, ToU policy | Aggregate elasticity, peak reduction analytics | Reports, export APIs |
| **CPO Partner (read-only)** | Site selection collaboration | Demand heatmaps, utilization forecasts | Restricted external API |
| **Executive Leadership** | KPI oversight | EV readiness index, monthly trends | Executive view |

---

## 1.3 Functional Requirements

| ID | Requirement | Capability Mapping |
|---|---|---|
| **FR-1** | System shall ingest historical feeder load, DT loading, EV registrations, charger session logs, and city mobility data via batch (CSV/Parquet) and API connectors. | Data Ingestion Service |
| **FR-2** | System shall produce zone-wise hourly EV charging demand forecasts for a horizon of 24h, 7d, and 30d. | Demand Forecasting Module |
| **FR-3** | System shall flag feeders/DTs predicted to exceed configurable thermal thresholds (default 80% of nameplate) within the forecast horizon. | Risk Engine |
| **FR-4** | System shall generate optimized charging schedules that minimize peak load while respecting per-session SOC and departure-time constraints. | Smart Scheduling Engine |
| **FR-5** | System shall rank candidate charger deployment locations using a multi-criteria score (demand, growth, headroom, accessibility). | Infrastructure Planning Engine |
| **FR-6** | Every prediction, schedule, and recommendation shall ship with a human-readable explanation citing the top contributing factors. | Explainability Layer (SHAP + templated NLG) |
| **FR-7** | System shall support what-if simulation: "If 500 new EVs are added in Zone R-12, what happens?" | Simulation API |
| **FR-8** | System shall expose REST APIs for all forecasts, recommendations, and explanations with role-based access. | API Gateway |
| **FR-9** | System shall provide a GIS-based dashboard for heatmaps, candidate sites, and alerts. | Frontend |
| **FR-10** | System shall log every model output for auditability and post-hoc accuracy review. | Audit Store |
| **FR-11** | System shall retrain forecasting models on a configurable cadence (daily default) using incremental data. | MLOps Pipeline |
| **FR-12** | System shall operate fully on synthetic or masked data when production data is unavailable. | Synthetic Data Generator |

---

## 1.4 Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Scalability** | Concurrent zones supported | 500 zones (BBMP wards × sub-zones), 10k DTs, 50k chargers projected |
| | Time-series data volume | ~3 GB/year/zone at 15-min granularity; 1.5 TB total at scale |
| | API throughput | 200 RPS sustained, 1000 RPS burst |
| **Latency** | Forecast read API (cached) | p95 < 200 ms |
| | What-if simulation | p95 < 3 s |
| | Model retraining (per zone) | < 10 min on CPU |
| | Optimization run (1 zone, 24h horizon) | < 5 s |
| **Reliability** | Uptime (production target) | 99.5% (decision-support, not real-time control) |
| | Forecast availability | Stale-cache fallback if model fails; never block dashboard |
| **Security** | Data residency | On-prem / private cloud (India region); no SaaS LLM calls on sensitive utility data |
| | PII handling | EV owner data masked at ingestion (k-anonymity, k≥5); no raw VINs or addresses in warehouse |
| | Auth | OIDC + RBAC; audit log for every write/admin action |
| | Transport | TLS 1.3 mandatory; mTLS for SCADA-adjacent ingestion |
| **Explainability** | Every recommendation must surface ≥3 contributing features with directional impact, plus a templated natural-language summary. Models must be either intrinsically interpretable (XGBoost + SHAP) or paired with post-hoc explainers. **Black-box outputs without rationale are not shippable.** | |
| **Maintainability** | Code coverage | ≥70% for backend, ≥60% for ML pipelines |
| | Model versioning | All models registered with input schema, training data hash, metrics |

---

## 1.5 Core Features

### F1 — Zonal Demand Forecasting
- **Description:** Hourly EV charging demand (kWh and concurrent kW) per zone, 24h–30d horizon.
- **Input:** Historical session logs, EV registrations, weather, calendar, mobility signals.
- **Output:** Time-indexed forecast with P10/P50/P90 confidence bands.
- **Dependency:** Forecasting Service, Feature Store, Model Registry.

### F2 — Feeder Risk Heatmap
- **Description:** Geo-visualization of predicted DT/feeder utilization with color-coded risk tiers.
- **Input:** Forecast output + nameplate ratings + topology mapping (zone → feeder → DT).
- **Output:** GeoJSON layer with `{asset_id, predicted_load_pct, risk_tier, peak_hour}`.
- **Dependency:** GIS Service, Risk Engine.

### F3 — Smart Charging Scheduler
- **Description:** Recommends charging start times across a population of sessions to minimize coincident peak subject to user constraints.
- **Input:** Pending/forecast sessions, grid headroom curve, ToU tariff, user SOC deadlines.
- **Output:** Per-session start time, expected peak reduction, compliance probability.
- **Dependency:** Optimization Engine (LP/MILP), Forecasting Service.

### F4 — Charger Site Ranking
- **Description:** Ranks candidate locations for new chargers using multi-criteria scoring.
- **Input:** Demand growth, distance to nearest charger, feeder headroom, traffic, land/POI features.
- **Output:** Ranked list with composite score (0–100), per-criterion breakdown, suggested charger mix (AC/DC count).
- **Dependency:** Clustering Engine, GIS Service, Scoring Module.

### F5 — Explainability Pane
- **Description:** Every output includes "why this prediction/recommendation."
- **Input:** Model output + SHAP values + business rule context.
- **Output:** Top-K feature contributions + templated sentence + counterfactual ("if X changed, prediction would shift by Y").
- **Dependency:** SHAP service, NLG templates.

### F6 — What-If Simulation
- **Description:** Operators inject hypothetical EV growth, tariff changes, or new chargers and view impact.
- **Input:** Scenario parameters (delta EVs, new charger location, new tariff window).
- **Output:** Re-forecasted demand, risk delta, peak shift.
- **Dependency:** Forecasting Service (inference-only), Optimization Engine.

---

## 1.6 Standout / Differentiation Features

1. **Coupled Forecast–Optimization Loop with Headroom-Aware Scheduling.** Most baselines forecast OR optimize. ChargeWise AI feeds probabilistic forecasts directly into a constraint solver that respects per-feeder thermal headroom — meaning recommendations are always grid-feasible by construction.
2. **Counterfactual Explainability.** Beyond SHAP feature attributions, the system surfaces actionable counterfactuals: *"Shifting 27% of sessions past 22:00 reduces overload probability from 64% → 22%."* This is what makes outputs decision-grade rather than analytics-grade.
3. **Synthetic-First Architecture.** A first-class synthetic data generator (calibrated against published BESCOM load curves and ARAI/Vahan EV registration data) means the system is demoable and testable without waiting on data-sharing agreements — a hard differentiator at hackathon and during pilot.
4. **No-Touch Overlay Pattern.** Read-only ingestion, zero writes back into SCADA/billing. This dramatically lowers integration risk and accelerates utility approval.

---

## 1.7 Success Metrics

| KPI | Target (12-month pilot) |
|---|---|
| Demand forecast MAPE (zone-hour) | ≤ 12% |
| Demand forecast MAPE (feeder-day) | ≤ 8% |
| Simulated peak load reduction | 15–25% |
| DT overload events avoided | ≥ 30% reduction vs baseline |
| Charger utilization improvement | +20–35% on planner-recommended sites |
| Capex deferred via load shifting | ≥ ₹X cr/year (modeled) |
| Operator NPS on recommendations | ≥ +30 |
| Forecast API p95 latency | < 200 ms |

---

## 1.8 Constraints Mapping

| Constraint | How It Is Honored |
|---|---|
| Must NOT modify existing distribution systems | Read-only ingestion via CSV exports / SCADA historian replicas; no writes to OT systems. |
| Must act as decision-support | All outputs are recommendations surfaced in dashboard/API; no automated control actions. |
| Must be explainable and actionable | SHAP + counterfactuals + templated NLG mandatory on every output (FR-6). |
| Must work with synthetic or masked data | Synthetic data generator is a Phase-1 deliverable; masking pipeline applied at ingestion. |
| No hosted LLM on sensitive data | Explanations use deterministic template-based NLG. Optional self-hosted small LLM (e.g., Llama-3.1-8B on-prem) for narrative polish only — never with raw grid data. |

---

## 1.9 Risks & Assumptions

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sparse historical EV charging data | High | High | Synthetic generator + transfer learning from cities with mature data (Delhi, Pune pilots) |
| User non-compliance with shifted schedules | Medium | Medium | Tariff incentive design; compliance probability factored into optimizer |
| Rapid EV adoption changes invalidate models | Medium | Medium | Daily incremental retraining; drift detection on input distributions |
| SCADA/billing data access delayed | High | Medium | Synthetic-first; pilot with one ward's masked data |
| GIS data licensing for Bengaluru | Medium | Low | OpenStreetMap + BBMP open data + Bhuvan as fallback |

**Assumptions:**
- BESCOM provides at least one historical year of feeder/DT load curves for pilot zones.
- Vahan-derived EV registration counts are accessible at PIN-code granularity.
- Charger session logs from at least one CPO are obtainable for model calibration.

---

## 1.10 Out of Scope

- Real-time SCADA control or breaker actuation.
- Billing, metering, or revenue assurance.
- EV battery health / V2G optimization (Phase 4+ candidate).
- Customer-facing mobile app for end EV owners (utility-internal tool only).
- Wholesale market bidding or DAM/RTM integration.
- Hardware (charger firmware, OCPP adapter development).

---

# 2. App Flow & System Interaction Design

## 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│   React + MapLibre Dashboard  │  Executive View  │  Reports/Export  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS / JSON
┌──────────────────────────▼──────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                          │
│       AuthN/AuthZ (OIDC + RBAC)  │  Rate limit  │  Audit log        │
└──┬────────────┬────────────┬────────────┬──────────────┬────────────┘
   │            │            │            │              │
┌──▼──┐    ┌────▼─────┐ ┌────▼─────┐ ┌────▼──────┐ ┌─────▼──────┐
│Fcst │    │Scheduler │ │ Planner  │ │ Risk      │ │ Explain    │
│Svc  │    │ Service  │ │ Service  │ │ Engine    │ │ Service    │
└──┬──┘    └────┬─────┘ └────┬─────┘ └────┬──────┘ └─────┬──────┘
   │            │            │            │              │
   └──────┬─────┴────────────┴────────────┴──────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────────┐
│              INTELLIGENCE LAYER (shared services)                   │
│  Model Registry (MLflow)  │  Feature Store (Feast)  │  SHAP Service │
└─────────┬───────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────────┐
│                   DATA LAYER                                        │
│  PostgreSQL+PostGIS  │  TimescaleDB  │  MinIO (artifacts)  │ Redis  │
└─────────▲───────────────────────────────────────────────────────────┘
          │
┌─────────┴───────────────────────────────────────────────────────────┐
│              INGESTION & ETL (Airflow + dbt)                        │
│  SCADA exports │ EV registry │ Weather API │ Synthetic Generator    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 User Journey

**Operations Engineer — Morning Triage (typical 5-min flow):**
1. Logs into dashboard via SSO.
2. Lands on *Today's Risk Map* — heatmap of feeders shaded by predicted peak utilization.
3. Clicks a red-tier feeder; side panel shows forecast curve, top-3 contributing factors (e.g., "fleet depot session surge expected 19:00"), and recommended schedule shift.
4. Reviews the optimizer's proposed shift; clicks *Generate Operator Notice* — system produces a templated advisory for CPO/aggregator dispatch.
5. (Optional) Runs what-if: "What if 100 EVs delay charging by 1h?" — sees revised peak.

**Planner — Site Expansion Cycle (weekly/monthly):**
1. Opens *Planning* view, filters by ward and 6-month horizon.
2. Reviews ranked candidate sites with composite scores; inspects per-criterion breakdown.
3. Adjusts weights (e.g., prioritize feeder headroom over commercial viability) — re-ranking is real-time.
4. Marks shortlist; exports to PDF/CSV for review committee.

---

## 2.3 Module Breakdown

| Module | Responsibility | Key Internal Components |
|---|---|---|
| **Dashboard** | Visualization, interaction, RBAC-aware views | React, MapLibre GL, Recharts, TanStack Query |
| **Prediction Module** | Hourly demand forecasts per zone | XGBoost (per-zone), LSTM (citywide), Prophet (seasonal baseline), ensembler |
| **Optimization Module** | Charging schedule recommendations | OR-Tools / PuLP (LP/MILP), heuristic warm-start |
| **Infrastructure Planning Module** | Site clustering + multi-criteria ranking | DBSCAN, K-Means, weighted-sum scorer with PostGIS spatial joins |
| **Risk Engine** | Maps forecasts to asset constraints | Rule engine (Drools-style YAML), threshold configs |
| **Explainability Service** | SHAP values + counterfactuals + NLG | shap library, Jinja2 templates |

---

## 2.4 Data Flow

```
[SCADA CSV / Vahan / Weather API / Synthetic Gen]
              │ (Airflow DAGs, hourly + daily)
              ▼
        [Bronze: raw landed in MinIO + Postgres staging]
              │ (dbt models — clean, mask, conform)
              ▼
        [Silver: typed, masked, deduped facts]
              │ (feature engineering jobs)
              ▼
        [Gold: feature tables in TimescaleDB + Feast online store]
              │
       ┌──────┴───────┐
       ▼              ▼
[Training jobs]   [Inference services]
       │              │
       ▼              ▼
[MLflow registry]  [Forecast / Schedule / Plan APIs]
                       │
                       ▼
                  [Redis cache]
                       │
                       ▼
                  [Dashboard / External APIs]
```

---

## 2.5 Decision Points (Where AI Drives Behavior)

| Decision | AI Role | Human Override |
|---|---|---|
| Which feeders are at risk tomorrow? | Probabilistic forecast → threshold rule | Operator can dismiss/snooze |
| Which sessions to shift, by how much? | LP optimizer over forecast | Operator approves before dispatch advisory |
| Which 5 sites to build next? | Multi-criteria ranker | Planner adjusts weights, picks final |
| Is this anomaly a real spike or sensor noise? | Drift/anomaly detector | Engineer confirms |

---

## 2.6 API Interaction Flow

Dashboard requests are authenticated via OIDC bearer token. Each frontend view typically issues 2–4 parallel calls:

```
GET /v1/zones/{id}/forecast?horizon=24h     → Forecast Svc (Redis hit p95 50ms)
GET /v1/zones/{id}/risk                     → Risk Engine
GET /v1/zones/{id}/schedule/recommendation  → Scheduler Svc
GET /v1/zones/{id}/explain?artifact=forecast → Explain Svc
```

For what-if: `POST /v1/simulate` with scenario JSON → returns `simulation_id`; client polls `GET /v1/simulate/{id}` (or subscribes via SSE) for completion.

---

## 2.7 Explainability Layer

Every response object carries an `explanation` block:

```json
{
  "prediction": { "peak_kw": 14300, "peak_hour": "19:00", "confidence": "P50" },
  "explanation": {
    "top_factors": [
      { "feature": "ev_registrations_zone", "impact_kw": +1820, "direction": "↑" },
      { "feature": "is_post_holiday", "impact_kw": +640, "direction": "↑" },
      { "feature": "temp_c", "impact_kw": +310, "direction": "↑" }
    ],
    "counterfactual": "If 25% of sessions shift past 22:00, predicted peak drops to 11200 kW.",
    "narrative": "Zone JP Nagar peak expected to rise 18% today driven by holiday return traffic and elevated temperature."
  }
}
```

The narrative is generated via deterministic Jinja2 templates parameterized by SHAP outputs — **no LLM call on sensitive data**.

---

# 3. Tech Stack & Architecture Decisions

## 3.1 Selection Table

| Layer | Technology | Justification | Alternative Considered |
|---|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Mature ecosystem, type safety for complex dashboard state, fast dev loop | Next.js (overkill — no SSR need), Vue (smaller talent pool) |
| **Mapping** | MapLibre GL JS + deck.gl | Open-source, no licensing fees, handles 100k+ features, vector tiles | Mapbox (license cost), Leaflet (weak for large datasets) |
| **Charts** | Recharts + visx | Composable, React-native, good for time-series | D3 directly (too low-level), Highcharts (license) |
| **API Backend** | FastAPI (Python 3.11) | Async, Pydantic validation aligns with ML stack, OpenAPI auto-gen, single language across API+ML | Node.js (would force ML/API language split), Go (slower ML iteration) |
| **Auth** | Keycloak (OIDC) | Open-source, RBAC, enterprise-grade, pluggable into utility AD | Auth0 (SaaS, data egress), custom JWT (reinventing) |
| **Primary DB** | PostgreSQL 16 + PostGIS 3.4 | ACID, world-class GIS, JSONB for flexible scenarios | MySQL (weak GIS), MongoDB (no spatial joins) |
| **Time-Series DB** | TimescaleDB (Postgres extension) | Same engine as primary DB → simpler ops; native compression; continuous aggregates fit hourly/daily rollups | InfluxDB (separate ops surface), ClickHouse (overkill for MVP) |
| **Cache** | Redis 7 | Forecast cache, session, rate-limit, optimization warm-starts | Memcached (no persistence/streams) |
| **Object Store** | MinIO | S3-compatible, on-prem, free; for model artifacts, raw data lake | AWS S3 (data residency), local FS (no scaling) |
| **ML Framework** | scikit-learn, XGBoost, PyTorch (LSTM), Prophet, statsmodels | Open-source; XGBoost dominates structured data; PyTorch for sequence; Prophet for seasonality baseline | TensorFlow (heavier), Darts (good but adds abstraction layer) |
| **Optimization** | Google OR-Tools + PuLP | OR-Tools for MILP/CP-SAT (best-in-class open-source); PuLP for prototyping | Gurobi (commercial), CVXPY (slower for MILP) |
| **Explainability** | SHAP, ELI5 | De facto standard; tree-explainer fast for XGBoost; permutation for LSTM | LIME (less stable), Captum (PyTorch only) |
| **Feature Store** | Feast | Open-source, lightweight, online+offline parity | Tecton (SaaS), build-your-own (anti-pattern) |
| **Model Registry / Tracking** | MLflow | Open-source, mature, integrates with any framework | Weights & Biases (SaaS), Kubeflow (heavyweight) |
| **Workflow Orchestration** | Apache Airflow 2.x | Industry standard, strong scheduling, mature operators | Prefect (good but smaller community), Dagster (newer) |
| **Data Transformation** | dbt-core | SQL-first, version-controlled, lineage, tests | Custom SQL scripts (no lineage), Spark (overkill) |
| **Streaming (Phase 3)** | Apache Kafka + Kafka Connect | Decoupled ingestion at scale | RabbitMQ (weaker for stream replay), Pulsar (smaller community) |
| **Containerization** | Docker + Docker Compose (MVP) → Kubernetes (Phase 3) | Standard, portable, on-prem-friendly | Plain VMs (poor isolation) |
| **CI/CD** | GitHub Actions / GitLab CI | Free tiers, Docker-native | Jenkins (ops overhead) |
| **Observability** | Prometheus + Grafana + Loki + OpenTelemetry | Fully open-source observability stack | Datadog (SaaS, cost), ELK (heavier) |
| **Synthetic Data** | SDV (Synthetic Data Vault) + custom generators | Statistical fidelity to real distributions; open-source | Faker (too naive), CTGAN standalone (subset of SDV) |

---

## 3.2 Architecture Pattern

**Pattern Choice: Modular Monolith (MVP) → Service-Oriented (Phase 2+).**

For the hackathon and pilot, a single FastAPI application with cleanly separated internal modules (forecast, schedule, planner, explain) is shipped. Rationale: a six-microservice topology adds Kubernetes, service mesh, and inter-service auth complexity that buys nothing during MVP — the bottleneck is model quality and demo polish, not service boundaries. Modules are coded against internal interfaces (Python protocols) so extraction into separate services in Phase 2 is mechanical, not architectural.

**Data Processing Strategy: Batch-First, Streaming-Optional.**

EV charging decisions operate on hourly to daily horizons; 15-minute batch micro-batches via Airflow more than satisfy SLA. True streaming (Kafka + Flink) is reserved for Phase 3 if real-time SCADA telemetry integration materializes. Building Kafka in Phase 1 would be premature optimization — the data sources themselves (Vahan, BESCOM exports) are batch.

---

## 3.3 Scalability Considerations

**Horizontal:** API tier is stateless behind a load balancer — scales linearly. ML inference services are per-zone-shardable (forecast for Zone X is independent of Zone Y), enabling embarrassingly parallel scale-out.

**Vertical:** TimescaleDB benefits from larger nodes (memory-bound continuous aggregates); start single-node, partition by zone if >10 TB.

**Data Growth Handling:**
- TimescaleDB hypertables partitioned by time (1-day chunks) and zone.
- Continuous aggregates pre-compute hourly/daily rollups → dashboard queries hit small materialized views.
- Compression policies: data >30 days old compressed (typical 10–20× reduction).
- Cold tier: data >2 years archived to MinIO as Parquet.

**Model Scale:** One forecasting model per zone is preferred over a single global model — better local accuracy, parallel retraining, and isolated failure domains. Trade-off: more models to manage, addressed via MLflow registry and templated training pipelines.

---

## 3.4 Cost & Hackathon Feasibility

The entire stack runs on a single 16 GB / 8 vCPU VM for MVP. All components are free and open-source. No GPU is required (XGBoost on CPU is sufficient; LSTM at MVP scale trains in minutes on CPU). Data licensing: OpenStreetMap (free), Vahan (public dashboards), Open-Meteo (free weather API), BBMP open data (free). Total third-party cost for hackathon: **₹0**.

---

# 4. Backend & Data Architecture

## 4.1 Database Schema

### Core Entities (PostgreSQL + PostGIS + TimescaleDB)

#### `zones` — administrative/operational zones (BBMP wards or sub-zones)

| Column | Type | Purpose |
|---|---|---|
| zone_id | UUID PK | Surrogate key |
| zone_code | VARCHAR(32) UNIQUE | Human-readable (e.g., "JPN-12") |
| name | VARCHAR(128) | Display name |
| geometry | GEOMETRY(Polygon, 4326) | Spatial boundary (PostGIS) |
| population | INT | Demographic context |
| created_at | TIMESTAMPTZ | Audit |

#### `feeders` — 11 kV feeders

| Column | Type | Purpose |
|---|---|---|
| feeder_id | UUID PK | |
| feeder_code | VARCHAR(32) | BESCOM internal ID (masked) |
| substation_id | UUID FK | Parent substation |
| capacity_kva | INT | Nameplate |
| zone_id | UUID FK | Primary serving zone |
| geometry | GEOMETRY(LineString, 4326) | Routing for GIS |

#### `distribution_transformers`

| Column | Type | Purpose |
|---|---|---|
| dt_id | UUID PK | |
| feeder_id | UUID FK | |
| capacity_kva | INT | |
| location | GEOMETRY(Point, 4326) | |
| install_year | INT | Aging context |

#### `chargers` — public + private chargers

| Column | Type | Purpose |
|---|---|---|
| charger_id | UUID PK | |
| operator | VARCHAR(64) | CPO name |
| type | ENUM('AC_L1','AC_L2','DC_FAST','DC_ULTRA') | |
| rated_kw | NUMERIC(6,2) | |
| location | GEOMETRY(Point, 4326) | |
| feeder_id | UUID FK | Connected feeder |
| commissioned_at | DATE | |

#### `ev_registrations_monthly` — masked aggregate from Vahan

| Column | Type | Purpose |
|---|---|---|
| zone_id | UUID FK | |
| month | DATE | First of month |
| vehicle_class | ENUM('2W','3W','4W_PRIVATE','4W_COMM','BUS','LCV') | |
| count | INT | Aggregate (no PII) |
| PRIMARY KEY | (zone_id, month, vehicle_class) | |

---

### Time-Series Hypertables (TimescaleDB)

#### `charging_sessions` — masked session logs

```sql
CREATE TABLE charging_sessions (
  session_id      UUID,
  charger_id      UUID NOT NULL REFERENCES chargers(charger_id),
  start_ts        TIMESTAMPTZ NOT NULL,
  end_ts          TIMESTAMPTZ,
  energy_kwh      NUMERIC(8,3),
  peak_kw         NUMERIC(6,2),
  vehicle_class   VARCHAR(16),
  user_hash       VARCHAR(64),     -- k-anonymized
  PRIMARY KEY (session_id, start_ts)
);
SELECT create_hypertable('charging_sessions', 'start_ts', chunk_time_interval => INTERVAL '7 days');
```

#### `feeder_load_15min` — historical load curves

```sql
CREATE TABLE feeder_load_15min (
  feeder_id   UUID NOT NULL,
  ts          TIMESTAMPTZ NOT NULL,
  load_kw     NUMERIC(8,2),
  voltage_pu  NUMERIC(4,3),
  PRIMARY KEY (feeder_id, ts)
);
SELECT create_hypertable('feeder_load_15min', 'ts', chunk_time_interval => INTERVAL '1 day');
```

`weather_hourly`, `forecasts`, `recommendations`, and `audit_log` follow analogous patterns.

#### `forecasts` — model outputs

| Column | Type | Purpose |
|---|---|---|
| forecast_id | UUID PK | |
| zone_id | UUID FK | |
| target_ts | TIMESTAMPTZ | The hour being predicted |
| run_ts | TIMESTAMPTZ | When forecast was generated |
| model_version | VARCHAR(64) | MLflow run ID |
| p10_kw, p50_kw, p90_kw | NUMERIC(8,2) | Quantile forecasts |
| explanation_json | JSONB | SHAP top-k + narrative |

`recommendations` — scheduling + planning outputs (polymorphic via `kind`).

---

### Relationships

```
zones 1───* feeders 1───* distribution_transformers 1───* chargers
zones 1───* ev_registrations_monthly
chargers 1───* charging_sessions
feeders  1───* feeder_load_15min
zones    1───* forecasts
zones    1───* recommendations
```

PostGIS spatial indexes (`GIST`) on all `geometry` columns; B-tree on all FKs and time columns.

---

## 4.2 API Design

All routes prefixed `/v1`, JSON request/response, OIDC bearer auth, RBAC enforced per role.

| Method | Route | Input | Output |
|---|---|---|---|
| GET | `/zones` | `?bbox=&page=` | List of zones (id, code, name, centroid) |
| GET | `/zones/{id}` | — | Zone detail + feeder summary |
| GET | `/zones/{id}/forecast` | `?horizon=24h\|7d\|30d&granularity=hour\|day` | Time-series array with P10/P50/P90 + explanation |
| GET | `/zones/{id}/risk` | `?horizon=24h` | Risk tier per feeder/DT in zone |
| GET | `/zones/{id}/schedule/recommendation` | `?date=YYYY-MM-DD` | Optimized schedule + peak-reduction estimate |
| GET | `/feeders/{id}/load-history` | `?from=&to=&granularity=` | TimescaleDB-backed series |
| GET | `/feeders/{id}/headroom` | `?horizon=24h` | Predicted spare capacity curve |
| POST | `/simulate` | `{ scenario: {...} }` | `{ simulation_id, status }` (async) |
| GET | `/simulate/{id}` | — | Simulation result with delta forecasts |
| GET | `/planning/candidates` | `?bbox=&top_k=20&weights=...` | Ranked candidate sites with scores + breakdown |
| POST | `/planning/candidates/rerank` | `{ weights: {...} }` | Re-ranked list (no DB write) |
| GET | `/explain/{artifact_type}/{artifact_id}` | — | SHAP values + counterfactual + narrative |
| GET | `/admin/models` | — | Registered models + versions + metrics |
| POST | `/admin/models/{name}/promote` | `{ version }` | Promote staging → production |
| GET | `/admin/audit` | `?from=&to=&user=` | Audit log (admin only) |
| GET | `/health/live`, `/health/ready` | — | k8s probes |

**Example response — `GET /v1/zones/{id}/forecast?horizon=24h`:**

```json
{
  "zone_id": "9b1c…",
  "horizon": "24h",
  "model_version": "xgb_demand_v1.4.2",
  "generated_at": "2026-05-03T06:00:00+05:30",
  "series": [
    { "ts": "2026-05-03T19:00:00+05:30", "p10_kw": 12100, "p50_kw": 14300, "p90_kw": 16200 },
    "..."
  ],
  "peak": { "ts": "2026-05-03T20:00:00+05:30", "p50_kw": 15800 },
  "explanation": { "top_factors": ["..."], "narrative": "..." }
}
```

---

## 4.3 Data Pipeline

**Ingestion (Airflow DAGs):**
1. `dag_scada_ingest` (hourly) — pull CSV exports from BESCOM SFTP → MinIO bronze → Postgres staging.
2. `dag_vahan_pull` (daily) — scrape/API public Vahan dashboards → EV registration aggregates.
3. `dag_weather_pull` (hourly) — Open-Meteo API for Bengaluru grid points.
4. `dag_synthetic_gen` (on-demand) — SDV-based generator producing realistic charging sessions when real data is gated.

**Preprocessing (dbt models):**
- `stg_*` — type casting, null handling, masking (drop direct identifiers, hash user IDs with salt).
- `int_*` — joins, deduplication, late-arriving record handling.
- `fct_charging_sessions_clean`, `fct_feeder_load_clean` — silver-layer facts with data-quality tests (uniqueness, non-null, range).

**Feature Engineering (Feast):**

Per-zone hourly features:
- *Lag features:* load_kw lag 1h/24h/168h; rolling mean 3h/24h/7d.
- *Calendar:* hour-of-day, day-of-week, is_weekend, is_holiday, days-since-holiday.
- *EV stock:* cumulative EV registrations, MoM growth rate, vehicle-class mix.
- *Weather:* temperature, humidity, precipitation, heat index.
- *Mobility proxies:* traffic density (from open data), nearby POI counts (offices, malls, metro stations within 1 km — PostGIS spatial).
- *Charger supply:* count and total kW of chargers per zone.

Features served via Feast online store (Redis-backed) for sub-100ms inference.

---

## 4.4 AI/ML System Design

### Model 1 — Demand Forecasting

| Aspect | Decision |
|---|---|
| **Type** | Ensemble: XGBoost (primary) + Prophet (seasonal baseline) + LSTM (sequence specialist), combined via stacked ridge regression. |
| **Why over alternatives** | XGBoost wins on tabular utility forecasting benchmarks; Prophet excels at multi-seasonality (daily + weekly + holiday) with interpretable components; LSTM captures long-range dependencies (e.g., fleet depot weekly cycles). The ensemble outperforms any single model by 8–15% MAPE in published smart-grid studies and degrades gracefully when one component fails. Transformers (Informer, TFT) were rejected for MVP due to data hunger and tuning cost — strong Phase 3 candidates. |
| **Inputs** | Feature vector from §4.3 — ~40 features per (zone, hour). |
| **Output** | Point forecast (P50) + quantile forecasts (P10, P90) via quantile regression objective. |
| **Training** | Per-zone models. Walk-forward CV with 7-day folds. Daily incremental retraining; full retrain weekly. Hyperparameter search via Optuna (50 trials, time-budgeted). |
| **Evaluation** | MAPE (primary), MAE, RMSE, pinball loss for quantiles; backtested over rolling 30-day window. |

### Model 2 — Smart Charging Scheduling

| Aspect | Decision |
|---|---|
| **Type** | Mixed-Integer Linear Program (MILP) solved via Google OR-Tools CP-SAT; reinforcement learning is a Phase 3 enhancement. |
| **Why over alternatives** | LP/MILP is deterministic, explainable (dual variables → marginal cost of each constraint), provably optimal within constraints, and runs in seconds for hackathon-scale problems. RL was rejected for MVP: needs a simulator, reward shaping is brittle, and "the model said so" fails the explainability bar. |
| **Decision variables** | `x_{i,t} ∈ {0,1}` — whether session *i* charges in hour *t*. `p_{i,t}` — power drawn (continuous, bounded by charger rating). |
| **Objective** | Minimize weighted sum of (a) peak coincident load per feeder, (b) energy cost under ToU tariff, (c) deviation from user-preferred start time (proxy for compliance). |
| **Constraints** | Per-session: `Σ_t p_{i,t}·Δt ≥ required_kWh_i`; charging window respects arrival/departure. Per-feeder: `Σ_i p_{i,t} + base_load_t ≤ headroom_t` for all *t*. Charger occupancy: at most one session per charger per slot. |
| **Output** | Schedule per session + aggregate peak-reduction estimate + compliance probability. |
| **Evaluation** | Simulated peak reduction vs uncontrolled baseline; constraint-violation rate (must be 0); solve time. |

### Model 3 — Infrastructure Site Recommendation

| Aspect | Decision |
|---|---|
| **Type** | Two-stage: (1) DBSCAN over predicted-demand grid points to identify candidate clusters; (2) weighted-sum multi-criteria scoring with PostGIS-derived features. |
| **Why over alternatives** | A pure ML ranker (learning-to-rank) needs labeled "good site" data which doesn't exist at pilot. A transparent weighted-sum with planner-tunable weights is *more* useful than a black-box ranker because planners can interrogate and adjust it. K-Means was rejected vs DBSCAN because DBSCAN handles arbitrary cluster shapes and noise (sparse rural areas) without forcing a *k*. |
| **Inputs per candidate** | Predicted EV demand density (kWh/km²), 12-month demand growth rate, feeder headroom (kW), distance to nearest existing charger (m), traffic volume score, POI density, land availability proxy (open data zoning), commercial viability score. |
| **Score** | `score = Σ_j w_j · normalize(feature_j)`, where weights are operator-tunable and default to a calibrated set. Min-max normalization within bbox. |
| **Output** | Ranked list with composite score (0–100) and per-criterion breakdown for explainability. |
| **Evaluation** | Hit-rate against historically successful chargers (precision@k on holdout cities); operator-rated relevance via dashboard feedback loop. |

---

### Explainability

| Technique | Where Applied |
|---|---|
| **SHAP TreeExplainer** | XGBoost demand forecasts — exact, fast (<50ms per prediction). |
| **SHAP DeepExplainer / KernelSHAP** | LSTM component (sampled, cached). |
| **LP dual variables** | Optimization: each binding constraint surfaces its shadow price ("Feeder F-12 thermal limit is the binding constraint; relaxing by 100 kW saves ₹X"). |
| **Per-criterion breakdown** | Site ranker: each candidate shows contribution of every criterion to its score. |
| **Counterfactual generation** | Templated: "Shifting *X*% of sessions past *T* drops peak by *Y* kW." Computed by re-running the optimizer with a perturbation. |
| **Templated NLG** | Jinja2 templates, parameterized by SHAP top-k, produce final natural-language sentences. **No external LLM call.** |

Explanations are persisted in `forecasts.explanation_json` and `recommendations.explanation_json` for audit, regulatory review, and post-hoc accuracy correlation.

---

# 5. Implementation Plan

## 5.1 Phase Breakdown

### Phase 1 — Hackathon MVP (Target: 72 hours)

**Goal:** End-to-end demoable system: synthetic data → forecast → schedule → site rank → dashboard with explanations.

**Scope:**
- Synthetic data generator covering 5 representative Bengaluru zones (Koramangala, Whitefield, JP Nagar, Electronic City, Indiranagar).
- One forecasting model per zone (XGBoost only; ensemble deferred).
- LP-based scheduler (PuLP for speed of dev) with 3 feeders.
- Site ranker over a 1 km × 1 km grid in two zones.
- React dashboard: risk heatmap, zone detail with forecast curve, scheduler recommendation card, planner candidate list, explanation pane.
- FastAPI backend with all read endpoints from §4.2.
- Single-VM deploy via Docker Compose.

**Explicit non-goals for MVP:** Feast (use direct Postgres feature reads), Kafka, Kubernetes, full RBAC (single admin user), audit log UI, Keycloak (mocked JWT).

### Phase 2 — Pilot Hardening (Months 1–4)

- Add LSTM + Prophet ensemble; calibrate quantiles.
- OR-Tools MILP replacing PuLP; warm-start from heuristic.
- Real (masked) data ingestion from one BESCOM ward.
- Feast feature store; MLflow registry.
- Keycloak auth, RBAC, audit log.
- What-if simulation with async job queue.
- Drift detection (Evidently AI) and automated retrain triggers.
- Operator feedback capture for site rankings.

### Phase 3 — Production Scaling (Months 4–9)

- Migrate to Kubernetes; HPA on inference services.
- Kafka-based streaming ingestion if SCADA real-time becomes available.
- Multi-zone rollout (50 → 500 zones).
- HA Postgres (Patroni), TimescaleDB multi-node.
- Full observability (Prometheus/Grafana/Loki + alerts).
- Chaos testing, DR runbooks, SOC 2-aligned security baseline.
- Optional: self-hosted small LLM (Llama-3.1-8B) for narrative refinement on explanations — strictly on-prem, never with raw asset IDs.

---

## 5.2 Task Breakdown (MVP)

| # | Task | Owner | Deps | Est. (h) |
|---|---|---|---|---|
| 1 | Project scaffold (mono-repo: `apps/api`, `apps/web`, `ml/`, `data/`, `infra/`) | All | — | 1 |
| 2 | Docker Compose: Postgres+PostGIS+Timescale, Redis, MinIO, FastAPI, React | Backend | 1 | 2 |
| 3 | Postgres schema migrations (Alembic) | Backend | 2 | 2 |
| 4 | Synthetic data generator (zones, feeders, DTs, chargers, sessions, load curves) calibrated to plausible BESCOM scale | Data/ML | 3 | 5 |
| 5 | dbt models: bronze→silver→gold for sessions, load, weather | Data | 4 | 3 |
| 6 | Feature engineering script (lag, calendar, weather joins) | ML | 5 | 3 |
| 7 | XGBoost training pipeline + MLflow logging (per-zone) | ML | 6 | 4 |
| 8 | Forecast inference service + Redis cache | ML/Backend | 7 | 3 |
| 9 | SHAP integration + explanation JSON builder + Jinja2 NLG templates | ML | 8 | 3 |
| 10 | LP scheduler with PuLP; constraint formulation | ML | 8 | 4 |
| 11 | Site ranker: DBSCAN + weighted-sum + PostGIS spatial joins | ML | 6 | 4 |
| 12 | FastAPI endpoints (§4.2) — read paths only for MVP | Backend | 8,10,11 | 5 |
| 13 | React app scaffold + routing + auth stub | Frontend | 2 | 2 |
| 14 | MapLibre risk heatmap with GeoJSON tile endpoint | Frontend | 12 | 4 |
| 15 | Zone detail page (Recharts time-series + explanation pane) | Frontend | 12 | 4 |
| 16 | Scheduler recommendation view | Frontend | 12 | 2 |
| 17 | Planner candidate list + per-criterion breakdown | Frontend | 12 | 3 |
| 18 | What-if simulation (sync version for MVP) | Full-stack | 12,15 | 3 |
| 19 | Seed demo data + canned scenarios (Koramangala overload, Whitefield expansion) | Data | 4 | 2 |
| 20 | Demo script + screen recording fallback | All | 14–18 | 2 |
| 21 | README, architecture diagram, judging-criteria mapping doc | All | — | 2 |

**Critical path:** 4 → 6 → 7 → 8 → 12 → 14/15/16/17.

---

## 5.3 Timeline Estimation

For a 3-person hackathon team over a 72-hour weekend:

| Day | Hours | Focus |
|---|---|---|
| Day 1 (24h) | Tasks 1–9 | Foundation: data, schema, first forecast end-to-end with explanations |
| Day 2 (24h) | Tasks 10–17 | Optimization + planner + dashboard core views |
| Day 3 (24h) | Tasks 18–21 + buffer | What-if, demo polish, edge cases, presentation |

A solo developer should descope to: 1 zone, forecast + risk map + explanation only (skip scheduler MILP, ship a heuristic), single dashboard page. Achievable in ~30–40 hours.

---

## 5.4 Risks & Mitigation

| Risk | Phase | Mitigation |
|---|---|---|
| Synthetic data lacks realism → demo feels toy | MVP | Calibrate generator against published BESCOM load curves and Vahan EV registration distributions; include holiday/weather signals |
| Forecast model underperforms on synthetic data | MVP | XGBoost with lag features is robust; have Prophet as fallback baseline |
| MILP solve time too slow for live demo | MVP | Cap problem size (≤500 sessions, ≤24 hours, ≤10 feeders); pre-compute results for canned demo scenarios |
| Frontend mapping performance with 10k+ features | MVP/P2 | Use vector tiles via `pg_tileserv`; cluster at low zoom |
| Real BESCOM data delayed | P2 | Synthetic-first means pilot is unblocked; signed NDA + masked sample sufficient |
| Model drift post-deployment | P2/P3 | Evidently AI for drift detection; auto-retrain triggers; champion/challenger evaluation |
| Operator distrust of recommendations | P2/P3 | Explainability is non-negotiable; collect operator feedback; show backtested accuracy in-app |
| Integration friction with SCADA exports | P2 | Read-only file-drop pattern; no direct OT touch |

---

## 5.5 Demo Strategy

**Narrative arc (5 minutes):**

1. **Hook (30s)** — "Bengaluru will have 1M EVs by 2030. BESCOM doesn't know which feeders will burn first. We do."
2. **Heatmap reveal (45s)** — Open dashboard. City heatmap shows three red feeders. Click Koramangala. Forecast curve. Explanation: *"Peak expected at 20:00, 18% above normal — driven by holiday return + temperature."*
3. **Smart scheduling (60s)** — Click *Recommend Schedule*. System shifts 27% of sessions past 22:00. Peak overload probability: 64% → 22%. Show counterfactual narrative.
4. **What-if (45s)** — Operator types: "What if 500 more EVs in Whitefield next month?" Live re-forecast; second feeder turns red.
5. **Planner view (60s)** — Switch to planning. Whitefield–Marathahalli corridor: top-3 sites with scores. Drag a weight slider (e.g., prioritize feeder headroom). Rankings update in real time. Explanation: *"Site #1 selected: 31% EV CAGR, nearest charger 4.8 km, 1.7 MW headroom."*
6. **Close (30s)** — Three differentiators: explainability on every output, synthetic-first (works without utility data), no-touch overlay (zero modification to BESCOM systems).

**Differentiators to spotlight to judges:**
- **Explainable on every screen** — judges will probe; every output has a "why."
- **Coupled forecast→optimization** — recommendations are grid-feasible by construction, not post-hoc filtered.
- **Synthetic-first design** — demoable today, productionizable tomorrow without architectural change.
- **Counterfactuals, not just predictions** — operators get "do this" not just "this will happen."

**Fallbacks:** Pre-recorded demo video; canned scenarios with deterministic outputs cached in Redis so live demo never depends on cold-path model inference.

---

*End of Document.*

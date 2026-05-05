# Graph Report - AI4bharat  (2026-05-06)

## Corpus Check
- 25 files · ~21,026 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 51 nodes · 40 edges · 7 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `get_forecast()` - 5 edges
2. `detect_risk()` - 4 edges
3. `optimize_schedule()` - 4 edges
4. `generate_data_endpoint()` - 2 edges
5. `explain_endpoint()` - 2 edges
6. `forecast_endpoint()` - 2 edges
7. `risk_endpoint()` - 2 edges
8. `schedule_endpoint()` - 2 edges
9. `generate_data()` - 2 edges
10. `explain_forecast()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `forecast_endpoint()` --calls--> `get_forecast()`  [INFERRED]
  backend\app\routes\forecast.py → backend\app\services\forecaster.py
- `detect_risk()` --calls--> `get_forecast()`  [INFERRED]
  backend\app\services\risk_detector.py → backend\app\services\forecaster.py
- `optimize_schedule()` --calls--> `get_forecast()`  [INFERRED]
  backend\app\services\scheduler.py → backend\app\services\forecaster.py
- `generate_data_endpoint()` --calls--> `generate_data()`  [INFERRED]
  backend\app\routes\data.py → backend\app\services\data_generator.py
- `explain_endpoint()` --calls--> `explain_forecast()`  [INFERRED]
  backend\app\routes\explain.py → backend\app\services\explainer.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.25
Nodes (4): risk_endpoint(), schedule_endpoint(), detect_risk(), optimize_schedule()

### Community 1 - "Community 1"
Cohesion: 0.43
Nodes (4): generateData(), getExplain(), getForecast(), getRisk()

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (3): forecast_endpoint(), get_forecast(), train_model()

### Community 3 - "Community 3"
Cohesion: 0.5
Nodes (2): generate_data_endpoint(), generate_data()

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (2): explain_endpoint(), explain_forecast()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (1): getSchedule()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (1): Config

## Knowledge Gaps
- **1 isolated node(s):** `Config`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 3`** (4 nodes): `data.py`, `data_generator.py`, `generate_data_endpoint()`, `generate_data()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (4 nodes): `explain.py`, `explainer.py`, `explain_endpoint()`, `explain_forecast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (3 nodes): `Recommendation.jsx`, `Recommendation()`, `getSchedule()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `config.py`, `Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_forecast()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `detect_risk()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `optimize_schedule()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `get_forecast()` (e.g. with `forecast_endpoint()` and `detect_risk()`) actually correct?**
  _`get_forecast()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `detect_risk()` (e.g. with `risk_endpoint()` and `get_forecast()`) actually correct?**
  _`detect_risk()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `optimize_schedule()` (e.g. with `schedule_endpoint()` and `get_forecast()`) actually correct?**
  _`optimize_schedule()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
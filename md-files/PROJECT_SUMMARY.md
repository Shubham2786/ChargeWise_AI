# Grid Optimizer - Project Summary

## Overview

A production-ready MVP for intelligent grid load management using machine learning. The system forecasts load, detects risks, optimizes scheduling, and provides AI-powered explanations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + Vite + Tailwind + Recharts                         │
│  - Dashboard (Forecast + Risk)                              │
│  - Recommendation (Optimization)                            │
│  - Planning (Infrastructure)                                │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     │ (Axios)
┌────────────────────▼────────────────────────────────────────┐
│                      Backend API                             │
│  FastAPI + Python 3.11                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Routes Layer                                          │  │
│  │ /generate-data /forecast /risk /schedule /explain    │  │
│  └──────────────────┬───────────────────────────────────┘  │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │ Services Layer                                        │  │
│  │ - Data Generator (Synthetic Data)                    │  │
│  │ - Forecaster (XGBoost)                               │  │
│  │ - Risk Detector (Threshold-based)                    │  │
│  │ - Scheduler (Load Shifting)                          │  │
│  │ - Explainer (SHAP)                                   │  │
│  └──────────────────┬───────────────────────────────────┘  │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │ ML Layer                                              │  │
│  │ XGBoost Model (cached in memory)                     │  │
│  │ SHAP TreeExplainer                                   │  │
│  └──────────────────┬───────────────────────────────────┘  │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │ Data Layer                                            │  │
│  │ CSV Storage (grid_data.csv)                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Pipeline

```
1. DATA GENERATION
   ↓
   Synthetic hourly load data
   - Base sinusoidal pattern
   - EV charging spike (18-22h)
   - Random noise
   ↓
   CSV: grid_data.csv

2. FORECAST
   ↓
   XGBoost Regression
   - Features: lag_1, lag_2, lag_3, hour
   - Output: 24h predictions
   ↓
   JSON: {predictions: [...], peak_hour: int}

3. RISK DETECTION
   ↓
   Threshold Classification
   - HIGH: > 80% capacity
   - MEDIUM: 60-80% capacity
   - LOW: < 60% capacity
   ↓
   JSON: {risk_level: str, max_load: float, capacity_percent: float}

4. SCHEDULING OPTIMIZATION
   ↓
   Load Shifting Algorithm
   - If HIGH risk: shift 25% load from 18-22h to post-22h
   - Calculate improvement %
   ↓
   JSON: {before: [...], after: [...], improvement_percent: float}

5. EXPLAINABILITY
   ↓
   SHAP TreeExplainer
   - Compute feature importance
   - Extract top 3 features
   ↓
   JSON: {summary: str}
```

## Key Features

### 1. Data Generation
- **Purpose**: Create realistic synthetic grid data
- **Method**: Sinusoidal base + EV spike + noise
- **Output**: 30 days × 24 hours × 3 zones = 2,160 records

### 2. Load Forecasting
- **Model**: XGBoost Regression
- **Features**: 3 lag features + hour of day
- **Training**: Once at startup, cached in memory
- **Prediction**: Next 24 hours

### 3. Risk Detection
- **Method**: Threshold-based classification
- **Thresholds**: Configurable via .env
- **Output**: LOW/MEDIUM/HIGH + capacity %

### 4. Schedule Optimization
- **Strategy**: Shift EV charging to off-peak
- **Amount**: 25% of load (configurable)
- **Target**: Hours 18-22 → post-22
- **Metric**: Peak reduction %

### 5. AI Explainability
- **Method**: SHAP TreeExplainer
- **Output**: Top 3 contributing features
- **Format**: Human-readable summary

## Technology Decisions

### Why XGBoost?
- Fast training and prediction
- Handles non-linear patterns
- Built-in feature importance
- Works well with small datasets

### Why SHAP?
- Model-agnostic explanations
- TreeExplainer optimized for XGBoost
- Provides feature-level insights

### Why FastAPI?
- Modern async Python framework
- Auto-generated API docs
- Type hints and validation
- Fast performance

### Why React + Vite?
- Fast development with HMR
- Modern build tooling
- Component-based architecture
- Large ecosystem

### Why Tailwind CSS?
- Utility-first approach
- Rapid prototyping
- Consistent design
- Small bundle size

### Why Recharts?
- React-native charting
- Declarative API
- Responsive by default
- Good documentation

## Configuration Management

All configuration is centralized in `.env` files:

**Backend** (`backend/.env`):
- Server settings
- Model hyperparameters
- Risk thresholds
- Scheduling parameters
- SHAP configuration

**Frontend** (`frontend/.env`):
- API URL

See `ENV_VARIABLES.md` for complete documentation.

## File Structure

```
AI4bharat/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── routes/              # API endpoints
│   │   │   ├── data.py
│   │   │   ├── forecast.py
│   │   │   ├── risk.py
│   │   │   ├── schedule.py
│   │   │   └── explain.py
│   │   ├── services/            # Business logic
│   │   │   ├── data_generator.py
│   │   │   ├── forecaster.py
│   │   │   ├── risk_detector.py
│   │   │   ├── scheduler.py
│   │   │   └── explainer.py
│   │   ├── utils/               # Utilities
│   │   │   └── config.py        # Config loader
│   │   └── data/                # Data storage
│   │       └── grid_data.csv
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Recommendation.jsx
│   │   │   └── Planning.jsx
│   │   ├── services/            # API client
│   │   │   └── api.js
│   │   ├── App.jsx              # Root component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env
│   └── .env.example
├── README.md                     # Main documentation
├── QUICKSTART.md                 # Quick start guide
├── ENV_VARIABLES.md              # Environment variables
├── start-backend.bat             # Backend launcher
└── start-frontend.bat            # Frontend launcher
```

## API Contract

All endpoints return JSON with consistent schema:

### Data Schema
```typescript
{
  timestamp: string,      // ISO format
  zone: string,          // Zone_A, Zone_B, Zone_C
  load: number           // kW
}
```

### Forecast Schema
```typescript
{
  predictions: number[], // 24 values
  peak_hour: number      // 0-23
}
```

### Risk Schema
```typescript
{
  risk_level: "LOW" | "MEDIUM" | "HIGH",
  max_load: number,
  capacity_percent: number
}
```

### Schedule Schema
```typescript
{
  before: number[],      // 24 values
  after: number[],       // 24 values
  improvement_percent: number
}
```

### Explain Schema
```typescript
{
  summary: string        // Human-readable explanation
}
```

## Performance Characteristics

- **Model Training**: ~1-2 seconds (once at startup)
- **Forecast Generation**: ~50ms
- **Risk Detection**: ~5ms
- **Schedule Optimization**: ~10ms
- **SHAP Explanation**: ~100-200ms

## Scalability Considerations

Current MVP limitations:
- Single-zone forecasting (Zone_A)
- In-memory model storage
- CSV data storage
- No authentication

Future enhancements:
- Multi-zone forecasting
- Database storage (PostgreSQL)
- Model versioning
- User authentication
- Real-time data ingestion
- Distributed training

## Testing

### Backend Testing
```bash
# Test all endpoints
curl http://localhost:8000/generate-data
curl http://localhost:8000/forecast
curl http://localhost:8000/risk
curl http://localhost:8000/schedule
curl http://localhost:8000/explain
```

### Frontend Testing
1. Open http://localhost:5173
2. Navigate through all pages
3. Verify charts render correctly
4. Check console for errors

## Deployment

### Backend
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend
```bash
npm run build
# Serve dist/ folder with nginx or CDN
```

## Maintenance

### Updating Dependencies
```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
```

### Monitoring
- Check API response times
- Monitor model prediction accuracy
- Track error rates
- Review SHAP explanations

## License

MIT

## Contributors

Built as a production-quality MVP for grid optimization.

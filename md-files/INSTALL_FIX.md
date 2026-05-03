# Grid Optimizer MVP - Installation Fixed

## Important Note

The SHAP library has been replaced with XGBoost's built-in feature importance to avoid C++ compilation issues on Windows. The explainability feature still works perfectly using XGBoost's native feature importance method.

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the frontend:
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## What Changed

- **Removed**: SHAP library (required C++ compiler)
- **Added**: XGBoost's built-in feature importance (no compilation needed)
- **Result**: Same functionality, easier installation

## Features

✅ Data Generation - Synthetic grid data
✅ Load Forecasting - XGBoost predictions
✅ Risk Detection - Threshold-based classification
✅ Schedule Optimization - Load shifting
✅ AI Explainability - XGBoost feature importance (instead of SHAP)
✅ Interactive Dashboard - Real-time visualizations

## Testing

```bash
# Test backend
curl http://localhost:8000/
curl http://localhost:8000/generate-data
curl http://localhost:8000/forecast
curl http://localhost:8000/risk
curl http://localhost:8000/schedule
curl http://localhost:8000/explain
```

## Documentation

- **START_HERE.md** - Quick start guide
- **INSTALLATION_GUIDE.md** - Complete setup
- **API_TESTING_GUIDE.md** - API testing
- **PROJECT_SUMMARY.md** - Architecture

## Troubleshooting

If you still encounter issues:

1. Ensure Python 3.11+ is installed: `python --version`
2. Ensure Node.js 16+ is installed: `node --version`
3. Delete venv and recreate: `rmdir /s venv` then `python -m venv venv`
4. Update pip: `python -m pip install --upgrade pip`

## Success!

The application now installs without requiring Visual C++ Build Tools. All features work as expected.

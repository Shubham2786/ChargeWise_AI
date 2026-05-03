# Grid Optimizer MVP

AI-powered grid load forecasting, risk detection, and optimization system.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Documentation

All documentation is in the `md-files/` folder:
- **START_HERE.md** - Quick start guide
- **INSTALLATION_GUIDE.md** - Complete setup
- **API_TESTING_GUIDE.md** - API testing
- **PROJECT_SUMMARY.md** - Architecture

## Features

✅ Load Forecasting (XGBoost)
✅ Risk Detection
✅ Schedule Optimization
✅ AI Explainability
✅ Interactive Dashboard

## Tech Stack

**Backend:** Python, FastAPI, XGBoost, Pandas
**Frontend:** React, Vite, Tailwind CSS, Recharts

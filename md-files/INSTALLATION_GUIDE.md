# 🚀 Grid Optimizer - Complete Setup Guide

## 📋 What You Have

A complete, production-ready MVP for intelligent grid load management with:

✅ **Backend** (Python + FastAPI + XGBoost + SHAP)
✅ **Frontend** (React + Vite + Tailwind + Recharts)
✅ **Environment Configuration** (.env files)
✅ **Documentation** (README, guides, API docs)
✅ **Quick Start Scripts** (Windows batch files)

## 🎯 Quick Start (3 Steps)

### Step 1: Verify Installation
```bash
verify-installation.bat
```
This checks if Python and Node.js are installed.

### Step 2: Start Backend
```bash
start-backend.bat
```
- Creates virtual environment
- Installs Python dependencies
- Starts FastAPI server on http://localhost:8000

### Step 3: Start Frontend (New Terminal)
```bash
start-frontend.bat
```
- Installs Node.js dependencies
- Starts Vite dev server on http://localhost:5173

### Step 4: Open Browser
Navigate to: **http://localhost:5173**

## 📁 Project Structure

```
AI4bharat/
├── 📂 backend/                    # Python FastAPI backend
│   ├── 📂 app/
│   │   ├── main.py               # FastAPI application
│   │   ├── 📂 routes/            # API endpoints
│   │   ├── 📂 services/          # Business logic
│   │   ├── 📂 utils/             # Configuration
│   │   └── 📂 data/              # Data storage
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables
│   └── .env.example              # Environment template
│
├── 📂 frontend/                   # React frontend
│   ├── 📂 src/
│   │   ├── 📂 pages/             # Page components
│   │   ├── 📂 services/          # API client
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Entry point
│   ├── package.json              # Node dependencies
│   ├── .env                      # Environment variables
│   └── .env.example              # Environment template
│
├── 📄 README.md                   # Main documentation
├── 📄 QUICKSTART.md               # Quick start guide
├── 📄 ENV_VARIABLES.md            # Environment variables docs
├── 📄 PROJECT_SUMMARY.md          # Architecture overview
├── 🔧 start-backend.bat           # Backend launcher
├── 🔧 start-frontend.bat          # Frontend launcher
└── 🔧 verify-installation.bat     # Installation checker
```

## 🔧 Environment Variables

### Backend (.env)
All configuration is in `backend/.env`:

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Data
MAX_CAPACITY=100
ZONES=Zone_A,Zone_B,Zone_C
DATA_DAYS=30

# Model
MODEL_N_ESTIMATORS=50
MODEL_MAX_DEPTH=4
LAG_FEATURES=3

# Risk Thresholds
RISK_HIGH_THRESHOLD=80
RISK_MEDIUM_THRESHOLD=60

# Scheduling
LOAD_SHIFT_PERCENT=25
EV_SPIKE_START_HOUR=18
EV_SPIKE_END_HOUR=22

# SHAP
SHAP_TOP_FEATURES=3
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

See `ENV_VARIABLES.md` for detailed documentation.

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/generate-data` | GET | Generate synthetic grid data |
| `/forecast` | GET | Get 24-hour load forecast |
| `/risk` | GET | Detect risk level |
| `/schedule` | GET | Optimize load schedule |
| `/explain` | GET | Get AI explanation |

**API Documentation**: http://localhost:8000/docs (Swagger UI)

## 📊 Features

### 1. Dashboard (/)
- 24-hour load forecast chart
- Peak hour indicator
- Risk level (color-coded: 🟢 LOW, 🟡 MEDIUM, 🔴 HIGH)
- Capacity usage percentage
- AI explanation of predictions

### 2. Recommendation (/recommendation)
- Before vs After optimization comparison
- Peak load reduction percentage
- Load shifting recommendations
- Visual impact analysis

### 3. Planning (/planning)
- Infrastructure health scores
- Location-based assessments
- Upgrade recommendations
- Priority indicators

## 🔄 System Workflow

```
1. DATA GENERATION
   ↓ Synthetic hourly data (30 days × 3 zones)
   
2. FORECAST
   ↓ XGBoost predicts next 24 hours
   
3. RISK DETECTION
   ↓ Classify as LOW/MEDIUM/HIGH
   
4. SCHEDULING
   ↓ Optimize by shifting EV load
   
5. EXPLAINABILITY
   ↓ SHAP explains top factors
```

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:8000/

# Generate data
curl http://localhost:8000/generate-data

# Get forecast
curl http://localhost:8000/forecast

# Check risk
curl http://localhost:8000/risk

# Get schedule
curl http://localhost:8000/schedule

# Get explanation
curl http://localhost:8000/explain
```

### Test Frontend
1. Open http://localhost:5173
2. Dashboard should load automatically
3. Navigate to Recommendation page
4. Navigate to Planning page
5. Check browser console for errors

## 🛠️ Manual Setup (Alternative)

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

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```env
# Change in backend/.env
PORT=8001
```

**Module not found:**
```bash
# Ensure virtual environment is activated
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**CORS errors:**
```env
# Add frontend URL to backend/.env
CORS_ORIGINS=http://localhost:5173
```

### Frontend Issues

**Port 5173 already in use:**
```javascript
// Change in frontend/vite.config.js
server: { port: 5174 }
```

**Can't connect to backend:**
```env
# Verify in frontend/.env
VITE_API_URL=http://localhost:8000
```

**Dependencies error:**
```bash
cd frontend
rmdir /s /q node_modules
npm install
```

## 📈 Performance

- **Model Training**: ~1-2 seconds (once at startup)
- **Forecast**: ~50ms per request
- **Risk Detection**: ~5ms per request
- **Optimization**: ~10ms per request
- **Explanation**: ~100-200ms per request

## 🔐 Security Notes

- `.env` files contain configuration (not secrets in MVP)
- No authentication implemented (MVP only)
- CORS configured for local development
- For production: add authentication, HTTPS, rate limiting

## 📚 Documentation

- **README.md** - Main documentation
- **QUICKSTART.md** - Quick start guide
- **ENV_VARIABLES.md** - Environment variables reference
- **PROJECT_SUMMARY.md** - Architecture and design decisions
- **API Docs** - http://localhost:8000/docs (when running)

## 🚀 Production Deployment

### Backend
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
npm run build
# Serve dist/ folder with nginx, Apache, or CDN
```

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **XGBoost**: https://xgboost.readthedocs.io/
- **SHAP**: https://shap.readthedocs.io/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Recharts**: https://recharts.org/

## ✅ Verification Checklist

- [ ] Python 3.11+ installed
- [ ] Node.js 16+ installed
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:8000
- [ ] Can access http://localhost:5173
- [ ] Dashboard loads with charts
- [ ] All pages navigate correctly
- [ ] API endpoints respond correctly

## 🤝 Support

If you encounter issues:

1. Run `verify-installation.bat`
2. Check error messages in terminal
3. Review troubleshooting section
4. Check API docs at http://localhost:8000/docs
5. Review browser console for frontend errors

## 📝 Next Steps

After successful setup:

1. ✅ Explore the Dashboard
2. ✅ Review Recommendations
3. ✅ Check Planning page
4. ✅ Test API endpoints
5. ✅ Modify .env to customize behavior
6. ✅ Review code structure
7. ✅ Read PROJECT_SUMMARY.md for architecture details

## 🎉 Success!

You now have a fully functional grid optimization system with:
- Real-time load forecasting
- Risk detection
- Schedule optimization
- AI-powered explanations
- Beautiful visualizations

**Enjoy building with Grid Optimizer!** 🚀

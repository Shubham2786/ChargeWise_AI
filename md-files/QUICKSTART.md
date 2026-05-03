# Quick Start Guide

## Fastest Way to Run

### Windows Users

1. **Start Backend** (in one terminal):
   ```
   start-backend.bat
   ```

2. **Start Frontend** (in another terminal):
   ```
   start-frontend.bat
   ```

3. **Open Browser**:
   - Navigate to http://localhost:5173

### Manual Setup

#### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## First Time Setup

The application will automatically:
1. Generate 30 days of synthetic grid data
2. Train the XGBoost model
3. Display forecasts and recommendations

## Environment Configuration

Both `.env` files are pre-configured with sensible defaults. 

To customize:
- **Backend**: Edit `backend/.env`
- **Frontend**: Edit `frontend/.env`

See `README.md` for detailed configuration options.

## Verify Installation

Test the API:
```bash
curl http://localhost:8000/
```

Expected response:
```json
{"status": "ok", "message": "Grid Optimizer API"}
```

## Troubleshooting

**Port already in use:**
- Backend: Change PORT in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

**Module not found:**
- Backend: Ensure virtual environment is activated
- Frontend: Delete `node_modules` and run `npm install`

**CORS errors:**
- Ensure both servers are running
- Check CORS_ORIGINS in `backend/.env`

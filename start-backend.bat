@echo off
echo ========================================
echo Grid Optimizer - Backend Setup
echo ========================================
echo.

cd backend

echo [1/3] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/3] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

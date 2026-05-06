@echo off
echo ========================================
echo ChargeWise AI - Complete Setup
echo ========================================
echo.

cd backend

echo Step 1: Activating virtual environment...
call venv\Scripts\activate

echo.
echo Step 2: Creating database...
python scripts\create_database.py

echo.
echo Step 3: Running migrations...
alembic upgrade head

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next step: Run data ingestion
echo   run-ingestion.bat
echo.
pause

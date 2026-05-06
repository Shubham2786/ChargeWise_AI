@echo off
echo ========================================
echo ChargeWise AI - Database Migration
echo ========================================
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Running Alembic migrations...
alembic upgrade head

echo.
echo ========================================
echo Migration complete!
echo ========================================
pause

@echo off
echo ========================================
echo ChargeWise AI - ACN Data Ingestion
echo ========================================
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Starting ingestion pipeline...
python scripts\ingest_acn.py

echo.
echo ========================================
echo Ingestion complete!
echo ========================================
pause

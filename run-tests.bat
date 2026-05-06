@echo off
echo ========================================
echo ChargeWise AI - Running Tests
echo ========================================
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Running pytest...
pytest -v

echo.
echo ========================================
echo Tests complete!
echo ========================================
pause

@echo off
echo ========================================
echo Grid Optimizer - Frontend Setup
echo ========================================
echo.

cd frontend

echo [1/2] Installing dependencies...
call npm install
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
echo Starting frontend server...
echo Frontend will be available at: http://localhost:5173
echo.

call npm run dev

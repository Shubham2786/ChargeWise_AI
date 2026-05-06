@echo off
echo ========================================
echo ChargeWise AI - Database Setup
echo ========================================
echo.

echo Creating database 'chargewise'...
echo.

psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE chargewise;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Database created successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ⚠️  Database may already exist or check connection
    echo ========================================
)

echo.
pause

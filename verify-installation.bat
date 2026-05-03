@echo off
echo ========================================
echo Grid Optimizer - Installation Verification
echo ========================================
echo.

set ERROR_COUNT=0

echo [1/8] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python not found. Please install Python 3.11+
    set /a ERROR_COUNT+=1
) else (
    python --version
    echo [PASS] Python found
)
echo.

echo [2/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Node.js not found. Please install Node.js 16+
    set /a ERROR_COUNT+=1
) else (
    node --version
    echo [PASS] Node.js found
)
echo.

echo [3/8] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] npm not found. Please install npm
    set /a ERROR_COUNT+=1
) else (
    npm --version
    echo [PASS] npm found
)
echo.

echo [4/8] Checking backend directory structure...
if exist "backend\app\main.py" (
    echo [PASS] Backend structure OK
) else (
    echo [FAIL] Backend structure incomplete
    set /a ERROR_COUNT+=1
)
echo.

echo [5/8] Checking frontend directory structure...
if exist "frontend\src\App.jsx" (
    echo [PASS] Frontend structure OK
) else (
    echo [FAIL] Frontend structure incomplete
    set /a ERROR_COUNT+=1
)
echo.

echo [6/8] Checking backend .env file...
if exist "backend\.env" (
    echo [PASS] Backend .env exists
) else (
    echo [WARN] Backend .env not found (will use defaults)
)
echo.

echo [7/8] Checking frontend .env file...
if exist "frontend\.env" (
    echo [PASS] Frontend .env exists
) else (
    echo [WARN] Frontend .env not found (will use defaults)
)
echo.

echo [8/8] Checking required files...
set FILES_OK=1
if not exist "backend\requirements.txt" set FILES_OK=0
if not exist "frontend\package.json" set FILES_OK=0
if not exist "README.md" set FILES_OK=0

if %FILES_OK%==1 (
    echo [PASS] All required files present
) else (
    echo [FAIL] Some required files missing
    set /a ERROR_COUNT+=1
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.

if %ERROR_COUNT%==0 (
    echo [SUCCESS] All checks passed!
    echo.
    echo Next steps:
    echo 1. Run: start-backend.bat
    echo 2. Run: start-frontend.bat  ^(in a new terminal^)
    echo 3. Open: http://localhost:5173
) else (
    echo [ERROR] %ERROR_COUNT% check(s) failed
    echo Please fix the errors above before proceeding
)
echo.

pause

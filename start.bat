@echo off
title Inventory Management System Launcher
echo =====================================================
echo  Starting Inventory Management System
echo =====================================================
echo.

:: 1. Check and Start MySQL service
echo [1/3] Checking MySQL80 database service...
sc query MySQL80 | find "RUNNING" >nul
if errorlevel 1 (
    echo MySQL80 is stopped. Starting MySQL80...
    net start MySQL80
    if errorlevel 1 (
        echo.
        echo [WARNING] Could not start MySQL automatically. 
        echo If you see 'Access Denied', please right-click this script and select 'Run as administrator'.
        echo.
    ) else (
        echo MySQL80 started successfully.
    )
) else (
    echo MySQL80 is already running.
)
echo.

:: 2. Start Backend Server
echo [2/3] Starting Backend API Server (Port 5000)...
start "Inventory Backend (Port 5000)" cmd /k "cd /d \"%~dp0backend\" && npm run dev"
echo Backend launched in a new window.
echo.

:: 3. Start Frontend Client
echo [3/3] Starting Frontend React UI (Port 5173)...
start "Inventory Frontend (Port 5173)" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"
echo Frontend launched in a new window.
echo.

:: Wait 3 seconds and open browser
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo =====================================================
echo  Inventory Management System is now active!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:5000/api/health
echo =====================================================
pause

@echo off
title Stop Inventory Management System & MySQL
echo =====================================================
echo  Stopping Inventory Management System & MySQL
echo =====================================================
echo.

echo Stopping MySQL80 service...
net stop MySQL80
if errorlevel 1 (
    echo.
    echo [INFO] If you see 'Access Denied', please right-click this script and select 'Run as administrator'.
    echo.
) else (
    echo MySQL80 service stopped successfully.
)

echo.
echo You can now close the backend and frontend terminal windows.
echo =====================================================
pause

@echo off
title Stop Inventory Management System & PostgreSQL
echo =====================================================
echo  Stopping Inventory Management System & PostgreSQL
echo =====================================================
echo.

echo Stopping postgresql-x64-17 service...
net stop postgresql-x64-17
if errorlevel 1 (
    echo.
    echo [INFO] If you see 'Access Denied', please right-click this script and select 'Run as administrator'.
    echo.
) else (
    echo PostgreSQL service stopped successfully.
)

echo.
echo You can now close the backend and frontend terminal windows.
echo =====================================================
pause

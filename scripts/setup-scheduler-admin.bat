@echo off
:: Korea NEWS - Task Scheduler Setup (Run as Admin)
:: Right-click this file -> "Run as administrator"

echo ============================================
echo Korea NEWS - Task Scheduler Setup
echo ============================================
echo.

:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

cd /d d:\cbt\koreanews
powershell -ExecutionPolicy Bypass -File scripts\setup-scheduler.ps1

echo.
echo Press any key to close...
pause >nul

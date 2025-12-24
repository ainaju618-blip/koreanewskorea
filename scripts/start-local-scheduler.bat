@echo off
:: Korea NEWS Local Scheduler Launcher
:: No admin permissions required!
:: Just double-click to start

echo ============================================
echo Korea NEWS Local Scheduler
echo ============================================
echo.

cd /d d:\cbt\koreanews

:: Check if schedule library is installed
python -c "import schedule" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing schedule library...
    pip install schedule
    echo.
)

:: Run the local scheduler
python scripts\local_scheduler.py

pause

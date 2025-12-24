@echo off
REM ============================================
REM Korea NEWS - Full Automation Launcher
REM Created: 2025-12-24
REM Purpose: Windows Task Scheduler entry point
REM ============================================

echo ============================================
echo [%date% %time%] Korea NEWS Full Automation Started
echo ============================================

REM Set working directory to project root
cd /d "d:\cbt\koreanews"
echo [DEBUG] Working directory: %cd%

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo [ERROR] Please install Python and try again
    exit /b 1
)
echo [DEBUG] Python found:
python --version

REM Check if required environment variables are set
if "%SUPABASE_URL%"=="" (
    echo [WARNING] SUPABASE_URL not set, loading from .env.local...

    REM Try to load from .env.local
    if exist ".env.local" (
        echo [DEBUG] Loading environment from .env.local
        for /f "tokens=1,2 delims==" %%a in (.env.local) do (
            REM Skip comments and empty lines
            echo %%a | findstr /r "^#" >nul
            if errorlevel 1 (
                if not "%%a"=="" (
                    set "%%a=%%b"
                    echo [DEBUG] Set %%a
                )
            )
        )
    ) else (
        echo [ERROR] .env.local not found and environment variables not set
        echo [ERROR] Please create .env.local or set environment variables
        exit /b 1
    )
)

REM Verify required variables
echo [DEBUG] Checking required environment variables...
if "%SUPABASE_URL%"=="" (
    echo [ERROR] SUPABASE_URL is required
    exit /b 1
)
if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo [ERROR] SUPABASE_SERVICE_ROLE_KEY is required
    exit /b 1
)
echo [DEBUG] Environment variables OK

REM Check if the Python script exists
if not exist "scripts\full_automation.py" (
    echo [ERROR] scripts\full_automation.py not found
    exit /b 1
)
echo [DEBUG] Python script found

REM Create logs directory if not exists
if not exist "logs" mkdir logs
echo [DEBUG] Logs directory ready

REM Generate log filename with timestamp
set LOG_DATE=%date:~0,4%%date:~5,2%%date:~8,2%
set LOG_TIME=%time:~0,2%%time:~3,2%
set LOG_TIME=%LOG_TIME: =0%
set LOG_FILE=logs\automation_%LOG_DATE%_%LOG_TIME%.log

echo [DEBUG] Log file: %LOG_FILE%

REM Run the Python script
echo ============================================
echo [%date% %time%] Running full_automation.py
echo ============================================

python scripts\full_automation.py 2>&1 | tee %LOG_FILE%

set EXIT_CODE=%ERRORLEVEL%

echo ============================================
echo [%date% %time%] Automation finished with exit code: %EXIT_CODE%
echo [%date% %time%] Log saved to: %LOG_FILE%
echo ============================================

exit /b %EXIT_CODE%

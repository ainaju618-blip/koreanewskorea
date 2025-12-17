@echo off
cd /d "%~dp0"
echo ========================================
echo   Claude Hub - Starting...
echo ========================================
echo   URL: http://localhost:8001
echo ========================================
echo.
echo   Press Ctrl+C to stop
echo ========================================
python -c "import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=8001)"
pause

@echo off
echo Starting Ollama Monitor...
powershell -ExecutionPolicy Bypass -File "%~dp0ollama-monitor.ps1"
pause

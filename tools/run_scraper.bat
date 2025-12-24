@echo off
cd /d "d:\cbt\koreanews"

REM Log file for debugging
set LOGFILE=d:\cbt\koreanews\tools\scraper_log.txt

REM Run with python.exe (not pythonw.exe) and log output
echo [%date% %time%] Starting scheduled scraper... >> "%LOGFILE%"
"C:\Python314\python.exe" "d:\cbt\koreanews\tools\scheduled_scraper.py" >> "%LOGFILE%" 2>&1
echo [%date% %time%] Exit code: %ERRORLEVEL% >> "%LOGFILE%"

@echo off
:: Korea NEWS - Stop Local Scheduler
:: Kills all running Python scheduler processes

echo Stopping Local Scheduler...
taskkill /f /im pythonw.exe 2>nul
taskkill /f /im python.exe /fi "WINDOWTITLE eq Korea NEWS*" 2>nul
echo Done.
pause

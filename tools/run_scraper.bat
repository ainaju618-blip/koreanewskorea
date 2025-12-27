@echo off
echo [%date% %time%] === SCHEDULED TASK TRIGGERED === >> "d:\cbt\koreanews\tools\trigger_log.txt"
cd /d "d:\cbt\koreanews"
"C:\Python314\pythonw.exe" "d:\cbt\koreanews\tools\scheduled_scraper.py"
echo [%date% %time%] === SCHEDULED TASK COMPLETED === >> "d:\cbt\koreanews\tools\trigger_log.txt"

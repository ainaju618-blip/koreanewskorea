@echo off
:: Korea NEWS - Task Scheduler Remove (Run as Admin)
:: Right-click this file -> "Run as administrator"

echo ============================================
echo Korea NEWS - Task Scheduler Remove
echo ============================================
echo.

:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [INFO] Removing all KoreaNews scheduled tasks...
echo.

schtasks /delete /tn "KoreaNews-FullAutomation-0930" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1030" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1130" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1230" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1330" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1430" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1530" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1630" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1730" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1830" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-1930" /f 2>nul
schtasks /delete /tn "KoreaNews-FullAutomation-2030" /f 2>nul

echo.
echo [OK] All tasks removed!
echo.
pause

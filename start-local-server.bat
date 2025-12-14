@echo off
echo ===================================
echo Korea NEWS 로컬 서버 시작
echo ===================================
echo.
echo 기존 Node.js 프로세스 종료 중...
taskkill /F /IM node.exe >nul 2>&1
echo 완료!
echo.
echo 서버 시작 중... (http://localhost:3000)
echo.
cd /d D:\cbt\koreanews
npm run dev

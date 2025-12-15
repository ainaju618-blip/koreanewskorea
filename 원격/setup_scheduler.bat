@echo off
chcp 65001 > nul
echo ============================================================
echo   Korea NEWS 자동 스크래퍼 스케줄러 설정
echo ============================================================
echo.

:: 현재 디렉토리 저장
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

echo [1/5] Python 확인 중...
python --version > nul 2>&1
if errorlevel 1 (
    echo ⚠️ Python이 설치되어 있지 않습니다. 자동 설치를 시작합니다...
    echo.

    :: Python 설치 파일 다운로드
    echo    Python 다운로드 중...
    curl -L -o "%TEMP%\python_installer.exe" "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe"

    if not exist "%TEMP%\python_installer.exe" (
        echo ❌ Python 다운로드 실패!
        echo    수동으로 설치하세요: https://www.python.org/downloads/
        pause
        exit /b 1
    )

    :: Python 자동 설치 (PATH 추가 포함)
    echo    Python 설치 중... (1~2분 소요)
    "%TEMP%\python_installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

    :: 설치 완료 대기
    timeout /t 10 /nobreak > nul

    :: 설치 파일 삭제
    del "%TEMP%\python_installer.exe" > nul 2>&1

    echo ✅ Python 설치 완료!
    echo.
    echo ⚠️ PATH 적용을 위해 PC를 재부팅하거나,
    echo    이 창을 닫고 새 명령 프롬프트에서 다시 실행하세요.
    echo.
    pause
    exit /b 0
) else (
    echo ✅ Python 확인 완료
)

echo.
echo [2/5] pip 업그레이드 중...
python -m pip install --upgrade pip > nul 2>&1
echo ✅ pip 업그레이드 완료

echo.
echo [3/5] 필수 패키지 설치 중...
echo    패키지 설치 중... (1~2분 소요)
pip install playwright python-dotenv requests cloudinary supabase > nul 2>&1
echo    Playwright 브라우저 설치 중... (1~2분 소요)
playwright install chromium > nul 2>&1
echo ✅ 패키지 설치 완료

echo.
echo [4/5] 환경변수 파일 확인...
if not exist "%PROJECT_DIR%\.env" (
    echo ⚠️ .env 파일이 없습니다!
    copy "%SCRIPT_DIR%.env.production" "%PROJECT_DIR%\.env" > nul
    echo ✅ .env 파일 자동 생성 완료
) else (
    echo ✅ .env 파일 존재
)

echo.
echo [5/5] Windows 작업 스케줄러 등록 중...

:: 09:00 작업 등록
schtasks /create /tn "KoreaNews_Scraper_0900" /tr "python \"%PROJECT_DIR%\원격\run_all_scrapers.py\"" /sc daily /st 09:00 /f > nul 2>&1
echo ✅ 09:00 스케줄 등록

:: 13:00 작업 등록
schtasks /create /tn "KoreaNews_Scraper_1300" /tr "python \"%PROJECT_DIR%\원격\run_all_scrapers.py\"" /sc daily /st 13:00 /f > nul 2>&1
echo ✅ 13:00 스케줄 등록

:: 17:00 작업 등록
schtasks /create /tn "KoreaNews_Scraper_1700" /tr "python \"%PROJECT_DIR%\원격\run_all_scrapers.py\"" /sc daily /st 17:00 /f > nul 2>&1
echo ✅ 17:00 스케줄 등록

echo.
echo ============================================================
echo   설정 완료!
echo ============================================================
echo.
echo 📅 스케줄:
echo    - 매일 09:00 자동 실행
echo    - 매일 13:00 자동 실행
echo    - 매일 17:00 자동 실행
echo.
echo 📂 프로젝트 경로: %PROJECT_DIR%
echo.
echo 🧪 테스트 실행:
echo    python "%PROJECT_DIR%\원격\run_all_scrapers.py" --dry-run
echo.
echo 🗑️ 스케줄 삭제:
echo    schtasks /delete /tn "KoreaNews_Scraper_0900" /f
echo    schtasks /delete /tn "KoreaNews_Scraper_1300" /f
echo    schtasks /delete /tn "KoreaNews_Scraper_1700" /f
echo.
pause

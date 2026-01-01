# Yu-1 Project Deployment Script
# Usage: .\deploy.ps1 -Target "D:\cbt\yu-deploy"

param(
    [Parameter(Mandatory=$false)]
    [string]$Target = "D:\cbt\yu-deploy"
)

$SOURCE = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  주역 점술 프로젝트 배포 스크립트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "소스: $SOURCE" -ForegroundColor Yellow
Write-Host "대상: $Target" -ForegroundColor Yellow
Write-Host ""

# 확인
$confirm = Read-Host "진행하시겠습니까? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "취소되었습니다." -ForegroundColor Red
    exit
}

# 대상 폴더 생성
Write-Host "`n[1/6] 대상 폴더 생성..." -ForegroundColor Green
if (Test-Path $Target) {
    $overwrite = Read-Host "대상 폴더가 이미 존재합니다. 덮어쓰시겠습니까? (Y/N)"
    if ($overwrite -ne "Y" -and $overwrite -ne "y") {
        Write-Host "취소되었습니다." -ForegroundColor Red
        exit
    }
    Remove-Item -Recurse -Force $Target
}
New-Item -ItemType Directory -Force -Path $Target | Out-Null
New-Item -ItemType Directory -Force -Path "$Target\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$Target\frontend" | Out-Null

# Backend 복사
Write-Host "[2/6] Backend 복사 중..." -ForegroundColor Green

# app 폴더 복사 (핵심)
robocopy "$SOURCE\backend\app" "$Target\backend\app" /E /XD __pycache__ /NFL /NDL /NJH /NJS /NC /NS | Out-Null
Write-Host "  - app/ 폴더 완료" -ForegroundColor Gray

# alembic 폴더 복사
robocopy "$SOURCE\backend\alembic" "$Target\backend\alembic" /E /XD __pycache__ /NFL /NDL /NJH /NJS /NC /NS | Out-Null
Write-Host "  - alembic/ 폴더 완료" -ForegroundColor Gray

# data 폴더 복사
robocopy "$SOURCE\backend\data" "$Target\backend\data" /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null
Write-Host "  - data/ 폴더 완료" -ForegroundColor Gray

# 설정 파일들
Copy-Item "$SOURCE\backend\requirements.txt" "$Target\backend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\backend\.env.example" "$Target\backend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\backend\.env" "$Target\backend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\backend\alembic.ini" "$Target\backend\" -ErrorAction SilentlyContinue
Write-Host "  - 설정 파일 완료" -ForegroundColor Gray

# Frontend 복사
Write-Host "[3/6] Frontend 복사 중..." -ForegroundColor Green

# src 폴더 복사 (핵심)
robocopy "$SOURCE\frontend\src" "$Target\frontend\src" /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null
Write-Host "  - src/ 폴더 완료" -ForegroundColor Gray

# public 폴더 복사
robocopy "$SOURCE\frontend\public" "$Target\frontend\public" /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null
Write-Host "  - public/ 폴더 완료" -ForegroundColor Gray

# 설정 파일들
Copy-Item "$SOURCE\frontend\package.json" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\package-lock.json" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\tsconfig.json" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\next.config.ts" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\postcss.config.mjs" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\eslint.config.mjs" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\.env.example" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\.env.local" "$Target\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\.gitignore" "$Target\frontend\" -ErrorAction SilentlyContinue
Write-Host "  - 설정 파일 완료" -ForegroundColor Gray

# CLAUDE.md 복사
Write-Host "[4/6] 프로젝트 문서 복사 중..." -ForegroundColor Green
Copy-Item "$SOURCE\CLAUDE.md" "$Target\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\DEPLOYMENT_PLAN.md" "$Target\" -ErrorAction SilentlyContinue
Write-Host "  - 문서 파일 완료" -ForegroundColor Gray

# 용량 계산
Write-Host "[5/6] 복사 결과 확인..." -ForegroundColor Green
$backendSize = (Get-ChildItem -Recurse "$Target\backend" | Measure-Object -Property Length -Sum).Sum / 1MB
$frontendSize = (Get-ChildItem -Recurse "$Target\frontend" | Measure-Object -Property Length -Sum).Sum / 1MB
$totalSize = $backendSize + $frontendSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  복사 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "대상 경로: $Target" -ForegroundColor Yellow
Write-Host ""
Write-Host "복사된 용량:" -ForegroundColor White
Write-Host "  - Backend:  $([math]::Round($backendSize, 2)) MB" -ForegroundColor Gray
Write-Host "  - Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor Gray
Write-Host "  - 총계:     $([math]::Round($totalSize, 2)) MB" -ForegroundColor White
Write-Host ""

# 다음 단계 안내
Write-Host "[6/6] 다음 단계:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Backend 설정:" -ForegroundColor Yellow
Write-Host "   cd $Target\backend" -ForegroundColor Gray
Write-Host "   python -m venv venv" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Frontend 설정:" -ForegroundColor Yellow
Write-Host "   cd $Target\frontend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run dev -- -p 3001" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 테스트:" -ForegroundColor Yellow
Write-Host "   Backend API: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "   Frontend:    http://localhost:3001" -ForegroundColor Gray
Write-Host ""

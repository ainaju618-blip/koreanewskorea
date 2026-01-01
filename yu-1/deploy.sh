#!/bin/bash
# Yu-1 Project Deployment Script
# Usage: ./deploy.sh [target_path]

SOURCE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-/d/cbt/yu-deploy}"

echo "========================================"
echo "  주역 점술 프로젝트 배포 스크립트"
echo "========================================"
echo ""
echo "소스: $SOURCE"
echo "대상: $TARGET"
echo ""

read -p "진행하시겠습니까? (Y/N): " confirm
if [[ "$confirm" != "Y" && "$confirm" != "y" ]]; then
    echo "취소되었습니다."
    exit 1
fi

# 대상 폴더 확인
if [ -d "$TARGET" ]; then
    read -p "대상 폴더가 이미 존재합니다. 덮어쓰시겠습니까? (Y/N): " overwrite
    if [[ "$overwrite" != "Y" && "$overwrite" != "y" ]]; then
        echo "취소되었습니다."
        exit 1
    fi
    rm -rf "$TARGET"
fi

echo ""
echo "[1/6] 대상 폴더 생성..."
mkdir -p "$TARGET/backend"
mkdir -p "$TARGET/frontend"

echo "[2/6] Backend 복사 중..."
# app 폴더 복사 (핵심)
cp -r "$SOURCE/backend/app" "$TARGET/backend/"
echo "  - app/ 폴더 완료"

# alembic 폴더 복사
cp -r "$SOURCE/backend/alembic" "$TARGET/backend/"
echo "  - alembic/ 폴더 완료"

# data 폴더 복사
cp -r "$SOURCE/backend/data" "$TARGET/backend/"
echo "  - data/ 폴더 완료"

# 설정 파일들
cp "$SOURCE/backend/requirements.txt" "$TARGET/backend/" 2>/dev/null || true
cp "$SOURCE/backend/.env.example" "$TARGET/backend/" 2>/dev/null || true
cp "$SOURCE/backend/.env" "$TARGET/backend/" 2>/dev/null || true
cp "$SOURCE/backend/alembic.ini" "$TARGET/backend/" 2>/dev/null || true
echo "  - 설정 파일 완료"

# __pycache__ 제거
find "$TARGET/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "[3/6] Frontend 복사 중..."
# src 폴더 복사 (핵심)
cp -r "$SOURCE/frontend/src" "$TARGET/frontend/"
echo "  - src/ 폴더 완료"

# public 폴더 복사
cp -r "$SOURCE/frontend/public" "$TARGET/frontend/"
echo "  - public/ 폴더 완료"

# 설정 파일들
cp "$SOURCE/frontend/package.json" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/package-lock.json" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/tsconfig.json" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/next.config.ts" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/postcss.config.mjs" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/eslint.config.mjs" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/.env.example" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/.env.local" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/.gitignore" "$TARGET/frontend/" 2>/dev/null || true
echo "  - 설정 파일 완료"

echo "[4/6] 프로젝트 문서 복사 중..."
cp "$SOURCE/CLAUDE.md" "$TARGET/" 2>/dev/null || true
cp "$SOURCE/DEPLOYMENT_PLAN.md" "$TARGET/" 2>/dev/null || true
echo "  - 문서 파일 완료"

echo "[5/6] 복사 결과 확인..."
backend_size=$(du -sm "$TARGET/backend" 2>/dev/null | cut -f1)
frontend_size=$(du -sm "$TARGET/frontend" 2>/dev/null | cut -f1)
total_size=$((backend_size + frontend_size))

echo ""
echo "========================================"
echo "  복사 완료!"
echo "========================================"
echo ""
echo "대상 경로: $TARGET"
echo ""
echo "복사된 용량:"
echo "  - Backend:  ${backend_size} MB"
echo "  - Frontend: ${frontend_size} MB"
echo "  - 총계:     ${total_size} MB"
echo ""

echo "[6/6] 다음 단계:"
echo ""
echo "1. Backend 설정:"
echo "   cd $TARGET/backend"
echo "   python -m venv venv"
echo "   source venv/bin/activate  # Windows: venv\\Scripts\\activate"
echo "   pip install -r requirements.txt"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "2. Frontend 설정:"
echo "   cd $TARGET/frontend"
echo "   npm install"
echo "   npm run dev -- -p 3001"
echo ""
echo "3. 테스트:"
echo "   Backend API: http://localhost:8000/docs"
echo "   Frontend:    http://localhost:3001"
echo ""

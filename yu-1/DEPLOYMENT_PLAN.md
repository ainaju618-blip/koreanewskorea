# 주역 점술 프로젝트 배포 계획

## 1. 프로젝트 개요

| 항목 | 설명 |
|------|------|
| **프로젝트명** | 주역 점술 시스템 (I Ching Divination) |
| **Backend** | FastAPI (Python 3.11+) |
| **Frontend** | Next.js 15 (React 19) |
| **포트** | Backend: 8000, Frontend: 3001 |

---

## 2. 필수 파일 구조 (복사 대상)

### 2.1 Backend (필수)

```
backend/
├── app/                          # 핵심 애플리케이션 코드
│   ├── __init__.py
│   ├── main.py                   # FastAPI 엔트리포인트
│   ├── api/                      # API 라우터
│   │   ├── __init__.py
│   │   ├── divination.py         # 점술 API
│   │   ├── questions.py          # 질문 검색 API
│   │   └── settings.py           # 설정 API
│   ├── core/                     # 설정
│   │   ├── __init__.py
│   │   └── config.py
│   ├── data/                     # 정적 데이터 (매우 중요!)
│   │   ├── category_questions_map.json   # 카테고리별 질문 매핑
│   │   ├── category_seed.py              # 250개 카테고리
│   │   ├── category_vocabulary.py        # 카테고리별 어휘
│   │   ├── daily_fortune_final.py        # 일일 운세 데이터
│   │   ├── fortune_direction.py          # 운세 방향
│   │   ├── hexagram_complete.py          # 64괘 완전 데이터
│   │   ├── hexagram_seed.py              # 64괘 시드
│   │   ├── interpretations_seed.py       # 해석 시드
│   │   ├── interpretation_matrix.py      # 해석 매트릭스
│   │   ├── keywords_index.json           # 키워드 역인덱스
│   │   ├── psychology_patterns.py        # 심리 패턴
│   │   ├── questions_unified.json        # 통합 질문 (9,491개)
│   │   ├── question_direction.py         # 질문 방향
│   │   ├── user_questions_seed.py        # 사용자 질문 시드
│   │   ├── yao_complete.py               # 384효 완전 데이터
│   │   └── yao_direction.py              # 효 방향
│   ├── db/                       # 데이터베이스
│   │   ├── __init__.py
│   │   └── database.py
│   ├── models/                   # 데이터 모델
│   │   ├── __init__.py
│   │   └── hexagram.py
│   ├── repositories/             # 저장소
│   │   ├── __init__.py
│   │   ├── hexagram_repository.py
│   │   └── yao_repository.py
│   ├── services/                 # 비즈니스 로직 (핵심!)
│   │   ├── __init__.py
│   │   ├── category_matcher.py   # 카테고리 매칭
│   │   ├── divination.py         # 점술 서비스
│   │   ├── llm_service.py        # LLM 서비스
│   │   ├── llm_validator.py      # LLM 검증
│   │   ├── oracle_generator.py   # 오라클 생성기 (핵심!)
│   │   ├── rag_pipeline.py       # RAG 파이프라인
│   │   └── rag_service.py        # RAG 서비스
│   └── usecases/                 # 유스케이스
│       ├── __init__.py
│       └── divination_usecase.py
├── data/                         # 런타임 데이터
│   └── site_settings.json        # 사이트 설정
├── alembic/                      # DB 마이그레이션 (선택)
│   ├── env.py
│   └── versions/
│       └── 20241229_1600_001_initial_schema.py
├── alembic.ini                   # Alembic 설정
├── requirements.txt              # Python 의존성
├── .env.example                  # 환경변수 예시
└── .env                          # 환경변수 (복사 후 수정 필요)
```

### 2.2 Frontend (필수)

```
frontend/
├── src/                          # 소스 코드
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # 레이아웃
│   │   ├── page.tsx              # 메인 페이지
│   │   ├── globals.css           # 전역 스타일
│   │   ├── admin/                # 관리자 페이지
│   │   ├── demo/                 # 데모 페이지들
│   │   ├── dice/                 # 주사위 페이지
│   │   ├── divination/           # 점술 결과 페이지
│   │   ├── history/              # 히스토리
│   │   ├── mystical/             # 미스틱 페이지
│   │   └── yijing/               # 주역 페이지
│   ├── components/               # React 컴포넌트
│   │   ├── CategorySelector.tsx
│   │   ├── Dice3D.tsx
│   │   ├── DivinationFlow.tsx
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx       # 메인 영웅 섹션 (핵심!)
│   │   ├── HexagramDisplay.tsx
│   │   ├── HexagramOverlay.tsx
│   │   ├── OctahedronDice.tsx
│   │   ├── PopularQuestions.tsx
│   │   ├── QuestionSearch.tsx
│   │   ├── QuestionSuggestion.tsx
│   │   ├── QuickCategory.tsx
│   │   ├── ResultCard.tsx
│   │   └── YaoSlider.tsx
│   ├── lib/                      # 유틸리티
│   │   └── api.ts                # API 클라이언트
│   └── types/                    # 타입 정의
│       └── layoutStyles.ts
├── public/                       # 정적 파일
│   ├── icon.svg
│   ├── icon-purple.svg
│   ├── icon-transparent.svg
│   └── videos/                   # 비디오 파일
├── package.json                  # NPM 의존성
├── package-lock.json             # 잠금 파일
├── tsconfig.json                 # TypeScript 설정
├── next.config.ts                # Next.js 설정
├── postcss.config.mjs            # PostCSS 설정
├── eslint.config.mjs             # ESLint 설정
├── .env.example                  # 환경변수 예시
└── .env.local                    # 환경변수 (복사 후 수정 필요)
```

---

## 3. 제외 파일/폴더 (복사하지 않음)

### 3.1 절대 제외 (용량/불필요)

| 경로 | 이유 | 예상 크기 |
|------|------|----------|
| `frontend/node_modules/` | npm install로 재생성 | ~200MB |
| `frontend/.next/` | 빌드 시 재생성 | ~50MB |
| `backend/__pycache__/` | Python 바이트코드 | ~5MB |
| `.git/` | Git 히스토리 | ~10MB |
| `frontend/.git/` | Git 히스토리 | ~5MB |

### 3.2 제외 권장 (개발용)

| 경로 | 이유 |
|------|------|
| `_archive/` | 이전 백업 파일들 |
| `_backup/` | 백업 파일들 |
| `data/` | 루트의 옛 데이터 (backend/app/data에 통합됨) |
| `docs/` | 개발 문서 (선택적) |
| `.claude/` | Claude 설정 |
| `.playwright-mcp/` | Playwright 설정 |
| `*.txt` (루트) | 질문 원본 파일 (JSON으로 통합됨) |

### 3.3 제외 권장 (테스트/임시)

| 경로 | 이유 |
|------|------|
| `backend/tests/` | 테스트 파일들 |
| `backend/test_*.py` | 테스트 스크립트 |
| `backend/*_result.json` | 테스트 결과 |
| `backend/yao_export.json` | 내보내기 파일 |
| `frontend/tsconfig.tsbuildinfo` | 빌드 캐시 |
| `nul` | 빈 파일 |

### 3.4 제외 권장 (문서/계획)

| 경로 | 이유 |
|------|------|
| `PLANNING.md` | 개발 계획 |
| `OPTIMIZATION_PLAN.md` | 최적화 계획 |
| `REVENUE_ENHANCEMENT_PLAN.md` | 수익화 계획 |
| `README.md` (루트) | 개발용 README |

---

## 4. 복사 명령어

### 4.1 PowerShell 스크립트 (권장)

```powershell
# 대상 경로 설정
$SOURCE = "D:\cbt\yu-1"
$TARGET = "D:\cbt\yu-deploy"  # 원하는 경로로 변경

# 대상 폴더 생성
New-Item -ItemType Directory -Force -Path $TARGET

# Backend 복사
$backendExclude = @(
    "__pycache__",
    "tests",
    "test_*.py",
    "*_result.json",
    "yao_export.json",
    "pytest.ini"
)
robocopy "$SOURCE\backend\app" "$TARGET\backend\app" /E /XD __pycache__
Copy-Item "$SOURCE\backend\requirements.txt" "$TARGET\backend\"
Copy-Item "$SOURCE\backend\.env.example" "$TARGET\backend\"
Copy-Item "$SOURCE\backend\.env" "$TARGET\backend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\backend\alembic.ini" "$TARGET\backend\"
robocopy "$SOURCE\backend\alembic" "$TARGET\backend\alembic" /E /XD __pycache__
robocopy "$SOURCE\backend\data" "$TARGET\backend\data" /E

# Frontend 복사
robocopy "$SOURCE\frontend\src" "$TARGET\frontend\src" /E
robocopy "$SOURCE\frontend\public" "$TARGET\frontend\public" /E
Copy-Item "$SOURCE\frontend\package.json" "$TARGET\frontend\"
Copy-Item "$SOURCE\frontend\package-lock.json" "$TARGET\frontend\"
Copy-Item "$SOURCE\frontend\tsconfig.json" "$TARGET\frontend\"
Copy-Item "$SOURCE\frontend\next.config.ts" "$TARGET\frontend\"
Copy-Item "$SOURCE\frontend\postcss.config.mjs" "$TARGET\frontend\"
Copy-Item "$SOURCE\frontend\eslint.config.mjs" "$TARGET\frontend\"
Copy-Item "$SOURCE\frontend\.env.example" "$TARGET\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\.env.local" "$TARGET\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$SOURCE\frontend\.gitignore" "$TARGET\frontend\"

# CLAUDE.md 복사 (선택)
Copy-Item "$SOURCE\CLAUDE.md" "$TARGET\"

Write-Host "복사 완료! 대상: $TARGET"
```

### 4.2 Bash 스크립트 (Git Bash/WSL)

```bash
#!/bin/bash
SOURCE="/d/cbt/yu-1"
TARGET="/d/cbt/yu-deploy"

mkdir -p "$TARGET"

# Backend
mkdir -p "$TARGET/backend"
cp -r "$SOURCE/backend/app" "$TARGET/backend/"
cp "$SOURCE/backend/requirements.txt" "$TARGET/backend/"
cp "$SOURCE/backend/.env.example" "$TARGET/backend/"
cp "$SOURCE/backend/.env" "$TARGET/backend/" 2>/dev/null || true
cp "$SOURCE/backend/alembic.ini" "$TARGET/backend/"
cp -r "$SOURCE/backend/alembic" "$TARGET/backend/"
cp -r "$SOURCE/backend/data" "$TARGET/backend/"
find "$TARGET/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# Frontend
mkdir -p "$TARGET/frontend"
cp -r "$SOURCE/frontend/src" "$TARGET/frontend/"
cp -r "$SOURCE/frontend/public" "$TARGET/frontend/"
cp "$SOURCE/frontend/package.json" "$TARGET/frontend/"
cp "$SOURCE/frontend/package-lock.json" "$TARGET/frontend/"
cp "$SOURCE/frontend/tsconfig.json" "$TARGET/frontend/"
cp "$SOURCE/frontend/next.config.ts" "$TARGET/frontend/"
cp "$SOURCE/frontend/postcss.config.mjs" "$TARGET/frontend/"
cp "$SOURCE/frontend/eslint.config.mjs" "$TARGET/frontend/"
cp "$SOURCE/frontend/.env.example" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/.env.local" "$TARGET/frontend/" 2>/dev/null || true
cp "$SOURCE/frontend/.gitignore" "$TARGET/frontend/"

# CLAUDE.md (선택)
cp "$SOURCE/CLAUDE.md" "$TARGET/"

echo "복사 완료! 대상: $TARGET"
```

---

## 5. 복사 후 설정

### 5.1 Backend 설정

```bash
cd [TARGET]/backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 파일 확인/수정)
# OPENAI_API_KEY=your_key_here

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 5.2 Frontend 설정

```bash
cd [TARGET]/frontend

# 의존성 설치
npm install

# 환경변수 설정 (.env.local 확인/수정)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 개발 서버 실행
npm run dev -- -p 3001
```

---

## 6. 예상 용량

| 항목 | 크기 |
|------|------|
| Backend (app + data) | ~5MB |
| Frontend (src + public) | ~2MB |
| **총 복사 크기** | **~7MB** |
| npm install 후 | +200MB |
| pip install 후 | +150MB |

---

## 7. 체크리스트

### 복사 전
- [ ] 대상 경로 확인 및 여유 공간 확보
- [ ] 현재 서버 중지 (포트 충돌 방지)

### 복사 후
- [ ] Backend `.env` 파일 API 키 확인
- [ ] Frontend `.env.local` 파일 API URL 확인
- [ ] `pip install -r requirements.txt` 실행
- [ ] `npm install` 실행
- [ ] Backend 서버 시작 및 `/docs` 접속 테스트
- [ ] Frontend 서버 시작 및 메인 페이지 테스트
- [ ] 질문 입력 → 점괘 결과 테스트

---

## 8. 문제 해결

### 포트 충돌
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID [PID] /F

# Linux/Mac
lsof -i :8000
kill -9 [PID]
```

### 모듈 없음 오류
```bash
# Backend
pip install [missing_module]

# Frontend
npm install [missing_module]
```

### CORS 오류
Backend의 `app/main.py`에서 CORS 설정 확인:
```python
origins = [
    "http://localhost:3001",
    "http://localhost:3000",
    # 새 도메인 추가
]
```

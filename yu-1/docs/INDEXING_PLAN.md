# 프로젝트 인덱싱 계획서

> 목표: 어떤 개발자가 와도 5분 내에 프로젝트 구조를 파악할 수 있는 체계적 문서화

---

## 0. 전체 폴더 현황

### 📊 인덱싱 대상 폴더 (42개 중 25개 필수)

```
yu-1/                           # ✅ README.md (업데이트)
├── backend/                    # ✅ README.md
│   ├── alembic/               # ✅ README.md (DB 마이그레이션)
│   ├── app/
│   │   ├── api/               # ✅ README.md (API 엔드포인트)
│   │   ├── core/              # ✅ README.md (설정)
│   │   ├── data/              # ✅ README.md (시드 데이터)
│   │   ├── db/                # ✅ README.md (DB 연결)
│   │   ├── models/            # ✅ README.md (ORM 모델)
│   │   ├── repositories/      # ✅ README.md (데이터 접근)
│   │   ├── services/          # ✅ README.md (비즈니스 로직)
│   │   └── usecases/          # ✅ README.md (유스케이스)
│   ├── data/                  # ✅ README.md (JSON/CSV 데이터)
│   ├── scripts/               # ✅ README.md (유틸리티)
│   └── tests/                 # ✅ README.md (테스트)
│
├── frontend/                   # ✅ README.md
│   ├── public/                # ✅ README.md (정적 자산)
│   └── src/
│       ├── app/               # ✅ README.md (페이지 라우팅)
│       ├── components/        # ✅ README.md (컴포넌트)
│       ├── lib/               # ✅ README.md (API 클라이언트)
│       └── types/             # ✅ README.md (타입 정의)
│
├── docs/                       # ✅ INDEX.md (문서 허브)
├── data/                       # ✅ README.md (멀티미디어)
├── _archive/                   # ⚪ README.md (옵션)
└── _backup/                    # ⚪ README.md (옵션)
```

### 📈 커버리지 목표

| 구분 | 폴더 수 | README 필요 |
|------|---------|-------------|
| Root | 1 | 1 |
| Backend | 14 | 13 |
| Frontend | 10 | 6 |
| Docs | 1 | 1 (INDEX.md) |
| Data | 2 | 1 |
| Archive/Backup | 8 | 2 (옵션) |
| **합계** | **36** | **25 (필수) + 2 (옵션)** |

---

## 1. 인덱싱 원칙

### 1.1 3-Layer Documentation
```
Level 1: 루트 README.md     → 프로젝트 전체 개요 (5분 이해)
Level 2: 폴더별 README.md   → 해당 폴더 상세 설명 (3분 이해)
Level 3: 코드 주석/JSDoc    → 함수/클래스 레벨 문서
```

### 1.2 문서 표준 템플릿
```markdown
# 폴더명

> 한 줄 설명

## 📁 구조
(파일/폴더 트리)

## 📋 파일 설명
(각 파일별 역할)

## 🔗 의존성
(다른 폴더/모듈과의 관계)

## 📝 사용 예시
(코드 예시)
```

---

## 2. 생성할 문서 목록 (전체 27개)

### Phase 1: 핵심 인덱스 (5개) - 🔴 P0

| # | 파일 | 목적 |
|---|------|------|
| 1 | `README.md` 업데이트 | 루트 - 전체 아키텍처 |
| 2 | `docs/INDEX.md` | 문서 허브 (모든 문서 링크) |
| 3 | `docs/ARCHITECTURE.md` | 시스템 아키텍처 다이어그램 |
| 4 | `backend/README.md` | 백엔드 진입점 |
| 5 | `frontend/README.md` 재작성 | 프론트엔드 진입점 |

### Phase 2: Backend 폴더 (12개) - 🟡 P1

| # | 파일 | 내용 |
|---|------|------|
| 6 | `backend/alembic/README.md` | DB 마이그레이션 가이드 |
| 7 | `backend/app/api/README.md` | API 엔드포인트 상세 |
| 8 | `backend/app/core/README.md` | 환경변수/설정 |
| 9 | `backend/app/data/README.md` | 시드 데이터 스키마 |
| 10 | `backend/app/db/README.md` | DB 연결 설정 |
| 11 | `backend/app/models/README.md` | ORM 모델 정의 |
| 12 | `backend/app/repositories/README.md` | 데이터 접근 계층 |
| 13 | `backend/app/services/README.md` | 비즈니스 로직 |
| 14 | `backend/app/usecases/README.md` | 유스케이스 패턴 |
| 15 | `backend/data/README.md` | JSON/CSV 데이터 파일 |
| 16 | `backend/scripts/README.md` | 유틸리티 스크립트 |
| 17 | `backend/tests/README.md` | 테스트 가이드 |

### Phase 3: Frontend 폴더 (5개) - 🟡 P1

| # | 파일 | 내용 |
|---|------|------|
| 18 | `frontend/src/app/README.md` | 페이지 라우팅 맵 |
| 19 | `frontend/src/components/README.md` | 컴포넌트 카탈로그 |
| 20 | `frontend/src/lib/README.md` | API 클라이언트 |
| 21 | `frontend/src/types/README.md` | TypeScript 타입 정의 |
| 22 | `frontend/public/README.md` | 정적 자산 목록 |

### Phase 4: 기타 폴더 (3개) - 🟢 P2

| # | 파일 | 내용 |
|---|------|------|
| 23 | `data/README.md` | 멀티미디어 자산 |
| 24 | `_archive/README.md` | 아카이브 스크립트 |
| 25 | `_backup/README.md` | 백업 데이터 설명 |

### Phase 5: 운영 문서 (2개) - ⚪ 옵션

| # | 파일 | 내용 |
|---|------|------|
| 26 | `docs/DEPLOYMENT.md` | 배포 가이드 |
| 27 | `docs/TROUBLESHOOTING.md` | 문제 해결 가이드 |

---

## 3. 문서별 상세 스펙

### 3.1 `README.md` (루트) - 업데이트

```markdown
# 🔮 주역 점술 서비스 (Yu-1)

> AI 기반 주역 64괘 384효 점술 서비스

## 🏗️ 아키텍처 개요
[시스템 다이어그램]

## 📁 프로젝트 구조
yu-1/
├── backend/          → FastAPI 백엔드 [README](backend/README.md)
├── frontend/         → Next.js 프론트엔드 [README](frontend/README.md)
├── docs/             → 프로젝트 문서 [INDEX](docs/INDEX.md)
├── data/             → 멀티미디어 자산
├── _archive/         → 아카이브된 스크립트
└── _backup/          → 백업 데이터

## 🚀 퀵 스타트
(5분 내 실행 가이드)

## 📊 데이터 현황
- 질문 데이터: 9,491개
- 괘(Hexagram): 64개
- 효(Yao): 384개
- 카테고리: 9대분류 + 250소분류

## 📚 문서 링크
- [아키텍처](docs/ARCHITECTURE.md)
- [데이터 인덱스](docs/DATA_INDEX.md)
- [API 레퍼런스](docs/API_REFERENCE.md)

## 🔧 기술 스택
| 영역 | 기술 |
|------|------|
| Backend | FastAPI + SQLAlchemy + PostgreSQL |
| Frontend | Next.js 16 + React 19 + Tailwind CSS |
| AI/ML | Ollama + ChromaDB + RAG |
| 3D | Three.js + React Three Fiber |
```

### 3.2 `docs/INDEX.md` - 문서 허브

```markdown
# 📚 문서 인덱스

## 🏗️ 아키텍처
- [시스템 아키텍처](ARCHITECTURE.md)
- [데이터 플로우](DATA_FLOW.md)

## 📊 데이터
- [데이터 인덱스](DATA_INDEX.md)
- [스키마 정의](SCHEMA.md)

## 🔌 API
- [API 레퍼런스](API_REFERENCE.md)
- [인증/보안](AUTH.md)

## 📝 기획
- [서비스 설계](서비스_설계_v2.md)
- [AI 해석 가이드](AI_해석_가이드라인_v1.md)

## 🛠️ 운영
- [배포 가이드](DEPLOYMENT.md)
- [문제 해결](TROUBLESHOOTING.md)
```

### 3.3 `docs/ARCHITECTURE.md` - 시스템 아키텍처

```markdown
# 🏗️ 시스템 아키텍처

## 1. 전체 구조

┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js 16 (React 19)                              │    │
│  │  ├── pages/ (App Router)                            │    │
│  │  ├── components/ (15개)                             │    │
│  │  └── lib/api.ts (API Client)                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                        SERVER                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FastAPI (Python 3.11+)                             │    │
│  │  ├── api/ (3 routers)                               │    │
│  │  ├── services/ (7 services)                         │    │
│  │  └── repositories/ (2 repos)                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  ChromaDB    │  │  Ollama      │      │
│  │  (데이터)    │  │  (벡터 검색) │  │  (LLM)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘

## 2. 데이터 플로우

[사용자] → [질문 입력] → [카테고리 매칭] → [시초점 알고리즘]
                                               ↓
[결과 표시] ← [LLM 어투 변환] ← [효사 조회] ← [괘/효 결정]

## 3. 핵심 모듈 관계도

divination.py (메인)
    ├── oracle_generator.py (점술 결과 생성)
    ├── category_matcher.py (카테고리 매칭)
    ├── llm_service.py (어투 변환)
    └── rag_service.py (RAG 검색)
```

### 3.4 `backend/README.md`

```markdown
# Backend (FastAPI)

> 주역 점술 서비스 백엔드 API

## 📁 구조

backend/
├── app/
│   ├── api/              # API 엔드포인트 [상세](app/api/README.md)
│   │   ├── divination.py # 점술 API
│   │   ├── questions.py  # 질문 API
│   │   └── settings.py   # 설정 API
│   │
│   ├── services/         # 비즈니스 로직 [상세](app/services/README.md)
│   │   ├── divination.py # 시초점 알고리즘
│   │   ├── llm_service.py# LLM 어투 변환
│   │   └── ...
│   │
│   ├── data/             # 시드 데이터 [상세](app/data/README.md)
│   │   ├── hexagram_*.py # 64괘 데이터
│   │   ├── yao_*.py      # 384효 데이터
│   │   └── category_*.py # 250카테고리
│   │
│   └── main.py           # 앱 진입점
│
├── scripts/              # 유틸리티 스크립트
├── tests/                # 테스트
└── requirements.txt      # 의존성

## 🚀 실행

cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

## 📊 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/divination/cast | 점술 수행 |
| GET | /api/divination/today | 오늘의 운세 |
| GET | /api/divination/categories | 카테고리 목록 |
| GET | /api/questions/search | 질문 검색 |

→ 전체 API: http://localhost:8000/docs
```

### 3.5 `frontend/README.md` (재작성)

```markdown
# Frontend (Next.js)

> 주역 점술 서비스 프론트엔드

## 📁 구조

frontend/src/
├── app/                  # 페이지 (App Router) [상세](src/app/README.md)
│   ├── page.tsx         # 홈 (일간운세)
│   ├── divination/      # 점술 페이지
│   ├── history/         # 히스토리
│   └── admin/           # 관리자
│
├── components/           # 컴포넌트 [상세](src/components/README.md)
│   ├── HeroSection.tsx  # 히어로 (일간운세)
│   ├── DivinationFlow.tsx # 점술 플로우
│   ├── Dice3D.tsx       # 3D 주사위
│   └── ...              # (15개)
│
├── lib/
│   └── api.ts           # Backend API 클라이언트
│
└── types/
    └── layoutStyles.ts  # 타입 정의

## 🚀 실행

cd frontend
npm install
npm run dev -- -p 3001

## 🎨 주요 컴포넌트

| 컴포넌트 | 역할 |
|---------|------|
| HeroSection | 일간운세 표시 |
| DivinationFlow | 점술 전체 플로우 |
| CategorySelector | 9대분류 선택 |
| Dice3D | 3D 주사위 애니메이션 |
| ResultCard | 점술 결과 카드 |
```

### 3.6 `backend/app/api/README.md`

```markdown
# API 엔드포인트

## 📁 파일 구조

api/
├── divination.py  # 점술 관련 API
├── questions.py   # 질문 검색 API
└── settings.py    # 설정 API

## 🔌 divination.py

| Endpoint | Method | 설명 |
|----------|--------|------|
| /cast | POST | 점술 수행 |
| /cast-by-question | POST | 질문 기반 자동 점술 |
| /today | GET | 오늘의 운세 |
| /categories | GET | 대분류 목록 |

### Request/Response 예시

POST /api/divination/cast
{
  "divination_type": "iching",
  "period": "daily",
  "main_category": 1,
  "question": "오늘 비트코인 사도 될까요?"
}

Response:
{
  "hexagram_name": "화천대유",
  "yao_position": 6,
  "interpretation": "...",
  "fortune_score": 95
}

## 🔌 questions.py

| Endpoint | Method | 설명 |
|----------|--------|------|
| /search | GET | 키워드 검색 |
| /category/{id} | GET | 카테고리별 질문 |
| /popular | GET | 인기 질문 |
| /suggest | GET | 자동 완성 |
```

### 3.7 `backend/app/services/README.md`

```markdown
# Services (비즈니스 로직)

## 📁 파일 구조

services/
├── divination.py       # 메인 점술 로직
├── oracle_generator.py # 점술 결과 생성
├── llm_service.py      # LLM 어투 변환 (Ollama)
├── llm_validator.py    # LLM 응답 검증
├── category_matcher.py # 카테고리 자동 매칭
├── rag_service.py      # RAG 검색
└── rag_pipeline.py     # RAG 파이프라인

## 🔄 서비스 플로우

1. divination.py
   - 시초점 알고리즘 실행
   - 괘/효 번호 결정

2. oracle_generator.py
   - 효사 데이터 조회
   - 기본 해석 생성

3. category_matcher.py
   - 질문 → 카테고리 자동 매칭
   - 키워드 기반 + LLM 보조

4. llm_service.py
   - 고정 데이터 + 어투만 변환
   - 환각 리스크 90% 감소

## 🧩 의존성 관계

divination.py
    ↓
oracle_generator.py
    ↓
┌───────────────────┐
│ category_matcher  │ ← rag_service.py
│ llm_service.py    │
└───────────────────┘
```

### 3.8 `backend/app/data/README.md`

```markdown
# Data (시드 데이터)

## 📁 파일 구조

data/
├── hexagram_complete.py    # 64괘 완전 데이터 (2.3MB)
├── yao_complete.py         # 384효 완전 데이터 (7.3MB)
├── category_seed.py        # 250개 카테고리 (1.4MB)
├── interpretations_seed.py # 카테고리별 해석 (1.2MB)
├── daily_fortune_final.py  # 일일운세 (1.6MB)
├── fortune_direction.py    # 길흉 방향
├── yao_direction.py        # 효사 방향
├── question_direction.py   # 질문 방향
├── psychology_patterns.py  # 심리 패턴
└── user_questions_seed.py  # 사용자 질문 샘플

## 📊 데이터 스키마

### hexagram_complete.py
HEXAGRAMS = {
  1: {
    "name_kr": "건",
    "name_hanja": "乾",
    "name_full": "건위천",
    "symbol": ["☰", "☰"],
    "meaning": "...",
    "image": "..."
  },
  ...
}

### yao_complete.py
YAOS = {
  (1, 1): {  # (괘번호, 효위치)
    "name": "초구",
    "text_hanja": "潛龍勿用",
    "text_kr": "잠긴 용이니 쓰지 말라",
    "interpretation": "...",
    "fortune_score": 50
  },
  ...
}

### category_seed.py
CATEGORIES = [
  {
    "id": 1,
    "name": "재물",
    "icon": "💰",
    "sub_categories": [
      {"id": 101, "name": "재물운", "keywords": ["돈", "수입", ...]},
      {"id": 102, "name": "투자", "keywords": ["주식", "코인", ...]},
      ...
    ]
  },
  ...
]

## 🔢 통계

| 데이터 | 개수 |
|--------|------|
| 괘 (Hexagram) | 64개 |
| 효 (Yao) | 384개 (64×6) |
| 대분류 | 9개 |
| 소분류 | 250개 |
| 질문 | 9,491개 |
| 키워드 | 9,975개 |
```

### 3.9 `frontend/src/components/README.md`

```markdown
# Components (React 컴포넌트)

## 📁 파일 구조 (15개)

components/
├── Header.tsx              # 헤더 네비게이션
├── HeroSection.tsx         # 히어로 (일간운세)
├── CategorySelector.tsx    # 9대분류 선택
├── QuestionSearch.tsx      # 질문 검색
├── QuestionSuggestion.tsx  # AI 질문 추천
├── QuickCategory.tsx       # 빠른 카테고리
├── PopularQuestions.tsx    # 인기 질문
├── DivinationFlow.tsx      # 점술 전체 플로우
├── Dice3D.tsx              # 3D 주사위
├── OctahedronDice.tsx      # 8면체 주사위
├── YaoSlider.tsx           # 효 슬라이더
├── ResultCard.tsx          # 결과 카드
└── ...

## 🎨 컴포넌트 카탈로그

### 메인 화면
| 컴포넌트 | Props | 설명 |
|---------|-------|------|
| HeroSection | style | 일간운세 + 괘 표시 |
| QuickCategory | onSelect | 카테고리 퀵버튼 |
| PopularQuestions | category | 인기 질문 목록 |

### 점술 플로우
| 컴포넌트 | Props | 설명 |
|---------|-------|------|
| CategorySelector | categories, onSelect | 대분류 9개 그리드 |
| QuestionSearch | onSearch | 질문 검색/입력 |
| DivinationFlow | question, category | 점술 전체 플로우 |

### 3D/비주얼
| 컴포넌트 | Props | 설명 |
|---------|-------|------|
| Dice3D | onRoll | 3D 육면체 주사위 |
| OctahedronDice | value | 8면체 (1-6) |
| YaoSlider | yaoIndex | 효 시각화 슬라이더 |

### 결과 표시
| 컴포넌트 | Props | 설명 |
|---------|-------|------|
| ResultCard | result | 점술 결과 카드 |

## 🔗 컴포넌트 관계도

page.tsx (홈)
├── Header
├── HeroSection ─────────── API: /api/divination/today
├── QuickCategory
└── PopularQuestions

divination/page.tsx
├── CategorySelector
├── QuestionSearch
└── DivinationFlow
    ├── Dice3D
    ├── OctahedronDice
    └── ResultCard ─────── API: /api/divination/cast
```

### 3.10 `frontend/src/app/README.md`

```markdown
# App Router (페이지)

## 📁 라우팅 구조

app/
├── layout.tsx           # 루트 레이아웃
├── globals.css          # 전역 스타일
├── page.tsx             # / (홈)
│
├── divination/
│   ├── page.tsx         # /divination (점술 메인)
│   └── result/
│       └── [id]/
│           └── page.tsx # /divination/result/:id
│
├── dice/
│   └── page.tsx         # /dice (주사위 테스트)
│
├── yijing/
│   └── page.tsx         # /yijing (주역 정보)
│
├── mystical/
│   └── page.tsx         # /mystical (신비 콘텐츠)
│
├── history/
│   └── page.tsx         # /history (점술 기록)
│
├── icon-preview/
│   └── page.tsx         # /icon-preview (아이콘 미리보기)
│
└── admin/
    └── page.tsx         # /admin (관리자)

## 🗺️ 페이지 맵

| 경로 | 페이지 | 설명 |
|------|--------|------|
| / | 홈 | 일간운세 + 퀵메뉴 |
| /divination | 점술 | 카테고리 → 질문 → 결과 |
| /divination/result/:id | 결과 상세 | 점술 결과 상세 |
| /history | 히스토리 | 과거 점술 기록 |
| /admin | 관리자 | 데이터 관리 |

## 🔄 사용자 플로우

[홈] → [점술] → [카테고리 선택] → [질문 입력] → [결과]
  │                                               │
  └───────────────── [히스토리] ←─────────────────┘
```

### 3.11 `backend/alembic/README.md`

```markdown
# Alembic (DB 마이그레이션)

> SQLAlchemy 기반 데이터베이스 마이그레이션 도구

## 📁 구조

alembic/
├── env.py              # 마이그레이션 환경 설정
├── versions/           # 마이그레이션 버전 파일
│   └── 20241229_*.py  # 초기 스키마
└── alembic.ini        # (상위 폴더)

## 🚀 주요 명령어

# 마이그레이션 생성
alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1

## 📋 현재 마이그레이션

| 버전 | 날짜 | 설명 |
|------|------|------|
| 001 | 2024-12-29 | 초기 스키마 (hexagrams, yaos, categories) |
```

### 3.12 `backend/app/core/README.md`

```markdown
# Core (설정)

> 환경변수 및 앱 설정 관리

## 📁 구조

core/
├── __init__.py
└── config.py          # Settings 클래스

## ⚙️ 환경변수 (config.py)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| DATABASE_URL | PostgreSQL 연결 | sqlite:///./test.db |
| OLLAMA_BASE_URL | Ollama API | http://localhost:11434 |
| OLLAMA_MODEL | LLM 모델 | qwen2.5:7b |
| CHROMA_PERSIST_DIR | ChromaDB 경로 | ./chroma_db |
| DEBUG | 디버그 모드 | True |

## 📝 사용 예시

from app.core.config import settings
print(settings.DATABASE_URL)
```

### 3.13 `backend/app/db/README.md`

```markdown
# DB (데이터베이스)

> SQLAlchemy 연결 및 세션 관리

## 📁 구조

db/
├── __init__.py
└── database.py        # 엔진/세션 설정

## 🔌 주요 객체

| 객체 | 설명 |
|------|------|
| engine | SQLAlchemy 엔진 |
| SessionLocal | 세션 팩토리 |
| Base | 선언적 베이스 |
| get_db() | 의존성 주입용 세션 |

## 📝 사용 예시

from app.db.database import get_db

@app.get("/items")
def get_items(db: Session = Depends(get_db)):
    return db.query(Item).all()
```

### 3.14 `backend/app/models/README.md`

```markdown
# Models (ORM 모델)

> SQLAlchemy ORM 모델 정의

## 📁 구조

models/
├── __init__.py
└── hexagram.py        # 괘/효 모델

## 📊 모델 정의

### Hexagram (괘)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer | PK (1-64) |
| name_kr | String | 한글명 |
| name_hanja | String | 한자명 |
| symbol | String | 괘상 기호 |

### Yao (효)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer | PK |
| hexagram_id | FK | 괘 참조 |
| position | Integer | 효 위치 (1-6) |
| text_kr | Text | 효사 한글 |
| fortune_score | Integer | 길흉 점수 |
```

### 3.15 `backend/app/repositories/README.md`

```markdown
# Repositories (데이터 접근)

> Repository 패턴 기반 데이터 접근 계층

## 📁 구조

repositories/
├── __init__.py
├── hexagram_repository.py  # 괘 저장소
└── yao_repository.py       # 효 저장소

## 🔧 주요 메서드

### HexagramRepository
| 메서드 | 설명 |
|--------|------|
| get_by_id(id) | ID로 괘 조회 |
| get_all() | 전체 괘 조회 |
| get_by_name(name) | 이름으로 검색 |

### YaoRepository
| 메서드 | 설명 |
|--------|------|
| get_by_hexagram_and_position(hex_id, pos) | 특정 효 조회 |
| get_all_by_hexagram(hex_id) | 괘의 6효 조회 |
```

### 3.16 `backend/app/usecases/README.md`

```markdown
# Usecases (유스케이스)

> Clean Architecture 유스케이스 패턴

## 📁 구조

usecases/
├── __init__.py
└── divination_usecase.py  # 점술 유스케이스

## 🔄 유스케이스 플로우

DivinationUsecase
    ↓
1. 질문 분석 (category_matcher)
2. 괘/효 생성 (divination_service)
3. 해석 생성 (oracle_generator)
4. 어투 변환 (llm_service)
    ↓
DivinationResult

## 📝 메서드

| 메서드 | 설명 |
|--------|------|
| execute(question, category) | 점술 수행 |
| get_daily_fortune() | 오늘의 운세 |
```

### 3.17 `backend/data/README.md`

```markdown
# Data (데이터 파일)

> JSON, CSV 등 대용량 데이터 파일

## 📁 구조

data/
├── questions_unified.json     # 9,491개 질문 통합
├── keywords_index.json        # 키워드 역인덱스
├── category_questions_map.json # 카테고리별 매핑
└── yao_export.json            # 효 데이터 JSON

## 📊 파일별 용량

| 파일 | 용량 | 항목 수 |
|------|------|---------|
| questions_unified.json | ~1.5MB | 9,491개 |
| keywords_index.json | ~500KB | 9,975개 |
| yao_export.json | 157KB | 384개 |

## 🔗 관련 스크립트

- scripts/parse_questions.py → questions_unified.json 생성
- scripts/build_index.py → keywords_index.json 생성
```

### 3.18 `backend/scripts/README.md`

```markdown
# Scripts (유틸리티)

> 데이터 처리 및 유틸리티 스크립트

## 📁 구조

scripts/
├── parse_questions.py         # TXT → JSON 변환
├── build_index.py             # 키워드 인덱스 생성
└── generate_daily_fortune.py  # 일일운세 생성

## 🚀 실행 방법

# 질문 파싱
python scripts/parse_questions.py

# 인덱스 생성
python scripts/build_index.py

## 📝 스크립트 설명

| 스크립트 | 입력 | 출력 |
|---------|------|------|
| parse_questions.py | *.txt (19개) | questions_unified.json |
| build_index.py | questions_unified.json | keywords_index.json |
```

### 3.19 `backend/tests/README.md`

```markdown
# Tests (테스트)

> Pytest 기반 테스트 스위트

## 📁 구조

tests/
├── __init__.py
├── conftest.py                    # Pytest 설정/픽스처
├── test_api_endpoints.py          # API 테스트
├── test_category_matcher.py       # 카테고리 매칭 테스트
├── test_divination.py             # 점술 알고리즘 테스트
├── test_interpretations.py        # 해석 테스트
├── test_probability_distribution.py # 확률 분포 테스트
└── test_rag_matching.py           # RAG 매칭 테스트

## 🚀 실행 방법

# 전체 테스트
pytest

# 특정 파일
pytest tests/test_divination.py

# 커버리지
pytest --cov=app

## 📊 테스트 현황

| 파일 | 테스트 수 | 설명 |
|------|----------|------|
| test_divination.py | 5 | 시초점 알고리즘 |
| test_category_matcher.py | 8 | 카테고리 매칭 |
| test_api_endpoints.py | 10 | API 엔드포인트 |
```

### 3.20 `frontend/src/lib/README.md`

```markdown
# Lib (유틸리티)

> API 클라이언트 및 유틸리티 함수

## 📁 구조

lib/
└── api.ts             # Backend API 클라이언트

## 🔌 API 클라이언트 (api.ts)

| 함수 | 엔드포인트 | 설명 |
|------|-----------|------|
| castDivination() | POST /cast | 점술 수행 |
| getTodayFortune() | GET /today | 오늘의 운세 |
| getCategories() | GET /categories | 카테고리 목록 |
| searchQuestions() | GET /questions/search | 질문 검색 |

## 📝 사용 예시

import { castDivination, getTodayFortune } from '@/lib/api';

const result = await castDivination({
  question: "오늘 운세는?",
  category: 1
});
```

### 3.21 `frontend/src/types/README.md`

```markdown
# Types (타입 정의)

> TypeScript 타입/인터페이스 정의

## 📁 구조

types/
└── layoutStyles.ts    # 레이아웃 스타일 타입

## 📊 주요 타입

### DivinationResult
| 필드 | 타입 | 설명 |
|------|------|------|
| hexagram_name | string | 괘 이름 |
| hexagram_symbol | string[] | 괘상 기호 |
| yao_position | number | 효 위치 (1-6) |
| text_kr | string | 효사 |
| interpretation | string | 해석 |
| fortune_score | number | 길흉 점수 |

### Category
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 카테고리 ID |
| name | string | 카테고리명 |
| icon | string | 이모지 아이콘 |
```

### 3.22 `frontend/public/README.md`

```markdown
# Public (정적 자산)

> 정적 파일 (이미지, 비디오, 폰트)

## 📁 구조

public/
└── videos/            # 비디오 파일
    └── *.mp4         # 배경 비디오 등

## 📊 자산 목록

| 파일 | 타입 | 설명 |
|------|------|------|
| videos/*.mp4 | 비디오 | 배경 애니메이션 |

## 📝 사용 방법

// Next.js에서 정적 파일 참조
<video src="/videos/background.mp4" />
<img src="/images/logo.png" />
```

### 3.23 `data/README.md`

```markdown
# Data (멀티미디어)

> 프로젝트 멀티미디어 자산

## 📁 구조

data/
└── image/             # 이미지 및 비디오
    ├── *.mp4         # 비디오 파일
    └── *.png         # 이미지 파일

## 📊 자산 목록

| 파일 | 타입 | 설명 |
|------|------|------|
| Ancient_Chinese_Coins_*.mp4 | 비디오 | 동전 애니메이션 |
| Cosmic_Yin_Yang_*.mp4 | 비디오 | 음양 만다라 |
| Gemini_Generated_*.png | 이미지 | AI 생성 이미지 |
```

### 3.24 `_archive/README.md`

```markdown
# Archive (아카이브)

> 더 이상 사용하지 않는 스크립트 보관

## 📁 구조

_archive/
└── scripts/           # 이전 스크립트
    ├── analyze_*.py
    ├── cast_*.py
    ├── generate_*.py
    └── import_*.py

## ⚠️ 주의

이 폴더의 스크립트는 현재 사용하지 않습니다.
참고용으로만 보관되어 있습니다.
```

### 3.25 `_backup/README.md`

```markdown
# Backup (백업)

> 이전 단계 백업 데이터

## 📁 구조

_backup/
├── phase1/            # Phase 1 백업
│   ├── *.mp4, *.tsx
│   └── reference/     # 참고 자료 (PDF)
├── phase2/            # Phase 2 백업
│   ├── backend_data/  # CSV/JSON 데이터
│   ├── category_phrases/ # 카테고리별 문구
│   └── yao_phrases/   # 64괘별 효사
└── phase3/            # Phase 3 백업
    └── questions/     # 질문 데이터

## ⚠️ 주의

복원이 필요한 경우에만 사용하세요.
현재 운영 데이터는 backend/app/data/에 있습니다.
```

---

## 4. 실행 계획 (전체 27개 문서)

### Phase 1: 핵심 (5개) - 예상 1.5시간
```
[ ] 1. README.md 업데이트
[ ] 2. docs/INDEX.md 생성
[ ] 3. docs/ARCHITECTURE.md 생성
[ ] 4. backend/README.md 생성
[ ] 5. frontend/README.md 재작성
```

### Phase 2: Backend (12개) - 예상 2시간
```
[ ] 6.  backend/alembic/README.md
[ ] 7.  backend/app/api/README.md
[ ] 8.  backend/app/core/README.md
[ ] 9.  backend/app/data/README.md
[ ] 10. backend/app/db/README.md
[ ] 11. backend/app/models/README.md
[ ] 12. backend/app/repositories/README.md
[ ] 13. backend/app/services/README.md
[ ] 14. backend/app/usecases/README.md
[ ] 15. backend/data/README.md
[ ] 16. backend/scripts/README.md
[ ] 17. backend/tests/README.md
```

### Phase 3: Frontend (5개) - 예상 1시간
```
[ ] 18. frontend/src/app/README.md
[ ] 19. frontend/src/components/README.md
[ ] 20. frontend/src/lib/README.md
[ ] 21. frontend/src/types/README.md
[ ] 22. frontend/public/README.md
```

### Phase 4: 기타 (3개) - 예상 30분
```
[ ] 23. data/README.md
[ ] 24. _archive/README.md
[ ] 25. _backup/README.md
```

### Phase 5: 운영 (2개) - 옵션
```
[ ] 26. docs/DEPLOYMENT.md
[ ] 27. docs/TROUBLESHOOTING.md
```

### ⏱️ 총 예상 시간: 5시간

---

## 5. 기대 효과

| 지표 | Before | After |
|------|--------|-------|
| 온보딩 시간 | 2-3시간 | 15-30분 |
| 코드 탐색 시간 | 매번 30분+ | 5분 |
| 문서 커버리지 | ~10% | 100% |
| 폴더별 README | 2개 | 27개 |
| 신규 개발자 적응 | 1-2주 | 2-3일 |

---

## 6. 유지보수 규칙

1. **새 폴더 생성 시**: README.md 필수 포함
2. **새 파일 추가 시**: 해당 폴더 README.md 업데이트
3. **API 변경 시**: docs/API_REFERENCE.md 업데이트
4. **분기별**: 전체 문서 검토 및 갱신

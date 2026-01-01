# 주역 점술 서비스 (Yu-1)

> AI 기반 주역 64괘 384효 점술 서비스

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js 16 (React 19)                              │    │
│  │  ├── app/ (App Router)                              │    │
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
```

### 데이터 플로우

```
[사용자] → [질문 입력] → [카테고리 매칭] → [시초점 알고리즘]
                                               ↓
[결과 표시] ← [LLM 어투 변환] ← [효사 조회] ← [괘/효 결정]
```

---

## 프로젝트 구조

```
yu-1/
├── backend/          → FastAPI 백엔드 [README](backend/README.md)
│   ├── app/
│   │   ├── api/      → API 엔드포인트 [README](backend/app/api/README.md)
│   │   ├── core/     → 설정 [README](backend/app/core/README.md)
│   │   ├── data/     → 시드 데이터 [README](backend/app/data/README.md)
│   │   ├── db/       → 데이터베이스 연결 [README](backend/app/db/README.md)
│   │   ├── models/   → ORM 모델 [README](backend/app/models/README.md)
│   │   ├── repositories/ → 데이터 접근 계층
│   │   ├── services/ → 비즈니스 로직 [README](backend/app/services/README.md)
│   │   └── usecases/ → 유스케이스
│   ├── alembic/      → DB 마이그레이션
│   ├── scripts/      → 유틸리티 스크립트
│   └── tests/        → 테스트
│
├── frontend/         → Next.js 프론트엔드 [README](frontend/README.md)
│   ├── public/       → 정적 자산
│   └── src/
│       ├── app/      → 페이지 라우팅
│       ├── components/ → React 컴포넌트
│       ├── lib/      → API 클라이언트
│       └── types/    → 타입 정의
│
├── docs/             → 프로젝트 문서 [INDEX](docs/INDEX.md)
├── data/             → 멀티미디어 자산
├── _archive/         → 아카이브된 스크립트
└── _backup/          → 백업 데이터
```

---

## 퀵 스타트

### 1. 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL (선택)
- Ollama + Qwen2.5:7b (선택, LLM 어투 변환용)

### 2. Backend 실행

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (포트 8000)
uvicorn app.main:app --reload --port 8000
```

API 문서: http://localhost:8000/docs

### 3. Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3001)
npm run dev -- -p 3001
```

Frontend: http://localhost:3001

### 4. (선택) Ollama 설치 및 실행

```bash
# Ollama 설치 후
ollama pull qwen2.5:7b
ollama serve
```

---

## 데이터 현황

| 구분 | 개수 | 설명 |
|------|------|------|
| 질문 데이터 | 9,491개 | 19개 TXT 파일 → JSON 통합 |
| 괘 (Hexagram) | 64개 | 주역 64괘 완전 데이터 |
| 효 (Yao) | 384개 | 64괘 x 6효 |
| 대분류 카테고리 | 9개 | 재물/직업/학업/연애/대인/건강/취미/운명/기타 |
| 소분류 카테고리 | 250개 | 세부 분류 |
| 키워드 인덱스 | 9,975개 | 역인덱스 검색용 |

### 주요 데이터 파일

```
backend/app/data/
├── questions_unified.json      # 통합 질문 데이터 (9,491개)
├── keywords_index.json         # 키워드 역인덱스 (9,975개)
├── category_questions_map.json # 카테고리별 질문 매핑
├── hexagram_complete.py        # 64괘 완전 데이터 (2.3MB)
├── yao_complete.py             # 384효 완전 데이터 (7.3MB)
└── category_seed.py            # 250개 카테고리 (1.4MB)
```

자세한 데이터 스키마: [docs/DATA_INDEX.md](docs/DATA_INDEX.md)

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Backend** | FastAPI | 0.109+ |
| | SQLAlchemy | 2.0+ |
| | PostgreSQL / SQLite | 15+ / 3+ |
| | Pydantic | 2.0+ |
| **Frontend** | Next.js | 16 |
| | React | 19 |
| | Tailwind CSS | 4.0 |
| | TypeScript | 5.0+ |
| **AI/ML** | Ollama (Qwen2.5:7b) | - |
| | ChromaDB | 0.4+ |
| **3D/비주얼** | Three.js | - |
| | React Three Fiber | - |

---

## 문서 링크

| 문서 | 설명 |
|------|------|
| [docs/INDEX.md](docs/INDEX.md) | 전체 문서 허브 |
| [docs/DATA_INDEX.md](docs/DATA_INDEX.md) | 데이터 자산 인덱스 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 아키텍처 상세 |
| [docs/서비스_설계_v2.md](docs/서비스_설계_v2.md) | 서비스 설계 문서 |
| [docs/AI_해석_가이드라인_v1.md](docs/AI_해석_가이드라인_v1.md) | AI 해석 가이드 |
| [PLANNING.md](PLANNING.md) | 상세 기획서 |

---

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/divination/cast` | 점술 수행 (메인) |
| POST | `/api/divination/cast-by-question` | 질문 기반 자동 점술 |
| GET | `/api/divination/today` | 오늘의 운세 |
| GET | `/api/divination/categories` | 대분류 목록 |
| GET | `/api/questions/search` | 질문 검색 |
| GET | `/api/questions/category/{id}` | 카테고리별 질문 |
| GET | `/api/questions/suggest` | 자동 완성 |

### 점 치기 요청 예시

```json
POST /api/divination/cast
{
    "divination_type": "iching",
    "period": "weekly",
    "main_category": 1,
    "question": "이번 주 비트코인 사도 될까요?"
}
```

### 응답 예시

```json
{
    "hexagram": {
        "number": 14,
        "name_kr": "대유",
        "name_hanja": "大有",
        "name_full": "화천대유"
    },
    "yao": {
        "position": 6,
        "name": "상구",
        "text_hanja": "自天祐之 吉无不利",
        "text_kr": "하늘이 스스로 돕나니 길하여 이롭지 않음이 없다"
    },
    "interpretation": "비트코인 매수, 이번 주는 좋은 타이밍!",
    "fortune_score": 95,
    "fortune_category": "대길",
    "keywords": ["천우신조", "대길", "겸손"]
}
```

---

## 핵심 기능

### 1. 시초점 알고리즘 (`backend/app/services/divination.py`)

- 전통 주역 점술 방식 디지털 구현
- 49개 시초로 3번 조작 -> 384효 중 1개 결정
- 변효(變爻) 지원

### 2. LLM 어투 변환 (`backend/app/services/llm_service.py`)

- **핵심**: 384효 고정 데이터 + LLM은 어투만 변환
- 환각(Hallucination) 리스크 90% 감소
- Ollama 없이도 기본 해석 제공

### 3. 카테고리 자동 매칭 (`backend/app/services/category_matcher.py`)

- 9대분류 + 250소분류
- 키워드 기반 자동 매칭
- LLM 보조 분류 (선택)

### 4. 질문 검색 시스템 (`backend/app/api/questions.py`)

- 9,491개 질문 데이터베이스
- 키워드 역인덱스 검색
- 인기 질문 / 자동 완성

---

## 사용자 플로우

```
STEP 0: 점술 선택 (주역/사주/타로/타자)
    ↓
STEP 1: 기간 선택 (일간/주간/월간/연간)
    ↓
STEP 2: 대분류 선택 (9개: 재물/직업/학업/연애...)
    ↓
STEP 3: 질문 입력 (100자 제한)
    ↓
STEP 4: 점 치기 (시초점 알고리즘)
    ↓
STEP 5: 결과 출력 (괘+효사+해석+길흉점수)
```

---

## 데이터 갱신 스크립트

```bash
# 질문 파싱 (TXT -> JSON)
python backend/scripts/parse_questions.py

# 키워드 인덱스 생성
python backend/scripts/build_index.py
```

---

## 확장 계획

1. **사주 (四柱)**: 생년월일시 기반 사주 분석
2. **타로 (Tarot)**: 78장 카드 해석
3. **타자 (12지지)**: 띠별 운세
4. **프리미엄**: 변효 해석, 히스토리 분석

---

## 면책 조항

본 서비스는 오락 및 참고 목적으로 제공됩니다.
투자, 건강, 법률 등 중요한 결정은 전문가와 상담하세요.

---

**Tech Stack**: Next.js 16 + React 19 + FastAPI + PostgreSQL + Ollama (Qwen2.5:7b) + ChromaDB

# Backend (FastAPI)

> 주역 점술 서비스 백엔드 API

## 📁 구조

```
backend/
├── app/
│   ├── api/              # API 엔드포인트 [상세](app/api/README.md)
│   │   ├── divination.py # 점술 API
│   │   ├── questions.py  # 질문 검색 API
│   │   └── settings.py   # 설정 관리 API
│   │
│   ├── services/         # 비즈니스 로직 [상세](app/services/README.md)
│   │   ├── divination.py       # 시초점 알고리즘
│   │   ├── oracle_generator.py # 점술 결과 생성
│   │   ├── llm_service.py      # LLM 어투 변환 (Ollama)
│   │   ├── llm_validator.py    # LLM 응답 검증
│   │   ├── category_matcher.py # 카테고리 자동 매칭
│   │   ├── rag_service.py      # RAG 검색
│   │   └── rag_pipeline.py     # RAG 파이프라인
│   │
│   ├── usecases/         # 유스케이스 [상세](app/usecases/README.md)
│   │   └── divination_usecase.py # 점술 유스케이스
│   │
│   ├── data/             # 시드 데이터 [상세](app/data/README.md)
│   │   ├── hexagram_complete.py    # 64괘 완전 데이터
│   │   ├── yao_complete.py         # 384효 완전 데이터
│   │   ├── category_seed.py        # 250개 카테고리
│   │   ├── interpretations_seed.py # 카테고리별 해석
│   │   ├── daily_fortune_final.py  # 일일운세 데이터
│   │   ├── questions_unified.json  # 9,491개 질문 통합
│   │   ├── keywords_index.json     # 키워드 역인덱스
│   │   └── ...
│   │
│   ├── models/           # ORM 모델 [상세](app/models/README.md)
│   │   └── hexagram.py   # 괘/효 모델
│   │
│   ├── repositories/     # 데이터 접근 [상세](app/repositories/README.md)
│   │   ├── hexagram_repository.py # 괘 저장소
│   │   └── yao_repository.py      # 효 저장소
│   │
│   ├── core/             # 설정 [상세](app/core/README.md)
│   │   └── config.py     # 환경변수/앱 설정
│   │
│   ├── db/               # DB 연결 [상세](app/db/README.md)
│   │   └── database.py   # SQLAlchemy 엔진/세션
│   │
│   └── main.py           # 앱 진입점
│
├── alembic/              # DB 마이그레이션 [상세](alembic/README.md)
│   ├── env.py
│   ├── script.py.mako
│   └── versions/         # 마이그레이션 버전 파일
│
├── scripts/              # 유틸리티 스크립트 [상세](scripts/README.md)
│   ├── parse_questions.py         # TXT → JSON 변환
│   ├── build_index.py             # 키워드 인덱스 생성
│   └── generate_daily_fortune.py  # 일일운세 생성
│
├── tests/                # 테스트 [상세](tests/README.md)
│   ├── conftest.py
│   ├── test_divination.py
│   ├── test_api_endpoints.py
│   ├── test_category_matcher.py
│   └── ...
│
├── data/                 # 런타임 데이터
│   ├── iching.db         # SQLite DB 파일
│   └── site_settings.json
│
├── requirements.txt      # Python 의존성
├── alembic.ini           # Alembic 설정
└── pytest.ini            # Pytest 설정
```

## 🚀 실행 방법

### 1. 가상환경 설정
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일 편집하여 필요한 값 설정
```

### 4. 서버 실행
```bash
uvicorn app.main:app --reload --port 8000
```

### 5. API 문서 확인
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📊 API 엔드포인트 요약

### 점술 API (`/api/divination`)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/cast` | 점술 수행 (메인) |
| POST | `/cast-by-question` | 질문 기반 자동 점술 |
| GET | `/today` | 오늘의 운세 |
| GET | `/categories` | 대분류 목록 (9개) |
| GET | `/sub-categories/{id}` | 소분류 목록 |

### 질문 API (`/api/questions`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/search` | 키워드 검색 |
| GET | `/category/{id}` | 카테고리별 질문 |
| GET | `/random` | 랜덤 질문 |
| GET | `/stats` | 통계 정보 |

### 설정 API (`/api/settings`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 전체 설정 조회 |
| PUT | `/` | 전체 설정 업데이트 |
| GET | `/hero-video` | 히어로 영상 설정 |
| PUT | `/hero-video` | 히어로 영상 변경 |
| GET | `/media/list` | 미디어 파일 목록 |

### 시스템 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 서버 정보 |
| GET | `/health` | 헬스체크 |

> 전체 API 문서: http://localhost:8000/docs

## 📦 의존성 목록

### 웹 프레임워크
| 패키지 | 버전 | 용도 |
|--------|------|------|
| fastapi | 0.109.0 | 웹 프레임워크 |
| uvicorn[standard] | 0.27.0 | ASGI 서버 |
| pydantic | 2.5.3 | 데이터 검증 |
| pydantic-settings | 2.1.0 | 환경변수 설정 |
| python-multipart | 0.0.6 | 파일 업로드 |

### 데이터베이스
| 패키지 | 버전 | 용도 |
|--------|------|------|
| sqlalchemy | 2.0.25 | ORM |
| asyncpg | 0.29.0 | PostgreSQL 비동기 드라이버 |
| psycopg2-binary | 2.9.9 | PostgreSQL 드라이버 |
| alembic | 1.13.1 | DB 마이그레이션 |
| redis | 5.0.1 | 캐싱 |

### AI/ML
| 패키지 | 버전 | 용도 |
|--------|------|------|
| chromadb | 0.4.22 | 벡터 DB (RAG) |
| sentence-transformers | 2.3.1 | 임베딩 생성 |
| openai | 1.10.0 | OpenAI API |

### 유틸리티
| 패키지 | 버전 | 용도 |
|--------|------|------|
| python-dotenv | 1.0.0 | 환경변수 로드 |
| httpx | 0.26.0 | HTTP 클라이언트 |

### 테스트
| 패키지 | 버전 | 용도 |
|--------|------|------|
| pytest | 8.0.0 | 테스트 프레임워크 |
| pytest-asyncio | 0.23.3 | 비동기 테스트 |

## 📊 데이터 현황

| 데이터 | 개수 | 파일 |
|--------|------|------|
| 괘 (Hexagram) | 64개 | `hexagram_complete.py` |
| 효 (Yao) | 384개 | `yao_complete.py` |
| 대분류 | 9개 | `category_seed.py` |
| 소분류 | 250개 | `category_seed.py` |
| 질문 | 9,491개 | `questions_unified.json` |
| 키워드 | 9,975개 | `keywords_index.json` |

## 🧩 아키텍처 (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  API Layer (app/api/)                                        │
│  - HTTP 요청/응답 처리                                        │
│  - Request/Response 모델 정의                                 │
│  - 라우터 등록                                                │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  UseCase Layer (app/usecases/)                               │
│  - 비즈니스 로직 오케스트레이션                               │
│  - 서비스 조합 및 흐름 제어                                   │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (app/services/)                               │
│  - 도메인 로직 구현                                           │
│  - 시초점 알고리즘, LLM 연동                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Repository Layer (app/repositories/)                        │
│  - 데이터 접근 추상화                                         │
│  - CRUD 연산                                                 │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Data Layer                                                  │
│  - app/data/: 정적 시드 데이터 (Python)                       │
│  - backend/data/: 런타임 데이터 (DB, JSON)                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 주요 명령어

### 테스트
```bash
# 전체 테스트
pytest

# 특정 파일 테스트
pytest tests/test_divination.py

# 커버리지 포함
pytest --cov=app
```

### DB 마이그레이션
```bash
# 마이그레이션 생성
alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

### 데이터 갱신
```bash
# 질문 파싱 (TXT → JSON)
python scripts/parse_questions.py

# 키워드 인덱스 생성
python scripts/build_index.py

# 일일운세 생성
python scripts/generate_daily_fortune.py
```

## 🔗 관련 문서

- [전체 아키텍처](../docs/ARCHITECTURE.md)
- [API 레퍼런스](../docs/API_REFERENCE.md)
- [데이터 인덱스](../docs/DATA_INDEX.md)

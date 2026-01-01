# ORM Models Documentation

Backend 데이터 계층의 SQLAlchemy ORM 모델 정의 문서입니다.

---

## 개요

이 프로젝트는 **AsyncIO 기반의 비동기 SQLAlchemy ORM**을 사용하여 다음 4개의 핵심 모델을 정의합니다:

- **Hexagram**: 384효(괘+효) 마스터 테이블
- **Category**: 250개 카테고리 테이블
- **Interpretation**: 효-카테고리별 해석 매핑 테이블
- **UserHistory**: 사용자 질문/선택 로그 테이블

---

## Database Configuration

### 설정 파일
- **데이터베이스 설정**: `app/core/config.py`
- **데이터베이스 연결**: `app/db/database.py`
- **기본 모델**: `app/db/database.py` → `Base = declarative_base()`

### 데이터베이스 초기화

```python
# 엔진 설정 (비동기)
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# 세션 생성
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# DB 초기화
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### 의존성 주입

```python
from app.db.database import get_db

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

## Models

### 1. Hexagram (괘 + 효 마스터 테이블)

**설명**: 64괘 × 6효 = 384개 효전(효전)의 마스터 데이터

**테이블명**: `hexagrams`

**Primary Key**: `id` (String, 복합 형식: "괘번호-효번호", 예: "14-6")

#### 필드 정의

| 필드명 | 타입 | Nullable | 인덱스 | 설명 |
|--------|------|----------|--------|------|
| `id` | String(10) | ❌ | ✅ | PK: "괘번호-효번호" (예: "14-6") |
| `gua_number` | Integer | ❌ | ✅ | 괘번호 (1~64) |
| `gua_name_ko` | String(20) | ❌ | ❌ | 괘명 한글 (예: 건괘, 곤괘) |
| `gua_name_hanja` | String(20) | ❌ | ❌ | 괘명 한자 (예: 乾, 坤) |
| `yao_number` | Integer | ❌ | ❌ | 효번호 (1~6) |
| `yao_position` | String(20) | ❌ | ❌ | 효 위치명 (예: 초효(初九), 상효(上九)) |
| `original_text` | Text | ❌ | ❌ | 효사 한자 원문 |
| `original_meaning` | Text | ❌ | ❌ | 원문 직역 (한글) |
| `direction` | String(10) | ❌ | ❌ | 길흉 판단 (상승/정체/하강) |
| `score` | Integer | ❌ | ❌ | 운세 점수 (0~100) |
| `core_message` | String(200) | ❌ | ❌ | 핵심 한줄 메시지 |
| `caution` | String(200) | ❌ | ❌ | 주의사항 |
| `timing` | String(20) | ❌ | ❌ | 시기 (초반/중반/후반) |
| `keywords` | JSON | ❌ | ❌ | 매칭용 키워드 배열 (예: ["잠재", "인내"]) |
| `image_symbol` | String(200) | ✅ | ❌ | 이미지 생성용 프롬프트 |
| `age_target` | String(20) | ❌ | ❌ | 타겟 연령층 (전연령/MZ/중장년) |
| `priority` | String(10) | ❌ | ❌ | 우선순위 (고/중/저) |
| `created_at` | DateTime | ❌ | ❌ | 생성 일시 (자동 UTC) |
| `updated_at` | DateTime | ❌ | ❌ | 수정 일시 (자동 UTC) |

#### 관계 (Relationships)

```python
interpretations = relationship("Interpretation", back_populates="hexagram")
```

- **Type**: One-to-Many
- **Related Model**: `Interpretation`
- **Description**: 이 효와 연결된 모든 카테고리별 해석

#### 사용 예시

```python
# 효 조회
hexagram = session.query(Hexagram).filter(Hexagram.id == "14-6").first()

# 해석 로드
interpretations = hexagram.interpretations

# 길흉 확인
if hexagram.direction == "상승":
    print(f"길한 운세: {hexagram.core_message}")
```

---

### 2. Category (카테고리 테이블)

**설명**: 250개 카테고리 (9대분류 × 다중 소분류)

**테이블명**: `categories`

**Primary Key**: `id` (Integer, 1~250)

#### 필드 정의

| 필드명 | 타입 | Nullable | 인덱스 | 설명 |
|--------|------|----------|--------|------|
| `id` | Integer | ❌ | ✅ | PK: 카테고리 ID (1~250) |
| `major_id` | Integer | ❌ | ✅ | 대분류 ID (1~9) |
| `major_name` | String(20) | ❌ | ❌ | 대분류명 (예: 재물, 직업, 건강) |
| `major_icon` | String(10) | ❌ | ❌ | 아이콘 (예: 💰, 💼, 🏥) |
| `sub_name` | String(50) | ❌ | ❌ | 소분류명 (예: 주식, 코인, 부동산) |
| `description` | String(200) | ✅ | ❌ | 카테고리 설명 |
| `keywords` | JSON | ❌ | ❌ | 매칭용 키워드 배열 (예: ["비트코인", "BTC"]) |
| `age_target` | String(20) | ❌ | ❌ | 타겟 연령층 (전연령/MZ/중장년) |
| `created_at` | DateTime | ❌ | ❌ | 생성 일시 (자동 UTC) |

#### 관계 (Relationships)

```python
interpretations = relationship("Interpretation", back_populates="category")
```

- **Type**: One-to-Many
- **Related Model**: `Interpretation`
- **Description**: 이 카테고리의 모든 해석

#### 대분류 (9개)

| major_id | major_name | major_icon | 예시 소분류 |
|----------|-----------|-----------|-----------|
| 1 | 재물 | 💰 | 주식, 코인, 부동산, 로또 |
| 2 | 직업 | 💼 | 이직, 승진, 창업, 취업 |
| 3 | 건강 | 🏥 | 질병, 수술, 다이어트, 운동 |
| 4 | 감정 | 💔 | 불안, 우울, 스트레스, 분노 |
| 5 | 관계 | 👥 | 연애, 결혼, 가족, 친구 |
| 6 | 공부 | 📚 | 시험, 자격증, 언어학습, 유학 |
| 7 | 여행 | ✈️ | 여행가기, 이사, 이민, 이동 |
| 8 | 운세 | 🌙 | 총운, 월운, 주운, 일운 |
| 9 | 기타 | 🎲 | 취미, 게임, 기타 |

#### 사용 예시

```python
# 카테고리 조회
category = session.query(Category).filter(Category.id == 1).first()

# 대분류별 조회
categories = session.query(Category).filter(Category.major_id == 1).all()

# 키워드 매칭
import json
keywords = json.loads(category.keywords)
```

---

### 3. Interpretation (효-카테고리별 해석 테이블)

**설명**: 384효 × 250카테고리 × 4기간 = 최대 384,000개 레코드
- 실제로는 필요한 조합만 생성

**테이블명**: `interpretations`

**Primary Key**: `id` (Integer)

**Unique Constraint**: `(hexagram_id, category_id, period)` - 복합 유니크

#### 필드 정의

| 필드명 | 타입 | Nullable | 인덱스 | 설명 |
|--------|------|----------|--------|------|
| `id` | Integer | ❌ | ✅ | PK: 해석 ID |
| `hexagram_id` | String(10) | ❌ | ✅ | FK: Hexagram.id (예: "14-6") |
| `category_id` | Integer | ❌ | ✅ | FK: Category.id |
| `period` | String(20) | ❌ | ❌ | 기간 (daily/weekly/monthly/yearly) |
| `base_text` | Text | ❌ | ❌ | 기본 해석 (LLM 없이 작성 가능) |
| `tone_hint` | String(20) | ❌ | ❌ | 톤 힌트 (단호/위로/현실적/희망적/중립) |
| `created_at` | DateTime | ❌ | ❌ | 생성 일시 (자동 UTC) |
| `updated_at` | DateTime | ❌ | ❌ | 수정 일시 (자동 UTC) |

#### 관계 (Relationships)

```python
hexagram = relationship("Hexagram", back_populates="interpretations")
category = relationship("Category", back_populates="interpretations")
```

- **hexagram**: Many-to-One → `Hexagram`
- **category**: Many-to-One → `Category`

#### Unique Constraint

```python
__table_args__ = (
    UniqueConstraint('hexagram_id', 'category_id', 'period', name='uq_hex_cat_period'),
)
```

같은 효 + 카테고리 + 기간 조합은 **1개만 존재** 가능

#### 사용 예시

```python
# 특정 해석 조회
interpretation = session.query(Interpretation).filter(
    Interpretation.hexagram_id == "14-6",
    Interpretation.category_id == 1,
    Interpretation.period == "daily"
).first()

# 기본 해석 출력
if interpretation:
    print(f"[{interpretation.tone_hint}] {interpretation.base_text}")

# 기간별 해석
interpretations = session.query(Interpretation).filter(
    Interpretation.hexagram_id == "14-6",
    Interpretation.category_id == 1
).all()

for interp in interpretations:
    print(f"{interp.period}: {interp.base_text}")
```

---

### 4. UserHistory (사용자 질문/선택 로그 테이블)

**설명**: 사용자의 질문, 선택, 결과를 기록하는 로그 테이블

**테이블명**: `user_history`

**Primary Key**: `id` (Integer)

#### 필드 정의

| 필드명 | 타입 | Nullable | 인덱스 | 설명 |
|--------|------|----------|--------|------|
| `id` | Integer | ❌ | ✅ | PK: 로그 ID |
| `session_id` | String(100) | ✅ | ✅ | 세션 ID (비회원 추적용) |
| `user_id` | Integer | ✅ | ❌ | FK: 사용자 ID (로그인 사용자) |
| `divination_type` | String(20) | ❌ | ❌ | 점술 유형 (기본: "iching") |
| `period` | String(20) | ✅ | ❌ | 기간 (daily/weekly/monthly/yearly) |
| `category_id` | Integer | ✅ | ❌ | 카테고리 ID (선택한 분야) |
| `question` | Text | ✅ | ❌ | 사용자 입력 질문 |
| `hexagram_id` | String(10) | ✅ | ❌ | 결과 효 ID (예: "14-6") |
| `fortune_score` | Integer | ✅ | ❌ | 결과 점수 (0~100) |
| `interpretation` | Text | ✅ | ❌ | 최종 출력된 해석 텍스트 |
| `created_at` | DateTime | ❌ | ❌ | 생성 일시 (자동 UTC) |
| `ip_address` | String(50) | ✅ | ❌ | 사용자 IP 주소 |
| `user_agent` | String(200) | ✅ | ❌ | 사용자 브라우저 정보 |

#### 사용 예시

```python
# 사용자 히스토리 기록
history = UserHistory(
    session_id="uuid-12345",
    user_id=None,  # 비회원
    divination_type="iching",
    period="daily",
    category_id=1,
    question="주식에 투자해도 될까?",
    hexagram_id="14-6",
    fortune_score=75,
    interpretation="긍정적인 신호입니다...",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)
session.add(history)
await session.commit()

# 사용자별 히스토리 조회
histories = session.query(UserHistory).filter(
    UserHistory.session_id == "uuid-12345"
).all()

# 기간별 통계
from sqlalchemy import func
daily_count = session.query(func.count(UserHistory.id)).filter(
    UserHistory.period == "daily"
).scalar()
```

---

## 모델 간 관계도

```
┌─────────────┐
│  Hexagram   │
│  (384효)    │
└──────┬──────┘
       │ (One-to-Many)
       │ hexagram_id
       │
       ├──────────────┐
       │              │
       │              └─────────────────┐
       │                                │
       ▼                                ▼
┌─────────────┐                 ┌──────────────────┐
│ Interpret.  │◄────────────┤ │   UserHistory    │
│ (해석)      │ (Many-to-One)   │  (사용자 로그)   │
└─────────────┘                 └──────────────────┘
       ▲
       │ (Many-to-One)
       │ category_id
       │
┌──────┴─────┐
│  Category   │
│  (250개)   │
└─────────────┘
```

---

## 생성 및 마이그레이션

### 테이블 자동 생성

```python
# app/db/database.py → init_db()
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### 앱 시작 시 초기화

```python
# main.py
@app.on_event("startup")
async def startup():
    await init_db()
    # 데이터 임포트 등...
```

### 샘플 데이터 로딩

```bash
# 질문 데이터 파싱
python backend/scripts/parse_questions.py

# 키워드 인덱스 생성
python backend/scripts/build_index.py

# 64괘 + 384효 로딩
python backend/scripts/load_hexagrams.py

# 250 카테고리 로딩
python backend/scripts/load_categories.py

# 해석 매트릭스 생성
python backend/scripts/generate_interpretations.py
```

---

## 쿼리 예시

### 1. 질문 기반 검색

```python
# 특정 효 조회
hexagram = session.query(Hexagram).filter(
    Hexagram.id == "14-6"
).first()

# 길한 효만 조회
good_hexagrams = session.query(Hexagram).filter(
    Hexagram.direction.in_(["상승", "대길"])
).all()

# 점수 범위 조회
high_score = session.query(Hexagram).filter(
    Hexagram.score > 80
).all()
```

### 2. 카테고리 검색

```python
# 재물 카테고리 조회
money_categories = session.query(Category).filter(
    Category.major_id == 1
).all()

# 키워드 매칭
categories = session.query(Category).filter(
    Category.keywords.contains(["부동산"])
).all()
```

### 3. 해석 조회

```python
# 특정 카테고리의 일일 해석
interpretation = session.query(Interpretation).filter(
    Interpretation.hexagram_id == "14-6",
    Interpretation.category_id == 1,
    Interpretation.period == "daily"
).first()

# 모든 기간 해석 조회
all_periods = session.query(Interpretation).filter(
    Interpretation.hexagram_id == "14-6",
    Interpretation.category_id == 1
).all()

# 톤별 해석 조회
hopeful_interpretations = session.query(Interpretation).filter(
    Interpretation.tone_hint == "희망적"
).all()
```

### 4. 사용자 히스토리 분석

```python
# 특정 세션의 모든 로그
session_logs = session.query(UserHistory).filter(
    UserHistory.session_id == "uuid-12345"
).all()

# 카테고리별 조회 횟수
from sqlalchemy import func
category_stats = session.query(
    UserHistory.category_id,
    func.count(UserHistory.id).label("count")
).group_by(UserHistory.category_id).all()

# 최근 24시간 활동
from datetime import datetime, timedelta
recent = session.query(UserHistory).filter(
    UserHistory.created_at >= datetime.utcnow() - timedelta(hours=24)
).all()
```

---

## 성능 최적화

### 인덱스 전략

| 테이블 | 인덱싱된 필드 | 용도 |
|--------|-------------|------|
| Hexagram | `id`, `gua_number` | PK 검색, 괘번호 필터링 |
| Category | `id`, `major_id` | PK 검색, 대분류 필터링 |
| Interpretation | `hexagram_id`, `category_id` | FK 검색, 효-카테고리 조인 |
| UserHistory | `id`, `session_id` | PK 검색, 세션 추적 |

### 쿼리 최적화

```python
# 관계 로드 (N+1 문제 해결)
from sqlalchemy.orm import joinedload

hexagrams = session.query(Hexagram).options(
    joinedload(Hexagram.interpretations)
).all()

# 배치 로드
interpretations = session.query(Interpretation).filter(
    Interpretation.hexagram_id.in_(["14-6", "15-1", "16-2"])
).all()
```

---

## 데이터 무결성

### Foreign Key Constraints

```
Interpretation.hexagram_id → Hexagram.id
Interpretation.category_id → Category.id
```

### Unique Constraints

```
Interpretation: (hexagram_id, category_id, period) UNIQUE
```

### NULL 처리

```python
# NOT NULL 필드 (기본값 포함)
- direction = "정체" (기본값)
- score = 50 (기본값)
- period = "daily" (기본값)
- age_target = "전연령" (기본값)
- priority = "중" (기본값)
```

---

## 마이그레이션 가이드

### 기존 테이블 수정

```python
# Alembic 설치 (권장)
pip install alembic

# 초기화
alembic init alembic

# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 적용
alembic upgrade head
```

### 수동 마이그레이션

```python
# app/migrations/versions/xxxxx_update_models.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('hexagrams', sa.Column('new_field', sa.String(50)))

def downgrade():
    op.drop_column('hexagrams', 'new_field')
```

---

## 문제 해결

### 테이블 생성 실패

```python
# 데이터베이스 연결 확인
echo "SELECT 1" | psql $DATABASE_URL

# Base import 확인
from app.models import *  # 모든 모델 import
```

### FK 제약 위반

```python
# Referential Integrity Check
- hexagram_id는 반드시 Hexagram.id에 존재해야 함
- category_id는 반드시 Category.id에 존재해야 함
```

### 유니크 제약 위반

```python
# 중복 검사
existing = session.query(Interpretation).filter(
    Interpretation.hexagram_id == "14-6",
    Interpretation.category_id == 1,
    Interpretation.period == "daily"
).first()

if not existing:
    # 추가 안전
    session.add(new_interpretation)
```

---

## 참고 문헌

- **SQLAlchemy 공식 문서**: https://docs.sqlalchemy.org/
- **AsyncIO ORM**: https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html
- **Hexagram 데이터**: `backend/app/data/hexagram_complete.py`
- **Yao 데이터**: `backend/app/data/yao_complete.py`
- **카테고리 데이터**: `backend/app/data/category_seed.py`

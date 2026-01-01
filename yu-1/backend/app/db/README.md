# DB 연결 설정 가이드

> 주역 AI 운세 서비스의 데이터베이스 연결, 초기화, 세션 관리를 위한 완벽한 가이드

## 📋 목차
- [개요](#개요)
- [주요 객체](#주요-객체)
- [환경 설정](#환경-설정)
- [사용 예시](#사용-예시)
- [데이터 모델](#데이터-모델)
- [마이그레이션](#마이그레이션)
- [트러블슈팅](#트러블슈팅)

---

## 개요

### 아키텍처
```
app/core/config.py (설정)
        ↓
app/db/database.py (연결 및 세션 관리)
        ↓
app/models/* (ORM 모델)
        ↓
app/repositories/* (데이터 접근 계층)
```

### 기술 스택
- **ORM**: SQLAlchemy 2.0+ (AsyncIO 지원)
- **DB Driver**: asyncpg (PostgreSQL 비동기 드라이버)
- **마이그레이션**: Alembic
- **캐싱**: Redis
- **데이터**: PostgreSQL 15+

---

## 주요 객체

### 1. `engine` - 데이터베이스 연결 엔진

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    settings.DATABASE_URL,  # postgresql+asyncpg://user:pass@host:port/db
    echo=settings.DEBUG,    # SQL 쿼리 로그 출력 (개발 모드)
    pool_pre_ping=True,     # 연결 전에 상태 확인
    pool_size=10,           # 기본 연결 풀 크기
    max_overflow=20         # 초과 연결 최대 개수
)
```

**주요 설정**:
- `echo`: 모든 SQL 쿼리 출력 (개발 환경: True, 프로덕션: False)
- `pool_pre_ping`: 오래된 연결 감지 및 제거
- `pool_size`: 메인 풀의 연결 개수 (권장: 5-10)
- `max_overflow`: 풀 크기 초과 시 추가 연결 개수 (권장: 10-20)

### 2. `AsyncSessionLocal` - 비동기 세션 팩토리

```python
from sqlalchemy.ext.asyncio import async_sessionmaker

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,        # 비동기 세션 클래스
    expire_on_commit=False,     # 커밋 후 객체 만료 방지
    autocommit=False,           # 수동 트랜잭션 관리
    autoflush=False             # 수동 플러시 관리
)
```

**각 설정의 의미**:
- `expire_on_commit=False`: 커밋 후에도 객체 상태 유지 (추가 쿼리 방지)
- `autocommit=False`: 자동 커밋 비활성화 (명시적 트랜잭션 관리)
- `autoflush=False`: 자동 플러시 비활성화 (성능 최적화)

### 3. `Base` - 모든 모델의 기본 클래스

```python
from sqlalchemy.orm import declarative_base

Base = declarative_base()
```

모든 ORM 모델이 상속해야 하는 기본 클래스입니다.

```python
# 모델 정의 예
from app.db.database import Base
from sqlalchemy import Column, Integer, String

class MyModel(Base):
    __tablename__ = "my_table"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
```

### 4. `get_db()` - 의존성 주입용 세션 제공자

```python
async def get_db() -> AsyncSession:
    """FastAPI 의존성: 각 요청마다 새로운 세션 생성"""
    async with AsyncSessionLocal() as session:
        try:
            yield session  # 요청 핸들러에 전달
        finally:
            await session.close()  # 요청 완료 후 정리
```

**특징**:
- Context manager로 자동 정리 보장
- 예외 발생 시에도 세션 닫힘
- FastAPI의 `Depends()`와 함께 사용

### 5. `init_db()` - 데이터베이스 초기화

```python
async def init_db():
    """애플리케이션 시작 시 호출하여 모든 테이블 생성"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**역할**:
- 모든 모델 테이블 생성
- 데이터베이스 스키마 초기화
- 중복 생성 시 기존 테이블 유지 (CREATE TABLE IF NOT EXISTS)

---

## 환경 설정

### 설정 파일 구조

**파일**: `app/core/config.py`

```python
class Settings(BaseSettings):
    # 데이터베이스
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/iching_db"
    DATABASE_URL_SYNC: str = "postgresql://postgres:password@localhost:5432/iching_db"

    # Redis (캐싱)
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # ChromaDB (벡터 DB)
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    # API 설정
    MAX_DAILY_FREE_QUERIES: int = 5
    CACHE_TTL: int = 3600  # 1시간
    DEBUG: bool = True
```

### .env 파일 설정

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/iching_db
DATABASE_URL_SYNC=postgresql://postgres:your_password@localhost:5432/iching_db

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_data

# App
DEBUG=True
MAX_DAILY_FREE_QUERIES=5
CACHE_TTL=3600
```

### 로컬 개발 환경 설정

#### PostgreSQL 설치 및 실행 (Docker)

```bash
# PostgreSQL 컨테이너 시작
docker run -d \
  --name iching-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=iching_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# 상태 확인
docker logs iching-postgres

# psql로 접속 (psql이 설치된 경우)
psql -U postgres -h localhost -d iching_db
```

#### Redis 설치 및 실행 (Docker)

```bash
# Redis 컨테이너 시작
docker run -d \
  --name iching-redis \
  -p 6379:6379 \
  redis:7-alpine

# 상태 확인
docker logs iching-redis

# redis-cli로 접속
redis-cli -h localhost -p 6379
```

#### 전체 스택 (Docker Compose)

```bash
# docker-compose.yml 사용
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

---

## 사용 예시

### 1. FastAPI 라우터에서 세션 사용

```python
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.hexagram import Hexagram

app = FastAPI()

@app.get("/hexagrams/{gua_number}")
async def get_hexagram(gua_number: int, db: AsyncSession = Depends(get_db)):
    """특정 괘 조회"""
    result = await db.execute(
        select(Hexagram).where(Hexagram.gua_number == gua_number)
    )
    hexagrams = result.scalars().all()
    return hexagrams
```

### 2. 생성 (CREATE)

```python
from app.models.hexagram import Hexagram
from sqlalchemy import insert

# 단일 레코드 생성
async def create_hexagram(db: AsyncSession, data: dict):
    hexagram = Hexagram(**data)
    db.add(hexagram)
    await db.commit()
    await db.refresh(hexagram)
    return hexagram

# 여러 레코드 생성 (벌크)
async def create_hexagrams_bulk(db: AsyncSession, data_list: list):
    result = await db.execute(insert(Hexagram).values(data_list))
    await db.commit()
    return result.inserted_primary_key
```

### 3. 읽기 (READ)

```python
from sqlalchemy import select

# 단일 레코드 조회
async def get_hexagram_by_id(db: AsyncSession, hex_id: str):
    result = await db.execute(
        select(Hexagram).where(Hexagram.id == hex_id)
    )
    return result.scalar_one_or_none()

# 여러 레코드 조회
async def list_hexagrams(db: AsyncSession, skip: int = 0, limit: int = 10):
    result = await db.execute(
        select(Hexagram).offset(skip).limit(limit)
    )
    return result.scalars().all()

# 조건부 조회
async def get_hexagrams_by_score(db: AsyncSession, min_score: int = 50):
    result = await db.execute(
        select(Hexagram).where(Hexagram.score >= min_score)
    )
    return result.scalars().all()
```

### 4. 수정 (UPDATE)

```python
from sqlalchemy import update

# 단일 레코드 수정
async def update_hexagram(db: AsyncSession, hex_id: str, data: dict):
    hexagram = await get_hexagram_by_id(db, hex_id)
    if hexagram:
        for key, value in data.items():
            setattr(hexagram, key, value)
        await db.commit()
        await db.refresh(hexagram)
    return hexagram

# 여러 레코드 수정 (벌크)
async def update_hexagrams_bulk(db: AsyncSession, hex_ids: list, data: dict):
    result = await db.execute(
        update(Hexagram)
        .where(Hexagram.id.in_(hex_ids))
        .values(**data)
    )
    await db.commit()
    return result.rowcount
```

### 5. 삭제 (DELETE)

```python
from sqlalchemy import delete

# 단일 레코드 삭제
async def delete_hexagram(db: AsyncSession, hex_id: str):
    hexagram = await get_hexagram_by_id(db, hex_id)
    if hexagram:
        await db.delete(hexagram)
        await db.commit()
    return hexagram

# 여러 레코드 삭제
async def delete_hexagrams_bulk(db: AsyncSession, hex_ids: list):
    result = await db.execute(
        delete(Hexagram).where(Hexagram.id.in_(hex_ids))
    )
    await db.commit()
    return result.rowcount
```

### 6. 복잡한 쿼리 (JOIN)

```python
from sqlalchemy import select, join

# 해석과 함께 괘 조회
async def get_hexagram_with_interpretations(db: AsyncSession, hex_id: str):
    from app.models.hexagram import Interpretation

    result = await db.execute(
        select(Hexagram, Interpretation)
        .join(Interpretation)
        .where(Hexagram.id == hex_id)
    )
    return result.all()

# 카테고리별 해석 통계
async def count_interpretations_by_category(db: AsyncSession):
    from sqlalchemy import func
    from app.models.hexagram import Category, Interpretation

    result = await db.execute(
        select(
            Category.major_name,
            func.count(Interpretation.id).label("count")
        )
        .join(Interpretation)
        .group_by(Category.major_name)
    )
    return result.all()
```

### 7. 트랜잭션 관리

```python
# 명시적 트랜잭션
async def transfer_with_transaction(db: AsyncSession):
    try:
        # 여러 작업 수행
        hexagram1 = await create_hexagram(db, {...})
        hexagram2 = await create_hexagram(db, {...})

        # 모두 성공하면 커밋
        await db.commit()
        return [hexagram1, hexagram2]
    except Exception as e:
        # 에러 발생 시 롤백
        await db.rollback()
        raise e

# savepoint 사용
async def complex_operation(db: AsyncSession):
    async with db.begin_nested():
        # 부분 트랜잭션
        result = await create_hexagram(db, {...})

    # 부분 트랜잭션 커밋
    await db.commit()
```

---

## 데이터 모델

### 주요 테이블 구조

#### 1. Hexagram (384효 마스터)

```python
class Hexagram(Base):
    __tablename__ = "hexagrams"

    # PK: "괘번호-효번호" 형식 (예: "14-6")
    id: str                    # "14-6"
    gua_number: int           # 1~64 (괘 번호)
    gua_name_ko: str          # "건괘", "곤괘"...
    gua_name_hanja: str       # "乾", "坤"...
    yao_number: int           # 1~6 (효 번호)
    yao_position: str         # "초효(初九)", "상효(上九)"...
    original_text: str        # 효사 한자 원문
    original_meaning: str     # 직역 (한글)
    direction: str            # "상승" | "정체" | "하강"
    score: int                # 0~100 (길흉 점수)
    core_message: str         # 핵심 한줄 메시지
    caution: str              # 주의사항
    timing: str               # "초반" | "중반" | "후반"
    keywords: list[str]       # ["잠재", "인내", "대기"]
    image_symbol: str         # 이미지 생성용 프롬프트
    age_target: str           # "전연령" | "MZ" | "중장년"
    priority: str             # "고" | "중" | "저"
    created_at: datetime      # 생성 시간
    updated_at: datetime      # 수정 시간
```

#### 2. Category (카테고리)

```python
class Category(Base):
    __tablename__ = "categories"

    id: int                   # 1~250
    major_id: int             # 1~9 (대분류)
    major_name: str           # "재물", "직업"...
    major_icon: str           # "💰", "💼"...
    sub_name: str             # "주식", "코인", "부동산"...
    description: str          # 카테고리 설명
    keywords: list[str]       # ["비트코인", "BTC"]
    age_target: str           # "전연령" | "MZ" | "중장년"
    created_at: datetime      # 생성 시간
```

#### 3. Interpretation (해석)

```python
class Interpretation(Base):
    __tablename__ = "interpretations"

    id: int                   # PK
    hexagram_id: str          # FK -> Hexagram.id ("14-6")
    category_id: int          # FK -> Category.id
    period: str               # "daily" | "weekly" | "monthly" | "yearly"
    base_text: str            # 기본 해석
    tone_hint: str            # "단호" | "위로" | "현실적" | "희망적" | "중립"
    created_at: datetime      # 생성 시간
    updated_at: datetime      # 수정 시간

    # 복합 유니크: (hexagram_id, category_id, period) 조합은 유일
```

#### 4. UserHistory (사용자 로그)

```python
class UserHistory(Base):
    __tablename__ = "user_history"

    id: int                   # PK
    session_id: str           # 세션 ID
    user_id: int | None       # 로그인 사용자 ID
    divination_type: str      # "iching"
    period: str               # "daily", "weekly"...
    category_id: int | None   # 카테고리 ID
    question: str | None      # 사용자 질문
    hexagram_id: str | None   # 결과 괘 ("14-6")
    fortune_score: int | None # 길흉 점수
    interpretation: str | None# 최종 해석
    created_at: datetime      # 생성 시간
    ip_address: str | None    # IP 주소
    user_agent: str | None    # 브라우저 정보
```

---

## 마이그레이션

### Alembic을 이용한 마이그레이션

#### 초기 설정

```bash
# Alembic 초기화 (첫 사용 시)
alembic init alembic

# alembic.ini 수정
sqlalchemy.url = driver://user:password@localhost/dbname
```

#### 마이그레이션 생성

```bash
# 자동 생성 (모델 변경 감지)
alembic revision --autogenerate -m "Add user_history table"

# 수동 생성
alembic revision -m "custom migration"
```

#### 마이그레이션 적용

```bash
# 최신 버전으로 업그레이드
alembic upgrade head

# 특정 버전으로 업그레이드
alembic upgrade ae1027a6acf

# 한 버전 되돌리기
alembic downgrade -1

# 특정 버전으로 다운그레이드
alembic downgrade ae1027a6acf

# 마이그레이션 이력 확인
alembic current
alembic history
```

#### 마이그레이션 파일 예시

```python
# alembic/versions/001_initial.py
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.create_table(
        'hexagrams',
        sa.Column('id', sa.String(10), nullable=False),
        sa.Column('gua_number', sa.Integer(), nullable=False),
        sa.Column('gua_name_ko', sa.String(20), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('hexagrams')
```

---

## 트러블슈팅

### 연결 문제

#### 1. "Connection refused" 에러

```
ERROR: connect() argument after * must be a sequence, not str
또는
could not connect to server: Connection refused
```

**해결책**:
```bash
# PostgreSQL 서버 상태 확인
docker ps | grep postgres

# 서버 시작
docker start iching-postgres

# 또는 새로 시작
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

#### 2. "Invalid password" 에러

```
FATAL: password authentication failed for user "postgres"
```

**해결책**:
```python
# .env 파일의 DATABASE_URL 확인
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/iching_db

# 또는 PostgreSQL에서 사용자 비밀번호 변경
docker exec -it iching-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'new_password';"
```

#### 3. "Database does not exist" 에러

```
FATAL: database "iching_db" does not exist
```

**해결책**:
```bash
# 데이터베이스 생성
docker exec -it iching-postgres createdb -U postgres iching_db

# 또는 psql로 생성
docker exec -it iching-postgres psql -U postgres -c "CREATE DATABASE iching_db;"
```

### 성능 문제

#### 1. 느린 쿼리

```python
# SQL 쿼리 로깅 활성화
from app.core.config import settings
settings.DEBUG = True  # echo=True로 모든 쿼리 출력

# 인덱스 추가
class Hexagram(Base):
    gua_number = Column(Integer, nullable=False, index=True)

# 마이그레이션으로 적용
alembic revision --autogenerate -m "Add indexes"
alembic upgrade head
```

#### 2. 연결 풀 고갈

```python
# 연결 풀 설정 조정
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,        # 기본 크기 증가
    max_overflow=40,     # 초과 연결 증가
    pool_recycle=3600,   # 1시간마다 재활용
)
```

#### 3. 메모리 누수

```python
# 세션이 제대로 정리되는지 확인
@app.get("/test")
async def test(db: AsyncSession = Depends(get_db)):
    # 명시적 세션 정리
    try:
        result = await db.execute(select(Hexagram).limit(1))
        return result.scalars().first()
    finally:
        await db.close()  # 명시적 정리
```

### 데이터 일관성 문제

#### 1. 트랜잭션 롤백

```python
async def safe_operation(db: AsyncSession):
    try:
        hexagram = Hexagram(id="1-1", gua_number=1, ...)
        db.add(hexagram)
        await db.flush()  # 에러 전 확인
        await db.commit()
    except Exception as e:
        await db.rollback()  # 모든 변경 취소
        raise e
```

#### 2. 동시성 문제

```python
# 낙관적 잠금 (Optimistic Locking)
from sqlalchemy import __version__

class Hexagram(Base):
    __version__ = Column(Integer, default=1)  # 버전 관리

    __mapper_args__ = {
        "version_id_col": __version__
    }
```

---

## 참고 자료

- [SQLAlchemy 공식 문서](https://docs.sqlalchemy.org/)
- [AsyncIO SQLAlchemy](https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html)
- [Alembic 마이그레이션](https://alembic.sqlalchemy.org/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

---

**마지막 업데이트**: 2024-12-29
**담당자**: Backend Team

# Alembic 데이터베이스 마이그레이션 가이드

주역 AI 운세 서비스의 데이터베이스 마이그레이션 관리 시스템입니다.

## 개요

- **도구**: Alembic 1.13.1 (SQLAlchemy 마이그레이션 프레임워크)
- **데이터베이스**: PostgreSQL 16+
- **접근 방식**: 비동기 마이그레이션 (asyncpg 지원)
- **마이그레이션 위치**: `alembic/versions/`

## 디렉토리 구조

```
alembic/
├── README.md                                    # 이 파일
├── env.py                                       # 마이그레이션 환경 설정
├── script.py.mako                               # 마이그레이션 템플릿
└── versions/                                    # 마이그레이션 버전
    └── 20241229_1600_001_initial_schema.py     # 초기 스키마 마이그레이션
```

### 주요 파일 설명

| 파일 | 설명 |
|------|------|
| `env.py` | Alembic 실행 환경 설정. 비동기 모드 지원, 모델 메타데이터 연결 |
| `script.py.mako` | 새 마이그레이션 파일 템플릿 |
| `versions/` | 실행된 모든 마이그레이션 버전 저장 |
| `alembic.ini` | Alembic 설정 파일 (프로젝트 루트) |

## 마이그레이션 목록

### 현재 마이그레이션 (1개)

#### 1️⃣ `20241229_1600_001_initial_schema.py`

**생성일**: 2024-12-29 16:00
**상태**: ✅ 프로덕션 적용 완료
**리비전 ID**: `001`

**생성 테이블**:
1. **hexagrams** (384효 데이터)
   - 17개 컬럼 (gua_number, gua_name_ko, yao_number 등)
   - 주 키: `id` (String "14-6" 형식)
   - 인덱스: `ix_hexagrams_gua_yao` (gua_number, yao_number 복합 인덱스)

2. **categories** (250개 카테고리)
   - 8개 컬럼 (major_id, major_name, sub_name 등)
   - 주 키: `id` (Integer)
   - 인덱스: `ix_categories_major` (major_id, sub_name 복합 인덱스)

3. **interpretations** (카테고리별 해석)
   - FK: hexagrams.id, categories.id
   - 유니크 제약조건: (hexagram_id, category_id, period)
   - 인덱스: `ix_interpretations_lookup` (hexagram_id, category_id, period)

4. **user_history** (사용자 행동 로그)
   - session_id, user_id, divination_type, category_id 기록
   - 인덱스: session_id, user_id

## 주요 명령어

### 1. 마이그레이션 상태 확인

```bash
# 현재 마이그레이션 버전 확인
alembic current

# 마이그레이션 히스토리 조회
alembic history

# 마이그레이션 히스토리 상세 보기
alembic history --verbose
```

**출력 예시**:
```
<base> -> 001 (head), 초기 스키마 - 384효 + 카테고리 + 해석 테이블
```

### 2. 마이그레이션 실행

```bash
# 최신 마이그레이션 적용
cd backend
alembic upgrade head

# 특정 리비전까지 업그레이드
alembic upgrade 001

# 한 단계만 업그레이드
alembic upgrade +1

# 다운그레이드 (이전 상태로 롤백)
alembic downgrade -1

# 특정 버전으로 다운그레이드
alembic downgrade base
```

### 3. 새 마이그레이션 생성

```bash
# 자동 생성 (모델 변경 감지)
alembic revision --autogenerate -m "설명: 새로운 테이블 추가"

# 수동 생성 (빈 마이그레이션)
alembic revision -m "설명: 데이터 초기화"
```

**생성되는 파일 이름 형식**:
```
YYYYMMDD_HHMM_NNN_설명.py

예: 20250101_1430_002_add_user_table.py
```

### 4. SQL 미리보기 (오프라인 모드)

```bash
# SQL 스크립트만 생성 (실행 안 함)
alembic upgrade head --sql

# 파일로 저장
alembic upgrade head --sql > migration.sql
```

## 마이그레이션 파일 구조

### 마이그레이션 파일 템플릿

```python
"""설명

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 12:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 업그레이드 로직
    op.create_table(
        'new_table',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
    )


def downgrade() -> None:
    # 다운그레이드 로직
    op.drop_table('new_table')
```

### 중요 함수들

| 함수 | 용도 |
|------|------|
| `op.create_table()` | 테이블 생성 |
| `op.drop_table()` | 테이블 삭제 |
| `op.add_column()` | 컬럼 추가 |
| `op.drop_column()` | 컬럼 삭제 |
| `op.alter_column()` | 컬럼 수정 |
| `op.create_index()` | 인덱스 생성 |
| `op.drop_index()` | 인덱스 삭제 |
| `op.create_foreign_key()` | 외래키 추가 |
| `op.drop_constraint()` | 제약조건 삭제 |

## 데이터베이스 설정

### 환경 변수 (.env)

```env
# 비동기 연결 (마이그레이션용)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/iching_db

# 동기 연결 (Alembic용)
DATABASE_URL_SYNC=postgresql://postgres:password@localhost:5432/iching_db
```

### alembic.ini 주요 설정

```ini
[alembic]
script_location = alembic
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s
sqlalchemy.url = postgresql://postgres:password@localhost:5432/iching_db
timezone = Asia/Seoul
```

## 모델과 마이그레이션 동기화

### 모델 위치

```
app/models/hexagram.py
├── Hexagram        # 384효 데이터
├── Category        # 250개 카테고리
├── Interpretation  # 카테고리별 해석
└── UserHistory     # 사용자 로그
```

### 자동 마이그레이션 생성 (권장)

```bash
# 1. 모델 변경 후 자동 생성
alembic revision --autogenerate -m "모델 변경 설명"

# 2. 생성된 마이그레이션 파일 검토
# alembic/versions/YYYYMMDD_HHMM_NNN_*.py 확인

# 3. 적용 전 SQL 미리보기
alembic upgrade head --sql

# 4. 마이그레이션 적용
alembic upgrade head
```

### 주의사항

⚠️ **자동 마이그레이션 제한사항**:
- 테이블/컬럼 이름 변경은 감지 안 됨 (수동 작성 필요)
- 컬럼 타입 변경은 일부만 감지됨
- 데이터 마이그레이션은 자동으로 안 됨
- 복잡한 변경은 수동 마이그레이션 필요

## 마이그레이션 체크리스트

### 새 마이그레이션 생성할 때

- [ ] 모델 변경사항 구현
- [ ] `alembic revision --autogenerate -m "설명"` 실행
- [ ] 생성된 파일에서 `upgrade()`, `downgrade()` 확인
- [ ] SQL 미리보기로 검증: `alembic upgrade head --sql`
- [ ] 로컬 환경에서 테스트: `alembic upgrade head`
- [ ] 다운그레이드 테스트: `alembic downgrade -1`
- [ ] Git에 커밋

### 프로덕션 배포할 때

1. **사전 검사**
   ```bash
   alembic current      # 현재 상태 확인
   alembic history      # 적용할 마이그레이션 확인
   alembic upgrade head --sql  # SQL 미리보기
   ```

2. **백업 생성**
   ```bash
   pg_dump iching_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **마이그레이션 실행**
   ```bash
   alembic upgrade head
   ```

4. **검증**
   ```bash
   alembic current
   ```

## 문제 해결

### 1. 마이그레이션 충돌 (Conflict)

**증상**: "Conflict detected in revision ids"

**해결책**:
```bash
# 현재 상태 확인
alembic current

# 충돌 병합 (수동 편집 필요)
# alembic/versions/ 에서 down_revision 수정

# 병합 후 테스트
alembic upgrade head
alembic downgrade base
alembic upgrade head
```

### 2. 마이그레이션 스킵 (Stamping)

**증상**: 기존 DB를 Alembic으로 관리하고 싶음

**해결책**:
```bash
# 특정 리비전으로 표시 (실제 실행 안 함)
alembic stamp 001

# 확인
alembic current
```

### 3. 데이터 손실 방지

**마이그레이션 검증 단계**:
```bash
# 1. 현재 상태 백업
pg_dump iching_db > backup.sql

# 2. 테스트 DB에서 먼저 실행
psql test_db < alembic/versions/20250101_*.py

# 3. 프로덕션 적용
alembic upgrade head
```

## 모범 사례 (Best Practices)

### 마이그레이션 작성 원칙

1. **원자성**: 한 마이그레이션 = 한 가지 변경
2. **가역성**: 항상 `downgrade()` 작성
3. **점진성**: 큰 변경은 여러 단계로 분리
4. **테스트**: 로컬에서 먼저 검증

### 마이그레이션 네이밍

```
YYYYMMDD_HHMM_NNN_설명.py

✅ Good:
20250101_1430_002_add_user_preferences_table.py
20250101_1445_003_add_index_to_hexagrams_name.py

❌ Bad:
add_table.py
migration_v2.py
002.py
```

### Git 커밋 메시지

```
feat(db): Add user_preferences table

- Create user_preferences table with 5 new columns
- Add index on user_id for performance
- Migration: 20250101_1430_002_add_user_preferences_table.py

Closes #123
```

## 참고 자료

- [Alembic 공식 문서](https://alembic.sqlalchemy.org/)
- [SQLAlchemy ORM 문서](https://docs.sqlalchemy.org/en/20/)
- [PostgreSQL 타입 가이드](https://www.postgresql.org/docs/current/datatype.html)

## 자동화 스크립트

### migrate-and-test.sh (권장)

```bash
#!/bin/bash
set -e

cd backend

echo "🔄 마이그레이션 상태 확인..."
alembic current

echo "📜 마이그레이션 히스토리..."
alembic history --verbose

echo "⚙️  마이그레이션 실행..."
alembic upgrade head

echo "✅ 마이그레이션 완료!"
alembic current
```

**사용법**:
```bash
chmod +x migrate-and-test.sh
./migrate-and-test.sh
```

### Python 스크립트로 실행

```python
import subprocess
import sys

def run_migration():
    try:
        # 마이그레이션 실행
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd="backend",
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("✅ 마이그레이션 성공")
        else:
            print(f"❌ 마이그레이션 실패: {result.stderr}")
            sys.exit(1)

    except Exception as e:
        print(f"❌ 오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
```

## 자주 묻는 질문 (FAQ)

### Q1: 마이그레이션을 거꾸로 되돌릴 수 있나?
**A**: 네, `alembic downgrade -1` 또는 `alembic downgrade base`로 롤백 가능

### Q2: 프로덕션과 개발 환경이 다를 수 있나?
**A**: 가능합니다. 환경변수로 `DATABASE_URL`을 구분 설정

### Q3: 마이그레이션 파일을 실수로 삭제했다면?
**A**: Git 히스토리에서 복구 가능. `git checkout HEAD~1 alembic/versions/`

### Q4: 여러 마이그레이션이 동시에 실행되면?
**A**: Alembic은 트랜잭션으로 보호되어 순차 실행됨

### Q5: 마이그레이션 로그를 어디서 확인?
**A**: 로그는 콘솔에 출력되며, `--sql` 옵션으로 SQL만 조회 가능

---

**작성자**: Claude Code
**최종 수정**: 2024-12-29
**버전**: 1.0

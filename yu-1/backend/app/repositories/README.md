# Repository 패턴 문서

## 개요

`repositories` 계층은 **데이터 접근 로직을 캡슐화**하여 애플리케이션의 비즈니스 로직과 데이터 소스를 분리합니다.

### 설계 원칙

- **단일 책임**: 각 Repository는 특정 엔티티(괘/효)의 데이터만 관리
- **일관된 인터페이스**: 모든 Repository는 동일한 패턴 따름
- **싱글톤 패턴**: 모듈 레벨에서 인스턴스 생성 및 내보내기
- **Fallback 메커니즘**: 데이터 누락 시 안전한 기본값 반환

---

## 아키텍처

```
repositories/
├── __init__.py                    # 모듈 진입점 (싱글톤 인스턴스 export)
├── hexagram_repository.py         # 64괘 데이터 Repository
├── yao_repository.py              # 384효 데이터 Repository
└── README.md                      # 이 파일
```

### 데이터 흐름

```
external_data (JSON/Python files)
    ↓
Repository 클래스
    ↓
DTO 클래스 (HexagramData / YaoData)
    ↓
Service 계층
    ↓
API Endpoint
```

---

## HexagramRepository

**책임**: 64괘(易經의 기본 단위) 데이터 조회

### 초기화

```python
from app.repositories import hexagram_repository

# 싱글톤 인스턴스 사용
hexagram = hexagram_repository.get_hexagram(1)
```

### 주요 메서드

| 메서드 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `get_hexagram(number)` | `int` (1-64) | `Optional[HexagramData]` | 괘 번호로 완전한 괘 데이터 조회 |
| `get_gua_ci(number)` | `int` (1-64) | `str` | 특정 괘의 괘사(괘 해설) 만 조회 |
| `exists(number)` | `int` (1-64) | `bool` | 괘 데이터 존재 여부 확인 |

### DTO: HexagramData

```python
@dataclass
class HexagramData:
    number: int              # 괘 번호 (1-64)
    name_ko: str             # 한글 이름 (예: "건")
    name_hanja: str          # 한자명 (예: "乾")
    name_full: str           # 전체 이름 (예: "천건궁")
    gua_ci: str              # 괘사 (괘의 의미)
    gua_ci_hanja: str        # 괘사 한자
    nature: str              # 괘의 성질
    image: str               # 괘의 상징
    judgment: str            # 괘의 판단
```

### 사용 예시

```python
# 완전한 괘 데이터 조회
hexagram = hexagram_repository.get_hexagram(1)  # 첫 번째 괘 (건)
print(f"{hexagram.number}: {hexagram.name_ko} ({hexagram.name_hanja})")
# 출력: 1: 건 (乾)

# 괘사만 조회
gua_ci = hexagram_repository.get_gua_ci(1)
print(gua_ci)  # "괘사 텍스트..."

# 존재 여부 확인
if hexagram_repository.exists(50):
    print("50번 괘 데이터 존재함")
```

### 내부 구조

- **`_data`**: `HEXAGRAM_DATA` 딕셔너리 (key: 괘번호, value: 괘 정보)
- **`_fallback_cache`**: 미사용 (향후 확장 포인트)
- **Fallback 메커니즘**: 데이터 없을 시 `_get_fallback()`에서 기본값 반환

---

## YaoRepository

**책임**: 384효(效, 괘의 각 라인) 데이터 조회

### 초기화

```python
from app.repositories import yao_repository

# 싱글톤 인스턴스 사용
yao = yao_repository.get_yao(1, 1)  # 1번 괘의 첫 번째 효
```

### 주요 메서드

| 메서드 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `get_yao(hexagram_number, position)` | `int`, `int` (1-6) | `Optional[YaoData]` | 특정 괘의 특정 효 데이터 조회 |
| `get_hexagram_yaos(hexagram_number)` | `int` | `List[YaoData]` | 특정 괘의 모든 효(6개) 조회 |
| `exists(hexagram_number, position)` | `int`, `int` | `bool` | 효 데이터 존재 여부 확인 |

### DTO: YaoData

```python
@dataclass
class YaoData:
    hexagram_number: int        # 괘 번호
    position: int               # 효 위치 (1-6)
    name: str                   # 효 이름 (예: "초구", "육이" 등)
    text_hanja: str             # 효사 한자
    text_kr: str                # 효사 한글
    interpretation: str         # 효의 해석
    fortune_score: int          # 길흉 점수 (0-100)
    fortune_category: str       # 길흉 카테고리 (대길/길/평/흉/대흉)
    keywords: List[str]         # 관련 키워드 목록
```

### 사용 예시

```python
# 특정 괘의 특정 효 조회
yao = yao_repository.get_yao(1, 1)  # 1번 괘의 첫 번째 효
print(f"효 위치: {yao.position}, 이름: {yao.name}")
# 출력: 효 위치: 1, 이름: 초구

# 특정 괘의 모든 효 조회
all_yaos = yao_repository.get_hexagram_yaos(1)  # 1번 괘의 전체 효
for yao in all_yaos:
    print(f"{yao.position}번 효: {yao.name} - {yao.fortune_category}")

# 효 데이터 존재 여부 확인
if yao_repository.exists(1, 3):
    print("1번 괘의 3번 효 존재")
```

### 내부 구조

- **`_data`**: `YAO_DATA` 딕셔너리 (key: `(hexagram_number, position)` 튜플)
- **효 이름 생성**: `_generate_yao_name()` 메서드로 위치 기반 이름 생성
  - 1: 초(初), 2: 이(二), 3: 삼(三), 4: 사(四), 5: 오(五), 6: 상(上)
- **Fallback 메커니즘**: 데이터 없을 시 `_get_fallback()`에서 중립적 기본값 반환

---

## 데이터 소스

### 외부 데이터 파일

| 파일 | 경로 | 내용 | 포맷 |
|------|------|------|------|
| 괘 데이터 | `app/data/hexagram_complete.py` | 64괘 정보 | Python Dict |
| 효 데이터 | `app/data/yao_complete.py` | 384효 정보 | Python Dict |

### 데이터 임포트 안정성

```python
# 각 Repository는 임포트 실패 시 빈 딕셔너리로 초기화
try:
    from app.data.hexagram_complete import HEXAGRAM_DATA
except ImportError:
    HEXAGRAM_DATA = {}
```

---

## 싱글톤 패턴

모든 Repository는 모듈 레벨에서 싱글톤 인스턴스를 생성하고 내보냅니다.

### `__init__.py`

```python
from .hexagram_repository import HexagramRepository, hexagram_repository
from .yao_repository import YaoRepository, yao_repository

__all__ = [
    "HexagramRepository",
    "hexagram_repository",
    "YaoRepository",
    "yao_repository",
]
```

### 사용법

```python
# 방법 1: 싱글톤 인스턴스 직접 임포트 (권장)
from app.repositories import hexagram_repository
hexagram = hexagram_repository.get_hexagram(1)

# 방법 2: 클래스 임포트 후 인스턴스 생성 (불필요하지만 가능)
from app.repositories import HexagramRepository
my_repo = HexagramRepository()
hexagram = my_repo.get_hexagram(1)
```

---

## 에러 처리

### Fallback 메커니즘

1. **데이터 없음**: 외부 데이터 파일에서 조회 실패
2. **Fallback**: `_get_fallback()` 메서드 호출
3. **기본값 반환**: 안전한 기본 DTO 반환

### HexagramRepository Fallback

```python
HexagramData(
    number=1,
    name_ko="괘1",
    name_hanja="卦",
    name_full="괘1",
    gua_ci="괘사 정보 준비 중",
)
```

### YaoRepository Fallback

```python
YaoData(
    hexagram_number=1,
    position=1,
    name="초효",
    text_hanja="爻辭",
    text_kr="효사 정보 준비 중",
    interpretation="해당 효의 의미를 살펴 신중히 행동하십시오.",
    fortune_score=50,
    fortune_category="평",
    keywords=["신중", "기다림"],
)
```

### 호출자의 응답 처리

```python
# None 체크
hexagram = hexagram_repository.get_hexagram(999)  # 범위 초과
if hexagram is None:
    print("유효하지 않은 괘 번호")

# Fallback 값 처리
yao = yao_repository.get_yao(1, 0)  # 위치 범위 초과
if yao.fortune_category == "평":
    print("데이터 없음 (기본값)")
```

---

## 확장 포인트

### 향후 추가 Repository

```python
# 예: 카테고리별 질문 조회
class QuestionRepository:
    def get_questions_by_category(self, category_id: str) -> List[str]:
        pass

# 예: 별자리 데이터 조회
class ConstellationRepository:
    def get_constellation(self, code: str) -> Optional[ConstellationData]:
        pass
```

### 데이터 소스 변경

현재는 Python 딕셔너리 기반이지만, 아래와 같이 확장 가능:

- **데이터베이스 연동**: `_data = load_from_db()`
- **API 연동**: `_data = fetch_from_remote_api()`
- **캐싱 추가**: Redis 등으로 자주 조회되는 데이터 캐싱

---

## 테스트

### 단위 테스트 예시

```python
def test_hexagram_repository():
    from app.repositories import hexagram_repository

    # 유효한 괘 조회
    hex1 = hexagram_repository.get_hexagram(1)
    assert hex1 is not None
    assert hex1.number == 1

    # 범위 초과
    hex_invalid = hexagram_repository.get_hexagram(65)
    assert hex_invalid is None

    # 존재 여부
    assert hexagram_repository.exists(1) == True
    assert hexagram_repository.exists(65) == False

def test_yao_repository():
    from app.repositories import yao_repository

    # 특정 효 조회
    yao = yao_repository.get_yao(1, 1)
    assert yao is not None
    assert yao.position == 1

    # 모든 효 조회
    yaos = yao_repository.get_hexagram_yaos(1)
    assert len(yaos) == 6

    # 범위 초과
    yao_invalid = yao_repository.get_yao(1, 7)
    assert yao_invalid is None
```

---

## 참고

- **데이터 인덱스**: [docs/DATA_INDEX.md](../../docs/DATA_INDEX.md)
- **Service 계층**: `app/services/`
- **API 엔드포인트**: `app/api/`

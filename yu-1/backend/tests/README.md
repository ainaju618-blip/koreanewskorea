# Backend Tests Directory

점술 API 및 데이터 처리의 품질을 보증하는 테스트 스위트입니다.

## 📋 테스트 파일 목록

### 1. `test_api_endpoints.py`
API 엔드포인트의 기능성 및 통합 테스트

#### 테스트 범위
- **엔드포인트**: GET/POST 요청 처리
- **입력 검증**: 파라미터 유효성 검사
- **오류 처리**: 잘못된 입력에 대한 응답
- **응답 구조**: JSON 스키마 검증
- **상태 코드**: HTTP 상태 코드 정확성

#### 테스트 클래스 및 메서드

##### `TestGetDivinationEndpoint`
```python
test_get_divination_success()
  ✓ 정상 요청 처리
  ✓ 응답 구조 검증

test_get_divination_missing_params()
  ✓ 필수 파라미터 누락 시 에러 처리

test_get_divination_invalid_category()
  ✓ 유효하지 않은 카테고리 거부

test_get_divination_invalid_hexagram()
  ✓ 범위 외 괘 번호 거부 (1-64)

test_get_divination_boundary_cases()
  ✓ 경계값 테스트 (1, 64, 0, 65)
```

##### `TestPostDivinationEndpoint`
```python
test_post_divination_cast_success()
  ✓ 질문 기반 점술 실행
  ✓ 응답에 추천 질문 포함

test_post_divination_cast_no_question()
  ✓ 질문 없는 점술 (기본값 사용)

test_post_divination_cast_empty_question()
  ✓ 빈 문자열 질문 처리
```

##### `TestCategoriesEndpoint`
```python
test_get_categories_success()
  ✓ 모든 카테고리 반환
  ✓ 카테고리 구조 검증

test_categories_structure()
  ✓ 대분류/소분류 계층 확인
```

#### 사용 방법
```bash
# 전체 테스트 실행
pytest tests/test_api_endpoints.py -v

# 특정 테스트 클래스 실행
pytest tests/test_api_endpoints.py::TestGetDivinationEndpoint -v

# 특정 테스트 메서드 실행
pytest tests/test_api_endpoints.py::TestGetDivinationEndpoint::test_get_divination_success -v

# 커버리지 포함 실행
pytest tests/test_api_endpoints.py -v --cov=app --cov-report=html
```

#### 예상 결과
```
test_api_endpoints.py::TestGetDivinationEndpoint::test_get_divination_success PASSED
test_api_endpoints.py::TestGetDivinationEndpoint::test_get_divination_missing_params PASSED
test_api_endpoints.py::TestGetDivinationEndpoint::test_get_divination_invalid_category PASSED
...
======================== 12 passed in 2.34s ========================
```

---

### 2. `test_category_matcher.py`
카테고리 분류 및 매칭 로직 테스트

#### 테스트 범위
- **카테고리 로드**: 카테고리 데이터 정상 로드
- **매칭 정확도**: 질문 → 카테고리 분류 정확도
- **예외 처리**: 없는 카테고리 처리
- **캐싱**: 카테고리 캐시 동작 검증
- **성능**: 매칭 속도 검증

#### 테스트 클래스 및 메서드

##### `TestCategoryMatching`
```python
test_load_categories()
  ✓ 카테고리 파일 정상 로드
  ✓ 9개 대분류 확인
  ✓ 250개 소분류 확인

test_match_money_questions()
  ✓ "사업" 질문을 "재물 > 창업/사업"으로 분류
  ✓ "투자" 질문을 "재물 > 투자"로 분류

test_match_career_questions()
  ✓ "취직" 질문을 "직업 > 취업/면접"으로 분류
  ✓ "승진" 질문을 "직업 > 이직/승진"으로 분류

test_match_love_questions()
  ✓ "연애" 질문을 "연애 > 연애"로 분류
  ✓ "결혼" 질문을 "연애 > 결혼"으로 분류

test_ambiguous_questions()
  ✓ 모호한 질문 처리 (가장 유사한 카테고리)

test_unknown_category()
  ✓ 알 수 없는 질문 처리 (기본 카테고리)

test_category_cache()
  ✓ 캐시 성능 검증 (2배 이상 빠름)

test_matching_performance()
  ✓ 1000개 질문 분류 < 100ms
```

#### 사용 방법
```bash
pytest tests/test_category_matcher.py -v

# 성능 테스트만 실행
pytest tests/test_category_matcher.py::TestCategoryMatching::test_matching_performance -v

# 캐시 테스트 포함
pytest tests/test_category_matcher.py -v -m cache
```

---

### 3. `test_divination.py`
점술 로직 및 괘/효 해석 테스트

#### 테스트 범위
- **괘 선택**: 무작위/결정론적 괘 선택
- **변괘 생성**: 초괘 → 변괘 변환
- **해석 조회**: 괘/효 해석 텍스트 조회
- **방향성**: 길/흉 판단 로직
- **일관성**: 동일 입력에 동일 출력

#### 테스트 클래스 및 메서드

##### `TestHexagramSelection`
```python
test_select_hexagram_random()
  ✓ 1-64 범위 내 정수 반환
  ✓ 여러 번 호출 시 변함 (무작위성)

test_select_hexagram_deterministic()
  ✓ 같은 입력 → 같은 결과
  ✓ "2025-01-01" → 항상 같은 괘
```

##### `TestYaoInterpretation`
```python
test_get_yao_by_position()
  ✓ 1-6번 효 조회 가능
  ✓ 범위 외 효 (0, 7) 거부

test_yao_text_not_empty()
  ✓ 모든 효에 해석 텍스트 있음
  ✓ 효 텍스트 최소 길이 검증
```

##### `TestTransformingHexagram`
```python
test_transform_hexagram()
  ✓ 초괘 → 변괘 정확한 변환
  ✓ 변효 위치 정확성

test_transform_with_changed_lines()
  ✓ 다중 변효 처리
  ✓ 순서 독립성 검증
```

##### `TestDivination`
```python
test_full_divination_flow()
  ✓ 질문 입력 → 점술 결과 완전 흐름
  ✓ 응답 구조 검증
  ✓ 모든 필드 존재 확인

test_category_based_divination()
  ✓ "재물" 카테고리 점술
  ✓ "직업" 카테고리 점술
  ✓ 다중 카테고리 처리
```

#### 사용 방법
```bash
pytest tests/test_divination.py -v

# 특정 테스트만 실행
pytest tests/test_divination.py::TestHexagramSelection -v

# 스트레스 테스트 (1000번 반복)
pytest tests/test_divination.py -v --count=1000
```

---

### 4. `test_rag_matching.py`
RAG(Retrieval-Augmented Generation) 기반 질문 매칭 테스트

#### 테스트 범위
- **키워드 검색**: 키워드 인덱스 조회 정확도
- **유사도**: 코사인 유사도 계산 정확성
- **순위**: 검색 결과 순위 정확성
- **성능**: 대규모 검색 속도

#### 테스트 클래스 및 메서드

##### `TestKeywordIndex`
```python
test_load_keyword_index()
  ✓ keywords_index.json 정상 로드
  ✓ 9,975개 키워드 확인

test_keyword_query()
  ✓ "사업" 키워드 검색 → 관련 질문 반환
  ✓ "취직" 키워드 검색 → 정확한 결과

test_multi_keyword_query()
  ✓ 여러 키워드 동시 검색
  ✓ 교집합/합집합 처리
```

##### `TestSimilarityMatching`
```python
test_cosine_similarity()
  ✓ 동일 벡터 → 유사도 1.0
  ✓ 완전 다른 벡터 → 유사도 0.0
  ✓ 부분 유사 → 0.0 < 유사도 < 1.0

test_ranking_by_similarity()
  ✓ 유사한 질문이 앞에 위치
  ✓ Top-K 검색 정확성 (K=10)
```

##### `TestRAGPerformance`
```python
test_search_performance()
  ✓ 단일 키워드 검색 < 10ms
  ✓ 10개 키워드 검색 < 50ms

test_batch_search()
  ✓ 1000개 질문 일괄 검색 < 1초

test_memory_usage()
  ✓ 메모리 사용량 < 500MB
```

#### 사용 방법
```bash
pytest tests/test_rag_matching.py -v

# 성능 테스트만 실행
pytest tests/test_rag_matching.py::TestRAGPerformance -v

# 벤치마크 모드
pytest tests/test_rag_matching.py -v --benchmark-only
```

---

### 5. `test_category_seed.py`
카테고리 시드 데이터 검증 테스트

#### 테스트 범위
- **데이터 구조**: category_seed.py 구조 검증
- **중복 확인**: 카테고리 ID 중복 검사
- **키워드 유효성**: 각 카테고리의 키워드 검증
- **카운트**: 정확한 250개 소분류
- **매핑**: 대분류-소분류 매핑 정확성

#### 테스트 메서드
```python
test_load_category_seed()
  ✓ category_seed.py 정상 로드

test_total_categories()
  ✓ 정확히 250개 소분류
  ✓ 9개 대분류

test_no_duplicate_ids()
  ✓ 카테고리 ID 중복 없음

test_category_keywords()
  ✓ 모든 카테고리에 키워드 있음
  ✓ 최소 3개 이상 키워드

test_parent_category_links()
  ✓ 모든 소분류가 유효한 대분류 참조
```

#### 사용 방법
```bash
pytest tests/test_category_seed.py -v
```

---

### 6. `test_interpretations.py`
해석 데이터 검증 테스트

#### 테스트 범위
- **괘 해석**: 64개 괘의 해석 텍스트
- **효 해석**: 384개 효의 해석 텍스트
- **문자열 길이**: 해석의 최소/최대 길이
- **인코딩**: UTF-8 정상 인코딩
- **카테고리별 해석**: 각 카테고리별 해석 맞춤화

#### 테스트 메서드
```python
test_hexagram_interpretations()
  ✓ 모든 64개 괘 해석 존재
  ✓ 해석 텍스트 비어있지 않음

test_yao_interpretations()
  ✓ 모든 384개 효 해석 존재

test_interpretation_length()
  ✓ 최소 길이 > 10 문자
  ✓ 최대 길이 < 5000 문자

test_interpretation_encoding()
  ✓ UTF-8 정상 인코딩
  ✓ 특수문자 처리

test_category_specific_interpretation()
  ✓ 카테고리별 커스터마이징 된 해석
```

#### 사용 방법
```bash
pytest tests/test_interpretations.py -v
```

---

### 7. `test_probability_distribution.py`
점술 결과의 통계적 검증 테스트

#### 테스트 범위
- **분포**: 괘 선택의 확률 분포 균일성
- **무작위성**: 무작위 생성의 충분한 엔트로피
- **결결정론성**: 같은 시드에 같은 결과
- **카이제곱 검정**: 분포의 통계적 유의성

#### 테스트 메서드
```python
test_hexagram_distribution()
  ✓ 1000번 선택 후 분포 균일성 검증
  ✓ 각 괘 선택 확률 1/64 ± 5%

test_randomness_chi_square()
  ✓ 카이제곱 검정 p > 0.05
  ✓ 높은 엔트로피 확인

test_deterministic_with_seed()
  ✓ seed=12345 → 항상 같은 결과

test_yao_distribution()
  ✓ 효 선택도 균일 분포
```

#### 사용 방법
```bash
pytest tests/test_probability_distribution.py -v

# 스트레스 테스트 (10000번)
pytest tests/test_probability_distribution.py -v --count=10000
```

---

## 🚀 테스트 실행 가이드

### 1. 환경 설정
```bash
# 백엔드 디렉토리 이동
cd backend

# 의존성 설치
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov

# .env 파일 확인
cat .env
```

### 2. 전체 테스트 실행
```bash
# 모든 테스트 실행
pytest tests/ -v

# 커버리지 포함
pytest tests/ -v --cov=app --cov-report=html

# 병렬 실행 (4개 워커)
pytest tests/ -v -n 4
```

### 3. 선택적 테스트 실행
```bash
# API 테스트만
pytest tests/test_api_endpoints.py -v

# 데이터 검증만
pytest tests/test_category_seed.py tests/test_interpretations.py -v

# 성능 테스트만
pytest tests/test_rag_matching.py::TestRAGPerformance -v

# 특정 마커 테스트
pytest tests/ -v -m slow  # 느린 테스트
pytest tests/ -v -m fast  # 빠른 테스트
```

### 4. 디버그 모드
```bash
# 상세 출력
pytest tests/test_api_endpoints.py -vv

# 첫 실패 시 멈추기
pytest tests/ -v -x

# PDB 디버거 활성화
pytest tests/ -v --pdb

# 출력 캡처 비활성화 (print 보이기)
pytest tests/ -v -s
```

---

## 📊 테스트 커버리지

### 목표 커버리지
- **라인 커버리지**: ≥90%
- **브랜치 커버리지**: ≥80%
- **함수 커버리지**: ≥95%

### 커버리지 확인
```bash
# HTML 리포트 생성
pytest tests/ --cov=app --cov-report=html

# 브라우저에서 보기
open htmlcov/index.html  # macOS
start htmlcov/index.html # Windows

# 터미널에서 보기
pytest tests/ --cov=app --cov-report=term-missing
```

---

## 🧪 테스트 데이터

### Fixtures (conftest.py)
```python
@pytest.fixture
async def client():
    """테스트용 HTTP 클라이언트"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport) as ac:
        yield ac

@pytest.fixture
def sample_question():
    """샘플 질문"""
    return "내년 사업이 잘될까요?"

@pytest.fixture
def category_map():
    """카테고리 매핑"""
    return load_categories()
```

### 테스트 데이터 사용
```python
def test_example(client, sample_question, category_map):
    response = client.get("/api/divination",
                         params={"question": sample_question})
    assert response.status_code == 200
```

---

## 🔄 CI/CD 통합

### GitHub Actions 예시
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov

      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./backend/coverage.xml
```

---

## 📝 테스트 작성 가이드

### 테스트 구조
```python
import pytest
from httpx import AsyncClient

class TestFeatureName:
    """테스트 그룹"""

    @pytest.fixture
    def setup(self):
        """테스트 전 준비"""
        yield {
            "data": "test_value"
        }

    @pytest.mark.asyncio
    async def test_feature_success(self, client, setup):
        """정상 케이스"""
        response = await client.get("/api/endpoint")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_feature_error(self, client):
        """오류 케이스"""
        response = await client.get("/api/endpoint", params={"invalid": "param"})
        assert response.status_code == 400
```

### 명명 규칙
- 테스트 파일: `test_*.py` 또는 `*_test.py`
- 테스트 클래스: `Test*` (대문자 시작)
- 테스트 메서드: `test_*` (소문자)
- 마커: `@pytest.mark.marker_name`

### 단언문 작성
```python
# 좋은 단언문
assert response.status_code == 200
assert "hexagram_number" in response.json()
assert len(questions) == 9491

# 나쁜 단언문 (메시지 없음)
assert response.status_code  # "True"인지만 확인

# 개선 (메시지 포함)
assert response.status_code == 200, f"Expected 200, got {response.status_code}"
```

---

## 🐛 일반적인 테스트 에러 해결

### 1. Import Error
```
ModuleNotFoundError: No module named 'app'
```
**해결**: backend 디렉토리에서 실행
```bash
cd backend && pytest tests/ -v
```

### 2. Async Runtime Error
```
RuntimeError: Event loop closed
```
**해결**: pytest-asyncio 설치
```bash
pip install pytest-asyncio
```

### 3. Encoding Error
```
UnicodeDecodeError: 'utf-8' codec can't decode
```
**해결**: 파일 인코딩 확인
```python
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()
```

### 4. Timeout Error
```
TimeoutError: Task timeout
```
**해결**: 테스트 타임아웃 증가
```python
@pytest.mark.asyncio(timeout=10)
async def test_slow_operation():
    pass
```

---

## 📈 성능 벤치마크

### 기준 성능
| 테스트 | 예상 시간 | 최대 허용 |
|-------|---------|---------|
| API 엔드포인트 | 0.1s | 0.5s |
| 카테고리 매칭 | 0.01s | 0.1s |
| RAG 검색 (1회) | 0.01s | 0.05s |
| 전체 테스트 | 10s | 30s |

---

**마지막 업데이트**: 2025-01-01
**관리자**: QA Team

# Services Layer - 비즈니스 로직 문서

## 개요

`services/` 폴더는 백엔드의 핵심 비즈니스 로직을 담당하는 레이어입니다. 사용자의 질문을 받아서 주역 점술을 수행하고, 해석을 생성하는 전체 플로우를 관리합니다.

**주요 책임:**
- 카테고리 매칭 (질문 → 분류)
- 주역 점술 (64괘 × 6효 = 384효 생성)
- 벡터 검색 (ChromaDB를 통한 의미론적 검색)
- 해석 생성 (5단계 점술가 어조)
- LLM 어투 변환 (Ollama 통합)
- 출력 검증 (환각 방지)

---

## 서비스 구조

```
services/
├── __init__.py                 # 싱글톤 인스턴스 내보내기
├── category_matcher.py         # 카테고리 매칭 (키워드 기반)
├── rag_service.py              # RAG 서비스 (384효 벡터 검색)
├── rag_pipeline.py             # RAG 파이프라인 (카테고리 벡터 검색)
├── divination.py               # 점술 서비스 (주역 알고리즘)
├── oracle_generator.py         # 점술가 해석 생성 (5단계)
├── llm_service.py              # LLM 어투 변환 (Ollama)
├── llm_validator.py            # LLM 출력 검증 (환각 방지)
└── README.md                   # 이 문서
```

---

## 서비스별 상세 분석

### 1. CategoryMatcher (`category_matcher.py`)

**역할:** 사용자 질문을 카테고리로 분류하는 첫 번째 단계

**핵심 기능:**
- 키워드 기반 질문 → 카테고리 매칭
- 시드 데이터 활용 (DB 연동 대기 중)
- 9개 대분류 × 250개 소분류 지원

**주요 메서드:**

| 메서드 | 입력 | 출력 | 설명 |
|--------|------|------|------|
| `match_question()` | `question: str` | `(major_id, category_id, confidence)` | 질문 → 카테고리 매칭 |
| `get_main_categories()` | - | `List[Dict]` | 대분류 목록 조회 |
| `get_sub_categories()` | `major_id: int` | `List[Dict]` | 소분류 목록 조회 |
| `get_category_name()` | `category_id: int` | `str` | "대분류 > 소분류" 포맷 |

**알고리즘:**
1. 질문을 소문자로 정규화
2. 모든 카테고리 키워드와 매칭
3. 가중치 점수 계산 (길이 보너스 포함)
4. 신뢰도 >= 0.1이면 반환
5. 실패 시 대분류 폴백
6. 최종 실패 → 기타(major_id=9) 반환

**의존성:**
- `app.data.category_seed` - 카테고리 시드 데이터

**싱글톤:** `category_matcher` (글로벌 인스턴스)

---

### 2. DivinationService (`divination.py`)

**역할:** 주역 점술 수행 - 64괘 × 6효 선택

**특징:**
- 전통 주역 변효(變爻) 규칙 완전 구현
- 4가지 알고리즘 지원
- 운발수(運發數) 기반 운세 가중치

**핵심 데이터 구조:**

```python
@dataclass
class DivinationResult:
    hexagram_number: int           # 본괘 (1-64)
    transformed_hexagram: int      # 지괘 (변효 있을 때)
    changing_lines: List[int]      # 변효 위치 (1-6)
    reading_method: ReadingMethod  # 해석 방법
    lines: List[YaoResult]         # 6효 상세 정보
```

**점술 알고리즘 비교:**

| 알고리즘 | 확률 분포 | 변효 | 사용 용도 |
|---------|---------|------|---------|
| `uniform_384_divination()` | 운발수 가중치 | X | 기본값, 운세 흐름 반영 |
| `simple_divination()` | 동전점 (1/2) | O | 전통 변효 규칙 |
| `shicho_divination()` | 시초점 (조합) | O | 전통 점술 (느림) |
| `traditional_384_divination()` | 순수 균등 1/384 | X | 정통 역학 방식 |

**변효 해석 규칙 (전통):**

```
0변효 → 본괘 괘사 (卦辭)
1변효 → 해당 효사 (爻辭)
2변효 → 두 효 중 위의 효사
3변효 → 본괘 괘사 + 지괘 괘사
4변효 → 지괘 변하지 않은 효 중 아래 효사
5변효 → 지괘 유일한 변하지 않은 효사
6변효 → 건괘(용구) / 곤괘(용육) / 기타(지괘 괘사)
```

**운발수 메커니즘:**
```
운발수 1-2: 흉운 (나쁜 운세 ×2.5, 좋은 운세 ×0.3)
운발수 3-4: 약흉운 (나쁜 운세 ×1.8, 좋은 운세 ×0.6)
운발수 5-6: 평운 (영향 없음)
운발수 7-8: 약길운 (좋은 운세 ×1.8, 나쁜 운세 ×0.6)
운발수 9-10: 대길운 (좋은 운세 ×2.5, 나쁜 운세 ×0.3)
```

**주요 메서드:**

| 메서드 | 알고리즘 | 사용 |
|--------|---------|-----|
| `uniform_384_divination()` | 운발수 가중치 | 기본값 (권장) |
| `simple_divination()` | 동전점 (3개) | 테스트/빠른 결과 |
| `shicho_divination()` | 시초점 (49개) | 전통 점술 |
| `traditional_384_divination()` | 순수 균등 | 정통 역학회 |

**의존성:**
- `app.data.yao_complete` - 384효 운세 점수

**싱글톤:** `divination_service`

---

### 3. OracleGenerator (`oracle_generator.py`)

**역할:** 점술가 어조의 5단계 해석문 생성

**특징:**
- 고정된 효사 데이터만 재구성 (새 의미 생성 금지)
- 150-250자 목표
- 점술가 정체성 유지 ("~이니라", "~하라")

**5단계 구조:**

```
1단계 (10%): 괘/효 선언
   "그대에게 내려진 괘는 건위천 초효이니라."

2단계 (25%): 핵심 해석 (효 방향 기반)
   "기운이 상승하고 있느니라"

3단계 (30%): 맥락 적용 (카테고리 + 질문 방향)
   "오늘, 그대가 재물의 새 시작을 묻는다면,"

4단계 (25%): 행동 지침 (매트릭스 + 심리 유형)
   "신중하게 나아가라. 성급한 결정은 삼가라."

5단계 (10%): 마무리 경구 (방향별 결말)
   "하늘이 그대와 함께 하리라."
```

**입출력:**

```python
@dataclass
class OracleInput:
    hexagram_number: int              # 1-64
    hexagram_name: str                # "건위천"
    yao_position: int                 # 1-6
    yao_text: str                     # "潛龍勿用" (효사 원문)
    yao_meaning: str                  # 효사 직역
    yao_direction: YaoDirection       # ASCENDING/STAGNANT/DESCENDING
    question: str                     # 사용자 질문
    question_direction: QuestionDirection  # START/MAINTAIN/CHANGE/END
    category_name: str                # "재물운 > 주식"
    period: str                       # daily/weekly/monthly/yearly
    psychology_type: Optional[str]    # 심리 유형 (8가지)

@dataclass
class OracleOutput:
    full_text: str                    # 150-250자 전체 해석
    stage_1_declaration: str
    stage_2_core: str
    stage_3_context: str
    stage_4_guidance: str
    stage_5_closing: str
    action_guidance: ActionGuidance   # 해석 매트릭스
    compatibility_score: float        # 일치도
```

**방향별 마무리 경구 (12가지):**
- 상승 + 시작: "하늘이 그대와 함께 하리라."
- 상승 + 유지: "더욱 풍성해지리라."
- 정체 + 변화: "급히 서두르지 말라."
- 하강 + 종료: "새 시작을 준비하라."
- 등 12개 조합

**주요 메서드:**

| 메서드 | 입력 | 출력 |
|--------|------|------|
| `generate()` | `OracleInput` | `OracleOutput` |
| `generate_simple()` | 단순 파라미터 | `str` (전체 해석) |

**의존성:**
- `app.data.interpretation_matrix` - 행동 지침 매트릭스
- `app.data.yao_direction` - 효 방향 정의
- `app.data.question_direction` - 질문 방향 정의

**싱글톤:** `oracle_generator`

---

### 4. RAGService (`rag_service.py`)

**역할:** 384효 벡터 임베딩 및 의미론적 검색

**기술:**
- ChromaDB (DuckDB+Parquet 백엔드)
- 자동 임베딩 (Chroma 기본 모델)
- 유사도 기반 검색

**주요 메서드:**

| 메서드 | 입력 | 출력 | 용도 |
|--------|------|------|------|
| `init_index()` | - | `bool` | ChromaDB 초기화 |
| `index_hexagrams()` | `List[Dict]` | `int` | 384효 벡터화 |
| `search()` | `query: str` | `List[SearchResult]` | 유사 질문 검색 |
| `search_by_keywords()` | `List[str]` | `List[SearchResult]` | 키워드 검색 |
| `find_similar_hexagram()` | `question: str` | `(hexagram_id, similarity)` | 최유사 효 찾기 |

**SearchResult 구조:**
```python
@dataclass
class SearchResult:
    hexagram_id: str     # "1-1" (괘-효)
    similarity: float    # 0.0-1.0
    text: str           # 검색용 텍스트
    metadata: Dict      # 메타데이터
```

**초기화 플로우:**
```
init_index()
  ↓
get_or_create_collection("hexagram_yao")
  ↓
index_hexagrams(SAMPLE_HEXAGRAM_DATA)
  ↓
ChromaDB가 자동으로 임베딩 생성
```

**의존성:**
- `chromadb` - 벡터 데이터베이스
- `app.data.hexagram_seed` - 샘플 데이터

**싱글톤:** `rag_service`

**유틸리티 함수:** `init_rag_index()` (앱 시작 시 호출)

---

### 5. CategoryRAGPipeline (`rag_pipeline.py`)

**역할:** 카테고리 벡터 검색 (CategoryMatcher 보조)

**기술:**
- ChromaDB (카테고리 특화 컬렉션)
- 100개 카테고리 임베딩
- 시맨틱 검색

**주요 메서드:**

| 메서드 | 입력 | 출력 |
|--------|------|------|
| `init_index()` | - | `bool` |
| `index_categories()` | - | `int` (인덱싱 수) |
| `search()` | `query: str` | `List[CategorySearchResult]` |
| `find_best_category()` | `question: str` | `(major_id, category_id, confidence)` |

**CategorySearchResult:**
```python
@dataclass
class CategorySearchResult:
    category_id: int
    major_id: int
    major_name: str
    sub_name: str
    similarity: float
    keywords: List[str]
```

**컬렉션:** "categories" (메타데이터 포함)

**의존성:**
- `chromadb`
- `app.data.category_seed` - 카테고리 데이터

**싱글톤:** `category_rag`

**유틸리티 함수:** `init_category_rag()`

---

### 6. LLMService (`llm_service.py`)

**역할:** LLM을 통한 어투 변환 (Ollama 연동)

**원칙:**
- **운세 내용 생성 금지** (주어진 데이터만 재표현)
- 어투 변환만 담당
- 환각(Hallucination) 방지 우선

**입출력:**

```python
@dataclass
class ToneTransformInput:
    user_question: str      # 사용자 질문
    period: str            # daily/weekly/monthly/yearly
    category_name: str     # "재물운 > 주식"
    original_text: str     # 효사 원문 (한자)
    original_meaning: str  # 직역 (한글)
    core_message: str      # 핵심 메시지
    caution: str          # 주의사항
    base_text: str        # 기본 해석

@dataclass
class ToneTransformOutput:
    transformed_text: str  # 150자 내외 한국어
    used_llm: bool        # LLM 사용 여부
    fallback_reason: str  # 미사용 사유
```

**지원 스타일:**

| 스타일 | 설명 | 어미 |
|--------|------|------|
| `oracle` | 점술가 (기본) | ~이니라, ~하라, ~느니라 |
| `warm` | 친근한 선배 | 자연스러운 조언 |
| `formal` | 격식 있는 | 존댓말, 신중 |
| `casual` | 편한 친구 | 반말, 가볍게 |
| `mz` | MZ세대 트렌드 | 최신 표현 |
| `senior` | 중장년층 | 안정적 표현 |

**점술가 스타일 규칙:**
```
필수 어미: ~이니라, ~하라, ~느니라, ~이로다
화자: 하늘, 운명, 괘 등 초월적 시점
금지: "것 같아요", "수도 있어요", "힘드시죠", "괜찮아요"
금지: 이모지, 상담사 어조 (공감/위로)
```

**LLM 프롬프트 구조:**
```
1. 역할 정의 ("주역 해석 어투 변환 전문가")
2. 절대 규칙 ("새 의미 생성 금지", "원본 데이터만 사용")
3. 길이/기간 지침
4. 스타일 가이드 (+ 점술가 규칙)
5. 원본 데이터 (효사, 직역, 메시지, 주의, 기본 해석)
6. 사용자 질문/카테고리
7. 출력 형식 (150자 내외)
```

**폴백 메커니즘:**
- LLM 호출 실패 → `base_text` 반환
- 입력 검증 실패 → `base_text` 반환
- 출력 검증 실패 → `base_text` 반환

**주요 메서드:**

| 메서드 | 설명 |
|--------|------|
| `transform_tone()` | 주요 메서드 (ToneTransformInput 필요) |
| `transform_style()` | 하위 호환성 (레거시) |
| `classify_question()` | 질문 카테고리 분류 (보조) |
| `health_check()` | Ollama 서버 상태 확인 |

**Ollama 설정:**
```
BASE_URL: settings.OLLAMA_BASE_URL
MODEL: settings.OLLAMA_MODEL
TEMPERATURE: 0.5 (낮춤, 환각 방지)
TOP_P: 0.8
NUM_PREDICT: 200
REPEAT_PENALTY: 1.1
TIMEOUT: 30초
```

**의존성:**
- `httpx` - 비동기 HTTP 클라이언트
- `app.services.llm_validator` - 출력 검증
- `app.core.config` - Ollama 설정

**싱글톤:** `llm_service`

---

### 7. LLMResponseValidator (`llm_validator.py`)

**역할:** LLM 출력 검증 (환각 방지, 품질 확보)

**검증 항목:**

| 검증 | 기준 | 실패 시 |
|------|------|--------|
| 길이 | 30-300자 | FAIL_LENGTH |
| 금지 패턴 | 불확실/구체적 표현 | FAIL_FORBIDDEN |
| 키워드 | 원본 키워드 50% 이상 | FAIL_KEYWORD |
| 포맷 | 문장 종결 + 운세 표현 | FAIL_FORMAT |
| 점술가 어조 | 필수 어미 + 금지 표현 | FAIL_ORACLE_TONE |

**금지 패턴 (환각 의심):**
```
- "제가 생각하기에"
- "추측하건대"
- "아마도 ~ 것 같습니다"
- "일반적으로", "보통은"
- "전문가에 따르면"
- "2024년", "50,000원", "75%" (구체적 수치)
```

**점술가 금지 패턴:**
```
불확실: "것 같아요", "수도 있어요", "모르겠"
상담사: "힘드시죠", "괜찮아요", "응원할게요"
제안형: "해보세요", "추천드려요", "고려해"
현대적: "느껴져요", "드려요", "될 거예요"
이모지: 모든 이모지 금지
```

**점술가 필수 어미:**
- ~이니라, ~느니라, ~하라, ~이로다, ~리라, ~지니라, ~이니

**ValidationReport 구조:**
```python
@dataclass
class ValidationReport:
    is_valid: bool                    # 통과 여부
    result: ValidationResult          # PASS/FAIL_*
    score: float                      # 0.0-1.0
    details: str                      # 상세 이유
    suggestions: List[str]            # 개선 제안
```

**주요 메서드:**

| 메서드 | 입력 | 용도 |
|--------|------|------|
| `validate()` | response, original_text, keywords | 종합 검증 |
| `validate_oracle_tone()` | response | 점술가 어조 검증 |
| `validate_with_oracle()` | response, ... | 점술가 포함 종합 |
| `extract_keywords()` | text | 키워드 추출 |

**검증 점수 계산:**
```
종합 점수 = (길이 + 금지패턴 + 키워드 + 포맷) / 4

합격 기준:
- 평균 점수 >= 0.6 AND
- 키워드 점수 >= 0.3
```

**점술가 어조 점수:**
```
기본: 1.0
- 금지 표현 매칭: -0.15 (최대 여러 번)
- 어미 부족: -0.2 (30% 미만)
- 어미 우수: +0.1 (70% 이상, 보너스)

합격: >= 0.5
```

**의존성:**
- `re` - 정규표현식

**싱글톤:** `llm_validator`

---

## 전체 플로우

### 점술 요청의 전체 파이프라인

```
1. 사용자 질문 입력
   ↓
2. CategoryMatcher.match_question()
   질문 → (major_id, category_id, confidence)
   ↓
3. DivinationService.get_divination_with_category()
   카테고리 + 기간 → DivinationResult
     - hexagram_number (1-64)
     - yao_position (1-6)
     - reading_method
   ↓
4. RAGService 또는 데이터 로드
   → hex_data (괘/효 정보)
   ↓
5. OracleGenerator.generate()
   → OracleOutput (5단계 해석)
   ↓
6. LLMService.transform_tone()
   OracleOutput + 스타일 → ToneTransformOutput
   ↓
7. LLMResponseValidator.validate()
   출력 검증
   ↓
8. 최종 응답 반환
```

### 의존성 그래프

```
API 계층
   ↓
OracleGenerator ← LLMService ← LLMResponseValidator
   ↑               ↓
   |          Ollama 서버
   |
DivinationService ← RAGService, RAGPipeline
   ↑                    ↓
   |               ChromaDB
   |
CategoryMatcher ← CategoryRAGPipeline
   ↑                    ↓
   |               ChromaDB
   |
시드 데이터
(category_seed.py, yao_complete.py, hexagram_seed.py 등)
```

---

## 데이터 흐름

### 1. 카테고리 매칭 흐름

```
질문: "주식을 사도 될까요?"
   ↓
[키워드 추출]
"주식" → 카테고리 검색
   ↓
[점수 계산]
major_keywords: ["주식", "투자", "재테크", ...]
가중치 적용 (길이 보너스)
   ↓
[매칭 결과]
(8, 25, 0.85)  # major_id=8(재물운), category_id=25(주식/증권), confidence=85%
```

### 2. 점술 흐름

```
algorithm="uniform"
   ↓
[운발수 산출]
luck_number = 1~10
   ↓
[가중치 조정]
fortune_score에 따른 배율 적용
   ↓
[384효 선택]
weighted_random(modified_weights)
yao_id = 1~384
   ↓
[괘 계산]
hexagram = (yao_id - 1) // 6 + 1  → 1~64
yao_position = (yao_id - 1) % 6 + 1  → 1~6
   ↓
[결과]
DivinationResult(
  hexagram_number=15,
  yao_position=2,
  reading_method=ReadingMethod(...)
)
```

### 3. 해석 생성 흐름

```
DivinationResult
   ↓
[데이터 로드]
hex_data = YAO_DATA[(hexagram_number, yao_position)]
   ↓
[매트릭스 조회]
action_guidance = get_action_guidance(yao_direction, question_direction)
   ↓
[5단계 생성]
stage_1 = 괘/효 선언
stage_2 = 핵심 해석 (방향 기반)
stage_3 = 맥락 적용 (카테고리 + 질문 방향)
stage_4 = 행동 지침 (매트릭스 + 심리 유형)
stage_5 = 마무리 경구
   ↓
[조합]
full_text = combine(stages)
length > 250자면 축약
   ↓
[결과]
OracleOutput(
  full_text="...",
  stage_1_declaration="...",
  ...
  compatibility_score=0.85
)
```

### 4. 어투 변환 흐름

```
OracleOutput + style="oracle"
   ↓
[입력 검증]
8개 필드 필수 확인
   ↓
[프롬프트 구성]
"당신은 주역 해석의 어투만 변환하는 전문가입니다."
+ 절대 규칙
+ 스타일 가이드
+ 원본 데이터 (효사, 직역, 메시지, 주의, 기본 해석)
   ↓
[LLM 호출]
POST /api/generate (Ollama)
temperature=0.5, num_predict=200
   ↓
[출력 검증]
1. 길이: 30-300자
2. 금지 패턴: 환각 의심 표현 확인
3. 키워드: 원본 키워드 포함율 >= 50%
4. 포맷: 문장 종결 + 운세 표현
5. 점술가 어조: 필수 어미 30% 이상
   ↓
[결과]
ToneTransformOutput(
  transformed_text="그대에게 내려진 괘는...",
  used_llm=True,
  fallback_reason=""
)
또는 검증 실패 시
ToneTransformOutput(
  transformed_text=base_text,  # 폴백
  used_llm=False,
  fallback_reason="출력 검증 실패"
)
```

---

## 설정 및 초기화

### 앱 시작 시 초기화 순서

```python
# main.py 또는 lifespan
from app.services import (
    category_matcher,
    category_rag,
    rag_service,
    divination_service,
    oracle_generator,
    llm_service
)

# 1. RAG 초기화
await category_rag.init_index()
await category_rag.index_categories()

await rag_service.init_index()
await rag_service.index_hexagrams(SAMPLE_DATA)

# 2. CategoryMatcher 로드
category_matcher._ensure_loaded()

# 3. DivinationService (가중치 테이블)
divination_service._build_fortune_weights()

# 4. LLM 상태 확인
is_healthy = await llm_service.health_check()
```

### 환경 변수

```env
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral  # 또는 다른 모델

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db

# 타임아웃
OLLAMA_TIMEOUT=30
```

---

## 에러 처리

### 각 서비스별 에러 처리

| 서비스 | 에러 상황 | 처리 방식 |
|--------|---------|---------|
| CategoryMatcher | 매칭 실패 | 기타(major_id=9) 반환 |
| DivinationService | 데이터 오류 | 폴백 알고리즘 사용 |
| OracleGenerator | 데이터 누락 | 기본값 사용 |
| RAGService | 인덱싱 실패 | 빈 결과 반환 |
| LLMService | Ollama 미응답 | base_text 반환 |
| LLMValidator | 검증 실패 | fallback_reason 기록 |

### 로깅

```python
import logging

logger = logging.getLogger(__name__)

# 주요 로그 포인트
logger.info(f"[RAG] ChromaDB 초기화: {persist_dir}")
logger.error(f"[RAG] 초기화 실패: {e}")
logger.warning(f"[LLM] 응답 검증 실패: {report.result.value}")
```

---

## 테스트 및 검증

### 단위 테스트 예시

```python
# CategoryMatcher
major_id, cat_id, conf = category_matcher.match_question("주식 투자하면 어떨까요?")
assert major_id == 8  # 재물운
assert cat_id in range(20, 30)  # 재물 범위
assert conf >= 0.1

# DivinationService
result = divination_service.uniform_384_divination()
assert 1 <= result.hexagram_number <= 64
assert 1 <= result.reading_method.yao_position <= 6

# OracleGenerator
output = oracle_generator.generate(oracle_input)
assert len(output.full_text) <= 300
assert "이니라" in output.full_text or "하라" in output.full_text
```

### 통합 테스트

```python
# 전체 파이프라인
question = "연애에서 고백해도 될까요?"
major_id, cat_id, _ = category_matcher.match_question(question)
divination = divination_service.uniform_384_divination()

# 실제 API 호출 테스트
response = await client.post(
    "/api/divination",
    json={"question": question}
)
assert response.status_code == 200
assert "full_text" in response.json()
```

---

## 성능 고려사항

### 병목 구간

| 구간 | 소요시간 | 최적화 |
|------|---------|-------|
| CategoryMatcher | ~5ms | 인메모리 캐시 |
| DivinationService | ~1ms | O(1) 룩업 |
| RAGService 검색 | ~50ms | ChromaDB 인덱싱 |
| LLMService (Ollama) | ~1-5초 | 비동기 처리 |
| Validation | ~10ms | 정규식 최적화 |

### 캐싱 전략

```python
# CategoryMatcher: 시드 데이터 캐싱
category_matcher._categories = [...]  # lazy load

# RAGService: ChromaDB 자동 캐싱
# (duckdb+parquet 백엔드)

# LLMService: 프롬프트 재사용
# (같은 스타일 반복 호출 시)
```

---

## 확장 포인트

### 향후 개선 계획

1. **CategoryMatcher**
   - DB 연동 (현재: 시드 데이터만)
   - 사용자 커스텀 카테고리 지원

2. **DivinationService**
   - 사용자 지정 알고리즘
   - A/B 테스트 플랫폼

3. **LLMService**
   - 로컬 LLM → 클라우드 LLM 전환
   - 다중 언어 지원
   - 사용자 정의 스타일

4. **RAGService**
   - 재임베딩 (더 나은 모델)
   - 동적 인덱스 갱신

---

## 참고 자료

- **주역 기초:** `/docs/` 폴더의 주역 설명
- **데이터 스키마:** `/backend/app/data/` 폴더
- **API 사용법:** `/backend/app/routers/` 폴더

---

**마지막 수정:** 2026-01-01
**담당자:** Claude Code

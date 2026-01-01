# 데이터 스키마 상세 가이드

운세봇 데이터 시드 파일들의 상세 구조 및 사용법

---

## 📚 Python 시드 파일 목록

| 파일명 | 크기 | 역할 | 주요 데이터 |
|--------|------|------|-----------|
| hexagram_complete.py | 27KB | 64괘 기본 정보 | TRIGRAM_INFO, HEXAGRAM_DATA |
| yao_complete.py | ~187KB | 384효 전체 해석 | YAO_DATA (384개) |
| category_seed.py | 44KB | 250개 카테고리 | MAJOR_CATEGORIES, CATEGORY_DATA |
| psychology_patterns.py | 18KB | 심리 분석 | PsychologyType, QUESTION_PATTERNS |
| fortune_direction.py | 18KB | 운세 등급 시스템 | FortuneLevel, ACTION_TEMPLATES |
| yao_direction.py | 8KB | 효 방향 (3가지) | YaoDirection |
| question_direction.py | 13KB | 질문 방향 (4가지) | QuestionDirection |
| interpretation_matrix.py | 13KB | 결합 매트릭스 (12가지) | ActionGuidance |
| daily_fortune_seed.py | 22KB | 일간운세 1,152개 | DAILY_FORTUNE |
| interpretations_seed.py | 38KB | 100개 해석 샘플 | INTERPRETATIONS_DATA |

---

## 1. hexagram_complete.py - 64괘 완전 데이터

### 역할
- 64개 괘와 8개 소성괘(Trigram) 기본 정보 관리
- 점술 결과의 괘 정보 조회
- 상괘/하괘 매핑

### 핵심 데이터 구조

```python
# 8개 소성괘(Trigram) 정보
TRIGRAM_INFO: Dict[int, Dict] = {
    0: {
        "name_ko": "곤",
        "name_hanja": "坤",
        "symbol": "☷",
        "nature": "땅",
        "attribute": "순종"
    },
    1: {
        "name_ko": "진",
        "name_hanja": "震",
        "symbol": "☳",
        "nature": "우레",
        "attribute": "동"
    },
    # ... (2-7까지 추가)
    7: {
        "name_ko": "건",
        "name_hanja": "乾",
        "symbol": "☰",
        "nature": "하늘",
        "attribute": "건"
    }
}

# 64개 괘 정보
HEXAGRAM_DATA: Dict[int, dict] = {
    1: {
        "number": 1,
        "name_ko": "건",
        "name_hanja": "乾",
        "name_full": "건위천",
        "upper_trigram": 7,  # 상괘 (건)
        "lower_trigram": 7,  # 하괘 (건)
        "gua_ci": "원형이정... (괘의 전체 해석)"
    },
    # ... (2-64까지)
}
```

---

## 2. yao_complete.py - 384효 완전 데이터

### 역할
- 64괘 × 6효 = 384개 효(變爻) 해석
- 각 효의 원문, 의미, 점수, 카테고리 제공

### 핵심 데이터 구조

```python
YAO_DATA: Dict[Tuple[int, int], Dict[str, Any]] = {
    # (괘번호, 효위치) → 효사 데이터
    (1, 1): {
        "name": "초구",
        "text_hanja": "潛龍勿用",
        "text_kr": "잠긴 용이니 쓰지 말라",
        "interpretation": "아직 때가 아닙니다. 잠룡처럼 실력을...",
        "fortune_score": 35,      # 0-100
        "fortune_category": "평", # 7가지 중 1개
        "keywords": ["잠룡", "기다림", "준비", "인내"]
    },
    (1, 2): {
        "name": "구이",
        "text_hanja": "見龍在田 利見大人",
        "text_kr": "나타난 용이 밭에 있으니...",
        "interpretation": "능력을 드러낼 때입니다...",
        "fortune_score": 75,
        "fortune_category": "길",
        "keywords": ["현룡", "귀인", "발전", "만남"]
    },
    # ... (384개)
}
```

### 효 이름 규칙

**양효(陽 = 9)**
- 초구, 구이, 구삼, 구사, 구오, 상구

**음효(陰 = 6)**
- 초육, 육이, 육삼, 육사, 육오, 상육

### 필드 설명

| 필드 | 타입 | 범위 | 설명 |
|------|------|------|------|
| name | str | - | 효 이름 (초구, 구이 등) |
| text_hanja | str | - | 한자 원문 |
| text_kr | str | - | 한글 직역 |
| interpretation | str | - | 현대적 해석 |
| fortune_score | int | 0-100 | 운세 점수 |
| fortune_category | str | 7가지 | 대길/길/소길/평/소흉/흉/대흉 |
| keywords | List[str] | 3-5개 | 해당 효의 키워드 |

---

## 3. category_seed.py - 250개 카테고리

### 역할
- 질문 분류 체계 제공 (9대분류 × 250소분류)
- 사용자 질문의 카테고리 매칭

### 핵심 데이터 구조

```python
MAJOR_CATEGORIES: Dict[int, Dict] = {
    1: {"name": "재물", "icon": "💰"},
    2: {"name": "직업", "icon": "💼"},
    3: {"name": "학업", "icon": "📚"},
    4: {"name": "연애", "icon": "💕"},
    5: {"name": "대인", "icon": "👥"},
    6: {"name": "건강", "icon": "🏥"},
    7: {"name": "취미", "icon": "🎮"},
    8: {"name": "운명", "icon": "✨"},
    9: {"name": "기타", "icon": "🔮"}
}

CATEGORY_DATA: List[Dict] = [
    {
        "id": 1,              # 전체 카테고리 ID (1-250)
        "major_id": 1,        # 대분류 ID (1-9)
        "sub_name": "주식/증권",  # 소분류명
        "keywords": ["주식", "증권", "삼성", ...],  # 매칭 키워드
        "age_target": "전연령"  # 타겟: 전연령/MZ/중장년
    },
    # ... (250개)
]
```

### 9대분류별 소분류 개수

- 재물(1): 35개 - 주식, 코인, 부동산, 대출, 저축, 부업, 로또, 펀드, 연금, 보험, 세금, 상속 등
- 직업(2): 35개 - 이직, 취업, 승진, 퇴사, 창업, 연봉협상, 동료/상사, 스트레스 등
- 학업(3): 25개 - 수능, 자격증, 공무원, 편입, 학점, 어학 등
- 연애(4): 40개 - 썸, 고백, 재회, 결혼, 이별, 소개팅, 불륜, 권태기 등
- 대인(5): 25개 - 친구, 부모/가족, 직장동료, 상사 등
- 건강(6): 20개 - 신체건강, 정신건강, 수술, 질병 등
- 취미(7): 25개 - 스포츠, 게임, 여행, 음악 등
- 운명(8): 20개 - 인생목표, 전생, 길흉, 미래 등
- 기타(9): 5개 - 법률/분쟁 등

---

## 4. psychology_patterns.py - 심리 분석

### 역할
- 사용자 질문에서 숨겨진 심리/욕구 파악
- 조언 톤과 초점 결정

### 8가지 심리 유형

```python
class PsychologyType(Enum):
    CONFIRMATION = "confirmation"   # "해도 될까요?" - 확신 필요
    ANXIETY = "anxiety"             # "잘 될까요?" - 불안감
    DECISION = "decision"           # "뭐가 나을까?" - 결정 지지
    HOPE = "hope"                   # "운 좋을까?" - 희망 추구
    CONTROL = "control"             # "피할 수 있을까?" - 통제감
    VALIDATION = "validation"       # "내가 맞나요?" - 자기 검증
    AVOIDANCE = "avoidance"         # "피해야 할까?" - 회피 심리
    CONNECTION = "connection"       # "저 사람이 날?" - 관계 욕구
```

### PsychologyProfile 구조

```python
@dataclass
class PsychologyProfile:
    primary_type: PsychologyType        # 주요 심리 유형
    secondary_type: Optional[...] = None
    confidence: float = 0.0             # 신뢰도 (0.0~1.0)
    hidden_need: str = ""               # 숨겨진 욕구
    advice_tone: str = ""               # 조언 톤
    advice_focus: str = ""              # 조언 초점
```

### 질문 패턴 매핑 (샘플)

```python
QUESTION_PATTERNS: Dict[str, Dict] = {
    "해도 될까요": {
        "type": PsychologyType.CONFIRMATION,
        "hidden_need": "이미 마음은 정해졌지만 확신 필요",
        "advice_tone": "지지적, 용기 부여",
        "advice_focus": "결정에 대한 긍정적 확인"
    },
    "잘 될까요": {
        "type": PsychologyType.ANXIETY,
        "hidden_need": "불확실한 미래에 대한 안심",
        "advice_tone": "따뜻한 위로, 희망적",
        "advice_focus": "긍정적 가능성 + 준비 방법"
    },
    # ... (40+ 패턴)
}
```

---

## 5. fortune_direction.py - 운세 등급 시스템

### 역할
- 운세 점수를 7가지 등급으로 분류
- 각 등급에 해당하는 행동 지침 제공

### 7가지 운세 등급

```python
class FortuneLevel(Enum):
    GREAT_FORTUNE = "대길"      # 90-100점 → 적극 행동
    FORTUNE = "길"              # 75-89점  → 적극 행동
    SMALL_FORTUNE = "소길"      # 60-74점  → 중도 행동
    NEUTRAL = "평"              # 45-59점  → 중도 행동
    SMALL_MISFORTUNE = "소흉"   # 30-44점  → 소극 행동
    MISFORTUNE = "흉"           # 15-29점  → 소극 행동
    GREAT_MISFORTUNE = "대흉"   # 0-14점   → 후퇴
```

### 행동 지침 (ActionDirection)

```python
class ActionDirection(Enum):
    AGGRESSIVE = "적극"  # "나아가라", "행하라"
    MODERATE = "중도"    # "신중하게", "지켜보라"
    PASSIVE = "소극"     # "기다리라", "멈춰라"
    RETREAT = "후퇴"     # "물러나라", "포기도 고려"
```

### 행동 지침 템플릿

```python
ACTION_TEMPLATES: Dict[ActionDirection, Dict] = {
    ActionDirection.AGGRESSIVE: {
        "direction_intro": [
            "하늘이 길을 열어주는 때로다.",
            "운의 흐름이 그대 편이니라."
        ],
        "action_guide": [
            "적극적으로 나아가라. 지금이 때니라.",
            "주저하지 말고 행하라. 하늘이 돕느니라."
        ],
        "caution": [
            "다만, 교만하지는 말라.",
            "너무 욕심내지는 말라."
        ],
        "keywords": ["나아가라", "행하라", "적극적으로"]
    },
    # ... (MODERATE, PASSIVE, RETREAT)
}
```

---

## 6. yao_direction.py - 효 방향 (3가지)

### 역할
- 각 효의 운세 흐름 방향 정의
- 점수에 따른 방향 분류

### 효 방향 분류

```python
class YaoDirection(Enum):
    ASCENDING = "상승"    # 점수 75-100 → 길한 운
    NEUTRAL = "정체"      # 점수 45-74  → 평탄한 운
    DESCENDING = "하강"   # 점수 0-44   → 흉한 운
```

---

## 7. question_direction.py - 질문 방향 (4가지)

### 역할
- 사용자 질문의 의도 분류
- 행동 지침 결정 기준

### 질문 방향 분류

```python
class QuestionDirection(Enum):
    START = "시작"      # "시작해도 될까?" - 새로운 것
    MAINTAIN = "유지"    # "계속해도 될까?" - 진행 중인 것
    CHANGE = "변화"     # "바꿔도 될까?" - 현상 변화/도약
    END = "종료"        # "끝내도 될까?" - 종료/정리
```

### 키워드 감지

- START: 시작, 새로, 도전, 나아가다 등
- MAINTAIN: 계속, 유지, 진행 중, 지키다 등
- CHANGE: 바꾸, 도약, 전환, 변경 등
- END: 그만, 끝내, 종료, 정리, 떠나다 등

---

## 8. interpretation_matrix.py - 결합 매트릭스 (12가지)

### 역할
- 효 방향(3) × 질문 방향(4) = 12가지 조합
- 각 조합에 대한 최적 행동 지침 제공

### ActionGuidance 구조

```python
@dataclass
class ActionGuidance:
    action: str                  # "나아가라" (핵심 지침)
    description: str             # "하늘의 기운이 상승하고..."
    oracle_phrase: str           # "때가 무르익었느니라..."
    caution: str                # "다만 겸손을 잃지 말라"
    fortune_tendency: str        # "길/흉/중립"
    compatibility_score: float   # 호환도 (0.0~1.0)
```

### 12가지 조합 (호환도 포함)

| 효방향 | 질문방향 | 행동 | 호환도 |
|--------|---------|------|--------|
| 상승 | 시작 | 나아가라 | 1.0 ⭐ |
| 상승 | 유지 | 키워가라 | 0.85 |
| 상승 | 변화 | 도약하라 | 0.95 |
| 상승 | 종료 | 아직아니다 | 0.3 |
| 정체 | 시작 | 기다리라 | 0.7 |
| 정체 | 유지 | 지키라 | 0.8 |
| 정체 | 변화 | 때를봐라 | 0.5 |
| 정체 | 종료 | 머물러라 | 0.6 |
| 하강 | 시작 | 멈춰라 | 0.2 ❌ |
| 하강 | 유지 | 돌아보라 | 0.5 |
| 하강 | 변화 | 움직이지말라 | 0.1 ❌ |
| 하강 | 종료 | 떠나라 | 0.7 |

---

## 9. daily_fortune_seed.py - 일간운세

### 역할
- 384효 × 3변형 = 1,152개 일간운세 콘텐츠 제공
- 다양한 상황별/톤별 해석 제공

### 데이터 구조

```python
DAILY_FORTUNE: Dict[Tuple[int, int], List[Dict]] = {
    (1, 1): [
        {
            "headline": "때를 기다리는 지혜가 필요한 날",
            "body": "조급함이 오히려 일을 그르친다. 오늘은 새 시작보다..."
        },
        {
            "headline": "숨은 실력을 기르는 하루",
            "body": "드러나려 하지 마라. 지금은 조용히 준비하는 시간이다..."
        },
        {
            "headline": "인내가 최고의 전략인 날",
            "body": "서두르면 손해다. 마음을 가라앉히고 차분히 상황을..."
        }
    ],
    # ... (384 × 3 = 1,152개)
}
```

### 변형 테마 (3가지)

1. **v1**: 일/직장/성취 중심
   - 업무, 성과, 노력, 경력 발전 관련 메시지

2. **v2**: 관계/소통 중심
   - 인간관계, 대화, 공감, 협력 관련 메시지

3. **v3**: 내면/선택/마음 중심
   - 마음가짐, 선택, 인내, 성찰 관련 메시지

### 콘텐츠 작성 원칙

- 괘 이름 절대 사용 금지
- 철학적/종교적 표현 최소화
- 즉시 이해 가능한 쉬운 표현
- 구체적 행동 지침 포함
- Headline: 15-25자
- Body: 50-70자, 2문장

---

## 10. interpretations_seed.py - 100개 해석 샘플

### 역할
- 효사 × 카테고리 결합 해석 제공
- LLM 확장의 기반 데이터

### 데이터 구조

```python
INTERPRETATIONS_DATA: List[Dict] = [
    {
        "hexagram_id": "1-1",           # (괘번호-효위치)
        "category_id": 1,               # 카테고리 ID
        "period": "daily",              # 주기
        "base_text": "잠룡물용...",      # 기본 해석
        "tone_hint": "단호"             # 톤 힌트
    },
    {
        "hexagram_id": "1-5",
        "category_id": 1,
        "period": "daily",
        "base_text": "비룡재천. 강한 상승 기운이...",
        "tone_hint": "희망적"
    },
    # ... (100+개)
]
```

### 주기별 분류

- daily: 하루
- weekly: 한 주
- monthly: 한 달
- yearly: 한 해

### 톤 힌트 분류

- **단호**: 명확하고 직접적인 지시
- **위로**: 따뜻하고 공감적인 표현
- **현실적**: 객관적이고 실용적인 조언
- **희망적**: 긍정적이고 고무적인 메시지
- **중립**: 균형잡힌 객관적 해석

---

## 🔗 통합 데이터 흐름

```
사용자 질문 입력
  ↓
[1] 카테고리 추론
  └─ category_seed.py: keywords 매칭 → category_id

[2] 심리 분석
  └─ psychology_patterns.py: QUESTION_PATTERNS → PsychologyProfile

[3] 주역 해석
  ├─ hexagram_complete.py: 괘 기본 정보 로드
  └─ yao_complete.py: 효 데이터 (운세 점수, 효사) 로드

[4] 질문 의도 분류
  └─ question_direction.py: START/MAINTAIN/CHANGE/END 분류

[5] 효 방향 확인
  └─ yao_direction.py: ASCENDING/NEUTRAL/DESCENDING 판별

[6] 결합 지침 생성
  └─ interpretation_matrix.py: (효방향, 질문방향) → ActionGuidance

[7] 운세 해석
  └─ fortune_direction.py: fortune_score → FortuneLevel → ActionDirection

[8] 일간운세 선택
  └─ daily_fortune_seed.py: 변형(v1/v2/v3) 중 1개 선택

[9] 카테고리별 맞춤
  └─ interpretations_seed.py: 기본 해석 + 심리 톤 적용

[10] 최종 응답 구성
  └─ LLM 확장: 일간운세 + 맞춤 해석 + 조언 생성
```

---

**최종 업데이트**: 2026-01-01
**데이터 버전**: v1.0
**담당**: Backend Team

# 주역 점술 서비스 데이터 인덱스

> 최종 업데이트: 2024-12-31
> 총 질문 데이터: 9,491개 | 키워드: 9,975개 | 카테고리: 9개

---

## 1. 데이터 자산 요약

| 구분 | 파일 수 | 용량 | 항목 수 |
|------|---------|------|---------|
| 질문 데이터 (TXT) | 19개 | 520KB | 9,491개 |
| 통합 JSON | 3개 | ~2MB | 9,491개 질문 + 9,975개 키워드 |
| 백엔드 정적 데이터 | 10개 | 15.5MB | 64괘 + 384효 + 250카테고리 |

---

## 2. 질문 데이터 인덱스

### 2.1 원본 파일 (19개)

```
d:\cbt\yu-1\
├── career_questions_500.txt        # 직업 > 취업/면접 (500개)
├── questions_career_501_1000.txt   # 직업 > 이직/승진 (500개)
├── questions_money_500.txt         # 재물 > 재물운 (500개)
├── questions_business_500.txt      # 재물 > 창업/사업 (500개)
├── investment_questions_501_1000.txt # 재물 > 투자 (498개)
├── questions_housing_500.txt       # 재물 > 부동산/이사 (500개)
├── questions_study_500.txt         # 학업 > 학업/시험 (500개)
├── questions_love_marriage_500.txt # 연애 > 연애 (500개)
├── questions_love_marriage_501_1000.txt # 연애 > 결혼 (500개)
├── questions_relationships_500.txt # 대인 > 인간관계 (500개)
├── questions_social_500.txt        # 대인 > 사회생활 (500개)
├── health_family_questions_500.txt # 건강 > 건강/가족 (500개)
├── questions_parenting_500.txt     # 건강 > 육아/부모 (494개)
├── questions_hobby_500.txt         # 취미 > 취미/여가 (500개)
├── questions_travel_500.txt        # 취미 > 여행 (500개)
├── questions_destiny_500.txt       # 운명 > 운명/전생 (500개)
├── questions_daily_500.txt         # 운명 > 일상선택 (500개)
├── questions_legal_500.txt         # 기타 > 법률/분쟁 (500개)
└── questions_500.txt               # 운명 > 오늘운세 (499개)
```

### 2.2 통합 JSON 파일

| 파일 | 경로 | 설명 |
|------|------|------|
| `questions_unified.json` | `backend/app/data/` | 9,491개 질문 통합 |
| `keywords_index.json` | `backend/app/data/` | 9,975개 키워드 역인덱스 |
| `category_questions_map.json` | `backend/app/data/` | 카테고리별 질문 매핑 |

### 2.3 카테고리별 질문 수

| ID | 카테고리 | 질문 수 | 관련 파일 |
|----|----------|---------|-----------|
| 1 | 재물 | 1,998개 | money, business, investment, housing |
| 2 | 직업 | 1,000개 | career, career_501 |
| 3 | 학업 | 500개 | study |
| 4 | 연애 | 1,000개 | love_marriage, love_marriage_501 |
| 5 | 대인 | 1,000개 | relationships, social |
| 6 | 건강 | 994개 | health_family, parenting |
| 7 | 취미 | 1,000개 | hobby, travel |
| 8 | 운명 | 1,499개 | destiny, daily, questions_500 |
| 9 | 기타 | 500개 | legal |

---

## 3. 질문 데이터 스키마

### 3.1 questions_unified.json

```json
{
  "version": "1.0.0",
  "generated_at": "2024-12-31T...",
  "total_count": 9491,
  "statistics": {
    "by_category": { "재물": 1998, "직업": 1000, ... },
    "by_file": [ { "file": "...", "count": 500, "category": "..." } ]
  },
  "questions": [
    {
      "id": "Q00001",
      "text": "이번 면접에서 좋은 결과를 얻을 수 있을까요?",
      "major_category_id": 2,
      "major_category_name": "직업",
      "sub_category": "취업/면접",
      "keywords": ["면접", "결과", "합격"],
      "source_file": "career_questions_500.txt",
      "line_number": 1,
      "original_number": 1
    }
  ]
}
```

### 3.2 keywords_index.json

```json
{
  "version": "1.0.0",
  "total_keywords": 9975,
  "index": {
    "면접": ["Q00001", "Q00002", "Q00045", ...],
    "주식": ["Q01001", "Q01002", ...],
    "연애": ["Q02001", "Q02002", ...]
  },
  "stats": {
    "면접": { "count": 45, "categories": [2] },
    "주식": { "count": 120, "categories": [1] }
  }
}
```

---

## 4. 백엔드 정적 데이터

### 4.1 위치: `backend/app/data/`

| 파일 | 용량 | 설명 |
|------|------|------|
| `hexagram_complete.py` | 2.3MB | 64괘 완전 데이터 |
| `yao_complete.py` | 7.3MB | 384효 완전 데이터 |
| `category_seed.py` | 1.4MB | 250개 카테고리 + 키워드 |
| `interpretations_seed.py` | 1.2MB | 카테고리별 기본 해석 |
| `fortune_direction.py` | 600KB | 길흉/운세 방향 |
| `yao_direction.py` | 550KB | 효사 방향 (상승/정체/하강) |
| `question_direction.py` | 530KB | 질문 방향 (시작/유지/변화) |
| `interpretation_matrix.py` | 520KB | 결합 매트릭스 |
| `psychology_patterns.py` | 570KB | 8가지 심리 패턴 |
| `user_questions_seed.py` | 560KB | 사용자 질문 샘플 |

### 4.2 9대 카테고리 (category_seed.py)

| ID | 이름 | 아이콘 | 소분류 수 |
|----|------|--------|-----------|
| 1 | 재물 | 💰 | 35개 |
| 2 | 직업 | 💼 | 35개 |
| 3 | 학업 | 📚 | 25개 |
| 4 | 연애 | 💕 | 40개 |
| 5 | 대인 | 👥 | 25개 |
| 6 | 건강 | 🏥 | 30개 |
| 7 | 취미 | 🎮 | 20개 |
| 8 | 운명 | ✨ | 25개 |
| 9 | 기타 | 🔮 | 15개 |

---

## 5. API 엔드포인트

### 5.1 질문 검색 API (`/api/questions`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/questions/search?q=면접` | 키워드 검색 |
| GET | `/api/questions/category/{id}` | 카테고리별 질문 |
| GET | `/api/questions/popular?category_id=1` | 인기 질문 |
| GET | `/api/questions/random?count=5` | 랜덤 질문 |
| GET | `/api/questions/suggest?text=면접` | 자동 완성 |
| GET | `/api/questions/stats` | 통계 정보 |

### 5.2 점술 API (`/api/divination`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/divination/cast` | 점술 수행 |
| POST | `/api/divination/cast-by-question` | 질문 기반 자동 점술 |
| POST | `/api/divination/recommend-category` | 카테고리 추천 |
| GET | `/api/divination/today` | 오늘의 운세 |
| GET | `/api/divination/categories` | 대분류 목록 |

---

## 6. 프론트엔드 컴포넌트

### 6.1 질문 관련 컴포넌트

| 컴포넌트 | 경로 | 기능 |
|---------|------|------|
| `QuestionSearch` | `frontend/src/components/QuestionSearch.tsx` | 질문 검색 UI |
| `QuestionSuggestion` | `frontend/src/components/QuestionSuggestion.tsx` | AI 질문 추천 |
| `PopularQuestions` | `frontend/src/components/PopularQuestions.tsx` | 인기 질문 표시 |

### 6.2 통합 페이지

- `/divination` - 점괘 페이지 (질문 검색/추천/입력 통합)

---

## 7. 데이터 갱신 스크립트

### 7.1 질문 데이터 재생성

```bash
# 1. 질문 파싱 (TXT → JSON)
python backend/scripts/parse_questions.py

# 2. 키워드 인덱스 생성
python backend/scripts/build_index.py
```

### 7.2 출력 파일

- `backend/app/data/questions_unified.json`
- `backend/app/data/keywords_index.json`
- `backend/app/data/category_questions_map.json`

---

## 8. 키워드 TOP 20

| 순위 | 키워드 | 출현 횟수 |
|------|--------|-----------|
| 1 | 지금 | 363 |
| 2 | 해야 | 362 |
| 3 | 괜찮을까요 | 233 |
| 4 | 좋을까요 | 230 |
| 5 | 있을까요 | 221 |
| 6 | 될까요 | 219 |
| 7 | 나을까요 | 218 |
| 8 | 시작 | 215 |
| 9 | 맞을까요 | 170 |
| 10 | 성공 | 158 |

---

## 9. 데이터 활용 가이드

### 9.1 질문 검색 예시

```python
# Python
import json

with open('backend/app/data/questions_unified.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 카테고리별 필터링
career_questions = [q for q in data['questions'] if q['major_category_id'] == 2]

# 키워드 검색
search_results = [q for q in data['questions'] if '면접' in q['text']]
```

### 9.2 API 호출 예시

```bash
# 질문 검색
curl "http://localhost:8000/api/questions/search?q=면접&limit=10"

# 질문 기반 자동 점술
curl -X POST "http://localhost:8000/api/divination/cast-by-question" \
  -H "Content-Type: application/json" \
  -d '{"question": "이번 면접 결과가 좋을까요?"}'
```

---

## 10. 파일 구조 요약

```
d:\cbt\yu-1\
├── docs/
│   └── DATA_INDEX.md              # 이 문서
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── divination.py      # 점술 API
│   │   │   └── questions.py       # 질문 검색 API
│   │   └── data/
│   │       ├── questions_unified.json    # 9,491개 질문
│   │       ├── keywords_index.json       # 키워드 인덱스
│   │       ├── category_questions_map.json
│   │       ├── hexagram_complete.py      # 64괘
│   │       ├── yao_complete.py           # 384효
│   │       └── category_seed.py          # 250 카테고리
│   └── scripts/
│       ├── parse_questions.py     # 질문 파싱
│       └── build_index.py         # 인덱스 생성
├── frontend/
│   └── src/
│       └── components/
│           ├── QuestionSearch.tsx
│           ├── QuestionSuggestion.tsx
│           └── PopularQuestions.tsx
└── *.txt                          # 19개 원본 질문 파일
```

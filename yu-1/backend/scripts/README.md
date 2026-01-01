# Backend Scripts Directory

데이터 처리, 생성 및 유지보수를 위한 유틸리티 스크립트 모음입니다.

## 📋 스크립트 목록

### 1. `parse_questions.py`
질문 파일을 파싱하여 통합 JSON 데이터셋을 생성합니다.

#### 기능
- **입력**: 프로젝트 루트의 19개 TXT 파일
- **출력**: `backend/app/data/questions_unified.json`
- **처리 내용**:
  - TXT 파일에서 질문 텍스트 추출 (정규표현식)
  - 한글 키워드 자동 추출 (불용어 필터링)
  - 파일별 카테고리 자동 분류
  - 고유 ID 생성 (Q00001 형식)
  - 메타데이터 생성 (출처, 행 번호, 원본 순서)

#### 사용 방법
```bash
cd backend
python scripts/parse_questions.py
```

#### 출력 예시
```
============================================================
Question Data Integration Started
============================================================
[OK] career_questions_500.txt: 500 questions
[OK] questions_career_501_1000.txt: 500 questions
[OK] questions_money_500.txt: 500 questions
...
============================================================
[DONE] Total 9491 questions integrated
[PATH] d:\cbt\yu-1\backend\app\data\questions_unified.json

[STATS] By Category:
   재물: 1998
   운명: 1499
   직업: 1000
   연애: 1000
   ...
============================================================
```

#### 주요 로직
```python
# 파일별 카테고리 매핑
FILE_CATEGORY_MAP = {
    "career_questions_500.txt": {
        "major_id": 2,
        "major_name": "직업",
        "sub_category": "취업/면접"
    },
    "questions_money_500.txt": {
        "major_id": 1,
        "major_name": "재물",
        "sub_category": "재물운"
    },
    # ... 17개 파일 더
}

# 키워드 추출 (불용어 제거)
STOPWORDS = {
    "이번", "지금", "오늘", "내일", "이", "그", "저",
    "할까요", "될까요", "있을까요", ...
}

# 질문 파턴 인식
question_pattern = re.compile(r'^Q?(\d+)[\.\)]\s*(.+[?？])\s*$')
```

#### 데이터 검증
- UTF-8 및 CP949 인코딩 자동 감지
- 중복 제거 (동일 텍스트)
- 공백/줄바꿈 정규화
- 특수문자 처리 (?, ？ 모두 지원)

#### 성능
- **처리 시간**: ~5-10초 (19개 파일, 9,491개 질문)
- **출력 파일 크기**: ~4MB (JSON)
- **메모리 사용**: ~100MB

---

### 2. `build_index.py`
질문 데이터에서 키워드 역인덱스를 생성합니다.

#### 기능
- **입력**: `backend/app/data/questions_unified.json`
- **출력**: `backend/app/data/keywords_index.json`
- **처리 내용**:
  - 각 질문의 키워드 추출
  - 역인덱스 구축 (키워드 → 질문 ID 리스트)
  - 인덱스 최적화 및 정렬
  - 색인 통계 생성

#### 사용 방법
```bash
cd backend
python scripts/build_index.py
```

#### 출력 예시
```
============================================================
Building Keyword Index
============================================================
Loading questions_unified.json...
Total questions loaded: 9491
Processing keywords...
Index generated: 9975 unique keywords
[OK] Index saved to: app/data/keywords_index.json
============================================================
```

#### 출력 데이터 구조
```json
{
  "버스": ["Q00123", "Q00456", "Q01234", ...],
  "사업": ["Q00001", "Q00234", "Q02345", ...],
  "취직": ["Q00789", "Q01111", ...],
  "결혼": ["Q02000", "Q02100", ...],
  ...
}
```

#### 주요 특징
- **O(n) 시간복잡도**: 한 번의 순회로 인덱스 생성
- **메모리 효율**: 중복 제거된 키워드만 저장
- **검색 최적화**: 정렬된 질문 ID 리스트로 빠른 검색
- **통계 추적**: 키워드별 빈도 정보 포함 가능

#### 사용 사례
1. **사용자 질문 검색**: "버스 사업" → keywords_index에서 관련 질문 조회
2. **RAG 기반 추천**: 유사 질문 검색 후 벡터 임베딩
3. **자동완성**: 사용자 입력 키워드 자동완성
4. **통계 분석**: 인기 있는 질문 키워드 추적

#### 성능
- **처리 시간**: ~2-3초
- **출력 파일 크기**: ~1.8MB (JSON)
- **인덱스 크기**: 9,975개 키워드

---

### 3. `generate_daily_fortune.py`
매일의 운세 데이터를 생성합니다.

#### 기능
- **입력**: 64괘 데이터, 384효 데이터, 카테고리 데이터
- **출력**: `backend/app/data/daily_fortune_generated.py`
- **처리 내용**:
  - 무작위 또는 날짜 기반 괘 선택
  - 각 괘에 대한 해석 생성
  - 카테고리별 운세 생성
  - 방향성(길/흉) 제시
  - 결과 집계 및 저장

#### 사용 방법
```bash
cd backend
python scripts/generate_daily_fortune.py
```

#### 출력 예시
```
============================================================
Generating Daily Fortune Data
============================================================
Date: 2025-01-01
Processing 64 hexagrams...
Processing interpretations...
Processing user questions...
[OK] Daily fortune data generated: 384 lines
[PATH] app/data/daily_fortune_generated.py
============================================================
```

#### 출력 데이터 구조
```python
DAILY_FORTUNE = {
    "date": "2025-01-01",
    "hexagram_id": 1,
    "hexagram_name": "건",
    "direction": "길",
    "main_message": "...",
    "category_fortunes": {
        "재물": {
            "hexagram": 1,
            "interpretation": "...",
            "advice": "..."
        },
        "직업": {
            "hexagram": 2,
            "interpretation": "...",
            "advice": "..."
        },
        ...
    },
    "overall_advice": "..."
}
```

#### 주요 기능
1. **날짜별 운세**: 같은 날짜에는 같은 결과 생성 (결정론적)
2. **카테고리별 운세**: 9개 대분류 각각에 대한 개별 운세
3. **방향성 제시**: 긍정(길) 또는 부정(흉) 방향성
4. **조언 포함**: 사용자 행동에 대한 구체적 조언

#### 사용 사례
1. **홈페이지 일일 운세**: 오늘의 운세 첫 화면 표시
2. **알림 서비스**: 매일 아침 운세 알림 전송
3. **캐싱**: 일일 운세 데이터 캐싱으로 DB 부하 감소
4. **통계 분석**: 주간/월간 운세 트렌드 분석

#### 구성
- **데이터 소스**: hexagram_complete.py, yao_complete.py, category_seed.py
- **타임스탐프**: 생성 시간 기록
- **버전 정보**: 데이터 버전 추적
- **메타데이터**: 처리 통계, 카운터 등

#### 실행 스케줄
```bash
# cron job 예시 (매일 00:00 UTC)
0 0 * * * cd /path/to/backend && python scripts/generate_daily_fortune.py
```

---

## 🔄 스크립트 의존성 및 실행 순서

```
1. parse_questions.py (필수 첫 실행)
   └─> questions_unified.json 생성

2. build_index.py (depends on step 1)
   └─> keywords_index.json 생성

3. generate_daily_fortune.py (선택적)
   └─> daily_fortune_generated.py 생성
```

### 초기 설정
```bash
# 1단계: 질문 데이터 파싱
python scripts/parse_questions.py

# 2단계: 키워드 인덱스 생성
python scripts/build_index.py

# 3단계: 일일 운세 생성 (선택)
python scripts/generate_daily_fortune.py
```

### 주기적 갱신
```bash
# 매주: 인덱스 재구축
python scripts/build_index.py

# 매일: 운세 생성
python scripts/generate_daily_fortune.py

# 필요 시: 질문 데이터 갱신
python scripts/parse_questions.py
```

---

## 📊 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────┐
│  TXT 파일 (19개)                        │
│  - career_questions_500.txt             │
│  - questions_money_500.txt              │
│  - health_family_questions_500.txt      │
│  - ... (16개 더)                         │
└────────────────┬────────────────────────┘
                 │
                 │ parse_questions.py
                 ▼
┌─────────────────────────────────────────┐
│  questions_unified.json                 │
│  - 9,491개 질문                         │
│  - 메타데이터                           │
│  - 카테고리 분류                        │
└────────┬────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
    build_index.py     API 직접 사용    generate_daily_fortune.py
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
│ keywords_index   │  │  Divination │  │ daily_fortune    │
│ .json            │  │  API        │  │ _generated.py    │
│ 9,975 keywords   │  │  endpoints  │  │ 384 lines        │
└──────────────────┘  └─────────────┘  └──────────────────┘
```

---

## 🧪 테스트 및 검증

### 단위 테스트
```bash
# parse_questions.py 테스트
pytest tests/test_category_seed.py -v

# build_index.py 테스트 (RAG 검증)
pytest tests/test_rag_matching.py -v

# 전체 데이터 일관성 검증
pytest tests/test_api_endpoints.py -v
```

### 수동 검증
```python
# questions_unified.json 검증
python -c "
import json
with open('app/data/questions_unified.json') as f:
    data = json.load(f)
    print(f'Total: {data[\"total_count\"]} questions')
    print(f'Categories: {len(data[\"statistics\"][\"by_category\"])}')
    print(f'Files: {len(data[\"statistics\"][\"by_file\"])}')
"

# keywords_index.json 검증
python -c "
import json
with open('app/data/keywords_index.json') as f:
    index = json.load(f)
    print(f'Total keywords: {len(index)}')
    print(f'Sample: {list(index.keys())[:10]}')
"
```

---

## ⚙️ 고급 사용법

### 1. 특정 카테고리만 파싱
```python
# scripts/parse_questions.py 수정
FILE_CATEGORY_MAP = {
    "questions_money_500.txt": {...},  # 재물만
}
```

### 2. 커스텀 불용어 추가
```python
# scripts/parse_questions.py 수정
STOPWORDS = {
    ...,  # 기존 불용어
    "커스텀_단어1", "커스텀_단어2"
}
```

### 3. 키워드 최대 개수 조정
```python
# scripts/parse_questions.py 수정
return keywords[:10]  # 원하는 개수로 변경
```

### 4. 인덱스 필터링 (선택적 키워드)
```python
# build_index.py에서 최소 빈도 필터 추가
min_frequency = 3
filtered_index = {k: v for k, v in index.items() if len(v) >= min_frequency}
```

---

## 🐛 문제 해결

### 1. 인코딩 에러
**증상**: UnicodeDecodeError
**해결**: 스크립트가 자동으로 UTF-8과 CP949를 시도합니다.
```python
# 필요 시 명시적으로 지정
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()
```

### 2. 파일을 찾을 수 없음
**증상**: FileNotFoundError
**해결**: 현재 디렉토리 확인 및 경로 지정
```bash
cd d:/cbt/yu-1
python backend/scripts/parse_questions.py
```

### 3. 메모리 부족 (큰 데이터셋)
**증상**: MemoryError
**해결**: 배치 처리로 개선
```python
# 대신 청크 단위로 처리
chunk_size = 1000
for i in range(0, len(questions), chunk_size):
    process_chunk(questions[i:i+chunk_size])
```

### 4. 느린 실행 속도
**증상**: 처리 시간 > 30초
**해결**: 병렬 처리 추가
```python
from multiprocessing import Pool
with Pool(4) as p:
    results = p.map(parse_question_file, files)
```

---

## 📈 성능 벤치마크

| 스크립트 | 입력 크기 | 처리 시간 | 출력 크기 | 메모리 |
|---------|---------|---------|---------|--------|
| parse_questions.py | 19 files | 5-10s | 4MB | 100MB |
| build_index.py | 4MB | 2-3s | 1.8MB | 50MB |
| generate_daily_fortune.py | 3 files | 1-2s | 209KB | 30MB |

---

## 📝 로깅 및 디버깅

### 상세 로깅 활성화
```bash
# DEBUG 레벨로 실행
LOGLEVEL=DEBUG python scripts/parse_questions.py
```

### 에러 로그 저장
```bash
# 에러 로그를 파일로 저장
python scripts/parse_questions.py 2> error.log
```

### 진행상황 모니터링
```python
# 스크립트 내 진행률 표시 추가
from tqdm import tqdm
for file in tqdm(FILE_CATEGORY_MAP.keys()):
    parse_question_file(file)
```

---

**마지막 업데이트**: 2025-01-01
**관리자**: Backend Team

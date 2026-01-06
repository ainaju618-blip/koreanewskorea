# 나주시 보도자료 스크래퍼 알고리즘

> **버전**: v3.0  
> **최종수정**: 2025-12-11  
> **대상 사이트**: https://www.naju.go.kr

---

## 📋 Overview

| 항목 | 값 |
|------|-----|
| **REGION_CODE** | `naju` |
| **CATEGORY_NAME** | `전남` |
| **목록 URL** | `https://www.naju.go.kr/www/administration/reporting/coverage` |

---

## 🔄 Flow (수집 흐름)

```
Phase 1: 목록 수집
   └─ URL: {LIST_URL}?page={N}
   └─ 셀렉터: table tbody tr → a (제목 링크)
   └─ 날짜 컬럼: td:nth(3)

        ↓

Phase 2: 상세 페이지 방문
   └─ URL 패턴: ?idx={게시물ID}&mode=view
   └─ 본문 추출: div.view_content 등
   └─ 이미지 추출: ybmodule.file/board_gov/www_report 경로

        ↓

Phase 3: 데이터 전송
   └─ API: /api/bot/ingest
   └─ 중복 검사: original_link 기준
```

---

## 🎯 Selectors

### 목록 페이지
```python
LIST_ROW_SELECTORS = [
    'table.list tbody tr',
    'table tbody tr',
    '.board_list tbody tr',
]
```

### 본문 페이지
```python
CONTENT_SELECTORS = [
    'div.view_content',
    'div.board_view',
    'div.bd_view',
    'article.view',
    '.content_view',
]
```

### 이미지 (나주시 특화)
```
이미지 저장 경로: /www/administration/reporting/ybmodule.file/board_gov/www_report/

예시:
https://www.naju.go.kr/www/administration/reporting/ybmodule.file/board_gov/www_report/1000x1/1765437048.png
```

---

## ⚙️ Constants

```python
REGION_CODE = 'naju'
REGION_NAME = '나주시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.naju.go.kr'
LIST_URL = 'https://www.naju.go.kr/www/administration/reporting/coverage'
```

---

## ⚠️ Special Notes

1. **이미지 URL 특이점**
   - 썸네일 경로에 `1000x1/`가 포함됨 (리사이즈 버전)
   - 원본은 확장자 직전 숫자로 구분

2. **날짜 추출**
   - 목록에서 1차 추출 후 상세 페이지에서 검증
   - 형식: `YYYY.MM.DD` → `YYYY-MM-DD`로 정규화

3. **공지 행 스킵**
   - 클래스에 `notice` 포함 시 제외

---

## 🚀 Execution

```bash
# 기본 실행 (최근 3일, 최대 10개)
python naju/naju_scraper.py

# 기간 지정
python naju/naju_scraper.py --days 7

# 수량 제한
python naju/naju_scraper.py --max-articles 5

# 테스트 모드
python naju/naju_scraper.py --days 1 --max-articles 3
```

---

## 📊 Sample Data

```json
{
  "uid": "592180",
  "title": "나주문화재단, 전남·광주 문화재단과 협력 강화",
  "date": "2025-12-11",
  "href": "https://www.naju.go.kr/www/administration/reporting/coverage?idx=592180&mode=view",
  "image_url": "https://www.naju.go.kr/www/administration/reporting/ybmodule.file/board_gov/www_report/1000x1/1765437048.png"
}
```

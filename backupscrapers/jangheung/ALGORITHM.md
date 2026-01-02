# 장흥군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 장흥군 |
| **지역 코드** | jangheung |
| **기본 URL** | https://www.jangheung.go.kr |
| **목록 페이지** | /www/organization/news/jh_news |
| **상세 페이지** | /www/organization/news/jh_news?idx={ID}&mode=view |
| **렌더링 방식** | 정적 HTML |
| **인증 필요** | 없음 |
| **총 게시물** | 16,132건 이상 (1,076페이지) |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.jangheung.go.kr/www/organization/news/jh_news
https://www.jangheung.go.kr/www/organization/news/jh_news?page={page}
```

### 상세 페이지
```
https://www.jangheung.go.kr/www/organization/news/jh_news?idx={ID}&mode=view
```

### 이미지 경로
```
https://www.jangheung.go.kr/www/organization/news/ybmodule.file/board_gov/www_jh_news/{파일ID}.jpg
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 카드형 레이아웃 (썸네일 + 제목 + 요약 + 메타정보)

**링크 선택자**:
```css
a[href*="jh_news?idx="][href*="mode=view"]
```

**추출 데이터**:
- **제목**: 카드 내 링크 텍스트
- **idx**: URL 파라미터에서 추출
- **날짜**: 카드 내 generic 요소 (YYYY-MM-DD)

### 2. 상세 페이지 파싱 (`fetch_detail`)

**본문 선택자**:
```python
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
]
```

**날짜 추출**:
- 패턴: `등록일 YYYY.MM.DD HH:MM`

**담당부서**:
- 기본값: `총무과 정보통신팀`
- 패턴: `담당부서 {부서명}`

### 3. 이미지 추출 전략

**전략 1**: ybmodule.file 경로 이미지 (장흥군 특화)
```css
img[src*="ybmodule.file"], img[src*="board_gov"]
```

**전략 2**: 일반 이미지 태그

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'jangheung'
REGION_NAME = '장흥군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jangheung.go.kr'
LIST_PATH = '/www/organization/news/jh_news'
```

---

## 🧪 테스트 명령어

```bash
# 실제 실행 (5개)
python jangheung_scraper.py --max-articles 5

# Dry-run 테스트
python jangheung_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정
python jangheung_scraper.py --start-date 2025-12-01 --max-articles 10
```

---

## 📝 특이사항

1. **카드형 레이아웃**: 썸네일 + 제목 + 요약 구조
2. **Clean URL**: RESTful 스타일 URL 구조
3. **이미지 경로**: `ybmodule.file/board_gov/www_jh_news/` 경로
4. **페이지네이션**: `page` 파라미터 (페이지당 15개)
5. **작성자 마스킹**: 작성자명이 마스킹 처리됨 (예: "인OO")
6. **이미지 핫링크**: ✅ 허용
7. **총 게시물**: 16,132건 (1,076페이지)

# 영암군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 영암군 |
| **지역 코드** | yeongam |
| **기본 URL** | https://www.yeongam.go.kr |
| **목록 페이지** | /home/www/open_information/yeongam_news/bodo/yeongam.go |
| **상세 페이지** | /home/www/open_information/yeongam_news/bodo/show/{고유ID} |
| **게시판 시스템** | GOV-Webware 기반 CMS |
| **렌더링 방식** | 정적 HTML (서버 사이드 렌더링) |
| **인증 필요** | 없음 |
| **총 게시물** | 11,199건 이상 (747페이지) |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.yeongam.go.kr/home/www/open_information/yeongam_news/bodo/yeongam.go
https://www.yeongam.go.kr/home/www/open_information/yeongam_news/bodo/yeongam.go?page={page}
```

### 상세 페이지
```
https://www.yeongam.go.kr/home/www/open_information/yeongam_news/bodo/show/{고유ID}
```
- **ID 형식**: 영문+숫자 조합의 랜덤 문자열 (예: `vfco53xukyft45urhlni`)

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 카드형 리스트 레이아웃
- 좌측 썸네일 이미지 + 우측 제목/요약/메타정보

**링크 선택자**:
```css
a[href*="/bodo/show/"]
```

**추출 데이터**:
- **제목**: 카드 내 링크 텍스트
- **고유 ID**: URL 경로에서 추출 (`/show/{ID}`)
- **날짜**: 카드 하단 `(작성자 / YYYY-MM-DD HH:mm)` 형식

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
- 패턴: `YYYY-MM-DD` (제목 아래)

**담당부서 추출**:
- 패턴: `(부서명 담당자 전화번호)`
- 예: `(서호면 담당자 061-470-6383)`

### 3. 이미지 추출 전략

**본문 내 직접 삽입 방식** (별도 첨부파일 없음)
```css
img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"]
```
- 이미지는 동일 도메인에 저장
- 배너, 로고, 아이콘 제외 필터링

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'yeongam'
REGION_NAME = '영암군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeongam.go.kr'
LIST_PATH = '/home/www/open_information/yeongam_news/bodo/yeongam.go'
DETAIL_PATH_PREFIX = '/home/www/open_information/yeongam_news/bodo/show'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python yeongam_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python yeongam_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python yeongam_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **카드형 리스트 레이아웃**: 썸네일 + 제목 + 요약 구조
2. **랜덤 문자열 ID**: 영문+숫자 조합 (nttId와 다른 형식)
3. **첨부파일 없음**: 보도자료 이미지는 본문에 직접 삽입
4. **페이지네이션**: `?page=N` 파라미터 (페이지당 15개)
5. **담당자 연락처**: 본문 하단 `<끝>` 뒤에 표기
6. **공공누리**: 제4유형 (출처표시+상업적 이용금지+변경금지)
7. **총 게시물**: 11,199건 (2014년 7월부터 현재까지)

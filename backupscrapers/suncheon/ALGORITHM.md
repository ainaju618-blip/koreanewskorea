# 순천시 보도자료 스크래퍼 알고리즘

> **버전:** v4.0  
> **최종수정:** 2025-12-12  
> **Region Code:** `suncheon`  
> **Category:** `전남`

---

## 📋 개요

순천시 홈페이지 보도자료 게시판에서 뉴스 기사를 수집하는 스크래퍼.

- **목록 URL:** `http://www.suncheon.go.kr/kr/news/0006/0001/`
- **상세 페이지 패턴:** `?mode=view&seq={ID}`
- **페이지네이션:** `?x=1&pageIndex={N}` (10개씩 표시)
- **총 기사 수:** 약 32,831건

---

## 🔄 수집 플로우

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: 목록 페이지 수집                                │
│  - 테이블에서 기사 링크 추출                               │
│  - table tr td:nth-child(2) a 셀렉터 사용                  │
│  - 제목, URL 추출                                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 2: 상세 페이지 방문                                │
│  - 테이블 구조 파싱                                        │
│  - 담당부서(1행 2열), 등록일(1행 4열)                       │
│  - 제목(2행), 본문(3행)                                    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 3: 이미지 처리 (JavaScript 다운로드 우회)           │
│  - 방법 1: Playwright expect_download()로 클릭 다운로드   │
│  - 방법 2: goDownLoad() 파라미터 파싱 → POST 요청          │
│  - Cloudinary 업로드                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 4: 서버 전송                                       │
│  - POST /api/bot/ingest                                    │
│  - 중복 체크 (original_link 기준)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 주요 셀렉터

### 목록 페이지

| 요소 | 셀렉터 |
|------|--------|
| 테이블 컬럼 | 번호 \| 제목 \| 담당부서 \| 등록일 \| 조회수 |
| 제목 링크 | `table tr td:nth-child(2) a` |
| 링크 형식 | `href="?mode=view&seq=70103"` |

**ID 추출 정규식:** `seq=(\d+)`

### 상세 페이지 (테이블 구조)

| 행 | 위치 | 내용 |
|----|------|------|
| 1행 | 2열 | 담당부서 |
| 1행 | 4열 | 등록일 (YYYY-MM-DD) |
| 2행 | td | 제목 |
| 3행 | td | 본문 (순수 텍스트) |
| 4행+ | 첨부파일 영역 | a 태그들 |

---

## 🖼️ 이미지 처리 (v4.0 핵심 변경)

### 핫링크: ❌ 불가
- JavaScript 다운로드 함수 사용: `javascript:goDownLoad('param1', 'param2', 'param3')`
- 다운로드 서버: `http://eminwon.suncheon.go.kr/emwp/jsp/ofr/FileDownNew.jsp` (POST)

### 처리 방식 (2단계 시도)

**방법 1: Playwright 클릭 다운로드**
```python
with page.expect_download(timeout=15000) as download_info:
    link_locator.click()
download = download_info.value
download.save_as(temp_path)
```

**방법 2: POST 요청 (방법 1 실패 시)**
```python
# goDownLoad() 파라미터 파싱
match = re.search(r"goDownLoad\('([^']*)','([^']*)','([^']*)'\)", onclick)
param1, param2, param3 = match.groups()

# POST 요청
response = requests.post(
    'http://eminwon.suncheon.go.kr/emwp/jsp/ofr/FileDownNew.jsp',
    headers={'Referer': 'http://www.suncheon.go.kr/kr/news/0006/0001/'},
    data={'param1': param1, 'param2': param2, 'param3': param3},
    cookies=cookies_from_page
)
```

---

## ⚙️ 상수 정의

```python
REGION_CODE = 'suncheon'
REGION_NAME = '순천시'
CATEGORY_NAME = '전남'
BASE_URL = 'http://www.suncheon.go.kr'
LIST_URL = 'http://www.suncheon.go.kr/kr/news/0006/0001/'
```

---

## 🚀 실행 방법

```bash
# 기본 실행 (최근 3일, 최대 10개)
python suncheon_scraper.py

# 최대 5개 수집
python suncheon_scraper.py --max-articles 5

# 최근 7일간 수집
python suncheon_scraper.py --days 7
```

---

## ⚠️ 특수 사항

| 항목 | 상태 |
|------|------|
| 로그인/인증 | ❌ 불필요 |
| JavaScript 동적 로딩 | ❌ 서버사이드 렌더링 |
| 본문 형식 | 순수 텍스트 (HTML 마크업 없음) |
| 이미지 | 첨부파일로만 제공 (본문 내 img 없음) |
| 첨부파일 다운로드 | JavaScript 함수 → Playwright 클릭 or POST |

---

## 📊 API 필드 매핑

| API 필드 | 추출 위치 |
|----------|-----------|
| `title` | 목록 페이지 링크 텍스트 |
| `original_link` | `?mode=view&seq={ID}` URL |
| `content` | 테이블 3행 td |
| `source` | `"순천시"` (고정) |
| `category` | `"전남"` (고정) |
| `region` | `"suncheon"` (고정) |
| `published_at` | 테이블 1행 4열 (ISO 8601) |
| `thumbnail_url` | 첨부파일 Playwright 다운로드 → Cloudinary |

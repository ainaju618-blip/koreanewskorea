# 목포시 보도자료 스크래퍼 알고리즘

> **버전:** v3.0  
> **최종수정:** 2025-12-12  
> **Region Code:** `mokpo`  
> **Category:** `전남`

---

## 📋 개요

목포시 홈페이지 보도자료 게시판에서 뉴스 기사를 수집하는 스크래퍼.

- **목록 URL:** `https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material`
- **상세 페이지 패턴:** `?idx={ID}&mode=view`
- **페이지네이션:** `?page={N}`
- **총 기사 수:** 약 10,280건 (15개씩 표시)

---

## 🔄 수집 플로우

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: 목록 페이지 수집                                │
│  - 카드형 레이아웃에서 기사 링크 추출                      │
│  - a[href*="idx="][href*="mode=view"] 셀렉터 사용          │
│  - 제목, URL, 날짜(YYYY-MM-DD) 추출                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 2: 상세 페이지 방문                                │
│  - 본문, 이미지, 날짜(YYYY.MM.DD) 추출                     │
│  - JS 기반 본문 추출 (region 내 텍스트)                    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 3: 이미지 처리                                     │
│  - 핫링크 허용됨 (외부 직접 접근 가능)                     │
│  - Cloudinary 업로드 (800px 리사이즈)                      │
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

### 목록 페이지 (카드형 레이아웃)

| 요소 | 셀렉터 |
|------|--------|
| 기사 링크 | `a[href*="idx="][href*="mode=view"]` |
| 제목 | `a[href*="mode=view"] h3` |
| 날짜 | 카드 내 `YYYY-MM-DD` 패턴 |

**ID 추출 방법:** `idx=(\d+)` 정규식

### 상세 페이지

| 요소 | 셀렉터 |
|------|--------|
| 본문 | `section[role="region"]`, `div.viewbox` |
| 날짜 | `YYYY.MM.DD` 패턴 (body 내 텍스트) |
| 담당부서 | `"담당부서"` 다음 요소 |

---

## 🖼️ 이미지 처리

### 핫링크: ✅ 허용
외부에서 이미지 URL 직접 접근 가능 (Referer 헤더 없이도 접근됨)

### 이미지 URL 패턴

**목록 페이지 썸네일 (282x160):**
```
https://www.mokpo.go.kr/build/images/{prefix1}/{prefix2}/{file_id}.jpg/282x160x85/282x160_{file_id}.jpg
```

**상세 페이지 본문 이미지 (924px):**
```
https://www.mokpo.go.kr/www/mokpo_news/press_release/ybmodule.file/board/www_report_material/{file_id}.jpg/www_report_material/924x1x100/{file_id}.jpg
```

### 처리 과정
1. 본문 내 `ybmodule.file/board/www_report_material` 경로 이미지 우선 추출
2. Cloudinary 업로드 (800px 리사이즈)
3. Cloudinary URL을 `thumbnail_url`로 저장

---

## 📅 날짜 형식

| 위치 | 형식 | 예시 |
|------|------|------|
| 목록 페이지 | YYYY-MM-DD | 2025-12-11 |
| 상세 페이지 | YYYY.MM.DD | 2025.12.11 |

**정규화:** 모두 `YYYY-MM-DD` (ISO 8601) 형식으로 변환

---

## ⚙️ 상수 정의

```python
REGION_CODE = 'mokpo'
REGION_NAME = '목포시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.mokpo.go.kr'
LIST_URL = 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material'
```

---

## 🚀 실행 방법

```bash
# 기본 실행 (최근 3일, 최대 10개)
python mokpo_scraper.py

# 최대 5개 수집
python mokpo_scraper.py --max-articles 5

# 최근 7일간 수집
python mokpo_scraper.py --days 7
```

---

## ⚠️ 특수 사항

- **로그인/인증:** 필요 없음 (공개 게시판)
- **JavaScript 동적 로딩:** 없음 (서버사이드 렌더링)
- **파일명 패턴:** 파일 ID가 Unix timestamp 기반 (예: 1765417643)
- **첨부파일:** 다운로드 링크 제공 (file_download 경로)

---

## 📊 API 필드 매핑

| API 필드 | 추출 위치 |
|----------|-----------|
| `title` | 상세 페이지 heading |
| `original_link` | `?idx={ID}&mode=view` URL |
| `content` | region 내 본문 텍스트 |
| `source` | `"목포시"` (고정) |
| `category` | `"전남"` (고정) |
| `region` | `"mokpo"` (고정) |
| `published_at` | 날짜 변환 (ISO 8601) |
| `thumbnail_url` | Cloudinary 업로드 후 URL |

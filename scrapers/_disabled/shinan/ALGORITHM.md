# 신안군 보도자료 스크래퍼 알고리즘

> **버전:** v1.0  
> **최종수정:** 2025-12-13  
> **Region Code:** `shinan`  
> **Category:** `전남`

---

## 📋 개요

신안군청 홈페이지 보도자료 게시판에서 뉴스 기사를 수집하는 스크래퍼.

- **목록 URL:** `https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms`
- **상세 페이지 패턴:** `/show/{ID}`
- **페이지네이션:** `?page={N}`

---

## 🔄 수집 플로우

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: 목록 페이지 수집                                │
│  - 테이블 형태 목록에서 기사 링크 추출                      │
│  - a[href*="/show/"] 셀렉터 사용                          │
│  - 제목, URL, 날짜 추출                                    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 2: 상세 페이지 방문                                │
│  - 본문, 이미지, 날짜 추출                                │
│  - JS 기반 본문 추출 (div.bbsV_cont 등)                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 3: 이미지 처리                                     │
│  - 본문 내 이미지 또는 첨부파일에서 추출                    │
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

### 목록 페이지

| 요소 | 셀렉터 |
|------|--------|
| 기사 행 | `table.bbsListTbl tbody tr`, `table tbody tr` |
| 기사 링크 | `a[href*="/show/"]` |
| 날짜 | 행 내 `YYYY-MM-DD` 패턴 |

**ID 추출 방법:** `/show/(\d+)` 정규식

### 상세 페이지

| 요소 | 셀렉터 |
|------|--------|
| 본문 | `div.bbsV_cont`, `div.view_content`, `div.contents` |
| 날짜 | `등록일` 레이블 다음 텍스트 |
| 이미지 | 본문 영역 내 `img` |

---

## 🖼️ 이미지 처리

### 핫링크: ⚠️ 확인 필요
- 일부 이미지는 Referer 헤더가 필요할 수 있음
- Cloudinary 업로드로 안정적인 URL 확보

### 처리 과정
1. 본문 영역 내 이미지 우선 추출
2. 첨부파일에서 이미지 파일 확인 (폴백)
3. Cloudinary 업로드 (800px 리사이즈)
4. Cloudinary URL을 `thumbnail_url`로 저장

---

## 📅 날짜 형식

| 위치 | 형식 | 예시 |
|------|------|------|
| 목록 페이지 | YYYY-MM-DD 또는 YYYY.MM.DD | 2025-12-13 |
| 상세 페이지 | 등록일 라벨 뒤 날짜 | 2025-12-13 |

**정규화:** 모두 `YYYY-MM-DD` (ISO 8601) 형식으로 변환

---

## ⚙️ 상수 정의

```python
REGION_CODE = 'shinan'
REGION_NAME = '신안군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.shinan.go.kr'
LIST_URL = 'https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms'
```

---

## 🚀 실행 방법

```bash
# 기본 실행 (최근 3일, 최대 10개)
python shinan_scraper.py

# 최대 5개 수집
python shinan_scraper.py --max-articles 5

# 최근 7일간 수집
python shinan_scraper.py --days 7

# 테스트 모드 (서버 전송 안함)
python shinan_scraper.py --dry-run
```

---

## ⚠️ 특수 사항

- **로그인/인증:** 필요 없음 (공개 게시판)
- **JavaScript 동적 로딩:** 없음 (서버사이드 렌더링)
- **wscms 기반:** 표준 CMS 구조
- **첨부파일:** 다운로드 링크 제공

---

## 📊 API 필드 매핑

| API 필드 | 추출 위치 |
|----------|-----------|
| `title` | 목록/상세 페이지 링크 텍스트 |
| `original_link` | `/show/{ID}` URL |
| `content` | 본문 영역 텍스트 |
| `source` | `"신안군"` (고정) |
| `category` | `"전남"` (고정) |
| `region` | `"shinan"` (고정) |
| `published_at` | 날짜 변환 (ISO 8601) |
| `thumbnail_url` | Cloudinary 업로드 후 URL |

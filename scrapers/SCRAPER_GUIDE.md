# Korea NEWS 스크래퍼 개발 가이드

> **버전:** v3.0
> **최종수정:** 2025-12-12
> **관리자:** AI Agent

---

## 1. 프로젝트 개요

전남/광주 지역 27개 기관의 보도자료를 자동 수집하여 Supabase DB에 저장하는 시스템.

**데이터 흐름:**
```
[스크래퍼] → POST /api/bot/ingest → [Supabase] → [웹사이트]
```

---

## 2. 폴더 구조

```
scrapers/
├── [지역명]/                      # 지역별 스크래퍼 (27개)
│   ├── [지역명]_scraper.py        # 메인 스크래퍼 코드
│   └── ALGORITHM.md               # 알고리즘 문서 (필수)
│
├── utils/                         # 공통 유틸리티
│   ├── api_client.py              # API 통신 (send_article_to_server)
│   ├── scraper_utils.py           # Playwright 헬퍼 함수
│   ├── cloudinary_uploader.py     # 이미지 업로드
│   └── ...
│
├── templates/                     # 스크래퍼 템플릿
│   └── base_scraper_template.py
│
├── backup/                        # 버전 백업 (날짜별)
│   └── YYYY-MM-DD/
│
├── debug/                         # 디버그/테스트 파일
│
├── configs/                       # 설정 파일
│   └── regional_configs.py
│
├── SCRAPER_GUIDE.md               # 이 문서 (AI용 개발 가이드)
├── SCRAPER_DEVELOPMENT_GUIDE.md   # 외부 협업용 가이드 (영문)
├── 스크래퍼_개발_지침.md            # 외부 협업용 가이드 (한글)
└── SCRAPER_CHANGELOG.md           # 변경 이력
```

---

## 3. 스크래퍼 개발 규칙

### 3.1 파일 헤더 (필수)

```python
"""
{지역명} 보도자료 스크래퍼
- 버전: v{X.0}
- 최종수정: YYYY-MM-DD
- 담당: AI Agent

변경점 (v{X.0}):
- {변경 내용}
"""
```

### 3.2 상수 정의 (필수)

```python
REGION_CODE = 'suncheon'           # 영문 코드 (DB region 컬럼)
REGION_NAME = '순천시'              # 한글명 (source 컬럼)
CATEGORY_NAME = '전남'              # 카테고리 (전남/광주)
BASE_URL = 'http://www.suncheon.go.kr'
LIST_URL = 'http://www.suncheon.go.kr/kr/news/0006/0001/'
```

### 3.3 Import 순서

```python
# 1. 표준 라이브러리
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

# 2. 외부 라이브러리
from playwright.sync_api import sync_playwright, Page

# 3. 로컬 모듈
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image
```

### 3.4 필수 함수

| 함수 | 역할 | 반환값 |
|------|------|--------|
| `normalize_date(date_str)` | 날짜 정규화 | `str` (YYYY-MM-DD) |
| `fetch_detail(page, url)` | 상세 페이지 추출 | `Tuple[str, Optional[str], str, Optional[str]]` |
| `collect_articles(days, max_articles)` | 메인 수집 | `List[Dict]` |
| `main()` | CLI 진입점 | - |

**fetch_detail 반환값:**
```python
(본문, 썸네일URL, 날짜, 담당부서)
```

---

## 4. 이미지 처리 (필수)

### 4.1 핫링크 방지 대응

대부분의 관공서는 외부 이미지 접근 차단 → **Cloudinary 업로드 필수**

```python
from utils.cloudinary_uploader import download_and_upload_image

# 이미지 URL 추출 후
if thumbnail_url:
    cloudinary_url = download_and_upload_image(
        thumbnail_url,
        BASE_URL,           # Referer 헤더용
        folder=REGION_CODE  # Cloudinary 폴더
    )
    if cloudinary_url:
        thumbnail_url = cloudinary_url
```

### 4.2 JavaScript 다운로드 대응 (순천시 등)

```python
# 방법 1: Playwright expect_download()
with page.expect_download(timeout=15000) as download_info:
    link_locator.click()
download = download_info.value
download.save_as(temp_path)

# 방법 2: POST 요청 (방법 1 실패 시)
# goDownLoad() 파라미터 파싱 후 requests.post()
```

---

## 5. API 전송 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `title` | string | ✅ | 기사 제목 |
| `original_link` | string | ✅ | 상세 URL (중복 체크 키) |
| `content` | string | ⭕ | 본문 (최대 5000자) |
| `source` | string | ⭕ | 기관명 (REGION_NAME) |
| `category` | string | ⭕ | 카테고리 (CATEGORY_NAME) |
| `region` | string | ⭕ | 지역 코드 (REGION_CODE) |
| `published_at` | string | ⭕ | ISO 8601 형식 |
| `thumbnail_url` | string | ⭕ | Cloudinary URL |

---

## 6. 실행 및 제한

### 6.1 CLI 옵션

```bash
python [지역]_scraper.py                    # 기본 (3일, 10개)
python [지역]_scraper.py --days 7           # 최근 7일
python [지역]_scraper.py --max-articles 5   # 최대 5개
python [지역]_scraper.py --dry-run          # 테스트 (DB 저장 안함)
```

### 6.2 제한 사항

| 항목 | 값 | 이유 |
|------|-----|------|
| 1회 최대 수집 | 10개 | 서버 부하 방지 |
| 기사 간 대기 | 0.5~1초 | Rate Limiting |
| 페이지 간 대기 | 1초 | 안정성 |
| 본문 최대 길이 | 5000자 | DB 제한 |

---

## 7. 작업 절차

### 7.1 새 스크래퍼 개발

1. **기초 데이터 확보** (외부 협업)
   - `스크래퍼_개발_지침.md` 참조
   - 목록 URL, 상세 URL 패턴, 셀렉터, 샘플 5개

2. **스크래퍼 작성**
   - `templates/base_scraper_template.py` 복사
   - 상수 및 셀렉터 수정
   - 테스트: `--days 1 --max-articles 3`

3. **문서화**
   - `ALGORITHM.md` 작성 (필수)
   - `SCRAPER_CHANGELOG.md` 업데이트

### 7.2 기존 스크래퍼 수정

1. **백업 생성**
   ```bash
   python backup_scraper.py [지역]/[지역]_scraper.py
   ```

2. **수정 및 테스트**
   ```bash
   python [지역]_scraper.py --days 1 --max-articles 3
   ```

3. **문서 업데이트**
   - 파일 헤더 버전/날짜 수정
   - ALGORITHM.md 업데이트
   - CHANGELOG 기록

---

## 8. 금지 사항

| ❌ 금지 | ✅ 대신 |
|--------|--------|
| utils/ 공통 함수 임의 수정 | 새 함수 추가 또는 논의 |
| 백업 없이 스크래퍼 수정 | backup_scraper.py 실행 |
| 하드코딩 URL/셀렉터 | 상수로 정의 |
| 새 패턴 무단 도입 | 기존 스크래퍼 참조 |
| Cloudinary 업로드 생략 | 항상 업로드 시도 |

---

## 9. 참조 스크래퍼

| 지역 | 특이사항 | ALGORITHM.md |
|------|----------|:------------:|
| 광주광역시 | 핫링크 방지, 표준 구조 | ✅ |
| 전라남도 | HWP iframe, 첨부파일 이미지 | ✅ |
| 순천시 | JS 다운로드 (expect_download) | ✅ |
| 나주시 | img 다음 div 본문 | ✅ |
| 목포시 | 카드형 UI | ✅ |
| 광주교육청 | JS evaluate, 특수 URL | ✅ |
| 영광군 | 표준 구조 | ✅ |

---

## 10. 대상 기관 목록 (27개)

### 광역/도 (2)
- 광주광역시, 전라남도

### 시 (5)
- 목포시, 여수시, 순천시, 나주시, 광양시

### 군 (17)
- 담양군, 곡성군, 구례군, 고흥군, 보성군
- 화순군, 장흥군, 강진군, 해남군, 영암군
- 무안군, 함평군, 영광군, 장성군, 완도군
- 진도군, 신안군

### 교육청 (2)
- 광주교육청, 전남교육청

### 지역 언론 (1)
- 광남일보 (kwnews)

---

*이 문서는 AI Agent가 스크래퍼 개발/유지보수 시 참조하는 핵심 가이드입니다.*

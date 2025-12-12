# Korea NEWS 스크래퍼 개발 가이드

> **버전:** v3.1
> **최종수정:** 2025-12-12
> **관리자:** AI Agent

---

## [필독] AI Agent 필수 준수 사항

```
┌─────────────────────────────────────────────────────────────┐
│  이 문서를 최소 2번 이상 정독한 후 작업을 시작하세요.        │
│                                                              │
│  특히 아래 섹션은 반드시 숙지해야 합니다:                    │
│  - 섹션 3.5: 본문 정리 함수 (clean_content)                 │
│  - 섹션 4: 이미지 필수 규칙                                  │
│  - 섹션 9: 테스트 체크리스트                                 │
│                                                              │
│  [X] 문서를 대충 읽고 진행하면 품질 이슈가 발생합니다.       │
│  [O] 체크리스트를 모두 확인해야 작업 완료입니다.             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [중요] 코드에 이모지 사용 금지                              │
│                                                              │
│  Windows 콘솔(cp949)에서 인코딩 오류가 발생합니다.           │
│  - print("✅ 완료")  → print("[OK] 완료")                    │
│  - print("❌ 실패")  → print("[ERROR] 실패")                 │
│  - print("⚠️ 경고")  → print("[WARN] 경고")                  │
│                                                              │
│  모든 출력 메시지는 ASCII 문자만 사용하세요.                 │
└─────────────────────────────────────────────────────────────┘
```

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
│   ├── image_extractor.py         # ⭐ 이미지 추출 (지역별 전용)
│   └── ALGORITHM.md               # 알고리즘 문서 (필수)
│
├── utils/                         # 공통 유틸리티
│   ├── api_client.py              # API 통신 (send_article_to_server)
│   ├── scraper_utils.py           # Playwright 헬퍼 함수
│   ├── cloudinary_uploader.py     # 이미지 업로드
│   └── ...
│
├── templates/                     # 스크래퍼 템플릿
│   ├── base_scraper_template.py   # 메인 스크래퍼 템플릿
│   └── image_extractor_template.py # ⭐ 이미지 추출 템플릿
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
| `clean_content(content)` | 본문 메타정보 제거 | `str` (정리된 본문) |
| `fetch_detail(page, url)` | 상세 페이지 추출 | `Tuple[str, Optional[str], str, Optional[str]]` |
| `collect_articles(days, max_articles)` | 메인 수집 | `List[Dict]` |
| `main()` | CLI 진입점 | - |

**fetch_detail 반환값:**
```python
(본문, 썸네일URL, 날짜, 담당부서)
```

### 3.5 본문 정리 함수 (필수)

> ⚠️ **본문에 포함된 메타정보(작성자, 작성일, 조회수 등)는 반드시 제거해야 합니다.**

```python
def clean_content(content: str) -> str:
    """본문에서 불필요한 메타 정보 제거"""
    if not content:
        return content

    # 제거할 패턴들
    patterns_to_remove = [
        r'작성자\s*:\s*[^\n]+',
        r'작성일\s*:\s*[^\n]+',
        r'조회수\s*:\s*\d+',
        r'담당부서\s*전화번호\s*:\s*[^\n]+',
        r'담당부서\s*:\s*[^\n]+',
        r'전화번호\s*:\s*[^\n]+',
        r'등록일\s*:\s*[^\n]+',
        r'수정일\s*:\s*[^\n]+',
        r'첨부파일\s*:\s*[^\n]*',
    ]

    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content)

    # 연속된 공백/줄바꿈 정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'^\s+', '', content)

    return content.strip()
```

**fetch_detail에서 사용:**
```python
def fetch_detail(page, url):
    # ... 본문 추출 ...

    # 본문 정리 (메타정보 제거)
    content = clean_content(content)

    return content, thumbnail_url, pub_date, department
```

---

## 4. 이미지 필수 규칙 (중요!)

> ⚠️ **이미지 없는 기사는 수집하지 않습니다.**

### 4.1 수집 조건

| 조건 | 수집 여부 |
|------|:--------:|
| 이미지 있음 | ✅ 수집 |
| 이미지 없음 + 첨부파일 있음 | ✅ 수집 (첨부파일에서 이미지 추출 시도) |
| 이미지 없음 + 첨부파일 없음 | ❌ **스킵** |

### 4.2 이미지 추출 구조 (중요!)

각 시군 홈페이지 구조가 다르므로, **이미지 추출 로직은 개별 파일로 분리**합니다.

```
yeosu/
├── yeosu_scraper.py      ← 메인 로직 (공통)
├── image_extractor.py    ← ⭐ 이미지 추출 (여수 전용 셀렉터)
└── ALGORITHM.md
```

**새 스크래퍼 작성 시:**
1. `templates/image_extractor_template.py` 복사
2. 해당 폴더에 `image_extractor.py`로 저장
3. 셀렉터만 해당 사이트에 맞게 수정

**메인 스크래퍼에서 사용:**
```python
from image_extractor import extract_image

thumbnail_url = extract_image(page, BASE_URL)
```

### 4.3 구현 예시

```python
def fetch_detail(page, url) -> Tuple[str, Optional[str], str, Optional[str]]:
    # ... 상세 페이지 파싱 ...
    
    # 이미지 추출 시도 (개별 image_extractor.py 사용)
    from image_extractor import extract_image
    thumbnail_url = extract_image(page, BASE_URL)
    
    # 이미지 없고 첨부파일도 없으면 스킵
    if not thumbnail_url:
        print(f"[스킵] 이미지 없음: {url}")
        return (None, None, None, None)
    
    # ... 본문 추출 진행 ...
```

### 4.4 collect_articles에서 필터링

```python
for article in articles:
    content, thumbnail, date, dept = fetch_detail(page, article['url'])
    
    # 이미지 없는 기사 스킵
    if not thumbnail:
        print(f"[스킵] 이미지 없음: {article['title']}")
        continue
    
    # 정상 기사만 저장
    results.append({...})
```

---

## 5. 이미지 처리 (로컬 저장)

> ⚠️ **2025-12-12 업데이트**: Cloudinary → 로컬 저장 방식으로 전환

### 5.1 기본 방식: 로컬 저장 (권장)

이미지를 `web/public/images/{region}/`에 저장하고, `/images/{region}/{filename}` 경로로 웹 접근.

```python
from utils.local_image_saver import download_and_save_locally

# 이미지 URL 추출 후
if image_url:
    local_path = download_and_save_locally(
        image_url,
        BASE_URL,           # Referer 헤더용
        REGION_CODE         # 저장 폴더명
    )
    if local_path:
        thumbnail_url = local_path  # 예: /images/yeosu/yeosu_20251212_abc123.jpg
```

**저장 구조:**
```
web/public/images/
├── yeosu/
│   └── yeosu_20251212_abc123.jpg
├── naju/
│   └── naju_20251210_def456.jpg
└── ...
```

### 5.2 대안: Cloudinary 업로드 (선택사항)

외부 CDN이 필요한 경우에만 사용:

```python
from utils.cloudinary_uploader import download_and_upload_image

cloudinary_url = download_and_upload_image(image_url, BASE_URL, folder=REGION_CODE)
```

### 5.3 JavaScript 다운로드 대응 (순천시 등)

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

## 6. API 전송 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `title` | string | ✅ | 기사 제목 |
| `original_link` | string | ✅ | 상세 URL (중복 체크 키) |
| `content` | string | ⭕ | 본문 (최대 5000자) |
| `source` | string | ⭕ | 기관명 (REGION_NAME) |
| `category` | string | ⭕ | 카테고리 (CATEGORY_NAME) |
| `region` | string | ⭕ | 지역 코드 (REGION_CODE) |
| `published_at` | string | ⭕ | ISO 8601 형식 |
| `thumbnail_url` | string | ⭕ | 로컬 경로 (`/images/...`) 또는 Cloudinary URL |

---

## 7. 실행 및 제한

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

## 8. 작업 절차

### 8.1 새 스크래퍼 개발

1. **기초 데이터 확보** (외부 협업)
   - `스크래퍼_개발_지침.md` 참조
   - 목록 URL, 상세 URL 패턴, 셀렉터, 샘플 5개

2. **스크래퍼 작성**
   - `templates/base_scraper_template.py` 복사
   - 상수 및 셀렉터 수정
   - 테스트: `--days 1 --max-articles 3`

3. **품질 검증 (필수!)**
   - 아래 체크리스트 모두 확인

4. **문서화**
   - `ALGORITHM.md` 작성 (필수)
   - `SCRAPER_CHANGELOG.md` 업데이트

---

## 9. 테스트 체크리스트 (필수!)

> ⚠️ **스크래퍼 완성 후 반드시 아래 항목을 모두 확인해야 합니다.**

### 9.1 기능 테스트
```bash
python [지역]_scraper.py --days 1 --max-articles 3
```
- [ ] 에러 없이 실행 완료
- [ ] 기사 수집 성공 메시지 출력
- [ ] 이미지 저장 성공

### 9.2 데이터 품질 테스트 (중요!)

**본문 내용 직접 확인:**
```python
# 테스트 스크립트로 본문 출력
content, thumbnail, date, dept = fetch_detail(page, "상세URL")
print("=== 본문 내용 ===")
print(content[:500])  # 처음 500자 확인
```

체크 항목:
- [ ] **메타정보 없음**: 작성자, 작성일, 조회수, 전화번호 등이 본문에 포함되지 않음
- [ ] **본문만 추출**: 실제 기사 내용만 포함
- [ ] **깨진 텍스트 없음**: 인코딩 문제 없음

### 9.3 이미지 테스트

- [ ] **경로 확인**: `/images/{region}/xxx.jpg` 형태 (절대경로 `d:\...` 아님)
- [ ] **파일 존재**: `web/public/images/{region}/` 폴더에 실제 파일 있음
- [ ] **웹 접근 가능**: 브라우저에서 `http://localhost:3000/images/{region}/xxx.jpg` 접근 가능

### 9.4 웹사이트 표시 테스트

- [ ] **메인 페이지 확인**: `http://localhost:3000` 에러 없이 표시
- [ ] **이미지 표시**: 썸네일 정상 출력 (빈 박스 아님)
- [ ] **기사 상세 확인**: `/news/[id]` 페이지에서 본문 정상 표시

### 9.5 최종 확인 명령어

```bash
# 1. 스크래퍼 실행
PYTHONIOENCODING=utf-8 python [지역]_scraper.py --days 1 --max-articles 2

# 2. 이미지 파일 확인
dir web\public\images\[지역]\

# 3. 웹사이트 확인
start http://localhost:3000
```

---

**체크리스트를 모두 통과해야 스크래퍼 개발 완료입니다.**

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

## 9. 금지 사항

| ❌ 금지 | ✅ 대신 |
|--------|--------|
| **이미지 없는 기사 수집** | 이미지 없으면 스킵 (섹션 4 참조) |
| utils/ 공통 함수 임의 수정 | 새 함수 추가 또는 논의 |
| 백업 없이 스크래퍼 수정 | backup_scraper.py 실행 |
| 하드코딩 URL/셀렉터 | 상수로 정의 |
| 새 패턴 무단 도입 | 기존 스크래퍼 참조 |
| Cloudinary 업로드 생략 | 항상 업로드 시도 |

---

## 10. 참조 스크래퍼

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

## 11. 대상 기관 목록 (27개)

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

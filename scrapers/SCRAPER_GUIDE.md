# 🛡️ Korea NEWS 스크래퍼 개발 가이드라인

> **최종 수정**: 2025-12-10  
> **버전**: v1.0  
> **목적**: 여러 AI/개발자가 작업해도 일관성 있는 스크래퍼 코드 유지

---

## 📋 AI 작업 전 필수 체크리스트

> [!IMPORTANT]
> **스크래퍼 수정 전 반드시 확인하세요!**

- [ ] 이 가이드라인을 읽었는가?
- [ ] `backup_scraper.py`로 현재 버전 백업했는가?
- [ ] 템플릿 구조(`templates/base_scraper_template.py`)를 따르고 있는가?
- [ ] 셀렉터 변경 시 `--days 1` 옵션으로 테스트 완료했는가?
- [ ] `SCRAPER_CHANGELOG.md`에 변경 내용 기록했는가?

---

## 📂 폴더 구조

```
scrapers/
├── SCRAPER_GUIDE.md          # ⭐ 이 파일 (필독!)
├── SCRAPER_CHANGELOG.md      # 변경 이력
├── backup_scraper.py         # 백업 유틸리티
│
├── core/                     # ⭐ 실서비스 스크래퍼 (29개)
│   ├── gwangju_scraper.py
│   ├── naju_scraper.py
│   └── ...
│
├── templates/                # 스크래퍼 템플릿
│   └── base_scraper_template.py
│
├── utils/                    # 공통 유틸리티
│   ├── api_client.py
│   └── scraper_utils.py
│
├── backup/                   # 자동 백업 (날짜별)
│   └── 2025-12-10/
│
└── debug/                    # 디버그/테스트 파일
```

---

## 🔧 코딩 컨벤션

### 1. 파일 헤더 (필수)

```python
"""
{지역명} 보도자료 스크래퍼
- 버전: v2.0
- 최종수정: 2025-12-10
- 담당: AI Agent
"""
```

### 2. 상수 정의 (파일 상단, 필수)

```python
REGION_CODE = 'gwangju'                    # 영문 코드 (DB region 컬럼)
REGION_NAME = '광주광역시'                   # 한글명 (source 컬럼)
CATEGORY_NAME = '광주'                      # 카테고리명
BASE_URL = 'https://www.gwangju.go.kr'     # 기본 URL
LIST_URL = 'https://www.gwangju.go.kr/...' # 목록 페이지 URL
```

### 3. 셀렉터 정의 (필수)

```python
# 목록 페이지 셀렉터 (우선순위 순)
LIST_SELECTORS = [
    'tbody tr',
    '.board_list tr',
    'ul.list li',
]

# 본문 페이지 셀렉터 (우선순위 순)
CONTENT_SELECTORS = [
    'div.view_content',
    'div.board_view',
    'div.bbs_view',
]
```

### 4. Import 순서 (표준화)

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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr
```

---

## 📝 필수 함수 구조

| 함수명 | 역할 | 반환값 |
|--------|------|--------|
| `normalize_date(date_str)` | 날짜 문자열을 `YYYY-MM-DD`로 정규화 | `str` |
| `fetch_detail(page, url)` | 상세 페이지에서 본문/이미지 추출 | `Tuple[str, Optional[str]]` |
| `collect_articles(days)` | 메인 수집 함수 | `List[Dict]` |
| `main()` | CLI 진입점 (argparse 사용) | - |

### fetch_detail 표준 구현

```python
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str]]:
    """상세 페이지 수집"""
    if not safe_goto(page, url, timeout=20000):
        return "", None
    
    # 1. 본문 추출
    content = ""
    for sel in CONTENT_SELECTORS:
        elem = page.locator(sel)
        if elem.count() > 0:
            text = safe_get_text(elem)
            if text and len(text) > 50:
                content = text[:5000]
                break
    
    # 2. 이미지 추출
    thumbnail_url = None
    # 첨부파일 우선
    for link in page.locator('a[href*="download"], a[href*="fileDown"]').all():
        title = link.get_attribute('title') or ""
        if any(ext in title.lower() for ext in ['.jpg', '.png']):
            thumbnail_url = urljoin(BASE_URL, link.get_attribute('href'))
            break
    
    # 본문 내 이미지 fallback
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            if imgs.count() > 0:
                src = imgs.first.get_attribute('src')
                if src and 'icon' not in src.lower():
                    thumbnail_url = urljoin(BASE_URL, src)
                    break
    
    return content, thumbnail_url
```

---

## 🔄 백업 규칙

### 수정 전 백업 필수!

```bash
# 백업 명령어
python backup_scraper.py core/gwangju_scraper.py

# 결과: backup/2025-12-10/gwangju_scraper_1430.py 생성
```

### 백업 파일 명명 규칙

```
backup/{YYYY-MM-DD}/{scraper_name}_{HHMM}.py
```

---

## ⚠️ 주의사항

### 절대 하지 말 것
- ❌ `utils/` 폴더의 공통 함수 임의 수정
- ❌ 다른 스크래퍼 참조 없이 새로운 패턴 도입
- ❌ 백업 없이 `core/` 파일 직접 수정
- ❌ 하드코딩된 URL/셀렉터 (상수로 정의할 것)

### 반드시 할 것
- ✅ 수정 전 백업
- ✅ 테스트 후 커밋
- ✅ CHANGELOG 업데이트
- ✅ 기존 스크래퍼 스타일 따르기

---

## 📊 지역별 스크래퍼 현황

| 지역 | 파일명 | 상태 | 비고 |
|------|--------|------|------|
| 광주광역시 | gwangju_scraper.py | ✅ 정상 | |
| 나주시 | naju_scraper.py | ✅ 정상 | |
| 전라남도 | jeonnam_scraper.py | ✅ 정상 | HWP iframe 대응 |
| 목포시 | mokpo_scraper.py | ✅ 정상 | 카드형 UI |
| ... | ... | ... | ... |

---

## 🆘 문제 해결

### 본문이 추출되지 않을 때
1. F12 개발자 도구로 실제 DOM 구조 확인
2. `CONTENT_SELECTORS`에 새 셀렉터 추가
3. HWP/iframe 여부 확인

### 이미지가 추출되지 않을 때
1. 첨부파일 영역 확인 (`a[href*="download"]`)
2. Hot-link 방지 여부 확인
3. 필요 시 다운로드 URL 직접 사용

---

*이 가이드라인은 모든 AI/개발자가 스크래퍼 작업 시 참조해야 합니다.*

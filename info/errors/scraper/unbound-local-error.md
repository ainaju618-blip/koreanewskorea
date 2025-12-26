# UnboundLocalError: success_count

> **날짜:** 2025-12-26
> **심각도:** HIGH (스크래퍼 실행 중단)
> **카테고리:** scraper

---

## 증상

스크래퍼를 `--dry-run` 모드로 실행할 때 다음 오류 발생:

```
UnboundLocalError: cannot access local variable 'success_count' where it is not associated with a value
```

## 에러 메시지

```python
Traceback (most recent call last):
  File "scrapers/[region]/[region]_scraper.py", line XXX, in collect_articles
    success_count += 1
UnboundLocalError: cannot access local variable 'success_count' where it is not associated with a value
```

## 근본 원인

`collect_articles()` 함수 내에서 두 가지 코드 경로가 존재:

1. **실제 실행 경로** (`dry_run=False`):
   - `error_collector.add_success()` 호출 (문제 없음)

2. **DRY-RUN 경로** (`dry_run=True`):
   - `success_count += 1` 직접 사용
   - BUT `success_count = 0` 초기화가 누락됨 → **오류 발생**

```python
# 문제가 있는 코드 패턴
if dry_run:
    collected_count += 1
    success_count += 1  # <-- 초기화 없이 사용! ERROR!
else:
    result = send_article_to_server(article_data)
    if result.get('status') == 'created':
        error_collector.add_success()  # <-- 이건 정상 작동
```

## 영향받은 파일 (2025-12-26 수정)

| 파일 | 라인 | 수정 날짜 | 수정자 |
|------|------|----------|--------|
| `scrapers/gwangyang/gwangyang_scraper.py` | L345-348 | 2025-12-26 | User |
| `scrapers/hampyeong/hampyeong_scraper.py` | - | 2025-12-26 | User |
| `scrapers/jangseong/jangseong_scraper.py` | - | 2025-12-26 | User |
| `scrapers/jindo/jindo_scraper.py` | - | 2025-12-26 | User |
| `scrapers/muan/muan_scraper.py` | - | 2025-12-26 | User |
| `scrapers/sinan/sinan_scraper.py` | - | 2025-12-26 | User |
| `scrapers/gurye/gurye_scraper.py` | L392 | 2025-12-26 | Claude |
| `scrapers/jangheung/jangheung_scraper.py` | L335 | 2025-12-26 | Claude |
| `scrapers/yeongam/yeongam_scraper.py` | L325 | 2025-12-26 | Claude |
| `scrapers/wando/wando_scraper.py` | L365 | 2025-12-26 | Claude |

**총 10개 스크래퍼 영향**

## 해결 방법

`collect_articles()` 함수 시작 부분에 `success_count = 0` 초기화 추가:

```python
def collect_articles(max_articles: int = 30, ...):
    """..."""
    # ... 기존 코드 ...

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)
    collected_articles = []  # dry-run 시 반환용
    success_count = 0  # Initialize for dry-run mode  <-- 추가!

    with sync_playwright() as p:
        # ... 나머지 코드 ...
```

## 예방 대책

1. **코드 리뷰 체크리스트 추가:**
   - DRY-RUN 블록에서 사용하는 모든 변수가 초기화되었는지 확인

2. **새 스크래퍼 템플릿 업데이트:**
   - `success_count = 0` 초기화 포함

3. **테스트 자동화:**
   - 모든 스크래퍼에 대해 `--dry-run --max-articles 1` 테스트 포함

## 관련 파일

- `scrapers/boseong/boseong_scraper.py` - 정상 작동 참조 예시 (L346에 초기화 있음)

---

*작성: 2025-12-26 | Claude*

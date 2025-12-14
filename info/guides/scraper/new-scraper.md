# [GUIDE] 새 스크래퍼 만들기

## 절차

### 1. 템플릿 복사
```bash
cp scrapers/templates/base_scraper_template.py scrapers/[지역명]/[지역명]_scraper.py
```

### 2. 상수 수정
```python
REGION_CODE = 'naju'       # 영문 코드
REGION_NAME = '나주시'      # 한글명
CATEGORY_NAME = '전남'      # 카테고리
BASE_URL = 'https://...'
LIST_URL = 'https://...'
```

### 3. 필수 인자 (bot-service.ts 호환)
```python
parser.add_argument('--start-date', type=str, default=None)
parser.add_argument('--end-date', type=str, default=None)
parser.add_argument('--days', type=int, default=3)
parser.add_argument('--max-articles', type=int, default=10)
```

### 4. 이미지 처리 필수
```python
from utils.local_image_saver import download_and_save_locally

# 이미지 없으면 스킵
if not thumbnail_url:
    print(f"[스킵] 이미지 없음: {url}")
    return (None, None, None, None)

# 로컬 저장
local_path = download_and_save_locally(
    image_url,
    BASE_URL,
    REGION_CODE
)
```

### 5. 테스트
```bash
python [지역명]_scraper.py --days 1 --max-articles 3
```

### 6. 문서 작성
- `ALGORITHM.md` 작성
- `SCRAPER_CHANGELOG.md` 업데이트

## 참조 스크래퍼
| 지역 | 특이사항 |
|------|----------|
| 광주광역시 | 핫링크 방지, 표준 |
| 순천시 | JS 다운로드 |
| 나주시 | img 다음 div 본문 |

## 관련
- `test-checklist.md` - 테스트 체크리스트
- `image-handling.md` - 이미지 처리

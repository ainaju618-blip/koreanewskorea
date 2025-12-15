# 스크래퍼 개발 정보

> 스크래퍼 개발, 에러, 셀렉터, 크롤링 관련 모든 정보

---

## 1. 현황 요약

| 항목 | 값 |
|------|-----|
| **구현 완료** | 26개 / 26개 (100%) |
| **이미지 저장** | **Cloudinary** (필수, 실패 시 에러) |
| **가이드 문서** | `scrapers/SCRAPER_GUIDE.md` |

### 지역별 스크래퍼
- **광역/도 (2)**: 광주광역시, 전라남도
- **시 (5)**: 목포시, 여수시, 순천시, 나주시, 광양시
- **군 (17)**: 담양, 곡성, 구례, 고흥, 보성, 화순, 장흥, 강진, 해남, 영암, 무안, 함평, 영광, 장성, 완도, 진도, 신안
- **교육청 (2)**: 광주교육청, 전남교육청

---

## 2. 필수 규칙 요약

### 이미지 없으면 스킵
```python
if not thumbnail_url:
    print(f"[스킵] 이미지 없음: {url}")
    return (None, None, None, None)
```

### 본문 메타정보 제거 필수
```python
def clean_content(content: str) -> str:
    patterns_to_remove = [
        r'작성자\s*:\s*[^\n]+',
        r'조회수\s*:\s*\d+',
        r'담당부서\s*:\s*[^\n]+',
        r'전화번호\s*:\s*[^\n]+',
    ]
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content)
    return content.strip()
```

### bot-service.ts 호환 인자 필수
```python
parser.add_argument('--start-date', type=str, default=None)
parser.add_argument('--end-date', type=str, default=None)
parser.add_argument('--days', type=int, default=3)
parser.add_argument('--max-articles', type=int, default=10)
```

---

## 3. [ERROR] 이미지 누락

### 증상
- 기사 썸네일이 빈 박스로 표시
- `thumbnail_url`이 null 또는 잘못된 경로

### 원인별 해결

#### 3.1 셀렉터 문제
```python
# 사이트 구조 분석 후 올바른 셀렉터 찾기
# 예: 이미지가 다른 컨테이너에 있는 경우
IMAGE_SELECTORS = [
    '.view-content img',
    '.board-view img',
    '.article-body img',
    '#contents img',
]
```

#### 3.2 핫링크 방지 (403 에러)
```python
# Referer 헤더 포함 - Cloudinary 업로드
from utils.cloudinary_uploader import download_and_upload_image

try:
    cloudinary_url = download_and_upload_image(
        image_url,
        BASE_URL,  # Referer로 사용
        folder=REGION_CODE
    )
except RuntimeError as e:
    print(f"[에러] Cloudinary 업로드 실패: {e}")
    raise  # 수집 중단
```

#### 3.3 JavaScript 렌더링 필요
```python
# 페이지 로드 대기
page.wait_for_load_state('networkidle')
time.sleep(1)

# 또는 특정 요소 대기
page.wait_for_selector('.view-content img', timeout=5000)
```

#### 3.4 첨부파일 이미지
```python
# 첨부파일 영역에서 이미지 링크 추출
attachments = page.query_selector_all('.attach-file a')
for att in attachments:
    href = att.get_attribute('href')
    if href and any(ext in href.lower() for ext in ['.jpg', '.png', '.gif']):
        image_url = urljoin(BASE_URL, href)
```

---
*추가일: 2025-12-15*

---

## 4. [ERROR] 본문 오염

### 증상
- 본문에 "작성자:", "조회수:", "담당부서:" 등 메타정보 포함
- 전화번호가 본문에 나타남

### 해결
`clean_content()` 함수에 패턴 추가:

```python
patterns_to_remove = [
    # 기존 패턴
    r'작성자\s*:\s*[^\n]+',
    r'조회수\s*:\s*\d+',

    # 새로 추가할 패턴 (지역별)
    r'담당부서\s*[:：]?\s*[^\n]+',
    r'담당자\s*[:：]?\s*[^\n]+',
    r'연락처\s*[:：]?\s*[\d\-\s]+',
    r'\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}',  # 전화번호
]
```

### 문제 지역 TOP 5 (2025-12-14 기준)
| 지역 | 문제 유형 | 해결 상태 |
|------|----------|----------|
| 광양시 | 담당부서/연락처 | v1.1 수정 |
| 무안군 | 이미지 누락 66% | v1.4 수정 |
| 광주교육청 | 조회수/날짜 | v4.1 수정 |
| 화순군 | 조회수 | v1.1 수정 |
| 순천시 | 이미지 누락 100% | v3.1 수정 |

---
*추가일: 2025-12-15*

---

## 5. [ERROR] Exit Code 2 (argparse)

### 증상
- 웹 UI에서 "수동수집실행" 시 에러
- `Exit Code 2` 발생

### 원인
bot-service.ts가 전달하는 인자가 스크래퍼에 정의되지 않음

### 해결
```python
# 필수 4개 인자 정의
parser.add_argument('--start-date', type=str, default=None)
parser.add_argument('--end-date', type=str, default=None)
parser.add_argument('--days', type=int, default=3)
parser.add_argument('--max-articles', type=int, default=10)
```

---
*추가일: 2025-12-15*

---

## 6. [ERROR] 인코딩 오류 (cp949)

### 증상
```
UnicodeEncodeError: 'cp949' codec can't encode character
```

### 원인
Windows 콘솔에서 이모지 출력

### 해결
```python
# 이모지 사용 금지
print("✅ 완료")   # ❌
print("[OK] 완료")  # ✅

# 실행 시 환경변수 설정
PYTHONIOENCODING=utf-8 python scraper.py
```

---
*추가일: 2025-12-15*

---

## 7. [ERROR] JS 다운로드 이미지

### 증상
- 이미지 URL이 `javascript:goDownLoad(...)` 형태
- 직접 다운로드 불가

### 해결 (순천시 등)
```python
# 방법 1: Playwright expect_download
with page.expect_download(timeout=15000) as download_info:
    link_locator.click()
download = download_info.value
download.save_as(temp_path)

# 방법 2: POST 요청 (파라미터 파싱)
# goDownLoad('file_id', 'file_name') 파싱 후
requests.post(download_url, data={...})
```

---
*추가일: 2025-12-15*

---

## 8. [GUIDE] 테스트 체크리스트

### 기능 테스트
```bash
python [지역]_scraper.py --days 1 --max-articles 3
```
- [ ] 에러 없이 완료
- [ ] 기사 수집 성공

### 데이터 품질
- [ ] 본문에 메타정보 없음
- [ ] 이미지 경로 `/images/...` 형태
- [ ] 파일 실제 존재

### 웹 표시
- [ ] 메인 페이지 정상
- [ ] 썸네일 표시됨
- [ ] 기사 상세 정상

---
*추가일: 2025-12-15*

---

## 9. [GUIDE] 새 스크래퍼 개발

### 절차
1. `templates/base_scraper_template.py` 복사
2. 상수 및 셀렉터 수정
3. `--days 1 --max-articles 3` 테스트
4. `ALGORITHM.md` 작성
5. `SCRAPER_CHANGELOG.md` 업데이트

### 참조 스크래퍼
| 지역 | 특이사항 |
|------|----------|
| 광주광역시 | 핫링크 방지, 표준 구조 |
| 순천시 | JS 다운로드 |
| 나주시 | img 다음 div 본문 |
| 광주교육청 | JS evaluate |

---
*추가일: 2025-12-15*

---

## 10. 관련 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 상세 가이드 | `scrapers/SCRAPER_GUIDE.md` | 개발 표준 전체 |
| 지역별 알고리즘 | `scrapers/[지역]/ALGORITHM.md` | 개별 셀렉터/로직 |
| 변경 이력 | `scrapers/SCRAPER_CHANGELOG.md` | 버전 히스토리 |
| 현황 | `scrapers/STATUS.md` | 전체 현황 요약 |

---

*최종 업데이트: 2025-12-15*

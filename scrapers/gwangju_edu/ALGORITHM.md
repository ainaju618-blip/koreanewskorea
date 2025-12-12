# 광주광역시교육청 스크래퍼 알고리즘 문서
> **파일:** `gwangju_edu_scraper.py`
> **버전:** v4.0
> **최종 수정:** 2025-12-12

---

## 📋 개요

| 항목 | 값 |
|------|-----|
| **대상 사이트** | https://enews.gen.go.kr |
| **수집 대상** | 보도자료 게시판 (sid=25, bo_table=0201) |
| **Region Code** | `gwangju_edu` |
| **Category** | `광주` |

---

## 🔄 동작 흐름 (Algorithm Flow)

```mermaid
flowchart TD
    A[시작] --> B[목록 페이지 1~3 순회]
    B --> C[기사 링크 + 날짜 + ID 파싱 (JS Evaluate)]
    C --> D{날짜 필터링}
    D -->|범위 내| E[링크 리스트에 추가]
    D -->|범위 초과| F[수집 중단]
    E --> G[상세 페이지 문 (Visit Phase)]
    G --> H[본문 추출 (Generic 요소 결합)]
    H --> I[이미지 추출 (View URL -> Direct URL 변환)]
    I --> J[데이터 검증]
    J -->|Pass| K[DB 적재 (Ingestion)]
    J -->|Fail| L[스킵 및 로그]
    K --> M[다음 기사]
    M --> N{종료 조건?}
    N -->|No| G
    N -->|Yes| O[종료]
```

---

## 📌 핵심 로직 설명

### 1. URL 패턴 및 파라미터
- **목록 URL**: `https://enews.gen.go.kr/v5/?sid=25`
- **상세 URL**: `https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:{ID};`
- **이미지 URL**: `https://enews.gen.go.kr/v4/decoboard/data/file/0201/{파일명}`
  - 특징: 사이트는 v5 경로를 쓰지만, 이미지 파일은 v4 경로에 저장됨.

### 2. 목록 파싱 (`parse_list_page`)
- DOM 구조가 `form > ul > li > a` 형태이나, 셀렉터로 잡기 까다로운 `generic` 클래스들을 사용함.
- **JavaScript Evaluate** 방식을 사용하여 `a[href*="uid:"]` 요소를 찾고, 부모 `li` 내의 텍스트를 분석하여 제목과 날짜를 추출함.

### 3. 상세 페이지 추출 (`fetch_detail`)
- **본문**: 
  - 기본적으로 `.view-contents` 클래스 내의 텍스트를 추출.
  - 해당 클래스가 없을 경우, 첨부파일 영역(`.file-list`) 이후의 텍스트를 수집하는 Fallback 로직 동작.
  - 텍스트 정제를 통해 "자료문의", "기관명" 등의 메타 텍스트 제외.
- **이미지**:
  - 1순위: `.view-contents img` 태그 (본문 삽입 이미지)
  - 2순위: `view_image.php` 링크 (이미지 뷰어 팝업) -> 직접 URL 변환
  - 3순위: 첨부파일 리스트의 이미지 파일 (`file_download` 함수 파싱)
- **날짜**: 본문/메타 영역 텍스트 내에서 `YYYY-MM-DD` 패턴 정규식 검색.
- **담당부서**: "기관명 :" 텍스트 패턴 추출 또는 메타 리스트 첫 항목.

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'gwangju_edu'
BASE_URL = 'https://enews.gen.go.kr'
# 이미지 직접 접근 경로
IMAGE_BASE_URL = 'https://enews.gen.go.kr/v4/decoboard/data/file/0201/'
```

---

## 🚨 특이사항 및 해결책

1. **URL 버전 혼용**: 
   - 사이트 메인은 `/v5/`이지만 이미지는 `/v4/` 경로에 있음. (해결: URL 변환 로직 적용)
2. **이미지 뷰어**:
   - 이미지가 `view_image.php` 팝업으로 연결됨. (해결: `fn` 파라미터 파싱 후 직접 URL 생성)
3. **독특한 파라미터 구조**:
   - 쿼리 스트링이 아닌 세미콜론(`;`)으로 구분된 파라미터 사용 (`wbb=md:view;uid:12345;`).
   - 정규식으로 `uid`를 추출하여 처리.

---

## 🧪 실행 방법

```bash
# 기본 실행 (3일치, 최대 10개)
python scrapers/gwangju_edu/gwangju_edu_scraper.py

# 테스트 (DB 저장 안함)
python scrapers/gwangju_edu/gwangju_edu_scraper.py --dry-run
```

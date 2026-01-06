# 보성군 보도자료 스크래퍼 알고리즘

> **버전:** v1.0  
> **최종 수정:** 2025-12-13  
> **담당:** AI Agent

---

## 📋 개요

| 항목 | 값 |
|------|-----|
| **대상 사이트** | 보성군청 보도자료 |
| **Base URL** | `https://www.boseong.go.kr` |
| **Region Code** | `boseong` |
| **Category** | `전남` |

---

## 🌐 URL 패턴

### 목록 페이지
```
https://www.boseong.go.kr/www/open_administration/city_news/press_release
```

#### 페이지네이션
- **방식:** page 파라미터 기반
- **패턴:** `?page={N}`
- **예시:** 
  - 1페이지: (파라미터 없음 또는 page=1)
  - 2페이지: ?page=2
  - 3페이지: ?page=3
- **총 게시물:** 12,184건, 1,354페이지 (1페이지당 9건)

### 상세 페이지
```
https://www.boseong.go.kr/www/open_administration/city_news/press_release?idx={ID}&mode=view
```

#### 게시글 ID 예시
- `1154628` (보성군, 1인당 30만 원 '보성사랑(민생회복)지원금' 지급)
- `1154616` (보성군 율포해수녹차센터, 23만 명 방문 달성)

### 첨부파일 다운로드
```
/ybscript.io/common/file_download/{idx}/{code}/{filename}?pkey=
```

---

## 🔄 동작 흐름

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: 목록 페이지 수집                                    │
│  - page 파라미터로 페이지네이션                                │
│  - li a[href*="idx="][href*="mode=view"]에서 링크 추출        │
│  - href에서 idx=(\d+) 정규식으로 게시글 ID 추출                │
├──────────────────────────────────────────────────────────────┤
│  Phase 2: 상세 페이지 방문                                    │
│  - idx로 상세 URL 구성                                        │
│  - heading 요소에서 제목 추출                                  │
│  - YYYY.MM.DD HH:MM 형식에서 날짜 추출                        │
│  - 담당부서 정보 추출 (작성과/작성팀 라벨)                      │
├──────────────────────────────────────────────────────────────┤
│  Phase 3: 이미지 추출                                         │
│  - 우선순위 1: 첨부파일 중 이미지 파일 (.jpg, .png 등)         │
│  - 우선순위 2: 본문 영역 내 img 태그                           │
│  - 로컬 저장: /images/boseong/{filename}                      │
├──────────────────────────────────────────────────────────────┤
│  Phase 4: 서버 전송                                           │
│  - API 통해 기사 데이터 전송                                   │
│  - 중복 체크 (original_link 기준)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 CSS 셀렉터

### 목록 페이지

| 용도 | 셀렉터 |
|------|--------|
| 기사 링크 | `li a[href*="idx="][href*="mode=view"]` |
| 날짜 | 부모 li 내 YYYY-MM-DD 패턴 |

### 상세 페이지

| 용도 | 셀렉터 |
|------|--------|
| 본문 영역 | `.view_content`, `.board_view`, `.con-wrap`, `.view-con` |
| 날짜 | 페이지 텍스트에서 `YYYY.MM.DD HH:MM` 패턴 |
| 첨부파일 | `a[href*="file_download"]` |
| 담당부서 | `*:has-text("작성과")`, `*:has-text("담당자")` |

---

## ⚙️ 설정값

```python
REGION_CODE = 'boseong'
REGION_NAME = '보성군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.boseong.go.kr'

# URL 구성 요소
LIST_PATH = '/www/open_administration/city_news/press_release'
```

---

## ⚠️ 특이사항

1. **카드형 레이아웃**
   - 목록 페이지가 `<ul>` → `<li>` 구조의 카드형 레이아웃
   - 테이블 기반이 아니므로 `li a[href*="idx="]` 셀렉터 사용

2. **정적 HTML 페이지**
   - JavaScript 동적 로딩 없이 서버 렌더링 방식
   - 인증 불필요, 모든 콘텐츠 공개 접근

3. **날짜 형식**
   - 목록: `YYYY-MM-DD` (예: 2025-12-12)
   - 상세: `YYYY.MM.DD HH:MM` (예: 2025.12.12 17:43)

4. **이미지 접근**
   - 핫링크 허용 (직접 접근 가능)
   - 첨부파일 다운로드 URL: `/ybscript.io/common/file_download/...`

5. **첨부파일 없는 기사**
   - 일부 기사는 첨부 이미지가 없을 수 있음
   - 이 경우 thumbnail_url은 null

---

## 🚀 실행 방법

```bash
# 기본 실행 (최대 10개, 날짜 필터 없음) ← 권장
python boseong_scraper.py

# 최대 5개만 수집
python boseong_scraper.py --max-articles 5

# 날짜 필터 적용 (최근 30일, 최대 10개)
python boseong_scraper.py --days 30

# 테스트 모드 (서버 전송 안함)
python boseong_scraper.py --max-articles 3 --dry-run
```

---

## 📊 샘플 데이터

```json
{
  "id": "1154628",
  "title": "보성군, 1인당 30만 원 '보성사랑(민생회복)지원금' 지급(총무과)",
  "date": "2025-12-12",
  "url": "https://www.boseong.go.kr/www/open_administration/city_news/press_release?idx=1154628&mode=view",
  "department": "총무과 행정팀",
  "content": "보성군, 1인당 30만 원 '보성사랑(민생회복)지원금' 지급...",
  "attachment": "보성군청사 사진.JPG"
}
```

---

## 📁 파일 구조

```
scrapers/boseong/
├── boseong_scraper.py    # 메인 스크래퍼 (v1.0)
└── ALGORITHM.md          # 이 문서
```

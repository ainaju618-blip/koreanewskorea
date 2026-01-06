# 영광군 보도자료 스크래퍼 알고리즘

> **버전:** v3.1  
> **최종 수정:** 2025-12-12  
> **담당:** AI Agent

---

## 📋 개요

| 항목 | 값 |
|------|-----|
| **대상 사이트** | 영광군청 보도자료 |
| **Base URL** | `https://www.yeonggwang.go.kr` |
| **Region Code** | `yeonggwang` |
| **Category** | `전남` |

---

## 🌐 URL 패턴

### 목록 페이지
```
https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056&type=lists
```

#### 필수 파라미터
| 파라미터 | 값 | 설명 |
|----------|-----|------|
| `b_id` | `news_data` | 게시판 ID |
| `site` | `headquarter_new` | 사이트 ID |
| `mn` | `9056` | 메뉴 번호 |
| `type` | `lists` | 목록 타입 |

#### 페이지네이션
- **방식:** offset 기반
- **패턴:** `&offset={페이지번호 * 10}`
- **예시:** 
  - 1페이지: offset=0 (생략 가능)
  - 2페이지: offset=10
  - 3페이지: offset=20

### 상세 페이지
```
https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056&type=view&bs_idx={게시글ID}
```

#### 게시글 ID 예시
- `1154680` (영광군, 겨울철 도로 제설작업...)
- `1154678` (영광군, 인플루엔자 주의보...)

### 첨부파일 다운로드
```
?b_id=news_data&site=headquarter_new&mn=9056&type=download&bs_idx={게시글ID}&bf_idx={파일ID}&name={인코딩된파일명}
```

---

## 🔄 동작 흐름

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: 목록 페이지 수집                                    │
│  - offset 파라미터로 페이지네이션                              │
│  - table tbody tr에서 각 행 추출                              │
│  - a[href*="bs_idx"]에서 게시글 ID 추출                        │
├──────────────────────────────────────────────────────────────┤
│  Phase 2: 상세 페이지 방문                                    │
│  - bs_idx로 상세 URL 구성                                     │
│  - 메타데이터 테이블에서 제목/작성자/작성일 추출               │
│  - 본문 영역에서 텍스트 추출                                   │
├──────────────────────────────────────────────────────────────┤
│  Phase 3: 이미지 추출                                         │
│  - 우선순위 1: 첨부파일 중 이미지 파일 (.jpg, .png)            │
│  - 우선순위 2: 본문 영역 내 img 태그                           │
│  - Cloudinary 업로드 (필요시)                                  │
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
| 테이블 | `table` |
| 행 | `table tbody tr`, `table tr` |
| 제목 링크 | `a[href*="bs_idx"]` |
| 날짜 컬럼 | 4번째 td (0-indexed: 3) |

### 상세 페이지

| 용도 | 셀렉터 |
|------|--------|
| 본문 영역 | `.view_content`, `.board_view`, `div[class*="content"]` |
| 날짜 라벨 | `th:has-text("작성일")`, `th:has-text("등록일")` |
| 첨부파일 | `a[href*="type=download"]` |

---

## ⚙️ 설정값

```python
REGION_CODE = 'yeonggwang'
REGION_NAME = '영광군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeonggwang.go.kr'

# URL 구성 요소
BBS_PATH = '/bbs/'
B_ID = 'news_data'
SITE = 'headquarter_new'
MN = '9056'
```

---

## ⚠️ 특이사항

1. **테이블 기반 구조**
   - 목록과 상세 페이지 모두 `<table>` 기반
   - 헤더 행(`<th>`)과 데이터 행(`<td>`) 구분 필요

2. **파일 ID 체계**
   - `bs_idx`: 게시글 고유 ID
   - `bf_idx`: 첨부파일 고유 ID
   - 두 ID 모두 다운로드 URL에 필요

3. **인코딩**
   - 첨부파일명은 URL 인코딩(percent-encoding) 적용
   - UTF-8 기준

4. **공공누리 섹션**
   - 본문 하단에 공공누리 라이선스 정보 포함
   - 본문 추출 시 제외 필요

---

## 🚀 실행 방법

```bash
# 기본 실행 (최대 10개, 날짜 필터 없음) ← 권장
python yeonggwang_scraper.py

# 최대 5개만 수집
python yeonggwang_scraper.py --max-articles 5

# 날짜 필터 적용 (최근 30일, 최대 10개)
python yeonggwang_scraper.py --days 30

# 테스트 모드
python yeonggwang_scraper.py --max-articles 3
```

> **참고**: v3.1부터 **개수 기반 수집**이 기본입니다.  
> `--days` 옵션은 선택 사항이며, 지정하지 않으면 날짜 필터 없이 최신 기사부터 수집합니다.

---

## 📊 샘플 데이터

```json
{
  "bs_idx": "1154680",
  "title": "영광군, 겨울철 도로 제설작업 총력 대응 돌입",
  "작성자": "기획예산실",
  "작성일": "2025-12-03",
  "첨부파일": [{
    "파일명": "1.사진(영광군,_겨울철_도로_제설작업_총력_대응_돌입).jpg",
    "크기": "0.30MB",
    "bf_idx": "473060916"
  }],
  "조회수": "149"
}
```

---

## 📁 파일 구조

```
scrapers/yeonggwang/
├── yeonggwang_scraper.py    # 메인 스크래퍼 (v3.0)
└── ALGORITHM.md             # 이 문서
```

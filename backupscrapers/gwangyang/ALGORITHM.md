# 광양시 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 광양시 |
| **지역 코드** | gwangyang |
| **기본 URL** | https://gwangyang.go.kr |
| **목록 페이지** | /board.es?mid=a11007000000&bid=0057 |
| **렌더링 방식** | 정적 HTML (UTF-8) |
| **인증 필요** | 없음 |
| **총 게시물** | 26,521건 이상 |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057
https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057&nPage={page}
```

### 상세 페이지
```
https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057&act=view&list_no={list_no}&nPage={page}
```

### 이미지 URL
```
https://gwangyang.go.kr/upload_data/board/bobo/{파일명}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 테이블 기반 (`table`)

**링크 선택자**:
```css
table a[href*="act=view"]
```

**추출 데이터**:
- **제목**: 링크 텍스트
- **list_no**: URL 파라미터에서 추출 (`list_no=194037`)
- **날짜**: tr 요소 내 `YYYY.MM.DD` 패턴
- **작성자**: 테이블 컬럼

### 2. 상세 페이지 파싱 (`fetch_detail`)

**본문 선택자**:
```python
CONTENT_SELECTORS = [
    'table td.content',
    '.view_content',
    'table.view_table td',
]
```

**날짜 추출**:
- 패턴: `등록일 YYYY.MM.DD HH:MM`

**담당부서 추출**:
- 패턴: `작성자 : {부서명}`
- 예: `농업정책과`

### 3. 이미지 추출 전략

**전략 1**: `/upload_data/` 경로의 이미지 추출
```css
table img[src*="/upload_data/"]
```
- 이미지 경로: `/upload_data/board/bobo/{파일명}`

**전략 2**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'gwangyang'
REGION_NAME = '광양시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://gwangyang.go.kr'
MID = 'a11007000000'
BID = '0057'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python gwangyang_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python gwangyang_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python gwangyang_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **테이블 기반 레이아웃**: `table.view_table` 사용
2. **이미지 경로**: `/upload_data/board/bobo/` 디렉토리
3. **페이지네이션**: `nPage` 파라미터
4. **날짜 형식**: `YYYY.MM.DD HH:MM` (마침표 구분)
5. **공공누리**: 제4유형 (출처표시+비상업적 이용+변경금지)
6. **요청 간격**: 1~2초 딜레이 권장

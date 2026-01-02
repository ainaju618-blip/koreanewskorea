# 완도군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 완도군 |
| **지역 코드** | wando |
| **기본 URL** | https://www.wando.go.kr |
| **파일 서버** | https://ws.wando.go.kr |
| **목록 페이지** | /wando/sub.cs?m=299 |
| **상세 페이지** | /wando/sub.cs?m=1023&nttId={ID}&pBoardId=... |
| **렌더링 방식** | 정적 HTML (서버 사이드 렌더링) |
| **인증 필요** | 없음 |
| **총 게시물** | 8,470건 이상 (848페이지) |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.wando.go.kr/wando/sub.cs?m=299
https://www.wando.go.kr/wando/sub.cs?m=299&pageIndex={page}
```

### 상세 페이지
```
https://www.wando.go.kr/wando/sub.cs?m=1023&nttId={nttId}&pBoardId=BBSMSTR_000000000036
```

### 첨부파일 다운로드
```
https://ws.wando.go.kr/ext/html5fileupload/fileDownload.do?fileStoreDir=bbs&fileId={fileId}&fileSeq={seq}
```

### 미리보기 (Synap Viewer)
```
https://ws.wando.go.kr/synap/viewer.jsp?filePath=/upload/sfep/bbs/{YYYYMM}/{DD}/{timestamp}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 카드형 그리드 레이아웃
- 상단 2개: 큰 카드 형태 (2열 배치)
- 나머지: 이미지+텍스트 리스트

**링크 선택자**:
```css
a[href*="nttId="][href*="pBoardId="]
```

**추출 데이터**:
- **제목**: 카드 내 링크 텍스트
- **nttId**: URL 파라미터에서 추출 (`nttId=10010538`)
- **날짜**: 카드 내 날짜 영역 (형식: YYYY-MM-DD)

### 2. 상세 페이지 파싱 (`fetch_detail`)

**본문 선택자**:
```python
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
]
```

**날짜 추출**:
- 패턴: `작성일 YYYY-MM-DD`

**등록자 추출**:
- 패턴: `등록자 : {담당자명}`
- 예: `박여진`

### 3. 이미지 추출 전략

**전략 1**: 첨부파일 다운로드 링크에서 이미지 추출
```css
a[href*="fileDownload.do"], a[href*="ws.wando.go.kr"]
```
- 이미지 확장자 파일(.jpg, .JPG, .png) 필터링

**전략 2**: 본문 내 `img` 태그에서 추출
```css
img[src*="/upload/"], img[src*="ws.wando.go.kr"]
```

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'wando'
REGION_NAME = '완도군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.wando.go.kr'
FILE_SERVER_URL = 'https://ws.wando.go.kr'
LIST_MENU = '299'
DETAIL_MENU = '1023'
BOARD_ID = 'BBSMSTR_000000000036'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python wando_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python wando_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python wando_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **카드형 그리드 레이아웃**: 상단 2개 큰 카드 + 리스트형 혼합
2. **파일 서버 분리**: `ws.wando.go.kr` 별도 서브도메인 사용
3. **페이지네이션**: `pageIndex` 파라미터
4. **Synap Viewer**: HWP, 이미지 파일 미리보기 제공
5. **첨부파일 명명규칙**: "제목.확장자" 형식
6. **공공누리**: 제4유형 (출처표시+상업적 이용금지+변경금지)
7. **총 페이지 수**: 848페이지 (2009년 12월 기록까지 보유)

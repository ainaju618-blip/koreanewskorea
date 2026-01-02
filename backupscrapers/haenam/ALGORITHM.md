# 해남군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 해남군 |
| **지역 코드** | haenam |
| **기본 URL** | https://www.haenam.go.kr |
| **목록 페이지** | /planweb/board/list.9is?contentUid=...&boardUid=... |
| **렌더링 방식** | 정적 HTML (일부 동적 요소) |
| **인증 필요** | 없음 |
| **총 게시물** | 7,943건 이상 |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.haenam.go.kr/planweb/board/list.9is?contentUid={CONTENT_UID}&boardUid={BOARD_UID}
https://www.haenam.go.kr/planweb/board/list.9is?...&nowPageNum={page}
```

### 상세 페이지
```
https://www.haenam.go.kr/planweb/board/view.9is?dataUid=...&nttId={nttId}&contentUid=...&boardUid=...
```

### 첨부파일 다운로드
```
https://portal.haenam.go.kr:444/jfile/readDownloadFile.do?fileId={fileId}&fileSeq={seq}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 카드형 레이아웃 (heading + image + generic)

**링크 선택자**:
```css
a[href*="view.9is"][href*="nttId="]
```

**추출 데이터**:
- **제목**: heading 내 링크 텍스트
- **nttId**: URL 파라미터에서 추출 (`nttId=115854`)
- **날짜**: generic "작성일" 영역 (형식: YYYY-MM-DD)
- **담당부서**: generic "담당부서" 영역

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
- 패턴: `YYYY-MM-DD`

**담당부서 추출**:
- 패턴 1: `〔담당과 팀명 ☎전화번호〕`
- 패턴 2: `담당부서 : {부서명}`
- 예: `건설도시과 도로관리팀`

### 3. 이미지 추출 전략

**전략 1**: 첨부파일 다운로드 링크에서 추출
```css
a[href*="readDownloadFile.do"]
```
- `portal.haenam.go.kr:444` 도메인 사용
- 이미지 파일(.jpg, .JPG) + 문서(.hwp) 함께 제공

**전략 2**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'haenam'
REGION_NAME = '해남군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.haenam.go.kr'
CONTENT_UID = '18e3368f5d745106015d877ab2850a94'
BOARD_UID = '18e3368f5fb80fdc015fdc4c2ac203e7'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python haenam_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python haenam_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python haenam_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **카드형 레이아웃**: heading + image + generic 구조
2. **첨부파일 별도 도메인**: `portal.haenam.go.kr:444` 통합 포털 사용
3. **이미지+문서 혼합**: .jpg + .hwp 파일이 함께 제공되는 경우 많음
4. **페이지네이션**: `nowPageNum` 파라미터 (1페이지당 5건 기본)
5. **게시글 수 조절**: `recordCountPerPage` 파라미터로 10/20/30개 변경 가능
6. **공공누리**: 제4유형 (출처표시+상업적 이용금지+변경금지)

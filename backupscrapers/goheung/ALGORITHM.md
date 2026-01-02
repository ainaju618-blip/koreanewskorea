# 고흥군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 고흥군 |
| **지역 코드** | goheung |
| **기본 URL** | https://www.goheung.go.kr |
| **목록 페이지** | /boardList.do?pageId=www102&boardId=BD_00025 |
| **상세 페이지** | /boardView.do?pageId=www102&boardId=BD_00025&seq={ID}&movePage=1 |
| **렌더링 방식** | 정적 HTML (서버 사이드 렌더링) |
| **인증 필요** | 없음 |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.goheung.go.kr/boardList.do?pageId=www102&boardId=BD_00025
https://www.goheung.go.kr/boardList.do?pageId=www102&boardId=BD_00025&movePage={page}
```

### 상세 페이지
```
https://www.goheung.go.kr/boardView.do?pageId=www102&boardId=BD_00025&seq={seq}&movePage=1
```

### 첨부파일 다운로드
```
https://www.goheung.go.kr/fileDownload.do?action=fileDown&mode=&boardId=BD_00025&seq={seq}&fileSn={순번}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: `ul > li` 또는 `table > tbody > tr`

**링크 선택자**:
```css
a[href*="boardView.do"][href*="seq="]
```

**추출 데이터**:
- **제목**: 링크 텍스트 (`a` 태그 innerText)
- **seq**: URL 파라미터에서 추출 (`?seq=4603198`)
- **날짜**: 부모 요소에서 `YYYY-MM-DD` 패턴 추출

### 2. 상세 페이지 파싱 (`fetch_detail`)

**본문 선택자** (우선순위 순):
```python
CONTENT_SELECTORS = [
    '.board_view_content',
    '.view_content',
    '.board_view',
    '.con-wrap',
    '.view-con',
    '.bbs_view_cont',
    'article',
]
```

**날짜 추출**:
- 패턴: `작성일 : YYYY-MM-DD HH:mm`
- 정규식: `r'작성일\s*[:\s]+(\d{4})-(\d{1,2})-(\d{1,2})\s+\d{1,2}:\d{2}'`

**담당부서 추출**:
- 패턴: `작성자 : 부서명(팀명)`
- 예: `행정과(고향사랑)`

### 3. 이미지 추출 전략

**전략 1**: 첨부파일 링크에서 이미지 파일 추출
```css
a[href*="fileDownload.do"]
```
- 이미지 확장자(.jpg, .jpeg, .png) 확인 후 다운로드

**전략 2**: seq 기반 직접 URL 구성
```
/fileDownload.do?action=fileDown&mode=&boardId=BD_00025&seq={seq}&fileSn=1
```

**전략 3**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'goheung'
REGION_NAME = '고흥군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.goheung.go.kr'
LIST_PATH = '/boardList.do?pageId=www102&boardId=BD_00025'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python goheung_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python goheung_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python goheung_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **정적 HTML**: JavaScript 동적 로딩 없이 서버 렌더링 방식으로 제공
2. **이미지 직접 링크 없음**: 이미지는 본문 내 렌더링되지만 hotlink URL이 노출되지 않음. 첨부파일 다운로드 방식으로 접근 가능
3. **인증 불필요**: 로그인 없이 모든 콘텐츠 접근 가능
4. **URL 패턴**: 강진군과 다른 패턴 사용 (`boardView.do` + `seq` 파라미터)

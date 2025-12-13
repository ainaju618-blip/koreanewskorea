# 함평군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 함평군 |
| **지역 코드** | hampyeong |
| **기본 URL** | https://www.hampyeong.go.kr |
| **목록 페이지** | /boardList.do?boardId=NEWS&pageId=www275 |
| **상세 페이지** | /boardView.do?pageId=www275&boardId=NEWS&seq={ID} |
| **게시판 시스템** | 자체 개발 CMS |
| **렌더링 방식** | 정적 HTML |
| **인증 필요** | 없음 |
| **총 게시물** | 6,789건 이상 (679페이지) |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.hampyeong.go.kr/boardList.do?boardId=NEWS&pageId=www275
https://www.hampyeong.go.kr/boardList.do?boardId=NEWS&pageId=www275&movePage={page}
```

### 상세 페이지
```
https://www.hampyeong.go.kr/boardView.do?pageId=www275&boardId=NEWS&seq={ID}&movePage=1&recordCnt=10
```

### 첨부파일 다운로드
```
https://www.hampyeong.go.kr/fileDownload.do?fileSe=BB&fileKey=NEWS%7C{fileKey}&fileSn={seq}&boardId=NEWS&seq={articleId}
```

### 미리보기
```
https://www.hampyeong.go.kr/filePreView.do?action=I&fileSe=BB&fileKey=NEWS%7C{fileKey}&fileSn={seq}&boardId=NEWS&seq={articleId}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 테이블 형식 (번호, 제목, 작성자, 작성일, 파일, 조회)

**링크 선택자**:
```css
a[href*="boardView.do"][href*="seq="]
```

**추출 데이터**:
- **제목**: 테이블 행 내 링크 텍스트
- **seq**: URL 파라미터에서 추출
- **날짜**: 테이블 행 내 작성일 컬럼 (YYYY-MM-DD)

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
- 패턴: `작성일 : YYYY-MM-DD HH:MM`

**담당부서**:
- 패턴: `작성자 : {부서명}`
- 예: 함평읍, 축산과, 보건행정과

### 3. 이미지 추출 전략

**전략 1**: 첨부파일 다운로드 링크에서 이미지 추출
```css
a[href*="fileDownload.do"], a[href*="fileSe=BB"]
```
- 이미지 확장자 파일(.jpg, .png) 필터링

**전략 2**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'hampyeong'
REGION_NAME = '함평군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.hampyeong.go.kr'
BOARD_ID = 'NEWS'
PAGE_ID = 'www275'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python hampyeong_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python hampyeong_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python hampyeong_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **테이블 형식 목록**: 번호, 제목, 작성자, 작성일, 파일, 조회 컬럼
2. **게시물 ID 비연속**: seq 값이 연속적이지 않음 (시스템 내부 ID)
3. **페이지네이션**: `movePage` 파라미터 (1부터 시작)
4. **첨부파일 키 구조**: `fileKey=NEWS%7C{number}` (%7C = | 문자)
5. **작성자 고정**: 모든 기사가 "기획예산실"로 표시
6. **본문 내 JavaScript**: 필터링 필요
7. **총 게시물**: 6,789건 (679페이지, recordCnt=10)

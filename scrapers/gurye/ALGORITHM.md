# 구례군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 구례군 |
| **지역 코드** | gurye |
| **기본 URL** | https://www.gurye.go.kr |
| **목록 페이지** | /board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000 |
| **상세 페이지** | /board/view.do?bbsId=BBS_0000000000000300&pageIndex=1&nttId={ID}&menuNo=115004006000 |
| **렌더링 방식** | 서버 렌더링 + JavaScript (bxSlider) |
| **인증 필요** | 없음 |
| **총 게시물** | 3,050건 이상 |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000
https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000&pageIndex={page}
```

### 상세 페이지
```
https://www.gurye.go.kr/board/view.do?bbsId=BBS_0000000000000300&pageIndex=1&nttId={nttId}&menuNo=115004006000
```

### 첨부파일 다운로드
```
https://www.gurye.go.kr/board/FileDown.do?atchFileId={fileId}&fileSn={seq}

# ZIP 압축 다운로드
https://www.gurye.go.kr/zip/FileDown.do?atchFileId={fileId}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 카드형 그리드 레이아웃 (3열 배치)

**링크 선택자**:
```css
a[href*="view.do"][href*="nttId="]
```

**추출 데이터**:
- **제목**: 카드 내 제목 텍스트 영역
- **nttId**: URL 파라미터에서 추출 (`?nttId=73012`)
- **날짜**: 카드 하단 (형식: YYYY-MM-DD)

### 2. 상세 페이지 파싱 (`fetch_detail`)

**본문 선택자** (우선순위 순):
```python
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.bbs_view_cont',
    '.con-wrap',
    '.view-con',
    'article',
]
```

**날짜 추출**:
- 패턴: `YYYY-MM-DD`
- 정규식: `r'(\d{4})-(\d{1,2})-(\d{1,2})'`

**담당부서 추출**:
- 패턴: `작성자 : {부서명}`
- 예: `스포츠산업과`

**담당자 연락처**:
- 패턴: `담당자 연락처 : {전화번호}`
- 예: `061-780-8664`

### 3. 이미지 추출 전략

**전략 1**: 첨부파일 다운로드 링크에서 추출
```css
a[href*="FileDown.do"]
```
- 파일명에서 이미지 확장자(.jpg, .jpeg, .png) 확인 후 다운로드

**전략 2**: bxSlider 이미지 갤러리에서 추출
```css
.bxslider img, .bx-wrapper img, .slider img
```

**전략 3**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'gurye'
REGION_NAME = '구례군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.gurye.go.kr'
BBS_ID = 'BBS_0000000000000300'
MENU_NO = '115004006000'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python gurye_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python gurye_scraper.py --start-date 2025-11-01 --end-date 2025-11-20 --max-articles 10

# 전체 수집
python gurye_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **카드형 그리드 레이아웃**: 3열 배치의 카드 형식으로 기사 목록 표시
2. **bxSlider 이미지 갤러리**: 상세 페이지 상단에 이미지 슬라이더 구현 (재생/정지, 이전/다음 버튼)
3. **첨부파일 명명규칙**: `보도자료(YYYYMMDD_제목).확장자` 형식
4. **공공누리**: 제4유형 (출처표시+상업적 이용금지+변경금지)
5. **인증 불필요**: 로그인 없이 모든 콘텐츠 접근 가능
6. **핫링크 허용**: 이미지 직접 접근 가능
7. **전체 다운로드**: ZIP 압축 다운로드 기능 제공

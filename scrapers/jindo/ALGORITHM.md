# 진도군 보도자료 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 진도군 |
| **지역 코드** | jindo |
| **기본 URL** | https://www.jindo.go.kr |
| **목록 페이지** | /home/board/B0016.cs?m=626 |
| **상세 페이지** | ?act=read&articleId={ID}&categoryId=0&m=626 |
| **게시판 시스템** | 자체 개발 CMS |
| **렌더링 방식** | 정적 HTML |
| **인증 필요** | 없음 |
| **총 게시물** | 7,782건 이상 (1,557페이지) |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.jindo.go.kr/home/board/B0016.cs?m=626
https://www.jindo.go.kr/home/board/B0016.cs?m=626&pageIndex={page}
```

### 상세 페이지
```
https://www.jindo.go.kr/home/board/B0016.cs?act=read&articleId={ID}&categoryId=0&m=626
```

### 첨부파일 다운로드
```
https://www.jindo.go.kr/cms/download.cs?atchFile={암호화파일ID}
```

### 미리보기 (Viewer)
```
https://www.jindo.go.kr/viewer/indexDown.jsp?enc=1&sdoc={암호화ID}&stype={확장자}
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: 카드형 리스트 레이아웃
- 좌측 썸네일 이미지 + 우측 제목/카테고리/요약/메타정보

**링크 선택자**:
```css
a[href*="act=read"][href*="articleId="]
```

**추출 데이터**:
- **제목**: 카드 내 링크 텍스트 (카테고리 태그 제거)
- **articleId**: URL 파라미터에서 추출
- **날짜**: 카드 하단 `작성일 : YYYY-MM-DD` 형식
- **카테고리**: 제목 앞 `[카테고리명]` 형식

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
- 패턴: `작성일: YYYY-MM-DD HH:mm`

**담당부서**:
- 기본값: `기획홍보실` (본문에 표시되지 않음)

### 3. 이미지 추출 전략

**전략 1**: 첨부파일 다운로드 링크에서 이미지 추출
```css
a[href*="/cms/download.cs"], a[href*="atchFile="]
```
- 이미지 확장자 파일(.jpg, .png) 필터링

**전략 2**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'jindo'
REGION_NAME = '진도군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jindo.go.kr'
BOARD_ID = 'B0016'
MENU_CODE = '626'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python jindo_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python jindo_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python jindo_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **카드형 리스트 레이아웃**: 썸네일 + 제목 + 카테고리 + 요약
2. **카테고리 시스템**: categoryId로 필터링 가능
3. **페이지네이션**: `pageIndex` 파라미터 (페이지당 5개)
4. **첨부파일 명명규칙**: "순번.제목요약.확장자" 형식
5. **암호화 파일 ID**: Base64 인코딩된 문자열
6. **공공누리**: 제1유형 (출처표시)
7. **총 게시물**: 7,782건 (2006년 6월부터 현재까지)
8. **SNS 공유**: 트위터, 페이스북, 카카오톡 지원

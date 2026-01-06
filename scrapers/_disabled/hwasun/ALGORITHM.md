# 화순군 화순포커스 스크래퍼 알고리즘 문서

## 버전 정보
- **버전**: v1.0
- **최종수정**: 2025-12-13
- **담당**: AI Agent

---

## 📋 대상 사이트 정보

| 항목 | 값 |
|------|-----|
| **지역명** | 화순군 |
| **지역 코드** | hwasun |
| **기본 URL** | https://www.hwasun.go.kr |
| **게시판** | 화순포커스 (포토 갤러리형) |
| **목록 페이지** | /gallery.do?S=S01&M=020101000000&b_code=0000000001 |
| **렌더링 방식** | 정적 HTML (서버 사이드 렌더링) |
| **인증 필요** | 없음 |

---

## 🔗 URL 패턴

### 목록 페이지
```
https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001
https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001&nPage={page}
```

### 상세 페이지
```
https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001&act=view&list_no={list_no}
```

### 이미지 URL
```
https://www.hwasun.go.kr/upfiles/gallery/0000000001/L_0000000001_{timestamp}_{index}.jpg
```

---

## 🔍 알고리즘 상세

### 1. 목록 페이지 파싱 (`collect_articles`)

**목록 구조**: `ul > li` 카드형 구조

**링크 선택자**:
```css
li a[href*="list_no="][href*="act=view"]
```

**추출 데이터**:
- **제목**: 링크 텍스트
- **list_no**: URL 파라미터에서 추출 (`list_no=19942`)
- **날짜**: 부모 li 요소에서 `YYYY-MM-DD` 패턴

### 2. 상세 페이지 파싱 (`fetch_detail`)

**본문 선택자**:
```python
CONTENT_SELECTORS = [
    '.view_content',
    '.gallery_view',
    '.board_view_content',
]
```

**날짜 추출**:
- 패턴: `등록일 : YYYY-MM-DD`

**담당부서 추출**:
- 패턴: `담당부서 : {부서명} {팀명} / {전화번호}`
- 예: `관광체육실 관광개발팀`

### 3. 이미지 추출 전략

**전략 1**: `/upfiles/gallery/` 경로의 이미지 추출
```css
img[src*="/upfiles/gallery/"]
```
- 핫링크 가능, Referer 불필요

**전략 2**: 본문 내 `img` 태그에서 추출

---

## ⚙️ 설정값 (Constants)

```python
REGION_CODE = 'hwasun'
REGION_NAME = '화순군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.hwasun.go.kr'
B_CODE = '0000000001'
```

---

## 🧪 테스트 명령어

```bash
# Dry-run 테스트 (서버 전송 안함)
python hwasun_scraper.py --dry-run --max-articles 5

# 날짜 범위 지정 수집
python hwasun_scraper.py --start-date 2025-12-01 --end-date 2025-12-13 --max-articles 10

# 전체 수집
python hwasun_scraper.py --max-articles 20
```

---

## 📝 특이사항

1. **포토 갤러리형 게시판**: 화순포커스는 이미지 중심 게시판
2. **이미지 핫링크 허용**: 직접 접근 가능, Referer/세션 불필요
3. **이미지 파일 경로**: `/upfiles/gallery/{b_code}/` 구조
4. **페이지네이션**: `nPage` 파라미터 사용
5. **공공누리**: 제4유형 (출처표시+상업적 이용금지+변경금지)

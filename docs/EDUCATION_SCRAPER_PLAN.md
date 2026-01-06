# 17개 시도 교육청 보도자료 스크래퍼 개발 계획

> **작성일:** 2026-01-06
> **상태:** 📋 계획 수립 완료 (개발 대기)
> **목표:** 전국 17개 시도 교육청 보도자료 자동 수집

---

## 📊 현황

| 구분 | 상태 | 파일 |
|------|------|------|
| 광주교육청 | ✅ 완료 | `scrapers/gwangju_edu/gwangju_edu_scraper.py` |
| 전남교육청 | ✅ 완료 | `scrapers/jeonnam_edu/jeonnam_edu_scraper.py` |
| 나머지 15개 | 🔜 개발 필요 | - |

---

## 🔧 플랫폼별 분류

### 1️⃣ NETIS 플랫폼 (7개) - 우선 개발 권장

| 교육청 | URL | 식별자 | 특이사항 |
|--------|-----|--------|----------|
| 부산 | https://www.pen.go.kr/main/na/ntt/selectNttList.do?mi=30397&bbsId=2286 | nttSn | - |
| 대구 | https://www.dge.go.kr/pr/na/ntt/selectNttList.do?mi=9870&bbsId=2680 | nttSn | 갤러리형 레이아웃 |
| 인천 | https://www.ice.go.kr/ice/na/ntt/selectNttList.do?mi=11620&bbsId=1519 | nttSn | tabId 포함 |
| 세종 | https://www.sje.go.kr/sje/na/ntt/selectNttList.do?mi=52234&bbsId=1039263 | nttSn | 작성자 마스킹 |
| 경기 | https://www.goe.go.kr/goe/na/ntt/selectNttList.do?mi=10102&bbsId=1922 | nttSn | 갤러리형 |
| 충북 | https://www.cbe.go.kr/cbe/na/ntt/selectNttList.do?mi=11830&bbsId=1763 | nttSn | ⚠️ 로그인 필요 가능 |
| 경북 | https://www.gbe.kr/news/na/ntt/selectNttList.do?mi=17643&bbsId=4744 | nttSn | 카테고리 필터 있음 |

**공통 패턴:**
- 목록: `selectNttList.do`
- 상세: `selectNttInfo.do?mi={}&bbsId={}&nttSn={}`
- 셀렉터: `table` 또는 `list` 구조

### 2️⃣ GPMS 플랫폼 (2개)

| 교육청 | URL | 식별자 |
|--------|-----|--------|
| 대전 | https://www.dje.go.kr/boardCnts/list.do?boardID=8&menuID=040201 | boardSeq |
| 충남 | http://news.cne.go.kr/boardCnts/list.do?boardID=1003&m=0401&s=news | boardSeq |

**공통 패턴:**
- 목록: `boardCnts/list.do`
- 상세: `boardCnts/view.do?boardID={}&boardSeq={}`

### 3️⃣ BD System (2개)

| 교육청 | URL | 식별자 |
|--------|-----|--------|
| 울산 | https://use.go.kr/news/user/bbs/BD_selectBbsList.do?q_bbsSn=1005 | q_nttSn |
| 경남 | https://www.gne.go.kr/pr/user/bbs/BD_selectBbsList.do?q_bbsSn=1350 | q_nttSn |

**공통 패턴:**
- 목록: `BD_selectBbsList.do`
- 상세: `BD_selectBbsNttView.do?q_bbsSn={}&q_nttSn={}`
- 첨부파일: `ND_fileDownload.do?q_fileSn={}&q_fileId={}`

### 4️⃣ JBE/JJE System (2개)

| 교육청 | URL | 식별자 |
|--------|-----|--------|
| 전북 | https://news.jbe.go.kr/board/list.jbe?boardId=BBS_0000222 | boardNo, dataSid |
| 제주 | https://www.jje.go.kr/pro/board/list.jje?boardId=BBS_0000215 | boardNo, dataSid |

**공통 패턴:**
- 목록: `/board/list.jbe` 또는 `/board/list.jje`
- 상세: `/board/view.jbe?boardId={}&boardNo={}`
- 첨부파일: `/board/download.jbe?boardId={}&dataSid={}&fileSid={}`

### 5️⃣ 커스텀 CMS (2개)

| 교육청 | URL | 특징 |
|--------|-----|------|
| 서울 | https://enews.sen.go.kr/news/list.do?step1=3&step2=1 | form ul li 구조, bbsSn 식별자 |
| 강원 | https://www.gwe.go.kr/promotion/bbs/list.do?key=m2411225294640 | region 요소, idx 식별자 |

---

## 📋 상세페이지 구조 (분석 완료)

### 경남 (BD System)
```
URL: /BD_selectBbs.do?q_bbsSn=1350&q_bbsDocNo={문서번호}

region > heading          → 제목
region > list > listitem  → 부서명 (첫 번째)
region > list > listitem  → 등록일 (두 번째)
region > image            → 본문 이미지
region > generic          → 본문 내용
link[href*="ND_fileDownload"] → 첨부파일
```

### 제주 (JJE System)
```
URL: /pro/board/view.jje?boardId=BBS_0000215&dataSid={dataSid}

region > generic:first    → 제목
region > generic          → 작성자, 연락처, 조회수, 등록일
link > image              → 본문 이미지
region > generic          → 본문 내용
link[href*="/pro/board/download.jje"] → 첨부파일
```

### 전북 (JBE System)
```
URL: /board/view.jbe?boardId=BBS_0000222&dataSid={dataSid}

article > heading         → 제목
article > list > listitem → 작성자, 작성일, 조회수
article > image           → 본문 이미지 (여러 개)
article > generic         → 본문 텍스트 (여러 개)
link[href*="/board/download.jbe"] → 첨부파일
```

### 전남 (NDsoft CMS) - ✅ 구현 완료
```
URL: /news/articleView.html?idxno={기사번호}

banner > heading          → 제목, 부제목
article > list > listitem → 입력일, 기자명
article > generic         → 본문
link[href*="/news/download.php"] → 첨부파일
```

### 서울 (커스텀)
```
URL: /news/view.do?bbsSn={ID}&step1=3&step2=1

generic:first             → 제목
generic                   → 작성일/부서 (예: "2026.01.05 │ 민주시민교육과...")
generic                   → 본문 (여러 개)
listitem > link           → 첨부파일
```

---

## 📁 폴더 구조 계획

```
scrapers/
├── templates/
│   ├── base_scraper.py              # 기존
│   └── education/                    # 🆕 교육청 전용 템플릿
│       ├── netis_edu_template.py    # NETIS (7개)
│       ├── gpms_edu_template.py     # GPMS (2개)
│       ├── bd_edu_template.py       # BD System (2개)
│       └── jbe_edu_template.py      # JBE/JJE (2개)
│
├── education/                        # 🆕 교육청 스크래퍼 (15개)
│   ├── seoul_edu/
│   ├── busan_edu/
│   ├── daegu_edu/
│   ├── incheon_edu/
│   ├── daejeon_edu/
│   ├── ulsan_edu/
│   ├── sejong_edu/
│   ├── gyeonggi_edu/
│   ├── gangwon_edu/
│   ├── chungbuk_edu/
│   ├── chungnam_edu/
│   ├── jeonbuk_edu/
│   ├── gyeongbuk_edu/
│   ├── gyeongnam_edu/
│   └── jeju_edu/
│
├── gwangju_edu/                      # 기존 유지
└── jeonnam_edu/                      # 기존 유지
```

---

## 🗓️ 개발 예상 일정

| Phase | 작업 | 예상 시간 |
|-------|------|-----------|
| 1 | 템플릿 개발 (NETIS, GPMS, BD, JBE) | 2일 |
| 2 | NETIS 플랫폼 7개 | 1일 |
| 3 | GPMS + BD + JBE 6개 | 1일 |
| 4 | 커스텀 (서울, 강원) 2개 | 1일 |
| 5 | 통합 테스트 및 스케줄러 등록 | 1일 |
| **총계** | | **6일** |

---

## ⚠️ 주의사항

1. **충북교육청**: 상세페이지 접근 시 로그인 필요할 수 있음
2. **이미지 다운로드**: 각 교육청마다 URL 패턴 다름
3. **Rate Limiting**: 요청 간격 1초 이상 유지
4. **에러 처리**: ErrorCollector 활용

---

## 🔑 공통 추출 패턴 요약

### 제목 추출
```python
title = page.select_one('heading, article heading, region heading, banner heading').text
# 제주는 generic 사용
title = page.select_one('region > generic:first-child').text
```

### 본문 추출
```python
content_elements = page.select('generic, article generic, region generic')
content = '\n'.join([el.text for el in content_elements])
```

### 첨부파일 추출
```python
# 플랫폼별 패턴
files = page.select('a[href*="ND_fileDownload"]')      # 경남
files = page.select('a[href*="/pro/board/download.jje"]')  # 제주
files = page.select('a[href*="/board/download.jbe"]')  # 전북
files = page.select('a[href*="/news/download.php"]')   # 전남
```

### 날짜 추출
```python
import re
date_pattern = r'\d{4}[-./]\d{2}[-./]\d{2}'
date = re.search(date_pattern, page_text).group()
```

---

*이 문서는 개발 착수 시 참고용으로 작성되었습니다.*

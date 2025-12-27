# 정부 부처 보도자료 스크래핑 분석 의뢰서

> **작성일:** 2025-12-25
> **목적:** 각 부처 홈페이지 보도자료 페이지 구조 분석 및 셀렉터 검증

---

## 1. 의뢰 개요

정부 부처별 보도자료 페이지의 HTML 구조를 분석하여 스크래핑에 필요한 CSS 셀렉터를 검증해주세요.

**필요 정보:**
1. 목록 페이지 셀렉터 (기사 링크, 제목, 날짜)
2. 상세 페이지 셀렉터 (본문, 이미지, 첨부파일)
3. 페이지네이션 방식 (GET 파라미터, JavaScript 등)
4. 보안/차단 여부 (WAF, CAPTCHA, Rate Limiting)

---

## 2. 분석 대상 부처 (18개)

### 2.1 핵심 부처 (우선순위 높음)

| # | 부처명 | 홈페이지 | 보도자료 페이지 |
|---|--------|----------|-----------------|
| 1 | **국방부** | https://www.mnd.go.kr | https://www.mnd.go.kr/mbshome/mbs/mnd/subview.jsp?id=mnd_020500000000 |
| 2 | **기획재정부** | https://www.moef.go.kr | https://www.moef.go.kr/nw/nes/nesdta.do?menuNo=4010100 |
| 3 | **외교부** | https://www.mofa.go.kr | https://www.mofa.go.kr/www/brd/m_4080/list.do |
| 4 | **보건복지부** | https://www.mohw.go.kr | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027 |

### 2.2 주요 부처

| # | 부처명 | 홈페이지 | 보도자료 페이지 |
|---|--------|----------|-----------------|
| 5 | **과학기술정보통신부** | https://www.msit.go.kr | https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=112 |
| 6 | **산업통상자원부** | https://www.motie.go.kr | https://www.motie.go.kr/motie/ne/presse/press2/bbs/bbsList.do |
| 7 | **국토교통부** | https://www.molit.go.kr | https://www.molit.go.kr/USR/NEWS/m_71/lst.jsp |
| 8 | **환경부** | https://www.me.go.kr | https://www.me.go.kr/home/web/board/read.do?menuId=10525 |
| 9 | **고용노동부** | https://www.moel.go.kr | https://www.moel.go.kr/news/enews/report/enewsList.do |
| 10 | **교육부** | https://www.moe.go.kr | https://www.moe.go.kr/boardCnts/listRenew.do?boardID=294 |

### 2.3 일반 부처

| # | 부처명 | 홈페이지 | 보도자료 페이지 |
|---|--------|----------|-----------------|
| 11 | **법무부** | https://www.moj.go.kr | https://www.moj.go.kr/moj/221/subview.do |
| 12 | **행정안전부** | https://www.mois.go.kr | https://www.mois.go.kr/frt/bbs/type010/commonSelectBoardList.do?bbsId=BBSMSTR_000000000008 |
| 13 | **문화체육관광부** | https://www.mcst.go.kr | https://www.mcst.go.kr/kor/s_notice/press/pressView.jsp |
| 14 | **농림축산식품부** | https://www.mafra.go.kr | https://www.mafra.go.kr/bbs/mafra/68/artclList.do |
| 15 | **여성가족부** | https://www.mogef.go.kr | https://www.mogef.go.kr/nw/enw/nw_enw_s001.do |
| 16 | **해양수산부** | https://www.mof.go.kr | https://www.mof.go.kr/article/list.do?menuKey=376 |
| 17 | **중소벤처기업부** | https://www.mss.go.kr | https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=86 |
| 18 | **통일부** | https://www.unikorea.go.kr | https://www.unikorea.go.kr/unikorea/news/release/ |

---

## 3. 분석 요청 항목

각 부처별로 다음 정보를 분석해주세요:

### 3.1 목록 페이지

```
1. 기사 목록 컨테이너 셀렉터
   예: .board_list, table.list, ul.news_list

2. 개별 기사 링크 셀렉터
   예: .board_list a, tbody tr a

3. 제목 추출 셀렉터
   예: a > span.title, td.subject a

4. 날짜 추출 셀렉터
   예: td.date, span.date, dd:nth-child(2)

5. 페이지네이션 방식
   - GET 파라미터: ?page=2, ?pageIndex=2
   - JavaScript: onclick="goPage(2)"
   - AJAX 호출 여부
```

### 3.2 상세 페이지

```
1. 본문 컨테이너 셀렉터
   예: .view_cont, #content, .board_view

2. 본문이 iframe 안에 있는지 여부
   - iframe 사용 시: iframe name/id, 내부 URL 패턴

3. 제목 셀렉터
   예: h2.title, .view_title

4. 작성일 셀렉터
   예: .info .date, dd:has-text("작성일")

5. 이미지 셀렉터
   - og:image 메타태그 유무
   - 본문 내 이미지: .view_cont img

6. 첨부파일 셀렉터
   예: a[href*="download"], .file_list a
```

### 3.3 보안/차단 분석

```
1. WAF (Web Application Firewall) 존재 여부
2. CAPTCHA 사용 여부
3. Rate Limiting 여부
4. 필수 쿠키/세션 요구 사항
5. User-Agent 검증 여부
```

---

## 4. 분석 결과 양식

각 부처별로 아래 양식으로 결과를 작성해주세요:

```markdown
## [부처명] 분석 결과

### 기본 정보
- 홈페이지:
- 보도자료 URL:
- 보안 수준: LOW / MEDIUM / HIGH

### 목록 페이지 셀렉터
| 요소 | 셀렉터 | 비고 |
|------|--------|------|
| 컨테이너 | | |
| 기사 링크 | | |
| 제목 | | |
| 날짜 | | |

### 상세 페이지 셀렉터
| 요소 | 셀렉터 | 비고 |
|------|--------|------|
| 본문 | | iframe 여부: |
| 제목 | | |
| 날짜 | | |
| 이미지 | | |
| 첨부파일 | | |

### 페이지네이션
- 방식:
- 파라미터:

### 특이사항
-

### 샘플 데이터 (최근 3개 기사)
| # | 제목 | 날짜 | 이미지 | 첨부 |
|---|------|------|:------:|:----:|
| 1 | | | O/X | O/X |
| 2 | | | O/X | O/X |
| 3 | | | O/X | O/X |
```

---

## 5. 참고 사항

### 5.1 이미 분석 완료된 사이트

- **korea.kr** (정책브리핑): 완료
  - 특이사항: docViewer iframe 안에 본문 존재
  - 셀렉터: innerWrap 프레임에서 추출

### 5.2 국방부 초기 분석 결과

```
- 목록 URL: /user/newsInUserRecord.action?siteId=mnd&handle=I_669&id=mnd_020500000000
- 기사 클릭: onclick="jf_view('I_XXXXXX')"
- 상세 URL 패턴: newsSeq=I_XXXXXX
- 문제점: 직접 URL 접근 시 빈 페이지, 클릭 통해서만 접근 가능
```

### 5.3 공통 패턴 (정부 표준 프레임워크)

많은 정부 사이트가 eGovFrame 기반으로 구축되어 유사한 패턴 사용:
- `/bbs/selectBoardList.do`
- `/board.es`
- `bbsId=BBSMSTR_XXXXXX`

---

## 6. 연락처

분석 완료 후 결과를 공유해주세요.

---

*의뢰일: 2025-12-25*

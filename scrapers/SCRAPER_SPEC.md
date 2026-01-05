# 17개 시·도 보도자료 스크래퍼 기술 명세서

> **조사일**: 2026-01-05
> **조사자**: Perplexity AI
> **프로젝트**: koreanewskorea (전국판)

---

## 종합 요약표

| # | 지역 | 코드 | 보도자료 URL | 페이지 유형 | JS 필요 | 특이사항 |
|---|------|------|--------------|------------|---------|----------|
| 1 | 서울특별시 | seoul | seoul.go.kr/news/news_report.do | SPA | 예 | 해시 라우팅 |
| 2 | 부산광역시 | busan | busan.go.kr/nbtnewsBU | HTML | 아니오 | 카드 레이아웃 |
| 3 | 대구광역시 | daegu | info.daegu.go.kr/newshome | PHP | 아니오 | 별도 서브도메인 |
| 4 | 인천광역시 | incheon | incheon.go.kr/IC010101 | HTML | 부분 | - |
| 5 | 광주광역시 | gwangju | news.gwangju.go.kr | HTML | 아니오 | 별도 뉴스 포털 |
| 6 | 대전광역시 | daejeon | daejeon.go.kr/drh/board | HTML | 아니오 | - |
| 7 | 울산광역시 | ulsan | ulsan.go.kr/u/rep/bbs | HTML | 아니오 | - |
| 8 | 세종특별자치시 | sejong | sejong.go.kr/bbs/R0071 | HTML | 아니오 | - |
| 9 | 경기도 | gyeonggi | gnews.gg.go.kr | HTML | 아니오 | 별도 뉴스 사이트 |
| 10 | 강원특별자치도 | gangwon | state.gwd.go.kr/portal | HTML | 아니오 | 특별자치도 |
| 11 | 충청북도 | chungbuk | chungbuk.go.kr/www | HTML | 아니오 | - |
| 12 | 충청남도 | chungnam | chungnam.go.kr/cnportal | 하이브리드 | 예 | 동적 로딩 |
| 13 | 전북특별자치도 | jeonbuk | jeonbuk.go.kr/board | HTML | 아니오 | 특별자치도 |
| 14 | 전라남도 | jeonnam | jeonnam.go.kr/M7124 | HTML | 아니오 | 팝업 다수 |
| 15 | 경상북도 | gyeongbuk | gb.go.kr/Main/page.do | HTML | 아니오 | - |
| 16 | 경상남도 | gyeongnam | gyeongnam.go.kr/board | HTML | 아니오 | - |
| 17 | 제주특별자치도 | jeju | jeju.go.kr/news/bodo | HTML | 아니오 | 특별자치도 |

---

## 상세 정보

### 1. 서울특별시 (seoul) ✅ 완료

```yaml
목록_URL: https://www.seoul.go.kr/news/news_report.do
상세_URL_패턴: "#view/{article_id}"
페이지네이션: "#list/{page_num}"
페이지_유형: SPA (해시 라우팅)
JS_필요: 예
날짜_형식: YYYY-MM-DD

목록_셀렉터:
  테이블: "table tbody tr"
  제목_링크: "td:nth-child(2) a"
  날짜: "td:nth-child(4)"
  번호: "td:nth-child(1)"

상세_셀렉터:
  본문: "table tbody:last-of-type tr td"
  제목: "table tbody tr th p:first-child"
  날짜: "table tbody tr th p span"
  첨부파일: "a[href*='download']"
```

### 2. 부산광역시 (busan)

```yaml
목록_URL: https://www.busan.go.kr/nbtnewsBU
상세_URL_패턴: "/nbtnewsBU/{article_id}"
페이지네이션: "?curPage={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

목록_셀렉터:
  컨테이너: "main ul > li"
  개별_기사: "li > a"
  제목: "카드 내 제목 영역"
  날짜: "메타 정보 영역"
  썸네일: "li img"

상세_셀렉터:
  본문: "텍스트 영역"
  제목: "main 내 제목 영역"
  날짜: "'작성일' 레이블 옆"
  담당부서: "'부서명' 레이블 옆"
  첨부파일: "a[href*='/comm/getFile']"

특이사항: 카드 레이아웃, 썸네일 이미지 있음
```

### 3. 대구광역시 (daegu)

```yaml
목록_URL: https://info.daegu.go.kr/newshome/mtnmain.php?mtnkey=scatelist&mkey=26
상세_URL_패턴: "mtnmain.php?mtnkey=articleview&mkey=scatelist&mkey2=26&aid={article_id}"
페이지네이션: "&bpage={page_num}"
페이지_유형: PHP
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

목록_셀렉터:
  컨테이너: "ul > li"
  개별_기사: "li > a"
  제목: "카드 내 제목 텍스트"
  날짜: "날짜 영역"
  썸네일: "li img"

특이사항: 별도 뉴스룸 서브도메인 (info.daegu.go.kr)
```

### 4. 인천광역시 (incheon)

```yaml
목록_URL: https://www.incheon.go.kr/IC010101
상세_URL_패턴: "/IC010101/{article_id}"
페이지네이션: "?page={page_num}"
페이지_유형: HTML
JS_필요: 부분적
날짜_형식: YYYY-MM-DD

목록_셀렉터:
  컨테이너: "게시판 테이블/리스트"
  제목_링크: "게시물 제목 링크"
  날짜: "날짜 셀"
```

### 5. 광주광역시 (gwangju)

```yaml
뉴스_포털: https://news.gwangju.go.kr/
목록_URL: https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789
상세_URL_패턴: "boardView.do?pageId=www789&boardId=BD_0000000027&seq={id}"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

특이사항: 별도 뉴스 포털 (news.gwangju.go.kr) 운영
```

### 6. 대전광역시 (daejeon)

```yaml
목록_URL: https://www.daejeon.go.kr/drh/board/boardNormalList.do?boardId=normal_0096&menuSeq=1631
상세_URL_패턴: "boardNormalView.do?ntatcSeq={id}&menuSeq=1631&boardId=normal_0096"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

### 7. 울산광역시 (ulsan)

```yaml
목록_URL: https://www.ulsan.go.kr/u/rep/bbs/list.ulsan?bbsId=BBS_0000000000000003&mId=001004001001000000
상세_URL_패턴: "bbs/view.ulsan?bbsId=BBS_0000000000000003&nttSeq={id}"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

### 8. 세종특별자치시 (sejong)

```yaml
목록_URL: https://www.sejong.go.kr/bbs/R0071/list.do
상세_URL_패턴: "bbs/R0071/view.do?nttId={id}"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

### 9. 경기도 (gyeonggi)

```yaml
목록_URL: https://gnews.gg.go.kr/briefing/brief_gongbo.do
상세_URL_패턴: "news/news_detail.do?number={id}"
페이지네이션: "?page={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

특이사항: 별도 뉴스 사이트 (gnews.gg.go.kr)
```

### 10. 강원특별자치도 (gangwon)

```yaml
목록_URL: https://state.gwd.go.kr/portal/briefing/pressRelease
상세_URL_패턴: "/portal/briefing/pressRelease/view?seq={id}"
페이지네이션: "?page={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

특이사항: state.gwd.go.kr 서브도메인
```

### 11. 충청북도 (chungbuk)

```yaml
목록_URL: https://www.chungbuk.go.kr/www/selectBbsNttList.do?bbsNo=60&key=421
상세_URL_패턴: "selectBbsNttView.do?key=421&bbsNo=60&nttNo={id}"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

### 12. 충청남도 (chungnam) ⚠️ JS 필요

```yaml
목록_URL: https://www.chungnam.go.kr/cnportal/media/articleMain/mainAlm.do
상세_URL_패턴: "확인 필요 (동적 로딩 가능성)"
페이지_유형: 하이브리드 (SPA 가능성)
JS_필요: 예 (동적 로딩)
날짜_형식: YYYY-MM-DD

특이사항: 로딩 시 JS 렌더링 필요
```

### 13. 전북특별자치도 (jeonbuk)

```yaml
목록_URL: https://www.jeonbuk.go.kr/board/list.jeonbuk?boardId=BBS_0000005&menuCd=DOM_000000102001001000
상세_URL_패턴: "board/view.jeonbuk?boardId=BBS_0000005&dataSid={id}"
페이지네이션: "?startPage={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

### 14. 전라남도 (jeonnam)

```yaml
목록_URL: https://www.jeonnam.go.kr/M7124/boardList.do?menuId=jeonnam0201000000
상세_URL_패턴: "M7124/boardView.do?seq={id}&menuId=jeonnam0201000000"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

특이사항: 팝업 창이 여러 개 표시될 수 있음
```

### 15. 경상북도 (gyeongbuk)

```yaml
목록_URL: https://www.gb.go.kr/Main/page.do?mnu_uid=6792&LARGE_CODE=720&MEDIUM_CODE=50&SMALL_CODE=10&SMALL_CODE2=60
상세_URL_패턴: "쿼리 파라미터 기반"
페이지네이션: "?pageIndex={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

### 16. 경상남도 (gyeongnam)

```yaml
목록_URL: https://www.gyeongnam.go.kr/board/list.gyeong?boardId=BBS_0000060&menuCd=DOM_000000135002001000
상세_URL_패턴: "board/view.gyeong?boardId=BBS_0000060&dataSid={id}"
페이지네이션: "?startPage={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD

특이사항: categoryCode1=A 파라미터 사용
```

### 17. 제주특별자치도 (jeju)

```yaml
목록_URL: https://www.jeju.go.kr/news/bodo/list.htm
상세_URL_패턴: "list.htm?act=view&seq={id}"
페이지네이션: "?page={page_num}"
페이지_유형: HTML
JS_필요: 아니오
날짜_형식: YYYY-MM-DD
```

---

## 개발 우선순위 권장

### 1순위 (Playwright 필수 - SPA/동적)
1. 서울시 ✅ (완료)
2. 충남

### 2순위 (일반 HTML - 쉬움)
3. 부산시
4. 대전시
5. 울산시
6. 세종시
7. 충북
8. 전북
9. 전남
10. 경북
11. 경남
12. 제주

### 3순위 (별도 서브도메인)
13. 대구시 (info.daegu.go.kr)
14. 광주시 (news.gwangju.go.kr)
15. 경기도 (gnews.gg.go.kr)
16. 강원도 (state.gwd.go.kr)

### 4순위 (추가 조사 필요)
17. 인천시 (부분적 JS)

---

## 스크래퍼 개발 체크리스트

### 1순위 (Playwright 필수 - SPA/동적) ✅ 완료
- [x] 서울시 (seoul) - SPA 대응 완료
- [x] 충청남도 (chungnam) - JS/SPA 동적 로딩 대응 완료

### 2순위 (일반 HTML) ✅ 완료
- [x] 부산시 (busan) - 카드 레이아웃
- [x] 대전시 (daejeon)
- [x] 울산시 (ulsan)
- [x] 세종시 (sejong)
- [x] 충청북도 (chungbuk)
- [x] 전북특별자치도 (jeonbuk)
- [x] 전라남도 (jeonnam)
- [x] 경상북도 (gyeongbuk)
- [x] 경상남도 (gyeongnam)
- [x] 제주특별자치도 (jeju)

### 3순위 (별도 서브도메인) ✅ 완료
- [x] 대구시 (daegu) - info.daegu.go.kr
- [x] 광주시 (gwangju) - gwangju.go.kr
- [x] 경기도 (gyeonggi) - gnews.gg.go.kr
- [x] 강원특별자치도 (gangwon) - state.gwd.go.kr

### 4순위 (추가 조사 필요) ✅ 완료
- [x] 인천시 (incheon) - 부분 JS 대응 완료

---

## 완료 현황: 17/17 (100%)

---

**참고**: 이 명세서는 2026년 1월 기준 정보입니다. 사이트 구조 변경 시 업데이트가 필요합니다.

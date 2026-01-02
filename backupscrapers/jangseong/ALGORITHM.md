# 장성군청 보도자료 스크래퍼 알고리즘

## 개요
- **버전**: v2.0
- **대상**: 장성군청 보도자료 게시판
- **사이트**: https://www.jangseong.go.kr/home/www/news/jangseong/bodo

## 수집 흐름

### 1단계: 목록 페이지 스캔
1. 목록 URL에 접속 (`/home/www/news/jangseong/bodo?page={n}`)
2. 기사 링크 추출: `a[href*="/bodo/show/"]`
3. 1~3 페이지 순회
4. 각 기사별 ID, 제목, URL 수집

### 2단계: 상세 페이지 분석
1. 각 상세 페이지 방문
2. 본문 추출 (셀렉터): `.view_content`, `.board_view_body`, `.content`
3. 이미지 추출 (셀렉터): `.img_control img`, `.view_content img`
4. 날짜 추출: 페이지 내 YYYY-MM-DD 패턴 검색
5. 담당부서 추출: `실`, `과`, `팀`, `센터` 패턴 매칭

### 3단계: 데이터 저장
1. 이미지 로컬 저장 (`public/images/jangseong/`)
2. API를 통해 DB 저장

## 셀렉터 정보

| 항목 | 셀렉터 |
|------|--------|
| 기사 링크 | `a[href*="/bodo/show/"]` |
| 본문 | `.view_content`, `.board_view_body`, `.content` |
| 이미지 | `.img_control img`, `.view_content img` |

## 특이사항
- 날짜가 목록에 없어 상세 페이지에서 추출
- 이미지는 `.img_control` 클래스 내부에 주로 위치
- 아이콘/로고 이미지는 필터링 (icon, logo, button, kogl 키워드)

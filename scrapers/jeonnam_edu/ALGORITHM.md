# 전남교육청(전남교육통) 스크래퍼 알고리즘

## 기본 정보

| 항목 | 값 |
|------|-----|
| 지역코드 | `jeonnam_edu` |
| 지역명 | 전남교육청 |
| 카테고리 | 전남 |
| 사이트 | https://www.jnedu.kr/ |
| 대상 게시판 | 본청 기사목록 (S1N1) |

## URL 패턴

```
목록: https://www.jnedu.kr/news/articleList.html?sc_section_code=S1N1&view_type=sm&page={n}
상세: https://www.jnedu.kr/news/articleView.html?idxno={id}
```

## 셀렉터

### 목록 페이지
| 요소 | 셀렉터 |
|------|--------|
| 기사 항목 | `section.article-list-content ul.type-section li` |
| 제목 링크 | `h4.titles a` |
| 요약문 | `p.lead a` |
| 날짜 | `span.byline em:last-child` |

### 상세 페이지
| 요소 | 셀렉터 |
|------|--------|
| 제목 | `header.article-view-header h2.heading` |
| 본문 | `article#article-view-content-div` |
| 날짜 | `header.article-view-header ul.infomation li` |
| 이미지 | `article#article-view-content-div figure.photo-layout img` |

## 날짜 형식

- 입력: `입력 2025.12.12 15:43` 또는 `2025.12.12 15:43`
- 출력: `YYYY-MM-DD`

## 특이사항

1. **JavaScript 불필요**: 정적 HTML 페이지로 Playwright로 직접 접근 가능
2. **핫링크 허용**: 이미지 직접 접근 가능 (Referer 불필요)
3. **페이지네이션**: URL 파라미터 `page=` 사용
4. **카테고리 구분**:
   - S1N1: 본청
   - S1N2: 기관
   - S1N3: 학교
   - S1N4: 참여

## 버전 이력

| 버전 | 날짜 | 변경내용 |
|------|------|----------|
| v1.0 | 2025-12-13 | 최초 개발 |

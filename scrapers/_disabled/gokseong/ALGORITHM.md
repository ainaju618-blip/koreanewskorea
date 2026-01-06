# 곡성군 보도자료 스크래퍼 알고리즘

> **버전:** v1.0
> **최종수정:** 2025-12-12
> **담당:** AI Agent

---

## 1. 대상 사이트

| 항목 | 값 |
|------|-----|
| 사이트 | 곡성군청 |
| 목록 URL | https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151 |
| 상세 URL 패턴 | `nttId={게시글ID}` 파라미터 |

---

## 2. 페이지 구조

### 2.1 목록 페이지

```
URL: https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&pageIndex={페이지}

구조:
<table class="tbl_list">
  <tbody>
    <tr>
      <td>번호 (또는 "공지")</td>
      <td><a href="view.do?...nttId=105322">기사 제목</a></td>
      <td>담당부서</td>
      <td>2025-12-11</td>
      <td>조회수</td>
    </tr>
  </tbody>
</table>
```

### 2.2 상세 페이지

```
URL: https://www.gokseong.go.kr/kr/board/view.do?bbsId=BBS_000000000000151&nttId={ID}

구조:
- 본문: div.view_con 또는 div.bbs_view_con
- 날짜: th:has-text("등록일") + td
- 담당부서: th:has-text("담당부서") + td
- 이미지: 본문 내 img 태그
```

---

## 3. 수집 알고리즘

```
1. 목록 페이지 접근 (pageIndex=1부터)
2. 각 행(tr)에서:
   - 공지사항 제외 (번호가 "공지"인 경우)
   - 제목, URL, 날짜 추출
   - 날짜 필터링 (days 파라미터)
3. 상세 페이지 접근:
   - 본문 추출
   - 이미지 추출 (본문 img 또는 첨부파일)
   - 이미지 없으면 스킵
   - Cloudinary 업로드
4. API 전송
5. 다음 페이지 반복 (최대 5페이지)
```

---

## 4. 셀렉터

| 용도 | 셀렉터 |
|------|--------|
| 목록 행 | `table.tbl_list tbody tr` |
| 제목 링크 | `a` (첫 번째) |
| 본문 영역 | `div.view_con`, `div.bbs_view_con` |
| 날짜 | `th:has-text("등록일") + td` |
| 담당부서 | `th:has-text("담당부서") + td` |
| 본문 이미지 | `div.view_con img` |

---

## 5. 특이사항

1. **공지사항 제외**: 번호 컬럼이 "공지"인 경우 스킵
2. **URL 패턴**: `nttId` 파라미터로 게시글 식별
3. **이미지 필수**: 이미지 없는 기사는 수집하지 않음
4. **페이지네이션**: `pageIndex` 파라미터 사용

---

## 6. 수집 예시

```json
{
  "id": "105322",
  "title": "곡성읍 이장단, 곡성군미래교육재단에 150만 원 기탁",
  "date": "2025-12-11",
  "url": "https://www.gokseong.go.kr/kr/board/view.do?bbsId=BBS_000000000000151&nttId=105322",
  "department": "미래교육재단 행정운영팀"
}
```

---

*이 문서는 곡성군 스크래퍼의 알고리즘을 설명합니다.*

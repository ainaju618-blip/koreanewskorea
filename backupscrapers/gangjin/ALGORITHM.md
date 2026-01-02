# 강진군 보도자료 스크래퍼 알고리즘

> **버전:** v1.0
> **최종수정:** 2025-12-12
> **담당:** AI Agent (Claude)

---

## 1. 개요

| 항목 | 값 |
|------|-----|
| 기관 | 강진군청 |
| 대상 | 보도자료 |
| URL | https://www.gangjin.go.kr/www/government/news/press |
| 방식 | Playwright (동적 렌더링) |
| 이미지 | 로컬 저장 (`/images/gangjin/`) |

---

## 2. URL 패턴

### 목록 페이지
```
https://www.gangjin.go.kr/www/government/news/press
https://www.gangjin.go.kr/www/government/news/press?page=2
```

### 상세 페이지
```
https://www.gangjin.go.kr/www/government/news/press?idx={게시물ID}&mode=view
```

---

## 3. 셀렉터 매핑

### 3.1 목록 페이지

| 요소 | 셀렉터 | 비고 |
|------|--------|------|
| 기사 링크 | `a[href*="idx="][href*="mode=view"]` | idx와 mode=view 포함하는 링크 |
| 제목 | 링크 텍스트 (innerText) | `.strip()` 처리 |
| 날짜 | 상세 페이지에서 추출 | 목록에서 추출 불가 |

### 3.2 상세 페이지

| 요소 | 셀렉터 | 비고 |
|------|--------|------|
| 본문 | `div.text_viewbox` | 메인 콘텐츠 영역 |
| 날짜 | `div.view_titlebox dd` | 첫 번째 dd 태그 |
| 담당부서 | `#page_info dd` | 부서명 추출 |
| 이미지 | `div.image_viewbox img` | 대표 이미지 |

---

## 4. 데이터 추출 알고리즘

### 4.1 목록 수집 흐름

```
1. LIST_URL 접속
2. 페이지 로딩 대기 (networkidle)
3. a[href*="idx="][href*="mode=view"] 셀렉터로 기사 링크 추출
4. 각 링크에서 href와 제목 추출
5. 중복 제거 (seen_urls set 사용)
6. 최대 수집 개수 도달 시 중단
```

### 4.2 상세 페이지 추출

```
1. 상세 URL 접속
2. 본문 추출: div.text_viewbox 내용
3. clean_content()로 메타정보 제거
4. 날짜 추출: div.view_titlebox dd (첫 번째)
5. 날짜 정규화: normalize_date()
6. 담당부서 추출: #page_info dd
7. 이미지 추출: div.image_viewbox img[src]
8. 이미지 로컬 저장: save_image_locally()
```

### 4.3 본문 정리 (clean_content)

제거 대상 패턴:
- `작성자:`, `작성일:`, `조회수:`
- `담당부서:`, `전화번호:`, `등록일:`
- `첨부파일`, `hwp`, `pdf` 관련
- 연속 공백 및 빈 줄 정리

---

## 5. 이미지 처리

### 5.1 저장 방식
- **저장 위치:** `web/public/images/gangjin/`
- **파일명:** MD5 해시 기반 (`{hash}.jpg`)
- **반환 경로:** `/images/gangjin/{hash}.jpg`

### 5.2 처리 흐름
```
1. div.image_viewbox img에서 src 추출
2. 상대 경로면 BASE_URL과 결합
3. requests로 이미지 다운로드 (verify=False)
4. 로컬에 저장
5. 웹 경로 반환
```

---

## 6. 날짜 정규화

### 입력 패턴
- `2025-12-12`
- `2025.12.12`
- `2025년 12월 12일`

### 출력 형식
- `YYYY-MM-DD`

### 정규화 로직
```python
def normalize_date(date_str):
    # 숫자만 추출
    numbers = re.findall(r'\d+', date_str)
    if len(numbers) >= 3:
        year, month, day = numbers[0], numbers[1], numbers[2]
        return f"{year}-{int(month):02d}-{int(day):02d}"
    return None
```

---

## 7. 예외 처리

| 상황 | 처리 방법 |
|------|----------|
| 기사 목록 없음 | 다음 셀렉터 시도 후 빈 리스트 반환 |
| 본문 추출 실패 | 빈 문자열 반환 |
| 이미지 없음 | None 반환 |
| 날짜 파싱 실패 | None 반환 |
| 네트워크 오류 | 로깅 후 해당 기사 스킵 |

---

## 8. 제한 사항

| 항목 | 값 |
|------|-----|
| 1회 최대 수집 | 10개 |
| 기사 간 대기 | 0.5~1초 |
| 본문 최대 길이 | 5000자 |
| 페이지 타임아웃 | 15초 |

---

## 9. 테스트 결과

### 품질 테스트 (2025-12-12)
```
[날짜] 2025-12-10
[담당부서] 기획홍보실 홍보팀
[이미지] /images/gangjin/27ec21a7699719a85038d72f8736d51a.jpg
[본문 길이] 1373자
>>> 본문 깨끗함! (메타정보 없음)
```

### 통합 테스트 (2025-12-12)
```
[완료] 수집 완료 (총 3개, 신규 2개, 이미지 2개, 스킵 0개)
```

---

## 10. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2025-12-12 | v1.0 | 초기 개발 완료 |

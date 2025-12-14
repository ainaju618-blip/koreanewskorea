# [ERROR] 스크래퍼 이미지 누락

> **발생 빈도:** 높음
> **최종 수정:** 2025-12-15

## 증상
- 기사 썸네일이 빈 박스
- `thumbnail_url`이 null 또는 빈 문자열

## 원인
1. **셀렉터 문제** - 이미지가 다른 컨테이너
2. **핫링크 방지** - 403 응답 → `image-403.md`
3. **JS 렌더링** - 동적 로드
4. **첨부파일** - 본문이 아닌 첨부 영역

## 해결

### 1. 셀렉터 확인
```python
IMAGE_SELECTORS = [
    '.view-content img',
    '.board-view img',
    '.article-body img',
    '#contents img',
]
```

### 2. 대기 추가
```python
page.wait_for_load_state('networkidle')
page.wait_for_selector('.view-content img', timeout=5000)
```

### 3. 첨부파일 확인
```python
attachments = page.query_selector_all('.attach-file a')
for att in attachments:
    href = att.get_attribute('href')
    if any(ext in href.lower() for ext in ['.jpg', '.png', '.gif']):
        image_url = urljoin(BASE_URL, href)
```

## 해결 이력
| 날짜 | 지역 | 원인 | 버전 |
|------|------|------|------|
| 2025-12-14 | 무안군 | 첨부파일 | v1.4 |
| 2025-12-14 | 순천시 | JS 다운로드 | v3.1 |

## 관련
- `image-403.md` - 핫링크 방지
- `js-download.md` - JS 다운로드

# [ERROR] 이미지 403 (핫링크 방지)

> **발생 빈도:** 중간
> **최종 수정:** 2025-12-15

## 증상
- 이미지 다운로드 시 403 Forbidden
- 브라우저에서는 보이지만 코드에서 안됨

## 원인
서버가 Referer 헤더 확인 (핫링크 방지)

## 해결
```python
from utils.local_image_saver import download_and_save_locally

# Referer 헤더 포함하여 다운로드
local_path = download_and_save_locally(
    image_url,
    BASE_URL,  # Referer로 사용
    REGION_CODE
)
```

## 적용 지역
- 광주광역시
- 전라남도
- 대부분의 공공기관

## 관련
- `image-missing.md` - 이미지 누락 전체

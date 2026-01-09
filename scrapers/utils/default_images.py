# -*- coding: utf-8 -*-
"""17개 시·도 기본 이미지 URL
이미지를 찾지 못한 경우 사용할 기본 썸네일
"""

# 17개 시·도 기본 이미지 (Cloudinary에 업로드된 플레이스홀더 이미지)
# 추후 각 시도별 공식 로고/대표 이미지로 교체 가능
DEFAULT_REGION_IMAGES = {
    # 광역시 (8개)
    'seoul': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782338/regions/seoul_default.png',
    'busan': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782339/regions/busan_default.png',
    'incheon': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782340/regions/incheon_default.png',
    'daegu': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782341/regions/daegu_default.png',
    'daejeon': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782342/regions/daejeon_default.png',
    'gwangju': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782343/regions/gwangju_default.png',
    'ulsan': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782345/regions/ulsan_default.png',
    'sejong': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782346/regions/sejong_default.png',

    # 도 (9개)
    'gyeonggi': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782347/regions/gyeonggi_default.png',
    'gangwon': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782348/regions/gangwon_default.png',
    'chungbuk': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782349/regions/chungbuk_default.png',
    'chungnam': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782351/regions/chungnam_default.png',
    'jeonbuk': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782353/regions/jeonbuk_default.png',
    'jeonnam': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782354/regions/jeonnam_default.png',
    'gyeongbuk': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782355/regions/gyeongbuk_default.png',
    'gyeongnam': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782356/regions/gyeongnam_default.png',
    'jeju': 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1767782357/regions/jeju_default.png',
}

# 기본 폴백 이미지 (시도별 이미지가 없을 경우)
FALLBACK_IMAGE = 'https://res.cloudinary.com/dkz9qbznb/image/upload/v1736300000/regions/korea_default.png'


def get_default_image(region_code: str) -> str:
    """시도 코드에 해당하는 기본 이미지 URL 반환

    Args:
        region_code: 시도 코드 (예: 'seoul', 'gangwon')

    Returns:
        기본 이미지 URL
    """
    return DEFAULT_REGION_IMAGES.get(region_code, FALLBACK_IMAGE)


def is_national_region(region_code: str) -> bool:
    """17개 시·도인지 확인

    Args:
        region_code: 시도 코드

    Returns:
        17개 시·도이면 True
    """
    return region_code in DEFAULT_REGION_IMAGES

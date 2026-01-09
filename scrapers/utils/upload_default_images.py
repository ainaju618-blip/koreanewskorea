# -*- coding: utf-8 -*-
"""17개 시·도 기본 이미지 Cloudinary 업로드 스크립트
각 시도별 기본 이미지를 생성하고 Cloudinary에 업로드
"""
import os
import sys
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# .env 로드 (cloudinary_uploader.py와 동일한 방식)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path, override=True)

# Cloudinary 설정
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dkz9qbznb'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', '')
)

# 17개 시·도 정보
REGIONS = {
    'seoul': {'name': '서울특별시', 'color': '#003366'},
    'busan': {'name': '부산광역시', 'color': '#0066CC'},
    'incheon': {'name': '인천광역시', 'color': '#006699'},
    'daegu': {'name': '대구광역시', 'color': '#CC3333'},
    'daejeon': {'name': '대전광역시', 'color': '#009933'},
    'gwangju': {'name': '광주광역시', 'color': '#6633CC'},
    'ulsan': {'name': '울산광역시', 'color': '#FF6600'},
    'sejong': {'name': '세종특별자치시', 'color': '#339966'},
    'gyeonggi': {'name': '경기도', 'color': '#3366CC'},
    'gangwon': {'name': '강원특별자치도', 'color': '#33CC99'},
    'chungbuk': {'name': '충청북도', 'color': '#669933'},
    'chungnam': {'name': '충청남도', 'color': '#996633'},
    'jeonbuk': {'name': '전북특별자치도', 'color': '#CC6633'},
    'jeonnam': {'name': '전라남도', 'color': '#339999'},
    'gyeongbuk': {'name': '경상북도', 'color': '#993366'},
    'gyeongnam': {'name': '경상남도', 'color': '#666699'},
    'jeju': {'name': '제주특별자치도', 'color': '#FF9933'},
}


def upload_placeholder_image(region_code: str, region_info: dict) -> str:
    """플레이스홀더 이미지를 Cloudinary에 업로드

    placehold.co 서비스를 이용하여 동적 이미지 생성 후 업로드
    """
    name = region_info['name']
    color = region_info['color'].replace('#', '')

    # placehold.co URL (텍스트 포함 플레이스홀더)
    placeholder_url = f"https://placehold.co/800x450/{color}/FFFFFF/png?text={name}+보도자료"

    try:
        result = cloudinary.uploader.upload(
            placeholder_url,
            public_id=f"regions/{region_code}_default",
            folder="",
            overwrite=True,
            resource_type="image"
        )
        return result.get('secure_url')
    except Exception as e:
        print(f"[ERROR] {region_code}: {e}")
        return None


def main():
    print("=" * 60)
    print("17개 시·도 기본 이미지 Cloudinary 업로드")
    print("=" * 60)

    uploaded_urls = {}

    for code, info in REGIONS.items():
        print(f"\n[{code}] {info['name']} 업로드 중...")
        url = upload_placeholder_image(code, info)
        if url:
            uploaded_urls[code] = url
            print(f"   [OK] {url}")
        else:
            print(f"   [FAIL] 업로드 실패")

    # 결과 출력
    print("\n" + "=" * 60)
    print("업로드 완료 - default_images.py에 복사할 URL:")
    print("=" * 60)

    print("\nDEFAULT_REGION_IMAGES = {")
    for code in REGIONS.keys():
        url = uploaded_urls.get(code, 'UPLOAD_FAILED')
        print(f"    '{code}': '{url}',")
    print("}")


if __name__ == "__main__":
    main()

"""
Cloudinary 이미지 업로드 유틸리티
- 원본 이미지 다운로드
- 800x600으로 리사이즈
- Cloudinary에 업로드
- URL 반환
"""

import os
import tempfile
import requests
from PIL import Image
from io import BytesIO
from urllib.parse import urlparse, urljoin
from typing import Optional
import hashlib

# Cloudinary 설정
try:
    import cloudinary
    import cloudinary.uploader
    
    # 하드코딩된 설정 사용 (환경변수 무시)
    cloudinary.config(
        cloud_name='dkz9qbznb',
        api_key='216441234234522',
        api_secret='Lg1_TDec7ecBHbW8b4cLTV9Dxuo',
        secure=True
    )
    CLOUDINARY_CONFIGURED = True
except ImportError:
    CLOUDINARY_CONFIGURED = False
    print("⚠️ cloudinary 패키지가 설치되지 않았습니다. pip install cloudinary 실행 필요")


# 이미지 리사이즈 설정
TARGET_WIDTH = 800
TARGET_HEIGHT = 600

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}


def download_and_upload_image(image_url: str, base_url: str = None, folder: str = "news") -> Optional[str]:
    """
    이미지를 다운로드하고 Cloudinary에 업로드
    
    Args:
        image_url: 원본 이미지 URL (상대경로 가능)
        base_url: 상대경로일 경우 기준 URL
        folder: Cloudinary 폴더 이름
        
    Returns:
        Cloudinary 이미지 URL 또는 None (실패 시)
    """
    if not CLOUDINARY_CONFIGURED:
        print(f"⚠️ Cloudinary 미설정, 원본 URL 반환: {image_url[:50]}...")
        return image_url
    
    if not image_url:
        return None
    
    # 상대경로 → 절대경로 변환
    if not image_url.startswith(('http://', 'https://')):
        if base_url:
            image_url = urljoin(base_url, image_url)
        else:
            print(f"⚠️ 상대경로지만 base_url 없음: {image_url}")
            return None
    
    try:
        # 1. 이미지 다운로드 (Referer 헤더 추가로 403 방지)
        download_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': base_url if base_url else image_url,  # 원본 사이트를 Referer로 설정
        }
        response = requests.get(image_url, headers=download_headers, timeout=15, verify=False)
        response.raise_for_status()
        
        # 2. PIL로 이미지 로드
        img = Image.open(BytesIO(response.content))
        
        # RGBA → RGB 변환 (JPEG 저장용)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # 3. 800x600으로 리사이즈 (비율 유지, 크롭 또는 패딩)
        img = resize_image(img, TARGET_WIDTH, TARGET_HEIGHT)
        
        # 4. 로컬 폴더에 저장 (삭제하지 않음)
        # 파일명을 URL 해시로 생성 (중복 방지)
        file_hash = hashlib.md5(image_url.encode()).hexdigest()
        
        # 로컬 저장 폴더 생성
        local_folder = os.path.join(os.path.dirname(__file__), '..', 'images', folder)
        os.makedirs(local_folder, exist_ok=True)
        
        local_path = os.path.join(local_folder, f"{file_hash}.jpg")
        img.save(local_path, 'JPEG', quality=85, optimize=True)
        print(f"💾 로컬 저장: {local_path}")
        
        # 5. Cloudinary 업로드
        public_id = f"{folder}/{file_hash}"
        
        result = cloudinary.uploader.upload(
            local_path,
            public_id=public_id,
            overwrite=False,  # 이미 있으면 기존 URL 반환
            resource_type="image"
        )
        
        # 6. 로컬 파일은 삭제하지 않음 (백업용 보관)
        
        cloudinary_url = result.get('secure_url')
        print(f"✅ Cloudinary 업로드 완료: {cloudinary_url[:60]}...")
        return cloudinary_url
        
    except requests.exceptions.RequestException as e:
        print(f"❌ 이미지 다운로드 실패: {str(e)[:50]}")
        return None
    except Exception as e:
        print(f"❌ 이미지 처리 오류: {str(e)[:50]}")
        return None


def upload_local_image(local_path: str, folder: str = "news", resize: bool = True) -> Optional[str]:
    """
    로컬 이미지 파일을 Cloudinary에 업로드
    
    Args:
        local_path: 로컬 이미지 파일 경로
        folder: Cloudinary 폴더 이름
        resize: 리사이즈 여부 (기본 800x600)
        
    Returns:
        Cloudinary 이미지 URL 또는 None (실패 시)
    """
    if not CLOUDINARY_CONFIGURED:
        print(f"⚠️ Cloudinary 미설정")
        return None
    
    if not os.path.exists(local_path):
        print(f"❌ 파일이 존재하지 않음: {local_path}")
        return None
    
    try:
        # 1. 이미지 로드
        img = Image.open(local_path)
        
        # RGBA → RGB 변환
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # 2. 리사이즈 (선택)
        if resize:
            img = resize_image(img, TARGET_WIDTH, TARGET_HEIGHT)
        
        # 3. 임시 파일에 저장
        file_hash = hashlib.md5(local_path.encode()).hexdigest()
        temp_path = os.path.join(tempfile.gettempdir(), f"{file_hash}.jpg")
        img.save(temp_path, 'JPEG', quality=85, optimize=True)
        
        # 4. Cloudinary 업로드
        public_id = f"{folder}/{file_hash}"
        
        result = cloudinary.uploader.upload(
            temp_path,
            public_id=public_id,
            overwrite=False,
            resource_type="image"
        )
        
        # 5. 임시 파일 삭제
        os.remove(temp_path)
        
        cloudinary_url = result.get('secure_url')
        print(f"☁️ Cloudinary 업로드: {cloudinary_url[:60]}...")
        return cloudinary_url
        
    except Exception as e:
        print(f"❌ Cloudinary 업로드 오류: {str(e)[:50]}")
        return None


def resize_image(img: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """
    이미지를 지정 크기로 리사이즈 (비율 유지, 중앙 크롭)
    """
    original_width, original_height = img.size
    
    # 비율 계산
    width_ratio = target_width / original_width
    height_ratio = target_height / original_height
    
    # 더 큰 비율로 리사이즈 (크롭용)
    ratio = max(width_ratio, height_ratio)
    new_width = int(original_width * ratio)
    new_height = int(original_height * ratio)
    
    # 리사이즈
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # 중앙 크롭
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    
    img = img.crop((left, top, right, bottom))
    
    return img


def process_content_images(content: str, base_url: str, folder: str = "news") -> str:
    """
    본문 내 이미지 URL을 모두 Cloudinary URL로 교체
    
    Args:
        content: 본문 HTML/텍스트
        base_url: 상대경로 변환용 기준 URL
        folder: Cloudinary 폴더
        
    Returns:
        이미지 URL이 교체된 본문
    """
    import re
    
    # [이미지: URL] 또는 [이미지 N]: URL 패턴 찾기
    pattern = r'\[이미지[^\]]*\]:\s*(https?://[^\s\n]+)'
    
    def replace_image(match):
        original_url = match.group(1)
        new_url = download_and_upload_image(original_url, base_url, folder)
        if new_url and new_url != original_url:
            return match.group(0).replace(original_url, new_url)
        return match.group(0)
    
    return re.sub(pattern, replace_image, content)


if __name__ == "__main__":
    # 테스트
    from dotenv import load_dotenv
    load_dotenv()
    
    test_url = "https://www.naju.go.kr/build/images/module/board_gov/www_report/og_img_1764920411.jpg"
    result = download_and_upload_image(test_url, folder="test")
    print(f"결과: {result}")

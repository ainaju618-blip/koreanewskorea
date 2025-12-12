"""
Cloudinary 이미지 업로드 유틸리티
- 원본 이미지 다운로드
- 800x600으로 리사이즈
- Cloudinary에 업로드 (활성화 시)
- 로컬 저장 (기본)
- URL 반환

설정:
- CLOUDINARY_ENABLED = False: 로컬 저장만 (기본값)
- CLOUDINARY_ENABLED = True: Cloudinary 업로드 시도
"""

import os
import tempfile
import requests
from PIL import Image
from io import BytesIO
from urllib.parse import urlparse, urljoin
from typing import Optional
import hashlib

# ============================================================
# Cloudinary 설정
# CLOUDINARY_ENABLED = False로 설정하면 로컬 저장만 수행
# 나중에 True로 변경하고 올바른 API 키를 설정하면 Cloudinary 업로드 활성화
# ============================================================
CLOUDINARY_ENABLED = False  # TODO: Cloudinary 연결 시 True로 변경

try:
    import cloudinary
    import cloudinary.uploader
    
    # Cloudinary 자격증명 (환경변수 또는 하드코딩)
    # TODO: 올바른 자격증명으로 교체 필요
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', 'dkz9qbznb')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')
    
    if CLOUDINARY_ENABLED and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        CLOUDINARY_CONFIGURED = True
        print("☁️ Cloudinary 설정 완료")
    else:
        CLOUDINARY_CONFIGURED = False
except ImportError:
    CLOUDINARY_CONFIGURED = False
    print("⚠️ cloudinary 패키지가 설치되지 않았습니다.")

# 이미지 리사이즈 설정
TARGET_WIDTH = 800
TARGET_HEIGHT = 600

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}


def download_and_upload_image(image_url: str, base_url: str = None, folder: str = "news") -> Optional[str]:
    """
    이미지를 다운로드하고 로컬에 저장한 후 Cloudinary에 업로드 (활성화 시)
    
    Args:
        image_url: 원본 이미지 URL (상대경로 가능)
        base_url: 상대경로일 경우 기준 URL
        folder: 저장 폴더 이름
        
    Returns:
        - CLOUDINARY_CONFIGURED=True: Cloudinary 이미지 URL
        - CLOUDINARY_CONFIGURED=False: 로컬 저장 경로 (상대경로)
        - 실패 시: None
    """
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
            'Referer': base_url if base_url else image_url,
        }
        response = requests.get(image_url, headers=download_headers, timeout=15, verify=False)
        response.raise_for_status()
        
        # 2. PIL로 이미지 로드
        img = Image.open(BytesIO(response.content))
        
        # RGBA → RGB 변환 (JPEG 저장용)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # 3. 800px 너비로 리사이즈 (비율 유지)
        img = resize_image(img, TARGET_WIDTH, TARGET_HEIGHT)
        
        # 4. 로컬 폴더에 저장 (public/images/{folder}/)
        file_hash = hashlib.md5(image_url.encode()).hexdigest()

        # 프로젝트 루트 경로 계산: scrapers/utils/ → koreanews/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        # Next.js는 루트의 public 폴더를 사용함 (web/public이 아님)
        local_folder = os.path.join(project_root, 'public', 'images', folder)
        os.makedirs(local_folder, exist_ok=True)

        local_path = os.path.join(local_folder, f"{file_hash}.jpg")
        img.save(local_path, 'JPEG', quality=85, optimize=True)
        print(f"[IMG] 저장: {local_path}")
        
        # 5. Cloudinary 업로드 (활성화된 경우에만)
        if CLOUDINARY_CONFIGURED:
            try:
                public_id = f"{folder}/{file_hash}"
                result = cloudinary.uploader.upload(
                    local_path,
                    public_id=public_id,
                    overwrite=False,
                    resource_type="image"
                )
                cloudinary_url = result.get('secure_url')
                print(f"☁️ Cloudinary 업로드 완료: {cloudinary_url[:60]}...")
                return cloudinary_url
            except Exception as e:
                print(f"⚠️ Cloudinary 업로드 실패, 로컬 경로 사용: {str(e)[:50]}")
        
        # Cloudinary 비활성화 또는 실패 시 웹 접근 경로 반환
        # /images/{folder}/{hash}.jpg 형태로 Next.js public 폴더에서 접근 가능
        web_path = f"/images/{folder}/{file_hash}.jpg"
        print(f"[IMG] 웹 경로: {web_path}")
        return web_path
        
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
    이미지를 지정 너비(800px) 기준으로 리사이즈 (비율 유지, 크롭 없음)
    - target_width: 목표 너비 (기본 800px)
    - target_height: 사용하지 않음 (비율 유지)
    """
    original_width, original_height = img.size
    
    # 이미 목표 너비보다 작으면 그대로 반환
    if original_width <= target_width:
        return img
    
    # 비율 유지 리사이즈
    ratio = target_width / original_width
    new_width = target_width
    new_height = int(original_height * ratio)
    
    # 리사이즈 (비율 유지)
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
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

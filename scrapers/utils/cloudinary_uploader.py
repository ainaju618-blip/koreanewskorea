"""
Cloudinary 이미지 업로드 유틸리티
- 원본 이미지 다운로드
- 800x600으로 리사이즈
- Cloudinary에 업로드 (활성화 시)
- 로컬 저장 (기본)
- URL 반환

설정:
- CLOUDINARY_ENABLED = True: 로컬 저장만 (기본값)
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

# Load environment variables (MUST be before cloudinary config)
from dotenv import load_dotenv

# Force reload .env to ensure fresh values
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path, override=True)  # override=True forces reload

# Debug: Check .env file exists
if not os.path.exists(env_path):
    print(f"[WARN] .env file not found at: {env_path}")

# ============================================================
# Cloudinary 설정
# CLOUDINARY_ENABLED = True로 설정하면 로컬 저장만 수행
# 나중에 True로 변경하고 올바른 API 키를 설정하면 Cloudinary 업로드 활성화
# ============================================================
CLOUDINARY_ENABLED = True  # TODO: Cloudinary 연결 시 True로 변경

try:
    import cloudinary
    import cloudinary.uploader
    
    # Cloudinary credentials from environment
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', 'dkz9qbznb')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')

    # Debug: Log credential status
    print(f"[DEBUG] CLOUDINARY_API_KEY loaded: {bool(CLOUDINARY_API_KEY)} ({len(CLOUDINARY_API_KEY)} chars)")
    print(f"[DEBUG] CLOUDINARY_API_SECRET loaded: {bool(CLOUDINARY_API_SECRET)} ({len(CLOUDINARY_API_SECRET)} chars)")

    if not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
        print("[WARN] Cloudinary credentials missing! Check .env file:")
        print("  CLOUDINARY_API_KEY=your_key_here")
        print("  CLOUDINARY_API_SECRET=your_secret_here")

    if CLOUDINARY_ENABLED and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        CLOUDINARY_CONFIGURED = True
        print("[OK] Cloudinary 설정 완료")
    else:
        CLOUDINARY_CONFIGURED = False
except ImportError:
    CLOUDINARY_CONFIGURED = False
    print("[WARN] cloudinary 패키지가 설치되지 않았습니다.")

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
        folder: 저장 폴더 이름
        
    Returns:
        - 성공: Cloudinary 이미지 URL
        - 실패: None (에러 발생)
        
    Raises:
        RuntimeError: Cloudinary 미설정 또는 업로드 실패 시
    """
    if not image_url:
        return None

    # ★ Cloudinary 미설정 시 원본 URL 반환 (fallback)
    if not CLOUDINARY_CONFIGURED:
        print("[WARN] Cloudinary 미설정, 원본 URL 사용")
        # Convert relative URL to absolute if needed
        if not image_url.startswith(('http://', 'https://')) and base_url:
            image_url = urljoin(base_url, image_url)
        return image_url
    
    # 상대경로 → 절대경로 변환
    if not image_url.startswith(('http://', 'https://')):
        if base_url:
            image_url = urljoin(base_url, image_url)
        else:
            print(f"[ERROR] 상대경로지만 base_url 없음: {image_url}")
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
        
        # 4. 임시 파일에 저장 (Cloudinary 업로드용)
        file_hash = hashlib.md5(image_url.encode()).hexdigest()
        temp_path = os.path.join(tempfile.gettempdir(), f"{file_hash}.jpg")
        img.save(temp_path, 'JPEG', quality=85, optimize=True)
        
        # 5. Cloudinary 업로드 (★ WebP 변환 + 품질 최적화)
        try:
            public_id = f"{folder}/{file_hash}"
            result = cloudinary.uploader.upload(
                temp_path,
                public_id=public_id,
                overwrite=False,
                resource_type="image",
                transformation=[
                    {"width": 800, "crop": "limit", "quality": 80}
                ],
                format="webp"
            )
            cloudinary_url = result.get('secure_url')
            print(f"[OK] Cloudinary 업로드: {cloudinary_url[:60]}...")
            
            # 임시 파일 삭제
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return cloudinary_url
        except Exception as e:
            # ★ Cloudinary 업로드 실패 시 원본 URL 반환 (fallback)
            error_msg = f"[WARN] Cloudinary 업로드 실패, 원본 URL 사용: {str(e)[:50]}"
            print(error_msg)
            return image_url  # Return original URL as fallback

    except requests.exceptions.RequestException as e:
        error_msg = f"[WARN] 이미지 다운로드 실패, 원본 URL 사용: {str(e)[:50]}"
        print(error_msg)
        return image_url  # Return original URL as fallback
    except Exception as e:
        error_msg = f"[WARN] 이미지 처리 오류, 원본 URL 사용: {str(e)[:50]}"
        print(error_msg)
        return image_url  # Return original URL as fallback


def upload_local_image(local_path: str, folder: str = "news", resize: bool = True) -> Optional[str]:
    """
    로컬 이미지 파일을 Cloudinary에 업로드
    Cloudinary 실패시 Supabase Storage에 업로드 (fallback)

    Args:
        local_path: 로컬 이미지 파일 경로
        folder: Cloudinary 폴더 이름
        resize: 리사이즈 여부 (기본 800x600)

    Returns:
        Cloudinary 이미지 URL 또는 Supabase Storage URL
    """
    if not os.path.exists(local_path):
        print(f"[ERROR] 파일이 존재하지 않음: {local_path}")
        return None

    # Generate file hash for unique filename
    file_hash = hashlib.md5(local_path.encode()).hexdigest()[:6]
    date_prefix = __import__('datetime').datetime.now().strftime('%Y%m%d')

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
        temp_path = os.path.join(tempfile.gettempdir(), f"{folder}_{date_prefix}_{file_hash}.jpg")
        img.save(temp_path, 'JPEG', quality=85, optimize=True)

        # 4. Cloudinary 업로드 시도 (설정된 경우만)
        if CLOUDINARY_CONFIGURED:
            try:
                public_id = f"{folder}/{date_prefix}_{file_hash}"
                result = cloudinary.uploader.upload(
                    temp_path,
                    public_id=public_id,
                    overwrite=False,
                    resource_type="image",
                    transformation=[
                        {"width": 800, "crop": "limit", "quality": 80}
                    ],
                    format="webp"
                )

                cloudinary_url = result.get('secure_url')
                print(f"[OK] Cloudinary 업로드: {cloudinary_url[:60]}...")

                # 임시 파일 삭제
                if os.path.exists(temp_path):
                    os.remove(temp_path)

                return cloudinary_url
            except Exception as e:
                print(f"[WARN] Cloudinary 업로드 실패, Supabase Storage로 전환: {str(e)[:50]}")

        # 5. Fallback: Supabase Storage에 업로드
        try:
            supabase_url = upload_to_supabase_storage(temp_path, folder, f"{folder}_{date_prefix}_{file_hash}.jpg")
            if supabase_url:
                # 임시 파일 삭제
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                return supabase_url
        except Exception as e:
            print(f"[WARN] Supabase Storage 업로드 실패: {str(e)[:50]}")

        # 임시 파일 삭제
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return None

    except Exception as e:
        print(f"[ERROR] 이미지 처리 오류: {str(e)[:50]}")
        return None


def upload_to_supabase_storage(file_path: str, folder: str, filename: str) -> Optional[str]:
    """
    Supabase Storage에 이미지 업로드 (Cloudinary 실패시 fallback)

    Args:
        file_path: 로컬 파일 경로
        folder: 저장 폴더 이름
        filename: 저장할 파일명

    Returns:
        Supabase Storage public URL 또는 None
    """
    supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("[WARN] Supabase 환경변수 미설정")
        return None

    try:
        # Read file content
        with open(file_path, 'rb') as f:
            file_content = f.read()

        # Upload to Supabase Storage (news-images bucket)
        storage_path = f"{folder}/{filename}"
        upload_url = f"{supabase_url}/storage/v1/object/news-images/{storage_path}"

        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'  # Overwrite if exists
        }

        response = requests.post(upload_url, data=file_content, headers=headers, timeout=30)

        if response.status_code in [200, 201]:
            # Return public URL
            public_url = f"{supabase_url}/storage/v1/object/public/news-images/{storage_path}"
            print(f"[OK] Supabase Storage 업로드: {public_url[:60]}...")
            return public_url
        else:
            print(f"[WARN] Supabase Storage 응답: {response.status_code} - {response.text[:100]}")
            return None

    except Exception as e:
        print(f"[ERROR] Supabase Storage 업로드 오류: {str(e)[:50]}")
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

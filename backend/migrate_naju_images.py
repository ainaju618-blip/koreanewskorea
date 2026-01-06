"""
나주 뉴스 이미지 Cloudinary 마이그레이션 스크립트

naju.go.kr은 핫링크를 차단하므로 이미지를 다운로드하여
Cloudinary에 업로드하고 DB의 thumbnail_url을 업데이트합니다.
"""

import os
import sys
import tempfile
import hashlib
import requests
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv

# UTF-8 출력 강제 (Windows cp949 인코딩 문제 해결)
if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 환경변수 로드
try:
    load_dotenv(encoding='utf-8')
except UnicodeDecodeError:
    try:
        load_dotenv(encoding='cp949')
    except Exception:
        load_dotenv()

# Supabase 설정
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# Cloudinary 설정
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "dkz9qbznb")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[!] Error: Supabase credentials not found.")
    sys.exit(1)

# Supabase 클라이언트
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Cloudinary 설정 (선택적)
CLOUDINARY_ENABLED = False
try:
    import cloudinary
    import cloudinary.uploader
    from PIL import Image

    if CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        CLOUDINARY_ENABLED = True
        print("[OK] Cloudinary 설정 완료")
    else:
        print("[WARN] Cloudinary API 키 없음 - Supabase Storage 사용")
except ImportError as e:
    print(f"[WARN] 필요한 패키지 없음: {e}")
    print("       pip install cloudinary pillow 실행 필요")


def download_image(image_url: str, referer: str = "https://www.naju.go.kr") -> bytes | None:
    """이미지 다운로드 (Referer 헤더로 403 우회)"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': referer,
    }

    try:
        response = requests.get(image_url, headers=headers, timeout=30, verify=False)
        if response.status_code == 200:
            return response.content
        else:
            print(f"      [WARN] HTTP {response.status_code}: {image_url[:60]}...")
            return None
    except Exception as e:
        print(f"      [ERROR] Download failed: {str(e)[:50]}")
        return None


def upload_to_cloudinary(image_data: bytes, filename: str, folder: str = "naju") -> str | None:
    """Cloudinary에 이미지 업로드"""
    if not CLOUDINARY_ENABLED:
        return None

    try:
        # PIL로 이미지 처리 (800px 너비로 리사이즈, 16:9 크롭)
        img = Image.open(BytesIO(image_data))

        # RGBA → RGB 변환
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # 16:9 비율로 크롭 (중앙 기준)
        target_ratio = 16 / 9
        orig_width, orig_height = img.size
        orig_ratio = orig_width / orig_height

        if orig_ratio > target_ratio:
            # 이미지가 더 넓음 - 좌우 자르기
            new_width = int(orig_height * target_ratio)
            left = (orig_width - new_width) // 2
            img = img.crop((left, 0, left + new_width, orig_height))
        elif orig_ratio < target_ratio:
            # 이미지가 더 높음 - 상하 자르기
            new_height = int(orig_width / target_ratio)
            top = (orig_height - new_height) // 2
            img = img.crop((0, top, orig_width, top + new_height))

        # 800x450 (16:9)으로 리사이즈
        img = img.resize((800, 450), Image.Resampling.LANCZOS)

        # 임시 파일에 저장
        file_hash = hashlib.md5(filename.encode()).hexdigest()[:8]
        temp_path = os.path.join(tempfile.gettempdir(), f"{file_hash}.jpg")
        img.save(temp_path, 'JPEG', quality=85, optimize=True)

        # Cloudinary 업로드
        public_id = f"{folder}/{file_hash}"
        result = cloudinary.uploader.upload(
            temp_path,
            public_id=public_id,
            overwrite=False,
            resource_type="image",
            format="webp"
        )

        cloudinary_url = result.get('secure_url')

        # 임시 파일 삭제
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return cloudinary_url

    except Exception as e:
        print(f"      [ERROR] Cloudinary upload failed: {str(e)[:50]}")
        return None


def upload_to_supabase_storage(image_data: bytes, filename: str, folder: str = "naju") -> str | None:
    """Supabase Storage에 이미지 업로드 (Cloudinary 대안)"""
    try:
        # PIL로 이미지 처리
        from PIL import Image
        img = Image.open(BytesIO(image_data))

        # RGBA → RGB 변환
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # 16:9 비율로 크롭
        target_ratio = 16 / 9
        orig_width, orig_height = img.size
        orig_ratio = orig_width / orig_height

        if orig_ratio > target_ratio:
            new_width = int(orig_height * target_ratio)
            left = (orig_width - new_width) // 2
            img = img.crop((left, 0, left + new_width, orig_height))
        elif orig_ratio < target_ratio:
            new_height = int(orig_width / target_ratio)
            top = (orig_height - new_height) // 2
            img = img.crop((0, top, orig_width, top + new_height))

        # 800x450 (16:9)으로 리사이즈
        img = img.resize((800, 450), Image.Resampling.LANCZOS)

        # BytesIO로 저장
        buffer = BytesIO()
        img.save(buffer, 'JPEG', quality=85, optimize=True)
        file_content = buffer.getvalue()

        # Supabase Storage 업로드
        file_hash = hashlib.md5(filename.encode()).hexdigest()[:8]
        storage_path = f"{folder}/{file_hash}.jpg"
        upload_url = f"{SUPABASE_URL}/storage/v1/object/news-images/{storage_path}"

        headers = {
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
        }

        response = requests.post(upload_url, data=file_content, headers=headers, timeout=30)

        if response.status_code in [200, 201]:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/news-images/{storage_path}"
            return public_url
        else:
            print(f"      [WARN] Supabase Storage: {response.status_code}")
            return None

    except Exception as e:
        print(f"      [ERROR] Supabase Storage failed: {str(e)[:50]}")
        return None


def migrate_naju_images():
    """나주 뉴스 이미지 마이그레이션 실행"""
    print("=== 나주 뉴스 이미지 마이그레이션 시작 ===\n")

    # naju.go.kr 이미지 URL을 가진 게시물 조회
    result = supabase.table('posts').select('id, title, thumbnail_url').eq('region', 'naju').execute()

    if not result.data:
        print("[!] 마이그레이션할 데이터가 없습니다.")
        return

    posts = result.data
    total = len(posts)
    success = 0
    skipped = 0
    failed = 0

    print(f"[*] 총 {total}개의 나주 게시물 발견\n")

    for i, post in enumerate(posts):
        post_id = post['id']
        title = post['title'][:30] if post['title'] else 'No Title'
        thumbnail_url = post.get('thumbnail_url')

        print(f"[{i+1}/{total}] {title}...")

        # 이미지가 없거나 이미 Cloudinary/Supabase URL인 경우 스킵
        if not thumbnail_url:
            print("      [Skip] 이미지 없음")
            skipped += 1
            continue

        if 'cloudinary.com' in thumbnail_url or 'supabase.co/storage' in thumbnail_url:
            print("      [Skip] 이미 마이그레이션됨")
            skipped += 1
            continue

        if 'naju.go.kr' not in thumbnail_url:
            print("      [Skip] naju.go.kr 이미지 아님")
            skipped += 1
            continue

        # 이미지 다운로드
        print(f"      다운로드 중: {thumbnail_url[:50]}...")
        image_data = download_image(thumbnail_url)

        if not image_data:
            print("      [Failed] 다운로드 실패")
            failed += 1
            continue

        # 업로드 (Cloudinary 우선, 실패 시 Supabase Storage)
        new_url = None
        if CLOUDINARY_ENABLED:
            new_url = upload_to_cloudinary(image_data, f"naju_{post_id}")

        if not new_url:
            new_url = upload_to_supabase_storage(image_data, f"naju_{post_id}")

        if not new_url:
            print("      [Failed] 업로드 실패")
            failed += 1
            continue

        # DB 업데이트
        try:
            supabase.table('posts').update({'thumbnail_url': new_url}).eq('id', post_id).execute()
            print(f"      [OK] 업데이트: {new_url[:60]}...")
            success += 1
        except Exception as e:
            print(f"      [Failed] DB 업데이트 실패: {str(e)[:50]}")
            failed += 1

    print(f"\n=== 마이그레이션 완료 ===")
    print(f"총 게시물: {total}")
    print(f"성공: {success}")
    print(f"스킵: {skipped}")
    print(f"실패: {failed}")


if __name__ == "__main__":
    # Windows asyncio 정책 수정
    if os.name == 'nt':
        import asyncio
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    # SSL 경고 비활성화
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    migrate_naju_images()

"""
기존 로컬 이미지를 Cloudinary로 마이그레이션하고 DB 업데이트
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

import cloudinary
import cloudinary.uploader

# Cloudinary 설정
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

# Supabase 설정
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# 프로젝트 루트
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))


def get_posts_with_local_images():
    """로컬 이미지 경로를 가진 게시물 조회"""
    url = f"{SUPABASE_URL}/rest/v1/posts"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    params = {
        "select": "id,thumbnail_url",
        "thumbnail_url": "like./images/*"
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()


def update_post_thumbnail(post_id, new_url):
    """게시물 썸네일 URL 업데이트"""
    url = f"{SUPABASE_URL}/rest/v1/posts"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    params = {"id": f"eq.{post_id}"}
    data = {"thumbnail_url": new_url}
    response = requests.patch(url, headers=headers, params=params, json=data)
    return response.status_code == 204


def migrate_images():
    """로컬 이미지를 Cloudinary로 업로드하고 DB 업데이트"""

    posts = get_posts_with_local_images()
    print(f"마이그레이션 대상: {len(posts)}개 게시물")

    migrated = 0
    failed = 0

    for post in posts:
        post_id = post['id']
        local_path = post['thumbnail_url']  # /images/gangjin/xxx.jpg

        # 실제 파일 경로
        full_path = os.path.join(PROJECT_ROOT, 'public', local_path.lstrip('/'))

        if not os.path.exists(full_path):
            print(f"[SKIP] 파일 없음: {local_path}")
            failed += 1
            continue

        try:
            # Cloudinary 업로드
            parts = local_path.split('/')
            folder = parts[2] if len(parts) > 2 else 'news'
            filename = os.path.splitext(os.path.basename(local_path))[0]
            public_id = f"koreanews/{folder}/{filename}"

            upload_result = cloudinary.uploader.upload(
                full_path,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
                transformation=[
                    {"width": 800, "crop": "limit", "quality": 80}
                ],
                format="webp"
            )

            cloudinary_url = upload_result.get('secure_url')

            # DB 업데이트
            if update_post_thumbnail(post_id, cloudinary_url):
                migrated += 1
                print(f"[OK] {migrated}: {local_path[:50]}...")
            else:
                print(f"[DB ERR] {local_path}")
                failed += 1

        except Exception as e:
            print(f"[ERR] {local_path}: {str(e)[:50]}")
            failed += 1

    print(f"\n완료: {migrated}개 성공, {failed}개 실패")


if __name__ == "__main__":
    print("=" * 50)
    print("Cloudinary 이미지 마이그레이션")
    print("=" * 50)
    migrate_images()

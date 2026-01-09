"""
데이터 마이그레이션 스크립트
운영서버(koreanewsone) → 개발서버(koreanewskorea)

복사 대상:
1. 나주 기사 (source='나주시' OR region='naju')
2. 전남교육청 기사 (source LIKE '%교육청%')
3. 관련 기자 정보
"""

import os
import sys

# Windows 콘솔 UTF-8 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
from supabase import create_client, Client

# .env.local 로드
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
load_dotenv(env_path)

# 운영서버 (Source)
PROD_URL = os.getenv('PRODUCTION_SUPABASE_URL')
PROD_KEY = os.getenv('PRODUCTION_SUPABASE_SERVICE_KEY')

# 개발서버 (Target)
DEV_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
DEV_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def create_clients():
    """Supabase 클라이언트 생성"""
    if not all([PROD_URL, PROD_KEY, DEV_URL, DEV_KEY]):
        print("❌ 환경변수가 설정되지 않았습니다.")
        print(f"  PROD_URL: {'✓' if PROD_URL else '✗'}")
        print(f"  PROD_KEY: {'✓' if PROD_KEY else '✗'}")
        print(f"  DEV_URL: {'✓' if DEV_URL else '✗'}")
        print(f"  DEV_KEY: {'✓' if DEV_KEY else '✗'}")
        sys.exit(1)

    prod_client = create_client(PROD_URL, PROD_KEY)
    dev_client = create_client(DEV_URL, DEV_KEY)

    print(f"✓ 운영서버 연결: {PROD_URL}")
    print(f"✓ 개발서버 연결: {DEV_URL}")

    return prod_client, dev_client

def migrate_categories(prod: Client, dev: Client):
    """카테고리 마이그레이션"""
    print("\n📁 카테고리 마이그레이션...")

    # 개발서버 스키마에 맞는 컬럼만 선택
    CATEGORY_COLUMNS = ['id', 'name', 'slug', 'description', 'parent_id', 'sort_order', 'is_active', 'created_at']

    # 운영서버에서 카테고리 조회
    result = prod.table('categories').select('*').execute()
    categories = result.data

    if not categories:
        print("  ⚠️ 운영서버에 카테고리가 없습니다.")
        return 0

    # 개발서버에 삽입 (중복 무시)
    migrated = 0
    for cat in categories:
        try:
            # 개발서버 스키마에 맞는 컬럼만 추출
            cat_data = {k: v for k, v in cat.items() if k in CATEGORY_COLUMNS}
            dev.table('categories').upsert(cat_data, on_conflict='slug').execute()
            migrated += 1
        except Exception as e:
            print(f"  ⚠️ 카테고리 '{cat.get('name')}' 삽입 실패: {e}")

    print(f"  ✓ {migrated}개 카테고리 마이그레이션 완료")
    return migrated

def migrate_reporters(prod: Client, dev: Client):
    """나주 기자 마이그레이션"""
    print("\n👤 기자 마이그레이션...")

    # 개발서버 스키마에 맞는 컬럼만 선택
    REPORTER_COLUMNS = [
        'id', 'name', 'type', 'position', 'region', 'phone', 'email', 'bio',
        'profile_image', 'avatar_icon', 'password_hash', 'status', 'access_level',
        'slug', 'department', 'specialties', 'career_years', 'awards',
        'sns_twitter', 'sns_facebook', 'sns_linkedin', 'is_public',
        'subscriber_count', 'total_views', 'ai_settings', 'created_at', 'updated_at'
    ]

    # 나주 관련 기자 조회
    result = prod.table('reporters').select('*').or_(
        'region.eq.나주시,region.eq.나주,region.ilike.%나주%'
    ).execute()
    reporters = result.data

    if not reporters:
        print("  ⚠️ 나주 기자가 없습니다.")
        return 0

    # 개발서버에 삽입
    migrated = 0
    for reporter in reporters:
        try:
            # 개발서버 스키마에 맞는 컬럼만 추출 (user_id 제외)
            reporter_data = {k: v for k, v in reporter.items()
                           if k in REPORTER_COLUMNS and k != 'user_id'}
            dev.table('reporters').upsert(reporter_data, on_conflict='id').execute()
            migrated += 1
        except Exception as e:
            print(f"  ⚠️ 기자 '{reporter.get('name')}' 삽입 실패: {e}")

    print(f"  ✓ {migrated}명 기자 마이그레이션 완료")
    return migrated

def migrate_posts(prod: Client, dev: Client):
    """나주 + 교육청 기사 마이그레이션"""
    print("\n📰 기사 마이그레이션...")

    # 개발서버 스키마에 맞는 컬럼만 선택
    POST_COLUMNS = [
        'id', 'title', 'content', 'original_link', 'source', 'department',
        'category', 'region', 'sido_code', 'sigungu_code', 'thumbnail_url',
        'ai_summary', 'ai_title', 'ai_keywords', 'meta_title', 'meta_description',
        'meta_keywords', 'slug', 'author_name', 'status', 'view_count',
        'published_at', 'created_at', 'updated_at',
        'ai_double_validated', 'ai_processed', 'images'
    ]

    # 1. 나주 기사 조회
    naju_result = prod.table('posts').select('*').or_(
        'source.eq.나주시,region.eq.naju,source.ilike.%나주%'
    ).execute()
    naju_posts = naju_result.data or []
    print(f"  - 나주 기사: {len(naju_posts)}개")

    # 2. 전남교육청 기사 조회
    edu_result = prod.table('posts').select('*').or_(
        'source.ilike.%전라남도교육청%,source.ilike.%전남교육청%,category.eq.교육'
    ).limit(500).execute()
    edu_posts = edu_result.data or []
    print(f"  - 교육청 기사: {len(edu_posts)}개")

    # 3. 중복 제거 (id 기준)
    all_posts = {p['id']: p for p in naju_posts + edu_posts}
    unique_posts = list(all_posts.values())
    print(f"  - 총 고유 기사: {len(unique_posts)}개")

    # 4. 개발서버에 삽입
    migrated = 0
    errors = 0

    for post in unique_posts:
        try:
            # 개발서버 스키마에 맞는 컬럼만 추출 (FK 제외)
            post_data = {k: v for k, v in post.items() if k in POST_COLUMNS}
            dev.table('posts').upsert(post_data, on_conflict='id').execute()
            migrated += 1
        except Exception as e:
            errors += 1
            if errors <= 3:  # 처음 3개 에러만 출력
                print(f"  ⚠️ 기사 삽입 실패: {str(e)[:100]}")

    print(f"  ✓ {migrated}개 기사 마이그레이션 완료 (실패: {errors}개)")
    return migrated

def verify_migration(dev: Client):
    """마이그레이션 결과 확인"""
    print("\n📊 마이그레이션 결과 확인...")

    # 테이블별 레코드 수 확인
    tables = ['categories', 'reporters', 'posts']

    for table in tables:
        try:
            result = dev.table(table).select('id', count='exact').execute()
            count = result.count if result.count else len(result.data)
            print(f"  - {table}: {count}개")
        except Exception as e:
            print(f"  - {table}: 조회 실패 ({e})")

def main():
    print("=" * 50)
    print("🚀 데이터 마이그레이션 시작")
    print("  운영서버 → 개발서버")
    print("=" * 50)

    # 클라이언트 생성
    prod, dev = create_clients()

    # 마이그레이션 실행
    migrate_categories(prod, dev)
    migrate_reporters(prod, dev)
    migrate_posts(prod, dev)

    # 결과 확인
    verify_migration(dev)

    print("\n" + "=" * 50)
    print("✅ 마이그레이션 완료!")
    print("=" * 50)

if __name__ == '__main__':
    main()

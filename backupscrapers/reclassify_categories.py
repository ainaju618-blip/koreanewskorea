# -*- coding: utf-8 -*-
"""
기존 DB 기사들의 카테고리 재분류 스크립트
- 기존 '광주', '전남' 등 지역명으로 저장된 category를
- 제목/본문 기반으로 '교육', '복지', '문화' 등으로 재분류
"""

import os
import sys
import requests
from dotenv import load_dotenv

# 로컬 모듈 경로
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.scraper_utils import detect_category

load_dotenv()

# Supabase 설정
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}


def get_posts_to_reclassify(limit: int = 100, offset: int = 0):
    """재분류가 필요한 기사 조회 (기존 지역명 카테고리)"""
    url = f"{SUPABASE_URL}/rest/v1/posts"
    params = {
        "select": "id,title,content,category",
        "or": "(category.eq.광주,category.eq.전남,category.is.null)",
        "order": "created_at.desc",
        "limit": limit,
        "offset": offset
    }
    response = requests.get(url, headers=HEADERS, params=params)
    if response.status_code == 200:
        return response.json()
    print(f"[ERROR] 조회 실패: {response.status_code} - {response.text}")
    return []


def update_post_category(post_id: str, new_category: str):
    """기사 카테고리 업데이트"""
    url = f"{SUPABASE_URL}/rest/v1/posts"
    params = {"id": f"eq.{post_id}"}
    data = {"category": new_category}
    response = requests.patch(url, headers=HEADERS, params=params, json=data)
    return response.status_code == 204


def reclassify_all(batch_size: int = 100, dry_run: bool = False):
    """모든 기사 재분류"""
    print("=" * 60)
    print("카테고리 재분류 시작")
    print("=" * 60)

    if dry_run:
        print("[DRY RUN] 실제 DB 업데이트 없이 테스트만 수행")

    total_processed = 0
    total_updated = 0
    offset = 0

    # 카테고리별 통계
    category_stats = {}

    while True:
        posts = get_posts_to_reclassify(limit=batch_size, offset=offset)

        if not posts:
            break

        for post in posts:
            post_id = post['id']
            title = post.get('title', '')
            content = post.get('content', '')
            old_category = post.get('category', 'null')

            # 카테고리 자동 분류
            cat_code, cat_name = detect_category(title, content)

            # 통계 업데이트
            if cat_name not in category_stats:
                category_stats[cat_name] = 0
            category_stats[cat_name] += 1

            # 변경이 필요한 경우만 업데이트
            if old_category != cat_name:
                if not dry_run:
                    if update_post_category(post_id, cat_name):
                        total_updated += 1
                        print(f"  [{total_updated}] {title[:30]}... : {old_category} -> {cat_name}")
                    else:
                        print(f"  [ERROR] 업데이트 실패: {title[:30]}...")
                else:
                    total_updated += 1
                    print(f"  [DRY] {title[:30]}... : {old_category} -> {cat_name}")

            total_processed += 1

        offset += batch_size
        print(f"  ... {total_processed}개 처리 완료")

    # 결과 출력
    print("\n" + "=" * 60)
    print("재분류 완료")
    print("=" * 60)
    print(f"총 처리: {total_processed}개")
    print(f"업데이트: {total_updated}개")
    print("\n카테고리별 분포:")
    for cat, count in sorted(category_stats.items(), key=lambda x: -x[1]):
        print(f"  - {cat}: {count}개")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='기존 기사 카테고리 재분류')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (DB 변경 없음)')
    parser.add_argument('--batch-size', type=int, default=100, help='배치 크기')
    args = parser.parse_args()

    reclassify_all(batch_size=args.batch_size, dry_run=args.dry_run)

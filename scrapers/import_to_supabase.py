# -*- coding: utf-8 -*-
"""
JSON 기사 → Supabase posts 테이블 저장
Created: 2026-01-06
"""

import json
import os
from datetime import datetime
from supabase import create_client, Client

# Supabase 설정 (ainaju618@gmail.com)
SUPABASE_URL = "https://ebagdrupjfwkawbwqjjg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWdkcnVwamZ3a2F3YndxampnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk5OTg2NSwiZXhwIjoyMDgxNTc1ODY1fQ.-VkZPHzBtsvLKKu3rv4-ORi5UIW_oPHJgqUguaqi94s"

def import_articles(json_file: str) -> dict:
    """JSON 파일에서 기사를 읽어 Supabase에 저장"""

    # Supabase 클라이언트 생성
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # JSON 파일 읽기
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    articles = data.get('articles', [])
    results = {
        'total': len(articles),
        'inserted': 0,
        'skipped': 0,
        'errors': []
    }

    for article in articles:
        try:
            # 중복 체크
            existing = supabase.table('posts').select('id').eq('original_link', article['original_link']).execute()

            if existing.data:
                results['skipped'] += 1
                print(f"[SKIP] 이미 존재: {article['title'][:30]}...")
                continue

            # 데이터 준비
            post_data = {
                'title': article['title'],
                'original_link': article['original_link'],
                'source': article.get('source', 'korea.kr'),
                'region': article.get('region', 'korea'),
                'category': article.get('category', '정책'),
                'published_at': f"{article.get('published_at', datetime.now().strftime('%Y-%m-%d'))}T09:00:00+09:00",
                'status': 'draft',  # 관리자 승인 대기
                'content': '',  # 본문은 별도 스크래핑 필요
            }

            # 삽입
            result = supabase.table('posts').insert(post_data).execute()

            if result.data:
                results['inserted'] += 1
                print(f"[OK] 저장 완료: {article['title'][:30]}...")

        except Exception as e:
            results['errors'].append({'title': article.get('title', 'Unknown'), 'error': str(e)})
            print(f"[ERROR] {article.get('title', 'Unknown')[:30]}: {e}")

    return results

if __name__ == '__main__':
    # 오늘 날짜 JSON 파일
    json_file = os.path.join(os.path.dirname(__file__), 'output', 'korea_kr_2026-01-05.json')

    if not os.path.exists(json_file):
        print(f"파일 없음: {json_file}")
        exit(1)

    print(f"=== JSON → Supabase 가져오기 ===")
    print(f"파일: {json_file}")
    print()

    results = import_articles(json_file)

    print()
    print(f"=== 결과 ===")
    print(f"전체: {results['total']}")
    print(f"저장: {results['inserted']}")
    print(f"스킵: {results['skipped']}")
    print(f"오류: {len(results['errors'])}")

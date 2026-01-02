# -*- coding: utf-8 -*-
"""
강진군 기사 본문 수정 스크립트
- DB에 저장된 '본문 내용을 가져올 수 없습니다' 기사를 다시 크롤링하여 업데이트
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    sys.stdout.reconfigure(encoding='utf-8')
except:
    pass

import requests
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from gangjin.gangjin_scraper import fetch_detail, REGION_CODE

# 환경변수 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def get_broken_articles():
    """본문이 없는 강진군 기사 조회"""
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }

    # 본문에 '가져올 수 없습니다'가 포함된 강진군 기사 조회
    url = f"{SUPABASE_URL}/rest/v1/posts"
    params = {
        'select': 'id,title,original_link,content',
        'region': f'eq.{REGION_CODE}',
        'content': 'like.*본문 내용을 가져올 수 없습니다*'
    }

    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code == 200:
        return resp.json()
    else:
        print(f"[ERROR] 조회 실패: {resp.status_code}")
        return []


def update_article_content(article_id, content):
    """기사 본문 업데이트"""
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    url = f"{SUPABASE_URL}/rest/v1/posts"
    params = {'id': f'eq.{article_id}'}
    data = {'content': content}

    resp = requests.patch(url, headers=headers, params=params, json=data)
    return resp.status_code == 204


def main():
    print("=" * 60)
    print("강진군 기사 본문 복구 스크립트")
    print("=" * 60)

    # 1. 문제 기사 조회
    articles = get_broken_articles()
    print(f"\n[INFO] 본문 누락 기사: {len(articles)}개")

    if not articles:
        print("[OK] 수정할 기사가 없습니다.")
        return

    # 2. Playwright로 본문 재수집
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        fixed_count = 0
        for article in articles:
            print(f"\n[처리중] {article['title'][:40]}...")

            try:
                # 상세 페이지에서 본문 추출
                content, thumbnail, pub_date, dept = fetch_detail(page, article['original_link'])

                if content and len(content) > 50:
                    # DB 업데이트
                    if update_article_content(article['id'], content):
                        print(f"   [OK] 본문 업데이트 완료 ({len(content)}자)")
                        fixed_count += 1
                    else:
                        print(f"   [ERROR] DB 업데이트 실패")
                else:
                    print(f"   [SKIP] 본문 추출 실패")

            except Exception as e:
                print(f"   [ERROR] {str(e)[:50]}")

        browser.close()

    print("\n" + "=" * 60)
    print(f"[완료] {fixed_count}/{len(articles)}개 기사 본문 복구")
    print("=" * 60)


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
korea.kr Setup and Test Script
- Add agency to database
- Insert test data directly
"""

import sys
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

# Path setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
env_paths = [
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'),
    os.path.join(os.path.dirname(__file__), '..', '..', '.env'),
]

for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"[OK] Loaded env from: {env_path}")
        break

# Supabase connection
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Supabase environment variables not found!")
    print(f"   SUPABASE_URL: {'Set' if SUPABASE_URL else 'Missing'}")
    print(f"   SUPABASE_KEY: {'Set' if SUPABASE_KEY else 'Missing'}")
    sys.exit(1)

# API headers
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}


def setup_agency():
    """Add korea_kr agency to agencies table"""
    print("\n" + "=" * 60)
    print("Step 1: Setup Agency")
    print("=" * 60)

    agency_data = {
        "region_code": "korea_kr",
        "name": "정책브리핑(정부)",
        "category": "전국",
        "base_url": "https://www.korea.kr",
        "press_release_url": "https://www.korea.kr/briefing/pressReleaseList.do"
    }

    api_url = f"{SUPABASE_URL}/rest/v1/agencies"

    # Check if already exists
    check_url = f"{api_url}?region_code=eq.korea_kr&select=id,region_code,name"
    check_resp = requests.get(check_url, headers=HEADERS)

    if check_resp.status_code == 200 and len(check_resp.json()) > 0:
        print(f"[OK] Agency already exists: {check_resp.json()[0]}")
        return True

    # Insert new agency
    insert_resp = requests.post(api_url, headers=HEADERS, json=agency_data)

    if insert_resp.status_code in [200, 201]:
        print(f"[OK] Agency added: {agency_data['name']}")
        return True
    else:
        print(f"[ERROR] Failed to add agency: {insert_resp.status_code}")
        print(f"   Response: {insert_resp.text[:200]}")
        return False


def insert_test_data():
    """Insert test article directly"""
    print("\n" + "=" * 60)
    print("Step 2: Insert Test Data")
    print("=" * 60)

    # Sample test data (from expert analysis)
    test_articles = [
        {
            "title": "[TEST] 2025년 온실농가 난방비 지원사업 시행",
            "subtitle": "농림축산식품부, 에너지 비용 절감 위한 지원책 발표",
            "content": """농림축산식품부는 2025년 온실농가 난방비 지원사업을 시행한다고 밝혔다.

이번 지원사업은 최근 에너지 가격 상승으로 어려움을 겪고 있는 온실농가를 돕기 위한 것으로, 전국 온실농가를 대상으로 한다.

주요 지원 내용:
- 난방유 구매 비용 일부 보조
- 에너지 효율화 시설 설치 지원
- 신재생에너지 전환 농가 추가 지원

신청은 2025년 1월 2일부터 각 지역 농업기술센터에서 가능하며, 예산 소진 시 조기 마감될 수 있다.

문의: 농림축산식품부 원예산업과 (044-201-2234)""",
            "original_link": "https://www.korea.kr/briefing/pressReleaseView.do?newsId=TEST001",
            "source": "농림축산식품부",
            "category": "전국",
            "region": "korea_kr",
            "status": "published",
            "published_at": datetime.now().strftime('%Y-%m-%dT09:00:00+09:00'),
            "thumbnail_url": None
        },
        {
            "title": "[TEST] 2025년 주요 경제정책 방향 발표",
            "subtitle": "기획재정부, 경제 활성화 위한 종합 대책 마련",
            "content": """기획재정부는 2025년 주요 경제정책 방향을 발표했다.

이번 정책은 내수 활성화와 수출 경쟁력 강화에 초점을 맞추고 있다.

주요 정책 방향:
1. 소비 진작을 위한 세제 지원 확대
2. 중소기업 금융 지원 강화
3. 신성장 산업 투자 확대
4. 일자리 창출 지원

정부는 이번 정책을 통해 2025년 경제성장률 2.5% 달성을 목표로 하고 있다.

문의: 기획재정부 정책조정국 (044-215-2510)""",
            "original_link": "https://www.korea.kr/briefing/pressReleaseView.do?newsId=TEST002",
            "source": "기획재정부",
            "category": "전국",
            "region": "korea_kr",
            "status": "published",
            "published_at": datetime.now().strftime('%Y-%m-%dT10:00:00+09:00'),
            "thumbnail_url": None
        }
    ]

    api_url = f"{SUPABASE_URL}/rest/v1/posts"
    success_count = 0

    for article in test_articles:
        # Check if already exists
        check_url = f"{api_url}?original_link=eq.{article['original_link']}&select=id,title"
        check_resp = requests.get(check_url, headers=HEADERS)

        if check_resp.status_code == 200 and len(check_resp.json()) > 0:
            print(f"[SKIP] Already exists: {article['title'][:40]}...")
            continue

        # Insert
        insert_resp = requests.post(api_url, headers=HEADERS, json=article)

        if insert_resp.status_code in [200, 201]:
            print(f"[OK] Inserted: {article['title'][:40]}...")
            success_count += 1
        else:
            print(f"[ERROR] Failed: {article['title'][:40]}...")
            print(f"   Status: {insert_resp.status_code}")
            print(f"   Response: {insert_resp.text[:200]}")

    print(f"\n[RESULT] {success_count}/{len(test_articles)} articles inserted")
    return success_count > 0


def verify_data():
    """Verify inserted data"""
    print("\n" + "=" * 60)
    print("Step 3: Verify Data")
    print("=" * 60)

    # Check posts (skip agencies - table may not exist)
    api_url = f"{SUPABASE_URL}/rest/v1/posts"
    check_url = f"{api_url}?region=eq.korea_kr&select=id,title,source,published_at&order=published_at.desc&limit=5"
    resp = requests.get(check_url, headers=HEADERS)

    if resp.status_code == 200:
        data = resp.json()
        print(f"\n[OK] Found {len(data)} posts from korea_kr:")
        for post in data:
            print(f"   - {post['title'][:50]}...")
            print(f"     Source: {post['source']}, Date: {post['published_at'][:10]}")


def cleanup_test_data():
    """Remove test data (optional)"""
    print("\n" + "=" * 60)
    print("Cleanup: Remove Test Data")
    print("=" * 60)

    api_url = f"{SUPABASE_URL}/rest/v1/posts"
    delete_url = f"{api_url}?original_link=like.*TEST*"

    resp = requests.delete(delete_url, headers=HEADERS)

    if resp.status_code in [200, 204]:
        print("[OK] Test data removed")
    else:
        print(f"[WARN] Cleanup response: {resp.status_code}")


def main():
    """Main function"""
    print("\n" + "#" * 60)
    print("# korea.kr Setup and Test")
    print("#" * 60)

    # Step 1: Setup agency (optional - table may not exist)
    print("\n[INFO] Checking agencies table...")
    setup_agency()  # Don't fail if agencies table doesn't exist

    # Step 2: Insert test data (main purpose)
    insert_test_data()

    # Step 3: Verify
    verify_data()

    print("\n" + "=" * 60)
    print("[DONE] Setup complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Check Supabase dashboard to verify data")
    print("2. Run the scraper: python korea_kr_scraper.py --visible")
    print("3. To remove test data: python setup_and_test.py --cleanup")


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--cleanup':
        cleanup_test_data()
    else:
        main()

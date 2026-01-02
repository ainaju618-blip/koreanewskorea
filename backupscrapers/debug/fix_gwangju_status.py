# -*- coding: utf-8 -*-
"""광주광역시 기사 status를 published로 변경"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabase 환경변수 없음!")
    exit(1)

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 1. 광주광역시 draft 기사 찾기
url = f"{SUPABASE_URL}/rest/v1/posts?source=eq.광주광역시&status=eq.draft&select=id,title,status"
resp = requests.get(url, headers=headers)

if resp.status_code != 200:
    print(f"조회 실패: {resp.status_code} - {resp.text}")
    exit(1)

posts = resp.json()
print(f"광주광역시 draft 기사: {len(posts)}개")

for p in posts:
    print(f"  - [{p['id']}] {p['title'][:40]}...")

# 2. status를 published로 변경
for p in posts:
    update_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{p['id']}"
    update_resp = requests.patch(update_url, headers=headers, json={'status': 'published'})
    
    if update_resp.status_code in [200, 204]:
        print(f"  ✅ [{p['id']}] published로 변경 완료")
    else:
        print(f"  ❌ [{p['id']}] 변경 실패: {update_resp.status_code}")

print("\n완료!")

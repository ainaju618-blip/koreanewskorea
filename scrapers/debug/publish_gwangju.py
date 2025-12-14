# -*- coding: utf-8 -*-
"""광주광역시 기사 status를 published로 변경"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 광주광역시 기사 중 draft/hidden 상태인 것 조회
url = f"{SUPABASE_URL}/rest/v1/posts?source=eq.광주광역시&status=neq.published&select=id,title,status"
resp = requests.get(url, headers=headers)
posts = resp.json()

print(f"광주광역시 미게시 기사: {len(posts)}개")

for p in posts:
    print(f"  - [{p['status']}] {p['title'][:40]}...")

# 전부 published로 변경
update_url = f"{SUPABASE_URL}/rest/v1/posts?source=eq.광주광역시&status=neq.published"
update_resp = requests.patch(update_url, headers=headers, json={'status': 'published'})

if update_resp.status_code in [200, 204]:
    print(f"\n✅ {len(posts)}개 기사 published로 변경 완료!")
else:
    print(f"\n❌ 변경 실패: {update_resp.status_code} - {update_resp.text}")

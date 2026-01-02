# -*- coding: utf-8 -*-
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
}

# 광주광역시 source로 검색
url = f"{SUPABASE_URL}/rest/v1/posts?source=eq.광주광역시&select=id,title,status,region,created_at"
resp = requests.get(url, headers=headers)
posts = resp.json()

print(f"=== source='광주광역시' 기사: {len(posts)}개 ===")
for p in posts:
    print(f"  [{p['status']:<10}] {p['region']:<10} | {p['title'][:40]}...")

# region=gwangju로도 검색
url2 = f"{SUPABASE_URL}/rest/v1/posts?region=eq.gwangju&select=id,title,status,source"
resp2 = requests.get(url2, headers=headers)
posts2 = resp2.json()

print(f"\n=== region='gwangju' 기사: {len(posts2)}개 ===")
for p in posts2[:20]:
    print(f"  [{p['status']:<10}] {p['source']:<20} | {p['title'][:30]}...")

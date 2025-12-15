# -*- coding: utf-8 -*-
"""bot_logs 테이블 구조 및 허용 status 값 확인"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# 1. 기존 로그에서 사용된 status 값 확인
print("=" * 50)
print("bot_logs에서 사용된 status 값 조회 중...")
print("=" * 50)

# 최근 100개 로그에서 distinct status 확인
url = f"{SUPABASE_URL}/rest/v1/bot_logs?select=status&order=id.desc&limit=100"
resp = requests.get(url, headers=headers)

if resp.status_code == 200:
    logs = resp.json()
    unique_statuses = set(log['status'] for log in logs)
    print(f"\n사용된 status 값들: {unique_statuses}")
else:
    print(f"조회 실패: {resp.status_code}")

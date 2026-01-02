# -*- coding: utf-8 -*-
"""bot_logs에서 running 상태를 강제로 stopped로 변경"""
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

# 1. running 상태인 로그 찾기
print("=" * 50)
print("bot_logs에서 running 상태 로그 검색 중...")
print("=" * 50)

url = f"{SUPABASE_URL}/rest/v1/bot_logs?status=eq.running&select=id,region,status,started_at,log_message"
resp = requests.get(url, headers=headers)

if resp.status_code != 200:
    print(f"조회 실패: {resp.status_code} - {resp.text}")
    exit(1)

logs = resp.json()
print(f"\nrunning 상태 로그: {len(logs)}개")

if len(logs) == 0:
    print("\n실행 중인 스크래퍼가 없습니다.")
    exit(0)

for log in logs:
    print(f"  - [ID: {log['id']}] {log['region']} - {log.get('started_at', 'N/A')[:19]}")

# 2. 모두 stopped 상태로 변경
print("\n" + "=" * 50)
print("모든 running 로그를 stopped로 변경 중...")
print("=" * 50)

for log in logs:
    update_url = f"{SUPABASE_URL}/rest/v1/bot_logs?id=eq.{log['id']}"
    update_data = {
        'status': 'failed',
        'log_message': '[강제 중지됨 by Admin]'
    }
    
    update_resp = requests.patch(update_url, headers=headers, json=update_data)
    
    if update_resp.status_code in [200, 204]:
        print(f"  [ID: {log['id']}] {log['region']} -> failure")
    else:
        print(f"  [ID: {log['id']}] 변경 실패: {update_resp.status_code}")
        print(f"    -> {update_resp.text}")

print("\n완료! 페이지를 새로고침해주세요.")

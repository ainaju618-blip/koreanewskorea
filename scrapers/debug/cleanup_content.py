# -*- coding: utf-8 -*-
"""DB 기사 content에서 '조회수' 메타데이터 제거"""
import requests
import re
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

# 제거할 패턴들
CLEANUP_PATTERNS = [
    r'조회수?\s*[:：]?\s*\d+',
    r'조회\s*\d+',
]

def clean_content(content):
    """content에서 메타데이터 제거"""
    if not content:
        return content
    
    cleaned = content
    for pattern in CLEANUP_PATTERNS:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # 연속 공백/줄바꿈 정리
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    cleaned = cleaned.strip()
    
    return cleaned

def main():
    # 1. 모든 기사 가져오기
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,content,source"
    resp = requests.get(url, headers=headers)
    
    if resp.status_code != 200:
        print(f"조회 실패: {resp.status_code}")
        return
    
    posts = resp.json()
    print(f"총 {len(posts)}개 기사 확인")
    
    # 2. 문제 있는 기사 찾아서 정리
    updated = 0
    for p in posts:
        content = p.get('content', '') or ''
        
        # 조회수 패턴이 있는지 확인
        has_issue = any(re.search(pat, content, re.IGNORECASE) for pat in CLEANUP_PATTERNS)
        
        if has_issue:
            cleaned = clean_content(content)
            
            if cleaned != content:
                # 업데이트
                update_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{p['id']}"
                update_resp = requests.patch(update_url, headers=headers, json={'content': cleaned})
                
                if update_resp.status_code in [200, 204]:
                    print(f"✅ [{p['source']}] {p['title'][:30]}... 정리 완료")
                    updated += 1
                else:
                    print(f"❌ [{p['id']}] 업데이트 실패: {update_resp.status_code}")
    
    print(f"\n완료! {updated}개 기사 정리됨")

if __name__ == "__main__":
    main()

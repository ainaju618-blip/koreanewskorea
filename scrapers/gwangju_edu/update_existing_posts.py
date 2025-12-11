# -*- coding: utf-8 -*-
"""
광주교육청 기존 기사 본문 업데이트 스크립트
- DB에 저장된 광주교육청 기사의 source_url로 다시 접속
- 본문을 재추출하여 업데이트
"""

import os
import sys
import time
import re

# 상위 디렉토리 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from supabase import create_client

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://oaciprcdcdegwufydjhv.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hY2lwcmNkY2RlZ3d1Znlkamh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNjg3NjgsImV4cCI6MjA0ODc0NDc2OH0.z8EfkVKPBSr1ot4HfBWmHWNBTMBqJCkcKLdKOGguJ_w")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_content(page, title: str) -> str:
    """JavaScript로 본문 추출 (제목 영역 제외)"""
    content = ""
    
    try:
        content = page.evaluate("""() => {
            const boardPress = document.querySelector('div.board_press');
            if (!boardPress) return '';
            
            const clone = boardPress.cloneNode(true);
            
            const excludeSelectors = [
                'div.view_top',
                'div.inquiry',
                'div.writer',
                'div.file_list',
                'div.view_bottom',
                '.btn_wrap',
            ];
            
            excludeSelectors.forEach(sel => {
                const els = clone.querySelectorAll(sel);
                els.forEach(el => el.remove());
            });
            
            return clone.textContent?.trim() || '';
        }""")
    except Exception as e:
        print(f"      ⚠️ JS 본문 추출 실패: {e}")
    
    # 정제
    if content:
        noise_patterns = [
            r'HOME\s*',
            r'보도/해명자료\s*',
            r'오늘의 보도/해명자료란에 오신 것을 환영합니다\.?\s*',
            r'보도자료\s*(?=[^\w]|$)',
            r'만족도\s*조사.*',
            r'저작권.*',
            r'COPYRIGHT.*',
            r'목록\s*이전글\s*다음글.*',
            r'자료문의\s*:.*',
        ]
        for pattern in noise_patterns:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)
        
        # 제목 중복 제거
        if title and content.startswith(title):
            content = content[len(title):].strip()
        
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        content = content.strip()[:5000]
    
    return content


def main():
    print("🔄 광주교육청 기존 기사 본문 업데이트 시작")
    
    # 1. DB에서 광주교육청 기사 조회
    result = supabase.table('posts').select('id, title, source_url, content').eq('category', '광주교육청').execute()
    posts = result.data or []
    
    print(f"   📊 총 {len(posts)}개 기사 발견")
    
    if not posts:
        print("   ⚠️ 업데이트할 기사가 없습니다.")
        return
    
    updated = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        for i, post in enumerate(posts):
            post_id = post['id']
            title = post['title']
            source_url = post.get('source_url', '')
            old_content = post.get('content', '')
            
            # 이미 정상적인 본문인지 확인 (메뉴 텍스트 포함 여부)
            if '보도/해명자료란에 오신 것을 환영합니다' not in old_content and 'HOME' not in old_content[:50]:
                print(f"   [{i+1}/{len(posts)}] ✅ 이미 정상: {title[:30]}...")
                continue
            
            if not source_url:
                print(f"   [{i+1}/{len(posts)}] ⚠️ source_url 없음: {title[:30]}...")
                continue
            
            print(f"   [{i+1}/{len(posts)}] 🔄 재수집: {title[:30]}...")
            
            try:
                page.goto(source_url, timeout=30000)
                time.sleep(2)
                
                new_content = extract_content(page, title)
                
                if new_content and len(new_content) > 100:
                    # DB 업데이트
                    supabase.table('posts').update({'content': new_content}).eq('id', post_id).execute()
                    updated += 1
                    print(f"      ✅ 업데이트 완료 ({len(new_content)}자)")
                else:
                    print(f"      ⚠️ 본문 추출 실패 또는 너무 짧음")
            
            except Exception as e:
                print(f"      ❌ 오류: {e}")
            
            time.sleep(1)  # 요청 간격
        
        browser.close()
    
    print(f"\n🎉 완료: {updated}/{len(posts)}개 기사 업데이트됨")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
광주교육청 기존 기사 제목+본문 업데이트 스크립트 v2
- 잘못된 제목 "광주광역시교육청홍보관"을 실제 제목으로 수정
- 본문도 재추출하여 업데이트
"""

import os
import sys
import time
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from supabase import create_client

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://oaciprcdcdegwufydjhv.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hY2lwcmNkY2RlZ3d1Znlkamh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNjg3NjgsImV4cCI6MjA0ODc0NDc2OH0.z8EfkVKPBSr1ot4HfBWmHWNBTMBqJCkcKLdKOGguJ_w")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_title(page) -> str:
    """JavaScript로 제목 추출 (view_top 영역에서)"""
    try:
        title = page.evaluate("""() => {
            const viewTop = document.querySelector('div.view_top');
            if (!viewTop) return '';
            
            const text = viewTop.textContent || '';
            const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 5);
            
            for (const line of lines) {
                if (!line.includes('작성일:') && 
                    !line.includes('작성자:') && 
                    !line.includes('기관명') &&
                    !line.includes('자료문의') &&
                    !line.includes('조회수') &&
                    !line.includes('추천수') &&
                    !line.includes('등록일')) {
                    return line;
                }
            }
            return lines[0] || '';
        }""")
        return title.strip() if title else ""
    except:
        return ""


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
        
        if title and content.startswith(title):
            content = content[len(title):].strip()
        
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        content = content.strip()[:5000]
    
    return content


def main():
    print("🔄 광주교육청 잘못된 제목 수정 시작")
    
    # DB에서 잘못된 제목을 가진 기사 조회
    result = supabase.table('posts').select('id, title, source_url, content').eq('category', '광주교육청').execute()
    posts = result.data or []
    
    # 잘못된 제목을 가진 기사만 필터링
    bad_posts = [p for p in posts if p.get('title', '').strip() in ['광주광역시교육청홍보관', '광주교육청', '']]
    
    print(f"   📊 총 {len(posts)}개 중 {len(bad_posts)}개 기사 제목 수정 필요")
    
    if not bad_posts:
        print("   ✅ 수정이 필요한 기사가 없습니다.")
        return
    
    updated = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        for i, post in enumerate(bad_posts):
            post_id = post['id']
            old_title = post['title']
            source_url = post.get('source_url', '')
            
            if not source_url:
                print(f"   [{i+1}/{len(bad_posts)}] ⚠️ source_url 없음")
                continue
            
            print(f"   [{i+1}/{len(bad_posts)}] 🔄 수정 중: {source_url[-30:]}...")
            
            try:
                page.goto(source_url, timeout=30000)
                time.sleep(2)
                
                # 제목 추출
                new_title = extract_title(page)
                
                if not new_title or len(new_title) < 5:
                    print(f"      ⚠️ 제목 추출 실패")
                    continue
                
                # 본문 추출
                new_content = extract_content(page, new_title)
                
                # DB 업데이트
                update_data = {'title': new_title}
                if new_content and len(new_content) > 100:
                    update_data['content'] = new_content
                
                supabase.table('posts').update(update_data).eq('id', post_id).execute()
                updated += 1
                print(f"      ✅ 제목 수정: {new_title[:40]}...")
            
            except Exception as e:
                print(f"      ❌ 오류: {e}")
            
            time.sleep(1)
        
        browser.close()
    
    print(f"\n🎉 완료: {updated}/{len(bad_posts)}개 기사 제목 수정됨")


if __name__ == "__main__":
    main()

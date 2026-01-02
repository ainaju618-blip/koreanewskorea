
import sys
import os
import time
from playwright.sync_api import sync_playwright

def dump_jindo_html():
    print("🕵️ 진도군 HTML 덤프 시작 (URL 수정됨)")
    list_url = 'https://www.jindo.go.kr/home/sub.cs?m=626'
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        page.goto(list_url, wait_until='networkidle')
        time.sleep(3)
        
        content = page.content()
        with open('debug_jindo.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("💾 HTML 저장 완료: debug_jindo.html")
        
        # Check selectors
        rows = page.locator('tbody tr')
        print(f"   🔍 tbody tr 개수: {rows.count()}")
        
        browser.close()

if __name__ == "__main__":
    dump_jindo_html()

"""
나주시청 1개 기사 테스트 (디버그용)
"""

import os
import time
import re
from playwright.sync_api import sync_playwright

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_debug')

def test_single():
    print("TEST: 1개 기사 캡처")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 목록
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        
        # 첫 번째 기사
        link = page.locator('tbody tr a[href*="coverage?idx="]').first
        href = link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        detail_url = f"{BASE_URL}{href}"
        
        print(f"IDX: {idx}")
        
        # 상세 페이지
        page.goto(detail_url)
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        print(f"URL loaded")
        
        # 선택자 테스트
        selectors = ['div.view_cont', 'div.bbs_view_cont', 'article', '#content']
        for sel in selectors:
            loc = page.locator(sel)
            cnt = loc.count()
            print(f"  {sel}: {cnt}")
            
            if cnt > 0:
                filepath = os.path.join(SAVE_DIR, f"{idx}_{sel.replace('.','_').replace('#','')}.png")
                try:
                    loc.first.screenshot(path=filepath)
                    size = os.path.getsize(filepath)
                    print(f"    -> Saved: {size} bytes")
                except Exception as e:
                    print(f"    -> Error: {e}")
        
        browser.close()
    
    print("DONE")

if __name__ == '__main__':
    test_single()

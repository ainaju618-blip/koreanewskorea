"""
셀렉터 비교: div.view_box vs .board_view_content
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright

URL = "https://www.naju.go.kr/www/administration/reporting/coverage?idx=592180&mode=view"

SELECTORS_TO_TEST = [
    'div.view_box',           # 내가 찾은 것
    '.board_view_content',    # 새 데이터
    '.view_content',          # 새 데이터 대안
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.goto(URL, wait_until='networkidle', timeout=30000)
    time.sleep(2)
    
    print("=" * 60)
    print("셀렉터 비교 테스트")
    print("=" * 60)
    
    for sel in SELECTORS_TO_TEST:
        elem = page.locator(sel)
        count = elem.count()
        
        if count > 0:
            text = elem.first.inner_text()[:150].replace('\n', ' ')
            has_footer = '민원' in text or '사이트맵' in text or '정부24' in text
            
            print(f"\n✅ {sel}")
            print(f"   개수: {count}")
            print(f"   길이: {len(elem.first.inner_text())}자")
            print(f"   푸터 포함: {'❌ 있음' if has_footer else '✅ 없음'}")
            print(f"   미리보기: {text[:80]}...")
        else:
            print(f"\n❌ {sel} - 없음")
    
    browser.close()

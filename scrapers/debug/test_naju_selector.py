"""
나주시 본문 추출 테스트 (region.board_view_area 셀렉터)
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from utils.scraper_utils import safe_goto, safe_get_text

URL = "https://www.naju.go.kr/www/administration/reporting/coverage?idx=592180&mode=view"

# 테스트할 셀렉터들
TEST_SELECTORS = [
    'region.board_view_area',
    '.board_view_area',
    'region',
    'div.view_content',
    'div.board_view',
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print(f"🔍 URL: {URL}\n")
    safe_goto(page, URL, timeout=30000)
    time.sleep(2)
    
    print("=" * 60)
    print("본문 셀렉터 테스트 결과")
    print("=" * 60)
    
    for sel in TEST_SELECTORS:
        elem = page.locator(sel)
        count = elem.count()
        if count > 0:
            text = safe_get_text(elem)[:200].replace('\n', ' ')
            print(f"\n✅ {sel}: {count}개 발견")
            print(f"   텍스트 미리보기: {text}...")
        else:
            print(f"\n❌ {sel}: 없음")
    
    browser.close()
    print("\n" + "=" * 60)

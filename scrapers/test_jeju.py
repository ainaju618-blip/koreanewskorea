"""제주 스크래퍼 테스트"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=== 제주 스크래퍼 테스트 시작 ===", flush=True)

try:
    from playwright.sync_api import sync_playwright
    from playwright_stealth import Stealth
    print("[OK] Playwright imported", flush=True)
except Exception as e:
    print(f"[ERROR] Import failed: {e}", flush=True)
    sys.exit(1)

print("[INFO] Starting browser...", flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    Stealth().apply_stealth_sync(page)

    print("[INFO] Navigating to Jeju...", flush=True)
    page.goto('https://www.jeju.go.kr/news/bodo/list.htm', wait_until='networkidle', timeout=30000)
    print(f"[OK] Page loaded: {page.title()}", flush=True)

    # Test selector
    selector = 'ul li:has(a[href*="list.htm?act=view"])'
    rows = page.locator(selector)
    count = rows.count()
    print(f"[INFO] Found {count} rows with selector: {selector}", flush=True)

    if count > 0:
        # Get first row info
        first_row = rows.first
        link = first_row.locator('a[href*="act=view"]').first
        title_elem = link.locator('strong').first

        if title_elem.count() > 0:
            title = title_elem.inner_text()
        else:
            title = link.inner_text()[:50]

        href = link.get_attribute('href')
        print(f"[OK] First article:", flush=True)
        print(f"     Title: {title[:40]}...", flush=True)
        print(f"     URL: {href}", flush=True)

        # Try to get date from link text
        link_text = link.inner_text()
        import re
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})\s*$', link_text)
        if date_match:
            print(f"     Date: {date_match.group(1)}", flush=True)

    browser.close()
    print("[OK] Test completed!", flush=True)


from playwright.sync_api import sync_playwright
import sys

def debug_content(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        
        print(f"URL: {url}")
        
        # 1. Inspect common selectors
        selectors = ['.view_content', '.board_view', 'div[class*="content"]', '#txt', 'td[colspan]']
        
        found_content = False
        for sel in selectors:
            elements = page.locator(sel).all()
            print(f"\n--- Selector: {sel} (Count: {len(elements)}) ---")
            for i, el in enumerate(elements):
                text = el.inner_text().strip()
                print(f"[{i}] Length: {len(text)}")
                print(f"[{i}] Preview: {text[:100]}...")
                if "공공누리" in text:
                    print(f"    ⚠️ Contains '공공누리' license text!")

        # 2. Dump specific unexpected structure if needed
        # Inspecting table structure specifically as Yeonggwang uses tables
        print("\n--- Table Cell Inspection ---")
        tds = page.locator('table tr td').all()
        for i, td in enumerate(tds):
            text = td.inner_text().strip()
            if len(text) > 50:
                print(f"TD[{i}]: Length={len(text)}")
                print(f"TD[{i}]: {text[:100]}...")

        browser.close()

if __name__ == "__main__":
    # Use one of the URLs from the user's report or a recent one found in logs
    # Using the one from the screenshot title if possible, or a generic one from the list
    # Let's use a recent one found in previous logs or a likely ID
    # From previous logs: https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056&type=view&bs_idx=1154678 (Example)
    target_url = "https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056&type=view&bs_idx=1154678" 
    debug_content(target_url)

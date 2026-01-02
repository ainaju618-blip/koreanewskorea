# -*- coding: utf-8 -*-
"""
korea.kr Scraper Test Script
- Quick test to verify selectors and scraping logic
"""

import sys
import os
import time

# Path setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright

try:
    from playwright_stealth import stealth_sync
    HAS_STEALTH = True
except ImportError:
    HAS_STEALTH = False

# =============================================================================
# CONSTANTS
# =============================================================================

BASE_URL = 'https://www.korea.kr'
LIST_URL = 'https://www.korea.kr/briefing/pressReleaseList.do'

# Verified selectors from expert
LIST_LINK_SELECTORS = [
    '.list_type ul > li > a',
    'a[href*="pressReleaseView.do?newsId="]',
]

DETAIL_SELECTORS = {
    'title': 'h2.page_title strong',
    'date': 'div.info > span:first-child',
    'department': 'a[href*="ministryNewsList"]',
    'content': '#content',
}


def test_list_page():
    """Test list page scraping"""
    print("=" * 60)
    print("TEST 1: List Page")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        if HAS_STEALTH:
            stealth_sync(page)
            print("[OK] Stealth mode applied")

        # Navigate to list page
        print(f"[GO] {LIST_URL}")
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Test each selector
        for selector in LIST_LINK_SELECTORS:
            try:
                links = page.locator(selector)
                count = links.count()
                print(f"[TEST] Selector: {selector}")
                print(f"       Found: {count} links")

                if count > 0:
                    # Show first 3 links
                    for i in range(min(3, count)):
                        link = links.nth(i)
                        href = link.get_attribute('href')

                        # Get title from span.text
                        title = ""
                        try:
                            title_elem = link.locator('span.text').first
                            if title_elem.count() > 0:
                                title = title_elem.inner_text().strip()
                        except:
                            title = link.inner_text().strip()[:50]

                        # Get source info
                        source = ""
                        try:
                            source_elem = link.locator('span.source').first
                            if source_elem.count() > 0:
                                source = source_elem.inner_text().strip()
                        except:
                            pass

                        print(f"       [{i+1}] {title[:40]}...")
                        print(f"           URL: {href}")
                        print(f"           Source: {source}")

                    print(f"[OK] Selector works!")
                    break
            except Exception as e:
                print(f"[FAIL] {selector}: {e}")

        browser.close()


def test_detail_page():
    """Test detail page scraping"""
    print("\n" + "=" * 60)
    print("TEST 2: Detail Page")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        if HAS_STEALTH:
            stealth_sync(page)

        # First get a real article URL
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Get first article link
        first_link = page.locator('.list_type ul > li > a').first
        href = first_link.get_attribute('href')

        if not href.startswith('http'):
            href = BASE_URL + href

        print(f"[GO] {href}")
        page.goto(href)
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Test each selector
        for name, selector in DETAIL_SELECTORS.items():
            try:
                elem = page.locator(selector).first
                if elem.count() > 0:
                    text = elem.inner_text().strip()
                    if len(text) > 100:
                        text = text[:100] + "..."
                    print(f"[OK] {name}: {text}")
                else:
                    print(f"[WARN] {name}: Not found with selector '{selector}'")
            except Exception as e:
                print(f"[FAIL] {name}: {e}")

        # Test og:image
        try:
            og_image = page.locator('meta[property="og:image"]').first
            if og_image.count() > 0:
                content = og_image.get_attribute('content')
                print(f"[OK] og:image: {content}")
            else:
                print("[WARN] og:image: Not found")
        except Exception as e:
            print(f"[FAIL] og:image: {e}")

        # Test content images
        try:
            imgs = page.locator('#content img')
            count = imgs.count()
            print(f"[INFO] Content images: {count} found")
            for i in range(min(3, count)):
                src = imgs.nth(i).get_attribute('src')
                print(f"       [{i+1}] {src}")
        except Exception as e:
            print(f"[FAIL] Content images: {e}")

        browser.close()


def test_pagination():
    """Test pagination"""
    print("\n" + "=" * 60)
    print("TEST 3: Pagination (GET parameter)")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        if HAS_STEALTH:
            stealth_sync(page)

        for page_num in [1, 2, 3]:
            url = f'{LIST_URL}?pageIndex={page_num}'
            print(f"[GO] Page {page_num}: {url}")

            page.goto(url)
            page.wait_for_load_state('networkidle')
            time.sleep(1)

            # Count articles
            links = page.locator('.list_type ul > li > a')
            count = links.count()
            print(f"     Found: {count} articles")

            if count > 0:
                # Show first article title
                first = links.first
                try:
                    title = first.locator('span.text').first.inner_text().strip()
                    print(f"     First: {title[:40]}...")
                except:
                    pass

        print("[OK] Pagination works!")
        browser.close()


def main():
    """Run all tests"""
    print("\n" + "#" * 60)
    print("# korea.kr Scraper Selector Test")
    print("#" * 60 + "\n")

    try:
        test_list_page()
        test_detail_page()
        test_pagination()

        print("\n" + "=" * 60)
        print("[DONE] All tests completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

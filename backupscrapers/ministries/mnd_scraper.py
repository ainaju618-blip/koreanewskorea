# -*- coding: utf-8 -*-
"""
Ministry of National Defense (MND) Press Release Scraper
- Version: v1.0
- Last Modified: 2025-12-25
- Maintainer: AI Agent

Target: https://www.mnd.go.kr
Features:
- Press release collection from MND website
- Same pattern as municipal scrapers
- Error collector integration
- Date filtering support
"""

# ============================================================
# 1. Standard Libraries
# ============================================================
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin, urlparse, parse_qs

# ============================================================
# 2. External Libraries
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. Local Modules
# ============================================================
# Add scrapers directory to path for utils
scrapers_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, scrapers_dir)
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, extract_subtitle
from utils.content_cleaner import clean_article_content
from utils.category_detector import detect_category
from utils.error_collector import ErrorCollector

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'mnd'
REGION_NAME = 'Ministry of National Defense'
CATEGORY_NAME = 'National'
BASE_URL = 'https://www.mnd.go.kr'
LIST_URL = 'https://www.mnd.go.kr/user/newsInUserRecord.action'

# List page parameters
LIST_PARAMS = {
    'siteId': 'mnd',
    'handle': 'I_669',
    'id': 'mnd_020500000000'
}

# Detail page URL template
DETAIL_URL_TEMPLATE = 'https://www.mnd.go.kr/user/newsInUserRecord.action?siteId=mnd&newsId=I_669&newsSeq={seq}&page=1&parent='

# Content selectors
CONTENT_SELECTORS = [
    '.view_cont',
    '.board_view_content',
    '#content',
    '.bbs_view',
    'article',
]

# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    date_str = date_str.strip()

    # Pattern: YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
    match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
    if match:
        y, m, d = match.groups()
        return f"{y}-{int(m):02d}-{int(d):02d}"

    return datetime.now().strftime('%Y-%m-%d')


def extract_news_seq(onclick_or_href: str) -> Optional[str]:
    """Extract newsSeq from onclick handler or href"""
    if not onclick_or_href:
        return None

    # Pattern: jf_view('I_104994') or newsSeq=I_104994
    match = re.search(r"jf_view\('([^']+)'\)", onclick_or_href)
    if match:
        return match.group(1)

    match = re.search(r'newsSeq=([^&]+)', onclick_or_href)
    if match:
        return match.group(1)

    return None


def build_list_url(page_num: int = 1) -> str:
    """Build list page URL with pagination"""
    params = '&'.join([f'{k}={v}' for k, v in LIST_PARAMS.items()])
    return f"{LIST_URL}?{params}&page={page_num}"


# ============================================================
# 6. Detail Page Extraction
# ============================================================
def fetch_detail(page: Page, news_seq: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    Extract content, images, and date from detail page

    Returns:
        (content, thumbnail_url, date, error_reason)
    """
    url = DETAIL_URL_TEMPLATE.format(seq=news_seq)

    if not safe_goto(page, url, timeout=30000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), "PAGE_LOAD_FAIL"

    time.sleep(2)

    # 1. Extract date
    pub_date = datetime.now().strftime('%Y-%m-%d')
    try:
        # Look for date in dl/dt/dd structure
        date_dd = page.locator('dt:has-text("date"), dt:has-text("Date")').locator('xpath=following-sibling::dd').first
        if date_dd.count() > 0:
            date_text = safe_get_text(date_dd)
            pub_date = normalize_date(date_text)
        else:
            # Alternative: look for common date patterns
            date_elem = page.locator('dd:has-text("2025-"), dd:has-text("2024-")').first
            if date_elem.count() > 0:
                pub_date = normalize_date(safe_get_text(date_elem))
    except:
        pass

    # 2. Extract content
    content = ""
    try:
        # Try content selectors
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel).first
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 100:
                        content = text
                        break
            except:
                continue

        # JavaScript extraction as fallback
        if not content or len(content) < 100:
            js_code = """
            () => {
                const contentArea = document.querySelector('#content') ||
                                   document.querySelector('.view_cont') ||
                                   document.querySelector('article');
                if (contentArea) {
                    // Get text but exclude navigation elements
                    const clone = contentArea.cloneNode(true);
                    const navElements = clone.querySelectorAll('nav, .pagination, .btn_area, .file_list');
                    navElements.forEach(el => el.remove());
                    return clone.innerText?.trim();
                }
                return '';
            }
            """
            js_content = page.evaluate(js_code)
            if js_content and len(js_content) > len(content):
                content = js_content

    except Exception as e:
        print(f"      [WARN] Content extraction failed: {e}")

    # Clean content
    if content:
        content = clean_article_content(content)
        content = content[:5000]

    # Content validation
    if not content or len(content) < 50:
        return "", None, pub_date, "CONTENT_TOO_SHORT"

    # 3. Extract image
    thumbnail_url = None

    # Try og:image first
    try:
        og_elem = page.locator('meta[property="og:image"]').first
        if og_elem.count() > 0:
            og_url = safe_get_attr(og_elem, 'content')
            if og_url and 'logo' not in og_url.lower():
                thumbnail_url = og_url if og_url.startswith('http') else urljoin(BASE_URL, og_url)
    except:
        pass

    # Try content images
    if not thumbnail_url:
        try:
            imgs = page.locator('#content img, .view_cont img')
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg']):
                    thumbnail_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                    break
        except:
            pass

    return content, thumbnail_url, pub_date, None


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None, headless: bool = True) -> List[Dict]:
    """
    Collect press releases and send to server

    Args:
        days: Collection period (days)
        max_articles: Maximum articles to collect
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        headless: Run browser in headless mode
    """
    # Calculate date filter
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"[{REGION_NAME}] Press release collection starting")
    print(f"   Period: {start_date} ~ {end_date}, Max: {max_articles}")

    # Ensure server is running
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} scraper v1.0 started', 'info')

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = build_list_url(page_num)
            print(f"   [PAGE] Page {page_num} scanning...")

            if not safe_goto(page, list_url, timeout=30000):
                page_num += 1
                continue

            time.sleep(2)

            # Find article links using onclick pattern
            article_elements = page.locator('[onclick*="jf_view"]')
            link_count = article_elements.count()
            print(f"      [FOUND] {link_count} articles")

            if link_count == 0:
                print("      [WARN] No article links found")
                break

            # Collect link info
            link_data = []
            seen_seqs = set()

            for i in range(link_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    elem = article_elements.nth(i)
                    onclick = safe_get_attr(elem, 'onclick')
                    news_seq = extract_news_seq(onclick)

                    if not news_seq or news_seq in seen_seqs:
                        continue
                    seen_seqs.add(news_seq)

                    # Get title
                    title = safe_get_text(elem)
                    if not title or len(title) < 5:
                        continue

                    # Get date from nearby dd element
                    list_date = None
                    try:
                        # Find parent and look for date in dl structure
                        parent = elem.locator('xpath=ancestor::*[contains(@class,"list") or self::tr or self::li]').first
                        if parent.count() > 0:
                            date_elem = parent.locator('dd, td, .date, span.date').first
                            if date_elem.count() > 0:
                                date_text = safe_get_text(date_elem)
                                if date_text and re.search(r'\d{4}', date_text):
                                    list_date = normalize_date(date_text)
                    except:
                        pass

                    link_data.append({
                        'title': title.strip()[:200],
                        'news_seq': news_seq,
                        'list_date': list_date,
                    })

                except Exception as e:
                    continue

            # Build URLs for duplicate check
            urls_to_check = [DETAIL_URL_TEMPLATE.format(seq=item['news_seq']) for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            new_link_data = [item for item in link_data if DETAIL_URL_TEMPLATE.format(seq=item['news_seq']) not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

            # Process detail pages
            for item in new_link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                news_seq = item['news_seq']

                print(f"      [ARTICLE] {title[:40]}...")

                content, thumbnail_url, detail_date, error_reason = fetch_detail(page, news_seq)
                error_collector.increment_processed()

                if error_reason:
                    error_collector.add_error(error_reason, title, DETAIL_URL_TEMPLATE.format(seq=news_seq))
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.5)
                    continue

                # Use detail page date, fallback to list date
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')

                # Date filtering
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date
                if date_only < start_date:
                    stop = True
                    break

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Auto-categorize
                cat_code, cat_name = detect_category(title, content)

                # Build article data
                published_at = f"{final_date}T09:00:00+09:00"
                original_link = DETAIL_URL_TEMPLATE.format(seq=news_seq)

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': published_at,
                    'original_link': original_link,
                    'source': REGION_NAME,
                    'category': cat_name or CATEGORY_NAME,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }

                # Send to server
                result = send_article_to_server(article_data)

                if result and result.get('status') == 'created':
                    error_collector.add_success()
                    collected_count += 1
                    print(f"         [OK] Saved")
                    log_to_server(REGION_CODE, 'running', f"Saved: {title[:20]}...", 'success')
                elif result and result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")
                else:
                    error_collector.add_error("API_FAIL", title, original_link)
                    print(f"         [WARN] API save failed")

                time.sleep(1)

            page_num += 1
            if stop:
                print("      [STOP] Date filter reached, stopping")
                break

            time.sleep(1.5)

        browser.close()

    # Print error summary
    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[OK] {final_msg}")

    log_to_server(
        REGION_CODE, 'success', final_msg, 'success',
        created_count=error_collector.success_count,
        skipped_count=error_collector.skip_count
    )

    return []


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper v1.0')
    parser.add_argument('--days', type=int, default=3, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Max articles to collect')
    parser.add_argument('--start-date', type=str, default=None, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='End date (YYYY-MM-DD)')
    parser.add_argument('--visible', action='store_true', help='Show browser window')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date,
        headless=not args.visible
    )


if __name__ == "__main__":
    main()

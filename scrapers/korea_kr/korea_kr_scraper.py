# -*- coding: utf-8 -*-
"""
Government Press Release Scraper (korea.kr)
- Version: v3.1
- Last Modified: 2025-12-25
- Maintainer: AI Agent

Target: https://www.korea.kr/briefing/pressReleaseList.do
Features:
- Expert verified selectors
- Same pattern as municipal scrapers (naju, etc.)
- Error collector integration
- Date filtering support
- Content extraction from docViewer iframe (innerWrap frame)
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
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, extract_subtitle
from utils.content_cleaner import clean_article_content
from utils.category_detector import detect_category
from utils.error_collector import ErrorCollector

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'korea_kr'
REGION_NAME = '정책브리핑'
CATEGORY_NAME = '전국'
BASE_URL = 'https://www.korea.kr'
LIST_URL = 'https://www.korea.kr/briefing/pressReleaseList.do'

# Pagination: ?pageIndex={N}
# Detail page: ?newsId={ID}

# List page selectors (Expert verified)
LIST_LINK_SELECTORS = [
    '.list_type ul > li > a',
    'a[href*="pressReleaseView.do?newsId="]',
    '.list_type a[href*="newsId"]',
]

# Content selectors (for detail page)
CONTENT_SELECTORS = [
    '.view_cont',           # Main content area
    '.docConversion',       # Document conversion area
    '#article_body',        # Article body
    '.news_content',        # News content
    'article',              # Article tag
]

# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    date_str = date_str.strip()

    # Pattern: YYYY.MM.DD or YYYY-MM-DD or YYYY/MM/DD
    match = re.search(r'(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})', date_str)
    if match:
        y, m, d = match.groups()
        return f"{y}-{int(m):02d}-{int(d):02d}"

    return datetime.now().strftime('%Y-%m-%d')


def extract_news_id(url: str) -> Optional[str]:
    """Extract newsId from URL"""
    if not url:
        return None

    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    if 'newsId' in params:
        return params['newsId'][0]

    match = re.search(r'newsId=(\d+)', url)
    if match:
        return match.group(1)

    return None


def parse_source_info(source_text: str) -> Tuple[str, str]:
    """
    Parse source info to extract date and department
    Format: "2025.12.25 Ministry Name"
    """
    if not source_text:
        return datetime.now().strftime('%Y-%m-%d'), ''

    source_text = source_text.strip()

    # Extract date
    date_match = re.search(r'(\d{4}\.\d{1,2}\.\d{1,2})', source_text)
    date_str = normalize_date(date_match.group(1)) if date_match else datetime.now().strftime('%Y-%m-%d')

    # Extract department (after date)
    dept = ''
    if date_match:
        dept = source_text[date_match.end():].strip()

    return date_str, dept


# ============================================================
# 6. Detail Page Extraction
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, images, and date from detail page

    Returns:
        (content, thumbnail_url, date, department, error_reason)
    """
    if not safe_goto(page, url, timeout=30000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"

    time.sleep(1.5)  # Page stabilization

    # 1. Extract date (Expert verified: div.info > span:first-child)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    date_selectors = [
        'div.info > span:first-child',
        '.info span:first-of-type',
        'meta[property="article:published_time"]',
    ]

    for sel in date_selectors:
        try:
            if 'meta' in sel:
                elem = page.locator(sel).first
                if elem.count() > 0:
                    content_attr = safe_get_attr(elem, 'content')
                    if content_attr:
                        pub_date = normalize_date(content_attr)
                        break
            else:
                elem = page.locator(sel).first
                if elem.count() > 0:
                    text = safe_get_text(elem)
                    if text and re.search(r'\d{4}', text):
                        pub_date = normalize_date(text)
                        break
        except:
            continue

    # 2. Extract department (Expert verified: a[href*="ministryNewsList"])
    department = None
    try:
        dept_elem = page.locator('a[href*="ministryNewsList"]').first
        if dept_elem.count() > 0:
            dept_text = safe_get_text(dept_elem)
            if dept_text:
                department = dept_text.strip()
    except:
        pass

    # 3. Extract content from iframe (korea.kr uses docViewer iframe)
    content = ""

    # Wait for iframe to load
    time.sleep(2)

    # Method 1: Extract from innerWrap frame (actual content)
    try:
        for frame in page.frames:
            # Look for the innerWrap frame which contains actual content
            if frame.name == 'innerWrap' or ('docViewer/result' in frame.url and 'innerWrap' in frame.name):
                try:
                    frame_content = frame.evaluate('() => document.body.innerText')
                    if frame_content and len(frame_content) > 100:
                        content = frame_content.strip()
                        break
                except:
                    pass

            # Also try frame with docViewer/result URL
            if 'docViewer/result' in frame.url:
                try:
                    frame_content = frame.evaluate('() => document.body.innerText')
                    if frame_content and len(frame_content) > 100:
                        content = frame_content.strip()
                        break
                except:
                    pass
    except Exception as e:
        print(f"      [WARN] Frame content extraction failed: {e}")

    # Method 2: Fallback to main page selectors
    if not content or len(content) < 100:
        try:
            js_code = """
            () => {
                const viewCont = document.querySelector('.view_cont');
                if (viewCont) {
                    const text = viewCont.innerText?.trim();
                    if (text && text.length > 100) return text;
                }
                const article = document.querySelector('article, .news_content, #article_body');
                if (article) {
                    const text = article.innerText?.trim();
                    if (text && text.length > 100) return text;
                }
                return '';
            }
            """
            fallback_content = page.evaluate(js_code)
            if fallback_content and len(fallback_content) > len(content):
                content = fallback_content
        except:
            pass

    # Clean content
    if content:
        content = clean_article_content(content)
        content = content[:5000]

    # Content validation
    if not content or len(content) < 50:
        return "", None, pub_date, department, "CONTENT_TOO_SHORT"

    # 4. Extract image
    thumbnail_url = None

    # Try og:image first
    try:
        og_elem = page.locator('meta[property="og:image"]').first
        if og_elem.count() > 0:
            og_url = safe_get_attr(og_elem, 'content')
            # Skip default logo images
            if og_url and 'logo' not in og_url.lower() and 'default' not in og_url.lower():
                thumbnail_url = og_url if og_url.startswith('http') else urljoin(BASE_URL, og_url)
    except:
        pass

    # Try content images
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            try:
                imgs = page.locator(f'{sel} img')
                for i in range(min(imgs.count(), 5)):
                    src = safe_get_attr(imgs.nth(i), 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'sprite']):
                        thumbnail_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                        break
                if thumbnail_url:
                    break
            except:
                continue

    # Note: korea.kr often has no images - don't fail on this
    # (Will use department-based placeholder later)

    return content, thumbnail_url, pub_date, department, None  # Success


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server

    Args:
        days: Collection period (days)
        max_articles: Maximum articles to collect
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
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

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} scraper v3.0 started', 'info')

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}?pageIndex={page_num}'
            print(f"   [PAGE] Page {page_num} scanning...")

            if not safe_goto(page, list_url, timeout=30000):
                page_num += 1
                continue

            time.sleep(2)  # Page load wait

            # Find article links (Expert verified selectors)
            links = None
            for sel in LIST_LINK_SELECTORS:
                try:
                    links = page.locator(sel)
                    if links.count() > 0:
                        print(f"      [OK] Found links with: {sel}")
                        break
                except:
                    continue

            if not links or links.count() == 0:
                print("      [WARN] No article links found")
                break

            link_count = links.count()
            print(f"      [FOUND] {link_count} articles")

            # Collect link info
            link_data = []
            seen_urls = set()

            for i in range(link_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    link_elem = links.nth(i)
                    href = safe_get_attr(link_elem, 'href')

                    if not href or 'newsId' not in href:
                        continue

                    full_url = urljoin(BASE_URL, href)

                    # Skip duplicates
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    # Extract title from span.text
                    title = ""
                    try:
                        title_span = link_elem.locator('span.text').first
                        if title_span.count() > 0:
                            title = safe_get_text(title_span)
                    except:
                        title = safe_get_text(link_elem)

                    if not title:
                        continue

                    # Extract source info (date + department)
                    list_date = None
                    list_dept = None
                    try:
                        source_span = link_elem.locator('span.source').first
                        if source_span.count() > 0:
                            source_text = safe_get_text(source_span)
                            list_date, list_dept = parse_source_info(source_text)
                    except:
                        pass

                    # Date filtering on list
                    if list_date:
                        if list_date < start_date:
                            stop = True
                            break
                        if list_date > end_date:
                            continue

                    link_data.append({
                        'title': title.strip(),
                        'url': full_url,
                        'list_date': list_date,
                        'list_dept': list_dept,
                    })

                except Exception as e:
                    continue

            # Pre-check duplicates
            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            new_link_data = [item for item in link_data if item['url'] not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

            # Process detail pages
            for item in new_link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']

                print(f"      [ARTICLE] {title[:40]}...")

                content, thumbnail_url, detail_date, department, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()

                # Error handling
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.5)
                    continue

                # Use detail page data, fallback to list page data
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                final_dept = department or item.get('list_dept') or REGION_NAME

                # Date filtering (with accurate date)
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date
                if date_only < start_date:
                    stop = True
                    break

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Auto-categorize
                cat_code, cat_name = detect_category(title, content)

                # Build article data
                published_at = f"{final_date}T09:00:00+09:00" if 'T' not in final_date else final_date

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': published_at,
                    'original_link': full_url,
                    'source': final_dept,  # Department as source
                    'category': cat_name or CATEGORY_NAME,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }

                # Send to server
                result = send_article_to_server(article_data)

                if result and result.get('status') == 'created':
                    error_collector.add_success()
                    collected_count += 1
                    print(f"         [OK] Saved (source: {final_dept})")
                    log_to_server(REGION_CODE, 'running', f"Saved: {title[:20]}...", 'success')
                elif result and result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")
                else:
                    error_collector.add_error("API_FAIL", title, full_url)
                    print(f"         [WARN] API save failed")

                time.sleep(1)  # Rate limiting

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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper v3.0')
    parser.add_argument('--days', type=int, default=3, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Max articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
    parser.add_argument('--start-date', type=str, default=None, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='End date (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

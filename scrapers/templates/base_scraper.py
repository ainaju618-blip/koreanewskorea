"""
Base Scraper Template for Korea NEWS National Edition
- Version: v1.0
- Created: 2026-01-02
- Based on: Mokpo City Scraper v3.0

This is the base template for all regional scrapers.
Copy this file and modify the constants for each region.
"""

# ============================================================
# 1. Standard Library
# ============================================================
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

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
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.text_cleaner import clean_article_content
from utils.category_detector import detect_category

# ============================================================
# 4. Constants - MODIFY THESE FOR EACH REGION
# ============================================================
REGION_CODE = 'template'          # 영문 코드 (예: seoul, busan, jeonju)
REGION_NAME = '템플릿'             # 한글 이름 (예: 서울시, 부산시)
CATEGORY_NAME = '전국'             # 카테고리 (전국, 수도권, 충청 등)
BASE_URL = 'https://www.example.go.kr'
LIST_URL = 'https://www.example.go.kr/news/press'

# List page selectors - MODIFY FOR EACH SITE
LIST_ITEM_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',
    'a.item_cont',
    '.list_item a',
    '.board_list a',
    'tr td a',
]

# Content page selectors - MODIFY FOR EACH SITE
CONTENT_SELECTORS = [
    'div.viewbox',
    'div.module_view_box',
    'div.board_view_cont',
    'div.view_content',
    'section[role="region"]',
    '.article_content',
]

# Image patterns specific to this site
IMAGE_PATTERNS = [
    'upload/',
    'file/',
    'attach/',
    'board/',
]


# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def extract_article_id(href: str) -> Optional[str]:
    """Extract article ID from href"""
    if not href:
        return None
    # Common patterns
    patterns = [
        r'idx=(\d+)',
        r'seq=(\d+)',
        r'no=(\d+)',
        r'/(\d+)(?:\?|$)',
    ]
    for pattern in patterns:
        match = re.search(pattern, href)
        if match:
            return match.group(1)
    return None


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    Extract content, images, and date from detail page

    Returns:
        (content text, thumbnail URL, date, error_reason)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), "PAGE_LOAD_FAIL"

    time.sleep(1)

    # 1. Extract date
    pub_date = datetime.now().strftime('%Y-%m-%d')
    try:
        page_text = page.locator('body').inner_text()

        # Date + Time pattern
        dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:5000])
        if dt_match:
            y, m, d, hh, mm = dt_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
            # Date only
            date_match = re.search(r'작성일[:\s]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
            if not date_match:
                date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text[:3000])

            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")

    # 2. Extract content
    content = ""

    # Strategy 1: JavaScript-based extraction
    try:
        js_code = """
        () => {
            const mainArea = document.querySelector('section[role="region"]') ||
                           document.querySelector('div.viewbox') ||
                           document.querySelector('div.module_view_box') ||
                           document.querySelector('div.view_content') ||
                           document.querySelector('.article_content');

            if (!mainArea) return '';

            const textBlocks = mainArea.querySelectorAll('div, p');
            let longestText = '';

            for (const block of textBlocks) {
                const text = block.innerText?.trim();
                if (text && text.length > longestText.length &&
                    text.length < 8000 &&
                    !text.includes('첨부파일') &&
                    !text.includes('사이트맵') &&
                    !text.includes('개인정보')) {
                    longestText = text;
                }
            }

            return longestText;
        }
        """
        content = page.evaluate(js_code)
        if content:
            content = content[:5000]
    except Exception as e:
        print(f"      [WARN] JS content extraction failed: {e}")

    # Strategy 2: Selector-based fallback
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = text[:5000]
                        break
            except:
                continue

    if content:
        content = clean_article_content(content)

    # 3. Extract image
    thumbnail_url = None

    # Strategy 1: Find images matching patterns
    for pattern in IMAGE_PATTERNS:
        imgs = page.locator(f'img[src*="{pattern}"]')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src:
                full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                else:
                    thumbnail_url = full_url
                break

    # Strategy 2: Find any image in content area
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            for i in range(min(imgs.count(), 3)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                    full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                    else:
                        thumbnail_url = full_url
                    break
            if thumbnail_url:
                break

    # Skip if no image
    if not thumbnail_url:
        return "", None, pub_date, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, None


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server
    """
    print(f"[{REGION_NAME}] Press release collection started (last {days} days)")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} scraper v1.0 started', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, 'running', f'Page {page_num} exploration', 'info')

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1.5)

            items = wait_and_find(page, LIST_ITEM_SELECTORS, timeout=10000)
            if not items:
                print("      [WARN] Article list not found.")
                break

            item_count = items.count()
            print(f"      [FOUND] {item_count} articles found")

            link_data = []
            seen_urls = set()

            for i in range(item_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    item = items.nth(i)

                    title_elem = item.locator('h3')
                    if title_elem.count() > 0:
                        title = safe_get_text(title_elem)
                    else:
                        title = safe_get_text(item)

                    title = title.strip() if title else ""
                    href = safe_get_attr(item, 'href')

                    if not title or not href:
                        continue

                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)

                    # Extract date from list
                    try:
                        date_text = item.inner_text()
                        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_text)
                        n_date = date_match.group(1) if date_match else None
                    except:
                        n_date = None

                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'list_date': n_date
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

            # Collect detail pages
            for item in new_link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']

                print(f"      [ARTICLE] {title[:35]}...")
                log_to_server(REGION_CODE, 'running', f"Collecting: {title[:20]}...", 'info')

                content, thumbnail_url, detail_date, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()

                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.3)
                    continue

                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date

                if date_only < start_date:
                    stop = True
                    break

                if not content:
                    content = f"Content not available.\nOriginal link: {full_url}"

                subtitle, content = extract_subtitle(content, title)
                cat_code, cat_name = detect_category(title, content)

                if 'T' in final_date and '+09:00' in final_date:
                     published_at = final_date
                else:
                     published_at = f"{final_date}T09:00:00+09:00"

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': published_at,
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': cat_name,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }

                result = send_article_to_server(article_data)

                if result.get('status') == 'created':
                    error_collector.add_success()
                    print(f"         [OK] Saved")
                    log_to_server(REGION_CODE, 'running', f"Saved: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")

                time.sleep(0.5)

            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded, stopping.")
                break

            time.sleep(1)

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)

    return []


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper v1.0')
    parser.add_argument('--days', type=int, default=3, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode')
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

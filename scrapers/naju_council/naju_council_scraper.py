"""
나주시의회 보도자료 Scraper
- Source: https://council.naju.go.kr/kr/bodoBBS.do
- Version: v1.0
- Created: 2026-01-06
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
# 4. Constants
# ============================================================
REGION_CODE = 'naju'
REGION_NAME = '나주시의회'
CATEGORY_NAME = '전남'
BASE_URL = 'https://council.naju.go.kr'
LIST_URL = 'https://council.naju.go.kr/kr/bodoBBS.do'

# List page selectors
LIST_ITEM_SELECTOR = 'table.board_list tbody tr'
TITLE_LINK_SELECTOR = 'td.con a[href*="bodoBBSview.do"]'

# Content page selectors
CONTENT_SELECTORS = [
    'div.bbs-view-contents',
    'td.comment',
    'div.board_view',
]

# Image selectors
IMAGE_SELECTORS = [
    '.bbs-images-container .bbs-image img',
    '.bbs-image-wrapper img',
    'td.comment img[src*="/attach/"]',
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

    time.sleep(1.5)

    # 1. Extract date from header
    pub_date = datetime.now().strftime('%Y-%m-%d')
    try:
        # Find date in table header
        date_elem = page.locator('th.sb_date + td span, th:has-text("작성일") + td span')
        if date_elem.count() > 0:
            date_text = safe_get_text(date_elem.first)
            pub_date = normalize_date(date_text)
        else:
            # Fallback: search in page text
            page_text = page.locator('body').inner_text()
            date_match = re.search(r'작성일[:\s]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")

    # 2. Extract image first (required)
    thumbnail_url = None

    for img_sel in IMAGE_SELECTORS:
        try:
            imgs = page.locator(img_sel)
            if imgs.count() > 0:
                src = safe_get_attr(imgs.first, 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner']):
                    full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                        break
                    else:
                        thumbnail_url = full_url
                        break
        except:
            continue

    # If no image found, skip this article
    if not thumbnail_url:
        return "", None, pub_date, ErrorCollector.IMAGE_MISSING

    # 3. Extract content
    content = ""

    # Strategy 1: JavaScript extraction
    try:
        js_code = """
        () => {
            // Find comment/content area
            const contentArea = document.querySelector('td.comment') ||
                              document.querySelector('.bbs-view-contents');

            if (!contentArea) return '';

            // Get text blocks
            const textBlocks = contentArea.querySelectorAll('div, p, span');
            let texts = [];

            for (const block of textBlocks) {
                const text = block.innerText?.trim();
                if (text && text.length > 30 &&
                    !text.includes('첨부파일') &&
                    !text.includes('내려받기') &&
                    !text.includes('다운로드')) {
                    texts.push(text);
                }
            }

            // Return longest text or combined
            if (texts.length === 0) {
                return contentArea.innerText?.trim() || '';
            }
            return texts.sort((a, b) => b.length - a.length)[0];
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
                        # Clean up attachment info
                        text = re.sub(r'첨부파일.*?(?=\n\n|\Z)', '', text, flags=re.DOTALL)
                        text = re.sub(r'원본내려받기.*', '', text)
                        content = text.strip()[:5000]
                        break
            except:
                continue

    if content:
        content = clean_article_content(content)

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

            # Find all rows in table
            rows = page.locator(LIST_ITEM_SELECTOR)
            row_count = rows.count()
            print(f"      [FOUND] {row_count} rows found")

            link_data = []
            seen_urls = set()

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    row = rows.nth(i)

                    # Get title and link
                    link_elem = row.locator(TITLE_LINK_SELECTOR)
                    if link_elem.count() == 0:
                        continue

                    title = safe_get_text(link_elem).strip()
                    href = safe_get_attr(link_elem, 'href')

                    if not title or not href:
                        continue

                    full_url = urljoin(BASE_URL, href) if not href.startswith('http') else href

                    # Get date from row (3rd td)
                    tds = row.locator('td')
                    n_date = None
                    if tds.count() >= 3:
                        date_text = safe_get_text(tds.nth(2))
                        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_text)
                        if date_match:
                            n_date = date_match.group(1)

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

                # Safe print for Windows console
                try:
                    print(f"      [ARTICLE] {title[:35]}...")
                except UnicodeEncodeError:
                    print(f"      [ARTICLE] {title[:35].encode('ascii', errors='replace').decode()}...")
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
                    content = f"나주시의회 보도자료입니다.\n원문 링크: {full_url}"

                subtitle, content = extract_subtitle(content, title)
                cat_code, cat_name = detect_category(title, content)

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
                    collected_count += 1
                    print(f"         [OK] Saved ({collected_count}/{max_articles})")
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
    parser.add_argument('--days', type=int, default=7, help='Collection period (days)')
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

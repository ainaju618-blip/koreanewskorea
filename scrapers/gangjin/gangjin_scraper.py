"""
Gangjin County Press Release Scraper
- Version: v1.0
- Last Updated: 2025-12-12
- Owner: AI Agent

Changes (v1.0):
- Initial version creation
- Static HTML page scraping
- Direct image access (hotlinking allowed)
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import (
    safe_goto, wait_and_find, safe_get_text, safe_get_attr, log_scraper_result,
    clean_article_content, extract_subtitle
)
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_detector import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'gangjin'
REGION_NAME = '강진군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.gangjin.go.kr'
LIST_URL = 'https://www.gangjin.go.kr/www/government/news/press'

# Selector definitions
LIST_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',  # Direct link selector
    'li a[href*="idx="]',
]

CONTENT_SELECTORS = [
    'div.text_viewbox',  # Gangjin main content area
    'div.viewbox',
    'div.contbox',
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
def fetch_detail(page: Page, url: str) -> Tuple[Optional[str], Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, image, date, and department from detail page.

    Returns:
        (content, thumbnail URL, date, department, error_reason)
        - error_reason is None on success, set when article should be skipped
    """
    if not safe_goto(page, url, timeout=20000):
        return None, None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"

    time.sleep(1)

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None

    # 1. Extract content
    for sel in CONTENT_SELECTORS:
        try:
            content_elem = page.locator(sel)
            if content_elem.count() > 0:
                text = safe_get_text(content_elem.first)
                if text and len(text) > 50:
                    content = text[:5000]
                    break
        except:
            continue

    # Content fallback: Try other selectors
    if not content or len(content) < 50:
        try:
            # Try content area after title
            body_elem = page.locator('div.bbs-view-body, div.view-body, article')
            if body_elem.count() > 0:
                text = safe_get_text(body_elem.first)
                if text and len(text) > 50:
                    content = text[:5000]
        except:
            pass

    # 2. Extract date and time
    try:
        page_text = page.locator('body').inner_text()
        
        # 2-1. YYYY-MM-DD HH:mm (Time priority)
        dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:5000])
        if dt_match:
            y, m, d, hh, mm = dt_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
             # 2-2. Date only fallback
            date_elem = page.locator('div.view_titlebox dd').first
            if date_elem.count() > 0:
                date_text = safe_get_text(date_elem)
                if date_text:
                    pub_date = normalize_date(date_text)
    except:
        pass

    # 3. Extract department - Gangjin: #page_info area
    try:
        # dd after "department" dt
        dept_elem = page.locator('#page_info dd').first
        if dept_elem.count() > 0:
            dept_text = safe_get_text(dept_elem)
            if dept_text:
                department = dept_text.strip()
    except:
        pass

    # 4. Extract images - Gangjin: div.image_viewbox img
    # Method A: Images in image_viewbox (most reliable)
    try:
        img_elem = page.locator('div.image_viewbox img, div.image_viewbox_inner img')
        if img_elem.count() > 0:
            src = safe_get_attr(img_elem.first, 'src')
            if src:
                # Convert relative path ./ybmodule.file/... to absolute path
                if src.startswith('./'):
                    src = src[2:]  # Remove ./
                img_url = urljoin(url, src)  # Based on current page URL
                uploaded_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                if uploaded_url:
                    thumbnail_url = uploaded_url
    except:
        pass

    # Method B: Other images in viewbox
    if not thumbnail_url:
        try:
            imgs = page.locator('div.viewbox img, div.contbox img')
            if imgs.count() > 0:
                for i in range(min(imgs.count(), 3)):
                    img = imgs.nth(i)
                    src = safe_get_attr(img, 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg']):
                        if src.startswith('./'):
                            src = src[2:]
                        img_url = urljoin(url, src)
                        uploaded_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                        if uploaded_url:
                            thumbnail_url = uploaded_url
                            break
        except:
            pass

    # Method C: Extract images from attachment download links
    if not thumbnail_url:
        try:
            # Find image files in attachment list
            file_items = page.locator('div.file_body li')
            for i in range(min(file_items.count(), 3)):
                item = file_items.nth(i)
                # Check image extension in filename
                name_elem = item.locator('span.name')
                if name_elem.count() > 0:
                    filename = safe_get_text(name_elem)
                    if filename and any(ext in filename.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                        # Extract URL from download button's onclick
                        btn = item.locator('button[onclick*="file_download"]')
                        if btn.count() > 0:
                            onclick = safe_get_attr(btn, 'onclick')
                            if onclick:
                                # window.open('/ybscript.io/common/file_download/...')
                                match = re.search(r"window\.open\('([^']+)'", onclick)
                                if match:
                                    download_url = urljoin(BASE_URL, match.group(1))
                                    uploaded_url = download_and_upload_image(download_url, BASE_URL, folder=REGION_CODE)
                                    if uploaded_url:
                                        thumbnail_url = uploaded_url
                                        break
        except:
            pass

    # Skip if no image
    if not thumbnail_url:
        print(f"      [SKIP] No image")
        return None, None, pub_date, None, ErrorCollector.IMAGE_MISSING

    # Clean content (remove metadata)
    content = clean_article_content(content)

    return content, thumbnail_url, pub_date, department, None  # success


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server.
    """
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

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

        while page_num <= 5 and not stop and collected_count < max_articles:
            # Gangjin pagination: ?page={N}
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [페이지 {page_num}] 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1)

            # Find list items
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                print("      [!] Cannot find article list.")
                break

            count = rows.count()
            print(f"      [{count} articles found]")

            # Collect link information (rows are direct link elements)
            link_data = []
            seen_urls = set()  # For duplicate URL check

            for i in range(count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    link_elem = rows.nth(i)

                    # Link text = title
                    title = safe_get_text(link_elem) or ""
                    # Remove line breaks and extract only title
                    title = title.split('\n')[0].strip()
                    if not title or len(title) < 5:
                        continue

                    href = safe_get_attr(link_elem, 'href')
                    if not href:
                        continue

                    full_url = urljoin(BASE_URL, href)

                    # Duplicate URL check - skip if already collected
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    # Extract date from detail page (date position unclear in list)
                    n_date = datetime.now().strftime('%Y-%m-%d')

                    link_data.append({'title': title, 'url': full_url, 'date': n_date})
                except Exception as e:
                    continue

            # Collect detail pages and send
            for item in link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']
                n_date = item['date']

                print(f"      > {title[:30]}... ({n_date})")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                content, thumbnail_url, pub_date, department, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()

                # Skip articles with errors
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    safe_goto(page, list_url)
                    time.sleep(0.3)
                    continue

                # Use extracted date from detail page if available
                if pub_date and pub_date != datetime.now().strftime('%Y-%m-%d'):
                    n_date = pub_date

                # 날짜만 추출해서 비교
                date_only = n_date.split('T')[0] if 'T' in n_date else n_date

                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Auto-classify category
                cat_code, cat_name = detect_category(title, content)

                # published_at 처리 (시간 포함 여부 확인)
                if 'T' in n_date and '+09:00' in n_date:
                     published_at = n_date
                else:
                     published_at = f"{n_date}T09:00:00+09:00"

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

                # Send to server
                result = send_article_to_server(article_data)
                collected_count += 1

                if result.get('status') == 'created':
                    error_collector.add_success()
                    print(f"         [OK] Save completed")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")

                # Return to list page
                safe_goto(page, list_url)
                time.sleep(0.5)

            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded, terminating.")
                break

            time.sleep(1)

        browser.close()

    # 에러 요약 보고 출력
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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper')
    parser.add_argument('--days', type=int, default=3, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum number of articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
    # bot-service.ts compatible arguments (required)
    parser.add_argument('--start-date', type=str, default=None, help='Collection start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='Collection end date (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

"""
Hwasun County Hwasun Focus Scraper
- Version: v1.1
- Last Modified: 2025-12-14
- Responsible: AI Agent

Changes (v1.1):
- Enhanced removal pattern for view count/date meta information (Claude work directive)

Changes (v1.0):
- Initial creation based on detailed analysis data provided by user
- URL pattern: /gallery.do?S=S01&M=020101000000&b_code=0000000001&act=view&list_no={ID}
- Images: /upfiles/gallery/0000000001/L_0000000001_{timestamp}_{index}.jpg
- Photo gallery board (ul > li card structure)
- Static HTML, hotlinking allowed
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
from urllib.parse import urljoin, parse_qs, urlparse

# ============================================================
# 2. External Libraries
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. Local Modules
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_classifier import detect_category

# ============================================================
# 4. Constants Definition
# ============================================================
REGION_CODE = 'hwasun'
REGION_NAME = '화순군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.hwasun.go.kr'

# List page URL (Hwasun Focus)
B_CODE = '0000000001'
LIST_PATH = f'/gallery.do?S=S01&M=020101000000&b_code={B_CODE}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Detail page URL pattern: /gallery.do?S=S01&M=020101000000&b_code=0000000001&act=view&list_no={ID}

# List page selectors (photo gallery ul > li structure)
LIST_ITEM_SELECTORS = [
    'li a[href*="list_no="][href*="act=view"]',  # Article links
    'a[href*="gallery.do"][href*="list_no="]',
]

# Detail page/content selectors (priority order)
CONTENT_SELECTORS = [
    '.view_content',       # Content area
    '.gallery_view',
    '.board_view_content',
    '.con-wrap',
    '.view-con',
    'article',
]

# Date pattern: YYYY-MM-DD
DATE_PATTERNS = [
    r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})',
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


def extract_list_no(href: str) -> Optional[str]:
    """Extract list_no (article ID) from href"""
    if not href:
        return None

    # Extract from URL parameters
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'list_no' in params:
            return params['list_no'][0]
    except:
        pass

    # Extract via regex
    match = re.search(r'list_no[=]?(\d+)', href)
    if match:
        return match.group(1)

    return None


def build_detail_url(list_no: str) -> str:
    """Build detail page URL from article ID (list_no)"""
    return f'{BASE_URL}/gallery.do?S=S01&M=020101000000&b_code={B_CODE}&act=view&list_no={list_no}'


def build_list_url(page: int = 1) -> str:
    """Build list page URL based on page (nPage parameter)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&nPage={page}'


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, images, date, and department from detail page

    Returns:
        (content text, thumbnail URL, date, department, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"

    time.sleep(1)  # Page stabilization

    # 1. Extract date (format: Registration Date : YYYY-MM-DD)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        
        # 1. Try to find date with time (YYYY-MM-DD HH:mm)
        # Pattern: "Registration Date : 2025-12-21 15:30"
        dt_match = re.search(r'(작성일|등록일)\s*[:\s]+(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text)
        if dt_match:
            y, m, d, hh, mm = dt_match.groups()[1:]
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
            # 2. Fallback: Date only
            date_match = re.search(r'(작성일|등록일)\s*[:\s]+(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
            if date_match:
                y, m, d = date_match.groups()[1:]
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
            else:
                # 3. Last resort: Any date pattern
                date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text[:3000])
                if date_match:
                    y, m, d = date_match.groups()
                    pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")

    # 2. Extract department (format: "Department : Department Name Team Name / Phone")
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "Department : Tourism Sports Office Tourism Development Team" pattern
        dept_match = re.search(r'담당부서\s*[:\s]+([^\n/]+)', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
    except Exception as e:
        print(f"      [WARN] Department extraction failed: {e}")

    # 3. Extract content
    content = ""
    
    try:
        # Extract content using JavaScript
        js_code = """
        () => {
            // Hwasun County specific: Find content area

            // Method 1: Common content containers
            const contentSelectors = [
                '.view_content', '.gallery_view', '.board_view_content',
                '.con-wrap', '.view-con', 'article'
            ];

            for (const sel of contentSelectors) {
                const elem = document.querySelector(sel);
                if (elem) {
                    const text = elem.innerText?.trim();
                    if (text && text.length > 50) {
                        return text;
                    }
                }
            }

            // Method 2: Search for div[class*="view"]
            const viewDivs = document.querySelectorAll('div[class*="view"], div[class*="content"]');
            for (const div of viewDivs) {
                const text = div.innerText?.trim();
                if (text && text.length > 200 && text.length < 10000) {
                    return text;
                }
            }

            return '';
        }
        """
        content = page.evaluate(js_code)
        if content:
            # Clean content with clean_article_content function
            content = clean_article_content(content)
    except Exception as e:
        print(f"      [WARN] JS content extraction failed: {e}")

    # Fallback: General selectors
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = clean_article_content(text)
                        break
            except:
                continue

    # 4. Extract images (hotlinking allowed)
    thumbnail_url = None

    # Strategy 1: Find images in /upfiles/gallery/ path
    try:
        imgs = page.locator('img[src*="/upfiles/gallery/"]')
        for i in range(min(imgs.count(), 5)):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet']):
                download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVED] Gallery image: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] Gallery image extraction failed: {e}")

    # Strategy 2: Extract from img tags in content
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"]')
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet', 'blank']):
                    download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                    if saved_path:
                        thumbnail_url = saved_path
                        break
        except Exception as e:
            print(f"      [WARN] Content image extraction failed: {e}")
    
    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING
    
    return content, thumbnail_url, pub_date, department, None  # success


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(max_articles: int = 30, days: Optional[int] = None, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
    """
    Collect press releases and send to server (count-based)

    Args:
        max_articles: Maximum number of articles to collect (default 10)
        days: Optional date filter (disabled if None)
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
        dry_run: Test mode (no server transmission)
    """
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    if start_date:
        print(f"[{REGION_NAME}] Hwasun Focus collection started (max {max_articles}, {start_date} ~ {end_date})")
    else:
        print(f"[{REGION_NAME}] Hwasun Focus collection started (max {max_articles}, no date filter)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    if dry_run:
        print("   [DRY-RUN] Test mode - no server transmission")

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)
    collected_articles = []  # For dry-run return
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        context.set_extra_http_headers({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        })
        
        page = context.new_page()

        page_num = 1
        max_pages = 10  # Search up to 10 pages maximum
        collected_count = 0  # Initialize collected_count
        
        while page_num <= max_pages and collected_count < max_articles:
            list_url = build_list_url(page_num)
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page loading

            # Find article links in list (photo gallery type)
            article_links = page.locator('li a[href*="list_no="][href*="act=view"]')
            article_count = article_links.count()

            if article_count == 0:
                # Fallback: Try other selectors
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break

            if article_count == 0:
                print("      [WARN] Article list not found.")
                break

            print(f"      [FOUND] {article_count} article links found")

            # Collect link information
            link_data = []
            seen_ids = set()  # For checking duplicate list_no
            
            for i in range(article_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                
                try:
                    link = article_links.nth(i)

                    # Extract title and URL
                    title = safe_get_text(link)
                    if title:
                        title = title.strip()
                    href = safe_get_attr(link, 'href')

                    if not title or not href:
                        continue

                    # Extract list_no
                    list_no = extract_list_no(href)
                    if not list_no:
                        continue

                    # Check for duplicate list_no
                    if list_no in seen_ids:
                        continue
                    seen_ids.add(list_no)

                    # Build detail page URL
                    full_url = build_detail_url(list_no)

                    # Try to extract date from list (YYYY-MM-DD format)
                    list_date = None
                    try:
                        # Find date in parent li element
                        parent = link.locator('xpath=ancestor::li[1]')
                        if parent.count() > 0:
                            parent_text = safe_get_text(parent)
                            if parent_text:
                                date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', parent_text)
                                if date_match:
                                    y, m, d = date_match.groups()
                                    list_date = f"{y}-{int(m):02d}-{int(d):02d}"
                    except:
                        pass

                    # Date filter (list stage)
                    if start_date and list_date and list_date < start_date:
                        print(f"      [SKIP] List date filter: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'list_no': list_no,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # Stop search if no valid articles on this page
            if len(link_data) == 0:
                print("      [STOP] No valid articles on this page, stopping")
                break

            # Pre-check duplicates before visiting detail pages (optimization)
            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            # Filter out already existing articles
            new_link_data = [item for item in link_data if item['url'] not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

            # Collect and send detail pages
            consecutive_old = 0  # Consecutive old articles counter
            stop_scraping = False

            for item in new_link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                
                title = item['title'].replace('\xa0', ' ')  # Replace NBSP to avoid encoding errors
                full_url = item['url']

                print(f"      [ARTICLE] {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date, department, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.3)
                    continue

                # Determine date (detail > list > current)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')

                # 날짜 비교를 위해 시간 제거 (YYYY-MM-DD)
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date
                
                # Date filter (Check detail page date)
                if start_date and date_only < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] Detail date filter: {date_only} < {start_date} ({consecutive_old} consecutive)")

                    if consecutive_old >= 3:
                        print("         [STOP] 3 consecutive old articles found, stopping")
                        stop_scraping = True
                        break
                    continue

                # Reset counter when valid article found
                consecutive_old = 0

                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Auto-classify category
                cat_code, cat_name = detect_category(title, content)

                # published_at 처리 (시간 포함 여부 확인)
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
                
                if dry_run:
                    # Test mode: No server transmission
                    collected_count += 1
                    success_count += 1
                    img_status = "[+IMG]" if thumbnail_url else "[-IMG]"
                    content_status = f"[+TXT:{len(content)}]" if content and len(content) > 50 else "[-TXT]"
                    print(f"         [DRY-RUN] {img_status}, {content_status}")
                    collected_articles.append(article_data)
                else:
                    result = send_article_to_server(article_data)

                    if result.get('status') == 'created':
                        error_collector.add_success()
                        print(f"         [OK] Saved")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         [SKIP] Already exists")
                    else:
                        print(f"         [WARN] Transmission failed: {result}")

                time.sleep(1)  # Rate limiting

            # Break loop on early termination
            if stop_scraping:
                break
            
            page_num += 1
            time.sleep(1)
        
        browser.close()
    
    # 에러 요약 보고 출력
    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)
    
    return collected_articles


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Hwasun Focus Scraper v1.0')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum articles to collect (default 10)')
    parser.add_argument('--days', type=int, default=None, help='Optional date filter (days). No date filter if not specified')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
    # bot-service.ts compatible arguments (required!)
    parser.add_argument('--start-date', type=str, default=None, help='Collection start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='Collection end date (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        max_articles=args.max_articles,
        days=args.days,
        start_date=args.start_date,
        end_date=args.end_date,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()

"""
Jangheung County Press Release Scraper
- Version: v1.0
- Last Updated: 2025-12-13
- Owner: AI Agent

Changes (v1.0):
- Initial version based on user-provided detailed analysis data
- URL Pattern: /www/organization/news/jh_news?idx={ID}&mode=view
- Images: /www/organization/news/ybmodule.file/board_gov/www_jh_news/{fileID}.jpg
- Card-style layout (thumbnail + title + summary)
- Static HTML, UTF-8 encoding
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_detector import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'jangheung'
REGION_NAME = '장흥군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jangheung.go.kr'

# List page URL (Press releases)
LIST_PATH = '/www/organization/news/jh_news'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Image path
IMAGE_BASE_URL = f'{BASE_URL}/www/organization/news/ybmodule.file/board_gov/www_jh_news/'

# Detail page URL pattern: /www/organization/news/jh_news?idx={ID}&mode=view

# List page selectors (card layout)
LIST_ITEM_SELECTORS = [
    'a[href*="jh_news?idx="][href*="mode=view"]',  # Article link
    'a[href*="idx="][href*="mode=view"]',
]

# Detail page/content selectors (priority order)
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
    '.con_detail',
    '.content',
]

# Date patterns: YYYY.MM.DD HH:MM or YYYY-MM-DD
DATE_PATTERNS = [
    r'(\d{4})[./](\d{1,2})[./](\d{1,2})',
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


def extract_idx(href: str) -> Optional[str]:
    """Extract idx (article ID) from href"""
    if not href:
        return None

    # Extract from URL parameters
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'idx' in params:
            return params['idx'][0]
    except:
        pass

    # Extract using regex
    match = re.search(r'idx[=]?(\d+)', href)
    if match:
        return match.group(1)

    return None


def build_detail_url(idx: str) -> str:
    """Build detail page URL from article ID (idx)"""
    return f'{BASE_URL}{LIST_PATH}?idx={idx}&mode=view'


def build_list_url(page: int = 1) -> str:
    """Build list page URL based on page number (page parameter)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}?page={page}'


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, image, date, and department from detail page

    Returns:
        (content text, thumbnail URL, date, department, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"
    
    time.sleep(1.5)  # Page stabilization

    # 1. Extract date (format: YYYY.MM.DD HH:MM)
    pub_date = datetime.now().strftime('%Y-%m-%d')

    try:
        page_text = page.locator('body').inner_text()
        # Find "registration date" pattern
        date_match = re.search(r'(작성일|등록일)[^\d]*(\d{4})[./](\d{1,2})[./](\d{1,2})', page_text)
        if date_match:
            y, m, d = date_match.groups()[1:]  # Skip label, get y, m, d
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        else:
            # General date pattern
            date_match = re.search(r'(\d{4})[./](\d{1,2})[./](\d{1,2})', page_text[:3000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")

    # 2. Extract department (default: General Affairs Div. Information & Communications Team)
    department = "총무과 정보통신팀"
    try:
        page_text = page.locator('body').inner_text()
        # "Department" pattern
        dept_match = re.search(r'담당부서[^\w]*([가-힣]+(?:과|실|팀)[^가-힣]*[가-힣]+(?:팀)?)', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
    except Exception as e:
        pass

    # 3. Extract content
    content = ""

    try:
        # Extract content using JavaScript
        js_code = """
        () => {
            // Jangheung-specific: Find main content area

            // Method 1: Common content selectors
            const contentSelectors = [
                '.view_content', '.board_view_content', '.view_body',
                '.con_detail', '.content'
            ];

            for (const sel of contentSelectors) {
                const elem = document.querySelector(sel);
                if (elem) {
                    const text = elem.innerText?.trim();
                    if (text && text.length > 100) {
                        return text;
                    }
                }
            }

            // Method 2: Search div[class*="view"], div[class*="content"]
            const viewDivs = document.querySelectorAll('div[class*="view"], div[class*="content"]');
            for (const div of viewDivs) {
                const text = div.innerText?.trim();
                if (text && text.length > 200 && text.length < 10000) {
                    return text;
                }
            }

            // Method 3: Find div with longest text
            const divs = document.querySelectorAll('div');
            let maxText = '';

            for (const div of divs) {
                const text = div.innerText?.trim();
                if (text && text.length > maxText.length &&
                    !text.includes('로그인') && !text.includes('회원가입') &&
                    text.length < 10000) {
                    maxText = text;
                }
            }

            if (maxText.length > 100) {
                return maxText;
            }

            return '';
        }
        """
        content = page.evaluate(js_code)
        if content:
            # Apply clean_article_content
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
    
    # 4. Extract images
    thumbnail_url = None

    # Strategy 1: Extract images from ybmodule.file path (Jangheung-specific)
    try:
        imgs = page.locator('img[src*="ybmodule.file"], img[src*="board_gov"]')
        for i in range(min(imgs.count(), 5)):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner']):
                download_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVED] Content image saved: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] Content image extraction failed: {e}")

    # Strategy 2: General image tags
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"], img[src*=".JPG"]')
            for i in range(min(imgs.count(), 10)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet', 'blank', 'common']):
                    download_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                    saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                    if saved_path:
                        thumbnail_url = saved_path
                        break
        except Exception as e:
            print(f"      [WARN] General image extraction failed: {e}")
    
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
        days: Optional date filter (None = disabled)
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
        dry_run: Test mode (no server transmission)
    """
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    if start_date:
        print(f"[{REGION_NAME}] 보도자료 수집 시작 (최대 {max_articles}개, {start_date} ~ {end_date})")
    else:
        print(f"[{REGION_NAME}] 보도자료 수집 시작 (최대 {max_articles}개, 날짜 필터 없음)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []
    
    if dry_run:
        print("   [TEST] DRY-RUN 모드: 서버 전송 안함")
    
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
        max_pages = 10  # Explore up to 10 pages maximum
        
        while page_num <= max_pages and collected_count < max_articles:
            list_url = build_list_url(page_num)
            print(f"   [PAGE] 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page loading

            # Find article links from list (card layout)
            article_links = page.locator('a[href*="jh_news?idx="][href*="mode=view"]')
            article_count = article_links.count()

            if article_count == 0:
                # Fallback: Try other selectors
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break

            if article_count == 0:
                print("      [WARN] Cannot find article list.")
                break

            print(f"      [FOUND] {article_count} article links found")

            # Collect link information
            link_data = []
            seen_ids = set()  # For duplicate idx check
            
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

                    # Extract idx
                    idx = extract_idx(href)
                    if not idx:
                        continue

                    # Check duplicate idx
                    if idx in seen_ids:
                        continue
                    seen_ids.add(idx)

                    # Build detail page URL
                    full_url = build_detail_url(idx)

                    # Try to extract date from list (YYYY-MM-DD format)
                    list_date = None
                    try:
                        # Find date in parent element
                        parent = link.locator('xpath=ancestor::*[2]')
                        if parent.count() > 0:
                            parent_text = safe_get_text(parent)
                            if parent_text:
                                date_match = re.search(r'(\d{4})[-.](\d{1,2})[-.](\d{1,2})', parent_text)
                                if date_match:
                                    y, m, d = date_match.groups()
                                    list_date = f"{y}-{int(m):02d}-{int(d):02d}"
                    except:
                        pass

                    # Date filter (list stage)
                    if start_date and list_date and list_date < start_date:
                        print(f"      [SKIP] Date filter from list: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'idx': idx,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue

            # Stop exploration if no valid articles on this page
            if len(link_data) == 0:
                print("      [STOP] No valid articles on this page, stopping exploration")
                break

            # Collect detail pages and send
            consecutive_old = 0  # Counter for consecutive old articles
            stop_scraping = False
            
            for item in link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                
                title = item['title']
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

                # Date filter + early termination logic
                if start_date and final_date < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] Skipped by date filter: {final_date} (consecutive {consecutive_old})")

                    if consecutive_old >= 3:
                        print("         [STOP] 3 consecutive old articles found, stopping page exploration")
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

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': f"{final_date}T09:00:00+09:00",
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
                        print(f"         [OK] Save completed")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         [SKIP] Already exists")
                    else:
                        print(f"         [WARN] Transmission failed: {result}")

                time.sleep(1)  # Rate limiting

            # Exit loop on early termination
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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper v1.0')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum number of articles to collect (default 10)')
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

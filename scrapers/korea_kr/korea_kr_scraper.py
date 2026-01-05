"""
Korea.kr Policy Briefing Scraper (정책브리핑 스크래퍼)
- Version: v3.0 (Enterprise Stealth Enhanced)
- Created: 2026-01-02
- Updated: 2026-01-05
- Source: https://www.korea.kr

Features:
- POMDP-based intelligent delays (human behavior simulation)
- Block detection and auto-recovery
- Retry with exponential backoff
- Enhanced fingerprint spoofing
- HTTP/2 support

Only collects articles with KOGL Type 1 (공공누리 제1유형 - 출처표시)
Text content is freely usable with source attribution.

Project: koreanewskorea (ainaju618@gmail.com Supabase)
"""

# ============================================================
# 1. Standard Library
# ============================================================
import sys
import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional

# ============================================================
# 2. Path Setup
# ============================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPERS_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRAPERS_DIR)

# ============================================================
# 3. External Libraries
# ============================================================
from playwright.sync_api import sync_playwright, Page, BrowserContext
from playwright_stealth import Stealth

# ============================================================
# 4. Local Modules
# ============================================================
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.error_collector import ErrorCollector
from utils.text_cleaner import clean_article_content
from utils.category_detector import detect_category
from utils.image_matcher import get_image_url

# Enterprise Stealth Module
from utils.enterprise_stealth import (
    StealthConfig,
    PODMPDelayGenerator,
    BlockDetector,
    BlockType,
    FingerprintManager,
    retry_with_backoff,
    smart_delay,
)

# ============================================================
# 5. Constants
# ============================================================
REGION_CODE = 'national'
REGION_NAME = '정책브리핑'
SOURCE_NAME = '정책브리핑'
BASE_URL = 'https://www.korea.kr'
LIST_URL = 'https://www.korea.kr/news/policyNewsList.do'

# Category codes for korea.kr
CATEGORIES = {
    '경제': 'EDS01',
    '사회': 'EDS02',
    '문화': 'EDS03',
    '외교안보': 'EDS04'
}

# KOGL (공공누리) type information
KOGL_TYPES = {
    '01': {'type': 1, 'name': '출처표시', 'free_use': True},
    '02': {'type': 2, 'name': '출처표시+상업적이용금지', 'free_use': False},
    '03': {'type': 3, 'name': '출처표시+변경금지', 'free_use': False},
    '04': {'type': 4, 'name': '출처표시+상업적이용금지+변경금지', 'free_use': False}
}

# Source attribution (required for KOGL Type 1)
SOURCE_ATTRIBUTION = '<자료출처=정책브리핑 www.korea.kr>'


# ============================================================
# 6. Stealth Configuration
# ============================================================
def get_stealth_config() -> StealthConfig:
    """Get stealth configuration optimized for korea.kr"""
    return StealthConfig(
        headless=True,
        use_persistent_context=True,
        context_dir=os.path.join(SCRAPERS_DIR, 'browser_contexts'),
        min_delay=1.5,
        max_delay=4.0,
        poisson_lambda=2.0,
        max_retries=3,
        base_backoff=2.0,
        max_backoff=60.0,
        jitter_factor=0.3,
        use_http2=True,
        rotate_fingerprint=True,
        fingerprint_interval=15
    )


# ============================================================
# 7. Utility Functions
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


def extract_news_id(href: str) -> Optional[str]:
    """Extract news ID from href"""
    if not href:
        return None
    match = re.search(r'newsId=(\d+)', href)
    return match.group(1) if match else None


@retry_with_backoff(max_retries=3, base_backoff=2.0, max_backoff=30.0)
def safe_goto(page: Page, url: str, timeout: int = 30000) -> bool:
    """Safe page navigation with retry"""
    try:
        page.goto(url, wait_until='networkidle', timeout=timeout)
        return True
    except Exception as e:
        print(f"      [ERROR] Page load failed: {e}")
        raise


def safe_get_text(locator) -> str:
    """Safe text extraction"""
    try:
        return locator.inner_text().strip()
    except:
        return ""


# ============================================================
# 8. KOGL Detection Function
# ============================================================
def extract_kogl_info(page: Page) -> Dict:
    """Extract KOGL type from page"""
    try:
        # Method 1: Find by image src pattern
        kogl_img = page.query_selector('img[src*="open_type"]')
        if kogl_img:
            src = kogl_img.get_attribute('src')
            type_match = re.search(r'open_type(\d+)', src)
            if type_match:
                type_code = type_match.group(1)
                return KOGL_TYPES.get(type_code, {
                    'type': None, 'name': '알 수 없음', 'free_use': False
                })

        # Method 2: Find by alt text containing "공공누리"
        kogl_selectors = [
            'img[alt*="공공누리"]',
            'img[alt*="OPEN"]',
            'a[href*="kogl"] img',
            '.kogl_wrap img',
            '[class*="kogl"] img'
        ]

        for sel in kogl_selectors:
            kogl_img = page.query_selector(sel)
            if kogl_img:
                alt = kogl_img.get_attribute('alt') or ''
                if re.search(r'제\s*1\s*유형|1유형|type\s*1', alt, re.IGNORECASE):
                    return KOGL_TYPES['01']
                elif re.search(r'제\s*2\s*유형|2유형|type\s*2', alt, re.IGNORECASE):
                    return KOGL_TYPES['02']
                elif re.search(r'제\s*3\s*유형|3유형|type\s*3', alt, re.IGNORECASE):
                    return KOGL_TYPES['03']
                elif re.search(r'제\s*4\s*유형|4유형|type\s*4', alt, re.IGNORECASE):
                    return KOGL_TYPES['04']
                if '공공누리' in alt and '출처표시' in alt:
                    if '상업적' not in alt and '변경금지' not in alt:
                        return KOGL_TYPES['01']

        # Method 3: Search in page text
        page_text = page.inner_text('body')
        if '공공누리' in page_text:
            if re.search(r'제\s*1\s*유형', page_text):
                return KOGL_TYPES['01']
            elif re.search(r'제\s*2\s*유형', page_text):
                return KOGL_TYPES['02']
            elif re.search(r'제\s*3\s*유형', page_text):
                return KOGL_TYPES['03']
            elif re.search(r'제\s*4\s*유형', page_text):
                return KOGL_TYPES['04']

        return {'type': None, 'name': '정보 없음', 'free_use': False}
    except Exception as e:
        print(f"      [WARN] KOGL extraction failed: {e}")
        return {'type': None, 'name': '추출 실패', 'free_use': False}


# ============================================================
# 9. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, news_id: str, delay_gen: PODMPDelayGenerator) -> Tuple[str, str, str, Dict, Optional[str]]:
    """
    Extract content, title, date, and KOGL info from detail page

    Returns:
        (title, content, date, kogl_info, error_reason)
    """
    url = f"{BASE_URL}/news/policyNewsView.do?newsId={news_id}"

    try:
        if not safe_goto(page, url, timeout=30000):
            return "", "", datetime.now().strftime('%Y-%m-%d'), {}, "PAGE_LOAD_FAIL"
    except Exception as e:
        return "", "", datetime.now().strftime('%Y-%m-%d'), {}, f"PAGE_LOAD_ERROR: {e}"

    # POMDP delay after page load
    smart_delay(1.0, 2.5, 2.0)

    # Wait for main content area
    try:
        page.wait_for_selector('main', timeout=10000)
    except:
        print(f"      [WARN] Main content not found")

    # 1. Check KOGL type first
    kogl_info = extract_kogl_info(page)

    # Skip if not Type 1
    if kogl_info.get('type') != 1:
        return "", "", "", kogl_info, f"KOGL_TYPE_{kogl_info.get('type', 'UNKNOWN')}"

    # 2. Extract title
    title = ''
    title_selectors = ['h1', 'h2.tit', 'h1.tit', '.view_tit h1', '.view_tit h2']
    for sel in title_selectors:
        title_el = page.query_selector(sel)
        if title_el:
            title = title_el.inner_text().strip()
            if title and len(title) > 5:
                break

    if not title:
        return "", "", "", kogl_info, "NO_TITLE"

    # 3. Extract date
    pub_date = datetime.now().strftime('%Y-%m-%d')
    date_selectors = ['.day', '.date', '.view_info', '[class*="date"]', '[class*="day"]']

    for sel in date_selectors:
        date_el = page.query_selector(sel)
        if date_el:
            date_text = date_el.inner_text().strip()
            date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_text)
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
                break

    # Fallback: search in page text
    if pub_date == datetime.now().strftime('%Y-%m-%d'):
        page_text = page.inner_text('body')
        date_match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', page_text[:1000])
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"

    # 4. Extract content
    content_parts = []
    content_selectors = [
        'article p', '.view_cont p', '.txt p', '.detail_body p',
        'main p', '.news_view p', '[class*="content"] p', '[class*="view"] > div p'
    ]

    for sel in content_selectors:
        body_elements = page.query_selector_all(sel)
        if body_elements and len(body_elements) > 0:
            for el in body_elements:
                try:
                    text = el.inner_text().strip()
                    if text and len(text) > 30 and text not in content_parts:
                        if not re.match(r'^[\(\[\<].{0,100}[\)\]\>]$', text):
                            content_parts.append(text)
                except:
                    continue
            if len(content_parts) >= 3:
                break

    content = '\n\n'.join(content_parts)

    if content:
        content = clean_article_content(content)

    if not content or len(content) < 50:
        return title, "", pub_date, kogl_info, ErrorCollector.CONTENT_SHORT

    return title, content, pub_date, kogl_info, None


# ============================================================
# 10. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None, headless: bool = True) -> List[Dict]:
    """
    Collect policy briefing articles and send to server
    Only collects KOGL Type 1 articles (freely usable)

    Uses Enterprise Stealth features:
    - POMDP-based delays
    - Block detection
    - Retry with exponential backoff
    - Fingerprint rotation
    """
    print(f"\n{'='*60}")
    print(f"[{REGION_NAME}] Press Release Scraper v3.0 (Enterprise Stealth)")
    print(f"{'='*60}")
    print(f"   [INFO] Only collecting KOGL Type 1 (freely usable) articles")
    print(f"   [INFO] POMDP delays enabled (human-like behavior)")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} scraper v3.0 started (Enterprise Stealth)', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"   [DATE] {start_date} ~ {end_date}")

    # Initialize stealth components
    config = get_stealth_config()
    config.headless = headless
    delay_gen = PODMPDelayGenerator(config)
    block_detector = BlockDetector()
    fingerprint_manager = FingerprintManager(config.fingerprint_interval)
    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        # Get fingerprint
        fp = fingerprint_manager.get_fingerprint()

        # Launch with stealth args
        browser = p.chromium.launch(
            headless=config.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-extensions',
                f'--window-size={fp["screen"]["width"]},{fp["screen"]["height"]}',
            ]
        )

        # Create context with fingerprint
        context = browser.new_context(
            user_agent=fp['userAgent'],
            viewport=fp['screen'],
            locale='ko-KR',
            timezone_id='Asia/Seoul',
            color_scheme='light',
        )

        page = context.new_page()

        # Apply stealth
        Stealth().apply_stealth_sync(page)

        # Inject enterprise stealth JS
        page.add_init_script(fingerprint_manager.get_stealth_js())

        print(f"   [STEALTH] Fingerprint applied: {fp['platform']}")
        print(f"   [STEALTH] User-Agent: {fp['userAgent'][:50]}...")

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 10 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}?pageIndex={page_num}'
            print(f"\n   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, 'running', f'Page {page_num} exploration', 'info')

            # Pre-navigation POMDP delay
            delay = delay_gen.get_page_delay()
            print(f"      [DELAY] {delay:.2f}s (state: {delay_gen.current_state})")

            try:
                if not safe_goto(page, list_url):
                    page_num += 1
                    continue
            except Exception as e:
                print(f"      [ERROR] Page navigation failed: {e}")
                page_num += 1
                continue

            # Check for blocking
            content = page.content()
            block_type = block_detector.detect(content, 200)

            if block_type != BlockType.NONE:
                strategy = block_detector.get_recovery_strategy(block_type)
                print(f"      [BLOCK] Detected: {block_type.value}")
                print(f"      [BLOCK] Action: {strategy['action']}, delay: {strategy['delay']}s")

                if strategy['action'] == 'wait_and_retry':
                    smart_delay(strategy['delay'], strategy['delay'] * 1.5, 1.0)
                    if strategy.get('rotate_ua'):
                        fingerprint_manager.current_fingerprint = fingerprint_manager._generate_fingerprint()
                    continue
                elif strategy['action'] in ['abort', 'manual_intervention']:
                    print(f"      [BLOCK] Cannot continue: {strategy.get('note', block_type.value)}")
                    break

            # Post-navigation delay
            smart_delay(1.0, 2.0, 2.0)

            # Find article links
            news_links = page.query_selector_all('a[href*="policyNewsView.do?newsId="]')
            if not news_links:
                print("      [WARN] Article list not found.")
                break

            # Extract news IDs
            link_data = []
            seen_ids = set()

            for link in news_links:
                href = link.get_attribute('href')
                news_id = extract_news_id(href)

                if not news_id or news_id in seen_ids:
                    continue

                seen_ids.add(news_id)
                full_url = f"{BASE_URL}/news/policyNewsView.do?newsId={news_id}"

                # Try to get date from list
                try:
                    parent = link.evaluate_handle('el => el.closest("li") || el.closest("tr")')
                    if parent:
                        parent_text = parent.inner_text()
                        date_match = re.search(r'(\d{4})[-./ ](\d{1,2})[-./ ](\d{1,2})', parent_text)
                        n_date = f"{date_match.group(1)}-{int(date_match.group(2)):02d}-{int(date_match.group(3)):02d}" if date_match else None
                    else:
                        n_date = None
                except:
                    n_date = None

                link_data.append({
                    'news_id': news_id,
                    'url': full_url,
                    'list_date': n_date
                })

            print(f"      [FOUND] {len(link_data)} articles found")

            if not link_data:
                page_num += 1
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

                news_id = item['news_id']
                full_url = item['url']

                print(f"      [ARTICLE] ID {news_id}...")
                log_to_server(REGION_CODE, 'running', f"Collecting: {news_id}", 'info')

                # POMDP delay before article fetch
                article_delay = delay_gen.get_delay()
                print(f"         [DELAY] {article_delay:.2f}s")

                title, content, detail_date, kogl_info, error_reason = fetch_detail(page, news_id, delay_gen)
                error_collector.increment_processed()

                if error_reason:
                    if error_reason.startswith('KOGL_TYPE'):
                        print(f"         [SKIP] {kogl_info.get('name', 'Unknown KOGL type')}")
                    else:
                        error_collector.add_error(error_reason, news_id, full_url)
                        print(f"         [SKIP] {error_reason}")
                    smart_delay(0.3, 0.8, 1.0)
                    continue

                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date

                if date_only < start_date:
                    stop = True
                    break

                if date_only > end_date:
                    smart_delay(0.3, 0.8, 1.0)
                    continue

                # Add source attribution
                content_with_source = f"{content}\n\n{SOURCE_ATTRIBUTION}"

                # Detect category
                cat_code, cat_name = detect_category(title, content)

                published_at = f"{final_date}T09:00:00+09:00"

                # Image matching
                matched_image_url = get_image_url(title, content)

                article_data = {
                    'title': title,
                    'subtitle': '',
                    'content': content_with_source,
                    'published_at': published_at,
                    'original_link': full_url,
                    'source': SOURCE_NAME,
                    'category': cat_name,
                    'region': REGION_CODE,
                    'thumbnail_url': matched_image_url,
                }

                result = send_article_to_server(article_data)

                if result.get('status') == 'created':
                    error_collector.add_success()
                    collected_count += 1
                    print(f"         [OK] Saved: {title[:30]}...")
                    log_to_server(REGION_CODE, 'running', f"Saved: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")

                # POMDP delay after save
                smart_delay(0.5, 1.5, 2.0)

            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded, stopping.")
                break

            # Page transition delay
            smart_delay(1.0, 2.5, 2.0)

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"\n[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)

    return []


# ============================================================
# 11. CLI Entry Point
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper v3.0 (Enterprise Stealth)')
    parser.add_argument('--days', type=int, default=3, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode')
    parser.add_argument('--start-date', type=str, default=None, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='End date (YYYY-MM-DD)')
    parser.add_argument('--headful', action='store_true', help='Run in headful mode (visible browser)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date,
        headless=not args.headful
    )


if __name__ == "__main__":
    main()

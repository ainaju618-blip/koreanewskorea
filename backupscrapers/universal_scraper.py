"""유니버설 스크래퍼 v2.1 - 다양한 사이트 지원"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

# 사이트별 설정
SITE_CONFIGS = {
    'gwangju': {
        'name': '광주광역시',
        'base_url': 'https://www.gwangju.go.kr',
        'list_url': 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027',
        'list_selectors': ['a[href*="boardView.do"]'],
        'content_selectors': ['div.board_view_body', 'div.view_content'],
    },
    'jeonnam': {
        'name': '전라남도',
        'base_url': 'https://www.jeonnam.go.kr',
        'list_url': 'https://www.jeonnam.go.kr/M7116/boardList.do',
        'list_selectors': ['td.title a'],
        'content_selectors': ['div.bbs_view_contnet', 'div.preview_area'],
    }
}

def normalize_date(date_str: str) -> str:
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', date_str)
        if match:
            return match.group(1)
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')

def fetch_detail(page: Page, url: str, config: dict) -> Tuple[str, Optional[str]]:
    if not safe_goto(page, url, timeout=20000):
        return "", None
    
    content = ""
    content_elem = wait_and_find(page, config.get('content_selectors', ['div.view_content']), timeout=5000)
    if content_elem:
        content = safe_get_text(content_elem)[:5000]
    
    thumbnail_url = None
    base_url = config['base_url']
    for sel in config.get('content_selectors', []):
        imgs = page.locator(f'{sel} img')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src and 'icon' not in src.lower():
                thumbnail_url = urljoin(base_url, src)
                break
    
    return content, thumbnail_url

def collect_from_site(site_key: str, days: int = 3, start_date: str = None, end_date: str = None, max_articles: int = 30) -> List[Dict]:
    """
    Collect articles from site with date filtering.

    Args:
        site_key: Site identifier (gwangju, jeonnam, etc.)
        days: Fallback days filter (used if start_date not provided)
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
        max_articles: Maximum number of articles to collect
    """
    config = SITE_CONFIGS.get(site_key)
    if not config:
        print(f"[ERROR] Unknown site: {site_key}")
        return []

    # Date filtering setup
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    region_name = config['name']
    base_url = config['base_url']
    list_url = config['list_url']

    if start_date:
        print(f"[{region_name}] 수집 시작 (기간: {start_date} ~ {end_date}, 최대 {max_articles}개)")
    else:
        print(f"[{region_name}] 수집 시작 (최대 {max_articles}개)")
    log_to_server(site_key, '실행중', f'{region_name} 스크래퍼 시작', 'info')

    collected_count = 0
    consecutive_skip = 0  # Counter for consecutive skips
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        stop_scraping = False
        for page_num in range(1, 4):
            if stop_scraping or collected_count >= max_articles:
                break

            current_url = f'{list_url}&page={page_num}' if '?' in list_url else f'{list_url}?page={page_num}'

            if not safe_goto(page, current_url):
                continue

            links = wait_and_find(page, config['list_selectors'], timeout=10000)
            if not links:
                break

            print(f"   [PAGE] 페이지 {page_num}: {links.count()}개 기사")

            for i in range(min(links.count(), 10)):
                if collected_count >= max_articles or stop_scraping:
                    break

                try:
                    link = links.nth(i)
                    title = safe_get_text(link)
                    href = safe_get_attr(link, 'href')

                    if not title or not href:
                        continue

                    # Try to extract date from list row
                    list_date = None
                    try:
                        parent = link.locator('xpath=ancestor::tr')
                        if parent.count() > 0:
                            parent_text = safe_get_text(parent)
                            if parent_text:
                                date_match = re.search(r'(\d{4})[-.](\d{1,2})[-.](\d{1,2})', parent_text)
                                if date_match:
                                    y, m, d = date_match.groups()
                                    list_date = f"{y}-{int(m):02d}-{int(d):02d}"
                    except:
                        pass

                    # Date filter at list level
                    if start_date and list_date:
                        if list_date < start_date:
                            consecutive_skip += 1
                            print(f"      [SKIP] Date filter: {list_date} < {start_date}")
                            if consecutive_skip >= 3:
                                print(f"      [STOP] 3 consecutive old articles, stopping")
                                stop_scraping = True
                                break
                            continue
                        consecutive_skip = 0  # Reset on valid date

                    full_url = urljoin(base_url, href)
                    content, thumbnail_url = fetch_detail(page, full_url, config)

                    # Use list_date or current date
                    pub_date = list_date or datetime.now().strftime('%Y-%m-%d')

                    article_data = {
                        'title': title,
                        'content': content or f"원본: {full_url}",
                        'published_at': f"{pub_date}T09:00:00+09:00",
                        'original_link': full_url,
                        'source': region_name,
                        'category': '전남' if 'jeonnam' in site_key else '광주',
                        'region': site_key,
                        'thumbnail_url': thumbnail_url,
                    }

                    result = send_article_to_server(article_data)
                    if result.get('status') == 'created':
                        collected_count += 1
                        consecutive_skip = 0
                        print(f"      [OK] {title[:30]}...")
                    elif result.get('status') == 'exists':
                        consecutive_skip += 1
                        if consecutive_skip >= 5:
                            print(f"      [STOP] 5 consecutive duplicates, stopping")
                            stop_scraping = True
                            break

                    safe_goto(page, current_url)
                except:
                    continue

            time.sleep(1)
        
        browser.close()
    
    log_to_server(site_key, '성공', f'완료 ({collected_count}개)', 'success')
    print(f"[OK] 완료 ({collected_count}개)")
    return []

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Universal Scraper v2.2')
    parser.add_argument('--site', type=str, help='Site key (gwangju, jeonnam, etc)')
    parser.add_argument('--region', type=str, help='Alias for --site (bot-service compatible)')
    parser.add_argument('--days', type=int, default=None, help='Days filter (fallback)')
    parser.add_argument('--start-date', type=str, default=None, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='End date (YYYY-MM-DD)')
    parser.add_argument('--max-articles', type=int, default=30, help='Max articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode')
    args = parser.parse_args()

    site_key = args.site or args.region
    if not site_key:
        print("[ERROR] --site or --region is required")
        return

    collect_from_site(
        site_key=site_key,
        days=args.days,
        start_date=args.start_date,
        end_date=args.end_date,
        max_articles=args.max_articles
    )

if __name__ == "__main__":
    main()

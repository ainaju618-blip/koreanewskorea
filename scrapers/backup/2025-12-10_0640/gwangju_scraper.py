"""광주광역시 보도자료 스크래퍼 v2.1 (완성판)"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

REGION_CODE = 'gwangju'
REGION_NAME = '광주광역시'
CATEGORY_NAME = '광주'
BASE_URL = 'https://www.gwangju.go.kr'
LIST_URL = 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789'
GWANGJU_LIST_SELECTORS = ['a[href*="boardView.do"]', 'td.title a']

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

def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str]]:
    if not safe_goto(page, url, timeout=20000):
        return "", None
    content = ""
    content_elem = wait_and_find(page, ['div.board_view_body', 'div.view_content'], timeout=5000)
    if content_elem:
        content = safe_get_text(content_elem)[:5000]
    thumbnail_url = None
    imgs = page.locator('div.board_view_body img, div.view_content img')
    if imgs.count() > 0:
        src = safe_get_attr(imgs.first, 'src')
        if src and 'icon' not in src.lower():
            thumbnail_url = urljoin(BASE_URL, src)
    return content, thumbnail_url

def collect_articles(days: int = 3) -> List[Dict]:
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')
    collected_count = 0
    success_count = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        page_num = 1
        while page_num <= 3:
            list_url = f'{LIST_URL}&page={page_num}'
            print(f"   📄 페이지 {page_num} 수집 중...")
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            links = wait_and_find(page, GWANGJU_LIST_SELECTORS, timeout=10000)
            if not links:
                break
            count = links.count()
            print(f"      📰 {count}개 기사 발견")
            link_data = []
            for i in range(min(count, 10)):
                try:
                    link = links.nth(i)
                    title = safe_get_text(link)
                    href = safe_get_attr(link, 'href')
                    if title and href:
                        link_data.append({'title': title, 'url': urljoin(BASE_URL, href)})
                except:
                    continue
            for item in link_data:
                title = item['title']
                full_url = item['url']
                n_date = datetime.now().strftime('%Y-%m-%d')
                print(f"      📰 {title[:30]}...")
                content, thumbnail_url = fetch_detail(page, full_url)
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"
                article_data = {
                    'title': title,
                    'content': content,
                    'published_at': f"{n_date}T09:00:00+09:00",
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': CATEGORY_NAME,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }
                result = send_article_to_server(article_data)
                collected_count += 1
                if result.get('status') == 'created':
                    success_count += 1
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                safe_goto(page, list_url)
            page_num += 1
            time.sleep(1)
        browser.close()
    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개)"
    print(f"✅ {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    return []

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=3)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    collect_articles(days=args.days)

if __name__ == "__main__":
    main()

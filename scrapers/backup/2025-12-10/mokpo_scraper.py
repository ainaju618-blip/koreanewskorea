"""
목포시 보도자료 스크래퍼
- 버전: v2.1
- 최종수정: 2025-12-10
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

REGION_CODE = 'mokpo'
REGION_NAME = '목포시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.mokpo.go.kr'
LIST_URL = 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material'

LIST_SELECTORS = ['a.item_cont', '.list_item a', 'a[href*="view"]']
CONTENT_SELECTORS = ['div.viewbox', 'div.module_view_box', 'div.board_view_cont']


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
    content_elem = wait_and_find(page, CONTENT_SELECTORS, timeout=5000)
    if content_elem:
        content = safe_get_text(content_elem)[:5000]
    
    thumbnail_url = None
    img_selectors = ['div.image_viewbox img', 'div.viewbox img', 'div.board_view_cont img']
    for sel in img_selectors:
        imgs = page.locator(sel)
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'qrcode']):
                thumbnail_url = urljoin(BASE_URL, src)
                break
    
    return content, thumbnail_url


def collect_articles(days: int = 3) -> List[Dict]:
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')
    
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
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
        stop = False
        
        while page_num <= 3 and not stop:
            list_url = LIST_URL if page_num == 1 else f'{LIST_URL}?page={page_num}'
            print(f"   📄 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            items = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not items:
                break
            
            count = items.count()
            print(f"      📰 {count}개 기사 발견")
            
            link_data = []
            for i in range(count):
                try:
                    item = items.nth(i)
                    title_elem = item.locator('h3')
                    title = safe_get_text(title_elem) or safe_get_text(item)
                    href = safe_get_attr(item, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""
                    
                    date_elem = item.locator('dl dd').nth(1)
                    n_date = normalize_date(safe_get_text(date_elem))
                    
                    if n_date < start_date:
                        stop = True
                        break
                    if n_date > end_date:
                        continue
                    
                    if title and full_url:
                        link_data.append({'title': title, 'url': full_url, 'date': n_date})
                except:
                    continue
            
            for item in link_data:
                title = item['title']
                full_url = item['url']
                n_date = item['date']
                
                print(f"      📰 {title[:30]}... ({n_date})")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
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
    
    collect_articles(args.days)


if __name__ == "__main__":
    main()

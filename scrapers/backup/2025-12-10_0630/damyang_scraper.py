"""
담양군 보도자료 스크래퍼
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

REGION_CODE = 'damyang'
REGION_NAME = '담양군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.damyang.go.kr'
LIST_URL = 'https://www.damyang.go.kr/www/news/press'

LIST_SELECTORS = ['tbody tr', '.board_list tr']
CONTENT_SELECTORS = ['div.view_content', 'div.board_view', 'div.bbs_view']


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
    for sel in CONTENT_SELECTORS:
        imgs = page.locator(f'{sel} img')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src and 'icon' not in src.lower():
                thumbnail_url = urljoin(BASE_URL, src)
                break
    
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
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   📄 페이지 {page_num} 수집 중...")
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                break
            
            count = rows.count()
            print(f"      📰 {count}개 기사 발견")
            
            for i in range(min(count, 10)):
                try:
                    row = rows.nth(i)
                    link_elem = row.locator('td a').first
                    if link_elem.count() == 0:
                        continue
                    
                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""
                    n_date = datetime.now().strftime('%Y-%m-%d')
                    
                    if not title or not full_url:
                        continue
                    
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
                    
                    safe_goto(page, list_url)
                    time.sleep(0.5)
                except:
                    continue
            
            page_num += 1
            time.sleep(0.5)
        
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

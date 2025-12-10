"""
구례군 보도자료 스크래퍼 v2.1
"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

REGION_CODE = 'gurye'
REGION_NAME = '구례군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.gurye.go.kr'
LIST_URL = 'https://www.gurye.go.kr/www/news/press'
LIST_SELECTORS = ['tbody tr']
CONTENT_SELECTORS = ['div.view_content', 'div.board_view']

def normalize_date(s):
    if not s: return datetime.now().strftime('%Y-%m-%d')
    s = s.strip().replace('.', '-').replace('/', '-')
    m = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', s)
    return m.group(1) if m else datetime.now().strftime('%Y-%m-%d')

def fetch_detail(page, url):
    if not safe_goto(page, url, timeout=20000): return "", None
    content = ""
    elem = wait_and_find(page, CONTENT_SELECTORS, timeout=5000)
    if elem: content = safe_get_text(elem)[:5000]
    thumb = None
    for sel in CONTENT_SELECTORS:
        imgs = page.locator(f'{sel} img')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src and 'icon' not in src.lower():
                thumb = urljoin(BASE_URL, src)
                break
    return content, thumb

def collect_articles(days=3):
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')
    collected, success = 0, 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent='Mozilla/5.0', viewport={'width':1280,'height':1024})
        page = ctx.new_page()
        for pn in range(1,4):
            if not safe_goto(page, f'{LIST_URL}?page={pn}'): continue
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows: break
            for i in range(min(rows.count(),10)):
                try:
                    row = rows.nth(i)
                    link = row.locator('td a').first
                    if link.count()==0: continue
                    title = safe_get_text(link)
                    href = safe_get_attr(link, 'href')
                    if not title or not href: continue
                    url = urljoin(BASE_URL, href)
                    content, thumb = fetch_detail(page, url)
                    if not content: content = f"원본: {url}"
                    data = {'title':title,'content':content,'published_at':f"{datetime.now().strftime('%Y-%m-%d')}T09:00:00+09:00",'original_link':url,'source':REGION_NAME,'category':CATEGORY_NAME,'region':REGION_CODE,'thumbnail_url':thumb}
                    r = send_article_to_server(data)
                    collected += 1
                    if r.get('status')=='created': success += 1
                    safe_goto(page, f'{LIST_URL}?page={pn}')
                except: continue
        browser.close()
    log_to_server(REGION_CODE, '성공', f'완료 ({collected}개, {success}개)', 'success')
    print(f"✅ 완료")
    return []

def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--days', type=int, default=3)
    args = p.parse_args()
    collect_articles(args.days)

if __name__ == "__main__": main()

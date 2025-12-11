"""강원일보 스크래퍼 v2.1 (RSS 기반)"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

REGION_CODE = 'kwnews'
REGION_NAME = '강원일보'
CATEGORY_NAME = '강원'
BASE_URL = 'https://www.kwnews.co.kr'
LIST_URL = 'https://www.kwnews.co.kr/area/page/1'

def fetch_detail(page, url):
    if not safe_goto(page, url, timeout=20000): return "", None
    elem = wait_and_find(page, ['div.article_content', 'div.view_content', 'article'], timeout=5000)
    content = safe_get_text(elem)[:5000] if elem else ""
    thumb = None
    imgs = page.locator('div.article_content img, article img')
    if imgs.count() > 0:
        src = safe_get_attr(imgs.first, 'src')
        if src and 'icon' not in src.lower(): thumb = urljoin(BASE_URL, src)
    return content, thumb

def collect_articles(days=3):
    print(f"📰 {REGION_NAME} 기사 수집 시작")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 시작', 'info')
    collected = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(user_agent='Mozilla/5.0').new_page()
        for pn in range(1,4):
            if not safe_goto(page, f'{LIST_URL.replace("/1", f"/{pn}")}'): continue
            links = wait_and_find(page, ['a[href*="/article/"]', '.article_list a'], timeout=10000)
            if not links: break
            print(f"   📄 페이지 {pn}: {links.count()}개 기사")
            for i in range(min(links.count(),10)):
                try:
                    link = links.nth(i)
                    title = safe_get_text(link)
                    href = safe_get_attr(link, 'href')
                    if not title or not href: continue
                    url = urljoin(BASE_URL, href)
                    content, thumb = fetch_detail(page, url)
                    send_article_to_server({'title':title,'content':content or url,'published_at':f"{datetime.now().strftime('%Y-%m-%d')}T09:00:00+09:00",'original_link':url,'source':REGION_NAME,'category':CATEGORY_NAME,'region':REGION_CODE,'thumbnail_url':thumb})
                    collected += 1
                    safe_goto(page, LIST_URL.replace("/1", f"/{pn}"))
                except: continue
        browser.close()
    log_to_server(REGION_CODE, '성공', '완료', 'success')
    print(f"✅ 완료 ({collected}개)")

def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--days', type=int, default=3)
    collect_articles(p.parse_args().days)

if __name__ == "__main__": main()

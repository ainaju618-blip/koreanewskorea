"""강원일보 스크래퍼 v2.2 (날짜 추출 로직 개선)"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

REGION_CODE = 'kwnews'
REGION_NAME = '강원일보'
CATEGORY_NAME = '강원'
BASE_URL = 'https://www.kwnews.co.kr'
LIST_URL = 'https://www.kwnews.co.kr/area/page/1'

def normalize_date(date_str: str) -> str:
    """날짜 문자열 정규화"""
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

def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str]]:
    """본문, 이미지, 날짜 추출"""
    if not safe_goto(page, url, timeout=20000):
        return "", None, None
    
    # 본문
    elem = wait_and_find(page, ['div.article_content', 'div.view_content', 'article'], timeout=5000)
    content = safe_get_text(elem)[:5000] if elem else ""
    
    # 이미지
    thumb = None
    imgs = page.locator('div.article_content img, article img')
    if imgs.count() > 0:
        src = safe_get_attr(imgs.first, 'src')
        if src and 'icon' not in src.lower():
            thumb = urljoin(BASE_URL, src)
            
    # 날짜 추출
    pub_date = None
    try:
        # 강원일보 날짜 셀렉터 추정 (date, input_date, or meta info)
        date_elems = page.locator('.view_info .date, .article_info .date, span.date, div.date')
        if date_elems.count() > 0:
            date_text = safe_get_text(date_elems.first)
            pub_date = normalize_date(date_text)
        
        # Fallback: 본문 내 날짜 패턴 검색
        if not pub_date:
            body_text = page.locator('body').inner_text()
            match = re.search(r'입력\s*:?\s*(\d{4}-\d{1,2}-\d{1,2})', body_text)
            if match:
                pub_date = match.group(1)
            else:
                match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})\s*\(', body_text)
                if match:
                    pub_date = match.group(1)

    except Exception:
        pass
        
    return content, thumb, pub_date

def collect_articles(days: int = 3):
    print(f"[{REGION_NAME}] 기사 수집 시작")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 시작', 'info')
    collected = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(user_agent='Mozilla/5.0').new_page()
        
        for pn in range(1, 4):
            current_url = LIST_URL.replace("/1", f"/{pn}")
            if not safe_goto(page, current_url):
                continue
                
            links = wait_and_find(page, ['a[href*="/article/"]', '.article_list a'], timeout=10000)
            if not links:
                break
                
            print(f"   [PAGE] 페이지 {pn}: {links.count()}개 기사")
            
            for i in range(min(links.count(), 10)):
                try:
                    link = links.nth(i)
                    title = safe_get_text(link)
                    href = safe_get_attr(link, 'href')
                    
                    if not title or not href:
                        continue
                        
                    url = urljoin(BASE_URL, href)
                    content, thumb, pub_date = fetch_detail(page, url)
                    
                    # 날짜 결정 (없으면 현재 시간)
                    final_date = pub_date if pub_date else datetime.now().strftime('%Y-%m-%d')
                    
                    article_data = {
                        'title': title,
                        'content': content or url,
                        'published_at': f"{final_date}T09:00:00+09:00",
                        'original_link': url,
                        'source': REGION_NAME,
                        'category': CATEGORY_NAME,
                        'region': REGION_CODE,
                        'thumbnail_url': thumb
                    }
                    
                    send_article_to_server(article_data)
                    collected += 1
                    safe_goto(page, current_url)
                    
                except Exception as e:
                    print(f"      [에러] {e}")
                    continue
                    
        browser.close()
        
    log_to_server(REGION_CODE, '성공', '완료', 'success')
    print(f"[OK] 완료 ({collected}개)")

def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--days', type=int, default=3)
    args = p.parse_args()
    collect_articles(args.days)

if __name__ == "__main__":
    main()

"""
전라남도청 보도자료 스크래퍼
- 버전: v2.1
- 최종수정: 2025-12-10
- 특이사항: HWP iframe 대응, 첨부파일에서 이미지 추출
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

REGION_CODE = 'jeonnam'
REGION_NAME = '전라남도'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jeonnam.go.kr'
LIST_URL = 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000'

LIST_SELECTORS = ['tbody tr']
LINK_SELECTORS = ['td.title a', 'td a']
CONTENT_SELECTORS = ['div.bbs_view_contnet', 'div.preview_area', 'div.bbs_view']


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
    """상세 페이지 수집 (첨부파일 이미지 추출)"""
    if not safe_goto(page, url, timeout=20000):
        return "", None
    
    # 본문 추출
    content = ""
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            text = safe_get_text(content_elem)
            if text and len(text) > 50:
                content = text[:5000]
                break
    
    if not content or len(content) < 50:
        body = page.locator('div.contents')
        if body.count() > 0:
            content = body.first.inner_text()[:5000]
    
    # 이미지 추출 - 첨부파일 다운로드 링크에서
    thumbnail_url = None
    download_links = page.locator('a[href*="boardDown.do"]')
    for i in range(download_links.count()):
        link = download_links.nth(i)
        title = safe_get_attr(link, 'title') or ""
        href = safe_get_attr(link, 'href') or ""
        
        if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
            thumbnail_url = urljoin(BASE_URL, href)
            break
    
    # 본문 내 이미지 fallback
    if not thumbnail_url:
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
            list_url = f'{LIST_URL}&pageIndex={page_num}'
            print(f"   📄 페이지 {page_num} 탐색 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                break
            
            count = rows.count()
            print(f"      📰 {count}개 기사 발견")
            
            link_data = []
            for i in range(count):
                try:
                    row = rows.nth(i)
                    link_elem = wait_and_find(row, LINK_SELECTORS, timeout=3000)
                    if not link_elem:
                        continue
                    
                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""
                    
                    date_elem = row.locator('td.date')
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
            if stop:
                print("      🛑 수집 기간 초과, 종료합니다.")
                break
            
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개)"
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    print(f"✅ {final_msg}")
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

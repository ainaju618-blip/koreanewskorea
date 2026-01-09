# -*- coding: utf-8 -*-
"""충청남도 보도자료 스크래퍼 v4.0 (Simple Playwright)
- 운영서버 방식으로 단순화
- SPA/동적 로딩 (카드 레이아웃)
"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if '_disabled' in SCRIPT_DIR:
    SCRAPERS_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
else:
    SCRAPERS_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRAPERS_DIR)

from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, detect_category, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.default_images import get_default_image

REGION_CODE = 'chungnam'
REGION_NAME = '충청남도'
BASE_URL = 'https://www.chungnam.go.kr'
LIST_URL = 'https://www.chungnam.go.kr/cnportal/media/article/list.do?menuNo=500181'

LIST_ROW_SELECTORS = [
    'main li:has(a[href*="view.do"])',
    'ul > li:has(a[href*="view.do"])',
    'li a[href*="view.do"]',
    '.article-list li',
]

CONTENT_SELECTORS = [
    'main li:has(p)',
    'main',
    'main article',
    'main .article_content',
    'main .view_content',
    'div.view_content',
    'div.article_content',
]


def safe_str(s):
    if s is None: return ''
    return s.encode('cp949', errors='replace').decode('cp949')


def normalize_date(date_str: str) -> str:
    if not date_str: return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except: pass
    return datetime.now().strftime('%Y-%m-%d')


def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
    if not safe_goto(page, url, timeout=30000):
        return "", None, None, "PAGE_LOAD_FAIL"

    time.sleep(2.0)  # SPA 로딩 대기
    content = ""
    thumbnail_url = None
    pub_date = None

    try:
        page_text = page.locator('body').inner_text()[:3000]
        date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except: pass

    for sel in CONTENT_SELECTORS:
        try:
            content_elem = page.locator(sel)
            if content_elem.count() > 0:
                text = safe_get_text(content_elem)
                if text and len(text) > 50:
                    content = clean_article_content(text)[:5000]
                    break
        except: continue

    attach_links = page.locator('a[href*="download"], a[href*="file"], a[href*="attach"]')
    for i in range(min(attach_links.count(), 5)):
        try:
            link = attach_links.nth(i)
            title_attr = safe_get_attr(link, 'title') or safe_get_text(link) or ''
            href = safe_get_attr(link, 'href') or ''
            if any(ext in title_attr.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                img_url = urljoin(BASE_URL, href) if href else None
                if img_url:
                    cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                        break
        except: continue

    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            try:
                imgs = page.locator(f'{sel} img')
                for i in range(min(imgs.count(), 5)):
                    src = safe_get_attr(imgs.nth(i), 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'button']):
                        img_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                        if cloudinary_url:
                            thumbnail_url = cloudinary_url
                            break
                if thumbnail_url: break
            except: continue

    if not thumbnail_url:
        thumbnail_url = get_default_image(REGION_CODE)

    return content, thumbnail_url, pub_date, None


def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None, headless: bool = True) -> List[Dict]:
    if not end_date: end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date: start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"[{REGION_NAME}] 보도자료 스크래퍼 v4.0 (SPA)")
    print(f"{'='*60}")
    print(f"   [DATE] {start_date} ~ {end_date}")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} 스크래퍼 시작', 'info')
    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(locale='ko-KR', timezone_id='Asia/Seoul')
        page = context.new_page()

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}&pageIndex={page_num}'
            print(f"\n   [PAGE] 페이지 {page_num}...")

            if not safe_goto(page, list_url, timeout=30000):
                page_num += 1
                continue

            time.sleep(2.0)  # SPA 로딩 대기
            rows = wait_and_find(page, LIST_ROW_SELECTORS, timeout=15000)
            if not rows:
                print("      [WARN] 기사 목록 없음")
                break

            row_count = rows.count()
            print(f"      [FOUND] {row_count}개 항목")

            link_data = []
            seen_urls = set()

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles: break
                try:
                    row = rows.nth(i)
                    row_classes = safe_get_attr(row, 'class') or ''
                    if 'notice' in row_classes.lower() or 'header' in row_classes.lower(): continue

                    link_elem = row.locator('a[href*="view.do"]').first
                    if not link_elem or link_elem.count() == 0:
                        link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0: continue

                    href = safe_get_attr(link_elem, 'href')
                    if not href: continue

                    title_elem = link_elem.locator('p').first
                    if title_elem.count() > 0:
                        title = safe_get_text(title_elem).strip()
                    else:
                        title = safe_get_text(link_elem).strip()

                    title = re.sub(r'\s*새로운글\s*', '', title).strip()
                    if '\n' in title:
                        title = title.split('\n')[0].strip()
                    if not title: continue

                    full_url = href if href.startswith('http') else urljoin(BASE_URL + '/cnportal/media/article/', href)

                    n_date = None
                    try:
                        paragraphs = link_elem.locator('p')
                        if paragraphs.count() >= 2:
                            date_text = safe_get_text(paragraphs.nth(1))
                            if date_text:
                                n_date = normalize_date(date_text)
                    except: pass

                    if n_date:
                        if n_date < start_date: stop = True; break
                        if n_date > end_date: continue

                    if full_url in seen_urls: continue
                    seen_urls.add(full_url)

                    link_data.append({'title': title, 'url': full_url, 'list_date': n_date})
                except: continue

            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)
            new_link_data = [item for item in link_data if item['url'] not in existing_urls]

            for item in new_link_data:
                if collected_count >= max_articles: break
                title, full_url = item['title'], item['url']
                print(f"      [ARTICLE] {safe_str(title[:40])}...")

                content, thumbnail_url, detail_date, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()

                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    continue

                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                if final_date < start_date: stop = True; break

                subtitle, content = extract_subtitle(content, title)
                cat_code, cat_name = detect_category(title, content)

                article_data = {
                    'title': title, 'subtitle': subtitle, 'content': content,
                    'published_at': f"{final_date}T09:00:00+09:00",
                    'original_link': full_url, 'source': REGION_NAME,
                    'category': cat_name, 'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }

                result = send_article_to_server(article_data)
                collected_count += 1
                if result.get('status') == 'created':
                    error_collector.add_success()
                    print(f"         [OK] 저장")

            page_num += 1
            if stop: break

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"\n[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count, skipped_count=error_collector.skip_count)
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=3)
    parser.add_argument('--max-articles', type=int, default=10)
    parser.add_argument('--start-date', type=str, default=None)
    parser.add_argument('--end-date', type=str, default=None)
    parser.add_argument('--headful', action='store_true')
    args = parser.parse_args()
    collect_articles(days=args.days, max_articles=args.max_articles,
                    start_date=args.start_date, end_date=args.end_date,
                    headless=not args.headful)


if __name__ == "__main__":
    main()

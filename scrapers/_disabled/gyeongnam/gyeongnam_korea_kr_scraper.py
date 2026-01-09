# -*- coding: utf-8 -*-
"""경상남도 보도자료 스크래퍼 v4.0 (korea.kr 기반)
- 경남도청 직접 접근 불가 (RFC 3.0 봇 감지)
- 대안: 정부24 korea.kr에서 경남 보도자료 수집
- org=6530000 (경상남도 조직코드)
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
from utils.scraper_utils import safe_goto, safe_get_text, safe_get_attr, clean_article_content, detect_category, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.default_images import get_default_image

REGION_CODE = 'gyeongnam'
REGION_NAME = '경상남도'
BASE_URL = 'https://www.korea.kr'
# org=6530000 은 경상남도 조직코드
LIST_URL = 'https://www.korea.kr/news/pressReleaseList.do?org=6530000'

LIST_ROW_SELECTORS = [
    'div.list_type ul li',
    'div.list_type li',
    'ul.news_list li',
]

CONTENT_SELECTORS = [
    'div.view_cont',
    'div.article_body',
    'div.article_wrap',
    'div.ark_content',
]


def safe_str(s):
    if s is None: return ''
    return s.encode('cp949', errors='replace').decode('cp949')


def normalize_date(date_str: str) -> str:
    """날짜 정규화 (YYYY.MM.DD 또는 YYYY-MM-DD 형식)"""
    if not date_str: return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip()
    try:
        # YYYY.MM.DD 형식
        match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"

        # YYYY-MM-DD 형식
        match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except: pass
    return datetime.now().strftime('%Y-%m-%d')


def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
    """본문 및 이미지, 작성일시 추출"""
    if not safe_goto(page, url, timeout=20000):
        return "", None, None, "PAGE_LOAD_FAIL"

    time.sleep(1.5)
    content = ""
    thumbnail_url = None
    pub_date = None

    # 날짜 추출 (view_title 영역에서)
    try:
        date_elem = page.locator('div.view_title span, span.date, .article_date')
        if date_elem.count() > 0:
            date_text = date_elem.first.inner_text()
            pub_date = normalize_date(date_text)
    except: pass

    if not pub_date:
        try:
            page_text = page.locator('body').inner_text()[:2000]
            date_match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', page_text)
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        except: pass

    # 본문 추출
    for sel in CONTENT_SELECTORS:
        try:
            content_elem = page.locator(sel)
            if content_elem.count() > 0:
                text = safe_get_text(content_elem)
                if text and len(text) > 50:
                    # 메타 정보 제거
                    text = re.sub(r'바로보기\s*내려받기', '', text)
                    text = re.sub(r'첨부파일.*?\.pdf', '', text, flags=re.DOTALL)
                    text = re.sub(r'저작권정책.*?$', '', text, flags=re.DOTALL)
                    content = clean_article_content(text)[:5000]
                    break
        except: continue

    # 이미지 추출 - 본문 내 이미지
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

    # 기본 이미지 fallback
    if not thumbnail_url:
        thumbnail_url = get_default_image(REGION_CODE)

    return content, thumbnail_url, pub_date, None


def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None, headless: bool = True) -> List[Dict]:
    if not end_date: end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date: start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"[{REGION_NAME}] 보도자료 스크래퍼 v4.0 (korea.kr)")
    print(f"{'='*60}")
    print(f"   [DATE] {start_date} ~ {end_date}")
    print(f"   [SOURCE] korea.kr (org=6530000)")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} 스크래퍼 시작 (korea.kr)', 'info')
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

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1.5)

            # 리스트 아이템 찾기
            rows = None
            for sel in LIST_ROW_SELECTORS:
                try:
                    r = page.locator(sel)
                    if r.count() > 0:
                        rows = r
                        break
                except: continue

            if not rows or rows.count() == 0:
                print("      [WARN] 기사 목록 없음")
                break

            row_count = rows.count()
            print(f"      [FOUND] {row_count}개 행")

            link_data = []
            seen_urls = set()

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles: break
                try:
                    row = rows.nth(i)

                    # 링크와 제목 추출
                    link_elem = row.locator('a[href*="pressReleaseView"]').first
                    if not link_elem or link_elem.count() == 0: continue

                    href = safe_get_attr(link_elem, 'href')
                    if not href: continue

                    # 제목 추출
                    title_elem = link_elem.locator('strong').first
                    title = safe_get_text(title_elem) if title_elem.count() > 0 else safe_get_text(link_elem)
                    title = title.strip() if title else ""
                    if not title: continue

                    full_url = urljoin(BASE_URL, href)

                    # 날짜 추출
                    n_date = None
                    try:
                        source_span = row.locator('span.source span').first
                        if source_span.count() > 0:
                            date_text = safe_get_text(source_span)
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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 (korea.kr)')
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

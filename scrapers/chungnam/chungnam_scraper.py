"""
충청남도 보도자료 스크래퍼 - Enterprise Stealth v3.0
- 버전: v3.0 (Enterprise Stealth Enhanced)
- 최종수정: 2026-01-05
- 담당: AI Agent

[프로젝트: koreanewskorea]
- 전국 17개 시·도 보도자료 수집용
- Supabase: ainaju618@gmail.com 계정 (신규 DB)

[특이사항]:
- 하이브리드 (SPA 가능성)
- 동적 로딩 필요 (JS 렌더링)
- Playwright 필수
- 로딩 후 충분한 대기 시간 필요
"""

import sys
import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPERS_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRAPERS_DIR)

from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth

from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import wait_and_find, safe_get_text, safe_get_attr
from utils.content_cleaner import clean_article_content
from utils.category_detector import detect_category
from utils.error_collector import ErrorCollector
from utils.cloudinary_uploader import download_and_upload_image

from utils.enterprise_stealth import (
    StealthConfig, PODMPDelayGenerator, BlockDetector, BlockType,
    FingerprintManager, retry_with_backoff, smart_delay,
)

REGION_CODE = 'chungnam'
REGION_NAME = '충청남도'
CATEGORY_NAME = '전국'
BASE_URL = 'https://www.chungnam.go.kr'
LIST_URL = 'https://www.chungnam.go.kr/cnportal/media/articleMain/mainAlm.do'

# 충남은 동적 로딩 (페이지네이션 방식 확인 필요)
PAGE_PARAM = 'pageIndex'

# SPA/동적 로딩 대응을 위한 다양한 셀렉터
LIST_ROW_SELECTORS = [
    'ul.news_list > li',
    'ul.article_list > li',
    'div.news_list ul > li',
    'table.board_list tbody tr',
    'table tbody tr',
    '.board_list li',
    '.article_item',
]

CONTENT_SELECTORS = [
    'div.view_content',
    'div.article_content',
    'div.news_content',
    'div.board_view',
    '.content_view',
    'div.view_box',
    '.bbs_view',
]


def get_stealth_config() -> StealthConfig:
    return StealthConfig(
        headless=True, use_persistent_context=True,
        context_dir=os.path.join(SCRAPERS_DIR, 'browser_contexts'),
        min_delay=2.0, max_delay=5.0, poisson_lambda=2.5,  # 동적 로딩을 위해 딜레이 증가
        max_retries=3, base_backoff=2.0, max_backoff=60.0,
        jitter_factor=0.3, use_http2=True, rotate_fingerprint=True,
        fingerprint_interval=15
    )


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


def extract_subtitle(content: str, title: str) -> Tuple[Optional[str], str]:
    if not content: return None, content
    lines = content.strip().split('\n')
    for line in lines[:3]:
        line = line.strip()
        if line and len(line) > 10 and line != title and not line.startswith('▲'):
            if len(line) < 200: return line, content
    return None, content


@retry_with_backoff(max_retries=3, base_backoff=2.0, max_backoff=30.0)
def safe_goto(page: Page, url: str, timeout: int = 30000) -> bool:
    """충남은 동적 로딩이 필요하므로 timeout과 대기 시간을 늘림"""
    try:
        page.goto(url, wait_until='networkidle', timeout=timeout)
        # 동적 콘텐츠 로딩 대기
        page.wait_for_timeout(2000)
        return True
    except Exception as e:
        print(f"      [ERROR] Page load failed: {e}")
        raise


def wait_for_content(page: Page, timeout: int = 10000) -> bool:
    """동적 콘텐츠가 로드될 때까지 대기"""
    try:
        for selector in LIST_ROW_SELECTORS:
            try:
                page.wait_for_selector(selector, timeout=timeout)
                return True
            except:
                continue
        return False
    except:
        return False


def fetch_detail(page: Page, url: str, delay_gen: PODMPDelayGenerator) -> Tuple[str, Optional[str], str, Optional[str]]:
    try:
        if not safe_goto(page, url, timeout=30000):
            return "", None, datetime.now().strftime('%Y-%m-%d'), "PAGE_LOAD_FAIL"
    except Exception as e:
        return "", None, datetime.now().strftime('%Y-%m-%d'), f"PAGE_LOAD_ERROR: {e}"

    smart_delay(1.5, 3.0, 2.0)
    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')

    date_selectors = [
        'span:has-text("작성일")', 'li:has-text("작성일")', 'th:has-text("작성일") + td',
        'span:has-text("등록일")', '.view_info span', 'td.date', '.date',
        'span:has-text("입력")', 'span:has-text("게시일")',
    ]
    for sel in date_selectors:
        try:
            elem = page.locator(sel).first
            if elem.count() > 0:
                text = safe_get_text(elem)
                if text and re.search(r'\d{4}', text):
                    pub_date = normalize_date(text)
                    break
        except: continue

    if pub_date == datetime.now().strftime('%Y-%m-%d'):
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
                for i in range(min(imgs.count(), 3)):
                    src = safe_get_attr(imgs.nth(i), 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'button']):
                        img_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                        if cloudinary_url:
                            thumbnail_url = cloudinary_url
                        else:
                            thumbnail_url = img_url
                        break
                if thumbnail_url: break
            except: continue

    if not thumbnail_url:
        return "", None, pub_date, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, None


def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None, headless: bool = True) -> List[Dict]:
    if not end_date: end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date: start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"[{REGION_NAME}] 보도자료 스크래퍼 v3.0 (Enterprise Stealth)")
    print(f"{'='*60}")
    print(f"   [DATE] {start_date} ~ {end_date}")
    print(f"   [NOTE] JS/SPA 동적 로딩 모드")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} 스크래퍼 v3.0 시작 (SPA 모드)', 'info')

    config = get_stealth_config()
    config.headless = headless
    delay_gen = PODMPDelayGenerator(config)
    block_detector = BlockDetector()
    fingerprint_manager = FingerprintManager(config.fingerprint_interval)
    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        fp = fingerprint_manager.get_fingerprint()
        browser = p.chromium.launch(
            headless=config.headless,
            args=['--disable-blink-features=AutomationControlled', '--disable-infobars',
                  '--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox',
                  f'--window-size={fp["screen"]["width"]},{fp["screen"]["height"]}']
        )
        context = browser.new_context(
            user_agent=fp['userAgent'], viewport=fp['screen'],
            locale='ko-KR', timezone_id='Asia/Seoul', color_scheme='light',
        )
        page = context.new_page()
        Stealth().apply_stealth_sync(page)
        page.add_init_script(fingerprint_manager.get_stealth_js())

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}?{PAGE_PARAM}={page_num}'
            print(f"\n   [PAGE] 페이지 {page_num} 수집 중...")

            delay = delay_gen.get_page_delay()
            print(f"      [DELAY] {delay:.2f}s")

            try:
                if not safe_goto(page, list_url): page_num += 1; continue
            except: page_num += 1; continue

            # 동적 콘텐츠 로딩 대기
            wait_for_content(page, timeout=10000)

            content = page.content()
            block_type = block_detector.detect(content, 200)
            if block_type != BlockType.NONE:
                strategy = block_detector.get_recovery_strategy(block_type)
                if strategy['action'] in ['abort', 'manual_intervention']: break
                smart_delay(strategy['delay'], strategy['delay'] * 1.5, 1.0)
                continue

            smart_delay(1.5, 2.5, 2.0)
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

                    link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0: continue

                    title = safe_get_text(link_elem).strip()
                    title = re.sub(r'\s*새로운글\s*', '', title).strip()
                    href = safe_get_attr(link_elem, 'href')
                    if not title or not href: continue

                    full_url = href if href.startswith('http') else urljoin(BASE_URL, href)

                    n_date = None
                    try:
                        # 날짜 찾기 (다양한 위치 시도)
                        date_elem = row.locator('.date, span.date, .info_date, td:last-child').first
                        if date_elem.count() > 0:
                            n_date = normalize_date(safe_get_text(date_elem))
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
                print(f"      [ARTICLE] {safe_str(title[:35])}...")

                article_delay = delay_gen.get_delay()
                print(f"         [DELAY] {article_delay:.2f}s")

                content, thumbnail_url, detail_date, error_reason = fetch_detail(page, full_url, delay_gen)
                error_collector.increment_processed()

                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    continue

                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                if final_date < start_date: stop = True; break
                if not content: content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                subtitle, content = extract_subtitle(content, title)
                cat_code, cat_name = detect_category(title, content)

                article_data = {
                    'title': title, 'subtitle': subtitle, 'content': content,
                    'published_at': f"{final_date}T09:00:00+09:00",
                    'original_link': full_url, 'source': REGION_NAME,
                    'category': cat_name, 'region': REGION_CODE, 'thumbnail_url': thumbnail_url,
                }

                result = send_article_to_server(article_data)
                collected_count += 1
                if result.get('status') == 'created':
                    error_collector.add_success()
                    print(f"         [OK] 저장 완료")

                smart_delay(0.5, 1.5, 2.0)

            page_num += 1
            if stop: break
            smart_delay(1.5, 3.0, 2.0)

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"\n[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count, skipped_count=error_collector.skip_count)
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.0 (SPA 모드)')
    parser.add_argument('--days', type=int, default=3)
    parser.add_argument('--max-articles', type=int, default=10)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--start-date', type=str, default=None)
    parser.add_argument('--end-date', type=str, default=None)
    parser.add_argument('--headful', action='store_true')
    args = parser.parse_args()
    collect_articles(days=args.days, max_articles=args.max_articles,
                    start_date=args.start_date, end_date=args.end_date,
                    headless=not args.headful)


if __name__ == "__main__":
    main()

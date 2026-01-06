# -*- coding: utf-8 -*-
"""Jangseong County Press Release Scraper v2.0
- Site: https://www.jangseong.go.kr/
- Target: Press release board (/home/www/news/jangseong/bodo)
- Last Modified: 2025-12-13
- Changes: Migration to local_image_saver
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.text_cleaner import clean_article_content
from utils.category_classifier import detect_category
from utils.scraper_utils import extract_subtitle

# ============================================
# Constants
# ============================================
REGION_CODE = 'jangseong'
REGION_NAME = '장성군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jangseong.go.kr'
LIST_URL = 'https://www.jangseong.go.kr/home/www/news/jangseong/bodo'

# Selectors
ARTICLE_LINK_SELECTOR = 'a[href*="/bodo/show/"]'
TABLE_ROW_SELECTOR = 'table tbody tr'

# Detail page selectors
DETAIL_TITLE_SELECTOR = '.view_title, .board_view h3, h3.title'
DETAIL_CONTENT_SELECTOR = '.view_content, .board_view_body, .content'
DETAIL_DATE_SELECTOR = '.info, .date, .view_info'
DETAIL_IMAGE_SELECTOR = '.view_content img, .board_view_body img, .content img'


def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    try:
        # Extract YYYY-MM-DD pattern
        match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

        # YYYY.MM.DD pattern
        match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        pass

    return datetime.now().strftime('%Y-%m-%d')


def validate_article(article_data: Dict) -> Tuple[bool, str]:
    """Data validation"""
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "[검증 실패] 제목이 너무 짧거나 없습니다."

    content = article_data.get('content', '')
    if not content or len(content) < 50:
        return False, f"[검증 실패] 본문 내용이 부족합니다. (길이: {len(content)})"

    return True, "[검증 통과]"




def safe_get_text(locator) -> str:
    """Safely extract text from locator"""
    try:
        if locator.count() > 0:
            return locator.first.inner_text().strip()
    except:
        pass
    return ""


def safe_get_attr(locator, attr: str) -> Optional[str]:
    """Safely extract attribute from locator"""
    try:
        if locator.count() > 0:
            return locator.first.get_attribute(attr)
    except:
        pass
    return None


def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str], Optional[str], Optional[str]]:
    """Extract content/image/date/department from detail page
    
    Returns:
        (content, thumbnail_url, pub_date, department, error_reason)
        - error_reason is None on success
    """
    try:
        page.goto(url, timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(1500)
    except Exception as e:
        print(f"   [WARN] Page access failed: {url}")
        return "", None, None, None, "PAGE_LOAD_FAIL"

    # 1. Extract content
    content = ""
    try:
        # Try multiple selectors
        for selector in ['.view_content', '.board_view_body', '.content', '#content', '.bbs_view_content']:
            content_elem = page.locator(selector)
            if content_elem.count() > 0:
                content = content_elem.first.inner_text().strip()
                if len(content) > 50:
                    break

        # Remove metadata (date, views, copyright notices, etc.)
        content = clean_article_content(content)

        # Jangseong-specific: Remove top 3 lines (containing metadata)
        if content:
            lines = content.split('\n')
            if len(lines) > 3:
                content = '\n'.join(lines[3:]).strip()

        content = content[:5000]  # Max 5000 chars
    except Exception as e:
        print(f"   [WARN] Content extraction error: {str(e)}")

    # 2. Extract image
    thumbnail_url = None
    original_image_url = None
    try:
        # Find content images (inside img_control class for Jangseong)
        for selector in ['.img_control img', '.view_content img', '.board_view_body img', '.content img']:
            imgs = page.locator(selector)
            img_count = imgs.count()
            if img_count > 0:
                for i in range(min(img_count, 5)):
                    src = imgs.nth(i).get_attribute('src')
                    if src and 'icon' not in src.lower() and 'logo' not in src.lower() and 'button' not in src.lower() and 'kogl' not in src.lower():
                        original_image_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        print(f"      [IMG] Image found: {original_image_url[:60]}...")
                        break
                if original_image_url:
                    break
    except Exception as e:
        print(f"   [WARN] Image extraction error: {str(e)}")

    # 3. Save image locally (if image exists)
    if original_image_url:
        try:
            local_path = download_and_upload_image(original_image_url, BASE_URL, REGION_CODE)
            if local_path and local_path.startswith('/images/'):
                thumbnail_url = local_path
                print(f"      [LOCAL] Image saved: {local_path}")
            else:
                thumbnail_url = original_image_url
        except Exception as e:
            thumbnail_url = original_image_url
            print(f"      [WARN] Image save error: {str(e)[:50]}")

    # 4. Extract date
    pub_date = None
    try:
        # Find date pattern in full page text
        page_text = page.locator('body').inner_text()
        
        # 1. 시간 포함 패턴 시도 (YYYY-MM-DD HH:mm)
        dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:5000])
        if dt_match:
             y, m, d, hh, mm = dt_match.groups()
             pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
            # 2. 날짜만 있는 패턴
            match = re.search(r'(\d{4}-\d{2}-\d{2})', page_text[:5000])
            if match:
                pub_date = match.group(1)
    except:
        pass

    # 5. Extract department
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # Find patterns like "Planning Office", "xxx Division"
        match = re.search(r'([\w]+(?:실|과|팀|센터))', page_text)
        if match:
            department = match.group(1)
    except:
        pass

    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, department, None  # success


def collect_articles(days: int = 7, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """Main article collection function"""
    # Date range setup
    if not start_date:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    else:
        cutoff_date = start_date

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    print(f"[{REGION_NAME}] 수집 시작 (기간: {cutoff_date} ~ {end_date}, 최대 {max_articles}개)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    collected_links = []

    # ============================================
    # Phase 1: Collect links
    # ============================================
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()

        # Iterate through pages 1-3
        for page_num in range(1, 4):
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] Scanning list page {page_num}...")

            try:
                page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
                page.wait_for_timeout(1500)
            except Exception as e:
                print(f"   [WARN] Page {page_num} access failed: {str(e)}")
                continue

            # Extract article links
            links = page.locator(ARTICLE_LINK_SELECTOR)
            count = links.count()
            print(f"      [LINK] {count} articles found")

            if count == 0:
                print("   [WARN] No article list found.")
                continue

            stop_collecting = False
            for i in range(count):
                try:
                    link = links.nth(i)

                    # Extract title and link
                    title = link.inner_text().strip()
                    href = link.get_attribute('href')

                    if not title or not href:
                        continue

                    # Complete URL
                    full_url = urljoin(BASE_URL, href)

                    # Extract ID (/show/79036)
                    match = re.search(r'/show/(\d+)', href)
                    article_id = match.group(1) if match else None

                    # Date will be extracted from detail page
                    article_date = datetime.now().strftime('%Y-%m-%d')

                    collected_links.append({
                        'id': article_id,
                        'title': title,
                        'url': full_url,
                        'date': article_date
                    })

                    # 날짜 필터 (list page) - 장성은 목록에서 날짜 확인 불가하므로 스킵


                except Exception as e:
                    print(f"      [WARN] Link parsing error: {str(e)}")

            if stop_collecting:
                print("      [STOP] Collection period exceeded, stopping link collection")
                break

            time.sleep(0.5)

        print(f"[OK] Total {len(collected_links)} target links collected successfully.")

        # ============================================
        # Phase 2: Visit detail pages
        # ============================================
        processed_count = 0
        error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

        target_links = collected_links[:max_articles]

        # Pre-check duplicates before visiting detail pages (optimization)
        urls_to_check = [item['url'] for item in target_links]
        existing_urls = check_duplicates(urls_to_check)

        # Filter out already existing articles
        new_target_links = [item for item in target_links if item['url'] not in existing_urls]
        skipped_by_precheck = len(target_links) - len(new_target_links)
        if skipped_by_precheck > 0:
            print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

        for item in new_target_links:
            url = item['url']
            title = item['title']
            list_date = item['date']

            print(f"   [{processed_count+1}] Analyzing: {title[:40]}...")

            content, thumbnail_url, pub_date, department, error_reason = fetch_detail(page, url)
            error_collector.increment_processed()

            # 에러 발생 시 스킵
            if error_reason:
                error_collector.add_error(error_reason, title, url)
                print(f"         [SKIP] {error_reason}")
                time.sleep(0.5)
                continue

            # Extract subtitle
            subtitle, content = extract_subtitle(content, title)

            # Determine date (detail page > list page)
            final_date = pub_date if pub_date else list_date

            # Auto-categorize
            cat_code, cat_name = detect_category(title, content)

            # published_at 처리 (시간 포함 여부 확인)
            if 'T' in final_date and '+09:00' in final_date:
                    published_at = final_date
            else:
                    published_at = f"{final_date}T09:00:00+09:00"

            # Create data object
            article_data = {
                'title': title,
                'subtitle': subtitle,
                'content': content,
                'published_at': published_at,
                'original_link': url,
                'source': REGION_NAME,
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
                'department': department,
            }

            # ============================================
            # Phase 3: Validate and save to DB
            # ============================================
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")

            if is_valid:
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      [OK] DB save complete ID: {result.get('id', 'Unknown')}")
                    error_collector.add_success()
                    log_to_server(REGION_CODE, '실행중', f"성공: {title[:15]}...", 'success')
                elif result and result.get('status') == 'exists':
                    print(f"      [SKIP] Article already exists")
                else:
                    print(f"      [WARN] DB save failed: {result}")
            else:
                 error_collector.add_error("VALIDATION_FAIL", title, url, msg)

            processed_count += 1
            time.sleep(1)  # Rate limiting

        browser.close()

    # 에러 요약 보고 출력
    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[완료] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Jangseong County press release scraper')
    parser.add_argument('--days', type=int, default=7, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode')
    # bot-service.ts compatible arguments (required)
    parser.add_argument('--start-date', type=str, default=None, help='Collection start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='Collection end date (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

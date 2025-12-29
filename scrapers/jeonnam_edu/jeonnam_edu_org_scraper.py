# -*- coding: utf-8 -*-
"""Jeonnam Education Office (Institutions) Press Release Scraper v1.0
- Site: https://www.jnedu.kr/
- Target: Institutions (S1N2) - Educational Support Offices, Affiliated Organizations
- Articles: ~19,194 total (960 pages)
- Last Modified: 2025-12-30
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
from utils.scraper_utils import clean_article_content, extract_subtitle
from utils.category_detector import detect_category


def safe_str(text: str) -> str:
    """Safely encode text for Windows console output (cp949)"""
    try:
        return text.encode('cp949', errors='replace').decode('cp949')
    except:
        return text


# ============================================
# Constants - INSTITUTIONS (S1N2)
# ============================================
REGION_CODE = 'jeonnam_edu_org'
REGION_NAME = '전남교육청 기관'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jnedu.kr'
LIST_URL = 'https://www.jnedu.kr/news/articleList.html?sc_section_code=S1N2&view_type=sm'

# Selectors - Same as S1N1 (confirmed by structure analysis)
ARTICLE_LINK_SELECTOR = 'section ul li h4 a[href*="articleView"]'
DATE_SELECTOR = 'em'

# Detail page selectors
DETAIL_TITLE_SELECTOR = 'header.article-view-header h2.heading'
DETAIL_CONTENT_SELECTOR = 'article#article-view-content-div'
DETAIL_DATE_SELECTOR = 'header.article-view-header ul.infomation li'
DETAIL_IMAGE_SELECTOR = 'figure.photo-layout img'


def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    date_str = date_str.replace('입력', '').strip()

    try:
        match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        pass

    return datetime.now().strftime('%Y-%m-%d')


def validate_article(article_data: Dict) -> Tuple[bool, str]:
    """Validate article data"""
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "[VALIDATION FAIL] Title too short or missing."

    content = article_data.get('content', '')
    if not content or len(content) < 50:
        return False, f"[VALIDATION FAIL] Content insufficient. (length: {len(content)})"

    return True, "[VALIDATION PASS]"


def safe_get_text(locator) -> str:
    """Safely extract text"""
    try:
        if locator.count() > 0:
            return locator.first.inner_text().strip()
    except:
        pass
    return ""


def safe_get_attr(locator, attr: str) -> Optional[str]:
    """Safely extract attribute"""
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
        page.wait_for_timeout(1000)
    except Exception as e:
        print(f"   [WARN] Page load failed: {url}")
        return "", None, None, None, "PAGE_LOAD_FAIL"

    # 1. Extract content
    content = ""
    try:
        content_elem = page.locator(DETAIL_CONTENT_SELECTOR)
        if content_elem.count() > 0:
            paragraphs = content_elem.locator('p, div.article-body')
            texts = []
            for i in range(paragraphs.count()):
                text = paragraphs.nth(i).inner_text().strip()
                if text and len(text) > 10:
                    texts.append(text)
            content = '\n\n'.join(texts)

            if not content or len(content) < 50:
                content = content_elem.inner_text().strip()

            content = clean_article_content(content)
    except Exception as e:
        print(f"   [WARN] Content extraction error: {str(e)}")

    # 2. Extract image
    thumbnail_url = None
    original_image_url = None
    try:
        imgs = page.locator(DETAIL_IMAGE_SELECTOR)
        img_count = imgs.count()
        print(f"      [IMG] figure.photo-layout img found: {img_count}")

        if img_count > 0:
            src = imgs.first.get_attribute('src')
            if src and 'icon' not in src.lower():
                original_image_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                print(f"      [IMG] Image URL: {original_image_url[:80]}...")
        else:
            fallback_imgs = page.locator('article img')
            fallback_count = fallback_imgs.count()
            print(f"      [IMG] fallback article img found: {fallback_count}")
            for i in range(min(fallback_count, 5)):
                src = fallback_imgs.nth(i).get_attribute('src')
                if src and 'icon' not in src.lower() and 'logo' not in src.lower():
                    original_image_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    print(f"      [IMG] fallback image URL: {original_image_url[:80]}...")
                    break
    except Exception as e:
        print(f"   [WARN] Image extraction error: {str(e)}")

    # 3. Upload to Cloudinary
    if original_image_url:
        try:
            cloudinary_url = download_and_upload_image(original_image_url, BASE_URL, folder="jeonnam_edu_org")
            if cloudinary_url and (cloudinary_url.startswith('https://res.cloudinary.com') or cloudinary_url.startswith('/images/')):
                thumbnail_url = cloudinary_url
                print(f"      [CLOUD] Image saved")
            else:
                thumbnail_url = original_image_url
        except Exception as e:
            thumbnail_url = original_image_url
            print(f"      [WARN] Image save error: {str(e)[:50]}")

    # 4. Extract date
    pub_date = None
    try:
        info_items = page.locator(DETAIL_DATE_SELECTOR)
        for i in range(info_items.count()):
            text = info_items.nth(i).inner_text().strip()
            if '입력' in text or re.search(r'\d{4}[\.-]\d{2}[\.-]\d{2}', text):
                dt_match = re.search(r'(\d{4})[\.-](\d{1,2})[\.-](\d{1,2})\s+(\d{1,2}):(\d{1,2})', text)
                if dt_match:
                    y, m, d, hh, mm = dt_match.groups()
                    pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
                    break

                pub_date = normalize_date(text)
                break
    except:
        pass

    # 5. Extract department
    department = None
    try:
        byline = page.locator('header.article-view-header .infomation')
        if byline.count() > 0:
            byline_text = byline.inner_text()
            # Extract institution name from byline
            match = re.search(r'(\S+교육지원청|\S+센터|\S+원)', byline_text)
            if match:
                department = match.group(1)
    except:
        pass

    # Skip if no image
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, department, None


def collect_articles(days: int = 7, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """Main article collection function"""
    print(f"[{REGION_NAME}] Press release collection started (last {days} days, max {max_articles})")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} scraper started', 'info')

    collected_links = []
    if not start_date:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    else:
        cutoff_date = start_date

    if 'T' in cutoff_date:
        cutoff_date = cutoff_date.split('T')[0]

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

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

        for page_num in range(1, 4):
            list_url = f'{LIST_URL}&page={page_num}'
            print(f"   [PAGE] Scanning list page {page_num}...")

            try:
                page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
                page.wait_for_timeout(1000)
            except Exception as e:
                print(f"   [WARN] Page {page_num} access failed: {str(e)}")
                continue

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

                    title = link.inner_text().strip()
                    href = link.get_attribute('href')

                    if not title or not href:
                        continue

                    article_date = datetime.now().strftime('%Y-%m-%d')
                    full_url = urljoin(BASE_URL, href)

                    match = re.search(r'idxno=(\d+)', href)
                    article_id = match.group(1) if match else None

                    collected_links.append({
                        'id': article_id,
                        'title': title,
                        'url': full_url,
                        'date': article_date
                    })

                except Exception as e:
                    print(f"      [WARN] Link parsing error: {str(e)}")

            if stop_collecting:
                print("      [STOP] Collection period exceeded, stopping link collection")
                break

            time.sleep(0.5)

        print(f"[OK] Total {len(collected_links)} target links collected.")

        # Pre-check duplicates
        urls_to_check = [item['url'] for item in collected_links[:max_articles]]
        existing_urls = check_duplicates(urls_to_check)

        new_link_data = [item for item in collected_links[:max_articles] if item['url'] not in existing_urls]
        skipped_by_precheck = len(collected_links[:max_articles]) - len(new_link_data)
        if skipped_by_precheck > 0:
            print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

        # ============================================
        # Phase 2: Visit detail pages
        # ============================================
        error_collector = ErrorCollector(REGION_CODE, REGION_NAME)
        processed_count = 0

        target_links = new_link_data

        for item in target_links:
            url = item['url']
            title = item['title']
            list_date = item['date']

            print(f"   [{processed_count+1}] Processing: {safe_str(title[:40])}...")

            content, thumbnail_url, pub_date, department, error_reason = fetch_detail(page, url)
            error_collector.increment_processed()

            if error_reason:
                error_collector.add_error(error_reason, title, url)
                print(f"         [SKIP] {error_reason}")
                time.sleep(0.5)
                continue

            final_date = pub_date if pub_date else list_date

            subtitle, content = extract_subtitle(content, title)

            cat_code, cat_name = detect_category(title, content)

            if 'T' in final_date and '+09:00' in final_date:
                    published_at = final_date
            else:
                    published_at = f"{final_date}T09:00:00+09:00"

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
                    print(f"      [OK] Saved to DB ID: {result.get('id', 'Unknown')}")
                    error_collector.add_success()
                    log_to_server(REGION_CODE, 'running', f"Created: {title[:15]}...", 'success')
                elif result and result.get('status') == 'skipped':
                    print(f"      [SKIP] Article already exists in DB")
                else:
                    print(f"      [WARN] DB save failed: {result}")
            else:
                 error_collector.add_error("VALIDATION_FAIL", title, url, msg)

            processed_count += 1
            time.sleep(1)

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[DONE] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Jeonnam Education Office Institutions (S1N2) Press Release Scraper')
    parser.add_argument('--days', type=int, default=7, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode')
    parser.add_argument('--start-date', type=str, default=None, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='End date (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

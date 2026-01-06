"""
진도군의회 의정활동갤러리 Scraper
- Source: https://www.jindo.go.kr/council/board/B0024.cs?m=88
- Version: v1.0
- Created: 2026-01-06
- Feature: 모든 사진 추출 (갤러리 형식)
"""

# ============================================================
# 1. Standard Library
# ============================================================
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

# ============================================================
# 2. External Libraries
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. Local Modules
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.text_cleaner import clean_article_content
from utils.category_detector import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'jindo'
REGION_NAME = '진도군의회'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jindo.go.kr'
LIST_URL = 'https://www.jindo.go.kr/council/board/B0024.cs?m=88'

# List page selectors (gallery format)
GALLERY_ITEM_SELECTOR = '.gallery_list ul li .area'
GALLERY_LINK_SELECTOR = 'a.box'
GALLERY_THUMB_SELECTOR = '.thumb img'
GALLERY_TITLE_SELECTOR = '.title'
GALLERY_DATE_SELECTOR = '.date'

# Content page selectors
CONTENT_IMAGE_SELECTOR = 'p.img img[src*="/uploads/"]'
CONTENT_TEXT_SELECTOR = 'p.txt'


# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


# ============================================================
# 6. Detail Page Collection Function - 모든 사진 추출
# ============================================================
def fetch_detail(page: Page, url: str, list_thumb: str = None) -> Tuple[str, Optional[str], List[str], str, Optional[str]]:
    """
    Extract content, ALL images, and date from detail page

    Returns:
        (content text, thumbnail URL, all_image_urls, date, error_reason)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, [], datetime.now().strftime('%Y-%m-%d'), "PAGE_LOAD_FAIL"

    time.sleep(1.5)

    # 1. Extract date
    pub_date = datetime.now().strftime('%Y-%m-%d')
    try:
        page_text = page.locator('body').inner_text()
        date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text[:3000])
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")

    # 2. Extract ALL images (갤러리 특성: 모든 사진 추출)
    all_image_urls = []
    thumbnail_url = None

    try:
        # Find all images in content area
        imgs = page.locator(CONTENT_IMAGE_SELECTOR)
        img_count = imgs.count()
        print(f"         [IMAGES] Found {img_count} images")

        for i in range(img_count):
            try:
                src = safe_get_attr(imgs.nth(i), 'src')
                if src:
                    full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src

                    # Upload to Cloudinary
                    cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        all_image_urls.append(cloudinary_url)
                        # First image is thumbnail
                        if not thumbnail_url:
                            thumbnail_url = cloudinary_url
                    else:
                        all_image_urls.append(full_url)
                        if not thumbnail_url:
                            thumbnail_url = full_url
            except Exception as e:
                print(f"         [WARN] Image {i+1} extraction failed: {e}")
                continue

    except Exception as e:
        print(f"      [WARN] Image extraction failed: {e}")

    # Fallback: use list thumbnail if no images found in detail
    if not thumbnail_url and list_thumb:
        full_thumb = urljoin(BASE_URL, list_thumb) if not list_thumb.startswith('http') else list_thumb
        cloudinary_url = download_and_upload_image(full_thumb, BASE_URL, folder=REGION_CODE)
        if cloudinary_url:
            thumbnail_url = cloudinary_url
            all_image_urls.append(cloudinary_url)
        else:
            thumbnail_url = full_thumb
            all_image_urls.append(full_thumb)

    # If no image found, skip this article
    if not thumbnail_url:
        return "", None, [], pub_date, ErrorCollector.IMAGE_MISSING

    # 3. Extract content (갤러리는 본문이 짧거나 없을 수 있음)
    content = ""

    try:
        # Try to get text content
        text_elem = page.locator(CONTENT_TEXT_SELECTOR)
        if text_elem.count() > 0:
            content = safe_get_text(text_elem)

        # If no text, try broader search
        if not content or len(content) < 20:
            js_code = """
            () => {
                const content = document.querySelector('#_jcontent') ||
                              document.querySelector('.read_body') ||
                              document.querySelector('#content');
                if (!content) return '';

                const texts = [];
                const ps = content.querySelectorAll('p');
                for (const p of ps) {
                    const text = p.innerText?.trim();
                    if (text && text.length > 10 && !text.includes('첨부') && !text.includes('다운로드')) {
                        texts.push(text);
                    }
                }
                return texts.join('\\n');
            }
            """
            content = page.evaluate(js_code)
    except Exception as e:
        print(f"      [WARN] Content extraction failed: {e}")

    if content:
        content = clean_article_content(content)

    return content, thumbnail_url, all_image_urls, pub_date, None


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 7, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect gallery articles and send to server
    """
    print(f"[{REGION_NAME}] 의정활동갤러리 collection started (last {days} days)")

    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} gallery scraper v1.0 started', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}&pageIndex={page_num}'
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, 'running', f'Page {page_num} exploration', 'info')

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1.5)

            # Find all gallery items
            items = page.locator(GALLERY_ITEM_SELECTOR)
            item_count = items.count()
            print(f"      [FOUND] {item_count} gallery items found")

            link_data = []
            seen_urls = set()

            for i in range(item_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    item = items.nth(i)

                    # Get link
                    link_elem = item.locator(GALLERY_LINK_SELECTOR)
                    if link_elem.count() == 0:
                        continue

                    href = safe_get_attr(link_elem, 'href')
                    if not href:
                        continue

                    # Build full URL
                    if href.startswith('?'):
                        full_url = f"{LIST_URL.split('?')[0]}{href}"
                    elif href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)

                    # Get title
                    title_elem = item.locator(GALLERY_TITLE_SELECTOR)
                    title = safe_get_text(title_elem).strip() if title_elem.count() > 0 else ""

                    if not title:
                        continue

                    # Get thumbnail from list
                    thumb_elem = item.locator(GALLERY_THUMB_SELECTOR)
                    list_thumb = safe_get_attr(thumb_elem, 'src') if thumb_elem.count() > 0 else None

                    # Get date
                    date_elem = item.locator(GALLERY_DATE_SELECTOR)
                    n_date = None
                    if date_elem.count() > 0:
                        date_text = safe_get_text(date_elem)
                        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_text)
                        if date_match:
                            n_date = date_match.group(1)

                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'list_date': n_date,
                        'list_thumb': list_thumb
                    })

                except Exception as e:
                    print(f"      [ERROR] Item {i}: {e}")
                    continue

            # Pre-check duplicates
            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            new_link_data = [item for item in link_data if item['url'] not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

            # Collect detail pages
            for item in new_link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']
                list_thumb = item.get('list_thumb')

                # Safe print for Windows console
                try:
                    print(f"      [GALLERY] {title[:40]}...")
                except UnicodeEncodeError:
                    print(f"      [GALLERY] (title encoding error)...")
                log_to_server(REGION_CODE, 'running', f"Collecting: {title[:20]}...", 'info')

                content, thumbnail_url, all_images, detail_date, error_reason = fetch_detail(page, full_url, list_thumb)
                error_collector.increment_processed()

                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.3)
                    continue

                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date

                if date_only < start_date:
                    stop = True
                    break

                # 갤러리는 본문이 짧을 수 있으므로, 이미지 개수 정보 추가
                if not content or len(content) < 30:
                    content = f"{title}\n\n이 갤러리에는 {len(all_images)}장의 사진이 포함되어 있습니다.\n원문 링크: {full_url}"

                subtitle, content = extract_subtitle(content, title)
                cat_code, cat_name = detect_category(title, content)

                published_at = f"{final_date}T09:00:00+09:00"

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': published_at,
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': cat_name,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }

                # 추가 이미지가 있으면 metadata에 저장 (선택적)
                if len(all_images) > 1:
                    article_data['metadata'] = {
                        'gallery_images': all_images,
                        'image_count': len(all_images)
                    }

                result = send_article_to_server(article_data)

                if result.get('status') == 'created':
                    error_collector.add_success()
                    collected_count += 1
                    print(f"         [OK] Saved ({collected_count}/{max_articles}) - {len(all_images)} images")
                    log_to_server(REGION_CODE, 'running', f"Saved: {title[:15]}... ({len(all_images)} imgs)", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")

                time.sleep(0.5)

            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded, stopping.")
                break

            time.sleep(1)

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)

    return []


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 의정활동갤러리 Scraper v1.0')
    parser.add_argument('--days', type=int, default=30, help='Collection period (days)')
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

"""
Damyang County Press Release Scraper
- Version: v2.0
- Last Modified: 2025-12-12
- Maintainer: AI Agent

Changes (v2.0):
- cloudinary_uploader to local_image_saver transition
- Image path returned as: /images/damyang/{filename} format
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin, parse_qs, urlparse

from playwright.sync_api import sync_playwright, Page

# Set local module path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import (
    safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, detect_category
)
from utils.cloudinary_uploader import download_and_upload_image

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
# Constants
# ============================================================
REGION_CODE = 'damyang'
REGION_NAME = '담양군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.damyang.go.kr'
LIST_URL = 'https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001005001'

# Selectors
LIST_ROW_SELECTOR = 'table:has(caption:has-text("보도자료")) tbody tr'
CONTENT_SELECTORS = [
    '.con-wrap',      # Damyang County SPA content area
    'div.view_con',
    'div.board_view',
    'td.content',
    'div.bbs_view'
]

# Patterns to remove from content (Damyang County footer)
CONTENT_CUT_PATTERNS = [
    '첨부파일',
    '이전글',
    '다음글',
    '목록',
    '공공누리',
    '담당부서',
    '이 페이지에서 제공하는 정보에',
    'QR CODE',
    '의견남기기',
    '결과보기'
]

# Metadata patterns to remove from top of content
HEADER_PATTERNS = [
    r'등록일\s*\d{4}[-./]\d{1,2}[-./]\d{1,2}',
    r'조회수\s*\d+',
    r'작성자\s*\S+'
]

def clean_content(text: str, title: str = "") -> Tuple[str, Optional[str]]:
    """
    Remove unnecessary metadata and footer text from content

    Args:
        text: Original content text
        title: Article title (for duplicate removal)

    Returns:
        (cleaned content, subtitle)
    """
    if not text:
        return "", None

    subtitle = None

    # 1. Remove bottom footer (cut at first pattern position)
    cut_position = len(text)
    for pattern in CONTENT_CUT_PATTERNS:
        idx = text.find(pattern)
        if idx != -1 and idx < cut_position:
            cut_position = idx

    result = text[:cut_position].strip()

    # 2. Remove top metadata (registration date, views, author)
    for pattern in HEADER_PATTERNS:
        result = re.sub(pattern, '', result)

    # 3. Remove duplicate title
    if title:
        title_clean = title.strip()
        result = result.replace(title_clean, '')

    # 4. Extract subtitle (first line starting with "-")
    lines = result.split('\n')
    new_lines = []
    for line in lines:
        line_stripped = line.strip()
        if line_stripped.startswith('- ') and subtitle is None:
            subtitle = line_stripped[2:].strip()  # Remove "- "
        else:
            new_lines.append(line)

    result = '\n'.join(new_lines)

    # 5. Clean up consecutive spaces/newlines
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = re.sub(r' {2,}', ' ', result)
    result = result.strip()

    # 6. Limit maximum length
    return result[:5000], subtitle



def fetch_detail(page: Page, url: str, title: str = "") -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, images, date, department, and subtitle from detail page

    Returns:
        (content, thumbnail URL, date, department, subtitle)
    """
    if not safe_goto(page, url):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, None

    # Damyang County SPA site: wait for dynamic loading
    try:
        page.wait_for_selector('button.downBtn, .con-wrap', timeout=10000)
    except:
        pass
    time.sleep(1)

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    subtitle = None

    # 1. Extract date and department
    info_items = page.locator('.view_info li, .board_info li, dl.info dd')
    count = info_items.count()
    for i in range(count):
        text = safe_get_text(info_items.nth(i))
        if '등록일' in text:
            date_match = re.search(r'(\d{4}[-.]\d{1,2}[-.]\d{1,2})', text)
            if date_match:
                pub_date = normalize_date(date_match.group(1))
        if '담당부서' in text:
            dept_match = text.replace('담당부서', '').replace(':', '').strip()
            if dept_match:
                department = dept_match

    # Fallback: find in top/bottom of content
    if department is None:
        dept_elem = page.locator('span:has-text("담당부서")')
        if dept_elem.count() > 0:
             department = safe_get_text(dept_elem).replace('담당부서', '').strip()

    # 2. Extract content
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            raw_content = safe_get_text(content_elem)
            if raw_content and len(raw_content) > 50:
                # Clean content: remove duplicate title, extract subtitle, remove footer
                content, subtitle = clean_content(raw_content, title)
                # Apply additional cleaning
                content = clean_article_content(content)
                break

    # 3. Extract images - Damyang County pattern: button.downBtn + expect_download
    if not thumbnail_url:
        import tempfile
        import shutil

        download_btns = page.locator('button.downBtn')
        for i in range(download_btns.count()):
            btn = download_btns.nth(i)
            file_nm = btn.get_attribute('data-file-nm') or ''

            # Check if image file
            if any(ext in file_nm.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                print(f"      [IMG] Image attachment found: {file_nm[:40]}...")

                try:
                    # Download file with expect_download
                    with page.expect_download(timeout=15000) as download_info:
                        btn.click()
                    download = download_info.value

                    # Save to temp file
                    temp_path = os.path.join(tempfile.gettempdir(), download.suggested_filename or f"damyang_{i}.jpg")
                    download.save_as(temp_path)

                    # Move to local image storage
                    from utils.local_image_saver import ensure_directory, generate_filename
                    folder = ensure_directory(REGION_CODE)
                    filename = generate_filename(REGION_CODE, file_nm)
                    final_path = os.path.join(folder, filename)
                    shutil.copy2(temp_path, final_path)
                    os.remove(temp_path)

                    thumbnail_url = f"/images/{REGION_CODE}/{filename}"
                    print(f"      [SAVED] Image saved: {thumbnail_url}")
                    break

                except Exception as e:
                    print(f"      [WARN] Download failed: {e}")
                    continue

    # Strategy B: Content images (fallback)
    if not thumbnail_url:
        imgs = page.locator('div.view_con img, div.board_view img, .bbs_view img')
        for i in range(imgs.count()):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'button', 'logo', 'blank', 'data:image']):
                img_url = urljoin(BASE_URL, src)
                local_path = download_and_upload_image(img_url, BASE_URL, REGION_CODE)
                if local_path:
                    thumbnail_url = local_path
                    print(f"      [SAVED] Content image: {local_path}")
                    break

    return content, thumbnail_url, pub_date, department, subtitle

def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None):
    print(f"[{REGION_NAME}] Press release collection started")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    collected_count = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page_num = 1
        stop = False

        while page_num <= 5 and not stop and collected_count < max_articles:
            # Try URL parameter pagination (&page=N)
            curr_url = f"{LIST_URL}&page={page_num}"
            print(f"   [PAGE] Page {page_num}: {curr_url}")

            if not safe_goto(page, curr_url):
                page_num += 1
                continue

            rows = wait_and_find(page, [LIST_ROW_SELECTOR])
            if not rows or rows.count() == 0:
                print("      [WARN] List not found")
                break

            count = rows.count()
            print(f"      [FOUND] {count} articles found")

            # Collect list data
            items = []
            for i in range(count):
                row = rows.nth(i)
                try:
                    # Title/link
                    title_link = row.locator('td.subject a, td.title a, a[href*="detail"]').first
                    if title_link.count() == 0:
                        continue

                    title = safe_get_text(title_link)
                    href = safe_get_attr(title_link, 'href')

                    # Date
                    date_elem = row.locator('td').nth(3) # Usually 4th is date
                    date_text = safe_get_text(date_elem)
                    n_date = normalize_date(date_text)

                    if n_date < start_date:
                        stop = True
                        break
                    if n_date > end_date:
                        continue

                    # Build detail URL
                    full_url = ""
                    if href:
                        if 'javascript' in href:
                            match = re.search(r"dataSid=(\d+)", href)
                            if match:
                                sid = match.group(1)
                                full_url = f"{BASE_URL}/board/detail?dataSid={sid}&boardId=BBS_0000007&domainId=DOM_0000001&contentsSid=12&menuCd=DOM_000000190001005001"
                        else:
                            full_url = urljoin(BASE_URL, href)

                    if title and full_url:
                        items.append({
                            'title': title,
                            'url': full_url,
                            'date': n_date
                        })

                except Exception as e:
                    print(f"      [WARN] Item parse error: {e}")
                    continue

            # Collect details
            for item in items:
                if collected_count >= max_articles:
                    break

                print(f"      Reading: {item['title']} ({item['date']})")

                # Pass title to remove duplicates from content
                content, thumb, final_date, dept, subtitle = fetch_detail(page, item['url'], item['title'])

                # Date priority: detail > list
                pub_at = final_date if final_date else item['date']

                # Auto-classify category
                cat_code, cat_name = detect_category(item['title'], content)

                article = {
                    'title': item['title'],
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': f"{pub_at}T09:00:00+09:00",
                    'original_link': item['url'],
                    'source': REGION_NAME,
                    'category': cat_name,
                    'region': REGION_CODE,
                    'thumbnail_url': thumb
                }

                res = send_article_to_server(article)
                if res.get('status') == 'created':
                    print("         [OK] Saved")
                    collections_msg = "이미지 포함" if thumb else "텍스트만"
                    log_to_server(REGION_CODE, '성공', f"저장: {item['title']} ({collections_msg})", 'success')
                    collected_count += 1
                elif res.get('status') == 'exists':
                    print("         [SKIP] Already exists")

                time.sleep(0.5)

            page_num += 1

        browser.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드')
    # bot-service.ts compatible arguments (required)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )

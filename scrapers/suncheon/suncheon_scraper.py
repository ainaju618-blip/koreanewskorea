"""
Suncheon City Press Release Scraper
- Version: v3.1
- Last Modified: 2025-12-14
- Author: AI Agent

Changes (v3.1):
- Improved image extraction logic (local save priority, try multiple selectors) - Claude work directive

Changes (v3.0):
- Complete rewrite based on user-provided detailed guide
- URL pattern: ?mode=view&seq={ID}
- Pagination: ?x=1&pageIndex={N}
- Content: Third row td in table
- Images: Attachment download (hotlink not allowed)
"""

# ============================================================
# 1. Standard Libraries
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
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_detector import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'suncheon'
REGION_NAME = '순천시'
CATEGORY_NAME = '전남'
BASE_URL = 'http://www.suncheon.go.kr'
LIST_URL = 'http://www.suncheon.go.kr/kr/news/0006/0001/'

# Pagination: ?x=1&pageIndex={N}
# Detail page: ?mode=view&seq={article_id}

# List page selectors
LIST_LINK_SELECTORS = [
    'table tr td:nth-child(2) a',  # Accurate selector based on guide
    'tbody tr td a[href*="mode=view"]',
    'a[href*="seq="]',
]


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


def extract_article_id(href: str) -> Optional[str]:
    """Extract seq parameter from href"""
    if not href:
        return None
    match = re.search(r'seq=(\d+)', href)
    return match.group(1) if match else None


def download_attachment_image(page: Page, link_locator) -> Optional[str]:
    """
    Click JavaScript download link to download image and upload to Cloudinary

    Suncheon-specific handling:
    - Uses goDownLoad() function -> Capture with Playwright expect_download()
    - Or direct download via POST request

    Args:
        page: Playwright Page object
        link_locator: Download link Locator

    Returns:
        Cloudinary URL or None
    """
    import tempfile
    import requests

    try:
        # Method 1: Try click download with Playwright expect_download()
        try:
            with page.expect_download(timeout=15000) as download_info:
                link_locator.click()

            download = download_info.value

            # Save to temporary file
            temp_dir = tempfile.mkdtemp()
            temp_path = os.path.join(temp_dir, download.suggested_filename)
            download.save_as(temp_path)

            print(f"      [DOWNLOAD] Complete: {download.suggested_filename}")

            # Check if image file
            if any(temp_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                # Upload to Cloudinary
                from utils.cloudinary_uploader import upload_local_image
                cloudinary_url = upload_local_image(temp_path, folder=REGION_CODE)

                # Clean up temporary file
                try:
                    os.remove(temp_path)
                    os.rmdir(temp_dir)
                except:
                    pass

                if cloudinary_url:
                    print(f"      [CLOUD] Cloudinary upload complete")
                    return cloudinary_url

            return None

        except Exception as e:
            print(f"      [WARN] Click download failed, trying POST method: {e}")

        # Method 2: Parse goDownLoad() parameters and POST request
        try:
            # Extract goDownLoad parameters from onclick or href
            onclick = link_locator.get_attribute('href') or link_locator.get_attribute('onclick') or ''

            # Parse goDownLoad('param1', 'param2', 'param3') pattern
            match = re.search(r"goDownLoad\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)", onclick)
            if match:
                param1, param2, param3 = match.groups()

                # Download image via POST request
                download_url = 'http://eminwon.suncheon.go.kr/emwp/jsp/ofr/FileDownNew.jsp'

                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'http://www.suncheon.go.kr/kr/news/0006/0001/',
                    'Content-Type': 'application/x-www-form-urlencoded',
                }

                # Get cookies
                cookies = {}
                for cookie in page.context.cookies():
                    cookies[cookie['name']] = cookie['value']

                # POST data (adjust structure as needed)
                data = {
                    'param1': param1,
                    'param2': param2,
                    'param3': param3,
                }

                response = requests.post(
                    download_url,
                    headers=headers,
                    data=data,
                    cookies=cookies,
                    timeout=30,
                    verify=False
                )

                if response.status_code == 200 and len(response.content) > 1000:
                    # Save to temporary file
                    temp_dir = tempfile.mkdtemp()
                    temp_path = os.path.join(temp_dir, 'downloaded_image.jpg')

                    with open(temp_path, 'wb') as f:
                        f.write(response.content)

                    print(f"      [DOWNLOAD] POST complete: {len(response.content)} bytes")

                    # Upload to Cloudinary
                    from utils.cloudinary_uploader import upload_local_image
                    cloudinary_url = upload_local_image(temp_path, folder=REGION_CODE)

                    # Clean up temporary file
                    try:
                        os.remove(temp_path)
                        os.rmdir(temp_dir)
                    except:
                        pass

                    if cloudinary_url:
                        print(f"      [CLOUD] Cloudinary upload complete")
                        return cloudinary_url

        except Exception as e:
            print(f"      [WARN] POST download failed: {e}")

        return None

    except Exception as e:
        print(f"      [WARN] Image download failed: {e}")
        return None


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str], Optional[str]]:
    """
    Extract content, image, date, department, and title from detail page

    Returns:
        (content text, thumbnail URL, date, department, title, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, None, "PAGE_LOAD_FAIL"

    time.sleep(3)  # Wait sufficiently for page and script loading
    print(f"      [OK] Detail page loaded", flush=True)

    # Suncheon detail page structure:
    # - First row: Department (column 2), Date (column 4)
    # - Second row: Title
    # - Third row: Content
    
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    content = ""
    thumbnail_url = None
    detail_title = None  # Title extracted from detail page

    # 1. Extract information (Time priority)
    try:
        page_text = page.locator('body').inner_text()
        
        # 1-1. YYYY-MM-DD HH:mm
        dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:5000])
        if dt_match:
            y, m, d, hh, mm = dt_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"

        js_code = """
        () => {
            const result = {date: '', department: '', content: '', title: ''};
            
            // 테이블 행들 찾기
            const tables = document.querySelectorAll('table');
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length >= 3) {
                    // 첫 번째 행: 담당부서, 등록일
                    const firstRow = rows[0];
                    const firstCells = firstRow.querySelectorAll('td, th');
                    if (firstCells.length >= 4) {
                        result.department = firstCells[1]?.innerText?.trim() || '';
                        result.date = firstCells[3]?.innerText?.trim() || '';
                    }
                    
                    // 두 번째 행: 제목
                    const secondRow = rows[1];
                    const titleCell = secondRow.querySelector('td');
                    if (titleCell) {
                        result.title = titleCell.innerText?.trim() || '';
                    }
                    
                    // 세 번째 행: 본문
                    const thirdRow = rows[2];
                    const contentCell = thirdRow.querySelector('td');
                    if (contentCell) {
                        result.content = contentCell.innerText?.trim() || '';
                    }
                    
                    if (result.content && result.content.length > 50) {
                        break;
                    }
                }
            }
            
            return result;
        }
        """
        data = page.evaluate(js_code)
        
        if data.get('date'):
            pub_date = normalize_date(data['date'])
        if data.get('department'):
            department = data['department']
        if data.get('content'):
            content = clean_article_content(data['content'][:5000])
        if data.get('title'):
            detail_title = data['title']
    except Exception as e:
        print(f"      [WARN] JS extraction failed: {e}")
    
    # Fallback: Extract general text
    if not content or len(content) < 50:
        try:
            body_text = page.locator('body').inner_text()
            # Try to find content area
            if body_text:
                content = clean_article_content(body_text[:5000])
        except:
            pass

    # 2. Extract images (from attachments - JavaScript download method)
    # Click download via Playwright expect_download() then upload to Cloudinary
    try:
        # Find image files in attachment area
        # Add wait time
        try:
            page.wait_for_selector('a[href*="goDownLoad"]', timeout=3000)
        except:
            pass

        attach_links = page.locator('a[href*="goDownLoad"], a[onclick*="goDownLoad"]')
        attach_count = attach_links.count()
        print(f"      [SEARCH] Attachment link count: {attach_count}", flush=True)

        if attach_count > 0:
            for i in range(min(attach_count, 5)):
                link = attach_links.nth(i)
                # Use text_content() instead of safe_get_text (get full text)
                try:
                    link_text = link.text_content() or ''
                    link_text = link_text.strip()
                except:
                    link_text = safe_get_text(link) or ''

                onclick = link.get_attribute('href') or link.get_attribute('onclick') or ''
                print(f"      [ATTACH] File #{i+1}: {link_text} | Link: {onclick[:30]}...", flush=True)

                # Check if image file (text-based)
                is_image = any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif'])

                if is_image:
                    print(f"      [IMG] Image attachment found: {link_text}", flush=True)
                    # Download image via JavaScript download click and upload
                    cloudinary_url = download_attachment_image(page, link)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                    break
        else:
             print(f"      [WARN] Attachment link not found (selector: a[href*='goDownLoad'])", flush=True)

    except Exception as e:
        print(f"      [WARN] Attachment processing failed: {e}", flush=True)

    # 3. Extract content images (v3.1: local save priority, multiple selectors)
    if not thumbnail_url:
        try:
            # Try more diverse image selectors
            img_selectors = [
                'td img[src*=".jpg"]',
                'td img[src*=".png"]',
                'td img[src*=".jpeg"]',
                'div img[src*=".jpg"]',
                'div img[src*=".png"]',
                'img[src*="upload"]',
                'img[src*="file"]',
            ]

            for sel in img_selectors:
                imgs = page.locator(sel)
                for i in range(min(imgs.count(), 3)):
                    src = safe_get_attr(imgs.nth(i), 'src')
                    # Exclude public domain (opentype/kor_type) and other non-content images
                    exclude_patterns = [
                        'icon', 'btn', 'logo', 'banner', 'bg', 'bullet', 'blank', 'spacer',
                        'opentype', 'copyright', 'license', 'footer', 'kor_', 'type0', 'type1', 'type2', 'type3', 'type4'
                    ]
                    if src and not any(x in src.lower() for x in exclude_patterns):
                        full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src

                        # Upload to Cloudinary
                        cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                        if cloudinary_url:
                            thumbnail_url = cloudinary_url
                            print(f"      [IMG] Content image Cloudinary: {cloudinary_url[:50]}...")
                            break

                if thumbnail_url:
                    break
        except Exception as e:
            print(f"      [WARN] Content image extraction failed: {e}")
    
    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, detail_title, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, department, detail_title, None  # success


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server

    Args:
        days: Collection period (days)
        max_articles: Maximum number of articles to collect
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
    """
    print(f"[{REGION_NAME}] Press release collection started (last {days} days)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.0 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    collected_count = 0
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
        
        while page_num <= 5 and not stop and collected_count < max_articles:
            # 순천시 페이지네이션: ?x=1&pageIndex={N}
            list_url = f'{LIST_URL}?x=1&pageIndex={page_num}'
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # 목록 링크 찾기
            links = wait_and_find(page, LIST_LINK_SELECTORS, timeout=10000)
            if not links:
                print("      [WARN] Article list not found.")
                break
            
            link_count = links.count()
            print(f"      [FOUND] {link_count} articles found")
            
            # Collect link information
            link_data = []
            seen_urls = set()  # For duplicate URL checking

            for i in range(link_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    link = links.nth(i)

                    title = safe_get_text(link)
                    title = title.strip() if title else ""

                    href = safe_get_attr(link, 'href')

                    if not title or not href:
                        continue

                    # Check seq= parameter
                    if 'seq=' not in href and 'mode=view' not in href:
                        continue

                    # Build detail page URL
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(LIST_URL, href)

                    # Check for duplicate URLs
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    # Date will be extracted from detail page
                    link_data.append({
                        'title': title,
                        'url': full_url,
                    })

                except Exception as e:
                    continue

            # Pre-check duplicates before visiting detail pages (optimization)
            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            # Filter out already existing articles
            new_link_data = [item for item in link_data if item['url'] not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

            # Collect detail pages and send to server
            for item in new_link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']

                print(f"      [ARTICLE] {title[:35]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                content, thumbnail_url, pub_date, department, detail_title, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.5)
                    continue

                # Use detail page title if available (replace truncated list title)
                if detail_title and len(detail_title) > len(title):
                    title = detail_title

                # Date filtering
                date_only = pub_date.split('T')[0] if 'T' in pub_date else pub_date
                if date_only < start_date:
                    stop = True
                    break

                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Auto-classify category
                cat_code, cat_name = detect_category(title, content)

                # published_at 처리 (시간 포함 여부 확인)
                if 'T' in pub_date and '+09:00' in pub_date:
                     published_at = pub_date
                else:
                     published_at = f"{pub_date}T09:00:00+09:00"

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

                # Send to server
                # Send to server
                result = send_article_to_server(article_data)
                
                if result.get('status') == 'created':
                    error_collector.add_success()
                    img_status = "[+IMG]" if thumbnail_url else "[-IMG]"
                    print(f"         [OK] Saved ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")
                
                collected_count += 1

                time.sleep(0.5)  # Rate limiting

            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded.")
                break
            
            time.sleep(1)
        
        browser.close()

    # 에러 요약 보고 출력
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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} Press Release Scraper v3.0')
    parser.add_argument('--days', type=int, default=3, help='Collection period (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum number of articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
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

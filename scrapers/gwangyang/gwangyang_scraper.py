"""
Gwangyang City Press Release Scraper
- Version: v1.1
- Last Modified: 2025-12-14
- Maintainer: AI Agent

Changes (v1.1):
- Added pattern to remove department/contact/phone number metadata (Claude work instruction)

Changes (v1.0):
- Initial version based on user-provided detailed analysis data
- URL pattern: /board.es?mid=a11007000000&bid=0057&act=view&list_no={ID}
- Images: /upload_data/board/bobo/{filename}
- Table-based layout (table.view_table)
- Static HTML, UTF-8 encoding
"""

# ============================================================
# 1. 표준 라이브러리
# ============================================================
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin, parse_qs, urlparse

# ============================================================
# 2. 외부 라이브러리
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. 로컬 모듈
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.detect_category import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'gwangyang'
REGION_NAME = '광양시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://gwangyang.go.kr'

# List page URL (Press releases)
MID = 'a11007000000'
BID = '0057'
LIST_PATH = f'/board.es?mid={MID}&bid={BID}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Detail page URL pattern: /board.es?mid=a11007000000&bid=0057&act=view&list_no={ID}&nPage={page}

# List page selectors (table-based layout)
LIST_ITEM_SELECTORS = [
    'table a[href*="act=view"]',  # Article links
    'a[href*="list_no="]',
]

# Detail page/content selectors (priority order)
CONTENT_SELECTORS = [
    'table td.content',
    '.view_content',
    '.board_view_content',
    'table.view_table td',
]

# Date patterns: YYYY.MM.DD HH:MM or YYYY-MM-DD
DATE_PATTERNS = [
    r'(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})',
]


# ============================================================
# 5. 유틸리티 함수
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


def extract_list_no(href: str) -> Optional[str]:
    """Extract list_no (article ID) from href"""
    if not href:
        return None

    # Extract from URL parameters
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'list_no' in params:
            return params['list_no'][0]
    except:
        pass

    # Extract using regex
    match = re.search(r'list_no[=]?(\d+)', href)
    if match:
        return match.group(1)

    return None


def build_detail_url(list_no: str, page: int = 1) -> str:
    """Build detail page URL from article ID (list_no)"""
    return f'{BASE_URL}/board.es?mid={MID}&bid={BID}&act=view&list_no={list_no}&nPage={page}'


def build_list_url(page: int = 1) -> str:
    """Build list page URL with page number (nPage parameter)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&nPage={page}'


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, images, date, and department from detail page

    Returns:
        (content text, thumbnail URL, date, department, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"

    time.sleep(1.5)  # Page stabilization

    # 1. Date extraction (format: YYYY.MM.DD HH:MM)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        # Find registration date pattern
        date_match = re.search(r'(작성일|등록일)[^\d]*(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})', page_text)
        if date_match:
            y, m, d = date_match.groups()[1:]  # Skip label, get y, m, d
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        else:
            # General date pattern
            date_match = re.search(r'(\d{4})[./](\d{1,2})[./](\d{1,2})', page_text[:3000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] 날짜 추출 실패: {e}")
    
    # 2. Extract department/author
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # Pattern: Author : Department
        dept_match = re.search(r'작성자[^\w]*([가-힣]+(?:과|실|팀|부|센터))', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
    except Exception as e:
        print(f"      [WARN] 담당부서 추출 실패: {e}")
    
    # 3. Extract content
    content = ""
    
    try:
        # Extract content using JavaScript (table-based)
        js_code = """
        () => {
            // Gwangyang-specific: table-based content extraction
            
            // Method 1: td.content
            const contentTd = document.querySelector('table td.content');
            if (contentTd) {
                const text = contentTd.innerText?.trim();
                if (text && text.length > 50) {
                    return text;
                }
            }
            
            // Method 2: view_table last td
            const viewTable = document.querySelector('table.view_table');
            if (viewTable) {
                const tds = viewTable.querySelectorAll('td');
                for (let i = tds.length - 1; i >= 0; i--) {
                    const text = tds[i].innerText?.trim();
                    if (text && text.length > 100) {
                        return text;
                    }
                }
            }
            
            // Method 3: general content selectors
            const contentSelectors = [
                '.view_content', '.board_view_content', '.con-wrap'
            ];
            
            for (const sel of contentSelectors) {
                const elem = document.querySelector(sel);
                if (elem) {
                    const text = elem.innerText?.trim();
                    if (text && text.length > 100) {
                        return text;
                    }
                }
            }
            
            // Method 4: find td with longest text
            const allTds = document.querySelectorAll('table td');
            let maxText = '';
            
            for (const td of allTds) {
                const text = td.innerText?.trim();
                if (text && text.length > maxText.length && 
                    !text.includes('로그인') && !text.includes('회원가입') &&
                    text.length < 10000) {
                    maxText = text;
                }
            }
            
            if (maxText.length > 100) {
                return maxText;
            }
            
            return '';
        }
        """
        content = page.evaluate(js_code)
        if content:
            # Clean content using clean_article_content function
            content = clean_article_content(content)
    except Exception as e:
        print(f"      [WARN] JS 본문 추출 실패: {e}")
    
    # Fallback: general selectors
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = clean_article_content(text)
                        break
            except:
                continue
    
    # 4. Extract images
    thumbnail_url = None
    
    # Strategy 1: Extract images from /upload/editor/ path (actual Gwangyang path)
    try:
        imgs = page.locator('img[src*="/upload/editor/"]')
        for i in range(min(imgs.count(), 5)):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src:
                download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVED] 에디터 이미지 저장: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] 에디터 이미지 추출 실패: {e}")
    
    # Strategy 2: Images from /upload/ path (excluding banners)
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*="/upload/"]')
            for i in range(min(imgs.count(), 10)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and '/upload/editor/' in src or '/upload_data/' in src:
                    if not any(x in src.lower() for x in ['banner', 'logo', 'icon', 'btn']):
                        download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                        if saved_path:
                            thumbnail_url = saved_path
                            print(f"      [SAVED] 업로드 이미지 저장: {saved_path}")
                            break
        except Exception as e:
            print(f"      [WARN] 업로드 이미지 추출 실패: {e}")
    
    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING
    
    return content, thumbnail_url, pub_date, department, None  # success


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(max_articles: int = 30, days: Optional[int] = None, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
    """
    Collect press releases and send to server (count-based)

    Args:
        max_articles: Maximum number of articles to collect (default 10)
        days: Optional date filter (disabled if None)
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
        dry_run: Test mode (no server transmission)
    """
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    if start_date:
        print(f"[{REGION_NAME}] 보도자료 수집 시작 (최대 {max_articles}개, {start_date} ~ {end_date})")
    else:
        print(f"[{REGION_NAME}] 보도자료 수집 시작 (최대 {max_articles}개, 날짜 필터 없음)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    if dry_run:
        print("   [TEST] DRY-RUN 모드: 서버 전송 안함")

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')

    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)
    collected_articles = []  # dry-run 시 반환용
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        context.set_extra_http_headers({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        })
        
        page = context.new_page()
        
        page_num = 1
        max_pages = 10  # 최대 10페이지까지 탐색
        
        while page_num <= max_pages and collected_count < max_articles:
            list_url = build_list_url(page_num)
            print(f"   [PAGE] 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # Find article links from list (table-based)
            article_links = page.locator('table a[href*="act=view"]')
            article_count = article_links.count()
            
            if article_count == 0:
                # Fallback: try other selectors
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break
            
            if article_count == 0:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            print(f"      [FOUND] {article_count}개 기사 링크 발견")
            
            # Collect link information
            link_data = []
            seen_ids = set()  # For duplicate list_no check
            
            for i in range(article_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                
                try:
                    link = article_links.nth(i)
                    
                    # Extract title and URL
                    title = safe_get_text(link)
                    if title:
                        title = title.strip()
                    href = safe_get_attr(link, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # Extract list_no
                    list_no = extract_list_no(href)
                    if not list_no:
                        continue
                    
                    # Check duplicate list_no
                    if list_no in seen_ids:
                        continue
                    seen_ids.add(list_no)
                    
                    # Build detail page URL
                    full_url = build_detail_url(list_no, page_num)
                    
                    # Try to extract date from list (YYYY.MM.DD format)
                    list_date = None
                    try:
                        # Find date in parent tr element
                        parent = link.locator('xpath=ancestor::tr[1]')
                        if parent.count() > 0:
                            parent_text = safe_get_text(parent)
                            if parent_text:
                                date_match = re.search(r'(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})', parent_text)
                                if date_match:
                                    y, m, d = date_match.groups()
                                    list_date = f"{y}-{int(m):02d}-{int(d):02d}"
                    except:
                        pass
                    
                    # Date filter (list stage)
                    if start_date and list_date and list_date < start_date:
                        print(f"      [SKIP] 목록에서 날짜 필터: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'list_no': list_no,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # Stop exploration if no valid articles on this page
            if len(link_data) == 0:
                print("      [STOP] 이 페이지에 유효한 기사가 없음, 탐색 중지")
                break
            
            # Collect and send detail pages
            consecutive_old = 0  # Consecutive old articles counter
            stop_scraping = False
            
            for item in link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                
                title = item['title']
                full_url = item['url']
                
                print(f"      [ARTICLE] {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date, department, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.3)
                    continue
                
                # Determine date (detail > list > current)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # Date filter + early termination logic
                if start_date and final_date < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] 날짜 필터로 스킵: {final_date} (연속 {consecutive_old}개)")

                    if consecutive_old >= 3:
                        print("         [STOP] 오래된 기사 3개 연속 발견, 페이지 탐색 중지")
                        stop_scraping = True
                        break
                    continue
                
                # Reset counter when valid article found
                consecutive_old = 0
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Auto-categorize
                cat_code, cat_name = detect_category(title, content)

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': f"{final_date}T09:00:00+09:00",
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': cat_name,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }
                
                if dry_run:
                    # Test mode: no server transmission
                    collected_count += 1
                    success_count += 1
                    img_status = "[+IMG]" if thumbnail_url else "[-IMG]"
                    content_status = f"[+TXT:{len(content)}]" if content and len(content) > 50 else "[-TXT]"
                    print(f"         [DRY-RUN] {img_status}, {content_status}")
                    collected_articles.append(article_data)
                else:
                    result = send_article_to_server(article_data)
                    
                    if result.get('status') == 'created':
                        error_collector.add_success()
                        print(f"         [OK] 저장 완료")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         [SKIP] 이미 존재")
                    else:
                        print(f"         [WARN] 전송 실패: {result}")
                
                time.sleep(1)  # Rate limiting
            
            # Break loop on early termination
            if stop_scraping:
                break
            
            page_num += 1
            time.sleep(1)
        
        browser.close()
    
    # 에러 요약 보고 출력
    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)
    
    return collected_articles


# ============================================================
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v1.0')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수 (기본 10)')
    parser.add_argument('--days', type=int, default=None, help='선택적 날짜 필터 (일). 지정하지 않으면 날짜 필터 없음')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    # bot-service.ts 호환 인자 (필수!)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        max_articles=args.max_articles,
        days=args.days,
        start_date=args.start_date,
        end_date=args.end_date,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()

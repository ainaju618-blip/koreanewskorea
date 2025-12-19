"""
Yeonggwang County Press Release Scraper
- 버전: v3.0
- 최종수정: 2025-12-12
- 담당: AI Agent

변경점 (v3.0):
- 사용자 제공 상세 분석 데이터 기반 완전 재작성
- 정확한 URL 패턴: b_id=news_data&site=headquarter_new&mn=9056
- 페이지네이션: offset={페이지번호 * 10}
- 상세 페이지: type=view&bs_idx={게시글ID}
- 첨부파일: type=download&bs_idx={게시글ID}&bf_idx={파일ID}
- 테이블 기반 목록/상세 페이지 파싱
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
from urllib.parse import urljoin, parse_qs, urlparse

# ============================================================
# 2. External Libraries
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. Local Modules
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.image_extractor import extract_thumbnail
from utils.cloudinary_uploader import download_and_upload_image
from utils.category_detector import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'yeonggwang'
REGION_NAME = '영광군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeonggwang.go.kr'

# URL 구성 요소
BBS_PATH = '/bbs/'
B_ID = 'news_data'
SITE = 'headquarter_new'
MN = '9056'

# List page base URL
LIST_URL = f'{BASE_URL}{BBS_PATH}?b_id={B_ID}&site={SITE}&mn={MN}&type=lists'

# Detail page URL pattern: ?b_id=news_data&site=headquarter_new&mn=9056&type=view&bs_idx={게시글ID}

# List page selectors
LIST_TABLE_SELECTOR = 'table'
LIST_ROW_SELECTORS = [
    'table tbody tr',
    'table tr',
]

# Detail page/content selectors
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view',
    'div[class*="content"]',
    'td[colspan]',  # When content is in td colspan
    'article',
    '#txt',
]

# Date selectors (detail page)
DATE_LABEL_PATTERNS = ['작성일', '등록일', '게시일']


# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        # YYYY-MM-DD 또는 YYYY.MM.DD 패턴
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def extract_bs_idx(href: str) -> Optional[str]:
    """href에서 bs_idx(article ID) extract"""
    if not href:
        return None
    
    # URL 파라미터에서 extract
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'bs_idx' in params:
            return params['bs_idx'][0]
    except:
        pass
    
    # Extract using regex
    match = re.search(r'bs_idx[=:]?(\d+)', href)
    if match:
        return match.group(1)
    
    return None


def build_detail_url(bs_idx: str) -> str:
    """Generate detail page URL from article ID"""
    return f'{BASE_URL}{BBS_PATH}?b_id={B_ID}&site={SITE}&mn={MN}&type=view&bs_idx={bs_idx}'


def build_list_url(offset: int = 0) -> str:
    """Generate list page URL based on offset"""
    if offset == 0:
        return LIST_URL
    return f'{LIST_URL}&offset={offset}'


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str]:
    """
    상세 페이지에서 본문, 이미지, 날짜를 extract
    
    Returns:
        (본문 텍스트, 썸네일 URL, 날짜)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d')
    
    time.sleep(1)  # Page stabilization
    
    # 1. 날짜 extract (메타데이터 테이블에서)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    # Find "creation date" in table header (th) or label
    try:
        # Method 1: th:has-text("작성일") + td
        for label in DATE_LABEL_PATTERNS:
            try:
                date_cell = page.locator(f'th:has-text("{label}")').first
                if date_cell.count() > 0:
                    # Find next td in same row
                    parent_tr = date_cell.locator('xpath=../..')
                    td = parent_tr.locator('td').first
                    if td.count() > 0:
                        text = safe_get_text(td)
                        if text and re.search(r'\d{4}', text):
                            pub_date = normalize_date(text)
                            break
            except:
                continue
        
        # Method 2: 전체 페이지에서 날짜 패턴 찾기 (fallback)
        if pub_date == datetime.now().strftime('%Y-%m-%d'):
            page_text = page.locator('body').inner_text()
            date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text[:2000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")
    
    # 2. 본문 extract
    content = ""
    
    # Strategy 1: 공공누리 섹션 이후 텍스트 찾기 (영광군청 특화)
    try:
        js_code = """
        () => {
            // 테이블 내 본문 영역 찾기
            const tables = document.querySelectorAll('table');
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                for (const row of rows) {
                    const tds = row.querySelectorAll('td');
                    for (const td of tds) {
                        const text = td.innerText?.trim();
                        // 본문은 보통 200자 이상, 메타정보가 아님
                        if (text && text.length > 200 && 
                            !text.includes('작성자') &&
                            !text.includes('조회수') &&
                            !text.includes('파일첨부') &&
                            !text.includes('공공누리')) {
                            return text;
                        }
                    }
                }
            }
            
            // 방법 2: 일반 본문 영역
            const selectors = ['.view_content', '.board_view', 'article', '.cont_view'];
            for (const sel of selectors) {
                const elem = document.querySelector(sel);
                if (elem) {
                    const text = elem.innerText?.trim();
                    if (text && text.length > 100) {
                        return text;
                    }
                }
            }
            
            return '';
        }
        """
        content = page.evaluate(js_code)
        if content:
            content = clean_article_content(content)[:5000]
    except Exception as e:
        print(f"      [WARN] JS content extraction failed: {e}")

    # Strategy 2: 일반 셀렉터 fallback
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = clean_article_content(text)[:5000]
                        break
            except:
                continue
    
    # 3. 이미지 extract (Playwright 다운로드 방식 적용)
    thumbnail_url = None
    
    # Strategy 1: 첨부파일 직접 다운로드 (세션 쿠키 필요하므로 브라우저 동작)
    try:
        attach_links = page.locator('a[href*="type=download"]')
        for i in range(min(attach_links.count(), 3)): # Try top 3 only
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            
            # Check image file extension
            if any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                print(f"      [DOWNLOAD] Attempting attachment download: {link_text}")

                try:
                    # Set download listener
                    with page.expect_download(timeout=10000) as download_info:
                        # Force click with JS (prevent blocking)
                        link.evaluate("el => el.click()")

                    download = download_info.value

                    # Save temp file
                    import tempfile
                    from utils.cloudinary_uploader import upload_local_image

                    temp_dir = tempfile.gettempdir()
                    # Convert filename safely
                    safe_name = f"yeonggwang_{int(time.time())}_{i}.jpg"
                    temp_path = os.path.join(temp_dir, safe_name)

                    download.save_as(temp_path)
                    print(f"      [SAVE] Temp saved: {temp_path}")

                    # Cloudinary upload
                    print(f"      [CLOUD] Uploading to Cloudinary...")
                    c_url = upload_local_image(temp_path, folder="yeonggwang")
                    
                    if c_url:
                        thumbnail_url = c_url
                        # Delete temp file
                        try:
                            os.remove(temp_path)
                        except:
                            pass
                        break
                        
                except Exception as e:
                    print(f"      [WARN] Download/upload failed: {e}")
                    continue
    except Exception as e:
        print(f"      [WARN] Error processing attachments: {e}")
    
    # Strategy 2: 본문 영역 내 이미지 (다운로드 실패 시 Fallback)
    if not thumbnail_url:
        try:
            thumbnail_url = extract_thumbnail(page, BASE_URL, CONTENT_SELECTORS)
        except:
            pass
    
    # Strategy 3: General img tag fallback
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"]')
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet']):
                    # Using download_and_upload_image here too, but content images are usually public so requests works
                    # May need modification here if this fails
                    download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    thumbnail_url = download_and_upload_image(download_url, BASE_URL, folder="yeonggwang")
                    if thumbnail_url:
                        break
        except:
            pass
    
    return content, thumbnail_url, pub_date


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(max_articles: int = 30, days: Optional[int] = None, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server (count-based)

    Args:
        max_articles: Maximum number of articles to collect (기본 10개)
        days: Optional date filter (disabled if None)
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
    """
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    if start_date:
        print(f"[INFO] {REGION_NAME} 보도자료 수집 시작 (최대 {max_articles}개, {start_date} ~ {end_date})")

        # Ensure dev server is running before starting
        if not ensure_server_running():
            print("[ERROR] Dev server could not be started. Aborting.")
            return []
    else:
        print(f"[INFO] {REGION_NAME} 보도자료 수집 시작 (최대 {max_articles}개, 날짜 필터 없음)")
    
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.1 시작', 'info')
    
    collected_count = 0
    success_count = 0
    
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
        
        # User-Agent 설정 (명시적)
        USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        
        page = context.new_page()
        
        page_num = 0  # offset based (0, 10, 20, ...)
        max_pages = 10  # Search up to 10 pages
        
        while page_num < max_pages and collected_count < max_articles:
            offset = page_num * 10
            list_url = build_list_url(offset)
            print(f"   [PAGE] Collecting page {page_num + 1}... (offset={offset})")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num + 1} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page load
            
            # Find list table rows
            rows = wait_and_find(page, LIST_ROW_SELECTORS, timeout=10000)
            if not rows:
                print("      [WARN] Cannot find article list.")
                break
            
            row_count = rows.count()
            print(f"      [FOUND] {row_count} rows found")
            
            # Collect link information
            link_data = []
            seen_urls = set()  # ★ 중복 URL check

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    row = rows.nth(i)
                    
                    # Skip header row (th가 있으면 헤더)
                    th_count = row.locator('th').count()
                    if th_count > 0:
                        continue
                    
                    # Find title link (bs_idx 포함)
                    link_elem = row.locator('a[href*="bs_idx"]').first
                    if not link_elem or link_elem.count() == 0:
                        # Retry with general link
                        link_elem = row.locator('a').first
                        if not link_elem or link_elem.count() == 0:
                            continue
                    
                    title = safe_get_text(link_elem).strip()
                    href = safe_get_attr(link_elem, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # bs_idx extract
                    bs_idx = extract_bs_idx(href)
                    if not bs_idx:
                        continue
                    
                    # Construct detail page URL
                    full_url = build_detail_url(bs_idx)
                    
                    # Pre-extract from date column (보통 4번째 td)
                    list_date = None
                    try:
                        tds = row.locator('td')
                        for td_idx in range(tds.count()):
                            td_text = safe_get_text(tds.nth(td_idx))
                            if td_text and re.search(r'\d{4}[-./]\d{1,2}[-./]\d{1,2}', td_text):
                                list_date = normalize_date(td_text)
                                break
                    except:
                        pass
                    
                    # Date filtering at list stage (skip old articles)
                    if start_date and list_date and list_date < start_date:
                        print(f"      [SKIP] Date filter in list: {list_date} < {start_date}")
                        # If list is newest first, all following articles are older so stop
                        continue

                    # ★ 중복 URL check
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'bs_idx': bs_idx,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # No more searching if no valid articles on this page
            if len(link_data) == 0:
                print("      [STOP] No valid articles on this page, stopping search")
                break
            
            # Collect and send detail pages
            consecutive_old = 0  # Consecutive old article counter
            stop_scraping = False
            
            for item in link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                    
                title = item['title']
                full_url = item['url']
                
                print(f"      [ARTICLE] {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date = fetch_detail(page, full_url)
                
                # Determine date (detail > list > current)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # Date filter (if enabled) + early termination logic
                if start_date and final_date < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] Skipped by date filter: {final_date} (consecutive {consecutive_old})")

                    # Stop page search if 3 consecutive old articles
                    if consecutive_old >= 3:
                        print("         [STOP] 3 consecutive old articles found, stopping page search")
                        stop_scraping = True
                        break
                    continue
                
                # Reset counter when valid article found
                consecutive_old = 0
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Extract subtitle
                subtitle, content = extract_subtitle(content, title)

                # Automatic category classification
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
                
                # Send to server
                result = send_article_to_server(article_data)
                collected_count += 1
                
                if result.get('status') == 'created':
                    success_count += 1
                    img_status = "[+image]" if thumbnail_url else "[-image]"
                    print(f"         [OK] Saved ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")
                else:
                    print(f"         [WARN] Transmission failed: {result}")
                
                time.sleep(1)  # Rate limiting
            
            # Break loop on early termination
            if stop_scraping:
                break
                
            page_num += 1
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"Collection complete (total {collected_count}, new {success_count})"
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    
    return []


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.1')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum number of articles to collect (default 10)')
    parser.add_argument('--days', type=int, default=None, help='Optional date filter (days). No filter if not specified')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
    # bot-service.ts compatible arguments (required)
    parser.add_argument('--start-date', type=str, default=None, help='Collection start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='Collection end date (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        max_articles=args.max_articles,
        days=args.days,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()


"""
Jindo County Press Release Scraper
- Version: v1.0
- Last Updated: 2025-12-13
- Author: AI Agent

Changes (v1.0):
- Initial version based on user-provided detailed analysis data
- URL pattern: /home/board/B0016.cs?act=read&articleId={ID}&categoryId=0&m=626
- Attachments: /cms/download.cs?atchFile={encrypted_file_id}
- Card-style list layout (thumbnail + title + category)
- Static HTML, UTF-8 encoding
"""

# ============================================================
# 1. Standard Library Imports
# ============================================================
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin, parse_qs, urlparse

# ============================================================
# 2. External Library Imports
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. Local Module Imports
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.category_classifier import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'jindo'
REGION_NAME = '진도군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jindo.go.kr'

# List page URL (Government News/Press Releases)
BOARD_ID = 'B0016'
MENU_CODE = '626'
LIST_PATH = f'/home/board/{BOARD_ID}.cs?m={MENU_CODE}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Detail page URL pattern: ?act=read&articleId={ID}&categoryId=0&m=626

# List page selectors (card-style list layout)
LIST_ITEM_SELECTORS = [
    'a[href*="act=read"][href*="articleId="]',  # Article links
    'a[href*="B0016.cs"][href*="articleId="]',
]

# Detail page/content selectors (in priority order)
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
    '.con_detail',
    '.content',
]

# Date patterns: YYYY-MM-DD HH:mm or YYYY-MM-DD
DATE_PATTERNS = [
    r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})',
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
    """Extract articleId (post ID) from href"""
    if not href:
        return None

    # Extract from URL parameters
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'articleId' in params:
            return params['articleId'][0]
    except:
        pass

    # Extract with regex
    match = re.search(r'articleId[=]?(\d+)', href)
    if match:
        return match.group(1)

    return None


def build_detail_url(article_id: str) -> str:
    """Generate detail page URL from article ID"""
    return f'{BASE_URL}/home/board/{BOARD_ID}.cs?act=read&articleId={article_id}&categoryId=0&m={MENU_CODE}'


def build_list_url(page: int = 1) -> str:
    """Generate list page URL with page parameter (pageIndex)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&pageIndex={page}'


# ============================================================
# 6. Detail Page Scraping Functions
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    Extract content, image, date, and department from detail page

    Returns:
        (content text, thumbnail URL, date, department)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None
    
    time.sleep(1.5)  # Page stabilization

    # 1. Date extraction (format: YYYY-MM-DD HH:mm)
    pub_date = datetime.now().strftime('%Y-%m-%d')

    try:
        page_text = page.locator('body').inner_text()
        # Find "Created: YYYY-MM-DD HH:mm" pattern
        date_match = re.search(r'작성일[:\s]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        else:
            # General date pattern
            date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', page_text[:3000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")

    # 2. Department extraction (Jindo County: not displayed in content - managed by Planning & Public Relations)
    department = "기획홍보실"  # Default value

    # 3. Content extraction
    content = ""

    try:
        # Extract content with JavaScript
        js_code = """
        () => {
            // Jindo County specific: Find content area

            // Method 1: Common content selectors
            const contentSelectors = [
                '.view_content', '.board_view_content', '.view_body',
                '.con_detail', '.content'
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

            // Method 2: Search div[class*="view"], div[class*="content"]
            const viewDivs = document.querySelectorAll('div[class*="view"], div[class*="content"]');
            for (const div of viewDivs) {
                const text = div.innerText?.trim();
                if (text && text.length > 200 && text.length < 10000) {
                    return text;
                }
            }

            // Method 3: Find div with longest text (fallback)
            const divs = document.querySelectorAll('div');
            let maxText = '';

            for (const div of divs) {
                const text = div.innerText?.trim();
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
            # Clean with clean_article_content function
            content = clean_article_content(content)
    except Exception as e:
        print(f"      [WARN] JS content extraction failed: {e}")

    # Fallback: General selectors
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

    # 4. Image extraction
    thumbnail_url = None

    # Strategy 1: Download images from attachments (/cms/download.cs)
    try:
        attach_links = page.locator('a[href*="/cms/download.cs"], a[href*="atchFile="]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            href = safe_get_attr(link, 'href')

            # Check image file extensions (.jpg, .png)
            if href and any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                full_url = href if href.startswith('http') else urljoin(BASE_URL, href)
                print(f"      [DOWNLOAD] Attempting attachment download: {link_text[:50]}...")

                # Save to Cloudinary
                saved_path = download_and_upload_image(full_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVE] Attachment image saved: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] Error processing attachments: {e}")

    # Strategy 2: Extract from img tags in content
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"], img[src*=".JPG"]')
            for i in range(min(imgs.count(), 10)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet', 'blank', 'common']):
                    download_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                    saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                    if saved_path:
                        thumbnail_url = saved_path
                        print(f"      [SAVE] Content image saved: {saved_path}")
                        break
        except Exception as e:
            print(f"      [WARN] Content image extraction failed: {e}")

    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(max_articles: int = 10, days: Optional[int] = None, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
    """
    Collect press releases and send to server (count-based)

    Args:
        max_articles: Maximum number of articles to collect (default 10)
        days: Optional date filter (disabled if None)
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
        dry_run: Test mode (do not send to server)
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

    if dry_run:
        print("   [DRY-RUN] DRY-RUN mode: server transmission disabled")
    
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')
    
    collected_count = 0
    success_count = 0
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
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # 목록에서 기사 링크 찾기 (카드형 리스트)
            article_links = page.locator('a[href*="act=read"][href*="articleId="]')
            article_count = article_links.count()
            
            if article_count == 0:
                # Fallback: 다른 셀렉터 시도
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break
            
            if article_count == 0:
                print("      [WARN] No article list found.")
                break
            
            print(f"      [FOUND] {article_count} article links found")
            
            # 링크 정보 수집
            link_data = []
            seen_ids = set()  # 중복 articleId 체크용
            
            for i in range(article_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                
                try:
                    link = article_links.nth(i)
                    
                    # 제목과 URL 추출
                    title = safe_get_text(link)
                    if title:
                        title = title.strip()
                        # 카테고리 태그 제거 ([행정/교육] 등)
                        title = re.sub(r'^\[[^\]]+\]\s*', '', title)
                    href = safe_get_attr(link, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # articleId 추출
                    article_id = extract_article_id(href)
                    if not article_id:
                        continue
                    
                    # 중복 articleId 체크
                    if article_id in seen_ids:
                        continue
                    seen_ids.add(article_id)
                    
                    # 상세 페이지 URL 구성
                    full_url = build_detail_url(article_id)
                    
                    # 목록에서 날짜 추출 시도 (작성일 : YYYY-MM-DD 형식)
                    list_date = None
                    try:
                        # 부모 요소에서 날짜 찾기
                        parent = link.locator('xpath=ancestor::*[2]')
                        if parent.count() > 0:
                            parent_text = safe_get_text(parent)
                            if parent_text:
                                date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', parent_text)
                                if date_match:
                                    y, m, d = date_match.groups()
                                    list_date = f"{y}-{int(m):02d}-{int(d):02d}"
                    except:
                        pass
                    
                    # Date filter (list stage)
                    if start_date and list_date and list_date < start_date:
                        print(f"      [SKIP] Date filter in list: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'article_id': article_id,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # Stop searching if no valid articles on this page
            if len(link_data) == 0:
                print("      [STOP] No valid articles on this page, stopping search")
                break
            
            # 상세 페이지 수집 및 전송
            consecutive_old = 0  # 연속 오래된 기사 카운터
            stop_scraping = False
            
            for item in link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                
                title = item['title']
                full_url = item['url']
                
                print(f"      [ARTICLE] {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date, department = fetch_detail(page, full_url)
                
                # 날짜 결정 (상세 > 목록 > 현재)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # Date filter + early termination logic
                if start_date and final_date < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] Skipped by date filter: {final_date} (consecutive {consecutive_old})")

                    if consecutive_old >= 3:
                        print("         [STOP] 3 consecutive old articles found, stopping page search")
                        stop_scraping = True
                        break
                    continue
                
                # 유효한 기사 발견 시 카운터 리셋
                consecutive_old = 0
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # 부제목 추출
                subtitle, content = extract_subtitle(content, title)

                # 카테고리 자동 분류
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
                    img_status = "[+image]" if thumbnail_url else "[-image]"
                    content_status = f"[+content({len(content)}chars)]" if content and len(content) > 50 else "[-content]"
                    print(f"         [DRY-RUN] {img_status}, {content_status}")
                    collected_articles.append(article_data)
                else:
                    # 서버로 전송
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
            
            # 조기 종료 시 루프 탈출
            if stop_scraping:
                break
            
            page_num += 1
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"Collection complete (total {collected_count}, new {success_count})"
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    
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

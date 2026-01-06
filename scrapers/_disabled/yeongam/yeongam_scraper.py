"""
Yeongam County Press Release Scraper
- 버전: v1.0
- 최종수정: 2025-12-13
- 담당: AI Agent

변경점 (v1.0):
- 사용자 제공 상세 분석 데이터 기반 최초 작성
- URL 패턴: /home/www/open_information/yeongam_news/bodo/show/{고유ID}
- 이미지: 본문 내 직접 삽입 방식 (별도 첨부파일 없음)
- Card-style list layout (thumbnail + title + summary)
- GOV-Webware 기반 CMS
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
REGION_CODE = 'yeongam'
REGION_NAME = '영암군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeongam.go.kr'

# List page URL (press releases)
LIST_PATH = '/home/www/open_information/yeongam_news/bodo/yeongam.go'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Detail page URL pattern: /home/www/open_information/yeongam_news/bodo/show/{고유ID}
DETAIL_PATH_PREFIX = '/home/www/open_information/yeongam_news/bodo/show'

# List page selectors (card-style list layout)
LIST_ITEM_SELECTORS = [
    'a[href*="/bodo/show/"]',  # Article link
    'a[href*="yeongam_news/bodo/show"]',
]

# Detail page/content selectors (priority order) - Yeongam specific
CONTENT_SELECTORS = [
    '.con_detail',        # Yeongam content (top priority)
    '.show_info',         # Yeongam information area
    '.view_content',
    '.board_view_content',
    '.view_body',
]

# Date pattern: YYYY-MM-DD HH:mm 또는 YYYY-MM-DD
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
    """href에서 게시글 고유 ID extract (영문+숫자 조합 랜덤 문자열)"""
    if not href:
        return None
    
    # /bodo/show/{ID} 패턴에서 ID extract
    match = re.search(r'/bodo/show/([a-zA-Z0-9]+)', href)
    if match:
        return match.group(1)
    
    # /show/{ID} 패턴
    match = re.search(r'/show/([a-zA-Z0-9]+)', href)
    if match:
        return match.group(1)
    
    return None


def build_detail_url(article_id: str) -> str:
    """Generate detail page URL from article ID"""
    return f'{BASE_URL}{DETAIL_PATH_PREFIX}/{article_id}'


def build_list_url(page: int = 1) -> str:
    """Generate list page URL based on page number (?page=N 파라미터)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}?page={page}'


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str, title: str = "") -> Tuple[str, Optional[str], Optional[str], str, Optional[str], Optional[str]]:
    """
    상세 페이지에서 본문, 부제목, 이미지, 날짜, 담당부서를 extract
    
    Returns:
        (content text, subtitle, thumbnail URL, date, department, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"
    
    time.sleep(1.5)  # Page stabilization
    
    # 1. 날짜 extract (형식: YYYY-MM-DD)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        # 시간 포함 패턴 (YYYY-MM-DD HH:mm)
        dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:2000])
        if dt_match:
            y, m, d, hh, mm = dt_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
            # YYYY-MM-DD 패턴 찾기 (제목 아래)
            date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', page_text[:2000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] Date extraction failed: {e}")
    
    # 2. 담당부서 extract (본문 하단 "(부서명 담당자 전화번호)" 패턴)
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "끝" 뒤에 "(부서명 담당자 전화번호)" 패턴
        dept_match = re.search(r'\(([가-힣]+(?:과|실|팀|면|읍|동))\s+담당자?\s*\d{3}-\d{3,4}-\d{4}\)', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
        else:
            # Other pattern: "(부서명 전화번호)" 
            dept_match = re.search(r'\(([가-힣]+(?:과|실|팀|면|읍|동))\s+\d{3}', page_text)
            if dept_match:
                department = dept_match.group(1).strip()
    except Exception as e:
        print(f"      [WARN] Department extraction failed: {e}")
    
    # 3. 본문 extract
    content = ""
    
    try:
        # JavaScript로 본문 extract (영암군 특화)
        js_code = """
        () => {
            // 영암군 특화: .con_detail, .show_info 우선 탐색
            
            // 방법 1: 영암군 특화 선택자
            const yeongamSelectors = ['.con_detail', '.show_info', '.secondDiv'];
            for (const sel of yeongamSelectors) {
                const elem = document.querySelector(sel);
                if (elem) {
                    const text = elem.innerText?.trim();
                    if (text && text.length > 50) {
                        return text;
                    }
                }
            }
            
            // 방법 2: 일반적인 콘텐츠 선택자
            const contentSelectors = [
                '.view_content', '.board_view_content', '.view_body'
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
            
            return '';
        }
        """
        content = page.evaluate(js_code)
        if content:
            # Remove meta information
            content = re.sub(r'조회수\s*[:\s]*\d+', '', content)
            content = content.strip()[:5000]
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
                        content = text[:5000]
                        break
            except:
                continue

    # Clean content (clean_article_content 적용)
    if content:
        content = clean_article_content(content)

    # Extract subtitle
    subtitle, content = extract_subtitle(content, title)

    # 4. 이미지 extract (본문 내 직접 삽입 방식 - 영암군은 이미지가 없음)
    thumbnail_url = None
    
    # Strategy 1: 본문 영역(.con_detail, .show_info) 내 이미지
    try:
        # Yeongam content rarely has images - only icons/logos
        # SSL 인증서 오류로 다운로드가 실패할 수 있음
        imgs = page.locator('.con_detail img, .show_info img')
        for i in range(min(imgs.count(), 5)):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'sitemap', 'sns', 'main2', 'sub']):
                download_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVE] Content image saved: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] Content image extraction failed: {e}")
    
    # Strategy 2: 일반 콘텐츠 이미지 (본문에 없는 경우)
    if not thumbnail_url:
        try:
            all_imgs = page.locator('img')
            for i in range(min(all_imgs.count(), 15)):
                src = safe_get_attr(all_imgs.nth(i), 'src')
                if src and any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png']):
                    if not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'sitemap', 'sns', 'main2', 'sub', 'common']):
                        download_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                        saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                        if saved_path:
                            thumbnail_url = saved_path
                            print(f"      [SAVE] General image saved: {saved_path}")
                            break
        except Exception as e:
            print(f"      [WARN] General image extraction failed: {e}")

    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, None, pub_date, department, ErrorCollector.IMAGE_MISSING
    
    return content, subtitle, thumbnail_url, pub_date, department, None  # success


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(max_articles: int = 30, days: Optional[int] = None, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
    """
    Collect press releases and send to server (count-based)

    Args:
        max_articles: Maximum number of articles to collect (기본 10개)
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
    
    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)
    collected_articles = []  # dry-run 시 반환용
    success_count = 0  # Initialize for dry-run mode
    
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
        max_pages = 10  # Search up to 10 pages
        collected_count = 0  # Initialize collected_count
        
        while page_num <= max_pages and collected_count < max_articles:
            list_url = build_list_url(page_num)
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page load
            
            # Find article links in list (카드형 리스트)
            article_links = page.locator('a[href*="/bodo/show/"]')
            article_count = article_links.count()
            
            if article_count == 0:
                # Fallback: Try other selectors
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break
            
            if article_count == 0:
                print("      [WARN] Cannot find article list.")
                break
            
            print(f"      [FOUND] {article_count} article links found")
            
            # Collect link information
            link_data = []
            seen_ids = set()  # Duplicate ID check
            
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
                    
                    # article ID extract
                    article_id = extract_article_id(href)
                    if not article_id:
                        continue
                    
                    # Duplicate ID check
                    if article_id in seen_ids:
                        continue
                    seen_ids.add(article_id)
                    
                    # Construct detail page URL
                    full_url = build_detail_url(article_id)
                    
                    # Try extracting date from list (작성자 / YYYY-MM-DD HH:mm 형식)
                    list_date = None
                    try:
                        # Find date in parent element
                        parent = link.locator('xpath=ancestor::*[1]')
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
            
            # Pre-check duplicates before visiting detail pages (optimization)
            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            # Filter out already existing articles
            new_link_data = [item for item in link_data if item['url'] not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

            # Collect and send detail pages
            consecutive_old = 0  # Consecutive old article counter
            stop_scraping = False

            for item in new_link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                
                title = item['title']
                full_url = item['url']
                
                print(f"      [ARTICLE] {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                print(f"      [ARTICLE] {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                content, subtitle, thumbnail_url, detail_date, department, error_reason = fetch_detail(page, full_url, title)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.5)
                    continue
                
                # Determine date (detail > list > current)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # Date filter + early termination logic
                # 날짜 비교 시 시간이 포함될 수 있으므로 날짜 부분만 비교
                if len(final_date) > 10: 
                    final_date_only = final_date[:10]
                else:
                    final_date_only = final_date

                if start_date and final_date_only < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] Skipped by date filter: {final_date} (consecutive {consecutive_old})")

                    if consecutive_old >= 3:
                        print("         [STOP] 3 consecutive old articles found, stopping page search")
                        stop_scraping = True
                        break
                    continue
                
                # Reset counter when valid article found
                consecutive_old = 0
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Automatic category classification
                cat_code, cat_name = detect_category(title, content)

                # published_at 처리 (시간 포함 여부 확인)
                if 'T' in final_date and '+09:00' in final_date:
                     published_at = final_date
                else:
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
                
                if dry_run:
                    # Test mode: no server transmission
                    collected_count += 1
                    success_count += 1
                    img_status = "[+image]" if thumbnail_url else "[-image]"
                    content_status = f"[+content({len(content)}chars)]" if content and len(content) > 50 else "[-content]"
                    print(f"         [DRY-RUN] {img_status}, {content_status}")
                    collected_articles.append(article_data)
                else:
                    # Send to server
                    result = send_article_to_server(article_data)
                    
                    if result.get('status') == 'created':
                        error_collector.add_success()
                        img_status = "[+image]" if thumbnail_url else "[-image]"
                        print(f"         [OK] Saved ({img_status})")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         [SKIP] Already exists")
                    else:
                        print(f"         [WARN] Transmission failed: {result}")
                
                collected_count += 1
                
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
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v1.0')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum number of articles to collect (default 10)')
    parser.add_argument('--days', type=int, default=None, help='Optional date filter (days). No filter if not specified')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
    # bot-service.ts compatible arguments (required!)
    parser.add_argument('--start-date', type=str, default=None, help='Collection start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='Collection end date (YYYY-MM-DD)')
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

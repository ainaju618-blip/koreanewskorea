"""
Hampyeong County Press Release Scraper
- 버전: v1.0
- 최종수정: 2025-12-13
- 담당: AI Agent

변경점 (v1.0):
- 사용자 제공 상세 분석 데이터 기반 최초 작성
- URL 패턴: /boardView.do?pageId=www275&boardId=NEWS&seq={ID}&movePage=1&recordCnt=10
- 첨부파일: /fileDownload.do?fileSe=BB&fileKey=NEWS%7C{fileKey}&fileSn={seq}
- Table format list (number, title, author, date, file, views)
- 정적 HTML, UTF-8 인코딩
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_classifier import detect_category


def safe_str(text: str) -> str:
    """Safely encode text for Windows console output (cp949)"""
    try:
        return text.encode('cp949', errors='replace').decode('cp949')
    except:
        return text


# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'hampyeong'
REGION_NAME = '함평군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.hampyeong.go.kr'

# List page URL (press/clarification)
BOARD_ID = 'NEWS'
PAGE_ID = 'www275'
LIST_PATH = f'/boardList.do?boardId={BOARD_ID}&pageId={PAGE_ID}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Detail page URL pattern: /boardView.do?pageId=www275&boardId=NEWS&seq={ID}&movePage=1&recordCnt=10

# List page selectors (table format)
LIST_ITEM_SELECTORS = [
    'a[href*="boardView.do"][href*="seq="]',  # Article link
    'a[href*="boardId=NEWS"][href*="seq="]',
]

# Detail page/content selectors (priority order)
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
    '.con_detail',
    '.content',
]

# Date pattern: YYYY-MM-DD HH:MM 또는 YYYY-MM-DD
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


def extract_seq_id(href: str) -> Optional[str]:
    """href에서 seq(article ID) extract"""
    if not href:
        return None
    
    # URL 파라미터에서 extract
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'seq' in params:
            return params['seq'][0]
    except:
        pass
    
    # Extract using regex
    match = re.search(r'seq[=]?(\d+)', href)
    if match:
        return match.group(1)
    
    return None


def build_detail_url(seq_id: str, page: int = 1) -> str:
    """article ID(seq)로 상세 페이지 URL 생성"""
    return f'{BASE_URL}/boardView.do?pageId={PAGE_ID}&boardId={BOARD_ID}&seq={seq_id}&movePage={page}&recordCnt=10'


def build_list_url(page: int = 1) -> str:
    """Generate list page URL based on page number (movePage 파라미터)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&movePage={page}'


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, image, date, and department from detail page

    Returns:
        (content text, thumbnail URL, date, department, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"
    
    time.sleep(1.5)  # Page stabilization
    
    # 1. 날짜 extract (형식: YYYY-MM-DD HH:MM)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        # "작성일 : YYYY-MM-DD HH:MM" 패턴 찾기
        date_match = re.search(r'작성일\s*[:\s]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text)
        if date_match:
            y, m, d, hh, mm = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
            # "작성일 : YYYY-MM-DD" 패턴 (시간 없을 경우)
            date_match = re.search(r'작성일\s*[:\s]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
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
        print(f"      [WARN] 날짜 extract 실패: {e}")
    
    # 2. 담당부서 extract (본문 내 별도 기재)
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "작성자 : {부서명}" 패턴
        dept_match = re.search(r'작성자\s*[:\s]*([가-힣]+(?:과|실|팀|읍|면|창))', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
    except Exception as e:
        print(f"      [WARN] 담당부서 extract 실패: {e}")
    
    # 3. 본문 extract
    content = ""
    
    try:
        # JavaScript로 본문 extract
        js_code = """
        () => {
            // 함평군 특화: 본문 콘텐츠 영역 찾기
            
            // 방법 1: 일반적인 콘텐츠 선택자
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
            
            // 방법 2: div[class*="view"], div[class*="content"] 탐색
            const viewDivs = document.querySelectorAll('div[class*="view"], div[class*="content"]');
            for (const div of viewDivs) {
                const text = div.innerText?.trim();
                if (text && text.length > 200 && text.length < 10000) {
                    return text;
                }
            }
            
            // 방법 3: 가장 긴 텍스트를 가진 div 찾기 (폴백)
            const divs = document.querySelectorAll('div');
            let maxText = '';
            
            for (const div of divs) {
                const text = div.innerText?.trim();
                if (text && text.length > maxText.length && 
                    !text.includes('로그인') && !text.includes('회원가입') &&
                    !text.includes('function') && !text.includes('var ') &&
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
            # Remove meta info and JavaScript code
            content = re.sub(r'작성일\s*[:\s]*[^\n]+', '', content)
            content = re.sub(r'작성자\s*[:\s]*[^\n]+', '', content)
            content = re.sub(r'조회수?\s*[:\s]*\d+', '', content)
            content = re.sub(r'첨부파일[^\n]*', '', content)
            content = re.sub(r'function\s*\([^)]*\)\s*\{[^}]*\}', '', content)
            content = re.sub(r'var\s+\w+\s*=', '', content)
            content = content.strip()[:5000]
    except Exception as e:
        print(f"      [WARN] JS 본문 extract 실패: {e}")
    
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

    # Clean content
    if content:
        content = clean_article_content(content)

    # 4. 이미지 extract
    thumbnail_url = None
    
    # Strategy 1: 첨부파일 다운로드 링크에서 이미지 extract (/fileDownload.do)
    try:
        attach_links = page.locator('a[href*="fileDownload.do"], a[href*="fileSe=BB"]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            href = safe_get_attr(link, 'href')
            
            # Check image file extension (.jpg, .png)
            if href and any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                full_url = href if href.startswith('http') else urljoin(BASE_URL, href)
                print(f"      [DOWNLOAD] 첨부파일 다운로드 시도: {link_text[:50]}...")

                # Save locally
                saved_path = download_and_upload_image(full_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVE] 첨부파일 이미지 저장: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] 첨부파일 처리 중 오류: {e}")
    
    # Strategy 2: 본문 내 img 태그에서 extract
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
                        print(f"      [SAVE] 본문 이미지 저장: {saved_path}")
                        break
        except Exception as e:
            print(f"      [WARN] 본문 이미지 extract 실패: {e}")
    
    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING
    
    return content, thumbnail_url, pub_date, department, None  # success


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
        print("   [DRY-RUN] 모드: 서버 전송 안함")
    
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
        max_pages = 10  # Search up to 10 pages
        collected_count = 0  # Initialize collected_count
        success_count = 0  # Initialize success_count

        while page_num <= max_pages and collected_count < max_articles:
            list_url = build_list_url(page_num)
            print(f"   [PAGE] 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page load
            
            # Find article links in list (테이블 형식)
            article_links = page.locator('a[href*="boardView.do"][href*="seq="]')
            article_count = article_links.count()
            
            if article_count == 0:
                # Fallback: Try other selectors
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break
            
            if article_count == 0:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            print(f"      [INFO] {article_count}개 Article link 발견")
            
            # Collect link information
            link_data = []
            seen_ids = set()  # Duplicate seq check
            
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
                    
                    # seq extract
                    seq_id = extract_seq_id(href)
                    if not seq_id:
                        continue
                    
                    # Duplicate seq check
                    if seq_id in seen_ids:
                        continue
                    seen_ids.add(seq_id)
                    
                    # Construct detail page URL
                    full_url = build_detail_url(seq_id, page_num)
                    
                    # Try extracting date from list (YYYY-MM-DD 형식)
                    list_date = None
                    try:
                        # Find date in parent row
                        parent = link.locator('xpath=ancestor::tr[1]')
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
                        print(f"      [SKIP] 목록에서 날짜 필터: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'seq_id': seq_id,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # Stop search if no valid articles on this page
            if len(link_data) == 0:
                print("      [STOP] 이 페이지에 유효한 기사가 없음, 탐색 중지")
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

                print(f"      [ARTICLE] {safe_str(title[:40])}...")
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
                # 날짜만 추출해서 비교
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date

                if start_date and date_only < start_date:
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
                    img_status = "[O]이미지" if thumbnail_url else "[X]이미지"
                    content_status = f"[O]본문({len(content)}자)" if content and len(content) > 50 else "[X]본문"
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

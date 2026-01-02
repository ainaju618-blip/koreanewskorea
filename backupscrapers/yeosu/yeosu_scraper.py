"""
Yeosu City Press Release Scraper
- Version: v2.1
- Last Modified: 2025-12-24
- Responsible: AI Agent

Special Notes:
- URL pattern: ?idx={ID}&mode=view
- Pagination: ?page={N}
- Images: attachment or content -> web/public/images/yeosu/ local save

Changes (v2.1):
- Fixed image detection: added ybmodule.file pattern for content images
- Fixed attachment detection: file_download links without extension check
- Priority: content images first (more reliable), then attachments

Changes (v2.0):
- cloudinary_uploader -> local_image_saver transition
- Image path: /images/yeosu/{filename} format returned
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
from urllib.parse import urljoin, unquote

# ============================================================
# 2. External Libraries
# ============================================================
from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth

# ============================================================
# 3. Local Modules
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_classifier import detect_category

# ============================================================
# 4. Constants Definition
# ============================================================
REGION_CODE = 'yeosu'
REGION_NAME = '여수시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeosu.go.kr'
LIST_URL = 'https://www.yeosu.go.kr/www/govt/news/release/press'

# Pagination: ?page={N}
# Detail page: ?idx={게시물ID}&mode=view

# List link selectors
LIST_LINK_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',
    'a.basic_cont',
]

# Content page selectors
CONTENT_SELECTORS = [
    '.view_cont',
    '.board_view',
    '.content_view',
    'div.view_content',
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
        # YYYY-MM-DD or YYYY.MM.DD 패턴
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def extract_article_id(href: str) -> Optional[str]:
    """Extract idx parameter from href"""
    if not href:
        return None
    match = re.search(r'idx=(\d+)', href)
    return match.group(1) if match else None


# ============================================================
# 6. Detail Page Collection Function
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
    
    time.sleep(1.5)  # Wait for page loading
    
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    content = ""
    thumbnail_url = None
    
    # 1. JavaScript로 정보 추출 (여수시 페이지 구조에 최적화)
    # 전략: og:description 메타태그 활용 + board_view 내 p 태그 텍스트 추출
    try:
        js_code = """
        () => {
            const result = {date: '', department: '', content: ''};
            
            // 1. og:description 메타태그에서 본문 추출 (가장 정확함)
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) {
                result.content = ogDesc.getAttribute('content') || '';
            }
            
            // 2. board_view 내에서 메타정보와 추가 본문 추출
            const boardView = document.querySelector('.board_view, div.board_view');
            if (boardView) {
                // dl 내에서 date, department 추출
                const dlInfo = boardView.querySelector('dl');
                if (dlInfo) {
                    const dts = dlInfo.querySelectorAll('dt');
                    const dds = dlInfo.querySelectorAll('dd');
                    
                    for (let i = 0; i < dts.length; i++) {
                        const dtText = dts[i]?.innerText?.trim() || '';
                        const ddText = dds[i]?.innerText?.trim() || '';
                        
                        if (dtText.includes('registration date')) {
                            result.date = ddText;
                        }
                        if (dtText.includes('department')) {
                            result.department = ddText;
                        }
                    }
                }
                
                // If og:description is empty, extract content from p tags
                if (!result.content || result.content.length < 50) {
                    const paragraphs = boardView.querySelectorAll('p');
                    let pTexts = [];
                    for (const p of paragraphs) {
                        const text = p.innerText?.trim();
                        if (text && text.length > 10) {
                            pTexts.push(text);
                        }
                    }
                    if (pTexts.length > 0) {
                        result.content = pTexts.join('\\n\\n');
                    }
                }
                
                // If still empty, extract from entire board_view (exclude meta info)
                if (!result.content || result.content.length < 50) {
                    const fullText = boardView.innerText || '';
                    // Extract text after contact info
                    const lines = fullText.split('\\n');
                    let contentLines = [];
                    let foundContact = false;
                    
                    for (const line of lines) {
                        // Collect from after contact line
                        if (line.match(/\\d{2,4}-\\d{3,4}-\\d{4}/)) {
                            foundContact = true;
                            continue;
                        }
                        if (foundContact && line.trim().length > 5) {
                            // Exclude footer/menu text
                            if (!line.includes('사이트맵') && 
                                !line.includes('개인정보') && 
                                !line.includes('만족하십니까') &&
                                !line.includes('첨부파days')) {
                                contentLines.push(line.trim());
                            }
                        }
                    }
                    if (contentLines.length > 0) {
                        result.content = contentLines.join('\\n');
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
            content = data['content'][:5000]
            
        # 1-1. Extract Time if available in meta tags or content
        # 여수시: registration date에 시간이 포함되어 있는지 확인하거나 본문에서 추출
        # Pattern: "2024-12-21 15:30"
        if data.get('date'):
             # Check if date has time
            dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', data['date'])
            if dt_match:
                y, m, d, hh, mm = dt_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        
        # Fallback: scan page text for time pattern
        if pub_date == datetime.now().strftime('%Y-%m-%d') or 'T' not in pub_date:
             page_text = page.locator('body').inner_text()
             dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:5000])
             if dt_match:
                y, m, d, hh, mm = dt_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"

    except Exception as e:
        print(f"      [WARN] JS 추출 실패: {e}")
    
    # Fallback: days반 셀렉터
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
    
    # 2. IMAGE EXTRACTION - Content images FIRST (more reliable for Yeosu)
    # Yeosu pattern: ./ybmodule.file/board/www_press/980x1x100/{filename}.jpg
    try:
        # 2-1. Look for content images with ybmodule.file pattern (Yeosu-specific)
        content_imgs = page.locator('img[src*="ybmodule.file"], img[src*="board/www_press"]')
        content_img_count = content_imgs.count()
        print(f"      [INFO] Content images (ybmodule): {content_img_count}")

        if content_img_count > 0:
            for i in range(min(content_img_count, 5)):
                img = content_imgs.nth(i)
                src = safe_get_attr(img, 'src')
                if src:
                    # Check if it's a real content image (not icon/button)
                    if any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                        continue

                    # Build full URL (handle relative paths like ./ybmodule.file/...)
                    if src.startswith('./'):
                        full_url = urljoin(url, src)  # Use current page URL as base
                    elif src.startswith('/'):
                        full_url = urljoin(BASE_URL, src)
                    elif not src.startswith('http'):
                        full_url = urljoin(BASE_URL, src)
                    else:
                        full_url = src

                    print(f"      [IMG] Content image found: {src[:60]}...")
                    local_path = download_and_upload_image(full_url, BASE_URL, REGION_CODE)
                    if local_path:
                        thumbnail_url = local_path
                        print(f"      [SAVED] Local save complete: {local_path}")
                        break
                    else:
                        # Try original URL if local save fails
                        thumbnail_url = full_url
                        print(f"      [FALLBACK] Using original URL")
                        break
    except Exception as e:
        print(f"      [WARN] Content image extraction failed: {e}")

    # 2-2. Fallback: general board_view images
    if not thumbnail_url:
        try:
            imgs = page.locator('.board_view img, .view_cont img, .content_view img, article img')
            img_count = imgs.count()
            print(f"      [INFO] General board images: {img_count}")

            for i in range(min(img_count, 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet', 'top', 'bottom']):
                    # Build full URL
                    if src.startswith('./'):
                        full_url = urljoin(url, src)
                    elif src.startswith('/'):
                        full_url = urljoin(BASE_URL, src)
                    elif not src.startswith('http'):
                        full_url = urljoin(BASE_URL, src)
                    else:
                        full_url = src

                    print(f"      [IMG] Board image found: {src[:50]}...")
                    local_path = download_and_upload_image(full_url, BASE_URL, REGION_CODE)
                    if local_path:
                        thumbnail_url = local_path
                        print(f"      [SAVED] Local save complete")
                        break
                    else:
                        thumbnail_url = full_url
                        break
        except Exception as e:
            print(f"      [WARN] Board image extraction failed: {e}")

    # 2-3. Final fallback: attachment file_download links (less reliable)
    if not thumbnail_url:
        try:
            attach_links = page.locator('a[href*="file_download"]')
            attach_count = attach_links.count()
            print(f"      [INFO] Attachment links: {attach_count}")

            if attach_count > 0:
                for i in range(min(attach_count, 5)):
                    link = attach_links.nth(i)
                    href = link.get_attribute('href') or ''
                    try:
                        link_text = link.text_content() or ''
                    except:
                        link_text = safe_get_text(link) or ''

                    print(f"      [FILE] Attachment #{i}: {link_text[:40]}...")

                    # Check if it's likely an image file (by extension in filename or URL)
                    is_image = any(ext in link_text.lower() or ext in href.lower()
                                  for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])

                    # Also accept file_download links even without clear extension
                    # if it's the first attachment (often the main image)
                    if (is_image or i == 0) and href:
                        full_url = urljoin(BASE_URL, href) if not href.startswith('http') else href
                        print(f"      [IMG] Trying attachment as image...")

                        local_path = download_and_upload_image(full_url, BASE_URL, REGION_CODE)
                        if local_path:
                            thumbnail_url = local_path
                            print(f"      [SAVED] Attachment saved: {local_path}")
                            break
        except Exception as e:
            print(f"      [WARN] Attachment processing failed: {e}")

    # Clean content
    content = clean_article_content(content)

    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, department, None  # success


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, dry_run: bool = False, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server

    Args:
        days: Collection period (days)
        max_articles: Maximum number of articles to collect
        dry_run: Test mode (no server transmission)
        start_date: 수집 시작days (YYYY-MM-DD)
        end_date: 수집 종료days (YYYY-MM-DD)
    """
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}days)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    if not dry_run:
        log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')

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
        
        # Apply stealth mode to bypass bot detection
        stealth = Stealth()
        stealth.apply_stealth_sync(page)
        
        page_num = 1
        stop = False
        collected_count = 0  # Initialize collected_count
        
        while page_num <= 5 and not stop and collected_count < max_articles:
            # 여수시 페이지네이션: ?page={N}
            list_url = f'{LIST_URL}?page={page_num}' if page_num > 1 else LIST_URL
            print(f"   [PAGE] 페이지 {page_num} 수집 중...")
            if not dry_run:
                log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page loading
            
            # Find list links
            links = wait_and_find(page, LIST_LINK_SELECTORS, timeout=10000)
            if not links:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            link_count = links.count()
            print(f"      [FOUND] {link_count}articles found")
            
            # Collect link information
            link_data = []
            seen_urls = set()  # ★ 중복 URL 체크용

            for i in range(link_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    link = links.nth(i)

                    title = safe_get_text(link)
                    title = title.strip() if title else ""
                    # "새로운글" 제거
                    title = title.replace('새로운글', '').strip()

                    href = safe_get_attr(link, 'href')

                    if not title or not href:
                        continue

                    # idx= 파라미터 확인
                    if 'idx=' not in href:
                        continue

                    # Build detail page URL
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)

                    # ★ 중복 URL 체크
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

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

            # Collect and send detail pages
            for item in new_link_data:
                if collected_count >= max_articles:
                    break
                    
                title = item['title']
                full_url = item['url']
                
                print(f"      [ARTICLE] {title[:40]}...")
                if not dry_run:
                    log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, pub_date, department, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.3)
                    continue

                # date 필터링
                date_only = pub_date.split('T')[0] if 'T' in pub_date else pub_date
                if date_only < start_date:
                    stop = True
                    break

                if not content:
                    content = f"본문 content을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # 부title 추출
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
                
                if dry_run:
                    print(f"         [DRY-RUN] title: {title[:30]}...")
                    print(f"         [DRY-RUN] date: {pub_date}")
                    print(f"         [DRY-RUN] 본문: {len(content)}자")
                    print(f"         [DRY-RUN] 이미지: {'있음' if thumbnail_url else '없음'}")
                else:
                    result = send_article_to_server(article_data)
                    
                    if result.get('status') == 'created':
                        error_collector.add_success()
                        print(f"         [OK] 저장 완료")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         [SKIP] 이미 존재")
                
                time.sleep(0.5)  # Rate limiting
            
            page_num += 1
            if stop:
                print("      [STOP] 수집 기간 초과, 종료합니다.")
                break
            
            time.sleep(1)
        
        browser.close()
    
    # 에러 요약 보고 출력
    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[OK] {final_msg}")
    if not dry_run:
        log_to_server(REGION_CODE, 'success', final_msg, 'success',
                      created_count=error_collector.success_count,
                      skipped_count=error_collector.skip_count)
    
    return []


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v2.0')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (days)')
    parser.add_argument('--max-articles', type=int, default=10, help='Maximum number of articles to collect')
    parser.add_argument('--dry-run', action='store_true', help='Test mode (no server transmission)')
    # bot-service.ts compatible arguments (required)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작days (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료days (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        dry_run=args.dry_run,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

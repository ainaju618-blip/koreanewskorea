"""
Mokpo City Press Release Scraper
- Version: v3.0
- Last Modified: 2025-12-12
- Responsible: AI Agent

Changes (v3.0):
- 사용자 제공 상세 가이드 기반 완전 재작성
- URL 패턴: ?idx={ID}&mode=view
- 이미지 URL 패턴: ybmodule.file/board/www_report_material/
- 카드형 레이아웃 대응 (a[href*="idx="][href*="mode=view"])
- Cloudinary 업로드 통합
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.text_cleaner import clean_article_content
from utils.category_detector import detect_category

# ============================================================
# 4. Constants Definition
# ============================================================
REGION_CODE = 'mokpo'
REGION_NAME = '목포시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.mokpo.go.kr'
LIST_URL = 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material'

# Pagination: ?page={N}
# Detail page: ?idx={게시물ID}&mode=view

# List page selectors (카드형 레이아웃)
LIST_ITEM_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',  # 가이드 기반 정확한 셀렉터
    'a.item_cont',
    '.list_item a',
]

# Content page selectors
CONTENT_SELECTORS = [
    'div.viewbox',
    'div.module_view_box',
    'div.board_view_cont',
    'section[role="region"]',
]

# Mokpo-specific image patterns
MOKPO_IMAGE_PATTERNS = [
    'ybmodule.file/board/www_report_material',  # Content image path
    'build/images/',  # Thumbnail image path
]


# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """
    Normalize date string to YYYY-MM-DD format
    
    목포시 Date format:
    - List: YYYY-MM-DD (e.g.: 2025-12-11)
    - Detail: YYYY.MM.DD (e.g.: 2025.12.11)
    """
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
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str]:
    """
    Extract content, images, and date from detail page
    
    Returns:
        (content text, thumbnail URL, date)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d')
    
    time.sleep(1)  # Page stabilization
    
    # 1. date 추출 (상세 페이지: YYYY.MM.DD 형식)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    try:
        # 페이지 전체에서 date 패턴 찾기
        page_text = page.locator('body').inner_text()
        date_match = re.search(r'(\d{4})\.(\d{2})\.(\d{2})', page_text[:3000])
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    
    # 2. 본문 추출
    content = ""
    
    # 전략 1: JavaScript 기반 추출 (region 내 본문)
    try:
        js_code = """
        () => {
            // Find main content area
            const mainArea = document.querySelector('section[role="region"]') ||
                           document.querySelector('div.viewbox') ||
                           document.querySelector('div.module_view_box');
            
            if (!mainArea) return '';
            
            // Extract text from content area
            // Text block after image is the content
            const textBlocks = mainArea.querySelectorAll('div, p');
            let longestText = '';
            
            for (const block of textBlocks) {
                const text = block.innerText?.trim();
                if (text && text.length > longestText.length && 
                    text.length < 8000 && 
                    !text.includes('첨부파days') &&
                    !text.includes('사이트맵') &&
                    !text.includes('개인정보')) {
                    longestText = text;
                }
            }
            
            return longestText;
        }
        """
        content = page.evaluate(js_code)
        if content:
            content = content[:5000]
    except Exception as e:
        print(f"      [WARN] JS 본문 추출 실패: {e}")
    
    # 전략 2: days반 셀렉터 fallback
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

    # 3. 이미지 추출
    thumbnail_url = None
    
    # 전략 1: 목포시 본문 이미지 패턴에서 직접 찾기
    for pattern in MOKPO_IMAGE_PATTERNS:
        imgs = page.locator(f'img[src*="{pattern}"]')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src:
                full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                # Cloudinary 업로드
                cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                else:
                    thumbnail_url = full_url
                break
    
    # 전략 2: 본문 영역 내 days반 이미지
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            for i in range(min(imgs.count(), 3)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                    full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    # Cloudinary 업로드
                    cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                    else:
                        thumbnail_url = full_url
                    break
            if thumbnail_url:
                break
    
    return content, thumbnail_url, pub_date


# ============================================================
# 7. Main Collection Function
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server

    Args:
        days: Collection period (days)
        max_articles: Maximum number of articles to collect
        start_date: 수집 시작days (YYYY-MM-DD)
        end_date: 수집 종료days (YYYY-MM-DD)
    """
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}days)")

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
    success_count = 0
    skipped_count = 0
    
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
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page loading
            
            # Find list items (카드형 레이아웃)
            items = wait_and_find(page, LIST_ITEM_SELECTORS, timeout=10000)
            if not items:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            item_count = items.count()
            print(f"      [FOUND] {item_count}articles found")
            
            # Collect link information
            link_data = []
            seen_urls = set()  # ★ 중복 URL 체크용

            for i in range(item_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    item = items.nth(i)
                    
                    # title 추출 (h3 or 첫 번째 자식)
                    title_elem = item.locator('h3')
                    if title_elem.count() > 0:
                        title = safe_get_text(title_elem)
                    else:
                        title = safe_get_text(item)
                    
                    title = title.strip() if title else ""
                    
                    href = safe_get_attr(item, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # Build detail page URL
                    if href.startswith('http'):
                        full_url = href
                    elif 'idx=' in href:
                        full_url = urljoin(BASE_URL, href)
                    else:
                        continue
                    
                    # date 추출 (목록에서 - YYYY-MM-DD 형식)
                    try:
                        # 카드 내 date 요소 찾기
                        date_text = item.inner_text()
                        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_text)
                        n_date = date_match.group(1) if date_match else None
                    except:
                        n_date = None
                    
                    # date 필터링 (가능한 경우)
                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    # ★ 중복 URL 체크
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'list_date': n_date
                    })

                except Exception as e:
                    continue

            # Collect and send detail pages
            for item in link_data:
                if collected_count >= max_articles:
                    break
                    
                title = item['title']
                full_url = item['url']
                
                print(f"      [ARTICLE] {title[:35]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date = fetch_detail(page, full_url)
                
                # date 결정 (상세 > 목록)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # date 필터링 (상세 페이지에서 얻은 정확한 date로)
                if final_date < start_date:
                    stop = True
                    break
                
                if not content:
                    content = f"본문 content을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # 부title 추출
                subtitle, content = extract_subtitle(content, title)

                # Auto-classify category
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
                    img_status = "[+IMG]" if thumbnail_url else "[-IMG]"
                    print(f"         [OK] 저장 완료 ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    skipped_count += 1
                    print(f"         [SKIP] 이미 존재")
                
                time.sleep(0.5)  # Rate limiting
            
            page_num += 1
            if stop:
                print("      [STOP] 수집 기간 초과, 종료합니다.")
                break
            
            time.sleep(1)
        
        browser.close()

    if skipped_count > 0:
        final_msg = f"Completed: {success_count} new, {skipped_count} duplicates"
    else:
        final_msg = f"Completed: {success_count} new articles"
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success', created_count=success_count, skipped_count=skipped_count)
    
    return []


# ============================================================
# 8. CLI Entry Point
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.0')
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
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

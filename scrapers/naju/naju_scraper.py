"""
Naju City Press Release Scraper
- Version: v3.0
- Last Modified: 2025-12-11
- Maintainer: AI Agent

Changes (v3.0):
- URL pattern refined: ?idx={ID}&mode=view
- Image URL pattern: ybmodule.file/board_gov/www_report/
- Optimized content/date selectors
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
from urllib.parse import urljoin

# ============================================================
# 2. 외부 라이브러리
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. 로컬 모듈
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, extract_subtitle
from utils.content_cleaner import clean_article_content
from utils.category_detector import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'naju'
REGION_NAME = '나주시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.naju.go.kr'
LIST_URL = 'https://www.naju.go.kr/www/administration/reporting/coverage'

# Pagination: ?page={N}
# 상세 페이지: ?idx={게시물ID}&mode=view

# 목록 페이지 셀렉터 (행 기준)
LIST_ROW_SELECTORS = [
    'table.list tbody tr',
    'table tbody tr',
    '.board_list tbody tr',
]

# 본문 페이지 셀렉터 (디버그 분석 결과 기반)
CONTENT_SELECTORS = [
    'div.view_box',  # ⭐ 나주시 정확한 셀렉터 (디버그 스크립트로 확인)
    '.board_view_area',
    'div.view_content',
    'div.board_view',
    'div.bd_view',
    'article.view',
    '.content_view',
]

# 이미지 파일 패턴 (나주시 특화)
NAJU_IMAGE_PATTERNS = [
    'ybmodule.file/board_gov/www_report',  # 나주시 이미지 저장 경로
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
        # YYYY-MM-DD 또는 YYYY.MM.DD 패턴
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


# ============================================================
# 6. 상세 페이지 수집 함수
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
    
    # 1. Extract date
    pub_date = datetime.now().strftime('%Y-%m-%d')
    date_selectors = [
        '.view_info .date',
        '.board_info span:has-text("작성일")',   # 작성일 우선
        '.board_info span:has-text("등록일")',
        'dd:has-text("20")',
        'span:has-text("2025")',
        '.info_area span',
        'th:has-text("작성일") + td',
    ]
    for sel in date_selectors:
        try:
            elem = page.locator(sel).first
            if elem.count() > 0:
                text = safe_get_text(elem)
                if text and re.search(r'\d{4}', text):
                    pub_date = normalize_date(text)
                    break
        except:
            continue
    
    # Find date pattern in entire page (fallback)
    if pub_date == datetime.now().strftime('%Y-%m-%d'):
        try:
            page_text = page.locator('body').inner_text()
            date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text[:3000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        except:
            pass
    
    # 2. Extract content (based on external analysis - 2025-12-12)
    # 핵심: #right 또는 section[role="region"] 내에서 img 다음 div가 본문
    content = ""
    
    # Strategy 1: Exact structure-based extraction (JavaScript)
    try:
        js_code = """
        () => {
            // Find main content area
            const mainArea = document.querySelector('#right') || 
                           document.querySelector('section[role="region"]') ||
                           document.querySelector('.sub_content');
            
            if (!mainArea) return '';
            
            // Method 1: Find div after img tag (content location)
            const img = mainArea.querySelector('img[alt]');
            if (img) {
                let nextSibling = img.nextElementSibling;
                while (nextSibling) {
                    if (nextSibling.tagName === 'DIV') {
                        const text = nextSibling.innerText?.trim();
                        // Content is usually 100+ chars, not attachment area
                        if (text && text.length > 100 && !text.includes('첨부파일')) {
                            return text;
                        }
                    }
                    nextSibling = nextSibling.nextElementSibling;
                }
            }
            
            // Method 2: Find div after metadata ul
            const metaList = mainArea.querySelector('ul');
            if (metaList) {
                let nextSibling = metaList.nextElementSibling;
                // Skip img and find next div
                while (nextSibling) {
                    if (nextSibling.tagName === 'DIV') {
                        const text = nextSibling.innerText?.trim();
                        if (text && text.length > 100 && !text.includes('첨부파일')) {
                            return text;
                        }
                    }
                    nextSibling = nextSibling.nextElementSibling;
                }
            }
            
            // Method 3: Find div with longest text (fallback)
            const divs = mainArea.querySelectorAll('div');
            let longestText = '';
            for (const div of divs) {
                const text = div.innerText?.trim();
                if (text && text.length > longestText.length && 
                    text.length < 5000 && 
                    !text.includes('첨부파일') &&
                    !text.includes('사이트맵') &&
                    !text.includes('민원')) {
                    longestText = text;
                }
            }
            
            return longestText;
        }
        """
        content = page.evaluate(js_code)
        if content:
            content = clean_article_content(content)
            content = content[:5000]
    except Exception as e:
        print(f"      [WARN] JS 본문 추출 실패: {e}")
    
    # Strategy 2: General selector fallback
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = clean_article_content(text)
                        content = content[:5000]
                        break
            except:
                continue
    
    # 3. Extract images (Naju City specific)
    thumbnail_url = None
    
    # Strategy 1: Find from Naju City image path pattern
    for pattern in NAJU_IMAGE_PATTERNS:
        imgs = page.locator(f'img[src*="{pattern}"]')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src:
                thumbnail_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                break
    
    # Strategy 2: Find images from attachments
    if not thumbnail_url:
        attach_links = page.locator('a[href*="download"], a[href*="file"]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            title = safe_get_attr(link, 'title') or safe_get_text(link) or ''
            href = safe_get_attr(link, 'href') or ''
            if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                thumbnail_url = urljoin(BASE_URL, href) if href else None
                break
    
    # Strategy 3: Images within content area
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            for i in range(min(imgs.count(), 3)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg']):
                    thumbnail_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    break
            if thumbnail_url:
                break
    
    return content, thumbnail_url, pub_date


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server (with date filtering)

    Args:
        days: Collection period (days) - used when start_date/end_date not provided
        max_articles: Maximum number of articles to collect
        start_date: Collection start date (YYYY-MM-DD)
        end_date: Collection end date (YYYY-MM-DD)
    """
    # Calculate date filter (prioritize start_date/end_date if provided)
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"[{REGION_NAME}] 보도자료 수집 시작 (기간: {start_date} ~ {end_date})")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.0 시작 ({start_date}~{end_date})', 'info')

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
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # Find list rows
            rows = wait_and_find(page, LIST_ROW_SELECTORS, timeout=10000)
            if not rows:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            row_count = rows.count()
            print(f"      [FOUND] {row_count}개 행 발견")
            
            # Collect link information
            link_data = []
            seen_urls = set()  # Duplicate URL check

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    row = rows.nth(i)
                    
                    # Skip notice/header rows
                    row_classes = safe_get_attr(row, 'class') or ''
                    if 'notice' in row_classes.lower() or 'header' in row_classes.lower():
                        continue
                    
                    # Find title link
                    link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0:
                        continue
                    
                    title = safe_get_text(link_elem).strip()
                    href = safe_get_attr(link_elem, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # Build detail page URL
                    if href.startswith('http'):
                        full_url = href
                    elif 'idx=' in href or 'mode=view' in href:
                        full_url = urljoin(BASE_URL, href)
                    else:
                        continue
                    
                    # Pre-extract from date column (from list)
                    try:
                        date_cell = row.locator('td').nth(3)  # 보통 4번째 컬럼
                        list_date = safe_get_text(date_cell)
                        n_date = normalize_date(list_date) if list_date else None
                    except:
                        n_date = None
                    
                    # Date filtering (when possible)
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
                
                # Determine date (detail > list)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # Date filtering (with accurate date from detail page)
                if final_date < start_date:
                    stop = True
                    break
                
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
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.0')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    # bot-service.ts 호환 인자 (필수)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    # start_date, end_date를 collect_articles에 전달 (날짜 필터링 활성화)
    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

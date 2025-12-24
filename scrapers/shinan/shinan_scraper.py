"""
Shinan County Press Release Scraper
- Version: v2.0
- Last Modified: 2025-12-13
- Responsible: AI Agent

Site Features:
- wscms 기반 사이트
- 목록 URL: https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms
- 상세 페이지: /show/{ID} 패턴
- 페이지네이션: ?page={N}
- 본문 구조: table.show_form 내 label 태그 기반
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_detector import detect_category

# ============================================================
# 4. Constants Definition
# ============================================================
REGION_CODE = 'shinan'
REGION_NAME = '신안군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.shinan.go.kr'
LIST_URL = 'https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms'

# List page selectors
LIST_ITEM_SELECTORS = [
    'table.bbsListTbl tbody tr',
    'table tbody tr',
    '.bbs_list tbody tr',
]

# Content page selectors
CONTENT_SELECTORS = [
    'div.bbsV_cont',
    'div.view_content',
    'div.board_view',
    'div.contents',
    'div.con-wrap',
    'section[role="region"]',
]


# ============================================================
# 5. Utility Functions
# ============================================================
def normalize_date(date_str: str) -> str:
    """
    Normalize date string to YYYY-MM-DD format
    
    신안군 Date format:
    - List: YYYY-MM-DD or YYYY.MM.DD
    """
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
    """Extract article ID from href (/show/{ID} 패턴)"""
    if not href:
        return None
    # /show/{ID} 패턴
    match = re.search(r'/show/(\d+)', href)
    if match:
        return match.group(1)
    # idx={ID} 패턴 (폴백)
    match = re.search(r'idx=(\d+)', href)
    return match.group(1) if match else None


# ============================================================
# 6. Detail Page Collection Function
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    Extract content, images, and date from detail page
    
    신안군 Detail page structure:
    - table.show_form: Main table
    - <label>title</label> -> 다음 td에 title
    - <label>content</label> -> 다음 td에 본문
    - <label>registration date</label> -> 다음 td에 date
    
    Returns:
        (content text, thumbnail URL, date, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), "PAGE_LOAD_FAIL"
    
    time.sleep(1.5)  # Page stabilization
    
    # JavaScript로 label 기반 데이터 추출
    try:
        result = page.evaluate("""
        () => {
            const data = {
                content: '',
                date: '',
                images: []
            };
            
            // table.show_form 내에서 label 기반으로 데이터 추출
            const labels = document.querySelectorAll('table.show_form label, table label');
            
            for (const label of labels) {
                const labelText = label.innerText?.trim();
                
                // 부모 th/td의 다음 형제 td에서 값 추출
                const parentCell = label.closest('th') || label.closest('td');
                const valueCell = parentCell?.nextElementSibling;
                
                if (!valueCell) continue;
                
                if (labelText === 'content') {
                    // 본문 추출 - HTML 태그 유지하며 텍스트 추출
                    data.content = valueCell.innerText?.trim() || '';
                    
                    // 본문 내 이미지 추출
                    const imgs = valueCell.querySelectorAll('img');
                    for (const img of imgs) {
                        const src = img.src;
                        if (src && !src.includes('icon') && !src.includes('btn') && 
                            !src.includes('logo') && !src.includes('bullet')) {
                            data.images.push(src);
                        }
                    }
                }
                else if (labelText === 'registration date') {
                    data.date = valueCell.innerText?.trim() || '';
                }
            }
            
            // 폴백: label이 없는 경우 가장 긴 td 찾기
            if (!data.content) {
                const tds = document.querySelectorAll('table td');
                let longestTd = null;
                let maxLen = 0;
                
                for (const td of tds) {
                    const text = td.innerText?.trim();
                    // 메뉴 텍스트 제외
                    if (text && text.length > maxLen && text.length < 10000 &&
                        !text.includes('신안군소개') && 
                        !text.includes('전자민원') &&
                        !text.includes('열린군정') &&
                        !text.includes('참여마당') &&
                        !text.includes('분야별정보') &&
                        !text.includes('사이트맵')) {
                        maxLen = text.length;
                        longestTd = td;
                    }
                }
                
                if (longestTd && maxLen > 50) {
                    data.content = longestTd.innerText?.trim();
                    
                    // 이미지 추출
                    const imgs = longestTd.querySelectorAll('img');
                    for (const img of imgs) {
                        const src = img.src;
                        if (src && !src.includes('icon') && !src.includes('btn')) {
                            data.images.push(src);
                        }
                    }
                }
            }
            
            // 첨부파days에서 이미지 URL 찾기
            if (data.images.length === 0) {
                const attachments = document.querySelectorAll('a[href*="download"], a[href*="/data/"]');
                for (const a of attachments) {
                    const href = a.href;
                    if (href && (href.includes('.jpg') || href.includes('.jpeg') || 
                                 href.includes('.png') || href.includes('.gif'))) {
                        data.images.push(href);
                    }
                }
            }
            
            // 본문 내 인라인 이미지 URL 패턴 찾기 (img 태그가 아닌 경우)
            if (data.images.length === 0) {
                const allImgs = document.querySelectorAll('img[src*="/board/data/"], img[src*="/images/board/"]');
                for (const img of allImgs) {
                    const src = img.src;
                    if (src && !src.includes('list') && !src.includes('admin') &&
                        !src.includes('icon') && !src.includes('btn')) {
                        data.images.push(src);
                    }
                }
            }
            
            return data;
        }
        """)
        
        content = result.get('content', '')
        date_str = result.get('date', '')
        images = result.get('images', [])
        
    except Exception as e:
        print(f"      [WARN] JS extraction failed: {e}")
        content = ""
        date_str = ""
        images = []
    
    # date 파싱
    # date 파싱
    pub_date = datetime.now().strftime('%Y-%m-%d')
    if date_str:
        # 1. Try YYYY-MM-DD HH:mm
        dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', date_str)
        if dt_match:
            y, m, d, hh, mm = dt_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
        else:
            # 2. Fallback YYYY-MM-DD
            date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    
    # Clean content - clean_article_content 함수 사용
    content = clean_article_content(content)
    
    # Process images
    thumbnail_url = None
    if images:
        for img_url in images[:3]:  # 최대 3개 시도
            try:
                full_url = urljoin(BASE_URL, img_url) if not img_url.startswith('http') else img_url
                # Cloudinary 업로드
                cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                    break
                else:
                    thumbnail_url = full_url
                    break
            except Exception as e:
                continue
    
    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, ErrorCollector.IMAGE_MISSING
    
    return content, thumbnail_url, pub_date, None  # success


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
    print(f"[INFO] {REGION_NAME} 보도자료 수집 시작 (최근 {days}days)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')

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
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # Wait for page loading
            
            # Find list items
            items = None
            for sel in LIST_ITEM_SELECTORS:
                try:
                    rows = page.locator(sel)
                    if rows.count() > 0:
                        items = rows
                        break
                except:
                    continue

            if not items:
                # Alternative: find /show/ pattern in all links
                try:
                    items = page.locator('a[href*="/show/"]')
                    if items.count() == 0:
                        print("      [WARN] Cannot find article list.")
                        break
                except:
                    print("      [WARN] Cannot find article list.")
                    break
            
            item_count = items.count()
            print(f"      [FOUND] {item_count} articles found")
            
            # Collect link information
            link_data = []
            seen_urls = set()

            for i in range(item_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    item = items.nth(i)
                    
                    # tr인 경우 내부 a 태그에서 링크 추출
                    link_elem = item.locator('a[href*="/show/"]')
                    if link_elem.count() == 0:
                        link_elem = item.locator('a').first
                    else:
                        link_elem = link_elem.first
                    
                    if link_elem.count() == 0:
                        # item 자체가 a 태그인 경우
                        href = safe_get_attr(item, 'href')
                        title = safe_get_text(item)
                    else:
                        href = safe_get_attr(link_elem, 'href')
                        title = safe_get_text(link_elem)
                    
                    title = title.strip() if title else ""
                    
                    if not title or not href:
                        continue
                    
                    # title 정리 (불필요한 텍스트 제거)
                    title = re.sub(r'\s+', ' ', title).strip()
                    
                    # Build detail page URL
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)
                    
                    # date 추출 (목록 행에서)
                    try:
                        row_text = item.inner_text()
                        date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', row_text)
                        if date_match:
                            y, m, d = date_match.groups()
                            n_date = f"{y}-{int(m):02d}-{int(d):02d}"
                        else:
                            n_date = None
                    except:
                        n_date = None
                    
                    # date 필터링
                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    # Check for duplicate URLs
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
                
                print(f"      [ARTICLE] {title[:35]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.5)
                    continue

                # date 결정 (상세 > 목록)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')

                # date 필터링 (상세 페이지에서 얻은 정확한 date로)
                # 날짜만 추출해서 비교
                date_only = final_date.split('T')[0] if 'T' in final_date else final_date
                
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
                
                # Send to server
                result = send_article_to_server(article_data)
                
                if result.get('status') == 'created':
                    error_collector.add_success()
                    img_status = "[+image]" if thumbnail_url else "[-image]"
                    print(f"         [OK] Saved ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] Already exists")
                
                collected_count += 1
                
                time.sleep(0.5)  # Rate limiting
            
            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded, stopping.")
                break
            
            time.sleep(1)
        
        browser.close()
    
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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v1.0')
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

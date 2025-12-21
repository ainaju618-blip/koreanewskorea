"""
Wando County Press Release Scraper
- Version: v1.0
- Last Modified: 2025-12-13
- Maintainer: AI Agent

Changes (v1.0):
- Initial implementation based on user-provided detailed analysis data
- URL Pattern: /wando/sub.cs?m=1023&nttId={ID}&pBoardId=BBSMSTR_000000000036
- Attachments: ws.wando.go.kr/ext/html5fileupload/fileDownload.do
- Card-style grid layout (2 large cards at top + list view)
- Static HTML, UTF-8 encoding
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
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.category_detector import detect_category

# ============================================================
# 4. Constants
# ============================================================
REGION_CODE = 'wando'
REGION_NAME = '완도군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.wando.go.kr'
FILE_SERVER_URL = 'https://ws.wando.go.kr'

# List page URL (press releases)
LIST_MENU = '299'
DETAIL_MENU = '1023'
BOARD_ID = 'BBSMSTR_000000000036'
LIST_PATH = f'/wando/sub.cs?m={LIST_MENU}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# Detail page URL pattern: /wando/sub.cs?m=1023&nttId={ID}&pBoardId=BBSMSTR_000000000036

# List page selectors (card-style grid layout)
LIST_ITEM_SELECTORS = [
    'a[href*="nttId="][href*="pBoardId="]',  # Article links
    'a[href*="sub.cs"][href*="nttId="]',
]

# Detail page/content selectors (priority order)
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
    '.con-wrap',
    'article',
]

# Date patterns: YYYY-MM-DD
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


def extract_ntt_id(href: str) -> Optional[str]:
    """href에서 nttId(게시글 ID) 추출"""
    if not href:
        return None
    
    # URL 파라미터에서 추출
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'nttId' in params:
            return params['nttId'][0]
    except:
        pass
    
    # 정규식으로 추출
    match = re.search(r'nttId[=]?(\d+)', href)
    if match:
        return match.group(1)
    
    return None


def build_detail_url(ntt_id: str) -> str:
    """게시글 ID(nttId)로 상세 페이지 URL 생성"""
    return f'{BASE_URL}/wando/sub.cs?m={DETAIL_MENU}&nttId={ntt_id}&pBoardId={BOARD_ID}'


def build_list_url(page: int = 1) -> str:
    """page 기반 목록 페이지 URL 생성 (pageIndex 파라미터)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&pageIndex={page}'


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 담당부서를 추출

    Returns:
        (본문 텍스트, 썸네일 URL, 날짜, 담당부서, error_reason)
        - error_reason is None on success
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, "PAGE_LOAD_FAIL"
    
    time.sleep(1.5)  # 페이지 안정화
    
    # 1. 날짜 추출 (형식: YYYY-MM-DD)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        # "작성일" 관련 패턴 찾기
        date_match = re.search(r'작성일[^\d]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        else:
            # 시간 포함 패턴 시도 (YYYY-MM-DD HH:mm)
            dt_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})', page_text[:3000])
            if dt_match:
                 y, m, d, hh, mm = dt_match.groups()
                 pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
            else:
                 # 일반 날짜 패턴
                 date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', page_text[:3000])
                 if date_match:
                     y, m, d = date_match.groups()
                     pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] 날짜 추출 실패: {e}")
    
    # 2. 등록자 추출 (형식: "등록자 : 박여진")
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "등록자 : 박여진" 패턴
        author_match = re.search(r'등록자\s*[:\s]+([가-힣]+)', page_text)
        if author_match:
            department = author_match.group(1).strip()
    except Exception as e:
        print(f"      [WARN] 등록자 추출 실패: {e}")
    
    # 3. 본문 추출
    content = ""
    
    try:
        # JavaScript로 본문 추출
        js_code = """
        () => {
            // 완도군 특화: 본문 콘텐츠 영역 찾기
            
            // 방법 1: 일반적인 콘텐츠 선택자
            const contentSelectors = [
                '.view_content', '.board_view_content', '.view_body',
                '.con-wrap', 'article'
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
            
            // 방법 2: div[class*="view"] 탐색
            const viewDivs = document.querySelectorAll('div[class*="view"], div[class*="content"]');
            for (const div of viewDivs) {
                const text = div.innerText?.trim();
                if (text && text.length > 200 && text.length < 10000) {
                    return text;
                }
            }
            
            // 방법 3: 가장 긴 텍스트를 가진 div 찾기
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
            # 메타정보 제거
            content = re.sub(r'작성일\s*[:\s]+[^\n]+', '', content)
            content = re.sub(r'등록자\s*[:\s]+[^\n]+', '', content)
            content = re.sub(r'조회수\s*[:\s]+\d+', '', content)
            content = re.sub(r'첨부파일\s*\(\d+\)[^\n]*', '', content)
            content = clean_article_content(content)
            content = content.strip()[:5000]
    except Exception as e:
        print(f"      [WARN] JS 본문 추출 실패: {e}")
    
    # Fallback: 일반 셀렉터
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
    
    # 4. 이미지 추출
    thumbnail_url = None
    
    # 전략 1: 첨부파일 다운로드 링크에서 이미지 추출 (ws.wando.go.kr)
    try:
        attach_links = page.locator('a[href*="fileDownload.do"], a[href*="ws.wando.go.kr"]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            href = safe_get_attr(link, 'href')
            
            # 이미지 파일 확장자 확인 (.jpg, .JPG, .png)
            if href and any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                full_url = href if href.startswith('http') else urljoin(FILE_SERVER_URL, href)
                print(f"      [DOWNLOAD] 첨부파일 다운로드 시도: {link_text[:50]}...")
                
                # 로컬 저장
                saved_path = download_and_upload_image(full_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      [SAVED] 첨부파일 이미지 저장: {saved_path}")
                    break
    except Exception as e:
        print(f"      [WARN] 첨부파일 처리 중 오류: {e}")
    
    # 전략 2: 본문 내 img 태그에서 추출
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*="/upload/"], img[src*="ws.wando.go.kr"]')
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet', 'blank']):
                    download_url = src if src.startswith('http') else urljoin(BASE_URL, src)
                    saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                    if saved_path:
                        thumbnail_url = saved_path
                        print(f"      [SAVED] 본문 이미지 저장: {saved_path}")
                        break
        except Exception as e:
            print(f"      [WARN] 본문 이미지 추출 실패: {e}")
    
    # 전략 3: 일반 이미지 태그
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
                        break
        except Exception as e:
            print(f"      [WARN] 일반 이미지 추출 실패: {e}")
    
    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING
    
    return content, thumbnail_url, pub_date, department, None  # success


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(max_articles: int = 30, days: Optional[int] = None, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송 (개수 기반)

    Args:
        max_articles: 최대 수집 기사 수 (기본 10개)
        days: 선택적 날짜 필터 (None이면 비활성화)
        start_date: 수집 시작일 (YYYY-MM-DD)
        end_date: 수집 종료일 (YYYY-MM-DD)
        dry_run: 테스트 모드 (서버 전송 안함)
    """
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    if start_date:
        print(f"[INFO] {REGION_NAME} Press Release Collection Started (max {max_articles}, {start_date} ~ {end_date})")
    else:
        print(f"[INFO] {REGION_NAME} Press Release Collection Started (max {max_articles}, no date filter)")

    if dry_run:
        print("   [TEST] DRY-RUN mode: No server transmission")
    
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
            
            # 목록에서 기사 링크 찾기 (카드형 그리드)
            article_links = page.locator('a[href*="nttId="][href*="pBoardId="]')
            article_count = article_links.count()
            
            if article_count == 0:
                # Fallback: 다른 셀렉터 시도
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break
            
            if article_count == 0:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break
            
            print(f"      [FOUND] {article_count}개 기사 링크 발견")
            
            # 링크 정보 수집
            link_data = []
            seen_ids = set()  # 중복 nttId 체크용
            
            for i in range(article_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                
                try:
                    link = article_links.nth(i)
                    
                    # 제목과 URL 추출
                    title = safe_get_text(link)
                    if title:
                        title = title.strip()
                    href = safe_get_attr(link, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # nttId 추출
                    ntt_id = extract_ntt_id(href)
                    if not ntt_id:
                        continue
                    
                    # 중복 nttId 체크
                    if ntt_id in seen_ids:
                        continue
                    seen_ids.add(ntt_id)
                    
                    # 상세 페이지 URL 구성
                    full_url = build_detail_url(ntt_id)
                    
                    # 목록에서 날짜 추출 시도 (YYYY-MM-DD 형식)
                    list_date = None
                    try:
                        # 부모 요소에서 날짜 찾기
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
                    
                    # 날짜 필터 (목록 단계)
                    if start_date and list_date and list_date < start_date:
                        print(f"      [SKIP] 목록에서 날짜 필터: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'ntt_id': ntt_id,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # 이 페이지에서 유효한 기사가 없으면 탐색 중지
            if len(link_data) == 0:
                print("      [STOP] 이 페이지에 유효한 기사가 없음, 탐색 중지")
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
                
                content, thumbnail_url, detail_date, department, error_reason = fetch_detail(page, full_url)
                error_collector.increment_processed()
                
                # 에러 발생 시 스킵
                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    time.sleep(0.3)
                    continue
                
                # 날짜 결정 (상세 > 목록 > 현재)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # 날짜 필터 + 조기 종료 로직
                # 날짜 비교 시 시간이 포함될 수 있으므로 날짜 부분만 비교
                if len(final_date) > 10: 
                    final_date_only = final_date[:10]
                else:
                    final_date_only = final_date

                if start_date and final_date_only < start_date:
                    consecutive_old += 1
                    print(f"         [SKIP] 날짜 필터로 스킵: {final_date} (연속 {consecutive_old}개)")
                    
                    if consecutive_old >= 3:
                        print("         [STOP] 오래된 기사 3개 연속 발견, 페이지 탐색 중지")
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
                    # 테스트 모드: 서버 전송 안함
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
            
            # 조기 종료 시 루프 탈출
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

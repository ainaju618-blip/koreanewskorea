"""
Gurye County Press Release Scraper
- Version: v1.0
- Last Modified: 2025-12-13
- Maintainer: AI Agent

Changes (v1.0):
- Initial version based on user-provided detailed analysis data
- URL 패턴: /board/view.do?bbsId=BBS_0000000000000300&pageIndex=1&nttId={ID}&menuNo=115004006000
- 첨부파일: /board/FileDown.do?atchFileId={fileId}&fileSn={seq}
- 카드형 그리드 레이아웃 (3열 배치)
- bxSlider 이미지 갤러리 대응
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
from utils.category_detector import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'gurye'
REGION_NAME = '구례군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.gurye.go.kr'

# 목록 페이지 URL (보도자료)
BBS_ID = 'BBS_0000000000000300'
MENU_NO = '115004006000'
LIST_PATH = f'/board/list.do?bbsId={BBS_ID}&menuNo={MENU_NO}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# 상세 페이지 URL 패턴: /board/view.do?bbsId=BBS_0000000000000300&pageIndex=1&nttId={ID}&menuNo=115004006000
# 첨부파일 URL 패턴: /board/FileDown.do?atchFileId={fileId}&fileSn={seq}

# 목록 페이지 셀렉터 (카드형 그리드 레이아웃)
# ★ 중요: bbsId=BBS_0000000000000300 (보도자료)만 필터링, 공지사항(BBS_0000000000000056) 제외
LIST_ITEM_SELECTORS = [
    f'a[href*="view.do"][href*="nttId="][href*="{BBS_ID}"]',  # ★ 보도자료 bbsId 필터
    f'a[href*="bbsId={BBS_ID}"][href*="nttId="]',
]

# 상세 페이지/본문 셀렉터 (우선순위 순) - 구례군 특화
CONTENT_SELECTORS = [
    'div.view_cont',       # ★ 구례군 핵심 본문 영역
    '.view_content',       
    '.board_view_content',
    '.bbs_view_cont',
    '.con-wrap',
    '.view-con',
    'article',
]

# 이미지 셀렉터 - 구례군 특화
IMAGE_SELECTORS = [
    '.img-cont img',       # ★ 구례군 이미지 컨테이너
    '.bxslider img',
    '.bx-wrapper img',
]

# 날짜 패턴: YYYY-MM-DD
DATE_PATTERNS = [
    r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})',
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


def build_detail_url(ntt_id: str, page_index: int = 1) -> str:
    """게시글 ID(nttId)로 상세 페이지 URL 생성"""
    return f'{BASE_URL}/board/view.do?bbsId={BBS_ID}&pageIndex={page_index}&nttId={ntt_id}&menuNo={MENU_NO}'


def build_list_url(page: int = 1) -> str:
    """page 기반 목록 페이지 URL 생성"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&pageIndex={page}'


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    Extract content, images, date, and department from detail page

    Returns:
        (content text, thumbnail URL, date, department)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None
    
    time.sleep(1.5)  # 페이지 안정화 (bxSlider 로딩 대기)
    
    # 1. 날짜 추출 (형식: YYYY-MM-DD)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        # 날짜 패턴 찾기
        date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', page_text[:3000])
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      [WARN] 날짜 추출 실패: {e}")
    
    # 2. 담당부서 추출 (형식: "작성자 : {부서명}")
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "작성자 : 스포츠산업과" 패턴
        dept_match = re.search(r'작성자\s*[:\s]+([^\n]+)', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
    except Exception as e:
        print(f"      [WARN] 담당부서 추출 실패: {e}")
    
    # 3. 본문 추출
    content = ""
    
    try:
        # JavaScript로 본문 추출 (메타정보, 이미지 슬라이더 컨트롤 제외)
        js_code = """
        () => {
            // 구례군 특화: div.view_cont가 핵심 본문 영역
            
            // 방법 1: 구례군 핵심 본문 컨테이너 (div.view_cont)
            const viewCont = document.querySelector('div.view_cont');
            if (viewCont) {
                // bxSlider 컨트롤 및 불필요 요소 제거
                const clone = viewCont.cloneNode(true);
                clone.querySelectorAll('.bx-controls, .bx-pager, script, style, .img-cont').forEach(el => el.remove());
                
                const text = clone.innerText?.trim();
                if (text && text.length > 50) {
                    return text;
                }
            }
            
            // 방법 2: 기타 본문 컨테이너
            const contentSelectors = [
                '.view_content', '.board_view_content', '.bbs_view_cont',
                '.con-wrap', '.view-con', 'article'
            ];
            
            for (const sel of contentSelectors) {
                const elem = document.querySelector(sel);
                if (elem) {
                    // bxSlider 컨트롤 텍스트 제거
                    const clone = elem.cloneNode(true);
                    clone.querySelectorAll('.bx-controls, .bx-wrapper, script, style').forEach(el => el.remove());
                    
                    const text = clone.innerText?.trim();
                    if (text && text.length > 100) {
                        return text;
                    }
                }
            }
            
            // 방법 3: div[class*="view"] 탐색
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
            # 메타정보 및 컨트롤 텍스트 제거
            content = re.sub(r'작성자\s*[:\s]+[^\n]+', '', content)
            content = re.sub(r'작성일\s*[:\s]+[^\n]+', '', content)
            content = re.sub(r'조회수\s*[:\s]+\d+', '', content)
            content = re.sub(r'담당자 연락처\s*[:\s]+[^\n]+', '', content)
            content = re.sub(r'재생|정지|이전|다음', '', content)  # bxSlider 컨트롤
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
                        content = text[:5000]
                        break
            except:
                continue

    # 본문 정제 적용
    content = clean_article_content(content)
    
    # 4. 이미지 추출 (첨부파일 우선)
    thumbnail_url = None
    
    # 전략 1: 첨부파일 다운로드 링크에서 이미지 추출
    # 패턴: /board/FileDown.do?atchFileId={fileId}&fileSn={seq}
    try:
        attach_links = page.locator('a[href*="FileDown.do"]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            href = safe_get_attr(link, 'href')
            
            # 이미지 파일 확장자 확인
            if href and any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                full_url = urljoin(BASE_URL, href) if not href.startswith('http') else href
                print(f"      [DOWNLOAD] 첨부파일 다운로드 시도: {link_text[:50]}...")
                
                # 로컬 저장
                saved_path = download_and_upload_image(full_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    break
    except Exception as e:
        print(f"      [WARN] 첨부파일 처리 중 오류: {e}")
    
    # 전략 2: 구례군 이미지 컨테이너 (.img-cont img) 또는 bxSlider
    if not thumbnail_url:
        try:
            # 구례군 특화: .img-cont 내 이미지 우선
            for sel in IMAGE_SELECTORS:
                slider_imgs = page.locator(sel)
                for i in range(min(slider_imgs.count(), 3)):
                    src = safe_get_attr(slider_imgs.nth(i), 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet']):
                        download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                        if saved_path:
                            thumbnail_url = saved_path
                            print(f"      [SAVED] 이미지 컨테이너에서 저장: {saved_path}")
                            break
                if thumbnail_url:
                    break
        except Exception as e:
            print(f"      [WARN] 이미지 컨테이너 추출 실패: {e}")
    
    # 전략 3: 본문 내 img 태그에서 추출
    if not thumbnail_url:
        try:
            imgs = page.locator('div.view_cont img[src*=".jpg"], div.view_cont img[src*=".png"]')
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet', 'blank', 'bx-']):
                    download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    saved_path = download_and_upload_image(download_url, url, REGION_CODE)
                    if saved_path:
                        thumbnail_url = saved_path
                        break
        except Exception as e:
            print(f"      [WARN] 본문 이미지 추출 실패: {e}")
    
    return content, thumbnail_url, pub_date, department


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
    
    collected_count = 0
    success_count = 0
    skipped_count = 0
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
            
            # 목록에서 기사 링크 찾기 (카드형 그리드 레이아웃)
            # ★ 보도자료(BBS_0000000000000300)만 필터링, 공지사항 제외
            article_links = page.locator(f'a[href*="view.do"][href*="nttId="][href*="{BBS_ID}"]')
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
            
            # Collect link information
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
                        # 부모 카드 요소에서 날짜 찾기
                        parent = link.locator('xpath=ancestor::*[self::div or self::li or self::article][1]')
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
            
            # Collect and send detail pages
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
                
                # 날짜 필터 + 조기 종료 로직
                if start_date and final_date < start_date:
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
                    # 테스트 모드: 서버 전송 안함
                    collected_count += 1
                    success_count += 1
                    img_status = "[+IMG]" if thumbnail_url else "[-IMG]"
                    content_status = f"[+TXT:{len(content)}]" if content and len(content) > 50 else "[-TXT]"
                    print(f"         [DRY-RUN] {img_status}, {content_status}")
                    collected_articles.append(article_data)
                else:
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
                    else:
                        print(f"         [WARN] 전송 실패: {result}")
                
                time.sleep(1)  # Rate limiting
            
            # 조기 종료 시 루프 탈출
            if stop_scraping:
                break
            
            page_num += 1
            time.sleep(1)
        
        browser.close()
    
    if skipped_count > 0:
        final_msg = f"Completed: {success_count} new, {skipped_count} duplicates"
    else:
        final_msg = f"Completed: {success_count} new articles"
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success', created_count=success_count, skipped_count=skipped_count)
    
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

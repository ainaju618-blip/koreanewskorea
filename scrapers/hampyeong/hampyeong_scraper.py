"""
함평군 보도자료 스크래퍼
- 버전: v1.0
- 최종수정: 2025-12-13
- 담당: AI Agent

변경점 (v1.0):
- 사용자 제공 상세 분석 데이터 기반 최초 작성
- URL 패턴: /boardView.do?pageId=www275&boardId=NEWS&seq={ID}&movePage=1&recordCnt=10
- 첨부파일: /fileDownload.do?fileSe=BB&fileKey=NEWS%7C{fileKey}&fileSn={seq}
- 테이블 형식 목록 (번호, 제목, 작성자, 작성일, 파일, 조회)
- 정적 HTML, UTF-8 인코딩
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
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.category_classifier import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'hampyeong'
REGION_NAME = '함평군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.hampyeong.go.kr'

# 목록 페이지 URL (보도/해명)
BOARD_ID = 'NEWS'
PAGE_ID = 'www275'
LIST_PATH = f'/boardList.do?boardId={BOARD_ID}&pageId={PAGE_ID}'
LIST_URL = f'{BASE_URL}{LIST_PATH}'

# 상세 페이지 URL 패턴: /boardView.do?pageId=www275&boardId=NEWS&seq={ID}&movePage=1&recordCnt=10

# 목록 페이지 셀렉터 (테이블 형식)
LIST_ITEM_SELECTORS = [
    'a[href*="boardView.do"][href*="seq="]',  # 기사 링크
    'a[href*="boardId=NEWS"][href*="seq="]',
]

# 상세 페이지/본문 셀렉터 (우선순위 순)
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view_content',
    '.view_body',
    '.con_detail',
    '.content',
]

# 날짜 패턴: YYYY-MM-DD HH:MM 또는 YYYY-MM-DD
DATE_PATTERNS = [
    r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})',
]


# ============================================================
# 5. 유틸리티 함수
# ============================================================
def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
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
    """href에서 seq(게시글 ID) 추출"""
    if not href:
        return None
    
    # URL 파라미터에서 추출
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'seq' in params:
            return params['seq'][0]
    except:
        pass
    
    # 정규식으로 추출
    match = re.search(r'seq[=]?(\d+)', href)
    if match:
        return match.group(1)
    
    return None


def build_detail_url(seq_id: str, page: int = 1) -> str:
    """게시글 ID(seq)로 상세 페이지 URL 생성"""
    return f'{BASE_URL}/boardView.do?pageId={PAGE_ID}&boardId={BOARD_ID}&seq={seq_id}&movePage={page}&recordCnt=10'


def build_list_url(page: int = 1) -> str:
    """page 기반 목록 페이지 URL 생성 (movePage 파라미터)"""
    if page == 1:
        return LIST_URL
    return f'{LIST_URL}&movePage={page}'


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 담당부서를 추출

    Returns:
        (본문 텍스트, 썸네일 URL, 날짜, 담당부서)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None
    
    time.sleep(1.5)  # 페이지 안정화
    
    # 1. 날짜 추출 (형식: YYYY-MM-DD HH:MM)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        page_text = page.locator('body').inner_text()
        # "작성일 : YYYY-MM-DD HH:MM" 패턴 찾기
        date_match = re.search(r'작성일\s*[:\s]*(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        else:
            # 일반 날짜 패턴
            date_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', page_text[:3000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      ⚠️ 날짜 추출 실패: {e}")
    
    # 2. 담당부서 추출 (본문 내 별도 기재)
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "작성자 : {부서명}" 패턴
        dept_match = re.search(r'작성자\s*[:\s]*([가-힣]+(?:과|실|팀|읍|면|창))', page_text)
        if dept_match:
            department = dept_match.group(1).strip()
    except Exception as e:
        print(f"      ⚠️ 담당부서 추출 실패: {e}")
    
    # 3. 본문 추출
    content = ""
    
    try:
        # JavaScript로 본문 추출
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
            # 메타정보 및 JavaScript 코드 제거
            content = re.sub(r'작성일\s*[:\s]*[^\n]+', '', content)
            content = re.sub(r'작성자\s*[:\s]*[^\n]+', '', content)
            content = re.sub(r'조회수?\s*[:\s]*\d+', '', content)
            content = re.sub(r'첨부파일[^\n]*', '', content)
            content = re.sub(r'function\s*\([^)]*\)\s*\{[^}]*\}', '', content)
            content = re.sub(r'var\s+\w+\s*=', '', content)
            content = content.strip()[:5000]
    except Exception as e:
        print(f"      ⚠️ JS 본문 추출 실패: {e}")
    
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

    # 본문 정제
    if content:
        content = clean_article_content(content)

    # 4. 이미지 추출
    thumbnail_url = None
    
    # 전략 1: 첨부파일 다운로드 링크에서 이미지 추출 (/fileDownload.do)
    try:
        attach_links = page.locator('a[href*="fileDownload.do"], a[href*="fileSe=BB"]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            href = safe_get_attr(link, 'href')
            
            # 이미지 파일 확장자 확인 (.jpg, .png)
            if href and any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                full_url = href if href.startswith('http') else urljoin(BASE_URL, href)
                print(f"      📥 첨부파일 다운로드 시도: {link_text[:50]}...")
                
                # 로컬 저장
                saved_path = download_and_upload_image(full_url, url, REGION_CODE)
                if saved_path:
                    thumbnail_url = saved_path
                    print(f"      💾 첨부파일 이미지 저장: {saved_path}")
                    break
    except Exception as e:
        print(f"      ⚠️ 첨부파일 처리 중 오류: {e}")
    
    # 전략 2: 본문 내 img 태그에서 추출
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
                        print(f"      💾 본문 이미지 저장: {saved_path}")
                        break
        except Exception as e:
            print(f"      ⚠️ 본문 이미지 추출 실패: {e}")
    
    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(max_articles: int = 10, days: Optional[int] = None, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
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

    if start_date:
        print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최대 {max_articles}개, {start_date} ~ {end_date})")
    else:
        print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최대 {max_articles}개, 날짜 필터 없음)")
    
    if dry_run:
        print("   🧪 DRY-RUN 모드: 서버 전송 안함")
    
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
            print(f"   📄 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # 목록에서 기사 링크 찾기 (테이블 형식)
            article_links = page.locator('a[href*="boardView.do"][href*="seq="]')
            article_count = article_links.count()
            
            if article_count == 0:
                # Fallback: 다른 셀렉터 시도
                for sel in LIST_ITEM_SELECTORS:
                    article_links = page.locator(sel)
                    article_count = article_links.count()
                    if article_count > 0:
                        break
            
            if article_count == 0:
                print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                break
            
            print(f"      📰 {article_count}개 기사 링크 발견")
            
            # 링크 정보 수집
            link_data = []
            seen_ids = set()  # 중복 seq 체크용
            
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
                    
                    # seq 추출
                    seq_id = extract_seq_id(href)
                    if not seq_id:
                        continue
                    
                    # 중복 seq 체크
                    if seq_id in seen_ids:
                        continue
                    seen_ids.add(seq_id)
                    
                    # 상세 페이지 URL 구성
                    full_url = build_detail_url(seq_id, page_num)
                    
                    # 목록에서 날짜 추출 시도 (YYYY-MM-DD 형식)
                    list_date = None
                    try:
                        # 부모 행에서 날짜 찾기
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
                    
                    # 날짜 필터 (목록 단계)
                    if start_date and list_date and list_date < start_date:
                        print(f"      ⏩ 목록에서 날짜 필터: {list_date} < {start_date}")
                        continue
                    
                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'seq_id': seq_id,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # 이 페이지에서 유효한 기사가 없으면 탐색 중지
            if len(link_data) == 0:
                print("      ⏹️ 이 페이지에 유효한 기사가 없음, 탐색 중지")
                break
            
            # 상세 페이지 수집 및 전송
            consecutive_old = 0  # 연속 오래된 기사 카운터
            stop_scraping = False
            
            for item in link_data:
                if collected_count >= max_articles or stop_scraping:
                    break
                
                title = item['title']
                full_url = item['url']
                
                print(f"      📰 {title[:40]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date, department = fetch_detail(page, full_url)
                
                # 날짜 결정 (상세 > 목록 > 현재)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # 날짜 필터 + 조기 종료 로직
                if start_date and final_date < start_date:
                    consecutive_old += 1
                    print(f"         ⏩ 날짜 필터로 스킵: {final_date} (연속 {consecutive_old}개)")
                    
                    if consecutive_old >= 3:
                        print("         ⏹️ 오래된 기사 3개 연속 발견, 페이지 탐색 중지")
                        stop_scraping = True
                        break
                    continue
                
                # 유효한 기사 발견 시 카운터 리셋
                consecutive_old = 0
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # 부제목 추출
                subtitle, content = extract_subtitle(content)

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
                    # 테스트 모드: 서버 전송 안함
                    collected_count += 1
                    success_count += 1
                    img_status = "✓이미지" if thumbnail_url else "✗이미지"
                    content_status = f"✓본문({len(content)}자)" if content and len(content) > 50 else "✗본문"
                    print(f"         🧪 [DRY-RUN] {img_status}, {content_status}")
                    collected_articles.append(article_data)
                else:
                    # 서버로 전송
                    result = send_article_to_server(article_data)
                    collected_count += 1
                    
                    if result.get('status') == 'created':
                        success_count += 1
                        img_status = "✓이미지" if thumbnail_url else "✗이미지"
                        print(f"         ✅ 저장 완료 ({img_status})")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         ⏩ 이미 존재")
                    else:
                        print(f"         ⚠️ 전송 실패: {result}")
                
                time.sleep(1)  # Rate limiting
            
            # 조기 종료 시 루프 탈출
            if stop_scraping:
                break
            
            page_num += 1
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개)"
    print(f"✅ {final_msg}")
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

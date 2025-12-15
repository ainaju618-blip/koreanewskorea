"""
영광군 보도자료 스크래퍼
- 버전: v3.0
- 최종수정: 2025-12-12
- 담당: AI Agent

변경점 (v3.0):
- 사용자 제공 상세 분석 데이터 기반 완전 재작성
- 정확한 URL 패턴: b_id=news_data&site=headquarter_new&mn=9056
- 페이지네이션: offset={페이지번호 * 10}
- 상세 페이지: type=view&bs_idx={게시글ID}
- 첨부파일: type=download&bs_idx={게시글ID}&bf_idx={파일ID}
- 테이블 기반 목록/상세 페이지 파싱
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
from utils.image_extractor import extract_thumbnail
from utils.cloudinary_uploader import download_and_upload_image
from utils.category_detector import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'yeonggwang'
REGION_NAME = '영광군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeonggwang.go.kr'

# URL 구성 요소
BBS_PATH = '/bbs/'
B_ID = 'news_data'
SITE = 'headquarter_new'
MN = '9056'

# 목록 페이지 기본 URL
LIST_URL = f'{BASE_URL}{BBS_PATH}?b_id={B_ID}&site={SITE}&mn={MN}&type=lists'

# 상세 페이지 URL 패턴: ?b_id=news_data&site=headquarter_new&mn=9056&type=view&bs_idx={게시글ID}

# 목록 페이지 셀렉터
LIST_TABLE_SELECTOR = 'table'
LIST_ROW_SELECTORS = [
    'table tbody tr',
    'table tr',
]

# 상세 페이지/본문 셀렉터
CONTENT_SELECTORS = [
    '.view_content',
    '.board_view',
    'div[class*="content"]',
    'td[colspan]',  # 본문이 td colspan에 있는 경우
    'article',
    '#txt',
]

# 날짜 셀렉터 (상세 페이지)
DATE_LABEL_PATTERNS = ['작성일', '등록일', '게시일']


# ============================================================
# 5. 유틸리티 함수
# ============================================================
def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
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


def extract_bs_idx(href: str) -> Optional[str]:
    """href에서 bs_idx(게시글 ID) 추출"""
    if not href:
        return None
    
    # URL 파라미터에서 추출
    try:
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if 'bs_idx' in params:
            return params['bs_idx'][0]
    except:
        pass
    
    # 정규식으로 추출
    match = re.search(r'bs_idx[=:]?(\d+)', href)
    if match:
        return match.group(1)
    
    return None


def build_detail_url(bs_idx: str) -> str:
    """게시글 ID로 상세 페이지 URL 생성"""
    return f'{BASE_URL}{BBS_PATH}?b_id={B_ID}&site={SITE}&mn={MN}&type=view&bs_idx={bs_idx}'


def build_list_url(offset: int = 0) -> str:
    """offset 기반 목록 페이지 URL 생성"""
    if offset == 0:
        return LIST_URL
    return f'{LIST_URL}&offset={offset}'


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str]:
    """
    상세 페이지에서 본문, 이미지, 날짜를 추출
    
    Returns:
        (본문 텍스트, 썸네일 URL, 날짜)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d')
    
    time.sleep(1)  # 페이지 안정화
    
    # 1. 날짜 추출 (메타데이터 테이블에서)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    
    # 테이블 헤더(th)나 라벨에서 "작성일" 찾기
    try:
        # 방법 1: th:has-text("작성일") + td
        for label in DATE_LABEL_PATTERNS:
            try:
                date_cell = page.locator(f'th:has-text("{label}")').first
                if date_cell.count() > 0:
                    # 같은 행의 다음 td 찾기
                    parent_tr = date_cell.locator('xpath=../..')
                    td = parent_tr.locator('td').first
                    if td.count() > 0:
                        text = safe_get_text(td)
                        if text and re.search(r'\d{4}', text):
                            pub_date = normalize_date(text)
                            break
            except:
                continue
        
        # 방법 2: 전체 페이지에서 날짜 패턴 찾기 (fallback)
        if pub_date == datetime.now().strftime('%Y-%m-%d'):
            page_text = page.locator('body').inner_text()
            date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text[:2000])
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except Exception as e:
        print(f"      ⚠️ 날짜 추출 실패: {e}")
    
    # 2. 본문 추출
    content = ""
    
    # 전략 1: 공공누리 섹션 이후 텍스트 찾기 (영광군청 특화)
    try:
        js_code = """
        () => {
            // 테이블 내 본문 영역 찾기
            const tables = document.querySelectorAll('table');
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                for (const row of rows) {
                    const tds = row.querySelectorAll('td');
                    for (const td of tds) {
                        const text = td.innerText?.trim();
                        // 본문은 보통 200자 이상, 메타정보가 아님
                        if (text && text.length > 200 && 
                            !text.includes('작성자') &&
                            !text.includes('조회수') &&
                            !text.includes('파일첨부') &&
                            !text.includes('공공누리')) {
                            return text;
                        }
                    }
                }
            }
            
            // 방법 2: 일반 본문 영역
            const selectors = ['.view_content', '.board_view', 'article', '.cont_view'];
            for (const sel of selectors) {
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
            content = clean_article_content(content)[:5000]
    except Exception as e:
        print(f"      ⚠️ JS 본문 추출 실패: {e}")

    # 전략 2: 일반 셀렉터 fallback
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = clean_article_content(text)[:5000]
                        break
            except:
                continue
    
    # 3. 이미지 추출 (Playwright 다운로드 방식 적용)
    thumbnail_url = None
    
    # 전략 1: 첨부파일 직접 다운로드 (세션 쿠키 필요하므로 브라우저 동작)
    try:
        attach_links = page.locator('a[href*="type=download"]')
        for i in range(min(attach_links.count(), 3)): # 상위 3개만 시도
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            
            # 이미지 파일 확장자 확인
            if any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                print(f"      📥 첨부파일 다운로드 시도: {link_text}")
                
                try:
                    # 다운로드 리스너 설정
                    with page.expect_download(timeout=10000) as download_info:
                        # JS로 클릭 강제 (가려짐 방지)
                        link.evaluate("el => el.click()")
                    
                    download = download_info.value
                    
                    # 임시 파일 저장
                    import tempfile
                    from utils.cloudinary_uploader import upload_local_image
                    
                    temp_dir = tempfile.gettempdir()
                    # 파일명 안전하게 변환
                    safe_name = f"yeonggwang_{int(time.time())}_{i}.jpg"
                    temp_path = os.path.join(temp_dir, safe_name)
                    
                    download.save_as(temp_path)
                    print(f"      💾 임시 저장: {temp_path}")
                    
                    # Cloudinary 업로드
                    print(f"      ☁️ Cloudinary 업로드 중...")
                    c_url = upload_local_image(temp_path, folder="yeonggwang")
                    
                    if c_url:
                        thumbnail_url = c_url
                        # 임시 파일 삭제
                        try:
                            os.remove(temp_path)
                        except:
                            pass
                        break
                        
                except Exception as e:
                    print(f"      ⚠️ 다운로드/업로드 실패: {e}")
                    continue
    except Exception as e:
        print(f"      ⚠️ 첨부파일 처리 중 오류: {e}")
    
    # 전략 2: 본문 영역 내 이미지 (다운로드 실패 시 Fallback)
    if not thumbnail_url:
        try:
            thumbnail_url = extract_thumbnail(page, BASE_URL, CONTENT_SELECTORS)
        except:
            pass
    
    # 전략 3: 일반 img 태그 fallback
    if not thumbnail_url:
        try:
            imgs = page.locator('img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"]')
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'arrow', 'bullet']):
                    # 여기서도 download_and_upload_image를 쓰지만, 본문 이미지는 보통 공개되어 있어 requests로 가능
                    # 만약 실패하면 여기도 수정 필요할 수 있음
                    download_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    thumbnail_url = download_and_upload_image(download_url, BASE_URL, folder="yeonggwang")
                    if thumbnail_url:
                        break
        except:
            pass
    
    return content, thumbnail_url, pub_date


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(max_articles: int = 10, days: Optional[int] = None, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송 (개수 기반)

    Args:
        max_articles: 최대 수집 기사 수 (기본 10개)
        days: 선택적 날짜 필터 (None이면 비활성화)
        start_date: 수집 시작일 (YYYY-MM-DD)
        end_date: 수집 종료일 (YYYY-MM-DD)
    """
    if not start_date and days:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    if start_date:
        print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최대 {max_articles}개, {start_date} ~ {end_date})")
    else:
        print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최대 {max_articles}개, 날짜 필터 없음)")
    
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.1 시작', 'info')
    
    collected_count = 0
    success_count = 0
    
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
        
        # User-Agent 설정 (명시적)
        USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        
        page = context.new_page()
        
        page_num = 0  # offset 기반 (0, 10, 20, ...)
        max_pages = 10  # 최대 10페이지까지 탐색
        
        while page_num < max_pages and collected_count < max_articles:
            offset = page_num * 10
            list_url = build_list_url(offset)
            print(f"   📄 페이지 {page_num + 1} 수집 중... (offset={offset})")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num + 1} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # 목록 테이블 행 찾기
            rows = wait_and_find(page, LIST_ROW_SELECTORS, timeout=10000)
            if not rows:
                print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                break
            
            row_count = rows.count()
            print(f"      📰 {row_count}개 행 발견")
            
            # 링크 정보 수집
            link_data = []
            seen_urls = set()  # ★ 중복 URL 체크용

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    row = rows.nth(i)
                    
                    # 헤더 행 스킵 (th가 있으면 헤더)
                    th_count = row.locator('th').count()
                    if th_count > 0:
                        continue
                    
                    # 제목 링크 찾기 (bs_idx 포함)
                    link_elem = row.locator('a[href*="bs_idx"]').first
                    if not link_elem or link_elem.count() == 0:
                        # 일반 링크로 재시도
                        link_elem = row.locator('a').first
                        if not link_elem or link_elem.count() == 0:
                            continue
                    
                    title = safe_get_text(link_elem).strip()
                    href = safe_get_attr(link_elem, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # bs_idx 추출
                    bs_idx = extract_bs_idx(href)
                    if not bs_idx:
                        continue
                    
                    # 상세 페이지 URL 구성
                    full_url = build_detail_url(bs_idx)
                    
                    # 날짜 컬럼에서 사전 추출 (보통 4번째 td)
                    list_date = None
                    try:
                        tds = row.locator('td')
                        for td_idx in range(tds.count()):
                            td_text = safe_get_text(tds.nth(td_idx))
                            if td_text and re.search(r'\d{4}[-./]\d{1,2}[-./]\d{1,2}', td_text):
                                list_date = normalize_date(td_text)
                                break
                    except:
                        pass
                    
                    # ★ 목록 단계에서 바로 날짜 필터링 (오래된 기사면 스킵)
                    if start_date and list_date and list_date < start_date:
                        print(f"      ⏩ 목록에서 날짜 필터: {list_date} < {start_date}")
                        # 목록이 최신순이면 이 이후는 더 오래된 기사이므로 중지
                        continue

                    # ★ 중복 URL 체크
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'bs_idx': bs_idx,
                        'list_date': list_date
                    })
                    
                except Exception as e:
                    continue
            
            # ★ 이 페이지에서 유효한 기사가 없으면 더 이상 탐색하지 않음
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
                
                content, thumbnail_url, detail_date = fetch_detail(page, full_url)
                
                # 날짜 결정 (상세 > 목록 > 현재)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # 날짜 필터 (활성화된 경우만) + 조기 종료 로직
                if start_date and final_date < start_date:
                    consecutive_old += 1
                    print(f"         ⏩ 날짜 필터로 스킵: {final_date} (연속 {consecutive_old}개)")
                    
                    # 연속 3개 오래된 기사면 페이지 탐색 중지
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
    
    return []


# ============================================================
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.1')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수 (기본 10)')
    parser.add_argument('--days', type=int, default=None, help='선택적 날짜 필터 (일). 지정하지 않으면 날짜 필터 없음')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    # bot-service.ts 호환 인자 (필수)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        max_articles=args.max_articles,
        days=args.days,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()


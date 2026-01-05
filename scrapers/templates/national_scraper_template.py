"""
{지역명} 보도자료 스크래퍼 - 전국판 템플릿 (Enterprise Stealth)
- 버전: v3.0 (Enterprise Stealth Enhanced)
- 최종수정: 2026-01-05
- 담당: AI Agent

[프로젝트: koreanewskorea]
- 전국 17개 시·도 보도자료 수집용
- Supabase: ainaju618@gmail.com 계정 (신규 DB)
- ⚡ Enterprise Stealth Mode 내장:
  - POMDP 기반 지능형 딜레이
  - 블록 감지 및 자동 복구
  - 지수 백오프 재시도
  - 핑거프린트 로테이션

[USAGE]:
1. 이 파일을 복사하여 scrapers/{region}/{region}_scraper.py로 저장
2. TODO 주석을 찾아 해당 지역에 맞게 수정
3. 테스트: python {region}_scraper.py --days 1 --max-articles 3
"""

# ============================================================
# 1. 표준 라이브러리
# ============================================================
import sys
import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

# ============================================================
# 2. 경로 설정
# ============================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPERS_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRAPERS_DIR)

# ============================================================
# 3. 외부 라이브러리
# ============================================================
from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth

# ============================================================
# 4. 로컬 모듈
# ============================================================
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.scraper_utils import wait_and_find, safe_get_text, safe_get_attr
from utils.content_cleaner import clean_article_content
from utils.category_detector import detect_category
from utils.error_collector import ErrorCollector
from utils.cloudinary_uploader import download_and_upload_image

# ============================================================
# 5. Enterprise Stealth 모듈
# ============================================================
from utils.enterprise_stealth import (
    StealthConfig,
    PODMPDelayGenerator,
    BlockDetector,
    BlockType,
    FingerprintManager,
    retry_with_backoff,
    smart_delay,
)

# ============================================================
# 6. 상수 정의 (TODO: 지역에 맞게 수정)
# ============================================================
REGION_CODE = 'template'                           # TODO: 영문 코드 (예: seoul, busan, daegu)
REGION_NAME = '템플릿시'                            # TODO: 한글 지역명 (예: 서울특별시, 부산광역시)
CATEGORY_NAME = '전국'                              # 전국판 공통 카테고리
BASE_URL = 'https://www.example.go.kr'             # TODO: 기본 URL
LIST_URL = 'https://www.example.go.kr/news/press'  # TODO: 보도자료 목록 URL

# 페이지네이션 패턴 (TODO: 사이트별 확인)
PAGE_PARAM = 'page'

# 목록 페이지 셀렉터 (TODO: 실제 사이트 DOM 구조에 맞게 수정)
LIST_ROW_SELECTORS = [
    'table.list tbody tr',
    'table tbody tr',
    '.board_list tbody tr',
    'ul.list li',
    '.bbs_list tbody tr',
]

# 본문 페이지 셀렉터 (TODO: 실제 사이트 DOM 구조에 맞게 수정)
CONTENT_SELECTORS = [
    'div.view_content',
    'div.board_view',
    'div.bbs_view',
    'div.view_box',
    'article.view',
    '.content_view',
    'div#boardView',
]


# ============================================================
# 7. Stealth 설정
# ============================================================
def get_stealth_config() -> StealthConfig:
    """지역 스크래퍼용 스텔스 설정"""
    return StealthConfig(
        headless=True,
        use_persistent_context=True,
        context_dir=os.path.join(SCRAPERS_DIR, 'browser_contexts'),
        min_delay=1.5,
        max_delay=4.0,
        poisson_lambda=2.0,
        max_retries=3,
        base_backoff=2.0,
        max_backoff=60.0,
        jitter_factor=0.3,
        use_http2=True,
        rotate_fingerprint=True,
        fingerprint_interval=15
    )


# ============================================================
# 8. 유틸리티 함수
# ============================================================
def safe_str(s):
    """Windows 콘솔 출력용 안전 문자열 변환"""
    if s is None:
        return ''
    return s.encode('cp949', errors='replace').decode('cp949')


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


def extract_subtitle(content: str, title: str) -> Tuple[Optional[str], str]:
    """본문에서 부제목 추출"""
    if not content:
        return None, content

    lines = content.strip().split('\n')
    for line in lines[:3]:
        line = line.strip()
        if line and len(line) > 10 and line != title and not line.startswith('▲'):
            if len(line) < 200:
                return line, content
    return None, content


@retry_with_backoff(max_retries=3, base_backoff=2.0, max_backoff=30.0)
def safe_goto(page: Page, url: str, timeout: int = 20000) -> bool:
    """재시도 로직이 포함된 안전한 페이지 이동"""
    try:
        page.goto(url, wait_until='networkidle', timeout=timeout)
        return True
    except Exception as e:
        print(f"      [ERROR] Page load failed: {e}")
        raise


# ============================================================
# 9. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str, delay_gen: PODMPDelayGenerator) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜 추출

    Returns:
        (content, thumbnail_url, date, error_reason)
    """
    try:
        if not safe_goto(page, url, timeout=20000):
            return "", None, datetime.now().strftime('%Y-%m-%d'), "PAGE_LOAD_FAIL"
    except Exception as e:
        return "", None, datetime.now().strftime('%Y-%m-%d'), f"PAGE_LOAD_ERROR: {e}"

    # POMDP 딜레이
    smart_delay(1.0, 2.5, 2.0)

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')

    # 1. 날짜 추출 (TODO: 사이트별 날짜 위치에 맞게 수정)
    date_selectors = [
        'span:has-text("작성일")',
        'span:has-text("등록일")',
        'li:has-text("작성일")',
        'li:has-text("등록일")',
        'td.date',
        'span.date',
        'dd:has-text("2026")',
        '.view_info span',
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

    # 날짜 폴백: 페이지 전체에서 패턴 검색
    if pub_date == datetime.now().strftime('%Y-%m-%d'):
        try:
            page_text = page.locator('body').inner_text()[:3000]
            date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', page_text)
            if date_match:
                y, m, d = date_match.groups()
                pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
        except:
            pass

    # 2. 본문 추출
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

    # 3. 이미지 추출
    # 전략 1: 첨부파일 링크
    attach_links = page.locator('a[href*="download"], a[href*="file"], a[href*="attach"]')
    for i in range(min(attach_links.count(), 5)):
        try:
            link = attach_links.nth(i)
            title_attr = safe_get_attr(link, 'title') or safe_get_text(link) or ''
            href = safe_get_attr(link, 'href') or ''
            if any(ext in title_attr.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                img_url = urljoin(BASE_URL, href) if href else None
                if img_url:
                    cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                        break
        except:
            continue

    # 전략 2: 본문 내 이미지
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            try:
                imgs = page.locator(f'{sel} img')
                for i in range(min(imgs.count(), 3)):
                    src = safe_get_attr(imgs.nth(i), 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'button']):
                        img_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                        if cloudinary_url:
                            thumbnail_url = cloudinary_url
                        else:
                            thumbnail_url = img_url
                        break
                if thumbnail_url:
                    break
            except:
                continue

    # 이미지 없으면 스킵 (선택사항)
    if not thumbnail_url:
        return "", None, pub_date, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, None


# ============================================================
# 10. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 30, start_date: str = None, end_date: str = None, headless: bool = True) -> List[Dict]:
    """
    보도자료 수집 및 서버 전송

    Enterprise Stealth 기능:
    - POMDP 기반 딜레이
    - 블록 감지 및 복구
    - 지수 백오프 재시도
    - 핑거프린트 로테이션
    """
    # 날짜 필터 계산
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"[{REGION_NAME}] 보도자료 스크래퍼 v3.0 (Enterprise Stealth)")
    print(f"{'='*60}")
    print(f"   [INFO] POMDP 딜레이 활성화 (인간 행동 시뮬레이션)")
    print(f"   [DATE] {start_date} ~ {end_date}")

    # 개발 서버 확인
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, 'running', f'{REGION_NAME} 스크래퍼 v3.0 시작 (Enterprise Stealth)', 'info')

    # 스텔스 컴포넌트 초기화
    config = get_stealth_config()
    config.headless = headless
    delay_gen = PODMPDelayGenerator(config)
    block_detector = BlockDetector()
    fingerprint_manager = FingerprintManager(config.fingerprint_interval)
    error_collector = ErrorCollector(REGION_CODE, REGION_NAME)

    with sync_playwright() as p:
        # 핑거프린트 가져오기
        fp = fingerprint_manager.get_fingerprint()

        # 스텔스 브라우저 실행
        browser = p.chromium.launch(
            headless=config.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-extensions',
                f'--window-size={fp["screen"]["width"]},{fp["screen"]["height"]}',
            ]
        )

        # 핑거프린트 적용 컨텍스트 생성
        context = browser.new_context(
            user_agent=fp['userAgent'],
            viewport=fp['screen'],
            locale='ko-KR',
            timezone_id='Asia/Seoul',
            color_scheme='light',
        )

        page = context.new_page()

        # 스텔스 적용
        Stealth().apply_stealth_sync(page)
        page.add_init_script(fingerprint_manager.get_stealth_js())

        print(f"   [STEALTH] 핑거프린트 적용: {fp['platform']}")
        print(f"   [STEALTH] User-Agent: {fp['userAgent'][:50]}...")

        page_num = 1
        stop = False
        collected_count = 0

        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}?{PAGE_PARAM}={page_num}'
            print(f"\n   [PAGE] 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, 'running', f'페이지 {page_num} 탐색', 'info')

            # Pre-navigation POMDP 딜레이
            delay = delay_gen.get_page_delay()
            print(f"      [DELAY] {delay:.2f}s (state: {delay_gen.current_state})")

            try:
                if not safe_goto(page, list_url):
                    page_num += 1
                    continue
            except Exception as e:
                print(f"      [ERROR] Page navigation failed: {e}")
                page_num += 1
                continue

            # 블록 감지
            content = page.content()
            block_type = block_detector.detect(content, 200)

            if block_type != BlockType.NONE:
                strategy = block_detector.get_recovery_strategy(block_type)
                print(f"      [BLOCK] 감지됨: {block_type.value}")
                print(f"      [BLOCK] 조치: {strategy['action']}, 대기: {strategy['delay']}s")

                if strategy['action'] == 'wait_and_retry':
                    smart_delay(strategy['delay'], strategy['delay'] * 1.5, 1.0)
                    if strategy.get('rotate_ua'):
                        fingerprint_manager.current_fingerprint = fingerprint_manager._generate_fingerprint()
                    continue
                elif strategy['action'] in ['abort', 'manual_intervention']:
                    print(f"      [BLOCK] 진행 불가: {strategy.get('note', block_type.value)}")
                    break

            # 후 딜레이
            smart_delay(1.0, 2.0, 2.0)

            # 목록 행 찾기
            rows = wait_and_find(page, LIST_ROW_SELECTORS, timeout=10000)
            if not rows:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            row_count = rows.count()
            print(f"      [FOUND] {row_count}개 행 발견")

            # 링크 정보 수집
            link_data = []
            seen_urls = set()

            for i in range(row_count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    row = rows.nth(i)

                    # 공지/헤더 행 스킵
                    row_classes = safe_get_attr(row, 'class') or ''
                    if 'notice' in row_classes.lower() or 'header' in row_classes.lower():
                        continue

                    # 제목 링크 찾기
                    link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0:
                        continue

                    title = safe_get_text(link_elem).strip()
                    title = re.sub(r'\s*새로운글\s*', '', title).strip()
                    href = safe_get_attr(link_elem, 'href')

                    if not title or not href:
                        continue

                    # 상세 페이지 URL 생성
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)

                    # 목록에서 날짜 추출
                    try:
                        date_cell = row.locator('td').nth(3)
                        list_date = safe_get_text(date_cell)
                        n_date = normalize_date(list_date) if list_date else None
                    except:
                        n_date = None

                    # 날짜 필터링
                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    # 중복 URL 체크
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

            # 중복 사전 확인
            urls_to_check = [item['url'] for item in link_data]
            existing_urls = check_duplicates(urls_to_check)

            new_link_data = [item for item in link_data if item['url'] not in existing_urls]
            skipped_by_precheck = len(link_data) - len(new_link_data)
            if skipped_by_precheck > 0:
                print(f"      [PRE-CHECK] {skipped_by_precheck}개 스킵 (DB에 이미 존재)")

            # 상세 페이지 수집 및 전송
            for item in new_link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']

                print(f"      [ARTICLE] {safe_str(title[:35])}...")
                log_to_server(REGION_CODE, 'running', f"수집 중: {title[:20]}...", 'info')

                # POMDP 딜레이
                article_delay = delay_gen.get_delay()
                print(f"         [DELAY] {article_delay:.2f}s")

                content, thumbnail_url, detail_date, error_reason = fetch_detail(page, full_url, delay_gen)
                error_collector.increment_processed()

                if error_reason:
                    error_collector.add_error(error_reason, title, full_url)
                    print(f"         [SKIP] {error_reason}")
                    smart_delay(0.3, 0.8, 1.0)
                    continue

                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')

                if final_date < start_date:
                    stop = True
                    break

                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                subtitle, content = extract_subtitle(content, title)
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

                result = send_article_to_server(article_data)
                collected_count += 1

                if result.get('status') == 'created':
                    error_collector.add_success()
                    print(f"         [OK] 저장 완료")
                    log_to_server(REGION_CODE, 'running', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] 이미 존재")

                smart_delay(0.5, 1.5, 2.0)

            page_num += 1
            if stop:
                print("      [STOP] 수집 기간 초과, 종료합니다.")
                break

            smart_delay(1.0, 2.5, 2.0)

        browser.close()

    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"\n[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)

    return []


# ============================================================
# 11. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.0 (Enterprise Stealth)')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드')
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    parser.add_argument('--headful', action='store_true', help='브라우저 표시 모드')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date,
        headless=not args.headful
    )


if __name__ == "__main__":
    main()

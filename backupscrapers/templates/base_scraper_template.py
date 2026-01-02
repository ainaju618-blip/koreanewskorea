"""
{지역명} 보도자료 스크래퍼 템플릿
- 버전: v3.0
- 최종수정: 2025-12-12
- 담당: AI Agent

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
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import (
    safe_goto, wait_and_find, safe_get_text, safe_get_attr, log_scraper_result
)
from utils.cloudinary_uploader import download_and_upload_image

# ============================================================
# 4. 상수 정의 (TODO: 지역에 맞게 수정)
# ============================================================
REGION_CODE = 'template'                           # TODO: 영문 코드 (예: gwangju, naju)
REGION_NAME = '템플릿시'                            # TODO: 한글 지역명
CATEGORY_NAME = '전남'                              # TODO: 카테고리 (광주/전남)
BASE_URL = 'https://www.example.go.kr'             # TODO: 기본 URL
LIST_URL = 'https://www.example.go.kr/news/press'  # TODO: 보도자료 목록 URL

# 셀렉터 정의 (TODO: 실제 사이트 DOM 구조에 맞게 수정)
LIST_SELECTORS = [
    'tbody tr',              # 테이블 구조
    '.board_list tr',        # 대체 셀렉터 1
    'ul.list li',            # 리스트 구조
]

CONTENT_SELECTORS = [
    'div.view_content',      # 본문 영역
    'div.board_view',        # 대체 셀렉터 1
    'div.bbs_view',          # 대체 셀렉터 2
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


def clean_content(content: str) -> str:
    """본문에서 불필요한 메타 정보 제거"""
    if not content:
        return content

    # 제거할 패턴들
    patterns_to_remove = [
        r'작성자\s*:\s*[^\n]+',
        r'작성일\s*:\s*[^\n]+',
        r'조회수\s*:\s*\d+',
        r'담당부서\s*전화번호\s*:\s*[^\n]+',
        r'담당부서\s*:\s*[^\n]+',
        r'전화번호\s*:\s*[^\n]+',
        r'등록일\s*:\s*[^\n]+',
        r'수정일\s*:\s*[^\n]+',
        r'첨부파일\s*:\s*[^\n]*',
    ]

    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content)

    # 연속된 공백/줄바꿈 정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'^\s+', '', content)

    return content.strip()


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 담당부서를 추출합니다.

    Args:
        page: Playwright Page 객체
        url: 상세 페이지 URL

    Returns:
        (본문 텍스트, 썸네일 URL, 날짜, 담당부서) 튜플
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None

    time.sleep(1)  # 페이지 로딩 대기

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None

    # 1. 본문 추출 - 여러 셀렉터 시도
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            text = safe_get_text(content_elem)
            if text and len(text) > 50:
                content = text[:5000]
                break

    # 2. 날짜 추출 (TODO: 사이트별 날짜 위치에 맞게 수정)
    date_selectors = [
        'span:has-text("등록일")',
        'td.date',
        'span.date',
    ]
    for sel in date_selectors:
        try:
            date_elem = page.locator(sel)
            if date_elem.count() > 0:
                date_text = safe_get_text(date_elem)
                if date_text:
                    pub_date = normalize_date(date_text)
                    break
        except:
            continue

    # 3. 담당부서 추출 (TODO: 사이트별 위치에 맞게 수정)
    dept_selectors = [
        'span:has-text("담당부서")',
        'td.department',
    ]
    for sel in dept_selectors:
        try:
            dept_elem = page.locator(sel)
            if dept_elem.count() > 0:
                dept_text = safe_get_text(dept_elem)
                if dept_text:
                    department = dept_text
                    break
        except:
            continue

    # 4. 이미지 추출 및 Cloudinary 업로드
    # 방법 A: 첨부파일 다운로드 링크에서 이미지 찾기
    download_links = page.locator('a[href*="download"], a[href*="fileDown"], a[href*="boardDown"]')
    for i in range(download_links.count()):
        link = download_links.nth(i)
        title = safe_get_attr(link, 'title') or safe_get_text(link) or ""
        href = safe_get_attr(link, 'href') or ""

        if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
            img_url = urljoin(BASE_URL, href)
            # Cloudinary 업로드
            cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
            if cloudinary_url:
                thumbnail_url = cloudinary_url
                break

    # 방법 B: 본문 내 이미지 fallback
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            if imgs.count() > 0:
                src = safe_get_attr(imgs.first, 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg']):
                    img_url = urljoin(BASE_URL, src)
                    # Cloudinary 업로드
                    cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                    else:
                        thumbnail_url = img_url  # fallback: 원본 URL
                    break

    # 5. 본문 정리 (메타정보 제거)
    content = clean_content(content)

    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송합니다.

    Args:
        days: 수집할 기간 (일)
        max_articles: 최대 수집 기사 수 (기본 10개)

    Returns:
        수집된 기사 리스트 (이미 전송됨)
    """
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    collected_count = 0
    success_count = 0
    skipped_count = 0
    image_count = 0

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
            # TODO: 페이지네이션 URL 패턴 확인
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1)  # 페이지 로딩 대기

            # 목록 아이템 찾기
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                print("      [WARN] 기사 목록을 찾을 수 없습니다.")
                break

            count = rows.count()
            print(f"      [FOUND] {count}개 기사 발견")

            # 링크 정보 수집
            link_data = []
            for i in range(count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    row = rows.nth(i)

                    # TODO: 제목/링크 셀렉터 확인
                    link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0:
                        continue

                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""

                    # TODO: 날짜 셀렉터 확인 (목록에서 날짜 추출 시)
                    date_elem = row.locator('td').nth(3)  # 날짜 컬럼 위치
                    n_date = normalize_date(safe_get_text(date_elem))

                    # 날짜 필터링
                    if n_date < start_date:
                        stop = True
                        break
                    if n_date > end_date:
                        continue

                    if title and full_url:
                        link_data.append({'title': title, 'url': full_url, 'date': n_date})
                except:
                    continue

            # 상세 페이지 수집 및 전송
            for item in link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']
                n_date = item['date']

                print(f"      [ARTICLE] {title[:30]}... ({n_date})")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                content, thumbnail_url, pub_date, department = fetch_detail(page, full_url)

                # 상세 페이지에서 추출한 날짜가 있으면 사용
                if pub_date != datetime.now().strftime('%Y-%m-%d'):
                    n_date = pub_date

                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                article_data = {
                    'title': title,
                    'content': content,
                    'published_at': f"{n_date}T09:00:00+09:00",
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': CATEGORY_NAME,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }

                # 서버로 전송
                result = send_article_to_server(article_data)
                collected_count += 1

                if result.get('status') == 'created':
                    success_count += 1
                    if thumbnail_url:
                        image_count += 1
                    img_status = "[+IMG]" if thumbnail_url else "[-IMG]"
                    print(f"         [OK] saved ({img_status})")
                    log_to_server(REGION_CODE, 'running', f"Saved: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    skipped_count += 1
                    print(f"         [SKIP] Already exists (duplicate)")

                # 목록 페이지로 복귀
                safe_goto(page, list_url)
                time.sleep(0.5)  # Rate limiting

            page_num += 1
            if stop:
                print("      [STOP] 수집 기간 초과, 종료합니다.")
                break

            time.sleep(1)

        browser.close()

    # Build final message with duplicate info
    if skipped_count > 0:
        final_msg = f"Completed: {success_count} new, {skipped_count} duplicates"
    else:
        final_msg = f"Completed: {success_count} new articles"

    # Send completion log with stats (for GitHub Actions)
    log_to_server(
        REGION_CODE, 'success', final_msg, 'success',
        created_count=success_count, skipped_count=skipped_count
    )
    print(f"[OK] {final_msg}")
    return []


# ============================================================
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    # bot-service.ts 호환 인자 (필수)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(args.days, args.max_articles)


if __name__ == "__main__":
    main()

"""
Gokseong County Press Release Scraper
- Version: v1.0
- Last Modified: 2025-12-12
- Maintainer: AI Agent

Changes (v1.0):
- Initial version created
- 목록 페이지: https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151
- 상세 페이지: nttId 파라미터로 개별 기사 식별
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
from utils.scraper_utils import (
    safe_goto, wait_and_find, safe_get_text, safe_get_attr, log_scraper_result,
    clean_article_content, extract_subtitle
)
from utils.cloudinary_uploader import download_and_upload_image
from utils.category_classifier import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'gokseong'
REGION_NAME = '곡성군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.gokseong.go.kr'
LIST_URL = 'https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&menuNo=102001002000'

# 셀렉터 정의
LIST_SELECTORS = [
    'table.tbl_list tbody tr',
    'tbody tr',
]

CONTENT_SELECTORS = [
    'div.view_con',
    'div.bbs_view_con',
    'div.board_view',
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


def clean_content(content: str) -> str:
    """Remove unnecessary metadata from content"""
    if not content:
        return content

    # Patterns to remove
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

    # Clean up consecutive spaces/newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'^\s+', '', content)

    return content.strip()


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str, title: str = "") -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    Extract content, images, date, department, and subtitle from detail page.
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, None

    time.sleep(1)

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None

    # 1. Extract content
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            text = safe_get_text(content_elem)
            if text and len(text) > 50:
                content = text[:5000]
                break

    # If no content, try extracting from entire page
    if not content:
        try:
            # 곡성군 상세 페이지 구조에 맞게 추출
            view_area = page.locator('div.bbs_view, div.board_view, div.view_wrap')
            if view_area.count() > 0:
                content = safe_get_text(view_area)[:5000]
        except:
            pass

    # 2. Extract date (from detail page)
    try:
        # 곡성군: 작성일 정보 추출
        date_selectors = [
            'th:has-text("등록일") + td',
            'th:has-text("작성일") + td',
            'span.date',
            'td:has-text("2025")',
        ]
        for sel in date_selectors:
            try:
                date_elem = page.locator(sel).first
                if date_elem and date_elem.count() > 0:
                    date_text = safe_get_text(date_elem)
                    if date_text:
                        pub_date = normalize_date(date_text)
                        break
            except:
                continue
    except:
        pass

    # 3. Extract department
    try:
        dept_selectors = [
            'th:has-text("담당부서") + td',
            'th:has-text("부서") + td',
        ]
        for sel in dept_selectors:
            try:
                dept_elem = page.locator(sel).first
                if dept_elem and dept_elem.count() > 0:
                    dept_text = safe_get_text(dept_elem)
                    if dept_text:
                        department = dept_text.strip()
                        break
            except:
                continue
    except:
        pass

    # 4. Extract images and upload to Cloudinary
    # Method A: Find images within content
    try:
        img_selectors = [
            'div.view_con img',
            'div.bbs_view_con img',
            'div.board_view img',
            'div.view_wrap img',
        ]
        for sel in img_selectors:
            imgs = page.locator(sel)
            if imgs.count() > 0:
                for i in range(min(imgs.count(), 5)):  # 최대 5개까지 검사
                    img = imgs.nth(i)
                    src = safe_get_attr(img, 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                        img_url = urljoin(BASE_URL, src)
                        # Cloudinary 업로드
                        cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                        if cloudinary_url:
                            thumbnail_url = cloudinary_url
                            break
                        else:
                            thumbnail_url = img_url
                            break
                if thumbnail_url:
                    break
    except Exception as e:
        print(f"      이미지 추출 오류: {e}")

    # Method B: Find images from attachments
    if not thumbnail_url:
        try:
            download_links = page.locator('a[href*="download"], a[href*="fileDown"], a[onclick*="download"]')
            for i in range(download_links.count()):
                link = download_links.nth(i)
                title = safe_get_attr(link, 'title') or safe_get_text(link) or ""
                href = safe_get_attr(link, 'href') or ""

                if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                    img_url = urljoin(BASE_URL, href)
                    cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                        break
        except:
            pass

    # Skip if no image
    if not thumbnail_url:
        print(f"      [스킵] 이미지 없음")
        return None, None, None, None, None

    # Remove unnecessary metadata from content
    content = clean_article_content(content)

    # 곡성군 특수 처리: 본문 상단 4줄 제거 (메타 정보 포함)
    if content:
        lines = content.split('\n')
        if len(lines) > 4:
            content = '\n'.join(lines[4:]).strip()

    # Extract subtitle
    subtitle, content = extract_subtitle(content, title)

    return content, thumbnail_url, pub_date, department, subtitle


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Collect press releases and send to server.
    """
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    collected_count = 0
    success_count = 0
    image_count = 0
    skip_count = 0
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
            # 곡성군 페이지네이션: pageIndex 파라미터
            list_url = f'{LIST_URL}&pageIndex={page_num}'
            print(f"   [페이지 {page_num}] 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1)

            # Find list items
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                print("      [!] 기사 목록을 찾을 수 없습니다.")
                break

            count = rows.count()
            print(f"      [{count}개 기사 발견]")

            # Collect link information
            link_data = []
            seen_urls = set()  # Duplicate URL check

            for i in range(count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    row = rows.nth(i)

                    # Exclude notices (number is  '공지'인 경우)
                    try:
                        num_cell = row.locator('td').first
                        num_text = safe_get_text(num_cell)
                        if '공지' in num_text:
                            continue
                    except:
                        pass

                    # Extract title/link
                    link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0:
                        continue

                    title = safe_get_text(link_elem)
                    if not title:
                        continue

                    # href 또는 onclick에서 URL 추출
                    href = safe_get_attr(link_elem, 'href')
                    onclick = safe_get_attr(link_elem, 'onclick')

                    full_url = ""
                    if href and 'view.do' in href:
                        full_url = urljoin(BASE_URL, href)
                    elif onclick:
                        # onclick="fn_view('105322')" 패턴
                        match = re.search(r"fn_view\(['\"]?(\d+)['\"]?\)", onclick)
                        if match:
                            ntt_id = match.group(1)
                            full_url = f"{BASE_URL}/kr/board/view.do?bbsId=BBS_000000000000151&pageIndex={page_num}&nttId={ntt_id}&menuNo=102001002000"

                    if not full_url:
                        continue

                    # Extract date (from list)
                    try:
                        # 곡성군: 테이블 구조에서 날짜 컬럼 (보통 4번째 또는 5번째)
                        cells = row.locator('td')
                        for j in range(cells.count()):
                            cell_text = safe_get_text(cells.nth(j))
                            if re.search(r'\d{4}[-./]\d{1,2}[-./]\d{1,2}', cell_text):
                                n_date = normalize_date(cell_text)
                                break
                        else:
                            n_date = datetime.now().strftime('%Y-%m-%d')
                    except:
                        n_date = datetime.now().strftime('%Y-%m-%d')

                    # Date filtering
                    if n_date < start_date:
                        stop = True
                        break
                    if n_date > end_date:
                        continue

                    # ★ 중복 URL 체크
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    if title and full_url:
                        link_data.append({'title': title.strip(), 'url': full_url, 'date': n_date})
                except Exception as e:
                    print(f"      행 파싱 오류: {e}")
                    continue

            # Collect and send detail pages
            for item in link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']
                n_date = item['date']

                print(f"      > {title[:30]}... ({n_date})")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                content, thumbnail_url, pub_date, department, subtitle = fetch_detail(page, full_url, title)

                # Skip articles without images
                if content is None:
                    skip_count += 1
                    continue

                # Use date extracted from detail page if available
                if pub_date and pub_date != datetime.now().strftime('%Y-%m-%d'):
                    n_date = pub_date

                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # Auto-categorize
                cat_code, cat_name = detect_category(title, content)

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': f"{n_date}T09:00:00+09:00",
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
                    if thumbnail_url:
                        image_count += 1
                    img_status = "O" if thumbnail_url else "X"
                    print(f"         [OK] 저장 완료 ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    skipped_count += 1
                    print(f"         [SKIP] 이미 존재")

                # Return to list page
                safe_goto(page, list_url)
                time.sleep(0.5)

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
    log_to_server(REGION_CODE, 'success', final_msg, 'success', created_count=success_count, skipped_count=skipped_count)
    print(f"[완료] {final_msg}")
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

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

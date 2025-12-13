"""
강진군 보도자료 스크래퍼
- 버전: v1.0
- 최종수정: 2025-12-12
- 담당: AI Agent

변경점 (v1.0):
- 초기 버전 생성
- 정적 HTML 페이지 스크래핑
- 이미지 직접 접근 (핫링크 허용)
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
# 4. 상수 정의
# ============================================================
REGION_CODE = 'gangjin'
REGION_NAME = '강진군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.gangjin.go.kr'
LIST_URL = 'https://www.gangjin.go.kr/www/government/news/press'

# 셀렉터 정의
LIST_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',  # 직접 링크 셀렉터
    'li a[href*="idx="]',
]

CONTENT_SELECTORS = [
    'div.text_viewbox',  # 강진군 본문 영역
    'div.viewbox',
    'div.contbox',
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
        r'파일\s*:\s*[^\n]*',
        r'\[jpg,[^\]]+\]',  # [jpg,11.46 MB] 형태
        r'\[png,[^\]]+\]',
        r'\[jpeg,[^\]]+\]',
    ]

    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    # 연속된 공백/줄바꿈 정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'^\s+', '', content)

    return content.strip()


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[Optional[str], Optional[str], str, Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 담당부서를 추출합니다.

    Returns:
        (본문, 썸네일URL, 날짜, 담당부서) - 이미지 없으면 (None, None, None, None) 반환
    """
    if not safe_goto(page, url, timeout=20000):
        return None, None, datetime.now().strftime('%Y-%m-%d'), None

    time.sleep(1)

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None

    # 1. 본문 추출
    for sel in CONTENT_SELECTORS:
        try:
            content_elem = page.locator(sel)
            if content_elem.count() > 0:
                text = safe_get_text(content_elem.first)
                if text and len(text) > 50:
                    content = text[:5000]
                    break
        except:
            continue

    # 본문 fallback: 다른 셀렉터 시도
    if not content or len(content) < 50:
        try:
            # 제목 다음의 본문 영역 시도
            body_elem = page.locator('div.bbs-view-body, div.view-body, article')
            if body_elem.count() > 0:
                text = safe_get_text(body_elem.first)
                if text and len(text) > 50:
                    content = text[:5000]
        except:
            pass

    # 2. 날짜 추출 - 강진군: div.view_titlebox 내 dd 첫번째
    try:
        date_elem = page.locator('div.view_titlebox dd').first
        if date_elem.count() > 0:
            date_text = safe_get_text(date_elem)
            if date_text:
                pub_date = normalize_date(date_text)
    except:
        pass

    # 3. 담당부서 추출 - 강진군: #page_info 영역
    try:
        # "담당부서" dt 다음의 dd
        dept_elem = page.locator('#page_info dd').first
        if dept_elem.count() > 0:
            dept_text = safe_get_text(dept_elem)
            if dept_text:
                department = dept_text.strip()
    except:
        pass

    # 4. 이미지 추출 - 강진군: div.image_viewbox img
    # 방법 A: image_viewbox 내 이미지 (가장 확실)
    try:
        img_elem = page.locator('div.image_viewbox img, div.image_viewbox_inner img')
        if img_elem.count() > 0:
            src = safe_get_attr(img_elem.first, 'src')
            if src:
                # 상대경로 ./ybmodule.file/... -> 절대경로로 변환
                if src.startswith('./'):
                    src = src[2:]  # ./ 제거
                img_url = urljoin(url, src)  # 현재 페이지 URL 기준
                uploaded_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                if uploaded_url:
                    thumbnail_url = uploaded_url
    except:
        pass

    # 방법 B: viewbox 내 다른 이미지
    if not thumbnail_url:
        try:
            imgs = page.locator('div.viewbox img, div.contbox img')
            if imgs.count() > 0:
                for i in range(min(imgs.count(), 3)):
                    img = imgs.nth(i)
                    src = safe_get_attr(img, 'src')
                    if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg']):
                        if src.startswith('./'):
                            src = src[2:]
                        img_url = urljoin(url, src)
                        uploaded_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                        if uploaded_url:
                            thumbnail_url = uploaded_url
                            break
        except:
            pass

    # 방법 C: 첨부파일 다운로드 링크에서 이미지 추출
    if not thumbnail_url:
        try:
            # 첨부파일 목록에서 이미지 파일 찾기
            file_items = page.locator('div.file_body li')
            for i in range(min(file_items.count(), 3)):
                item = file_items.nth(i)
                # 파일명에서 이미지 확장자 확인
                name_elem = item.locator('span.name')
                if name_elem.count() > 0:
                    filename = safe_get_text(name_elem)
                    if filename and any(ext in filename.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                        # 다운로드 버튼의 onclick에서 URL 추출
                        btn = item.locator('button[onclick*="file_download"]')
                        if btn.count() > 0:
                            onclick = safe_get_attr(btn, 'onclick')
                            if onclick:
                                # window.open('/ybscript.io/common/file_download/...')
                                match = re.search(r"window\.open\('([^']+)'", onclick)
                                if match:
                                    download_url = urljoin(BASE_URL, match.group(1))
                                    uploaded_url = download_and_upload_image(download_url, BASE_URL, folder=REGION_CODE)
                                    if uploaded_url:
                                        thumbnail_url = uploaded_url
                                        break
        except:
            pass

    # 이미지 없으면 스킵
    if not thumbnail_url:
        print(f"      [SKIP] 이미지 없음")
        return None, None, None, None

    # 본문 정리 (메타정보 제거)
    content = clean_content(content)

    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송합니다.
    """
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    collected_count = 0
    success_count = 0
    image_count = 0
    skip_count = 0

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
            # 강진군 페이지네이션: ?page={N}
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [페이지 {page_num}] 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')

            if not safe_goto(page, list_url):
                page_num += 1
                continue

            time.sleep(1)

            # 목록 아이템 찾기
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                print("      [!] 기사 목록을 찾을 수 없습니다.")
                break

            count = rows.count()
            print(f"      [{count}개 기사 발견]")

            # 링크 정보 수집 (rows가 직접 링크 요소들임)
            link_data = []
            seen_urls = set()  # ★ 중복 URL 체크용

            for i in range(count):
                if collected_count + len(link_data) >= max_articles:
                    break

                try:
                    link_elem = rows.nth(i)

                    # 링크 텍스트 = 제목
                    title = safe_get_text(link_elem) or ""
                    # 줄바꿈 제거하고 제목만 추출
                    title = title.split('\n')[0].strip()
                    if not title or len(title) < 5:
                        continue

                    href = safe_get_attr(link_elem, 'href')
                    if not href:
                        continue

                    full_url = urljoin(BASE_URL, href)

                    # ★ 중복 URL 체크 - 이미 수집한 URL이면 스킵
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    # 날짜는 상세 페이지에서 추출 (목록에서 날짜 위치 불명확)
                    n_date = datetime.now().strftime('%Y-%m-%d')

                    link_data.append({'title': title, 'url': full_url, 'date': n_date})
                except Exception as e:
                    continue

            # 상세 페이지 수집 및 전송
            for item in link_data:
                if collected_count >= max_articles:
                    break

                title = item['title']
                full_url = item['url']
                n_date = item['date']

                print(f"      > {title[:30]}... ({n_date})")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')

                content, thumbnail_url, pub_date, department = fetch_detail(page, full_url)

                # 이미지 없는 기사 스킵
                if content is None:
                    skip_count += 1
                    continue

                # 상세 페이지에서 추출한 날짜가 있으면 사용
                if pub_date and pub_date != datetime.now().strftime('%Y-%m-%d'):
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
                    img_status = "O" if thumbnail_url else "X"
                    print(f"         [OK] 저장 완료 ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         [SKIP] 이미 존재")

                # 목록 페이지로 복귀
                safe_goto(page, list_url)
                time.sleep(0.5)

            page_num += 1
            if stop:
                print("      [STOP] 수집 기간 초과, 종료합니다.")
                break

            time.sleep(1)

        browser.close()

    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개, 이미지 {image_count}개, 스킵 {skip_count}개)"
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
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

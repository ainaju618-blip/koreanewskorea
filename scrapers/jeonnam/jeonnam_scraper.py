# -*- coding: utf-8 -*-
"""전라남도청 보도자료 스크래퍼 v3.2 (Cloudinary Integration)
- Collect & Visit 패턴 적용
- Strict Verification 로직 추가
- Cloudinary 이미지 업로드 통합
- 최종수정: 2025-12-13
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle, detect_category
from utils.cloudinary_uploader import download_and_upload_image

REGION_CODE = 'jeonnam'
REGION_NAME = '전라남도'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jeonnam.go.kr'
LIST_URL = 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000'

LIST_SELECTORS = ['tbody tr']
LINK_SELECTORS = ['td.title a', 'td a']
CONTENT_SELECTORS = ['div.bbs_view_contnet', 'div.preview_area', 'div.bbs_view', 'div.contents']


def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', date_str)
        if match:
            return match.group(1)
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def validate_article(article_data: Dict) -> Tuple[bool, str]:
    """엄격한 데이터 검증 로직"""
    # 1. 제목 검증
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "[검증 실패] 제목이 너무 짧거나 없습니다."

    # 2. 본문 검증
    content = article_data.get('content', '')
    if not content or len(content) < 50:
        return False, f"[검증 실패] 본문 내용이 부족합니다. (길이: {len(content)})"
    if "본문 내용을 가져올 수 없습니다" in content:
        return False, "[검증 실패] 본문 스크래핑 오류 메시지가 감지되었습니다."

    # 3. 이미지 URL 검증 (선택적이지만, 있으면 유효해야 함)
    img_url = article_data.get('thumbnail_url')
    if img_url and not img_url.startswith('http'):
        return False, f"[검증 실패] 이미지 URL이 유효하지 않습니다: {img_url}"

    return True, "[검증 통과]"


def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str]]:
    """상세 페이지에서 본문/이미지/날짜 추출"""
    if not safe_goto(page, url, timeout=20000):
        print(f"   [WARN] 페이지 접속 실패: {url}")
        return "", None, None

    # 1. 본문 추출
    content = ""
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            text = safe_get_text(content_elem)
            if text and len(text) > 50:
                content = clean_article_content(text[:5000])
                break

    # 2. 이미지 추출 - 첨부파일 다운로드 링크에서
    thumbnail_url = None
    original_image_url = None
    try:
        download_links = page.locator('a[href*="boardDown.do"]')
        for i in range(download_links.count()):
            link = download_links.nth(i)
            title = safe_get_attr(link, 'title') or ""
            href = safe_get_attr(link, 'href') or ""

            if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                original_image_url = urljoin(BASE_URL, href)
                print(f"      [IMG] 첨부파일 이미지 발견: {title}")
                break
    except Exception as e:
        print(f"   [WARN] 첨부파일 이미지 추출 에러: {str(e)}")

    # 본문 내 이미지 fallback
    if not original_image_url:
        try:
            for sel in CONTENT_SELECTORS:
                imgs = page.locator(f'{sel} img')
                if imgs.count() > 0:
                    src = safe_get_attr(imgs.first, 'src')
                    if src and 'icon' not in src.lower() and 'button' not in src.lower():
                        original_image_url = urljoin(BASE_URL, src)
                        print(f"      [IMG] 본문 이미지 fallback: {src[:50]}...")
                        break
        except Exception as e:
            print(f"   [WARN] 본문 이미지 추출 에러: {str(e)}")

    # 3. Cloudinary 업로드 (이미지가 있으면)
    if original_image_url:
        try:
            cloudinary_url = download_and_upload_image(original_image_url, BASE_URL, folder="jeonnam")
            if cloudinary_url and cloudinary_url.startswith('https://res.cloudinary.com'):
                thumbnail_url = cloudinary_url
                print(f"      [CLOUD] Cloudinary 업로드 완료")
            else:
                thumbnail_url = original_image_url  # Fallback to original
                print(f"      [WARN] Cloudinary 업로드 실패, 원본 URL 사용")
        except Exception as e:
            thumbnail_url = original_image_url  # Fallback to original
            print(f"      [WARN] Cloudinary 업로드 에러: {str(e)[:50]}")

    # 4. 날짜 추출
    pub_date = None
    try:
        date_elem = page.locator('span:has-text("등록일"), li:has-text("등록일"), td.date')
        if date_elem.count() > 0:
            date_text = safe_get_text(date_elem.first)
            pub_date = normalize_date(date_text)
    except:
        pass

    return content, thumbnail_url, pub_date


def collect_articles(days: int = 3, start_date: str = None, end_date: str = None) -> List[Dict]:
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (Strict Verification Mode)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.0 시작', 'info')

    collected_links = []

    # ============================================
    # Phase 1: Collect Phase - 링크 수집
    # ============================================
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()

        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        # 1~3페이지 순회하며 링크 수집
        for page_num in range(1, 4):
            list_url = f'{LIST_URL}&pageIndex={page_num}'
            print(f"   [PAGE] 목록 페이지 {page_num} 스캔 중...")

            if not safe_goto(page, list_url):
                print(f"   [WARN] 페이지 {page_num} 접속 실패, 건너뜀")
                continue

            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                print("   [WARN] 기사 목록을 발견하지 못했습니다.")
                continue

            count = rows.count()
            print(f"      [LINK] {count}개 행 발견")

            stop_collecting = False
            for i in range(count):
                try:
                    row = rows.nth(i)
                    link_elem = wait_and_find(row, LINK_SELECTORS, timeout=3000)
                    if not link_elem:
                        continue

                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""

                    # 날짜 필터링
                    date_elem = row.locator('td.date')
                    n_date = normalize_date(safe_get_text(date_elem))

                    if n_date < start_date:
                        stop_collecting = True
                        break
                    if n_date > end_date:
                        continue

                    if title and full_url and 'boardView' in full_url:
                        collected_links.append({'title': title, 'url': full_url, 'date': n_date})
                except Exception as e:
                    print(f"      [WARN] 링크 파싱 에러: {str(e)}")

            if stop_collecting:
                print("      [STOP] 수집 기간 초과, 링크 수집 종료")
                break

            time.sleep(0.5)

        print(f"[OK] 총 {len(collected_links)}개의 수집 대상 링크 확보 완료.")

        # ============================================
        # Phase 2: Visit Phase - 상세 페이지 방문
        # ============================================
        success_count = 0
        processed_count = 0

        # 안정화를 위해 최대 10개까지만 처리
        target_links = collected_links[:10]

        for item in target_links:
            url = item['url']
            title = item['title']
            list_date = item['date']

            print(f"   [{processed_count+1}] 분석 중: {title[:30]}...")

            content, thumbnail_url, pub_date = fetch_detail(page, url)

            # 부제목 추출
            subtitle, content = extract_subtitle(content, title)

            # 날짜 결정 (상세 페이지 > 목록 페이지)
            final_date = pub_date if pub_date else list_date

            # 카테고리 자동 분류
            cat_code, cat_name = detect_category(title, content)

            # 데이터 객체 생성
            article_data = {
                'title': title,
                'subtitle': subtitle,
                'content': content,
                'published_at': f"{final_date}T09:00:00+09:00",
                'original_link': url,
                'source': REGION_NAME,
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }

            # ============================================
            # Phase 3: Verification Phase - 엄격한 검증
            # ============================================
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")

            if is_valid:
                # Phase 4: Ingestion - DB 적재
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      [OK] DB 저장 완료 ID: {result.get('id', 'Unknown')}")
                    success_count += 1
                    log_to_server(REGION_CODE, '실행중', f"성공: {title[:10]}...", 'success')
                else:
                    print(f"      [WARN] DB 저장 실패 API 응답: {result}")

            processed_count += 1
            time.sleep(1)  # 부하 조절

        browser.close()

    final_msg = f"작업 종료: 총 {processed_count}건 처리 / {success_count}건 저장 성공"
    print(f"[완료] {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드')
    # bot-service.ts 호환 인자 (필수)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()
    collect_articles(
        days=args.days,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

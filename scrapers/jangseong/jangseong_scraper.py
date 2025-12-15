# -*- coding: utf-8 -*-
"""장성군청 보도자료 스크래퍼 v2.0
- 사이트: https://www.jangseong.go.kr/
- 대상: 보도자료 게시판 (/home/www/news/jangseong/bodo)
- 최종수정: 2025-12-13
- 변경사항: local_image_saver로 마이그레이션
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
from utils.cloudinary_uploader import download_and_upload_image
from utils.text_cleaner import clean_article_content
from utils.category_classifier import detect_category

# ============================================
# 상수 정의
# ============================================
REGION_CODE = 'jangseong'
REGION_NAME = '장성군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jangseong.go.kr'
LIST_URL = 'https://www.jangseong.go.kr/home/www/news/jangseong/bodo'

# 셀렉터
ARTICLE_LINK_SELECTOR = 'a[href*="/bodo/show/"]'
TABLE_ROW_SELECTOR = 'table tbody tr'

# 상세 페이지 셀렉터
DETAIL_TITLE_SELECTOR = '.view_title, .board_view h3, h3.title'
DETAIL_CONTENT_SELECTOR = '.view_content, .board_view_body, .content'
DETAIL_DATE_SELECTOR = '.info, .date, .view_info'
DETAIL_IMAGE_SELECTOR = '.view_content img, .board_view_body img, .content img'


def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    try:
        # YYYY-MM-DD 패턴 추출
        match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

        # YYYY.MM.DD 패턴
        match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        pass

    return datetime.now().strftime('%Y-%m-%d')


def validate_article(article_data: Dict) -> Tuple[bool, str]:
    """데이터 검증"""
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "[검증 실패] 제목이 너무 짧거나 없습니다."

    content = article_data.get('content', '')
    if not content or len(content) < 50:
        return False, f"[검증 실패] 본문 내용이 부족합니다. (길이: {len(content)})"

    return True, "[검증 통과]"




def safe_get_text(locator) -> str:
    """안전하게 텍스트 추출"""
    try:
        if locator.count() > 0:
            return locator.first.inner_text().strip()
    except:
        pass
    return ""


def safe_get_attr(locator, attr: str) -> Optional[str]:
    """안전하게 속성 추출"""
    try:
        if locator.count() > 0:
            return locator.first.get_attribute(attr)
    except:
        pass
    return None


def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
    """상세 페이지에서 본문/이미지/날짜/담당부서 추출"""
    try:
        page.goto(url, timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(1500)
    except Exception as e:
        print(f"   [WARN] 페이지 접속 실패: {url}")
        return "", None, None, None

    # 1. 본문 추출
    content = ""
    try:
        # 여러 셀렉터 시도
        for selector in ['.view_content', '.board_view_body', '.content', '#content', '.bbs_view_content']:
            content_elem = page.locator(selector)
            if content_elem.count() > 0:
                content = content_elem.first.inner_text().strip()
                if len(content) > 50:
                    break

        # 메타 정보 제거 (날짜, 조회수, 저작권 문구 등)
        content = clean_article_content(content)
        content = content[:5000]  # 최대 5000자
    except Exception as e:
        print(f"   [WARN] 본문 추출 에러: {str(e)}")

    # 2. 이미지 추출
    thumbnail_url = None
    original_image_url = None
    try:
        # 장성군청 본문 이미지 찾기 (img_control 클래스 내부)
        for selector in ['.img_control img', '.view_content img', '.board_view_body img', '.content img']:
            imgs = page.locator(selector)
            img_count = imgs.count()
            if img_count > 0:
                for i in range(min(img_count, 5)):
                    src = imgs.nth(i).get_attribute('src')
                    if src and 'icon' not in src.lower() and 'logo' not in src.lower() and 'button' not in src.lower() and 'kogl' not in src.lower():
                        original_image_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                        print(f"      [IMG] 이미지 발견: {original_image_url[:60]}...")
                        break
                if original_image_url:
                    break
    except Exception as e:
        print(f"   [WARN] 이미지 추출 에러: {str(e)}")

    # 3. 로컬 이미지 저장 (이미지가 있으면)
    if original_image_url:
        try:
            local_path = download_and_upload_image(original_image_url, BASE_URL, REGION_CODE)
            if local_path and local_path.startswith('/images/'):
                thumbnail_url = local_path
                print(f"      [LOCAL] 이미지 저장 완료: {local_path}")
            else:
                thumbnail_url = original_image_url
        except Exception as e:
            thumbnail_url = original_image_url
            print(f"      [WARN] 이미지 저장 에러: {str(e)[:50]}")

    # 4. 날짜 추출
    pub_date = None
    try:
        # 페이지 전체 텍스트에서 날짜 패턴 찾기
        page_text = page.locator('body').inner_text()
        match = re.search(r'(\d{4}-\d{2}-\d{2})', page_text)
        if match:
            pub_date = match.group(1)
    except:
        pass

    # 5. 담당부서 추출
    department = None
    try:
        page_text = page.locator('body').inner_text()
        # "기획실", "xxx과" 등의 패턴 찾기
        match = re.search(r'([\w]+(?:실|과|팀|센터))', page_text)
        if match:
            department = match.group(1)
    except:
        pass

    return content, thumbnail_url, pub_date, department


def collect_articles(days: int = 7, max_articles: int = 10, start_date: str = None, end_date: str = None) -> List[Dict]:
    """기사 수집 메인 함수"""
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    collected_links = []
    if not start_date:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    else:
        cutoff_date = start_date

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')

    # ============================================
    # Phase 1: 링크 수집
    # ============================================
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()

        # 1~3페이지 순회
        for page_num in range(1, 4):
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] 목록 페이지 {page_num} 스캔 중...")

            try:
                page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
                page.wait_for_timeout(1500)
            except Exception as e:
                print(f"   [WARN] 페이지 {page_num} 접속 실패: {str(e)}")
                continue

            # 기사 링크 추출
            links = page.locator(ARTICLE_LINK_SELECTOR)
            count = links.count()
            print(f"      [LINK] {count}개 기사 발견")

            if count == 0:
                print("   [WARN] 기사 목록을 발견하지 못했습니다.")
                continue

            stop_collecting = False
            for i in range(count):
                try:
                    link = links.nth(i)

                    # 제목과 링크 추출
                    title = link.inner_text().strip()
                    href = link.get_attribute('href')

                    if not title or not href:
                        continue

                    # URL 완성
                    full_url = urljoin(BASE_URL, href)

                    # ID 추출 (/show/79036)
                    match = re.search(r'/show/(\d+)', href)
                    article_id = match.group(1) if match else None

                    # 날짜는 상세 페이지에서 추출
                    article_date = datetime.now().strftime('%Y-%m-%d')

                    collected_links.append({
                        'id': article_id,
                        'title': title,
                        'url': full_url,
                        'date': article_date
                    })

                except Exception as e:
                    print(f"      [WARN] 링크 파싱 에러: {str(e)}")

            if stop_collecting:
                print("      [STOP] 수집 기간 초과, 링크 수집 종료")
                break

            time.sleep(0.5)

        print(f"[OK] 총 {len(collected_links)}개의 수집 대상 링크 확보 완료.")

        # ============================================
        # Phase 2: 상세 페이지 방문
        # ============================================
        success_count = 0
        skip_count = 0
        processed_count = 0

        target_links = collected_links[:max_articles]

        for item in target_links:
            url = item['url']
            title = item['title']
            list_date = item['date']

            print(f"   [{processed_count+1}] 분석 중: {title[:40]}...")

            content, thumbnail_url, pub_date, department = fetch_detail(page, url)

            # 날짜 결정 (상세 페이지 > 목록 페이지)
            final_date = pub_date if pub_date else list_date

            # 카테고리 자동 분류
            cat_code, cat_name = detect_category(title, content)

            # 데이터 객체 생성
            article_data = {
                'title': title,
                'content': content,
                'published_at': f"{final_date}T09:00:00+09:00",
                'original_link': url,
                'source': REGION_NAME,
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
                'department': department,
            }

            # ============================================
            # Phase 3: 검증 및 DB 적재
            # ============================================
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")

            if is_valid:
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      [OK] DB 저장 완료 ID: {result.get('id', 'Unknown')}")
                    success_count += 1
                    log_to_server(REGION_CODE, '실행중', f"성공: {title[:15]}...", 'success')
                elif result and result.get('status') == 'exists':
                    print(f"      [SKIP] 이미 존재하는 기사")
                    skip_count += 1
                else:
                    print(f"      [WARN] DB 저장 실패: {result}")

            processed_count += 1
            time.sleep(1)  # 부하 조절

        browser.close()

    final_msg = f"작업 종료: 총 {processed_count}건 처리 / {success_count}건 저장 / {skip_count}건 스킵"
    print(f"[완료] {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description='장성군청 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=7, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 개수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드')
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

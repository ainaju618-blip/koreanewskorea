# -*- coding: utf-8 -*-
"""전라남도교육청(전남교육통) 보도자료 스크래퍼 v1.0
- 사이트: https://www.jnedu.kr/
- 대상: 본청 기사목록 (sc_section_code=S1N1)
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running, check_duplicates
from utils.cloudinary_uploader import download_and_upload_image
from utils.error_collector import ErrorCollector
from utils.scraper_utils import clean_article_content, extract_subtitle
from utils.category_detector import detect_category
from utils.category_detector import detect_category


def safe_str(text: str) -> str:
    """Safely encode text for Windows console output (cp949)"""
    try:
        return text.encode('cp949', errors='replace').decode('cp949')
    except:
        return text


# ============================================
# 상수 정의
# ============================================
REGION_CODE = 'jeonnam_edu'
REGION_NAME = '전남교육청'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jnedu.kr'
LIST_URL = 'https://www.jnedu.kr/news/articleList.html?sc_section_code=S1N1&view_type=sm'

# 셀렉터 - 기사 링크를 직접 선택
ARTICLE_LINK_SELECTOR = 'section ul li h4 a[href*="articleView"]'
DATE_SELECTOR = 'em'

# 상세 페이지 셀렉터
DETAIL_TITLE_SELECTOR = 'header.article-view-header h2.heading'
DETAIL_CONTENT_SELECTOR = 'article#article-view-content-div'
DETAIL_DATE_SELECTOR = 'header.article-view-header ul.infomation li'
# 이미지 셀렉터 - figure.photo-layout 클래스 사용
DETAIL_IMAGE_SELECTOR = 'figure.photo-layout img'


def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')

    # "입력 2025.12.12 15:43" 또는 "2025.12.12 15:43" 형식 처리
    date_str = date_str.replace('입력', '').strip()

    try:
        # YYYY.MM.DD 패턴 추출
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


def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], Optional[str], Optional[str], Optional[str]]:
    """상세 페이지에서 본문/이미지/날짜/담당부서 추출
    
    Returns:
        (content, thumbnail_url, pub_date, department, error_reason)
        - error_reason is None on success
    """
    try:
        page.goto(url, timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
    except Exception as e:
        print(f"   [WARN] 페이지 접속 실패: {url}")
        return "", None, None, None, "PAGE_LOAD_FAIL"

    # 1. 본문 추출
    content = ""
    try:
        content_elem = page.locator(DETAIL_CONTENT_SELECTOR)
        if content_elem.count() > 0:
            # 본문 텍스트만 추출 (이미지 캡션 제외)
            paragraphs = content_elem.locator('p, div.article-body')
            texts = []
            for i in range(paragraphs.count()):
                text = paragraphs.nth(i).inner_text().strip()
                if text and len(text) > 10:
                    texts.append(text)
            content = '\n\n'.join(texts)

            # fallback: 전체 텍스트
            if not content or len(content) < 50:
                content = content_elem.inner_text().strip()

            # 공통 본문 정제 함수 적용
            content = clean_article_content(content)
    except Exception as e:
        print(f"   [WARN] 본문 추출 에러: {str(e)}")

    # 2. 이미지 추출 - figure.photo-layout img 사용
    thumbnail_url = None
    original_image_url = None
    try:
        # 먼저 figure.photo-layout img 시도
        imgs = page.locator(DETAIL_IMAGE_SELECTOR)
        img_count = imgs.count()
        print(f"      [IMG] figure.photo-layout img 발견: {img_count}개")

        if img_count > 0:
            src = imgs.first.get_attribute('src')
            if src and 'icon' not in src.lower():
                original_image_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                print(f"      [IMG] 이미지 URL: {original_image_url[:80]}...")
        else:
            # fallback: article 내 모든 이미지 시도
            fallback_imgs = page.locator('article img')
            fallback_count = fallback_imgs.count()
            print(f"      [IMG] fallback article img 발견: {fallback_count}개")
            for i in range(min(fallback_count, 5)):
                src = fallback_imgs.nth(i).get_attribute('src')
                if src and 'icon' not in src.lower() and 'logo' not in src.lower():
                    original_image_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    print(f"      [IMG] fallback 이미지 URL: {original_image_url[:80]}...")
                    break
    except Exception as e:
        print(f"   [WARN] 이미지 추출 에러: {str(e)}")

    # 3. Cloudinary 업로드 (이미지가 있으면)
    if original_image_url:
        try:
            cloudinary_url = download_and_upload_image(original_image_url, BASE_URL, folder="jeonnam_edu")
            if cloudinary_url and (cloudinary_url.startswith('https://res.cloudinary.com') or cloudinary_url.startswith('/images/')):
                thumbnail_url = cloudinary_url
                print(f"      [CLOUD] 이미지 저장 완료")
            else:
                thumbnail_url = original_image_url
        except Exception as e:
            thumbnail_url = original_image_url
            print(f"      [WARN] 이미지 저장 에러: {str(e)[:50]}")

    # 4. 날짜 추출
    pub_date = None
    try:
        info_items = page.locator(DETAIL_DATE_SELECTOR)
        for i in range(info_items.count()):
            text = info_items.nth(i).inner_text().strip()
            if '입력' in text or re.search(r'\d{4}[\.-]\d{2}[\.-]\d{2}', text):
                # 1. 시간 포함 패턴 (YYYY.MM.DD HH:MM)
                dt_match = re.search(r'(\d{4})[\.-](\d{1,2})[\.-](\d{1,2})\s+(\d{1,2}):(\d{1,2})', text)
                if dt_match:
                    y, m, d, hh, mm = dt_match.groups()
                    pub_date = f"{y}-{int(m):02d}-{int(d):02d}T{int(hh):02d}:{int(mm):02d}:00+09:00"
                    break
                
                # 2. 날짜만 있는 패턴
                pub_date = normalize_date(text)
                break
    except:
        pass

    # 5. 담당부서 추출
    department = None
    try:
        # 기자명/담당자 정보에서 담당과 추출
        byline = page.locator('header.article-view-header .infomation')
        if byline.count() > 0:
            byline_text = byline.inner_text()
            # "본청 학령인구정책과 장학사 박진영" 형식에서 담당과 추출
            match = re.search(r'본청\s+(\S+과)', byline_text)
            if match:
                department = match.group(1)
    except:
        pass

    # 이미지가 없으면 스킵
    if not thumbnail_url:
        return "", None, pub_date, department, ErrorCollector.IMAGE_MISSING

    return content, thumbnail_url, pub_date, department, None  # success


def collect_articles(days: int = 7, max_articles: int = 30, start_date: str = None, end_date: str = None) -> List[Dict]:
    """기사 수집 메인 함수"""
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []

    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    collected_links = []
    if not start_date:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    else:
        cutoff_date = start_date

    # cutoff_date가 날짜 객체가 아닌 문자열인지 확인 (YYYY-MM-DD)
    if 'T' in cutoff_date:
        cutoff_date = cutoff_date.split('T')[0]

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
            list_url = f'{LIST_URL}&page={page_num}'
            print(f"   [PAGE] 목록 페이지 {page_num} 스캔 중...")

            try:
                page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
                page.wait_for_timeout(1000)
            except Exception as e:
                print(f"   [WARN] 페이지 {page_num} 접속 실패: {str(e)}")
                continue

            # 기사 링크 직접 추출
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

                    # 날짜는 상세 페이지에서 추출
                    article_date = datetime.now().strftime('%Y-%m-%d')

                    # 날짜 필터링 (목록에서 날짜 확인 불가능하므로 상세에서 처리해야 하나, 여기선 일단 패스)
                    # 실제 필터링은 상세 페이지 날짜 확인 후 적용하거나, 목록에 날짜가 있다면 여기서 처리
                    
                    # URL 완성
                    full_url = urljoin(BASE_URL, href)

                    # idxno 추출
                    match = re.search(r'idxno=(\d+)', href)
                    article_id = match.group(1) if match else None

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

        print(f"[OK] Total {len(collected_links)} target links collected.")

        # Pre-check duplicates before visiting detail pages (optimization)
        urls_to_check = [item['url'] for item in collected_links[:max_articles]]
        existing_urls = check_duplicates(urls_to_check)

        # Filter out already existing articles
        new_link_data = [item for item in collected_links[:max_articles] if item['url'] not in existing_urls]
        skipped_by_precheck = len(collected_links[:max_articles]) - len(new_link_data)
        if skipped_by_precheck > 0:
            print(f"      [PRE-CHECK] {skipped_by_precheck} articles skipped (already in DB)")

        # ============================================
        # Phase 2: Visit detail pages
        # ============================================
        error_collector = ErrorCollector(REGION_CODE, REGION_NAME)
        processed_count = 0

        target_links = new_link_data

        for item in target_links:
            url = item['url']
            title = item['title']
            list_date = item['date']

            print(f"   [{processed_count+1}] Processing: {safe_str(title[:40])}...")

            content, thumbnail_url, pub_date, department, error_reason = fetch_detail(page, url)
            error_collector.increment_processed()

            # 에러 발생 시 스킵
            if error_reason:
                error_collector.add_error(error_reason, title, url)
                print(f"         [SKIP] {error_reason}")
                time.sleep(0.5)
                continue

            # Determine date (detail page > list page)
            final_date = pub_date if pub_date else list_date

            # Extract subtitle
            subtitle, content = extract_subtitle(content, title)

            # Auto-categorize
            cat_code, cat_name = detect_category(title, content)

            # published_at 처리 (시간 포함 여부 확인)
            if 'T' in final_date and '+09:00' in final_date:
                    published_at = final_date
            else:
                    published_at = f"{final_date}T09:00:00+09:00"

            # Create data object
            article_data = {
                'title': title,
                'subtitle': subtitle,
                'content': content,
                'published_at': published_at,
                'original_link': url,
                'source': REGION_NAME,
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
                'department': department,
            }

            # ============================================
            # Phase 3: Validate and save to DB
            # ============================================
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")

            if is_valid:
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      [OK] Saved to DB ID: {result.get('id', 'Unknown')}")
                    error_collector.add_success()
                    log_to_server(REGION_CODE, '실행중', f"Created: {title[:15]}...", 'success')
                elif result and result.get('status') == 'skipped':
                    print(f"      [SKIP] Article already exists in DB")
                else:
                    print(f"      [WARN] DB save failed: {result}")
            else:
                 error_collector.add_error("VALIDATION_FAIL", title, url, msg)

            processed_count += 1
            time.sleep(1)  # Rate limiting

        browser.close()

    # 에러 요약 보고 출력
    error_collector.print_report()
    final_msg = error_collector.get_error_message()
    print(f"[DONE] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success',
                  created_count=error_collector.success_count,
                  skipped_count=error_collector.skip_count)
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description='전남교육청(전남교육통) 보도자료 스크래퍼')
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

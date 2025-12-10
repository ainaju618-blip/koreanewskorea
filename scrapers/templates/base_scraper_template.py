"""
{지역명} 보도자료 스크래퍼 템플릿
- 버전: v2.0
- 최종수정: 2025-12-10
- 담당: AI Agent

⚠️ 사용법:
1. 이 파일을 복사하여 {region}_scraper.py로 저장
2. TODO 주석을 찾아 해당 지역에 맞게 수정
3. 테스트: python {region}_scraper.py --days 1
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

# ============================================================
# 4. 상수 정의 (TODO: 지역에 맞게 수정)
# ============================================================
REGION_CODE = 'template'                           # TODO: 영문 코드 (예: gwangju, naju)
REGION_NAME = '템플릿시'                            # TODO: 한글 지역명
CATEGORY_NAME = '전남'                              # TODO: 카테고리 (광주/전남 등)
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
        match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', date_str)
        if match:
            return match.group(1)
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str]]:
    """
    상세 페이지에서 본문과 이미지 URL을 추출합니다.
    
    Args:
        page: Playwright Page 객체
        url: 상세 페이지 URL
    
    Returns:
        (본문 텍스트, 썸네일 URL) 튜플
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None
    
    # 1. 본문 추출 - 여러 셀렉터 시도
    content = ""
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            text = safe_get_text(content_elem)
            if text and len(text) > 50:
                content = text[:5000]
                break
    
    # 2. 이미지 추출 - 첨부파일 우선
    thumbnail_url = None
    
    # 첨부파일 다운로드 링크에서 이미지 찾기
    download_links = page.locator('a[href*="download"], a[href*="fileDown"], a[href*="boardDown"]')
    for i in range(download_links.count()):
        link = download_links.nth(i)
        title = safe_get_attr(link, 'title') or ""
        href = safe_get_attr(link, 'href') or ""
        
        if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
            thumbnail_url = urljoin(BASE_URL, href)
            break
    
    # 본문 내 이미지 fallback
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            if imgs.count() > 0:
                src = safe_get_attr(imgs.first, 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner']):
                    thumbnail_url = urljoin(BASE_URL, src)
                    break
    
    return content, thumbnail_url


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송합니다.
    
    Args:
        days: 수집할 기간 (일)
    
    Returns:
        수집된 기사 리스트 (이미 전송됨)
    """
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')
    
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    collected_count = 0
    success_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        page_num = 1
        stop = False
        
        while page_num <= 3 and not stop:
            # TODO: 페이지네이션 URL 패턴 확인
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   📄 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            # 목록 아이템 찾기
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                break
            
            count = rows.count()
            print(f"      📰 {count}개 기사 발견")
            
            # 링크 정보 수집
            link_data = []
            for i in range(count):
                try:
                    row = rows.nth(i)
                    
                    # TODO: 제목/링크 셀렉터 확인
                    link_elem = row.locator('a').first
                    if not link_elem or link_elem.count() == 0:
                        continue
                    
                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""
                    
                    # TODO: 날짜 셀렉터 확인
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
                title = item['title']
                full_url = item['url']
                n_date = item['date']
                
                print(f"      📰 {title[:30]}... ({n_date})")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url = fetch_detail(page, full_url)
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
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                
                # 목록 페이지로 복귀
                safe_goto(page, list_url)
            
            page_num += 1
            if stop:
                print("      🛑 수집 기간 초과, 종료합니다.")
                break
            
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개)"
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    print(f"✅ {final_msg}")
    return []


# ============================================================
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    args = parser.parse_args()
    
    collect_articles(args.days)


if __name__ == "__main__":
    main()

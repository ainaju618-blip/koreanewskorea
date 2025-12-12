# -*- coding: utf-8 -*-
"""광주광역시 보도자료 스크래퍼 v3.0 (Stability & Verification)"""
import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr

REGION_CODE = 'gwangju'
REGION_NAME = '광주광역시'
CATEGORY_NAME = '광주'
BASE_URL = 'https://www.gwangju.go.kr'
LIST_URL = 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789'
GWANGJU_LIST_SELECTORS = ['tr td.title a', 'a[href*="boardView.do"]']

def normalize_date(date_str: str) -> str:
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
    """본문 및 이미지, 작성일시 추출"""
    if not safe_goto(page, url, timeout=20000):
        print(f"   [WARN] 페이지 접속 실패: {url}")
        return "", None, None

    # 본문 추출
    content = ""
    try:
        content_elem = wait_and_find(page, ['div.board_view_body', 'div.view_content', 'div#boardView'], timeout=5000)
        if content_elem:
            content = safe_get_text(content_elem)
    except Exception as e:
        print(f"   [WARN] 본문 추출 에러: {str(e)}")

    # 이미지 추출
    thumbnail_url = None
    try:
        imgs = page.locator('div.board_view_body img, div.view_content img, div#boardView img')
        count = imgs.count()
        if count > 0:
            for i in range(count):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and 'icon' not in src.lower() and 'button' not in src.lower():
                    if not src.startswith('http'):
                        thumbnail_url = urljoin(BASE_URL, src)
                    else:
                        thumbnail_url = src
                    break 
    except Exception as e:
        print(f"   [WARN] 이미지 추출 에러: {str(e)}")
    
    # 날짜 추출 (상세 페이지 내)
    pub_date = None
    try:
        date_elem = page.locator('span:has-text("등록일"), li:has-text("등록일")')
        if date_elem.count() > 0:
            date_text = safe_get_text(date_elem.first)
            pub_date = normalize_date(date_text)
    except:
        pass

    return content, thumbnail_url, pub_date

def collect_articles(days: int = 3) -> List[Dict]:
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (Strict Verification Mode)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 고도화 시작', 'info')
    
    collected_links = []
    
    # 1. 링크 수집 단계 (Collect Phase)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        # 1페이지~3페이지 순회
        for page_num in range(1, 4):
            list_url = f'{LIST_URL}&page={page_num}'
            print(f"   [PAGE] 목록 페이지 {page_num} 스캔 중...")
            
            if not safe_goto(page, list_url):
                print(f"   [WARN] 페이지 {page_num} 접속 실패, 건너뜀")
                continue

            links = wait_and_find(page, GWANGJU_LIST_SELECTORS, timeout=5000)
            if not links:
                print("   [WARN] 기사 목록을 발견하지 못했습니다.")
                continue
                
            count = links.count()
            print(f"      [LINK] {count}개 링크 발견")
            
            for i in range(count):
                try:
                    link_elem = links.nth(i)
                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    
                    if href and 'boardView' in href:
                        full_url = urljoin(BASE_URL, href)
                        collected_links.append({'title': title, 'url': full_url})
                except Exception as e:
                    print(f"      [WARN] 링크 파싱 에러: {str(e)}")
            
            # 테스트 모드에서는 1페이지만 보고 중단할 수도 있음 (선택사항)
            time.sleep(1)

        print(f"[OK] 총 {len(collected_links)}개의 수집 대상 링크 확보 완료.")
        
        # 2. 상세 방문 단계 (Visit Phase)
        success_count = 0
        processed_count = 0
        
        # 최신순으로 처리하기 위해 (보통 목록이 최신순이므로 그대로 진행)
        # 테스트를 위해 최대 10개까지만 처리해본다 (안정화 확인용)
        # target_links = collected_links[:10] 
        target_links = collected_links # 전체 다 순회하려면 이거 사용

        for item in target_links:
            if processed_count >= 10: # 안전을 위해 1회차엔 10개만 제한
                break
                
            url = item['url']
            title = item['title']
            print(f"   [{processed_count+1}] 분석 중: {title[:30]}...")
            
            content, thumbnail_url, pub_date = fetch_detail(page, url)
            
            if not pub_date:
                pub_date = datetime.now().strftime('%Y-%m-%d')
            
            # 데이터 객체 생성
            article_data = {
                'title': title,
                'content': content,
                'published_at': f"{pub_date}T09:00:00+09:00",
                'original_link': url,
                'source': REGION_NAME,
                'category': CATEGORY_NAME,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }
            
            # 3. 엄격한 검증 (Verification Phase)
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")
            
            if is_valid:
                # 4. DB 적재 (Ingestion)
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      [OK] DB 저장 완료 ID: {result.get('id', 'Unknown')}")
                    success_count += 1
                    log_to_server(REGION_CODE, '실행중', f"성공: {title[:10]}...", 'success')
                else:
                    print(f"      [WARN] DB 저장 실패 API 응답: {result}")
            
            processed_count += 1
            time.sleep(1) # 부하 조절

        browser.close()
        
    final_msg = f"작업 종료: 총 {processed_count}건 처리 / {success_count}건 저장 성공"
    print(f"[완료] {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    return []

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=3)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    collect_articles(days=args.days)

if __name__ == "__main__":
    main()

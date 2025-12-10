# -*- coding: utf-8 -*-
"""광주교육청 보도자료 스크래퍼 v3.0 (Collect & Visit + Strict Verification)"""

import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image

# ===== 상수 정의 =====
REGION_CODE = 'gwangju_edu'
REGION_NAME = '광주시교육청'
CATEGORY_NAME = '교육'
BASE_URL = 'https://enews.gen.go.kr'
LIST_URL = 'https://enews.gen.go.kr/v5/?sid=25'

# 셀렉터 (여러 개 시도)
LIST_SELECTORS = ['ul.list li', 'div.bbs_list li', 'tbody tr', 'article']
LINK_SELECTORS = ['a', 'a.title', 'td.title a']
CONTENT_SELECTORS = ['div.view_content', 'div.board_view', 'div.bbs_view', 'article', 'div.content', 'body']

def normalize_date(date_str: str) -> str:
    """날짜 문자열 정규화"""
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
    """엄격한 데이터 검증"""
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "❌ 제목 너무 짧음"
    content = article_data.get('content', '')
    if not content or len(content) < 30:
        return False, f"❌ 본문 부족 ({len(content)}자)"
    return True, "✅ 검증 통과"

def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str]]:
    """상세 페이지에서 본문과 이미지 추출"""
    if not safe_goto(page, url, timeout=20000):
        return "", None
    
    time.sleep(1)  # 페이지 렌더링 대기
    
    # 본문 추출
    content = ""
    for sel in CONTENT_SELECTORS:
        elem = page.locator(sel)
        if elem.count() > 0:
            text = safe_get_text(elem)
            if text and len(text) > 30:
                content = text[:5000]
                break
    
    # 이미지 추출
    thumbnail_url = None
    try:
        imgs = page.locator('div.view_content img, div.board_view img, article img, .bbs_view img')
        if imgs.count() > 0:
            for i in range(min(imgs.count(), 5)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and 'icon' not in src.lower() and 'logo' not in src.lower():
                    original_url = urljoin(BASE_URL, src)
                    # Cloudinary 업로드
                    cloud_url = download_and_upload_image(original_url, BASE_URL, folder="gwangju_edu")
                    if cloud_url and 'cloudinary' in cloud_url:
                        thumbnail_url = cloud_url
                    else:
                        thumbnail_url = original_url
                    break
    except Exception as e:
        print(f"   ⚠️ 이미지 추출 에러: {str(e)[:50]}")
    
    return content, thumbnail_url

def collect_articles(days: int = 3) -> List[Dict]:
    """Collect & Visit 패턴으로 기사 수집"""
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (Strict Verification Mode)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')
    
    collected_links = []
    cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        # Phase 1: 링크 수집
        print(f"   📄 목록 페이지 스캔 중...")
        if not safe_goto(page, LIST_URL):
            print("   ❌ 목록 페이지 접속 실패")
            browser.close()
            return []
        
        time.sleep(2)  # 페이지 렌더링 대기
        
        # 링크 찾기 (query_selector_all 사용)
        try:
            links = page.query_selector_all('a')
            print(f"   🔗 전체 링크 수: {len(links)}")
            
            for link in links:
                try:
                    href = link.get_attribute('href') or ""
                    text = link.text_content() or ""
                    text = text.strip()
                    
                    # 보도자료 링크 필터링 (wbb=md:view;uid: 패턴)
                    if 'wbb=md:view' in href and 'uid:' in href and len(text) > 10:
                        full_url = BASE_URL + '/v5/' + href if href.startswith('?') else urljoin(BASE_URL, href)
                        if full_url not in [x['url'] for x in collected_links]:
                            collected_links.append({'title': text, 'url': full_url})
                            print(f"      ✅ 발견: {text[:40]}...")
                except:
                    continue
        except Exception as e:
            print(f"   ❌ 링크 수집 에러: {str(e)}")
        
        print(f"✅ 총 {len(collected_links)}개의 수집 대상 링크 확보")
        
        # Phase 2: 상세 방문
        success_count = 0
        for idx, item in enumerate(collected_links[:10]):  # 최대 10개
            url = item['url']
            title = item['title']
            
            print(f"   🔍 [{idx+1}] 분석 중: {title[:30]}...")
            
            content, thumbnail_url = fetch_detail(page, url)
            
            article_data = {
                'title': title,
                'content': content,
                'published_at': f"{datetime.now().strftime('%Y-%m-%d')}T09:00:00+09:00",
                'original_link': url,
                'source': REGION_NAME,
                'category': CATEGORY_NAME,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }
            
            # Phase 3: 검증
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")
            
            if is_valid:
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      ✅ [DB 저장 완료]")
                    success_count += 1
                else:
                    print(f"      ⚠️ [DB 결과] {result.get('status', 'unknown') if result else 'no response'}")
            
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"작업 종료: 총 {len(collected_links[:10])}건 처리 / {success_count}건 저장 성공"
    print(f"🎉 {final_msg}")
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

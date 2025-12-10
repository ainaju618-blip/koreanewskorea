"""
광주광역시 스크래퍼 테스트 - 최근 3개 기사만 추출 (v3 - 디버그 강화)
"""

import sys
import os
import time
from datetime import datetime
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.api_client import send_article_to_server

REGION_CODE = 'gwangju'
REGION_NAME = '광주광역시'
CATEGORY_NAME = '광주'
BASE_URL = 'https://www.gwangju.go.kr'
LIST_URL = 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000022'

MAX_ARTICLES = 3

def fetch_detail(page, url):
    """상세 페이지에서 본문과 썸네일 추출"""
    try:
        page.goto(url, wait_until='domcontentloaded', timeout=20000)
        time.sleep(2)
        
        content = ""
        content_elem = page.locator('div.board_view_body, div.view_content, div.board_view, .view_body, .content')
        if content_elem.count() > 0:
            content = content_elem.first.inner_text()[:5000]
        
        thumbnail_url = None
        img = page.locator('div.board_view_body img, div.view_content img, .view_body img').first
        if img.count() > 0:
            src = img.get_attribute('src')
            if src:
                thumbnail_url = urljoin(BASE_URL, src)
        
        return content, thumbnail_url
    except Exception as e:
        print(f"      ❌ 상세페이지 오류: {e}")
        return "", None


def main():
    print(f"🏛️ {REGION_NAME} 보도자료 테스트 수집 (최근 {MAX_ARTICLES}개) - v3")
    print("=" * 60)
    
    articles = []
    collected_urls = []  # 먼저 URL만 수집
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        print(f"   📄 목록 페이지 접속 중...")
        try:
            page.goto(LIST_URL, wait_until='domcontentloaded', timeout=30000)
            time.sleep(3)
        except Exception as e:
            print(f"      ❌ 목록 페이지 로딩 실패: {e}")
            browser.close()
            return
        
        # 페이지 HTML에서 href 직접 추출
        html = page.content()
        
        # boardView.do 링크들 찾기 (정규식)
        import re
        pattern = r'href="(/boardView\.do\?[^"]+boardId=BD_0000000022[^"]*)"[^>]*>([^<]+)<'
        matches = re.findall(pattern, html)
        
        if not matches:
            # 대체 패턴 시도
            pattern2 = r'href="(/boardView\.do\?[^"]+)"'
            matches_alt = re.findall(pattern2, html)
            print(f"      대체 패턴으로 {len(matches_alt)}개 발견")
            for m in matches_alt[:5]:
                print(f"         - {m[:80]}...")
        else:
            print(f"      📰 정규식으로 {len(matches)}개 기사 발견")
            for i, (href, title) in enumerate(matches[:MAX_ARTICLES]):
                full_url = urljoin(BASE_URL, href)
                collected_urls.append((title.strip(), full_url))
                print(f"         [{i+1}] {title.strip()[:40]}...")
        
        # 수집한 URL들로 상세페이지 접근
        for i, (title, full_url) in enumerate(collected_urls):
            print(f"\n   [{i+1}/{len(collected_urls)}] 상세페이지 접근: {title[:40]}...")
            
            content, thumbnail_url = fetch_detail(page, full_url)
            
            print(f"         본문 길이: {len(content)}자")
            if thumbnail_url:
                print(f"         🖼️ 썸네일: {thumbnail_url[:50]}...")
            
            # 중복 우회
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            force_unique_link = f"{full_url}&_test={timestamp}_{i}"
            n_date = datetime.now().strftime('%Y-%m-%d')
            
            articles.append({
                'title': f"[테스트] {title}",
                'content': content or f"본문을 가져올 수 없습니다.\n원본: {full_url}",
                'published_at': f"{n_date}T09:00:00+09:00",
                'original_link': force_unique_link,
                'source': REGION_NAME,
                'category': CATEGORY_NAME,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            })
        
        browser.close()
    
    print(f"\n{'=' * 60}")
    print(f"✅ 총 {len(articles)}개 기사 준비 완료")
    
    if not articles:
        print("❌ 수집된 기사가 없습니다!")
        return
    
    # 서버로 전송
    print("\n📤 서버로 전송 중...")
    stats = {'created': 0, 'skipped': 0, 'failed': 0}
    
    for article in articles:
        print(f"   → {article['title'][:40]}...")
        result = send_article_to_server(article)
        if result.get('status') == 'created':
            stats['created'] += 1
        elif result.get('status') == 'exists':
            stats['skipped'] += 1
        else:
            stats['failed'] += 1
    
    print(f"\n{'=' * 60}")
    print(f"📊 최종 결과: 신규 {stats['created']}, 중복 {stats['skipped']}, 실패 {stats['failed']}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

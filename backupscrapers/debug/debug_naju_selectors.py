"""
나주시청 상세 페이지 이미지 선택자 테스트
"""

from playwright.sync_api import sync_playwright

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'

def test_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 목록 페이지
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        
        # 첫 번째 기사 링크 찾기
        link = page.locator('tbody tr a[href*="coverage?idx="]').first
        href = link.get_attribute('href')
        detail_url = f"{BASE_URL}{href}"
        
        print(f"상세 페이지: {detail_url}")
        
        # 상세 페이지로 이동
        page.goto(detail_url)
        page.wait_for_load_state('networkidle')
        
        # 여러 선택자 시도
        selectors = [
            '.bbs_view_cont img',
            '.view_cont img',
            '.board_view img',
            '.content img',
            'article img',
            '.view-content img',
            '#content img',
            'table img',
            'div img',
        ]
        
        print("\n=== 선택자별 이미지 탐색 ===")
        for sel in selectors:
            imgs = page.locator(sel)
            count = imgs.count()
            if count > 0:
                first_src = imgs.first.get_attribute('src') or 'N/A'
                print(f"✅ '{sel}': {count}개 발견 → {first_src[:60]}...")
            else:
                print(f"❌ '{sel}': 없음")
        
        # og:image 확인
        og_img = page.locator('meta[property="og:image"]')
        if og_img.count() > 0:
            og_url = og_img.get_attribute('content')
            print(f"\n📌 og:image: {og_url}")
        
        browser.close()

if __name__ == '__main__':
    test_selectors()

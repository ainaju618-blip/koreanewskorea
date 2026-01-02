"""
나주시청 상세 페이지 HTML 구조 분석용 스크립트
- 실제 페이지를 열어 HTML을 덤프
"""

from playwright.sync_api import sync_playwright

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'

def dump_page():
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
        
        # HTML 저장
        html = page.content()
        with open('naju_detail_dump.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        print("HTML 저장 완료: naju_detail_dump.html")
        
        # 이미지 태그 탐색
        print("\n=== 이미지 태그 탐색 ===")
        imgs = page.locator('img')
        count = imgs.count()
        print(f"총 img 태그 수: {count}")
        
        for i in range(min(count, 10)):
            img = imgs.nth(i)
            src = img.get_attribute('src') or 'N/A'
            alt = img.get_attribute('alt') or ''
            print(f"  [{i}] src={src[:80]}... alt={alt[:30]}")
        
        browser.close()

if __name__ == '__main__':
    dump_page()

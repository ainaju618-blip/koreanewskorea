"""완도 보도자료 셀렉터 확인"""
from playwright.sync_api import sync_playwright

def check_wando():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("=== 완도 보도자료 페이지 분석 ===")
        page.goto('https://www.wando.go.kr/wando/sub.cs?m=299', timeout=30000)
        page.wait_for_timeout(3000)
        
        print(f"Title: {page.title()}")
        print(f"URL: {page.url}")
        
        # 리스트 아이템 찾기
        print("\n--- 리스트 셀렉터 탐색 ---")
        selectors_to_try = [
            'tbody tr td.subject a',
            'tbody tr td.title a', 
            'table.board_list tbody tr td a',
            '.board_list a',
            'a[href*="view"]',
            'a[href*="sub.cs"]',
            'td a'
        ]
        
        for sel in selectors_to_try:
            items = page.locator(sel)
            count = items.count()
            if count > 0:
                print(f"✅ '{sel}' -> {count}개 발견")
                if count <= 20:
                    for i in range(min(3, count)):
                        href = items.nth(i).get_attribute('href')
                        text = items.nth(i).inner_text()[:30].replace('\n', ' ')
                        print(f"   {i}: {text} -> {href}")
            else:
                print(f"❌ '{sel}' -> 0개")
        
        # 전체 링크 분석
        print("\n--- 페이지 내 모든 링크 분석 ---")
        all_links = page.locator('a[href]').all()
        print(f"총 링크 수: {len(all_links)}")
        for i, link in enumerate(all_links[:15]):
            href = link.get_attribute('href') or ''
            text = link.inner_text()[:40].replace('\n', ' ').strip()
            if text and 'javascript' not in href:
                print(f"   {i}: [{text}] -> {href[:60]}")
        
        browser.close()

if __name__ == "__main__":
    check_wando()

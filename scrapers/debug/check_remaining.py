"""함평군, 나주시, 영광군 URL 확인"""
from playwright.sync_api import sync_playwright

def check_sites():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 함평 (사용자 브라우저에서 확인된 URL)
        print("=== 함평 보도/해명 ===")
        page = browser.new_page()
        page.goto('https://www.hampyeong.go.kr/boardList.do?boardId=NEWS&pageId=www275', timeout=30000)
        page.wait_for_timeout(3000)
        print(f"Title: {page.title()}")
        
        # 리스트 셀렉터 확인
        selectors = ['td.subject a', 'td.title a', 'a[href*="view"]', 'tbody tr td a']
        for sel in selectors:
            count = page.locator(sel).count()
            if count > 0:
                print(f"✅ '{sel}' -> {count}개")
                first = page.locator(sel).first
                print(f"   첫 링크: {first.get_attribute('href')[:60]}")
                print(f"   제목: {first.inner_text()[:40]}")
                break
        page.close()
        
        # 나주
        print("\n=== 나주 보도자료 찾기 ===")
        page = browser.new_page()
        page.goto('https://www.naju.go.kr/', timeout=30000)
        page.wait_for_timeout(3000)
        
        # 메뉴에서 보도자료 찾기
        links = page.locator('a').all()
        for link in links:
            text = link.inner_text().strip()
            if '보도' in text or '브리핑' in text or '뉴스' in text:
                href = link.get_attribute('href') or ''
                print(f"   발견: {text} -> {href[:60]}")
        page.close()
        
        # 영광
        print("\n=== 영광 보도자료 찾기 ===")
        page = browser.new_page()
        page.goto('https://www.yeonggwang.go.kr/', timeout=30000)
        page.wait_for_timeout(3000)
        
        links = page.locator('a').all()
        for link in links:
            text = link.inner_text().strip()
            if '보도' in text or '브리핑' in text or '뉴스' in text:
                href = link.get_attribute('href') or ''
                print(f"   발견: {text} -> {href[:60]}")
        page.close()
        
        browser.close()

if __name__ == "__main__":
    check_sites()

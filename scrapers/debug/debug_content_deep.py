from playwright.sync_api import sync_playwright

def inspect_content():
    urls = [
        ('Suncheon', 'http://www.suncheon.go.kr/kr/news/0006/0001/?mode=view&seq=70089'),
        ('Gurye', 'https://www.gurye.go.kr/board/view.do?bbsId=BBS_0000000000000300&pageIndex=1&nttId=105250&menuNo=115004006000'), # Example ID from logs if possible, or I have to find one. 
        # I'll let the script find one for Gurye.
        ('Yeosu', 'https://www.yeosu.go.kr/www/open_admin/news/confer/press?mode=view&idx=123456') # Need a valid ID.
    ]
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Suncheon
        print(f"--- 1. Suncheon ---")
        page.goto('http://www.suncheon.go.kr/kr/news/0006/0001/?mode=view&seq=70089')
        page.wait_for_load_state('domcontentloaded')
        print(f"Title: {page.title()}")
        candidates = page.locator("div[class*='view'], div[id*='content'], .board_view").all()
        print(f"Found {len(candidates)} candidate divs")
        for i, c in enumerate(candidates[:5]):
            cls = c.get_attribute('class')
            id_ = c.get_attribute('id')
            print(f"  {i}: class='{cls}', id='{id_}'")
            print(f"       Text: {c.inner_text()[:30]}...")

        # 2. Gurye (Find link first)
        print(f"\n--- 2. Gurye ---")
        page.goto('https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000')
        links = page.locator("td.title a")
        if links.count() > 0:
            print("Clicking first Gurye link")
            with page.expect_navigation():
                links.first.click()
            print(f"URL: {page.url}")
            candidates = page.locator("div[class*='view'], .board_view, .view_cont").all()
            print(f"Found {len(candidates)} candidate divs")
            for i, c in enumerate(candidates[:5]):
                cls = c.get_attribute('class')
                id_ = c.get_attribute('id')
                print(f"  {i}: class='{cls}', id='{id_}'")
                print(f"       Text: {c.inner_text()[:30]}...")
        else:
            print("No Gurye links found")

        # 3. Yeosu
        print(f"\n--- 3. Yeosu ---")
        page.goto('https://www.yeosu.go.kr/www/open_admin/news/confer/press')
        links = page.locator("td.subject a")
        if links.count() > 0:
            print("Clicking first Yeosu link")
            with page.expect_navigation():
                links.first.click()
            print(f"URL: {page.url}")
            candidates = page.locator("div[class*='view'], .board_view, .view_cont").all()
            print(f"Found {len(candidates)} candidate divs")
            for i, c in enumerate(candidates[:5]):
                cls = c.get_attribute('class')
                id_ = c.get_attribute('id')
                print(f"  {i}: class='{cls}', id='{id_}'")
                print(f"       Text: {c.inner_text()[:30]}...")

        browser.close()

if __name__ == "__main__":
    inspect_content()

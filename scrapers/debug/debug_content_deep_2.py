from playwright.sync_api import sync_playwright

def inspect_content_2():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1. Wando
        print(f"\n--- 1. Wando ---")
        try:
            page = browser.new_page()
            page.goto('https://www.wando.go.kr/www/administration/news/report', timeout=30000)
            links = page.locator("td.subject a")
            if links.count() == 0:
                links = page.locator("td.title a")
            
            if links.count() > 0:
                print(f"Clicking first Wando link: {links.first.get_attribute('href')}")
                with page.expect_navigation():
                    links.first.click()
                print(f"URL: {page.url}")
                candidates = page.locator("div[class*='view'], .board_view, .view_cont").all()
                print(f"Found {len(candidates)} candidate divs")
                for i, c in enumerate(candidates[:5]):
                    cls = c.get_attribute('class')
                    print(f"  {i}: class='{cls}' Text: {c.inner_text()[:30]}...")
            else:
                print("No Wando links found")
            page.close()
        except Exception as e:
            print(f"Wando Error: {e}")

        # 2. Hampyeong
        print(f"\n--- 2. Hampyeong ---")
        try:
            page = browser.new_page()
            page.goto('https://www.hampyeong.go.kr/boardView.do?pageId=www60&boardId=BOARD_0000004', timeout=30000)
            # Hampyeong might be a direct list page or board
            # Wait, the URL has boardId=... maybe it's the list?
            links = page.locator("td.subject a")
            if links.count() == 0:
                 links = page.locator("td.title a")
            
            if links.count() > 0:
                print(f"Clicking first Hampyeong link")
                with page.expect_navigation():
                    links.first.click()
                print(f"URL: {page.url}")
                candidates = page.locator("div[class*='view'], .board_view, .view_cont").all()
                print(f"Found {len(candidates)} candidate divs")
                for i, c in enumerate(candidates[:5]):
                    cls = c.get_attribute('class')
                    print(f"  {i}: class='{cls}' Text: {c.inner_text()[:30]}...")
            else:
                print("No Hampyeong links found")
            page.close()
        except Exception as e:
            print(f"Hampyeong Error: {e}")

        # 3. Yeonggwang
        print(f"\n--- 3. Yeonggwang ---")
        try:
            page = browser.new_page()
            page.goto('https://www.yeonggwang.go.kr/news/news_01/news_01_02', timeout=30000)
            links = page.locator("td.subject a") # Verify selector
            if links.count() == 0:
                links = page.locator("td.title a")
                
            if links.count() > 0:
                print(f"Clicking first Yeonggwang link")
                with page.expect_navigation():
                    links.first.click()
                print(f"URL: {page.url}")
                candidates = page.locator("div[class*='view'], .board_view, .view_cont").all()
                print(f"Found {len(candidates)} candidate divs")
                for i, c in enumerate(candidates[:5]):
                    cls = c.get_attribute('class')
                    print(f"  {i}: class='{cls}' Text: {c.inner_text()[:30]}...")
            else:
                print("No Yeonggwang links found")
            page.close()
        except Exception as e:
            print(f"Yeonggwang Error: {e}")

        browser.close()

if __name__ == "__main__":
    inspect_content_2()

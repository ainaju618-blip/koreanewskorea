from playwright.sync_api import sync_playwright

def text_gokseong():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        url = 'https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&menuNo=102001002000'
        print(f"Navigating to {url}")
        page.goto(url, timeout=30000)
        page.wait_for_load_state('networkidle')
        
        print(f"Title: {page.title()}")
        
        # Check if table exists
        cnt = page.locator("table").count()
        print(f"Tables found: {cnt}")
        
        links = page.locator("td.title a")
        print(f"Links with 'td.title a': {links.count()}")
        
        if links.count() > 0:
            print(f"First link text: {links.first.inner_text()}")
            print(f"First link href: {links.first.get_attribute('href')}")
        else:
            # Dump some HTML
            print("\n--- HTML Dump (Partial) ---")
            print(page.content()[:2000])

        browser.close()

if __name__ == "__main__":
    text_gokseong()

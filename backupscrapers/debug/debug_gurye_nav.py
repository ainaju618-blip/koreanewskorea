from playwright.sync_api import sync_playwright

def find_gurye_press_url():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Start at Notices page where "Press Release" link was seen
        url = 'https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000056&menuNo=115004001000'
        print(f"Navigating to {url}")
        page.goto(url, timeout=30000)
        
        # Look for "보도자료" link
        link = page.get_by_text("보도자료", exact=True)
        if link.count() == 0:
            link = page.locator("a:has-text('보도자료')")
        
        print(f"Found {link.count()} links for '보도자료'")
        
        if link.count() > 0:
            href = link.first.get_attribute("href")
            print(f"Href: {href}")
            
            # Click and get new URL
            with page.expect_navigation():
                link.first.click()
            
            print(f"New URL: {page.url}")
            
            # Now find list selectors on this new page
            print("Searching for list items...")
            items = page.locator("tbody tr td.title a")
            if items.count() == 0:
                 items = page.locator("tbody tr td.subject a")
            
            print(f"Found {items.count()} items")
            if items.count() > 0:
                print(f"Sample Selector: {items.first}")
                
            # Click first item
            if items.count() > 0:
                 with page.expect_navigation():
                     items.first.click()
                 print(f"Article URL: {page.url}")
                 # Content selector search
                 content_cand = page.locator("div.view_content")
                 if content_cand.count() > 0:
                     print("Content found: div.view_content")
                 else:
                     print("Content check: " + str(page.locator("div.board_view").count()))

        browser.close()

if __name__ == "__main__":
    find_gurye_press_url()

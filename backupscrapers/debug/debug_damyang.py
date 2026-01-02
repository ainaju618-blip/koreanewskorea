from playwright.sync_api import sync_playwright

URL = "https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001005001"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL)
    print("Page loaded")
    
    # Wait for content
    try:
        page.wait_for_selector("table tbody tr", timeout=10000)
        print("Table rows appeared")
    except:
        print("Timeout waiting for rows")

    # Try multiple selectors for the table
    tables = page.locator("table")
    print(f"Total tables: {tables.count()}")
    
    for i in range(tables.count()):
        tbl = tables.nth(i)
        caption = tbl.locator("caption").inner_text() if tbl.locator("caption").count() > 0 else "No Caption"
        print(f"Table {i} Caption: {caption}")
        
        rows = tbl.locator("tbody tr")
        print(f"  Rows: {rows.count()}")
        if rows.count() > 0:
            first_row = rows.first
            print(f"  First Row HTML: {first_row.inner_html()[:200]}...")
            
    browser.close()

from playwright.sync_api import sync_playwright

SITES = {
    'suncheon': {
        'url': 'http://www.suncheon.go.kr/kr/news/0006/0001/',
        'list_sel': 'tbody tr td a[href*="?mode=view&seq="]',
        'content_sel': ['div#DivContents', 'div.board_view_con', 'div.view_content']
    },
    'gurye': {
        'url': 'https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000',
        'list_sel': 'tbody tr td.title a, td.subject a',
        'content_sel': ['div.view_content', 'div.board_view']
    },
    'yeosu': {
        'url': 'https://www.yeosu.go.kr/www/open_admin/news/confer/press',
        'list_sel': 'td.subject a, td.title a',
        'content_sel': ['div.view_content', 'div.board_view']
    },
    'wando': {
        'url': 'https://www.wando.go.kr/www/administration/news/report',
        'list_sel': 'td.subject a, td.title a',
        'content_sel': ['div.view_content', 'div.board_view']
    },
    'hampyeong': {
        'url': 'https://www.hampyeong.go.kr/boardView.do?pageId=www60&boardId=BOARD_0000004',
        'list_sel': 'td.subject a',
        'content_sel': ['div.view_content', 'div.board_view']
    },
    'yeonggwang': {
        'url': 'https://www.yeonggwang.go.kr/news/news_01/news_01_02',
        'list_sel': 'td.subject a',
        'content_sel': ['div.view_content', 'div.board_view']
    },
    'gokseong': {
        'url': 'https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&menuNo=102001002000',
        'list_sel': 'td a[href*="view.do"]',
        'content_sel': ['div.view_content', 'div.board_view']
    }
}

def check_sites():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             java_script_enabled=True
        )
        
        for name, info in SITES.items():
            print(f"\n--- Checking {name} ---")
            page = context.new_page()
            try:
                page.goto(info['url'], timeout=30000, wait_until='domcontentloaded') # Faster than load
                page.wait_for_timeout(2000) # Wait a bit for JS
                
                # Check List
                print(f"Checking List Selector: {info['list_sel']}")
                links = page.locator(info['list_sel'])
                count = links.count()
                print(f"Found {count} items")
                
                if count > 0:
                    first_link = links.first
                    href = first_link.get_attribute("href")
                    print(f"First Link Href: {href}")
                    
                    # Click Detail
                    with page.expect_navigation(timeout=15000):
                         first_link.click()
                    
                    page.wait_for_timeout(2000)
                    print(f"Article URL: {page.url}")
                    
                    # Check Content
                    found_content = False
                    for sel in info['content_sel']:
                        if page.locator(sel).count() > 0:
                            print(f"✅ Content Found with: {sel}")
                            found_content = True
                            text = page.locator(sel).first.inner_text()[:50].replace('\n', '')
                            print(f"   Preview: {text}...")
                            break
                    
                    if not found_content:
                        print("❌ Content NOT Found")
                        print("   Dumping body classes...")
                        print(f"   Body classes: {page.locator('body').get_attribute('class')}")
                        # Dump some candidate divs
                        candidates = page.locator("div[class*='view'], div[class*='con'], div[id*='con']").all()
                        if len(candidates) > 0:
                             print(f"   Potential Content Containers: {[c.get_attribute('class') or c.get_attribute('id') for c in candidates[:5]]}")

                else:
                    print("❌ List Selector Failed")
                    
            except Exception as e:
                print(f"Error checking {name}: {e}")
            
            page.close()
            
        browser.close()

if __name__ == "__main__":
    check_sites()

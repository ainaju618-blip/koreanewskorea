from playwright.sync_api import sync_playwright

def inspect_naju_detail():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the list first to get a real link, or search specific title
        page.goto("https://www.naju.go.kr/www/administration/reporting/coverage")
        
        # Find the first article
        link = page.locator('a[href*="idx="]').first
        if link.count() > 0:
            url = "https://www.naju.go.kr" + link.get_attribute("href")
            print(f"Navigating to: {url}")
            page.goto(url)
            
            print("Title:", page.title())
            
            # Analyze content candidates
            candidates = [
                "div.view_content", "div.board_view", "div.view_cont", 
                "article", ".view_context", "#txt", ".view_cont", 
                ".board_txt", ".con_txt", ".board_view_con"
            ]
            
            for c in candidates:
                count = page.locator(c).count()
                print(f"Selector '{c}': {count} found")
                if count > 0:
                     print(f"   Text length: {len(page.locator(c).first.inner_text())}")

            # Dump body classes and structure of main area
            print("\n--- Main Content Classes ---")
            # Find element with significant text
            best = page.evaluate('''() => {
                let best = null;
                let max = 0;
                document.querySelectorAll("div").forEach(el => {
                    if (el.innerText.length > max && el.innerText.length < 20000) {
                        max = el.innerText.length;
                        best = el;
                    }
                });
                return best ? best.className : "None";
            }''')
            print(f"Best text container class: {best}")
            
            print("\n--- Inner HTML of Body (First 1000 chars) ---")
            # print(page.content()[:1000])

        else:
            print("No links found on list page")
            
        browser.close()

if __name__ == "__main__":
    inspect_naju_detail()

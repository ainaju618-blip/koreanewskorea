import asyncio
from playwright.async_api import async_playwright
import sys

# Target URLs for detail pages (based on previous logs or typical patterns if known, 
# otherwise we fetch the list page and click the first link)

TARGETS = {
    "naju": "https://www.naju.go.kr",  # Will need to find a specific article
    "suncheon": "https://www.suncheon.go.kr",
    "yeosu": "https://www.yeosu.go.kr",
    "wando": "https://www.wando.go.kr",
    "hampyeong": "https://www.hampyeong.go.kr",
    "yeonggwang": "https://www.yeonggwang.go.kr",
}

# Specific list URLs where we know we can find links (from previous successful list tests)
LIST_URLS = {
    "naju": "https://www.naju.go.kr/www/administration/city_news/press",
    "suncheon": "https://www.suncheon.go.kr/kr/news/0004/0005/0001/",
    "yeosu": "https://www.yeosu.go.kr/www/administration/news/press",
    "wando": "https://www.wando.go.kr/www/administration/news/report",
    "hampyeong": "https://www.hampyeong.go.kr/kor/sub/03/01/01/",
    "yeonggwang": "https://www.yeonggwang.go.kr/news/data/release",
}

async def inspect_site(name, list_url):
    print(f"\n--- Inspecting {name} ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            print(f"Navigating to List: {list_url}")
            await page.goto(list_url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)

            # Try to find the first article link. 
            # Most of these sites use standard table structures or list items.
            # We'll look for common patterns.
            
            article_link = None
            
            # Common selectors for article titles in lists
            possible_list_selectors = [
                ".board_list .subject a", 
                ".board_list td.title a",
                "table.board_list a",
                ".list_body a",
                "ul.board_list li a"
            ]
            
            for sel in possible_list_selectors:
                if await page.locator(sel).count() > 0:
                    print(f"Found links using: {sel}")
                    article_link = page.locator(sel).first
                    break
            
            if not article_link:
                print("Could not find article links with common selectors. Dumping html...")
                # simplified dump
                # print(await page.content())
                return

            # Navigate to detail
            try:
                # Get href to print it
                href = await article_link.get_attribute("href")
                print(f"Clicking link: {href}")
                
                async with page.expect_navigation(timeout=10000):
                    await article_link.click()
            except Exception as e:
                print(f"Navigation failed (could be distinct window or js): {e}")
                # Try direct goto if href is absolute, otherwise just continue if click worked
                if href and href.startswith("http"):
                    await page.goto(href)

            print("Reached Detail Page. Analyzing content candidates...")
            await page.wait_for_timeout(2000)

            # Analyze potential content containers
            content_candidates = [
                "div.view_content", "div.board_view", "div.view_cont", 
                "div.content", "#txt", ".con_txt", ".board_txt",
                ".bb_con", ".view_context"
            ]
            
            found_container = False
            for cand in content_candidates:
                count = await page.locator(cand).count()
                if count > 0:
                    text = await page.locator(cand).first.inner_text()
                    if len(text.strip()) > 50:
                        print(f"✅ Found CONTENT candidate: '{cand}' (Length: {len(text)})")
                        print(f"Preview: {text[:100]}...")
                        found_container = True
            
            if not found_container:
                print("❌ No standard content container found. Dumping classes of main divs...")
                # Dump classes of large divs to help manual guess
                divs = page.locator("div")
                count = await divs.count()
                for i in range(min(count, 50)): # Check first 50 divs? random but maybe distinct
                     # Better: find div with most text
                     pass
                
                # Evaluation: Find the element with the most text
                try:
                    best_sel = await page.evaluate('''() => {
                        let maxLen = 0;
                        let bestClass = "";
                        document.querySelectorAll("div").forEach(div => {
                            if (div.innerText.length > maxLen) {
                                maxLen = div.innerText.length;
                                bestClass = div.className;
                            }
                        });
                        return bestClass;
                    }''')
                    print(f"💡 Element with most text has class: '{best_sel}'")
                except:
                    pass

        except Exception as e:
            print(f"Error inspecting {name}: {e}")
        finally:
            await browser.close()

async def main():
    tasks = []
    # Run a few in parallel
    for name, url in LIST_URLS.items():
        tasks.append(inspect_site(name, url))
    
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())

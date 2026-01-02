from playwright.sync_api import sync_playwright
import sys

def inspect_naju():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Naju
        print("Visiting Naju List...")
        page.goto("https://www.naju.go.kr/www/administration/reporting/coverage")
        
        # The scraper worked with 'a[href*="view"]'
        links = page.locator('a[href*="view"]')
        if links.count() > 0:
            print(f"Found {links.count()} links. Clicking first.")
            href = links.first.get_attribute('href')
            full_url = "https://www.naju.go.kr" + href
            print(f"Navigating to {full_url}")
            page.goto(full_url)
            
            print("Title:", page.title())
            
            # Dump main classes to find content container
            print("\n--- DETAIL PAGE ANALYSIS ---")
            # Get class of the element with the most text
            best_class = page.evaluate('''() => {
                let best = "";
                let max = 0;
                document.querySelectorAll("div, section, article").forEach(el => {
                    // Filter out header/footer if possible, simple heuristic
                    if (el.innerText.length > max && el.innerText.length < 50000) {
                        max = el.innerText.length;
                        best = el.className;
                    }
                });
                return best;
            }''')
            print(f"Container with most text has class: '{best_class}'")
            
            # Print specific candidates
            candidates = [".view_cont", ".con_txt", ".board_view", ".content", "#txt", ".view_context"]
            for c in candidates:
                if page.locator(c).count() > 0:
                     print(f"Candidate '{c}' FOUND! Text len: {len(page.locator(c).first.inner_text())}")

        else:
            print("No links found with 'a[href*=\"view\"]'")

        browser.close()

if __name__ == "__main__":
    inspect_naju()

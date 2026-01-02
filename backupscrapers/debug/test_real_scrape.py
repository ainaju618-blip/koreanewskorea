"""Real scrape test - 1 article from 1 region"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

from playwright.sync_api import sync_playwright
from utils.api_client import send_article_to_server
from datetime import datetime
import re

print("=== REAL SCRAPE TEST: NAJU (1 article) ===\n")

# Naju city config
NAJU_LIST_URL = "https://www.naju.go.kr/www/selectBbsNttList.do?bbsNo=26"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("[1] Loading list page...")
    page.goto(NAJU_LIST_URL, timeout=30000)
    page.wait_for_load_state('networkidle')

    # Find first article link
    print("[2] Finding articles...")
    links = page.locator('td.title a, a.title, .nttInfoArea a')
    count = links.count()
    print(f"    Found {count} links")

    if count == 0:
        print("[ERROR] No articles found!")
        browser.close()
        sys.exit(1)

    # Get first article info
    first_link = links.first
    title = first_link.inner_text().strip()
    href = first_link.get_attribute('href')

    print(f"[3] First article: {title[:50]}...")

    # Navigate to detail page
    print("[4] Loading detail page...")
    first_link.click()
    page.wait_for_load_state('networkidle')

    detail_url = page.url
    print(f"    URL: {detail_url[:60]}...")

    # Extract content
    print("[5] Extracting content...")
    content = ""
    for selector in ['div.view_con', 'div.bbs_view_content', 'div.view_content', 'div#contents']:
        elem = page.locator(selector).first
        if elem.count() > 0:
            content = elem.inner_text()[:2000]
            print(f"    Content length: {len(content)} chars")
            break

    if not content:
        content = page.locator('body').inner_text()[:1000]
        print(f"    Fallback content: {len(content)} chars")

    # Extract date
    date_text = ""
    for selector in ['.date', '.writeDate', 'dd', '.info']:
        elem = page.locator(selector).first
        if elem.count() > 0:
            text = elem.inner_text()
            match = re.search(r'(\d{4}[-./]\d{1,2}[-./]\d{1,2})', text)
            if match:
                date_text = match.group(1).replace('.', '-').replace('/', '-')
                break

    if not date_text:
        date_text = datetime.now().strftime('%Y-%m-%d')

    print(f"    Date: {date_text}")

    browser.close()

# Send to API
print("\n[6] Sending to API...")
article = {
    'title': title,
    'original_link': detail_url,
    'content': content,
    'source': '나주시',
    'category': '나주',
    'published_at': f'{date_text}T09:00:00',
}

result = send_article_to_server(article)
print(f"\n=== RESULT ===")
print(f"Status: {result['status']}")
print(f"Message: {result['message']}")

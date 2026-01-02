"""강진군 페이지 구조 디버깅"""
from playwright.sync_api import sync_playwright

URL = "https://www.gangjin.go.kr/www/government/news/press"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=30000)
    page.wait_for_load_state('networkidle')

    print("=== 페이지 타이틀 ===")
    print(page.title())

    print("\n=== 목록 셀렉터 테스트 ===")
    selectors = [
        'ul.board-list > li',
        'ul.board-list li',
        '.board-list li',
        'ul.list > li',
        'ul li.item',
        'div.board-list li',
        'table tbody tr',
        '.bbs-list li',
        'li a[href*="idx="]',
        'a[href*="idx="][href*="mode=view"]',
    ]

    for sel in selectors:
        try:
            elems = page.locator(sel)
            count = elems.count()
            if count > 0:
                print(f"  {sel}: {count}개 발견")
                # 첫 번째 요소의 텍스트 확인
                first_text = elems.first.inner_text()[:100] if count > 0 else ""
                print(f"    첫 요소: {first_text.strip()[:50]}...")
        except Exception as e:
            print(f"  {sel}: 오류 - {str(e)[:30]}")

    print("\n=== 링크 분석 ===")
    links = page.locator('a[href*="idx="]')
    print(f"idx 포함 링크: {links.count()}개")
    for i in range(min(links.count(), 3)):
        link = links.nth(i)
        href = link.get_attribute('href')
        text = link.inner_text().strip()[:50]
        print(f"  [{i+1}] {text} -> {href}")

    print("\n=== HTML 일부 저장 ===")
    html = page.content()
    with open("d:/cbt/koreanews/scrapers/debug/gangjin_page.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("HTML 저장: gangjin_page.html")

    browser.close()

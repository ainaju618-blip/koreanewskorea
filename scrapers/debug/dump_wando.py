"""완도 보도자료 - 전체 HTML 덤프"""
from playwright.sync_api import sync_playwright

def dump_wando_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("=== 완도 보도자료 HTML 덤프 ===")
        page.goto('https://www.wando.go.kr/wando/sub.cs?m=299', timeout=30000, wait_until='networkidle')
        page.wait_for_timeout(5000)
        
        # 전체 HTML 덤프
        html = page.content()
        
        # 보도자료 관련 키워드 찾기
        keywords = ['보도자료', 'board', 'list', 'title', 'subject', '기사', '뉴스']
        print("\n키워드 검색 결과:")
        for kw in keywords:
            count = html.lower().count(kw.lower())
            print(f"  '{kw}': {count}회")
        
        # HTML 일부 저장
        with open('d:/cbt/koreanews/scrapers/debug/wando_dump.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("\nHTML 저장됨: wando_dump.html")
        
        # 테이블 구조 찾기
        tables = page.locator('table')
        print(f"\n테이블 수: {tables.count()}")
        for i in range(min(3, tables.count())):
            rows = tables.nth(i).locator('tr')
            print(f"  Table {i}: {rows.count()}개 행")
            # 첫 몇 행의 내용 출력
            for j in range(min(3, rows.count())):
                text = rows.nth(j).inner_text()[:80].replace('\n', ' | ')
                print(f"    Row {j}: {text}")
        
        browser.close()

if __name__ == "__main__":
    dump_wando_html()

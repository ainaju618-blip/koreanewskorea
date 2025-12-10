"""완도 보도자료 - iframe 또는 동적 로딩 확인"""
from playwright.sync_api import sync_playwright

def check_wando_deep():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("=== 완도 보도자료 페이지 심층 분석 ===")
        page.goto('https://www.wando.go.kr/wando/sub.cs?m=299', timeout=30000, wait_until='networkidle')
        page.wait_for_timeout(5000)  # 더 오래 대기
        
        # iframe 확인
        frames = page.frames
        print(f"\n총 프레임 수: {len(frames)}")
        for i, frame in enumerate(frames):
            print(f"  Frame {i}: {frame.url[:80]}")
            if 'board' in frame.url or 'bbs' in frame.url or 'list' in frame.url:
                print(f"    ^^^ 보드 프레임 발견!")
                # 이 프레임 내에서 링크 찾기
                links = frame.locator('a').all()
                print(f"    링크 수: {len(links)}")
                for j, link in enumerate(links[:10]):
                    href = link.get_attribute('href') or ''
                    text = link.inner_text()[:30].replace('\n', ' ')
                    print(f"      {j}: {text} -> {href}")
        
        # 메인 콘텐츠 영역 확인
        print("\n--- 메인 콘텐츠 영역 ---")
        content_area = page.locator('#container, #content, .content, .sub_content, #sub_content')
        if content_area.count() > 0:
            inner_html = content_area.first.inner_html()[:500]
            print(f"콘텐츠 영역 HTML 샘플:\n{inner_html}")
        
        # board 관련 요소 찾기
        print("\n--- board 관련 요소 ---")
        board_elements = page.locator('[class*="board"], [id*="board"], [class*="list"], [id*="list"]')
        print(f"board/list 요소 수: {board_elements.count()}")
        for i in range(min(5, board_elements.count())):
            elem = board_elements.nth(i)
            cls = elem.get_attribute('class') or ''
            id_ = elem.get_attribute('id') or ''
            print(f"  {i}: class='{cls}' id='{id_}'")
        
        browser.close()

if __name__ == "__main__":
    check_wando_deep()

# 무안군 상세 페이지 DOM 분석 스크립트 v2
from playwright.sync_api import sync_playwright

url = "https://www.muan.go.kr/www/openmuan/new/report?idx=15196540&mode=view"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url, wait_until='networkidle')  # 네트워크까지 대기
    page.wait_for_timeout(3000)  # 3초 대기
    
    print("=" * 60)
    print("무안군 상세 페이지 DOM 분석 (v2)")
    print("=" * 60)
    
    # div.sub_inner와 div.group 내용 확인
    print("\n[div.sub_inner 내용]")
    sub_inner = page.locator('div.sub_inner')
    if sub_inner.count() > 0:
        text = sub_inner.first.inner_text()
        print(f"  길이: {len(text)}자")
        print(f"  내용 (처음 500자):\n{text[:500]}")
    
    print("\n" + "=" * 60)
    print("[div.group 내용]")
    group = page.locator('div.group')
    if group.count() > 0:
        text = group.first.inner_text()
        print(f"  길이: {len(text)}자")
        print(f"  내용 (처음 500자):\n{text[:500]}")
    
    # section 영역 확인
    print("\n" + "=" * 60)
    print("[section 영역]")
    sections = page.locator('section')
    for i in range(min(sections.count(), 5)):
        sec = sections.nth(i)
        cls = sec.get_attribute('class') or '(no class)'
        text_len = len(sec.inner_text())
        print(f"  section.{cls}: {text_len}자")
    
    # 본문으로 보이는 영역 (가장 긴 텍스트)
    print("\n" + "=" * 60)
    print("[가장 긴 텍스트 div 찾기]")
    divs = page.locator('div').all()
    longest = ("", 0, "")
    for div in divs:
        try:
            cls = div.get_attribute('class') or '(no class)'
            text = div.inner_text().strip()
            if len(text) > longest[1] and len(text) < 10000:
                # 메뉴/헤더/푸터 제외
                if '사이트맵' not in text and '로그인' not in text[:100]:
                    longest = (cls, len(text), text[:300])
        except:
            pass
    
    print(f"  가장 긴 div: .{longest[0].split()[0] if longest[0] != '(no class)' else '(no class)'}")
    print(f"  길이: {longest[1]}자")
    print(f"  내용 미리보기:\n{longest[2]}")
    
    browser.close()

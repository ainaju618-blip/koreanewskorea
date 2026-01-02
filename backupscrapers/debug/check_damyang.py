"""담양군 og:description 및 본문 구조 분석"""
from playwright.sync_api import sync_playwright

p = sync_playwright().start()
browser = p.chromium.launch(headless=True)
page = browser.new_page()
page.goto('https://www.damyang.go.kr/board/detail?dataSid=812420&boardId=BBS_0000007&domainId=DOM_0000001&contentsSid=12&menuCd=DOM_000000190001005001')
page.wait_for_selector('button.downBtn', timeout=10000)

# og:description 확인
og_desc = page.locator('meta[property="og:description"]')
if og_desc.count() > 0:
    content = og_desc.get_attribute('content')
    print(f'og:description: {content[:300]}...')
else:
    print('og:description 없음')

# og:title 확인
og_title = page.locator('meta[property="og:title"]')
if og_title.count() > 0:
    print(f'og:title: {og_title.get_attribute("content")}')

# 상세보기 영역 찾기 - conDownItem 부모 컨테이너
down_item = page.locator('.conDownItem').first
if down_item.count() > 0:
    parent = down_item.evaluate('el => el.closest("section, article, div.view, div.board") ? el.closest("section, article, div.view, div.board").className : ""')
    print(f'다운로드 아이템 부모: {parent}')

# 페이지 내 모든 h3 제목
h3s = page.locator('h3')
print(f'\nh3 태그: {h3s.count()}개')
for i in range(min(h3s.count(), 5)):
    txt = h3s.nth(i).text_content()
    if txt:
        print(f'  h3[{i}]: {txt[:50]}')

browser.close()
p.stop()

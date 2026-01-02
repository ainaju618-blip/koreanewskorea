"""
전남도청 스크래퍼 단일 기사 테스트
"""
from playwright.sync_api import sync_playwright
from urllib.parse import urljoin

BASE_URL = 'https://www.jeonnam.go.kr'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 테스트 URL
    url = 'https://www.jeonnam.go.kr/M7116/boardView.do?seq=1960422&menuId=jeonnam0202000000&pageIndex=1&boardId=M7116'
    page.goto(url, wait_until='networkidle', timeout=30000)
    
    print("="*60)
    print("전남도청 스크래퍼 테스트")
    print("="*60)
    
    # 1. 본문 추출 테스트
    content = ''
    for sel in ['div.bbs_view_contnet', 'div.preview_area', 'div.bbs_view']:
        elem = page.locator(sel)
        if elem.count() > 0:
            text = elem.first.inner_text()
            if text and len(text) > 50:
                content = text[:500]
                print(f'\n✅ 본문 셀렉터: {sel}')
                print(f'   본문 길이: {len(text)}자')
                print(f'   샘플: {content[:150]}...')
                break
    
    if not content:
        print('\n❌ 본문 추출 실패')
    
    # 2. 이미지 URL 추출 테스트 (첨부파일)
    thumbnail = None
    links = page.locator('a[href*="boardDown.do"]')
    print(f'\n📎 첨부파일 링크 수: {links.count()}개')
    
    for i in range(links.count()):
        link = links.nth(i)
        title = link.get_attribute('title') or ''
        href = link.get_attribute('href') or ''
        print(f'   [{i}] title="{title[:50]}"')
        
        if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
            thumbnail = urljoin(BASE_URL, href)
            print(f'   ✅ 이미지 발견!')
            break
    
    if thumbnail:
        print(f'\n🖼️ 최종 이미지 URL: {thumbnail}')
    else:
        print('\n⚠️ 첨부파일에서 이미지 없음')
    
    browser.close()
    print('\n' + "="*60)
    print('테스트 완료!')

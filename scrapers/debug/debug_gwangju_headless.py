# -*- coding: utf-8 -*-
"""광주교육청 DOM 디버깅 - Headless vs Non-headless"""

import time
from playwright.sync_api import sync_playwright

URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49998;'

with sync_playwright() as p:
    # headless=True로 테스트 (실제 스크래퍼와 동일)
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=30000)
    print('페이지 로드 완료, 5초 대기...')
    time.sleep(5)
    
    # 전체 a 태그 수
    links = page.locator('a')
    print(f'전체 a 태그 수: {links.count()}')
    
    # file_download 포함된 href 직접 검색 (JavaScript로)
    result = page.evaluate("""() => {
        const all = Array.from(document.querySelectorAll("a"));
        return all.filter(a => (a.getAttribute("href") || "").includes("file_download")).map(a => ({
            href: a.getAttribute("href"),
            text: a.textContent.trim().substring(0,40)
        }));
    }""")
    print('file_download 링크 (JS):', result)
    
    # Playwright locator로도 검색
    dl_links = page.locator('a[href*="file_download"]')
    print(f'Playwright locator 결과: {dl_links.count()}개')
    
    # 현재 페이지 URL 확인
    print(f'현재 URL: {page.url}')
    
    # 페이지 HTML 일부 저장
    html = page.content()
    if 'file_download' in html:
        print('✅ HTML에 file_download 문자열 존재')
        idx = html.find('file_download')
        print(f'   컨텍스트: ...{html[max(0,idx-50):idx+100]}...')
    else:
        print('❌ HTML에 file_download 문자열 없음')
        # 페이지가 프레임 안에 있는지 확인
        frames = page.frames
        print(f'프레임 수: {len(frames)}')
        for i, frame in enumerate(frames):
            frame_html = frame.content()
            if 'file_download' in frame_html:
                print(f'✅ 프레임 {i}에서 file_download 발견!')
    
    browser.close()

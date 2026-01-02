# -*- coding: utf-8 -*-
"""광주교육청 본문 추출 테스트 v2 - JS evaluate 방식"""

import time
from playwright.sync_api import sync_playwright

URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49998;'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=30000)
    time.sleep(3)
    
    print("=" * 60)
    print("광주교육청 본문 추출 테스트 v2 (JS evaluate)")
    print("=" * 60)
    
    # 1. 제목 추출
    title = ""
    title_selectors = ['div.board_view h3', 'div.view_title', 'h3']
    for sel in title_selectors:
        if page.locator(sel).count() > 0:
            title = page.locator(sel).first.text_content().strip()
            break
    
    print(f"\n📌 제목: {title}")
    
    # 2. JS evaluate로 본문 추출 (제목 영역 제외)
    content = page.evaluate("""() => {
        const boardPress = document.querySelector('div.board_press');
        if (!boardPress) return '';
        
        const clone = boardPress.cloneNode(true);
        
        const excludeSelectors = [
            'div.view_top',
            'div.inquiry',
            'div.writer',
            'div.file_list',
            'div.view_bottom',
            '.btn_wrap',
        ];
        
        excludeSelectors.forEach(sel => {
            const els = clone.querySelectorAll(sel);
            els.forEach(el => el.remove());
        });
        
        return clone.textContent?.trim() || '';
    }""")
    
    print(f"\n📄 본문 ({len(content)}자):")
    print("-" * 40)
    print(content[:600] if content else "본문 없음")
    print("-" * 40)
    
    # 제목이 본문에 포함되어 있는지 확인
    if title and content.startswith(title):
        print("\n⚠️ 제목이 본문 첫 부분에 포함되어 있음!")
    else:
        print("\n✅ 제목과 본문이 분리됨!")
    
    browser.close()

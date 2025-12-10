# -*- coding: utf-8 -*-
"""광주교육청 상세 페이지 구조 분석"""

from playwright.sync_api import sync_playwright

DETAIL_URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49991;'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ).new_page()
    
    page.goto(DETAIL_URL, timeout=30000, wait_until='networkidle')
    print(f"✅ 페이지 로드: {page.title()}")
    
    # 본문 영역 후보 분석
    print("\n📋 본문 영역 분석:")
    selectors = [
        'div.view_content', 'div.board_view', 'div.bbs_view', 'div.content',
        'div.view', 'article', 'div.view_body', '#content', '.view_con',
        '.board_content', 'div.ct_wrap', 'div.wms_txt', 'body'
    ]
    
    for sel in selectors:
        try:
            elem = page.locator(sel)
            if elem.count() > 0:
                text = elem.first.text_content() or ""
                print(f"   {sel}: {len(text)}자")
        except:
            pass
    
    # 전체 텍스트 확인
    print("\n📄 전체 body 텍스트 일부:")
    body_text = page.locator('body').text_content() or ""
    print(body_text[:1000])
    
    browser.close()

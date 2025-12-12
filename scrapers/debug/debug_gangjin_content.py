# -*- coding: utf-8 -*-
"""강진군 상세 페이지 본문 셀렉터 확인"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

URL = "https://www.gangjin.go.kr/www/government/news/press?idx=647621&mode=view"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=30000)
    page.wait_for_load_state('networkidle')

    print("=== 페이지 타이틀 ===")
    print(page.title())

    print("\n=== 본문 셀렉터 테스트 ===")
    selectors = [
        'div.view-content',
        'div.board-view',
        'div.bbs-view',
        '.view-content',
        'div.board-view-content',
        'div.content',
        'article',
        '.article-body',
        'div.view-body',
        'div.bbs-view-body',
        'div.board-body',
        '.view_content',
        '#content',
        'main',
        'div.cont-body',
        'div.board_view',
        'section.view',
    ]

    for sel in selectors:
        try:
            elems = page.locator(sel)
            count = elems.count()
            if count > 0:
                text = elems.first.inner_text()[:200] if count > 0 else ""
                if len(text.strip()) > 30:
                    print(f"  {sel}: {count}개 발견, {len(text)}자")
                    print(f"    내용: {text.strip()[:100]}...")
        except Exception as e:
            pass

    print("\n=== HTML 구조 분석 ===")
    # HTML 저장
    html = page.content()
    with open("d:/cbt/koreanews/scrapers/debug/gangjin_detail.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("HTML 저장: gangjin_detail.html")

    # body 내의 주요 div 찾기
    print("\n=== 주요 div 클래스 ===")
    divs = page.locator('div[class]')
    classes_found = set()
    for i in range(min(divs.count(), 50)):
        cls = divs.nth(i).get_attribute('class')
        if cls:
            classes_found.add(cls)

    for cls in sorted(classes_found):
        if any(x in cls.lower() for x in ['view', 'content', 'body', 'article', 'board', 'bbs']):
            print(f"  {cls}")

    browser.close()

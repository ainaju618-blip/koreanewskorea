# -*- coding: utf-8 -*-
"""광주교육청 본문 영역 정확한 셀렉터 찾기"""

from playwright.sync_api import sync_playwright

DETAIL_URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49991;'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ).new_page()
    
    page.goto(DETAIL_URL, timeout=30000, wait_until='networkidle')
    print(f"✅ 페이지 로드 완료")
    
    # 다양한 본문 셀렉터 시도
    print("\n📋 본문 셀렉터 분석:")
    selectors = [
        'div.wms_txt',
        'div.wms_view',
        'div.wms_ctt',
        'div.wms_con',
        'div.view_txt',
        'div.bbs_txt',
        'div.bbs_con',
        'div.board_txt',
        'td.view_content',
        'div.view_area',
        'div#content',
        'div.con_area',
        'div.sv_ctt',
        'section.content',
        'div.wms_mdView'
    ]
    
    for sel in selectors:
        try:
            elem = page.locator(sel)
            if elem.count() > 0:
                text = elem.first.text_content() or ""
                # 본문 시작 텍스트가 포함되어 있는지 확인
                if '광주시교육청' in text and '교육감' in text:
                    print(f"   ✅ {sel}: {len(text)}자 (본문 포함!)")
                    print(f"      미리보기: {text[:200]}...")
                else:
                    print(f"   ⚠️ {sel}: {len(text)}자 (본문 미포함)")
        except:
            pass
    
    # HTML 구조 분석 - 본문 키워드 주변 확인
    print("\n📄 HTML에서 본문 키워드 주변 구조:")
    html = page.content()
    # "광주시교육청(교육감" 키워드 위치 찾기
    keyword = "광주시교육청(교육감"
    idx = html.find(keyword)
    if idx > 0:
        # 키워드 앞뒤 500자 출력
        start = max(0, idx - 300)
        end = min(len(html), idx + 500)
        print(html[start:end])
    else:
        print("키워드를 찾을 수 없음")
    
    browser.close()

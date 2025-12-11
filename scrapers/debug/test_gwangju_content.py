# -*- coding: utf-8 -*-
"""광주교육청 본문 추출 테스트"""

import time, re
from playwright.sync_api import sync_playwright

URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49998;'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=30000)
    time.sleep(3)
    
    print("=" * 60)
    print("광주교육청 본문 추출 테스트")
    print("=" * 60)
    
    # 1. 셀렉터 우선순위로 본문 찾기
    content_selectors = ['div.board_press', 'div.board_view', 'div#contents']
    
    for sel in content_selectors:
        if page.locator(sel).count() > 0:
            raw_content = page.locator(sel).first.text_content() or ""
            if len(raw_content) > 100:
                print(f"\n✅ 본문 발견: {sel} ({len(raw_content)}자)")
                
                # 노이즈 패턴 제거
                content = raw_content.strip()
                noise_patterns = [
                    r'HOME\s*',
                    r'보도/해명자료\s*',
                    r'오늘의 보도/해명자료란에 오신 것을 환영합니다\.?\s*',
                    r'보도자료\s*(?=[^\w]|$)',
                    r'만족도\s*조사.*',
                    r'저작권.*',
                    r'COPYRIGHT.*',
                    r'목록\s*이전글\s*다음글.*',
                ]
                for pattern in noise_patterns:
                    content = re.sub(pattern, '', content, flags=re.IGNORECASE)
                
                content = re.sub(r'\n{3,}', '\n\n', content)
                content = re.sub(r' {2,}', ' ', content)
                content = content.strip()
                
                print(f"\n정제 후 본문 ({len(content)}자):")
                print("-" * 40)
                print(content[:500])
                print("-" * 40)
                break
        else:
            print(f"❌ {sel} 없음")
    
    browser.close()

"""
나주시 본문 영역 정확한 구조 파악
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright

URL = "https://www.naju.go.kr/www/administration/reporting/coverage?idx=592180&mode=view"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.goto(URL, wait_until='networkidle', timeout=30000)
    time.sleep(3)
    
    # 본문 첫 문장으로 가장 작은 요소 찾기
    js_code = """
    () => {
        const contentStart = '정책 의제 공유부터';
        const all = document.querySelectorAll('*');
        let result = null;
        let smallestLength = Infinity;
        
        for (const el of all) {
            const text = el.innerText || '';
            if (text.includes(contentStart) && text.length < smallestLength) {
                result = {
                    tag: el.tagName,
                    id: el.id || 'none',
                    className: el.className || 'none',
                    textLength: text.length,
                    parent: el.parentElement ? {
                        tag: el.parentElement.tagName,
                        id: el.parentElement.id || 'none',
                        className: el.parentElement.className || 'none'
                    } : null
                };
                smallestLength = text.length;
            }
        }
        return result;
    }
    """
    
    result = page.evaluate(js_code)
    
    print("=" * 60)
    print("나주시 본문 영역 분석 결과")
    print("=" * 60)
    
    if result:
        print(f"태그: {result['tag']}")
        print(f"ID: {result['id']}")
        print(f"클래스: {result['className']}")
        print(f"텍스트 길이: {result['textLength']}자")
        if result['parent']:
            print(f"부모 태그: {result['parent']['tag']}")
            print(f"부모 클래스: {result['parent']['className']}")
        
        # CSS 셀렉터 제안
        if result['className'] and result['className'] != 'none':
            cls = result['className'].split()[0]
            print(f"\n>>> 추천 셀렉터: {result['tag'].lower()}.{cls}")
    else:
        print("본문 요소를 찾지 못했습니다.")
    
    browser.close()

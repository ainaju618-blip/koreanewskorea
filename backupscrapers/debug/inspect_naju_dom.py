"""
나주시 상세 페이지 DOM 구조 탐색 v2
"""

import sys
import os
import time
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Logs directory - all logs go to logs/ folder
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

from playwright.sync_api import sync_playwright

URL = "https://www.naju.go.kr/www/administration/reporting/coverage?idx=592086&mode=view"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.goto(URL, wait_until='networkidle', timeout=30000)
    time.sleep(3)
    
    # 모든 컨텐츠 요소 탐색
    js_code = """
    () => {
        const results = [];
        
        // 텍스트가 많은 요소들 찾기
        const allElements = document.querySelectorAll('div, article, section, td, p');
        
        allElements.forEach(el => {
            const text = el.innerText || '';
            // 본문 내용의 특징적인 키워드
            if (text.includes('나주문화재단') || text.includes('밋업데이') || text.includes('정책 의제')) {
                let tag = el.tagName.toLowerCase();
                let id = el.id || '';
                let cls = el.className || '';
                
                // 직접 부모 정보
                let parent = el.parentElement;
                let parentInfo = parent ? `${parent.tagName.toLowerCase()}.${parent.className}` : 'none';
                
                results.push({
                    selector: `${tag}${id ? '#'+id : ''}${cls ? '.'+cls.split(' ')[0] : ''}`,
                    fullClass: cls,
                    parent: parentInfo,
                    textLen: text.length,
                    preview: text.slice(0, 150).replace(/\\n/g, ' ')
                });
            }
        });
        
        // 중복 제거 및 텍스트 길이순 정렬
        const seen = new Set();
        return results
            .filter(r => {
                const key = r.selector + r.textLen;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => b.textLen - a.textLen)
            .slice(0, 10);
    }
    """
    
    results = page.evaluate(js_code)
    
    print("=" * 70)
    print("나주시 상세 페이지 본문 영역 탐색 결과")
    print("=" * 70)
    
    for i, r in enumerate(results):
        print(f"\n[{i+1}] 셀렉터: {r['selector']}")
        print(f"    전체 클래스: {r['fullClass']}")
        print(f"    부모: {r['parent']}")
        print(f"    텍스트 길이: {r['textLen']}자")
        print(f"    미리보기: {r['preview'][:80]}...")
    
    # 가장 적합한 셀렉터 추천
    print("\n" + "=" * 70)
    print("추천 셀렉터")
    print("=" * 70)
    
    if results:
        best = results[0]
        print(f"\n가장 긴 본문 포함 요소: {best['selector']}")
        print(f"전체 클래스: {best['fullClass']}")
        
        # CSS 셀렉터 형태로 출력
        if best['fullClass']:
            first_class = best['fullClass'].split()[0]
            print(f"\n사용할 셀렉터: div.{first_class}")
    
    # 저장 - all logs go to logs/ folder
    output_file = os.path.join(LOG_DIR, 'naju_dom_result.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n결과가 {output_file}에 저장되었습니다.")
    
    browser.close()

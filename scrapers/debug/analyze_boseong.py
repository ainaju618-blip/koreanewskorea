"""
보성군 상세 페이지 본문 구조 분석 스크립트
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
import time
import json

def analyze_boseong_page():
    url = "https://www.boseong.go.kr/www/open_administration/city_news/press_release?idx=1154628&mode=view"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print(f"🔍 페이지 접속 중: {url}")
        page.goto(url, timeout=30000)
        time.sleep(2)
        
        # JavaScript로 페이지 구조 분석
        analysis = page.evaluate("""
        () => {
            const results = {};
            
            // 1. 주요 컨테이너 확인
            const containers = ['.con-wrap', '.bbs_view_cont', '.view_content', '.board_view', 'article', '.content'];
            results.containers = {};
            containers.forEach(sel => {
                const el = document.querySelector(sel);
                if (el) {
                    results.containers[sel] = {
                        exists: true,
                        childCount: el.children.length,
                        textLength: el.innerText?.length || 0,
                        firstChildTag: el.children[0]?.tagName,
                        firstChildClass: el.children[0]?.className
                    };
                }
            });
            
            // 2. .con-wrap 내부 구조 상세 분석
            const conWrap = document.querySelector('.con-wrap');
            if (conWrap) {
                results.conWrapChildren = [];
                for (let i = 0; i < conWrap.children.length; i++) {
                    const child = conWrap.children[i];
                    results.conWrapChildren.push({
                        index: i,
                        tag: child.tagName,
                        class: child.className,
                        id: child.id,
                        textLength: child.innerText?.length || 0,
                        textPreview: child.innerText?.substring(0, 100).replace(/\\s+/g, ' ')
                    });
                }
            }
            
            // 3. 본문으로 추정되는 영역 찾기 (200자 이상 텍스트)
            results.longTextAreas = [];
            const allElements = document.querySelectorAll('div, p, article, section');
            allElements.forEach(el => {
                const text = el.innerText?.trim();
                if (text && text.length > 200 && 
                    !text.includes('첨부파일') && 
                    !text.includes('메뉴') &&
                    el.children.length < 20) {  // 너무 많은 자식은 제외
                    results.longTextAreas.push({
                        tag: el.tagName,
                        class: el.className.substring(0, 50),
                        id: el.id,
                        textLength: text.length,
                        textPreview: text.substring(0, 200).replace(/\\s+/g, ' ')
                    });
                }
            });
            
            // 4. 특정 패턴으로 본문 찾기 (보성군 키워드 포함)
            results.boseongContent = null;
            const bodyText = document.body.innerText;
            const match = bodyText.match(/보성군[은는이가][^]{100,}/);
            if (match) {
                results.boseongContent = match[0].substring(0, 500);
            }
            
            // 5. 메타데이터 테이블 이후 형제 요소 확인
            const table = document.querySelector('.con-wrap table');
            if (table) {
                results.afterTable = [];
                let sibling = table.nextElementSibling;
                while (sibling) {
                    results.afterTable.push({
                        tag: sibling.tagName,
                        class: sibling.className,
                        textLength: sibling.innerText?.length || 0,
                        textPreview: sibling.innerText?.substring(0, 150).replace(/\\s+/g, ' ')
                    });
                    sibling = sibling.nextElementSibling;
                }
            }
            
            return results;
        }
        """)
        
        browser.close()
        
        # 결과를 파일로 저장
        output_file = os.path.join(os.path.dirname(__file__), 'boseong_analysis.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        print(f"Analysis saved to: {output_file}")
        
        return analysis

if __name__ == "__main__":
    analyze_boseong_page()

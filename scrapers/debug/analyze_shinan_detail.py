"""
신안군 상세 페이지 HTML 저장 스크립트
"""
from playwright.sync_api import sync_playwright
import time

def save_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto("https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms")
        time.sleep(2)
        
        links = page.locator('a[href*="/show/"]')
        if links.count() > 0:
            links.first.click()
            time.sleep(3)
            
            # HTML 저장
            html = page.content()
            with open("shinan_detail.html", "w", encoding="utf-8") as f:
                f.write(html)
            print("HTML saved to shinan_detail.html")
            
            # 핵심 분석 결과만 출력
            result = page.evaluate("""
            () => {
                const output = [];
                
                // label 태그 분석
                const labels = document.querySelectorAll('label');
                output.push('=== LABELS ===');
                for (const label of labels) {
                    const text = label.innerText?.trim();
                    if (text) {
                        const parent = label.parentElement;
                        const nextTd = parent?.nextElementSibling;
                        const value = nextTd?.innerText?.trim().substring(0, 100) || '';
                        output.push(text + ': ' + value);
                    }
                }
                
                // 본문 영역 찾기 - table 구조
                output.push('');
                output.push('=== TABLE STRUCTURE ===');
                const tables = document.querySelectorAll('table');
                for (let i = 0; i < tables.length; i++) {
                    const table = tables[i];
                    const cls = table.className || 'no-class';
                    const rows = table.querySelectorAll('tr').length;
                    output.push('Table ' + i + ': class=' + cls + ', rows=' + rows);
                }
                
                // 본문 컨텐츠 위치 추정
                output.push('');
                output.push('=== CONTENT AREA ===');
                
                // td 중에서 가장 긴 텍스트를 가진 것이 본문
                const tds = document.querySelectorAll('td');
                let longestTd = null;
                let maxLen = 0;
                for (const td of tds) {
                    const text = td.innerText?.trim();
                    if (text && text.length > maxLen && text.length < 10000) {
                        maxLen = text.length;
                        longestTd = td;
                    }
                }
                if (longestTd) {
                    output.push('Longest TD: ' + maxLen + ' chars');
                    output.push('Preview: ' + longestTd.innerText.substring(0, 300));
                    
                    // 이 td의 구조 확인
                    const prevLabel = longestTd.previousElementSibling?.querySelector('label')?.innerText;
                    output.push('Previous label: ' + (prevLabel || 'none'));
                }
                
                // 이미지 찾기  
                output.push('');
                output.push('=== IMAGES ===');
                const imgs = document.querySelectorAll('img');
                for (const img of imgs) {
                    const src = img.src;
                    if (src && src.includes('/board/') && !src.includes('icon')) {
                        output.push(src);
                    }
                }
                
                return output.join('\\n');
            }
            """)
            print(result)
            
        browser.close()

if __name__ == "__main__":
    save_html()

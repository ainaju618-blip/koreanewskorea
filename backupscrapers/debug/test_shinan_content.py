"""
신안군 스크래퍼 본문 추출 확인 스크립트
"""
from playwright.sync_api import sync_playwright
import time
import re

def test_content_extraction():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto("https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms")
        time.sleep(2)
        
        links = page.locator('a[href*="/show/"]')
        if links.count() > 0:
            links.first.click()
            time.sleep(3)
            
            # 본문 추출 테스트
            result = page.evaluate("""
            () => {
                const data = { content: '', date: '', images: [] };
                
                const labels = document.querySelectorAll('table.show_form label, table label');
                
                for (const label of labels) {
                    const labelText = label.innerText?.trim();
                    const parentCell = label.closest('th') || label.closest('td');
                    const valueCell = parentCell?.nextElementSibling;
                    
                    if (!valueCell) continue;
                    
                    if (labelText === '내용') {
                        data.content = valueCell.innerText?.trim() || '';
                        const imgs = valueCell.querySelectorAll('img');
                        for (const img of imgs) {
                            const src = img.src;
                            if (src && !src.includes('icon') && !src.includes('btn')) {
                                data.images.push(src);
                            }
                        }
                    }
                    else if (labelText === '등록일') {
                        data.date = valueCell.innerText?.trim() || '';
                    }
                }
                
                return data;
            }
            """)
            
            print("=== CONTENT EXTRACTION TEST ===")
            print(f"\nDate: {result.get('date', 'N/A')}")
            print(f"\nImages: {result.get('images', [])}")
            print(f"\nContent Length: {len(result.get('content', ''))}")
            print(f"\nContent Preview (first 500 chars):")
            content = result.get('content', '')
            print("-" * 50)
            print(content[:500] if content else "NO CONTENT")
            print("-" * 50)
            
            # Check for menu text
            menu_keywords = ['신안군소개', '전자민원창구', '열린군정', '참여마당', '분야별정보']
            has_menu = any(kw in content for kw in menu_keywords)
            print(f"\nContains menu text: {has_menu}")
            
        browser.close()

if __name__ == "__main__":
    test_content_extraction()

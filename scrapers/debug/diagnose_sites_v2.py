"""
전남 시군 사이트 URL 진단 스크립트 v2
"""
from playwright.sync_api import sync_playwright
import time

SITES = [
    ('광양시', 'https://www.gwangyang.go.kr'),
    ('담양군', 'https://www.damyang.go.kr'),
    ('곡성군', 'https://www.gokseong.go.kr'),
    ('구례군', 'https://www.gurye.go.kr'),
]

def check_site(name, base_url):
    print(f"\n{'='*60}")
    print(f"🔍 {name} 진단 중...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(user_agent='Mozilla/5.0').new_page()
        
        try:
            page.goto(base_url, wait_until='domcontentloaded', timeout=30000)
            time.sleep(2)
            
            # 보도자료 링크 찾기
            press_texts = ['보도자료', '보도/해명', '알림마당', '새소식']
            for text in press_texts:
                links = page.locator(f'a:has-text("{text}")')
                if links.count() > 0:
                    href = links.first.get_attribute('href')
                    print(f"📎 '{text}' 링크 발견: {href}")
                    
                    # 그 페이지로 이동
                    if href:
                        full_url = href if href.startswith('http') else base_url + href
                        page.goto(full_url, wait_until='domcontentloaded', timeout=30000)
                        time.sleep(2)
                        
                        current = page.url
                        print(f"📄 현재 URL: {current}")
                        
                        # 셀렉터 테스트
                        selectors = ['a[href*="view"]', 'a[href*="View"]', 'tbody tr', 'ul.list li a', '.board_list a']
                        for sel in selectors:
                            count = page.locator(sel).count()
                            if count > 0:
                                print(f"   ✅ {sel}: {count}개")
                        break
                        
        except Exception as e:
            print(f"❌ 오류: {e}")
        
        browser.close()

if __name__ == "__main__":
    for name, url in SITES:
        check_site(name, url)

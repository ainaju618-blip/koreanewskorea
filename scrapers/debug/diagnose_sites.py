"""
전남 지역 스크래퍼 URL/셀렉터 진단 스크립트
"""
from playwright.sync_api import sync_playwright
import time

# 테스트할 사이트 목록
SITES = [
    ('나주시', 'https://www.naju.go.kr'),
    ('순천시', 'https://www.suncheon.go.kr'),
    ('여수시', 'https://www.yeosu.go.kr'),
]

# 일반적인 보도자료 URL 패턴
URL_PATTERNS = [
    '/www/news/press',
    '/www/open_info/newspaper/press',
    '/www/publicity/press',
    '/kr/news/press',
    '/kr/town/news/press',
    '/news/press',
    '/bbs/list.do',
]

def check_site(name, base_url):
    print(f"\n{'='*60}")
    print(f"🔍 {name} 진단 중...")
    print(f"{'='*60}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(user_agent='Mozilla/5.0').new_page()
        
        # 메인 페이지 접속
        try:
            page.goto(base_url, wait_until='networkidle', timeout=30000)
            print(f"✅ 메인 페이지 접속 성공: {base_url}")
            
            # 보도자료 링크 찾기
            press_links = page.locator('a:has-text("보도자료"), a:has-text("보도/해명"), a:has-text("언론보도")')
            if press_links.count() > 0:
                href = press_links.first.get_attribute('href')
                print(f"📎 보도자료 링크 발견: {href}")
                
                # 보도자료 페이지로 이동
                press_links.first.click()
                time.sleep(2)
                current_url = page.url
                print(f"📄 보도자료 페이지 URL: {current_url}")
                
                # 셀렉터 테스트
                selectors_to_test = [
                    'tbody tr',
                    '.board_list tr',
                    'ul.list li',
                    'a[href*="view"]',
                    'a[href*="View"]',
                    'a[href*="seq="]',
                    '.item a',
                    'div.list a',
                ]
                
                print(f"\n📋 셀렉터 테스트:")
                for sel in selectors_to_test:
                    try:
                        count = page.locator(sel).count()
                        if count > 0:
                            print(f"   ✅ {sel}: {count}개")
                    except:
                        pass
            else:
                print("⚠️ 보도자료 링크를 찾을 수 없음")
                
        except Exception as e:
            print(f"❌ 오류: {e}")
        
        browser.close()

if __name__ == "__main__":
    for name, url in SITES:
        check_site(name, url)

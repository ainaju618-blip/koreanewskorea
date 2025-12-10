"""
나주시청 이미지 다운로드 테스트 (수동 Stealth 설정)
- webdriver 속성 제거
- navigator.plugins 등 브라우저 속성 모방
"""

import os
import time
import re
from playwright.sync_api import sync_playwright

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_manual_stealth')

# Stealth 스크립트 - 자동화 탐지 우회
STEALTH_JS = """
() => {
    // webdriver 속성 제거
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
    
    // plugins 추가
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
    });
    
    // languages 설정
    Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en']
    });
    
    // Chrome 객체 추가
    window.chrome = {
        runtime: {}
    };
    
    // permissions 쿼리 오버라이드
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
}
"""

def test_manual_stealth():
    print("TEST: Manual Stealth")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
            ]
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='ko-KR',
            extra_http_headers={
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        )
        
        # Stealth 스크립트 주입
        context.add_init_script(STEALTH_JS)
        
        page = context.new_page()
        
        # 목록 페이지
        print("1. List page...")
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # 첫 번째 기사
        link = page.locator('tbody tr a[href*="coverage?idx="]').first
        href = link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        detail_url = f"{BASE_URL}{href}"
        
        print(f"2. Detail page (idx={idx})...")
        page.goto(detail_url)
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # og:image 추출
        og_image = page.locator('meta[property="og:image"]').get_attribute('content')
        print(f"3. og:image found")
        
        # HTTPS로 변환
        image_url = og_image.replace('http://', 'https://')
        
        # 이미지 URL로 이동
        print("4. Image URL access...")
        response = page.goto(image_url, wait_until='load')
        
        if response and response.ok:
            print(f"   Status: {response.status} - SUCCESS!")
            image_data = response.body()
            print(f"   Size: {len(image_data)} bytes")
            
            if len(image_data) > 1000:
                filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                print(f"   Saved: {filepath}")
        else:
            status = response.status if response else 'No response'
            print(f"   Status: {status} - FAILED")
        
        browser.close()
    
    print("DONE")

if __name__ == '__main__':
    test_manual_stealth()

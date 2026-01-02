"""
나주시청 이미지 다운로드 테스트 (playwright-stealth)
- Playwright 탐지 우회
"""

import os
import time
import re
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_stealth')

def test_stealth():
    print("TEST: playwright-stealth")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        
        # Stealth 적용
        stealth_sync(page)
        
        # 목록 페이지
        print("1. List page...")
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        
        # 첫 번째 기사
        link = page.locator('tbody tr a[href*="coverage?idx="]').first
        href = link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        detail_url = f"{BASE_URL}{href}"
        
        print(f"2. Detail page (idx={idx})...")
        page.goto(detail_url)
        page.wait_for_load_state('networkidle')
        
        # og:image 추출
        og_image = page.locator('meta[property="og:image"]').get_attribute('content')
        print(f"3. og:image: {og_image}")
        
        # HTTPS로 변환
        image_url = og_image.replace('http://', 'https://')
        
        # 이미지 URL로 이동
        print("4. Image URL...")
        response = page.goto(image_url, wait_until='load')
        
        if response and response.ok:
            print(f"   Status: {response.status}")
            image_data = response.body()
            print(f"   Size: {len(image_data)} bytes")
            
            if len(image_data) > 1000:
                filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                print(f"   SUCCESS: {filepath}")
            else:
                print("   FAILED: too small")
        else:
            status = response.status if response else 'No response'
            print(f"   FAILED: {status}")
            
            # 대안: 스크린샷
            filepath = os.path.join(SAVE_DIR, f"{idx}_screen.png")
            page.screenshot(path=filepath)
            print(f"   Screenshot: {filepath}")
        
        browser.close()
    
    print("DONE")

if __name__ == '__main__':
    test_stealth()

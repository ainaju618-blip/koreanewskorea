"""
나주시청 이미지 다운로드 테스트 (Selenium + Playwright 혼합)
- Selenium으로 브라우저 세션 확보
- 쿠키를 Playwright에 전달하여 이미지 다운로드
"""

import os
import time
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from playwright.sync_api import sync_playwright

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_hybrid')

def test_hybrid():
    print("🚀 Selenium + Playwright 혼합 방식 테스트 (1개 기사)")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # === Selenium 파트: 브라우저 세션 확보 ===
    print("\n📌 Phase 1: Selenium으로 세션 확보")
    
    options = Options()
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    driver = webdriver.Chrome(options=options)
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    
    try:
        # 목록 페이지 접속
        driver.get(LIST_URL)
        time.sleep(2)
        
        # 첫 번째 기사 링크
        first_link = driver.find_element(By.CSS_SELECTOR, 'tbody tr a[href*="coverage?idx="]')
        title = first_link.text.strip()
        href = first_link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        
        print(f"   기사: {title[:40]}...")
        
        # 상세 페이지 이동
        driver.get(href)
        time.sleep(2)
        
        # og:image 추출
        og_image = driver.find_element(By.CSS_SELECTOR, 'meta[property="og:image"]').get_attribute('content')
        print(f"   og:image: {og_image}")
        
        # 쿠키 추출
        selenium_cookies = driver.get_cookies()
        print(f"   쿠키 {len(selenium_cookies)}개 확보")
        
    finally:
        driver.quit()
    
    # === Playwright 파트: 쿠키로 이미지 다운로드 ===
    print("\n📌 Phase 2: Playwright로 이미지 다운로드")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            extra_http_headers={'Referer': href}
        )
        
        # Selenium 쿠키를 Playwright에 주입
        for cookie in selenium_cookies:
            playwright_cookie = {
                'name': cookie['name'],
                'value': cookie['value'],
                'domain': cookie.get('domain', '.naju.go.kr'),
                'path': cookie.get('path', '/'),
            }
            try:
                context.add_cookies([playwright_cookie])
            except:
                pass
        
        page = context.new_page()
        
        # 상세 페이지 먼저 방문 (Referer 설정)
        page.goto(href)
        page.wait_for_load_state('networkidle')
        
        # 이미지 다운로드 시도
        print(f"   이미지 URL로 이동 중...")
        response = page.goto(og_image, wait_until='load')
        
        if response and response.ok:
            image_data = response.body()
            filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
            with open(filepath, 'wb') as f:
                f.write(image_data)
            print(f"   ✅ 성공! 저장: {filepath} ({len(image_data)} bytes)")
        else:
            status = response.status if response else 'No response'
            print(f"   ❌ 실패: {status}")
        
        browser.close()
    
    print("\n🏁 테스트 완료")

if __name__ == '__main__':
    test_hybrid()

"""
나주시청 이미지 다운로드 테스트 (undetected-chromedriver)
- Selenium WebDriver 탐지 우회
- 403 차단 우회 가능성 높음
"""

import os
import time
import re
import requests

try:
    import undetected_chromedriver as uc
    print("undetected_chromedriver OK")
except ImportError:
    print("Installing undetected-chromedriver...")
    os.system("pip install undetected-chromedriver")
    import undetected_chromedriver as uc

from selenium.webdriver.common.by import By

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_uc')

def test_undetected():
    print("TEST: undetected-chromedriver")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # undetected-chromedriver 사용
    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    
    driver = uc.Chrome(options=options)
    
    try:
        # 목록 페이지
        print("1. List page...")
        driver.get(LIST_URL)
        time.sleep(3)
        
        # 첫 번째 기사
        link = driver.find_element(By.CSS_SELECTOR, 'tbody tr a[href*="coverage?idx="]')
        href = link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        
        print(f"2. Detail page (idx={idx})...")
        driver.get(href)
        time.sleep(3)
        
        # og:image 추출
        og_image = driver.find_element(By.CSS_SELECTOR, 'meta[property="og:image"]').get_attribute('content')
        print(f"3. og:image: {og_image}")
        
        # 쿠키 추출
        cookies = driver.get_cookies()
        print(f"4. Cookies: {len(cookies)}")
        
        # requests로 이미지 다운로드 (undetected driver의 쿠키 사용)
        session = requests.Session()
        for cookie in cookies:
            session.cookies.set(cookie['name'], cookie['value'])
        
        headers = {
            'User-Agent': driver.execute_script("return navigator.userAgent;"),
            'Referer': href,
            'Accept': 'image/*,*/*;q=0.8',
        }
        
        print("5. Download image...")
        
        # HTTPS로 변환
        image_url = og_image.replace('http://', 'https://')
        
        resp = session.get(image_url, headers=headers, timeout=15)
        print(f"   Status: {resp.status_code}")
        print(f"   Size: {len(resp.content)} bytes")
        
        if resp.status_code == 200 and len(resp.content) > 1000:
            filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
            with open(filepath, 'wb') as f:
                f.write(resp.content)
            print(f"   SUCCESS: {filepath}")
        else:
            print("   FAILED")
            
            # 대안: 브라우저로 이미지 URL 직접 접근
            print("6. Alt: Direct browser access...")
            driver.get(image_url)
            time.sleep(2)
            
            # 페이지 스크린샷
            filepath = os.path.join(SAVE_DIR, f"{idx}_screen.png")
            driver.save_screenshot(filepath)
            print(f"   Screenshot: {filepath}")
        
    finally:
        driver.quit()
    
    print("DONE")

if __name__ == '__main__':
    test_undetected()

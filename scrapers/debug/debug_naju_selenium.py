"""
나주시청 이미지 다운로드 테스트 (Selenium 방식)
- Selenium + undetected_chromedriver로 차단 우회 시도
"""

import os
import time
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import requests

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_selenium')

def test_selenium():
    print("🚀 Selenium 나주 이미지 다운로드 테스트")
    
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # Chrome 옵션 설정
    options = Options()
    # options.add_argument('--headless')  # 헤드리스 비활성화 (차단 우회를 위해)
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=options)
    
    # 자동화 탐지 우회
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        '''
    })
    
    try:
        # 1. 목록 페이지 접속
        print(f"🌐 목록 페이지 접속: {LIST_URL}")
        driver.get(LIST_URL)
        time.sleep(2)
        
        # 2. 첫 번째 기사 링크 찾기
        first_link = driver.find_element(By.CSS_SELECTOR, 'tbody tr a[href*="coverage?idx="]')
        title = first_link.text.strip()
        href = first_link.get_attribute('href')
        
        # idx 추출
        idx_match = re.search(r'idx=(\d+)', href)
        idx = idx_match.group(1) if idx_match else 'unknown'
        
        print(f"   검색된 기사: {title}")
        print(f"   상세 URL: {href}")
        
        # 3. 상세 페이지 이동
        print("➡️ 상세 페이지 이동 중...")
        driver.get(href)
        time.sleep(2)
        
        # 4. og:image 추출
        og_image_meta = driver.find_element(By.CSS_SELECTOR, 'meta[property="og:image"]')
        og_image_url = og_image_meta.get_attribute('content')
        print(f"   🖼️ og:image: {og_image_url}")
        
        # 5. 방법 1: Selenium으로 이미지 페이지 직접 접근
        print("\n📥 방법 1: Selenium으로 이미지 URL 직접 접근...")
        driver.get(og_image_url)
        time.sleep(2)
        
        # 페이지 소스가 이미지인지 확인
        page_source = driver.page_source
        if 'error' in page_source.lower() or '403' in page_source:
            print("   ❌ 방법 1 실패: 403 또는 에러 페이지")
        else:
            # 스크린샷으로 저장
            filepath = os.path.join(SAVE_DIR, f"{idx}_screenshot.png")
            driver.save_screenshot(filepath)
            print(f"   ✅ 스크린샷 저장: {filepath}")
        
        # 6. 방법 2: Selenium 쿠키를 사용하여 requests로 다운로드
        print("\n📥 방법 2: Selenium 쿠키 + requests...")
        driver.get(href)  # 상세 페이지로 다시 이동
        time.sleep(1)
        
        # 쿠키 추출
        cookies = driver.get_cookies()
        session = requests.Session()
        for cookie in cookies:
            session.cookies.set(cookie['name'], cookie['value'])
        
        # requests로 이미지 다운로드
        headers = {
            'User-Agent': driver.execute_script("return navigator.userAgent;"),
            'Referer': href,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
        
        try:
            resp = session.get(og_image_url, headers=headers, timeout=10)
            print(f"   상태 코드: {resp.status_code}")
            
            if resp.status_code == 200 and len(resp.content) > 1000:
                filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"   ✅ 이미지 저장 성공: {filepath} ({len(resp.content)} bytes)")
            else:
                print(f"   ❌ 방법 2 실패: {resp.status_code}")
        except Exception as e:
            print(f"   ❌ 방법 2 오류: {e}")
        
        # 7. 방법 3: JavaScript로 이미지 Base64 추출
        print("\n📥 방법 3: JavaScript fetch + Base64...")
        driver.get(href)  # 상세 페이지로 다시 이동
        time.sleep(1)
        
        try:
            # JavaScript로 이미지를 Base64로 변환
            script = f'''
                return new Promise((resolve) => {{
                    fetch("{og_image_url}", {{
                        credentials: 'include'
                    }})
                    .then(response => response.blob())
                    .then(blob => {{
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    }})
                    .catch(error => resolve(null));
                }});
            '''
            result = driver.execute_async_script(script)
            
            if result and result.startswith('data:image'):
                import base64
                # Base64 데이터 추출
                base64_data = result.split(',')[1]
                image_data = base64.b64decode(base64_data)
                
                filepath = os.path.join(SAVE_DIR, f"{idx}_js.jpg")
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                print(f"   ✅ JS 방식 성공: {filepath} ({len(image_data)} bytes)")
            else:
                print("   ❌ 방법 3 실패: 응답 없음")
        except Exception as e:
            print(f"   ❌ 방법 3 오류: {e}")
            
    finally:
        driver.quit()
        print("\n🏁 테스트 완료")


if __name__ == '__main__':
    test_selenium()

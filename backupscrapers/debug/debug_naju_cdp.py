"""
나주시청 이미지 다운로드 테스트 (CDP 네트워크 인터셉트 방식)
- Chrome DevTools Protocol을 사용하여 페이지 로딩 시 이미지 응답을 가로챔
"""

import os
import time
import re
import base64
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_cdp')

def test_cdp():
    print("🚀 CDP 네트워크 인터셉트 방식 테스트 (1개 기사)")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    options = Options()
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = webdriver.Chrome(options=options)
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    
    # CDP 네트워크 활성화
    driver.execute_cdp_cmd('Network.enable', {})
    
    captured_images = {}
    
    def process_network_logs():
        """네트워크 로그에서 이미지 응답 추출"""
        logs = driver.get_log('performance')
        for log in logs:
            try:
                import json
                message = json.loads(log['message'])['message']
                if message['method'] == 'Network.responseReceived':
                    response = message['params']['response']
                    url = response['url']
                    mime_type = response.get('mimeType', '')
                    
                    if 'image' in mime_type and 'og_img' in url:
                        request_id = message['params']['requestId']
                        try:
                            body = driver.execute_cdp_cmd('Network.getResponseBody', {'requestId': request_id})
                            if body.get('base64Encoded'):
                                captured_images[url] = base64.b64decode(body['body'])
                            else:
                                captured_images[url] = body['body'].encode()
                            print(f"   📸 캡처됨: {url[:60]}...")
                        except Exception as e:
                            pass  # 이미 처리된 요청은 무시
            except:
                pass
    
    try:
        # 목록 페이지 접속
        print("🌐 목록 페이지 접속...")
        driver.get(LIST_URL)
        time.sleep(2)
        
        # 첫 번째 기사
        first_link = driver.find_element(By.CSS_SELECTOR, 'tbody tr a[href*="coverage?idx="]')
        title = first_link.text.strip()
        href = first_link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        
        print(f"   기사: {title[:40]}...")
        
        # 상세 페이지 이동 - 페이지 내에서 이미지를 로드하도록 함
        print("➡️ 상세 페이지 이동...")
        driver.get(href)
        time.sleep(3)
        
        # 네트워크 로그 처리
        process_network_logs()
        
        # og:image URL 확인
        og_image = driver.find_element(By.CSS_SELECTOR, 'meta[property="og:image"]').get_attribute('content')
        print(f"   og:image: {og_image}")
        
        # 본문 내 이미지가 있는지 확인하고 스크롤
        print("\n📥 본문 이미지 검색 및 스크롤...")
        try:
            content_imgs = driver.find_elements(By.CSS_SELECTOR, '.view_cont img, .bbs_view_cont img, article img')
            for img in content_imgs:
                driver.execute_script("arguments[0].scrollIntoView();", img)
                time.sleep(0.5)
                print(f"   이미지 발견: {img.get_attribute('src')[:50] if img.get_attribute('src') else 'N/A'}...")
        except:
            pass
        
        # 다시 네트워크 로그 처리
        time.sleep(2)
        process_network_logs()
        
        # 캡처된 이미지 저장
        if captured_images:
            print(f"\n📁 캡처된 이미지 {len(captured_images)}개 저장 중...")
            for url, data in captured_images.items():
                filename = f"{idx}_{len(captured_images)}.jpg"
                filepath = os.path.join(SAVE_DIR, filename)
                with open(filepath, 'wb') as f:
                    f.write(data)
                print(f"   ✅ 저장: {filepath} ({len(data)} bytes)")
        else:
            print("\n⚠️ 캡처된 이미지 없음")
            
            # 대안: 페이지 전체 스크린샷에서 이미지 영역 추출
            print("\n📥 대안: 페이지 스크린샷...")
            filepath = os.path.join(SAVE_DIR, f"{idx}_page.png")
            driver.save_screenshot(filepath)
            print(f"   📷 페이지 스크린샷 저장: {filepath}")
            
    finally:
        driver.quit()
        print("\n🏁 테스트 완료")

if __name__ == '__main__':
    test_cdp()

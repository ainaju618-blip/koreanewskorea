"""
나주시청 이미지 다운로드 테스트 (Selenium Canvas 방식)
- 브라우저 내에서 img 태그를 canvas에 그려서 Base64로 추출
- 서버의 직접 다운로드 차단을 우회
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
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_canvas')

def test_canvas():
    print("🚀 Selenium Canvas 방식 테스트 (1개 기사)")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
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
        print("🌐 목록 페이지 접속...")
        driver.get(LIST_URL)
        time.sleep(2)
        
        # 첫 번째 기사
        first_link = driver.find_element(By.CSS_SELECTOR, 'tbody tr a[href*="coverage?idx="]')
        title = first_link.text.strip()
        href = first_link.get_attribute('href')
        idx = re.search(r'idx=(\d+)', href).group(1)
        
        print(f"   기사: {title[:40]}...")
        
        # 상세 페이지 이동
        print("➡️ 상세 페이지 이동...")
        driver.get(href)
        time.sleep(2)
        
        # og:image URL 추출
        og_image = driver.find_element(By.CSS_SELECTOR, 'meta[property="og:image"]').get_attribute('content')
        print(f"   og:image: {og_image}")
        
        # Canvas 방식: img 태그를 canvas에 그려서 Base64로 추출
        print("\n📥 Canvas 방식으로 이미지 추출 시도...")
        
        canvas_script = f'''
        return new Promise((resolve, reject) => {{
            const img = new Image();
            img.crossOrigin = 'anonymous';  // CORS 요청
            img.onload = function() {{
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {{
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    resolve(dataUrl);
                }} catch (e) {{
                    resolve('CORS_ERROR: ' + e.message);
                }}
            }};
            img.onerror = function() {{
                resolve('LOAD_ERROR');
            }};
            img.src = "{og_image}";
            
            // 타임아웃 설정
            setTimeout(() => resolve('TIMEOUT'), 10000);
        }});
        '''
        
        result = driver.execute_script(canvas_script)
        
        if result and result.startswith('data:image'):
            # Base64 데이터 추출
            base64_data = result.split(',')[1]
            image_data = base64.b64decode(base64_data)
            
            filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
            with open(filepath, 'wb') as f:
                f.write(image_data)
            print(f"   ✅ Canvas 방식 성공! {filepath} ({len(image_data)} bytes)")
        elif 'CORS_ERROR' in str(result):
            print(f"   ❌ CORS 에러: {result}")
            
            # CORS 실패 시 대안: 페이지 내 실제 img 태그 캡처
            print("\n📥 대안: 페이지 내 img 태그 직접 캡처...")
            try:
                # 본문 영역의 이미지 찾기
                imgs = driver.find_elements(By.CSS_SELECTOR, 'div img, article img, .content img')
                if imgs:
                    for i, img_elem in enumerate(imgs[:3]):
                        src = img_elem.get_attribute('src')
                        if src and 'naju' in src.lower():
                            print(f"      이미지 발견: {src[:50]}...")
                            # 이미지 요소 스크린샷
                            filepath = os.path.join(SAVE_DIR, f"{idx}_elem_{i}.png")
                            img_elem.screenshot(filepath)
                            print(f"      ✅ 요소 캡처: {filepath}")
                else:
                    print("      페이지 내 적합한 이미지 없음")
            except Exception as e:
                print(f"      대안 실패: {e}")
        else:
            print(f"   ❌ 실패: {result}")
            
    finally:
        driver.quit()
        print("\n🏁 테스트 완료")

if __name__ == '__main__':
    test_canvas()

"""
나주시청 이미지 다운로드 테스트 (PyAutoGUI 우클릭 저장)
- 브라우저에서 이미지를 우클릭하고 "이미지를 다른 이름으로 저장" 자동화
- 모든 서버 차단을 우회할 수 있는 최후의 방법
"""

import os
import time
import re
from playwright.sync_api import sync_playwright

# PyAutoGUI 설치 확인
try:
    import pyautogui
    print("pyautogui OK")
except ImportError:
    print("Installing pyautogui...")
    os.system("pip install pyautogui")
    import pyautogui

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_autogui')

def test_autogui():
    print("TEST: PyAutoGUI Right-click Save")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 반드시 headful
        context = browser.new_context(viewport={'width': 1280, 'height': 1024})
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
        time.sleep(3)
        
        # 본문 영역의 이미지 찾기
        print("3. Finding image...")
        imgs = page.locator('div img')
        
        for i in range(min(imgs.count(), 5)):
            img = imgs.nth(i)
            src = img.get_attribute('src') or ''
            
            # 나주 관련 이미지만
            if 'naju' not in src.lower() and 'og_img' not in src.lower():
                continue
            
            print(f"   Found image: {src[:50]}...")
            
            # 이미지 위치 가져오기
            box = img.bounding_box()
            if not box or box['width'] < 100:
                continue
            
            # 이미지 중앙으로 스크롤
            img.scroll_into_view_if_needed()
            time.sleep(1)
            
            # 이미지 위치 다시 계산 (스크롤 후)
            box = img.bounding_box()
            if not box:
                continue
            
            # 브라우저 창 위치 확인 (Playwright는 창 위치를 직접 제공하지 않음)
            # 일반적으로 창은 화면 왼쪽 상단에 위치
            # 이미지 중앙 좌표 계산
            img_x = int(box['x'] + box['width'] / 2)
            img_y = int(box['y'] + box['height'] / 2)
            
            print(f"   Image position: ({img_x}, {img_y})")
            
            # PyAutoGUI로 우클릭
            print("4. Right-click on image...")
            pyautogui.click(img_x, img_y, button='right')
            time.sleep(1)
            
            # "이미지를 다른 이름으로 저장" 메뉴 클릭 (단축키: v)
            print("5. Press 'v' to save image...")
            pyautogui.press('v')
            time.sleep(2)
            
            # 파일명 입력
            filepath = os.path.join(SAVE_DIR, f"{idx}.jpg")
            print(f"6. Enter filename: {filepath}")
            pyautogui.typewrite(filepath.replace('\\', '/'))
            time.sleep(1)
            
            # 저장 버튼 (Enter)
            pyautogui.press('enter')
            time.sleep(2)
            
            # 파일 확인
            if os.path.exists(filepath):
                size = os.path.getsize(filepath)
                print(f"   SUCCESS: {filepath} ({size} bytes)")
            else:
                print("   File not created, trying screenshot...")
                # 대안: 이미지 요소 스크린샷
                filepath = os.path.join(SAVE_DIR, f"{idx}_screenshot.png")
                img.screenshot(path=filepath)
                if os.path.exists(filepath):
                    print(f"   Screenshot saved: {filepath}")
            
            break  # 첫 번째 이미지만 처리
        
        browser.close()
    
    print("DONE")

if __name__ == '__main__':
    test_autogui()

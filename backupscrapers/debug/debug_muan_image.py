# 무안군 이미지 저장 디버그
from playwright.sync_api import sync_playwright
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.local_image_saver import download_and_save_locally, WEB_PUBLIC_DIR

url = "https://www.muan.go.kr/www/openmuan/new/report?idx=15196540&mode=view"
BASE_URL = "https://www.muan.go.kr"

print("=" * 60)
print("무안군 이미지 저장 디버그")
print("=" * 60)

print(f"\n[경로 확인]")
print(f"  WEB_PUBLIC_DIR: {WEB_PUBLIC_DIR}")
print(f"  존재 여부: {os.path.exists(WEB_PUBLIC_DIR)}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(3000)
    
    print(f"\n[이미지 태그 탐색]")
    imgs = page.locator('div.sub_inner img')
    print(f"  총 img 태그 수: {imgs.count()}")
    
    original_image_url = None
    
    for i in range(min(imgs.count(), 10)):
        src = imgs.nth(i).get_attribute('src') or ''
        print(f"  [{i}] src: {src[:70]}")
        
        if any(x in src.lower() for x in ['icon', 'logo', 'kogl', 'opentype', 'btn', 'qr']):
            print(f"      → 스킵 (아이콘/로고)")
            continue
        
        if 'ybmodule.file/board' in src or 'www_report' in src:
            # URL 정규화
            if src.startswith('./'):
                original_image_url = f"{BASE_URL}{src[1:]}"
            elif src.startswith('/'):
                original_image_url = f"{BASE_URL}{src}"
            else:
                original_image_url = src
            print(f"      → 선택됨: {original_image_url}")
            break
    
    if original_image_url:
        print(f"\n[이미지 다운로드 테스트]")
        print(f"  URL: {original_image_url}")
        
        result = download_and_save_locally(original_image_url, BASE_URL, 'muan')
        print(f"  결과: {result}")
        
        if result:
            # 실제 파일 존재 확인
            file_path = os.path.join(WEB_PUBLIC_DIR, 'muan', os.path.basename(result))
            print(f"  파일 경로: {file_path}")
            print(f"  파일 존재: {os.path.exists(file_path)}")
    else:
        print("\n[이미지 URL 찾지 못함]")
    
    browser.close()

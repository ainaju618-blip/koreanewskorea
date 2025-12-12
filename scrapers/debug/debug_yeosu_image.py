"""여수 이미지 추출 상세 디버그"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from urllib.parse import urljoin
import time

BASE_URL = 'https://www.yeosu.go.kr'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 이미지가 있다고 알려진 기사
    url = 'https://www.yeosu.go.kr/www/govt/news/release/press?idx=568525&mode=view'
    page.goto(url)
    time.sleep(3)
    
    print(f"=== 여수시 이미지 추출 디버그 ===")
    print(f"URL: {url}")
    
    # 첨부파일 링크 찾기
    links = page.locator('a[href*="file_download"]')
    count = links.count()
    print(f"\n🔍 첨부파일 링크 {count}개 발견")
    
    for i in range(min(count, 5)):
        link = links.nth(i)
        href = link.get_attribute('href') or ''
        text = link.text_content() or ''
        
        print(f"\n📄 첨부 #{i}:")
        print(f"   텍스트: {text[:50]}...")
        print(f"   href: {href[:80]}...")
        
        # 이미지 확인
        is_image = any(ext in text.lower() or ext in href.lower() 
                      for ext in ['.jpg', '.jpeg', '.png', '.gif'])
        print(f"   이미지 여부: {is_image}")
        
        if is_image and href:
            full_url = urljoin(BASE_URL, href) if not href.startswith('http') else href
            print(f"   ✅ 전체 URL: {full_url[:100]}...")
            
            # 다운로드 테스트
            from utils.cloudinary_uploader import download_and_upload_image
            result = download_and_upload_image(full_url, BASE_URL, folder='yeosu')
            print(f"   Cloudinary 결과: {result}")
            break
            
    browser.close()

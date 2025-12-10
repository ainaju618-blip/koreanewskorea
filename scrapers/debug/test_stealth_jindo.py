
import sys
import os
import time
import random
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.scraper_utils import wait_and_find, safe_get_text, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image

def test_jindo_stealth():
    print("🕵️ 진도군 스텔스 이미지 수집 테스트 시작 (최대 3건)")
    
    base_url = 'https://www.jindo.go.kr'
    list_url = 'https://www.jindo.go.kr/home/sub.cs?m=626'
    
    with sync_playwright() as p:
        # Stealth Context
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1920, 'height': 1080},
            ignore_https_errors=True
        )
        
        # Add stealth scripts
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        page = context.new_page()
        
        print(f"   📄 목록 페이지 접근 중: {list_url}")
        page.goto(list_url, wait_until='networkidle')
        
        # Get article links
        links = []
        rows = page.locator('tbody tr')
        count = rows.count()
        print(f"   📰 발견된 기사: {count}개 (3개만 수집)")
        
        for i in range(min(count, 3)):
            row = rows.nth(i)
            link_elem = row.locator('td a')
            if link_elem.count() > 0:
                href = link_elem.get_attribute('href')
                title = link_elem.inner_text().strip()
                if href:
                    links.append({'title': title, 'url': urljoin(base_url, href)})
        
        # Process each article
        for idx, item in enumerate(links):
            print(f"\n   [{idx+1}/{len(links)}] 처리 중: {item['title'][:20]}...")
            
            try:
                # Add Referer header
                page.set_extra_http_headers({'Referer': list_url})
                page.goto(item['url'], wait_until='domcontentloaded')
                time.sleep(random.uniform(2, 4)) # Random delay
                
                # Find Content & Image
                content_selectors = ['div.view_con', 'div.board_view', 'div.view_content']
                container = wait_and_find(page, content_selectors)
                
                if container:
                    # Find image inside container
                    img_selectors = ['img'] 
                    # Jindo specific: excludes icons
                    
                    images = container.locator('img')
                    found_img = False
                    
                    for k in range(images.count()):
                        img = images.nth(k)
                        src = img.get_attribute('src')
                        if src and not any(x in src for x in ['icon', 'btn', 'logo', 'common']):
                            full_img_url = urljoin(base_url, src)
                            print(f"      👀 이미지 발견: {src[:50]}...")
                            
                            # Stealth Download & Upload
                            print(f"      ⬇️ 스텔스 다운로드 시작 (Referer: {item['url']})")
                            cloud_url = download_and_upload_image(
                                full_img_url, 
                                base_url=item['url'], # Use article URL as Referer
                                folder="jindo_test"
                            )
                            
                            if cloud_url:
                                print(f"      ✅ 성공! Cloudinary URL: {cloud_url}")
                                found_img = True
                                break
                            else:
                                print(f"      ❌ 실패")
                    
                    if not found_img:
                        print("      ⚠️ 본문 내 적절한 이미지 없음")
                else:
                    print("      ❌ 본문 컨테이너 못 찾음")
                    
            except Exception as e:
                print(f"      ❌ 에러: {e}")

        browser.close()

if __name__ == "__main__":
    test_jindo_stealth()

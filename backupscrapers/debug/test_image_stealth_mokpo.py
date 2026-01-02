"""
Mokpo Stealth Image Capture Test
- Demonstrates capturing images by mimicking browser requests
- Uses Cloudinary for storage
- Limit: 5 articles
"""

import sys
import os
import time
import random
from typing import List, Dict, Optional
from urllib.parse import urljoin

# Add parent directory to path to import utils
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import wait_and_find, safe_get_text, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image

REGION_CODE = 'mokpo'
REGION_NAME = '목포시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.mokpo.go.kr'
LIST_URL = 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material'

# 목포시 전용 셀렉터 (Copied from mokpo_scraper.py)
LIST_SELECTORS = [
    'a.item_cont',
    '.list_item a',
    'a[href*="view"]',
]

def test_stealth_capture():
    print(f"🕵️ {REGION_NAME} 스텔스 이미지 수집 테스트 시작 (최대 5건)")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
def test_stealth_capture():
    print(f"🕵️ {REGION_NAME} 스텔스 이미지 수집 테스트 시작 (최대 5건)")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        # 1. List Page Access
        print(f"   📄 목록 페이지 접근 중: {LIST_URL}")
        page.goto(LIST_URL, wait_until='domcontentloaded')
        
        # 2. Get Articles
        rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
        
        if not rows:
             print("      ⚠️ 타임아웃: 기사 목록을 찾을 수 없습니다.")
             return

        count = rows.count()
        print(f"   📰 발견된 기사: {count}개 (5개만 수집)")
        
        # 2.1 Collect Links First
        link_data = []
        for i in range(min(count, 5)):
             try:
                row = rows.nth(i)
                title_elem = row.locator('h3')
                if title_elem.count() == 0:
                    title = row.inner_text().strip()
                else:
                    title = title_elem.inner_text().strip()
                
                href = row.get_attribute('href')
                full_url = urljoin(BASE_URL, href)
                link_data.append({'title': title, 'url': full_url})
             except Exception as e:
                print(f"      링크 수집 중 에러: {e}")

        # 3. Process Details
        collected_count = 0
        for item in link_data:
            try:
                title = item['title']
                full_url = item['url']
                print(f"\n   [{collected_count+1}/5] 처리 중: {title[:20]}...")
                
                # Goto Detail
                page.goto(full_url, wait_until='domcontentloaded')
                time.sleep(random.uniform(1.5, 3.0)) # Human-like pause
                
                # 4. Find Image
                img_selector = ['div.image_viewbox img', 'div.viewbox img', 'div.board_view_cont img']
                container_selector = ['div.viewbox', 'div.module_view_box', 'div.board_view_cont']
                
                thumbnail_url = None # Initialize 
                
                # Use wait_and_find for robustness
                container = wait_and_find(page, container_selector, timeout=5000)
                
                if container:
                    print(f"      👀 본문 컨테이너 발견: {container.evaluate('node => node.className')}")
                    imgs_in_container = container.locator('img')
                    count = imgs_in_container.count()
                    print(f"      👀 컨테이너 내 이미지 개수: {count}")
                    
                    if count > 0:
                        img_elem = imgs_in_container.first
                        src = img_elem.get_attribute('src')
                        if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo']):
                            original_img_url = urljoin(BASE_URL, src)
                            print(f"      📸 이미지 발견: {original_img_url[:50]}...")
                            
                            # 5. Stealth Download & Upload
                            print("      ☁️ Cloudinary 업로드 시도 (Referer Spoofing)...")
                            cloudinary_url = download_and_upload_image(
                                original_img_url, 
                                base_url=full_url, 
                                folder="mokpo_test"
                            )
                            
                            if cloudinary_url:
                                thumbnail_url = cloudinary_url
                                print(f"      ✅ 업로드 성공: {thumbnail_url}")
                            else:
                                print("      ❌ 업로드 실패 (원본 URL 유지)")
                                thumbnail_url = original_img_url
                                
                            time.sleep(random.uniform(2, 4))
                else:
                    print(f"      ⚠️ 본문 컨테이너를 찾을 수 없습니다. (HTML 덤프 저장: debug_mokpo.html)")
                    with open('debug_mokpo.html', 'w', encoding='utf-8') as f:
                        f.write(page.content())
                
                # 6. Extract Content
                if container:
                    content = container.inner_text().strip()[:1000]
                else:
                    content = "Content missing"
                
                # 7. Send to Server
                article = {
                   'title': f"[스텔스 테스트] {title}",
                   'content': content,
                   'published_at': time.strftime('%Y-%m-%dT09:00:00+09:00'),
                   'original_link': full_url,
                   'source': REGION_NAME,
                   'category': CATEGORY_NAME,
                   'region': REGION_CODE,
                   'thumbnail_url': thumbnail_url
                }
                
                result = send_article_to_server(article)
                if result.get('status') == 'created':
                    print("      💾 서버 저장 완료")
                else:
                    print(f"      ⚠️ 서버 저장 결과: {result.get('status')}")
                    
                collected_count += 1
                
            except Exception as e:
                print(f"      ❌ 에러 발생: {e}")
                continue
                
        browser.close()
        print(f"\n✅ 테스트 완료: {collected_count}개 처리됨")

def new_date_format(date_str):
    if not date_str: return time.strftime('%Y-%m-%dT09:00:00+09:00')
    try:
        return f"{date_str.replace('.','-').strip()}T09:00:00+09:00"
    except:
        return time.strftime('%Y-%m-%dT09:00:00+09:00')

if __name__ == "__main__":
    test_stealth_capture()

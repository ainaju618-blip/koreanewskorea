# -*- coding: utf-8 -*-
"""광주교육청 이미지 추출 테스트 스크립트"""

import sys, os, time, re
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from utils.cloudinary_uploader import download_and_upload_image

BASE_URL = 'https://enews.gen.go.kr'
TEST_URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49998;'
DOWNLOAD_BASE = 'https://enews.gen.go.kr/v5/decoboard/download.php?uid='

def test_image_extraction():
    print("🧪 광주교육청 이미지 추출 테스트 시작")
    print(f"   URL: {TEST_URL}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto(TEST_URL, timeout=30000)
        time.sleep(2)
        
        print("\n📎 첨부파일 링크 분석:")
        attachment_links = page.locator('a[href*="file_download"]')
        count = attachment_links.count()
        print(f"   발견된 첨부파일 수: {count}")
        
        thumbnail_url = None
        
        for i in range(count):
            link = attachment_links.nth(i)
            text = link.text_content() or ""
            href = link.get_attribute('href') or ""
            
            print(f"\n   [{i+1}] 텍스트: {text.strip()[:50]}")
            print(f"       href: {href[:60]}")
            
            # 이미지 확장자 필터
            text_lower = text.lower()
            is_image = any(ext in text_lower for ext in ['.jpg', '.jpeg', '.png'])
            print(f"       이미지 여부: {is_image}")
            
            if is_image:
                uid_match = re.search(r"file_download\(['\"]?(\d+)['\"]?\)", href)
                if uid_match:
                    file_uid = uid_match.group(1)
                    download_url = DOWNLOAD_BASE + file_uid
                    print(f"       UID: {file_uid}")
                    print(f"       다운로드 URL: {download_url}")
                    
                    # Cloudinary 업로드 테스트
                    print(f"\n   ☁️ Cloudinary 업로드 시도...")
                    cloud_url = download_and_upload_image(download_url, BASE_URL, folder="gwangju_edu")
                    
                    if cloud_url:
                        print(f"   ✅ 업로드 성공: {cloud_url}")
                        thumbnail_url = cloud_url
                    else:
                        print(f"   ⚠️ 업로드 실패, 원본 URL 사용")
                        thumbnail_url = download_url
                    break
        
        browser.close()
    
    print(f"\n🎉 테스트 완료!")
    print(f"   최종 썸네일 URL: {thumbnail_url}")
    return thumbnail_url

if __name__ == "__main__":
    test_image_extraction()

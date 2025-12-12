
import os
import sys
# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import time
from playwright.sync_api import sync_playwright
from scrapers.utils.cloudinary_uploader import upload_local_image
import tempfile

def debug_image_flow():
    detail_url = "https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056&type=view&bs_idx=1154680"
    
    print(f"🔍 Testing Download & Upload Flow for: {detail_url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(detail_url)
        
        # Click download link
        try:
            link = page.locator('a[href*="type=download"]').first
            print(f"   Found link: {link.inner_text()}")
            
            with page.expect_download(timeout=10000) as download_info:
                link.evaluate("el => el.click()")
            
            download = download_info.value
            temp_path = os.path.join(tempfile.gettempdir(), f"debug_{int(time.time())}.jpg")
            download.save_as(temp_path)
            print(f"   💾 Downloaded to: {temp_path}")
            
            # Upload
            print("   ☁️ Attempting Cloudinary Upload...")
            url = upload_local_image(temp_path, folder="test_yeonggwang")
            
            if url:
                print(f"   ✅ Upload Success: {url}")
            else:
                print("   ❌ Upload Failed (Check logs for Invalid api_key)")
                
        except Exception as e:
            print(f"   ❌ Flow Failed: {e}")
            
        browser.close()

if __name__ == "__main__":
    debug_image_flow()

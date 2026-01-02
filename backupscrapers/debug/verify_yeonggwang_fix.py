
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scrapers.yeonggwang.yeonggwang_scraper import collect_articles, fetch_detail, build_list_url, build_detail_url
from playwright.sync_api import sync_playwright
import time

def verify_fix():
    print("🔍 영광군청 본문 추출 테스트 (공공누리 제외 확인)")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Get List
        list_url = build_list_url(0)
        page.goto(list_url)
        time.sleep(2)
        
        # Get first 6 links
        links = page.locator('table tbody tr a[href*="bs_idx"]').all()
        targets = []
        for link in links:
            href = link.get_attribute('href')
            if href:
                targets.append(href)
            if len(targets) >= 6:
                break
                
        print(f"📄 수집 대상: {len(targets)}개")
        
        for i, href in enumerate(targets):
            full_url = "https://www.yeonggwang.go.kr/bbs/" + href if not href.startswith("http") else href
            print(f"\n[{i+1}/6] URL: {full_url}")
            
            content, thumb, date = fetch_detail(page, full_url)
            
            print(f"   📅 날짜: {date}")
            print(f"   🖼️ 이미지: {'있음' if thumb else '없음'}")
            print(f"   📝 본문 길이: {len(content)}")
            print(f"   📝 본문 미리보기 (100자):\n   {content[:100].replace('\n', ' ')}...")
            
            if "공공누리" in content:
                print("   ❌ 실패: 본문에 '공공누리' 텍스트가 포함되어 있습니다!")
            else:
                print("   ✅ 통과: '공공누리' 텍스트 없음")
                
        browser.close()

if __name__ == "__main__":
    verify_fix()

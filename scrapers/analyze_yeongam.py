"""영암군 페이지 분석 스크립트"""
from playwright.sync_api import sync_playwright
import time
import re

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print("영암군 상세 페이지 분석 중...")
    page.goto('https://www.yeongam.go.kr/home/www/open_information/yeongam_news/bodo/show/vfco53xukyft45urhlni', timeout=60000)
    time.sleep(5)
    
    # 1. 본문 선택자 테스트
    print("\n=== 본문 선택자 테스트 ===")
    selectors = ['.con_detail', '.show_info', '.secondDiv', '.bbs_view']
    for sel in selectors:
        elem = page.locator(sel)
        if elem.count() > 0:
            text = elem.first.inner_text()
            print(f"{sel}: {len(text)}자")
            if len(text) > 100:
                print(f"  내용: {text[:300]}...")
    
    # 2. 이미지 선택자 테스트
    print("\n=== 이미지 분석 ===")
    
    # con_detail 내 이미지
    detail_imgs = page.locator('.con_detail img, .show_info img')
    print(f"본문 내 이미지: {detail_imgs.count()}개")
    for i in range(detail_imgs.count()):
        src = detail_imgs.nth(i).get_attribute('src') or ''
        print(f"  {src}")
    
    # 전체 이미지 중 콘텐츠 이미지 찾기
    all_imgs = page.locator('img')
    print(f"\n전체 이미지: {all_imgs.count()}개")
    for i in range(all_imgs.count()):
        src = all_imgs.nth(i).get_attribute('src') or ''
        if 'jpg' in src.lower() or 'png' in src.lower() or 'jpeg' in src.lower():
            if not any(x in src.lower() for x in ['icon', 'logo', 'banner', 'main2', 'sub']):
                print(f"  콘텐츠 이미지: {src}")
    
    browser.close()


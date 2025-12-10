# -*- coding: utf-8 -*-
"""전라남도 보도자료 상세 페이지 구조 분석 스크립트"""

from playwright.sync_api import sync_playwright

URL = "https://www.jeonnam.go.kr/M7116/boardView.do?seq=1960439&menuId=jeonnam0202000000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, wait_until='networkidle', timeout=30000)
    
    print("=" * 60)
    print("전라남도 보도자료 상세 페이지 분석")
    print("=" * 60)
    
    # 1. 본문 영역 찾기
    print("\n[1] 본문 영역 분석:")
    content_selectors = [
        'div.bbs_view_contnet',
        'div.preview_area',
        'div.bbs_view',
        'div.contents',
        'div.view_cont',
    ]
    for sel in content_selectors:
        elem = page.locator(sel)
        if elem.count() > 0:
            text = elem.first.inner_text()[:200]
            print(f"  ✅ {sel}: {len(text)}자 - {text[:50]}...")
    
    # 2. 첨부파일 영역 찾기
    print("\n[2] 첨부파일 링크 분석:")
    download_links = page.locator('a[href*="boardDown.do"], a[href*="download"]')
    print(f"  📎 첨부파일 링크 수: {download_links.count()}")
    for i in range(min(download_links.count(), 5)):
        link = download_links.nth(i)
        href = link.get_attribute('href')
        title = link.get_attribute('title') or link.inner_text()
        print(f"     [{i+1}] {title[:40]} → {href[:60]}...")
    
    # 3. 본문 내 이미지 찾기
    print("\n[3] 본문 내 이미지 분석:")
    imgs = page.locator('div.bbs_view_contnet img, div.preview_area img, div.contents img')
    print(f"  🖼️ 이미지 수: {imgs.count()}")
    for i in range(min(imgs.count(), 5)):
        img = imgs.nth(i)
        src = img.get_attribute('src')
        alt = img.get_attribute('alt') or "(no alt)"
        print(f"     [{i+1}] {alt[:30]} → {src[:60]}...")
    
    # 4. 이미지 확장자가 있는 첨부파일 찾기
    print("\n[4] 이미지 첨부파일 분석:")
    all_links = page.locator('a')
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    image_count = 0
    for i in range(all_links.count()):
        link = all_links.nth(i)
        title = link.get_attribute('title') or ""
        href = link.get_attribute('href') or ""
        if any(ext in title.lower() for ext in image_extensions):
            print(f"     🖼️ {title} → {href[:60]}...")
            image_count += 1
            if image_count >= 5:
                break
    if image_count == 0:
        print("     (이미지 확장자 첨부파일 없음)")
    
    browser.close()
    print("\n" + "=" * 60)
    print("분석 완료")

# -*- coding: utf-8 -*-
"""광주교육청 셀렉터 최종 테스트"""

import time, re
from playwright.sync_api import sync_playwright

URL = 'https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:49998;'
DOWNLOAD_BASE = 'https://enews.gen.go.kr/v5/decoboard/download.php?uid='

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=30000)
    time.sleep(5)
    
    print("=" * 60)
    print("테스트 1: JavaScript evaluate로 링크 찾기")
    print("=" * 60)
    result = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('a'))
            .filter(a => (a.getAttribute('href') || '').includes('file_download'))
            .map(a => ({
                href: a.getAttribute('href'),
                text: a.textContent.trim()
            }));
    }""")
    print(f"발견: {len(result)}개")
    for i, r in enumerate(result):
        print(f"  [{i+1}] {r['text'][:60]}")
        print(f"      href: {r['href']}")
    
    print("\n" + "=" * 60)
    print("테스트 2: Playwright locator로 링크 찾기")
    print("=" * 60)
    locator = page.locator('a[href*="file_download"]')
    count = locator.count()
    print(f"발견: {count}개")
    
    if count > 0:
        for i in range(count):
            link = locator.nth(i)
            text = link.text_content() or ""
            href = link.get_attribute('href') or ""
            print(f"  [{i+1}] {text[:60]}")
            print(f"      href: {href}")
    
    print("\n" + "=" * 60)
    print("테스트 3: 이미지 추출 시뮬레이션")
    print("=" * 60)
    
    # 스크래퍼와 동일한 로직
    attachment_links = page.locator('a[href*="file_download"]')
    thumbnail_url = None
    
    for i in range(attachment_links.count()):
        link = attachment_links.nth(i)
        text = (link.text_content() or "").lower()
        href = link.get_attribute('href') or ""
        
        if any(ext in text for ext in ['.jpg', '.jpeg', '.png']):
            uid_match = re.search(r"file_download\(['\"]?(\d+)['\"]?\)", href)
            if uid_match:
                file_uid = uid_match.group(1)
                download_url = DOWNLOAD_BASE + file_uid
                print(f"✅ 이미지 발견!")
                print(f"   텍스트: {text[:50]}")
                print(f"   UID: {file_uid}")
                print(f"   다운로드 URL: {download_url}")
                thumbnail_url = download_url
                break
    
    if not thumbnail_url:
        print("❌ 이미지를 찾지 못함")
        # JS로 다시 시도
        print("\n대안: JS로 직접 추출 시도...")
        js_result = page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('a'));
            for (const a of links) {
                const href = a.getAttribute('href') || '';
                const text = (a.textContent || '').toLowerCase();
                if (href.includes('file_download') && (text.includes('.jpg') || text.includes('.png'))) {
                    const match = href.match(/file_download\\(['\"]?(\\d+)['\"]?\\)/);
                    if (match) {
                        return { uid: match[1], text: a.textContent.trim() };
                    }
                }
            }
            return null;
        }""")
        if js_result:
            print(f"   ✅ JS로 발견: UID={js_result['uid']}, 텍스트={js_result['text'][:50]}")
            thumbnail_url = DOWNLOAD_BASE + js_result['uid']
        else:
            print("   ❌ JS로도 발견 실패")
    
    print(f"\n최종 thumbnail_url: {thumbnail_url}")
    browser.close()

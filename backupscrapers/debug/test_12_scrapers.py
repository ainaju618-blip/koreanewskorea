"""12개 성공 스크래퍼만 1개씩 추출 테스트"""
import sys
import os
from urllib.parse import urljoin

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright

# 성공한 12개 스크래퍼만
SCRAPERS = [
    {'code': 'jeonnam', 'name': '전남도', 'file': 'jeonnam_scraper'},
    {'code': 'mokpo', 'name': '목포시', 'file': 'mokpo_scraper'},
    {'code': 'yeosu', 'name': '여수시', 'file': 'yeosu_scraper'},
    {'code': 'suncheon', 'name': '순천시', 'file': 'suncheon_scraper'},
    {'code': 'naju', 'name': '나주시', 'file': 'naju_scraper'},
    {'code': 'gwangyang', 'name': '광양시', 'file': 'gwangyang_scraper'},
    {'code': 'gokseong', 'name': '곡성군', 'file': 'gokseong_scraper'},
    {'code': 'gurye', 'name': '구례군', 'file': 'gurye_scraper'},
    {'code': 'hwasun', 'name': '화순군', 'file': 'hwasun_scraper'},
    {'code': 'hampyeong', 'name': '함평군', 'file': 'hampyeong_scraper'},
    {'code': 'yeonggwang', 'name': '영광군', 'file': 'yeonggwang_scraper'},
    {'code': 'wando', 'name': '완도군', 'file': 'wando_scraper'},
]

def extract_one(module, context):
    """1개 기사 추출"""
    from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr
    
    result = {'title': '', 'content': '', 'image': '', 'status': '❌'}
    
    try:
        list_url = getattr(module, 'LIST_URL', '')
        base_url = getattr(module, 'BASE_URL', '')
        list_sels = getattr(module, 'LIST_SELECTORS', [])
        content_sels = getattr(module, 'CONTENT_SELECTORS', [])
        
        page = context.new_page()
        page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(2000)
        
        # 리스트에서 첫 기사
        link = None
        for sel in list_sels:
            items = page.locator(sel)
            if items.count() > 0:
                link = items.first
                break
        
        if not link:
            page.close()
            return result
        
        result['title'] = link.inner_text().strip()[:40]
        href = link.get_attribute('href')
        
        # 상세 페이지
        try:
            with page.expect_navigation(timeout=10000):
                link.click()
            page.wait_for_timeout(2000)
        except:
            if href:
                page.goto(urljoin(base_url, href), timeout=15000)
                page.wait_for_timeout(2000)
        
        # 본문
        for sel in content_sels:
            elem = page.locator(sel)
            if elem.count() > 0:
                text = elem.first.inner_text()[:100].replace('\n', ' ')
                if text:
                    result['content'] = text[:50] + '...'
                    break
        
        # 이미지 - 향상된 추출 사용
        from utils.image_extractor import extract_thumbnail
        img = extract_thumbnail(page, base_url, content_sels)
        if img:
            result['image'] = img[:60] + '...' if len(img) > 60 else img
        
        result['status'] = '✅'
        page.close()
        
    except Exception as e:
        result['status'] = f'❌ {str(e)[:20]}'
    
    return result


def main():
    print("=" * 100)
    print("🔍 12개 성공 스크래퍼 검증")
    print("=" * 100)
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent='Mozilla/5.0')
        
        for s in SCRAPERS:
            print(f"\n📍 {s['name']}...")
            try:
                module = __import__(s['file'])
                r = extract_one(module, context)
                r['name'] = s['name']
                results.append(r)
                
                print(f"   상태: {r['status']}")
                print(f"   제목: {r['title']}")
                print(f"   본문: {r['content']}")
                print(f"   이미지: {r['image'] or '없음'}")
            except Exception as e:
                print(f"   ❌ 오류: {e}")
                results.append({'name': s['name'], 'status': '❌', 'image': ''})
        
        browser.close()
    
    # 요약
    print("\n" + "=" * 100)
    print("📊 최종 요약")
    print("=" * 100)
    
    print(f"\n{'지역':<12} | {'상태':^6} | {'제목':<35} | {'이미지':^10}")
    print("-" * 100)
    
    img_count = 0
    for r in results:
        has_img = '✅' if r.get('image') else '❌'
        if r.get('image'):
            img_count += 1
        title = r.get('title', '')[:30] + '...' if len(r.get('title', '')) > 30 else r.get('title', '')
        print(f"{r['name']:<12} | {r['status']:^6} | {title:<35} | {has_img:^10}")
    
    print("-" * 100)
    print(f"\n✅ 총 {len([r for r in results if r['status'] == '✅'])}/12개 성공")
    print(f"🖼️ 이미지 추출: {img_count}/12개")


if __name__ == "__main__":
    main()

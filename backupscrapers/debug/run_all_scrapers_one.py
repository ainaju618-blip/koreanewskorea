"""
실제 스크래퍼 파일을 사용하여 각 시군에서 1개 기사씩 추출
API 서버 없이 로컬에서 결과만 출력
"""
import sys
import os
from urllib.parse import urljoin

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright

# 실제 스크래퍼 파일에서 가져온 설정
SCRAPERS = [
    {'code': 'gwangju', 'name': '광주시', 'file': 'gwangju_scraper'},
    {'code': 'gwangju_edu', 'name': '광주교육청', 'file': 'gwangju_edu_scraper'},
    {'code': 'jeonnam', 'name': '전남도', 'file': 'jeonnam_scraper'},
    {'code': 'jeonnam_edu', 'name': '전남교육청', 'file': 'jeonnam_edu_scraper'},
    {'code': 'mokpo', 'name': '목포시', 'file': 'mokpo_scraper'},
    {'code': 'yeosu', 'name': '여수시', 'file': 'yeosu_scraper'},
    {'code': 'suncheon', 'name': '순천시', 'file': 'suncheon_scraper'},
    {'code': 'naju', 'name': '나주시', 'file': 'naju_scraper'},
    {'code': 'gwangyang', 'name': '광양시', 'file': 'gwangyang_scraper'},
    {'code': 'damyang', 'name': '담양군', 'file': 'damyang_scraper'},
    {'code': 'gokseong', 'name': '곡성군', 'file': 'gokseong_scraper'},
    {'code': 'gurye', 'name': '구례군', 'file': 'gurye_scraper'},
    {'code': 'goheung', 'name': '고흥군', 'file': 'goheung_scraper'},
    {'code': 'boseong', 'name': '보성군', 'file': 'boseong_scraper'},
    {'code': 'hwasun', 'name': '화순군', 'file': 'hwasun_scraper'},
    {'code': 'jangheung', 'name': '장흥군', 'file': 'jangheung_scraper'},
    {'code': 'gangjin', 'name': '강진군', 'file': 'gangjin_scraper'},
    {'code': 'haenam', 'name': '해남군', 'file': 'haenam_scraper'},
    {'code': 'yeongam', 'name': '영암군', 'file': 'yeongam_scraper'},
    {'code': 'muan', 'name': '무안군', 'file': 'muan_scraper'},
    {'code': 'hampyeong', 'name': '함평군', 'file': 'hampyeong_scraper'},
    {'code': 'yeonggwang', 'name': '영광군', 'file': 'yeonggwang_scraper'},
    {'code': 'jangseong', 'name': '장성군', 'file': 'jangseong_scraper'},
    {'code': 'wando', 'name': '완도군', 'file': 'wando_scraper'},
    {'code': 'jindo', 'name': '진도군', 'file': 'jindo_scraper'},
    {'code': 'shinan', 'name': '신안군', 'file': 'shinan_scraper'},
]

def extract_one_article(scraper_module, context):
    """스크래퍼 모듈에서 1개 기사 추출"""
    result = {
        'title': '',
        'content': '',
        'image': '',
        'link': '',
        'status': '❌'
    }
    
    try:
        # 모듈에서 설정 가져오기
        list_url = getattr(scraper_module, 'LIST_URL', '')
        base_url = getattr(scraper_module, 'BASE_URL', '')
        list_selectors = getattr(scraper_module, 'LIST_SELECTORS', [])
        content_selectors = getattr(scraper_module, 'CONTENT_SELECTORS', [])
        
        if not list_url:
            result['status'] = '❌ URL없음'
            return result
        
        page = context.new_page()
        page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(2000)
        
        # 리스트에서 첫 번째 기사 찾기
        link_elem = None
        for sel in list_selectors:
            items = page.locator(sel)
            if items.count() > 0:
                link_elem = items.first
                break
        
        if not link_elem:
            result['status'] = '❌ 리스트실패'
            page.close()
            return result
        
        result['title'] = link_elem.inner_text().strip()[:40]
        href = link_elem.get_attribute('href')
        result['link'] = urljoin(base_url, href) if href else ''
        
        # 상세 페이지로 이동
        try:
            with page.expect_navigation(timeout=10000):
                link_elem.click()
            page.wait_for_timeout(2000)
        except:
            if result['link']:
                page.goto(result['link'], timeout=15000)
                page.wait_for_timeout(2000)
        
        # 본문 추출
        for sel in content_selectors:
            elem = page.locator(sel)
            if elem.count() > 0:
                text = elem.first.inner_text()[:100].replace('\n', ' ')
                if text:
                    result['content'] = text[:50] + '...'
                    break
        
        # 이미지 추출
        for sel in content_selectors:
            imgs = page.locator(f'{sel} img')
            if imgs.count() > 0:
                src = imgs.first.get_attribute('src')
                if src and 'icon' not in src.lower() and 'logo' not in src.lower():
                    result['image'] = urljoin(base_url, src)[:60] + '...'
                    break
        
        result['status'] = '✅'
        page.close()
        return result
        
    except Exception as e:
        result['status'] = f'❌ {str(e)[:15]}'
        return result


def main():
    print("=" * 100)
    print("🔍 실제 스크래퍼로 각 시군 1개 기사 추출")
    print("=" * 100)
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        for scraper_info in SCRAPERS:
            print(f"\n📍 {scraper_info['name']} ({scraper_info['code']})...")
            
            try:
                # 스크래퍼 모듈 import
                module = __import__(scraper_info['file'])
                result = extract_one_article(module, context)
                result['name'] = scraper_info['name']
                results.append(result)
                
                if result['status'] == '✅':
                    print(f"   ✅ 제목: {result['title']}")
                    print(f"   📝 본문: {result['content']}")
                    print(f"   🖼️ 이미지: {result['image'] or '없음'}")
                else:
                    print(f"   {result['status']}")
                    
            except Exception as e:
                print(f"   ❌ 모듈 오류: {e}")
                results.append({'name': scraper_info['name'], 'status': f'❌ 모듈오류'})
        
        browser.close()
    
    # 최종 요약
    print("\n" + "=" * 100)
    print("📊 최종 요약")
    print("=" * 100)
    
    success = [r for r in results if r['status'] == '✅']
    failed = [r for r in results if r['status'] != '✅']
    
    print(f"\n✅ 성공: {len(success)}개")
    for r in success:
        print(f"   - {r['name']}: {r['title'][:25]}...")
    
    print(f"\n❌ 실패: {len(failed)}개")
    for r in failed:
        print(f"   - {r['name']}: {r['status']}")


if __name__ == "__main__":
    main()

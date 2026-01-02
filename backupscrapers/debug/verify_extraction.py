"""
스크래퍼 추출 검증 스크립트
실제로 제목, 내용, 이미지, 링크가 추출되는지 확인
"""
from playwright.sync_api import sync_playwright
import re

SCRAPERS_TO_CHECK = {
    'suncheon': {
        'list_url': 'http://www.suncheon.go.kr/kr/news/0006/0001/',
        'list_sel': 'tbody tr td a[href*="?mode=view&seq="]',
        'content_sel': ['div#content', 'div.contents'],
        'image_sel': 'img'
    },
    'yeosu': {
        'list_url': 'https://www.yeosu.go.kr/www/govt/news/release/press',
        'list_sel': 'a.basic_cont',
        'content_sel': ['div.view_cont', 'div.board_view', 'article'],
        'image_sel': 'img'
    },
    'wando': {
        'list_url': 'https://www.wando.go.kr/www/administration/news/report',
        'list_sel': 'td.subject a, td.title a, a[href*="idx="]',
        'content_sel': ['div.view_cont', 'div.board_view'],
        'image_sel': 'img'
    },
    'hampyeong': {
        'list_url': 'https://www.hampyeong.go.kr/board/list.do?boardId=BOARD_0000004&menuCd=DOM_000000103002001000',
        'list_sel': 'td.subject a, td.title a, a[href*="view"]',
        'content_sel': ['div.view_cont', 'div.board_view'],
        'image_sel': 'img'
    },
    'yeonggwang': {
        'list_url': 'https://www.yeonggwang.go.kr/home/sub.do?menukey=6196',
        'list_sel': 'td.subject a, td.title a, a[href*="mode=view"]',
        'content_sel': ['div.view_cont', 'div.board_view'],
        'image_sel': 'img'
    },
    'naju': {
        'list_url': 'https://www.naju.go.kr/www/open_administration/news/news_main',
        'list_sel': 'td.subject a, a[href*="view"]',
        'content_sel': ['div.view_cont', 'div#content', '.board_view'],
        'image_sel': 'img'
    }
}

def verify_scraper(name, config):
    print(f"\n{'='*60}")
    print(f"🔍 {name.upper()} 스크래퍼 검증")
    print(f"{'='*60}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # 1. 리스트 페이지 접속
            print(f"\n📋 리스트 페이지: {config['list_url']}")
            page.goto(config['list_url'], timeout=30000, wait_until='domcontentloaded')
            page.wait_for_timeout(2000)
            
            # 2. 리스트 아이템 찾기
            selectors = config['list_sel'].split(', ')
            links = None
            used_sel = None
            for sel in selectors:
                items = page.locator(sel)
                if items.count() > 0:
                    links = items
                    used_sel = sel
                    break
            
            if not links or links.count() == 0:
                print(f"❌ 리스트 아이템 없음! 셀렉터: {config['list_sel']}")
                # 페이지 분석
                all_links = page.locator('a[href]').all()
                print(f"   페이지 내 총 링크 수: {len(all_links)}")
                # 몇 개 샘플 출력
                for i, link in enumerate(all_links[:10]):
                    href = link.get_attribute('href') or ''
                    text = link.inner_text()[:30].replace('\n', ' ')
                    print(f"   {i}: {text} -> {href[:50]}")
                browser.close()
                return False
            
            print(f"✅ 리스트 셀렉터 성공: {used_sel} ({links.count()}개)")
            
            # 3. 첫 번째 기사 정보
            first_link = links.first
            title = first_link.inner_text().strip()[:50]
            href = first_link.get_attribute('href')
            print(f"   📰 첫 기사 제목: {title}")
            print(f"   🔗 첫 기사 링크: {href}")
            
            # 4. 상세 페이지 이동
            print(f"\n📄 상세 페이지 접속 중...")
            with page.expect_navigation(timeout=15000):
                first_link.click()
            page.wait_for_timeout(2000)
            
            detail_url = page.url
            print(f"   URL: {detail_url}")
            
            # 5. 콘텐츠 추출
            content_found = False
            content_text = ""
            used_content_sel = ""
            for sel in config['content_sel']:
                elem = page.locator(sel)
                if elem.count() > 0:
                    content_text = elem.first.inner_text()[:200].replace('\n', ' ')
                    content_found = True
                    used_content_sel = sel
                    break
            
            if content_found:
                print(f"✅ 콘텐츠 셀렉터 성공: {used_content_sel}")
                print(f"   📝 내용 미리보기: {content_text}...")
            else:
                print(f"❌ 콘텐츠 추출 실패!")
                # 가능한 컨테이너 출력
                candidates = page.locator("div[class*='view'], div[class*='cont'], article").all()
                print(f"   가능한 컨테이너 ({len(candidates)}개):")
                for c in candidates[:5]:
                    cls = c.get_attribute('class') or c.get_attribute('id') or 'unknown'
                    print(f"   - {cls}")
            
            # 6. 이미지 추출
            images = page.locator(f"{used_content_sel} img" if used_content_sel else "img")
            img_count = images.count()
            if img_count > 0:
                first_img_src = images.first.get_attribute('src')
                print(f"✅ 이미지 발견: {img_count}개")
                print(f"   🖼️ 첫 이미지: {first_img_src[:80] if first_img_src else 'N/A'}...")
            else:
                print(f"⚠️ 이미지 없음 (기사에 이미지가 없을 수 있음)")
            
            browser.close()
            return content_found
            
        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            browser.close()
            return False

if __name__ == "__main__":
    results = {}
    for name, config in SCRAPERS_TO_CHECK.items():
        results[name] = verify_scraper(name, config)
    
    print(f"\n{'='*60}")
    print("📊 최종 결과")
    print(f"{'='*60}")
    for name, success in results.items():
        status = "✅ 성공" if success else "❌ 실패"
        print(f"   {name}: {status}")

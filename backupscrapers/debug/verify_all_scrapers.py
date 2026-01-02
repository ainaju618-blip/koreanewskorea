"""
전체 스크래퍼 검증 스크립트
- 27개 시군 스크래퍼에서 각 1개 기사 추출
- 제목, 본문(50자), 이미지 링크 확인
- 에러 발생해도 계속 진행
"""
import sys
import os
from datetime import datetime
from urllib.parse import urljoin

# 스크래퍼 경로 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright

# 각 스크래퍼의 설정 정보
SCRAPERS = {
    'gwangju': {
        'name': '광주시',
        'url': 'https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&menuId=gwangju0202010000&pageIndex=1',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content', '.board_view_body'],
    },
    'gwangju_edu': {
        'name': '광주교육청',
        'url': 'https://www.gen.go.kr/main/bbs/bbsList.do?pageIndex=1&bbsId=2041013',
        'list_sel': ['a[href*="bbsView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'jeonnam': {
        'name': '전남도',
        'url': 'https://www.jeonnam.go.kr/bbs/list.do?ptIdx=30&mId=0301010000',
        'list_sel': ['a[href*="view.do"]', 'td.subject a'],
        'content_sel': ['div.view_content', 'div.board_view'],
    },
    'jeonnam_edu': {
        'name': '전남교육청',
        'url': 'https://www.jne.go.kr/board/list.jne?boardId=BBS_0000010&menuCd=DOM_000000102002000000',
        'list_sel': ['a[href*="view.jne"]', 'td.subject a'],
        'content_sel': ['div.view_content', 'div.board_view'],
    },
    'mokpo': {
        'name': '목포시',
        'url': 'https://www.mokpo.go.kr/www/open_administration/news/news_main?mode=list',
        'list_sel': ['a[href*="mode=view"]', 'td.subject a'],
        'content_sel': ['div.view_content', 'div.board_view'],
    },
    'yeosu': {
        'name': '여수시',
        'url': 'https://www.yeosu.go.kr/www/govt/news/release/press',
        'list_sel': ['a.basic_cont', 'td.subject a'],
        'content_sel': ['div.viewbox', 'div.contbox', 'div.view_cont'],
    },
    'suncheon': {
        'name': '순천시',
        'url': 'http://www.suncheon.go.kr/kr/news/0006/0001/',
        'list_sel': ['tbody tr td a[href*="?mode=view&seq="]'],
        'content_sel': ['div#content', 'div.contents'],
    },
    'naju': {
        'name': '나주시',
        'url': 'https://www.naju.go.kr/www/administration/reporting/coverage',
        'list_sel': ['a[href*="idx="]', 'a[href*="coverage"]'],
        'content_sel': ['div.major', 'div.view_content'],
    },
    'gwangyang': {
        'name': '광양시',
        'url': 'https://www.gwangyang.go.kr/contentsView.do?pageId=www792',
        'list_sel': ['a[href*="view"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'damyang': {
        'name': '담양군',
        'url': 'https://www.damyang.go.kr/boardView.do?pageId=sub01050101&boardId=BD_00000051',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'gokseong': {
        'name': '곡성군',
        'url': 'https://www.gokseong.go.kr/kr/board/list.do?bbsId=BBS_000000000000151&menuNo=102001002000',
        'list_sel': ['td a[href*="view.do"]'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'gurye': {
        'name': '구례군',
        'url': 'https://www.gurye.go.kr/board/list.do?bbsId=BBS_0000000000000300&menuNo=115004006000',
        'list_sel': ['tbody tr td.title a', 'td.subject a'],
        'content_sel': ['div.view_content', 'div.board_view'],
    },
    'goheung': {
        'name': '고흥군',
        'url': 'https://www.goheung.go.kr/boardList.do?boardId=BD_0000007&menuCd=DOM_000000101011000000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'boseong': {
        'name': '보성군',
        'url': 'https://www.boseong.go.kr/boardList.do?boardId=BD_0000013&menuCd=DOM_000000101002001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'hwasun': {
        'name': '화순군',
        'url': 'https://www.hwasun.go.kr/boardList.do?boardId=BD_0000018&menuCd=DOM_000000101002001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'jangheung': {
        'name': '장흥군',
        'url': 'https://www.jangheung.go.kr/boardList.do?boardId=BD_0000004&menuCd=DOM_000000101002001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'gangjin': {
        'name': '강진군',
        'url': 'https://www.gangjin.go.kr/boardList.do?boardId=BD_0000006&menuCd=DOM_000000101002001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'haenam': {
        'name': '해남군',
        'url': 'https://www.haenam.go.kr/boardList.do?boardId=BD_0000009&menuCd=DOM_000000101002001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'yeongam': {
        'name': '영암군',
        'url': 'https://www.yeongam.go.kr/boardList.do?pageId=sub01050101&boardId=BD_0000005',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'muan': {
        'name': '무안군',
        'url': 'https://www.muan.go.kr/boardList.do?boardId=BD_0000004&menuCd=DOM_000000102001001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'hampyeong': {
        'name': '함평군',
        'url': 'https://www.hampyeong.go.kr/boardList.do?pageId=www275&boardId=NEWS',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'yeonggwang': {
        'name': '영광군',
        'url': 'https://www.yeonggwang.go.kr/bbs/?b_id=news_data&site=headquarter_new&mn=9056',
        'list_sel': ['a[href*="read"]', 'a[href*="view"]'],
        'content_sel': ['div[class*="content"]', 'div.bbs_view'],
    },
    'jangseong': {
        'name': '장성군',
        'url': 'https://www.jangseong.go.kr/boardList.do?boardId=BD_0000009&menuCd=DOM_000000102002001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'wando': {
        'name': '완도군',
        'url': 'https://www.wando.go.kr/wando/sub.cs?m=299',
        'list_sel': ['a[href*="nttId="][title]', 'a[href*="nttId="]'],
        'content_sel': ['div.board_con', 'div.board_view'],
    },
    'jindo': {
        'name': '진도군',
        'url': 'https://www.jindo.go.kr/boardList.do?boardId=BD_0000005&menuCd=DOM_000000101006001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'shinan': {
        'name': '신안군',
        'url': 'https://www.shinan.go.kr/boardList.do?boardId=BD_0000064&menuCd=DOM_000000102001001000',
        'list_sel': ['a[href*="boardView"]', 'td.subject a'],
        'content_sel': ['div.board_view', 'div.view_content'],
    },
    'kwnews': {
        'name': '강원일보',
        'url': 'https://www.kwnews.co.kr/page/news_list/103700000000000016',
        'list_sel': ['a[href*="/page/view/"]', 'a.news_link'],
        'content_sel': ['div.article_content', 'div.news_content'],
    },
}


def verify_scraper(code, config, browser):
    """단일 스크래퍼 검증"""
    result = {
        'code': code,
        'name': config['name'],
        'list': '❌',
        'title': '❌',
        'content': '❌',
        'image': '❌',
        'note': '',
        'title_preview': '',
        'content_preview': '',
        'image_url': ''
    }
    
    page = browser.new_page()
    base_url = '/'.join(config['url'].split('/')[:3])
    
    try:
        # 1. 리스트 페이지 접속
        page.goto(config['url'], timeout=20000, wait_until='domcontentloaded')
        page.wait_for_timeout(2000)
        
        # 2. 리스트 아이템 찾기
        links = None
        for sel in config['list_sel']:
            items = page.locator(sel)
            if items.count() > 0:
                links = items
                break
        
        if not links or links.count() == 0:
            result['note'] = '리스트 셀렉터 실패'
            page.close()
            return result
        
        result['list'] = '✅'
        
        # 3. 첫 번째 기사 클릭
        first_link = links.first
        title = first_link.inner_text().strip()[:30]
        href = first_link.get_attribute('href')
        
        if title:
            result['title'] = '✅'
            result['title_preview'] = title
        
        # 4. 상세 페이지 이동
        try:
            with page.expect_navigation(timeout=15000):
                first_link.click()
            page.wait_for_timeout(2000)
        except:
            # 클릭 방식이 안되면 직접 이동
            if href:
                full_url = urljoin(base_url, href)
                page.goto(full_url, timeout=15000)
                page.wait_for_timeout(2000)
        
        # 5. 콘텐츠 추출
        for sel in config['content_sel']:
            elem = page.locator(sel)
            if elem.count() > 0:
                text = elem.first.inner_text()[:50].replace('\n', ' ')
                if text:
                    result['content'] = '✅'
                    result['content_preview'] = text
                break
        
        # 6. 이미지 추출
        for sel in config['content_sel']:
            imgs = page.locator(f'{sel} img')
            if imgs.count() > 0:
                src = imgs.first.get_attribute('src')
                if src and 'icon' not in src.lower() and 'logo' not in src.lower():
                    result['image'] = '✅'
                    result['image_url'] = src[:50] + '...' if len(src) > 50 else src
                    break
        
        if result['image'] == '❌':
            # 전체 페이지에서 이미지 찾기
            imgs = page.locator('img[src*="upload"], img[src*="attach"], img[src*="content"]')
            if imgs.count() > 0:
                src = imgs.first.get_attribute('src')
                if src:
                    result['image'] = '⚠️'
                    result['image_url'] = src[:50] + '...' if len(str(src)) > 50 else str(src)
        
    except Exception as e:
        result['note'] = str(e)[:30]
    
    page.close()
    return result


def main():
    print("=" * 80)
    print("🔍 전체 스크래퍼 검증 시작")
    print(f"   검증 대상: {len(SCRAPERS)}개 스크래퍼")
    print("=" * 80)
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        for code, config in SCRAPERS.items():
            print(f"\n📍 {config['name']} ({code}) 검증 중...")
            result = verify_scraper(code, config, context)
            results.append(result)
            
            status = f"{result['list']}{result['title']}{result['content']}{result['image']}"
            print(f"   결과: {status}")
            if result['title_preview']:
                print(f"   제목: {result['title_preview']}")
        
        browser.close()
    
    # 결과 출력
    print("\n" + "=" * 80)
    print("📊 최종 검증 결과")
    print("=" * 80)
    print(f"{'지역':<12} | {'리스트':^6} | {'제목':^6} | {'본문':^6} | {'이미지':^6} | 비고")
    print("-" * 80)
    
    success_count = 0
    for r in results:
        note = r['note'][:20] if r['note'] else '-'
        print(f"{r['name']:<12} | {r['list']:^6} | {r['title']:^6} | {r['content']:^6} | {r['image']:^6} | {note}")
        if r['list'] == '✅' and r['title'] == '✅' and r['content'] == '✅':
            success_count += 1
    
    print("-" * 80)
    print(f"✅ 성공: {success_count}/{len(results)}개")
    print(f"❌ 실패/부분: {len(results) - success_count}개")


if __name__ == "__main__":
    main()

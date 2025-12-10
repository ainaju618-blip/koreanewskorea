"""
전남도청 상세페이지 DOM 구조 분석 스크립트
"""
from playwright.sync_api import sync_playwright
import time

# 실제 목록에서 가져온 URL 패턴 사용
TEST_URL = "https://www.jeonnam.go.kr/M7116/boardView.do?menuId=jeonnam0202000000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    page = context.new_page()
    
    # 먼저 목록 페이지에서 실제 상세 URL 가져오기
    list_url = "https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000"
    print(f"🔍 목록 페이지: {list_url}")
    page.goto(list_url, wait_until='networkidle', timeout=30000)
    
    # 첫 번째 기사 링크 가져오기
    first_link = page.locator('td.title a').first
    if first_link.count() > 0:
        href = first_link.get_attribute('href')
        detail_url = f"https://www.jeonnam.go.kr{href}" if href.startswith('/') else href
        print(f"📰 상세 페이지: {detail_url}")
        
        # 상세 페이지로 이동
        page.goto(detail_url, wait_until='networkidle', timeout=30000)
        time.sleep(2)  # 추가 대기
        
        # HTML 저장
        html = page.content()
        with open('debug_jeonnam_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"💾 HTML 저장됨: debug_jeonnam_page.html ({len(html)} bytes)")
        
        # 핵심 정보 추출 시도
        print("\n📋 셀렉터 테스트:")
        for sel in ['div.bbs_view', 'div.view_con', 'div.contents', 'div.cont_area', 
                    '#contents', '.view_content', 'table.view', 'div.board_view_wrap']:
            elem = page.locator(sel)
            if elem.count() > 0:
                text = elem.first.inner_text()[:150].replace('\n', ' ')
                print(f"  ✅ '{sel}': {text}...")
        
        # 텍스트 노드 분석
        print("\n📝 페이지 텍스트 (처음 1000자):")
        body_text = page.locator('body').inner_text()[:1000]
        print(body_text)
    else:
        print("❌ 기사 링크를 찾을 수 없습니다.")
    
    browser.close()

print("\n✅ 분석 완료")

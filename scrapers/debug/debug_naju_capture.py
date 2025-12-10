"""
나주시청 이미지 캡처 테스트 (본문 이미지 영역 스크린샷)
- 브라우저가 렌더링한 이미지를 직접 캡처
- 서버의 다운로드 차단을 완전히 우회
"""

import os
import time
import re
from playwright.sync_api import sync_playwright

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_capture')

def test_capture():
    print("🚀 Playwright 본문 이미지 캡처 테스트 (1개 기사)")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 헤드풀 모드
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        # 목록 페이지
        print("🌐 목록 페이지 접속...")
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')
        
        # 첫 번째 기사
        link = page.locator('tbody tr a[href*="coverage?idx="]').first
        href = link.get_attribute('href')
        title = link.inner_text().strip()
        idx = re.search(r'idx=(\d+)', href).group(1)
        detail_url = f"{BASE_URL}{href}"
        
        print(f"   기사: {title[:40]}...")
        
        # 상세 페이지
        print("➡️ 상세 페이지 이동...")
        page.goto(detail_url)
        page.wait_for_load_state('networkidle')
        
        # 본문 영역에서 이미지 찾기 (여러 선택자 시도)
        print("\n📥 본문 이미지 검색...")
        selectors = [
            'div.view_cont img',
            'div.bbs_view_cont img',
            'div.board_content img',
            'article img',
            '#content img',
            'table img',
            'div img',
        ]
        
        captured = False
        for sel in selectors:
            imgs = page.locator(sel)
            count = imgs.count()
            
            if count > 0:
                print(f"   ✅ '{sel}' 선택자로 {count}개 이미지 발견")
                
                for i in range(min(count, 3)):  # 최대 3개
                    try:
                        img = imgs.nth(i)
                        src = img.get_attribute('src') or ''
                        
                        # 나주시 관련 이미지만 (로고/아이콘 제외)
                        if 'naju' not in src.lower() and 'og_img' not in src.lower():
                            continue
                        
                        # 이미지가 화면에 보이도록 스크롤
                        img.scroll_into_view_if_needed()
                        time.sleep(1)  # 이미지 로딩 대기
                        
                        # 이미지 크기 확인
                        box = img.bounding_box()
                        if box and box['width'] > 100 and box['height'] > 100:
                            filepath = os.path.join(SAVE_DIR, f"{idx}_{i}.png")
                            img.screenshot(path=filepath)
                            
                            filesize = os.path.getsize(filepath)
                            print(f"      📸 캡처 성공: {filepath} ({filesize} bytes)")
                            captured = True
                        else:
                            print(f"      ⚠️ 이미지 크기가 너무 작음: {box}")
                            
                    except Exception as e:
                        print(f"      ⚠️ 캡처 오류: {e}")
                
                if captured:
                    break
        
        if not captured:
            # 대안: 본문 영역 전체 캡처
            print("\n📥 대안: 본문 영역 전체 캡처...")
            try:
                # 본문 컨테이너 찾기
                content_selectors = [
                    'div.view_cont',
                    'div.bbs_view_cont', 
                    'div.board_content',
                    'article',
                    '#content'
                ]
                
                for sel in content_selectors:
                    container = page.locator(sel)
                    if container.count() > 0:
                        filepath = os.path.join(SAVE_DIR, f"{idx}_full.png")
                        container.first.screenshot(path=filepath)
                        print(f"   📷 본문 캡처: {filepath}")
                        captured = True
                        break
            except Exception as e:
                print(f"   ⚠️ 본문 캡처 오류: {e}")
        
        if not captured:
            # 최후의 방법: 페이지 전체 스크린샷
            print("\n📥 최후의 방법: 페이지 전체 스크린샷...")
            filepath = os.path.join(SAVE_DIR, f"{idx}_page.png")
            page.screenshot(path=filepath, full_page=True)
            print(f"   📷 페이지 캡처: {filepath}")
        
        browser.close()
    
    print("\n🏁 테스트 완료")
    print(f"   저장 폴더: {SAVE_DIR}")

if __name__ == '__main__':
    test_capture()

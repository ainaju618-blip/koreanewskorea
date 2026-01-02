from playwright.sync_api import sync_playwright
import time
import os
import base64
import re
import random
from datetime import datetime

# 설정
BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_sample')

def decode_php_serialize(data: str) -> str:
    """PHP serialize 형식에서 문자열 추출"""
    pattern = r's:\d+:"(.*?)";?\}'
    match = re.search(pattern, data, re.DOTALL)
    if match:
        return match.group(1)
    return data

def extract_content_from_meta(page) -> str:
    """og:description 메타 태그에서 Base64 인코딩된 본문 추출"""
    try:
        # meta 태그의 content 속성 가져오기
        content_encoded = page.locator('meta[property="og:description"]').get_attribute('content')
        if not content_encoded:
            return ""
            
        decoded_bytes = base64.b64decode(content_encoded)
        decoded_str = decoded_bytes.decode('utf-8')
        
        if decoded_str.startswith('a:'):
            content = decode_php_serialize(decoded_str)
        else:
            content = decoded_str
        
        # HTML 태그 제거 및 정제
        content = re.sub(r'<[^>]+>', ' ', content)
        content = re.sub(r'\s+', ' ', content).strip()
        
        return content[:5000]
    except Exception as e:
        print(f"본문 추출 중 오류: {e}")
        return ""

def run():
    print("🚀 Playwright 나주 스크래퍼 샘플 시작 (1건만 수집)")
    
    # 이미지 저장 폴더 생성
    os.makedirs(SAVE_DIR, exist_ok=True)

    with sync_playwright() as p:
        # 브라우저 실행 (headless=False로 설정하여 헤드풀 실행)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 720},
            extra_http_headers={
                'Referer': f'{BASE_URL}/www/administration/reporting/coverage'
            }
        )
        page = context.new_page()

        # 1. 목록 페이지 접속
        print(f"🌐 목록 페이지 접속: {LIST_URL}")
        page.goto(LIST_URL)
        page.wait_for_load_state('networkidle')

        # 2. 첫 번째 게시글 찾기
        first_row = page.locator('tbody tr').first
        link = first_row.locator('a[href*="coverage?idx="]')
        
        if not link.count():
            print("❌ 게시글을 찾을 수 없습니다.")
            return

        title = link.inner_text().strip()
        href = link.get_attribute('href')
        detail_url = f"{BASE_URL}{href}"
        
        # idx 추출
        idx_match = re.search(r'idx=(\d+)', href)
        idx = idx_match.group(1) if idx_match else f"unknown_{int(time.time())}"

        print(f"   검색된 기사: {title}")
        print(f"   상세 URL: {detail_url}")

        # 3. 상세 페이지 이동
        print("➡️ 상세 페이지 이동 중...")
        # 페이지 이동 전 클릭으로 이동하는 흉내를 낼 수도 있지만, 여기선 goto로 이동
        page.goto(detail_url)
        page.wait_for_load_state('domcontentloaded') # 메타 태그만 읽으면 되므로 networkidle까지 안 기다려도 됨

        # 4. 본문 추출
        content = extract_content_from_meta(page)
        print(f"   📝 본문 추출 완료 ({len(content)}자)")
        print(f"      내용 미리보기: {content[:100]}...")

        # 5. 이미지 추출 및 다운로드
        og_image = page.locator('meta[property="og:image"]').get_attribute('content')
        
        local_image_path = None
        if og_image:
            print(f"   🖼️ 이미지 발견: {og_image}")
            
            try:
                # 이미지 다운로드 (페이지 이동 방식)
                # 직접 이미지 URL로 이동하여 브라우저가 로드하게 함
                print(f"      📸 이미지 페이지로 이동: {og_image}")
                
                # 이미지 URL로 이동 시도
                response = page.goto(og_image)
                
                if not response.ok:
                     print(f"      ⚠️ 이미지 페이지 로드 실패: {response.status} {response.status_text}")
                else:
                    image_data = response.body()
                    
                    # 파일 저장
                    filename = f"{idx}.jpg"
                    filepath = os.path.join(SAVE_DIR, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(image_data)
                    
                    local_image_path = filepath
                    print(f"      ✅ 이미지 다운로드 성공: {filepath}")
            
            except Exception as e:
                print(f"      ❌ 이미지 다운로드 실패: {e}")
                
            # 다시 이전 페이지(상세 페이지)로 돌아갈 필요가 있다면 go_back() 사용
            # 하지만 여기서는 1개만 수집하고 종료하므로 생략 가능
            # 루프를 돌 경우 page.go_back() 또는 다시 목록으로 이동해야 함
        else:
            print("   ⚠️ 이미지가 없는 기사입니다.")

        # 결과 요약
        print("\n🎉 샘플 수집 완료")
        print(f"- 제목: {title}")
        print(f"- 본문 길이: {len(content)}")
        print(f"- 이미지: {local_image_path if local_image_path else '없음'}")

        browser.close()

if __name__ == "__main__":
    run()

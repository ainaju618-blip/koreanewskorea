"""
나주시청 이미지 다운로드 진단 스크립트
- requests 헤더 최적화로 403 우회 가능 여부 테스트
"""

import os
import requests
from bs4 import BeautifulSoup

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'

def test_image_download():
    """브라우저와 유사한 헤더로 이미지 다운로드 시도"""
    
    # 브라우저와 동일한 헤더 구성
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    }
    
    session = requests.Session()
    session.headers.update(headers)
    
    print("🔍 Phase 1: 나주시청 이미지 다운로드 테스트")
    print("=" * 50)
    
    # 1단계: 목록 페이지 접속 (쿠키 획득)
    print("\n📋 1단계: 목록 페이지 접속...")
    try:
        resp = session.get(LIST_URL, timeout=10)
        print(f"   상태 코드: {resp.status_code}")
        print(f"   쿠키: {dict(session.cookies)}")
    except Exception as e:
        print(f"   ❌ 목록 페이지 접속 실패: {e}")
        return False
    
    # 2단계: 첫 번째 기사 상세 페이지 접속
    print("\n📰 2단계: 첫 번째 기사 상세 페이지 접속...")
    soup = BeautifulSoup(resp.text, 'html.parser')
    first_link = soup.select_one('tbody tr a[href*="coverage?idx="]')
    
    if not first_link:
        print("   ❌ 기사 링크를 찾을 수 없습니다.")
        return False
    
    href = first_link.get('href', '')
    detail_url = f"{BASE_URL}{href.replace('&amp;', '&')}"
    print(f"   상세 URL: {detail_url}")
    
    # Referer 설정 후 상세 페이지 요청
    session.headers.update({
        'Referer': LIST_URL,
        'Sec-Fetch-Site': 'same-origin',
    })
    
    try:
        detail_resp = session.get(detail_url, timeout=10)
        print(f"   상태 코드: {detail_resp.status_code}")
    except Exception as e:
        print(f"   ❌ 상세 페이지 접속 실패: {e}")
        return False
    
    # 3단계: og:image 추출
    print("\n🖼️ 3단계: og:image 메타 태그 추출...")
    detail_soup = BeautifulSoup(detail_resp.text, 'html.parser')
    og_image = detail_soup.find('meta', property='og:image')
    
    if not og_image or not og_image.get('content'):
        print("   ⚠️ og:image 태그가 없습니다. (이미지 없는 기사)")
        return True  # 이미지가 없는 것은 성공으로 간주
    
    image_url = og_image['content']
    print(f"   이미지 URL: {image_url}")
    
    # 4단계: 이미지 다운로드 시도
    print("\n📥 4단계: 이미지 다운로드 시도...")
    
    # 이미지 요청용 헤더
    session.headers.update({
        'Referer': detail_url,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
    })
    
    try:
        img_resp = session.get(image_url, timeout=10)
        print(f"   상태 코드: {img_resp.status_code}")
        print(f"   Content-Type: {img_resp.headers.get('Content-Type', 'N/A')}")
        print(f"   Content-Length: {len(img_resp.content)} bytes")
        
        if img_resp.status_code == 200 and len(img_resp.content) > 1000:
            # 테스트 이미지 저장
            save_dir = os.path.join(os.path.dirname(__file__), 'images', 'naju_test')
            os.makedirs(save_dir, exist_ok=True)
            filepath = os.path.join(save_dir, 'test_image.jpg')
            
            with open(filepath, 'wb') as f:
                f.write(img_resp.content)
            
            print(f"\n✅ 성공! 이미지 저장됨: {filepath}")
            print(f"   파일 크기: {os.path.getsize(filepath)} bytes")
            return True
        else:
            print(f"\n❌ 실패: 상태 코드 {img_resp.status_code} 또는 빈 응답")
            return False
            
    except Exception as e:
        print(f"   ❌ 이미지 다운로드 실패: {e}")
        return False


if __name__ == '__main__':
    success = test_image_download()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 결론: requests 방식으로 이미지 다운로드 가능!")
        print("   → naju_scraper.py에 헤더 설정 반영 권장")
    else:
        print("⚠️ 결론: requests 방식 실패, Playwright 마이그레이션 필요")

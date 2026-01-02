"""
나주시청 이미지 다운로드 테스트 (HTTP 직접 요청)
- og:image URL이 http:// 프로토콜임을 확인
- Mixed Content 문제 우회를 위해 requests로 직접 다운로드
"""

import os
import requests
from bs4 import BeautifulSoup

BASE_URL = 'https://www.naju.go.kr'
LIST_URL = f'{BASE_URL}/www/administration/reporting/coverage'
SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'naju_http')

def test_http_direct():
    print("🚀 HTTP 직접 요청 테스트 (1개 기사)")
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    
    # 1. 목록 페이지 (쿠키 획득)
    print("🌐 목록 페이지 접속...")
    resp = session.get(LIST_URL, headers=headers, timeout=10)
    print(f"   상태: {resp.status_code}")
    print(f"   쿠키: {dict(session.cookies)}")
    
    # 첫 번째 기사 링크 찾기
    soup = BeautifulSoup(resp.text, 'html.parser')
    link = soup.select_one('tbody tr a[href*="coverage?idx="]')
    href = BASE_URL + link['href'].replace('&amp;', '&')
    
    print(f"   상세 URL: {href}")
    
    # 2. 상세 페이지 접속
    print("\n➡️ 상세 페이지 접속...")
    headers['Referer'] = LIST_URL
    resp = session.get(href, headers=headers, timeout=10)
    print(f"   상태: {resp.status_code}")
    
    # og:image 추출
    soup = BeautifulSoup(resp.text, 'html.parser')
    og_image = soup.find('meta', property='og:image')
    og_image_url = og_image['content'] if og_image else None
    
    print(f"   og:image: {og_image_url}")
    
    if not og_image_url:
        print("   ❌ og:image 없음")
        return
    
    # 3. 이미지 다운로드 시도
    print("\n📥 이미지 다운로드 시도...")
    
    # 원본 URL (http://)
    print(f"\n   방법 1: 원본 HTTP URL")
    headers['Referer'] = href
    headers['Accept'] = 'image/avif,image/webp,image/*,*/*;q=0.8'
    
    try:
        img_resp = session.get(og_image_url, headers=headers, timeout=10)
        print(f"   상태: {img_resp.status_code}")
        print(f"   Content-Type: {img_resp.headers.get('Content-Type', 'N/A')}")
        print(f"   크기: {len(img_resp.content)} bytes")
        
        if img_resp.status_code == 200 and len(img_resp.content) > 1000:
            filepath = os.path.join(SAVE_DIR, 'test_http.jpg')
            with open(filepath, 'wb') as f:
                f.write(img_resp.content)
            print(f"   ✅ 성공! 저장: {filepath}")
        else:
            print(f"   ❌ 실패")
    except Exception as e:
        print(f"   ❌ 오류: {e}")
    
    # HTTPS로 변환
    https_url = og_image_url.replace('http://', 'https://')
    print(f"\n   방법 2: HTTPS 변환 URL")
    print(f"   URL: {https_url}")
    
    try:
        img_resp = session.get(https_url, headers=headers, timeout=10)
        print(f"   상태: {img_resp.status_code}")
        print(f"   크기: {len(img_resp.content)} bytes")
        
        if img_resp.status_code == 200 and len(img_resp.content) > 1000:
            filepath = os.path.join(SAVE_DIR, 'test_https.jpg')
            with open(filepath, 'wb') as f:
                f.write(img_resp.content)
            print(f"   ✅ 성공! 저장: {filepath}")
        else:
            print(f"   ❌ 실패")
    except Exception as e:
        print(f"   ❌ 오류: {e}")
    
    print("\n🏁 테스트 완료")

if __name__ == '__main__':
    test_http_direct()

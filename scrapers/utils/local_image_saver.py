"""
로컬 이미지 저장 유틸리티
- 버전: v1.0
- 최종수정: 2025-12-12
- 담당: AI Agent

이미지를 web/public/images/{region}/ 폴더에 저장하고
웹에서 /images/{region}/{filename} 경로로 접근 가능하게 합니다.
"""

import os
import sys
import hashlib
import requests
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

# 프로젝트 루트 경로 설정
SCRAPERS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(SCRAPERS_DIR)
WEB_PUBLIC_DIR = os.path.join(PROJECT_ROOT, 'web', 'public', 'images')


def ensure_directory(region_code: str) -> str:
    """
    지역별 이미지 저장 폴더 생성
    
    Args:
        region_code: 지역 코드 (예: yeosu, naju)
    
    Returns:
        생성된 폴더 경로
    """
    folder_path = os.path.join(WEB_PUBLIC_DIR, region_code)
    os.makedirs(folder_path, exist_ok=True)
    return folder_path


def generate_filename(region_code: str, image_url: str) -> str:
    """
    파일명 생성: {region}_{YYYYMMDD}_{6자리해시}.jpg
    
    Args:
        region_code: 지역 코드
        image_url: 원본 이미지 URL
    
    Returns:
        생성된 파일명
    """
    date_str = datetime.now().strftime('%Y%m%d')
    url_hash = hashlib.md5(image_url.encode()).hexdigest()[:6]
    
    # 확장자 추출 (기본값: jpg)
    parsed = urlparse(image_url)
    ext = os.path.splitext(parsed.path)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        ext = '.jpg'
    
    return f"{region_code}_{date_str}_{url_hash}{ext}"


def download_and_save_locally(
    image_url: str,
    referer_url: str,
    region_code: str,
    timeout: int = 15
) -> Optional[str]:
    """
    이미지를 다운로드하여 로컬에 저장
    
    Args:
        image_url: 다운로드할 이미지 URL
        referer_url: Referer 헤더용 URL (핫링크 방지 우회)
        region_code: 지역 코드 (저장 폴더명)
        timeout: 요청 타임아웃 (초)
    
    Returns:
        저장된 로컬 경로 (웹 접근용) 또는 None
        예: "/images/yeosu/yeosu_20251212_a3b4c5.jpg"
    """
    if not image_url:
        return None
    
    try:
        # 헤더 설정 (핫링크 방지 우회)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': referer_url,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
        
        # 이미지 다운로드
        response = requests.get(image_url, headers=headers, timeout=timeout, stream=True)
        response.raise_for_status()
        
        # Content-Type 확인
        content_type = response.headers.get('Content-Type', '')
        if 'image' not in content_type and len(response.content) < 1000:
            print(f"[로컬저장] 경고: 이미지가 아닌 것 같음 - {content_type}")
            return None
        
        # 폴더 생성
        folder_path = ensure_directory(region_code)
        
        # 파일명 생성 및 저장
        filename = generate_filename(region_code, image_url)
        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # 웹 접근 경로 반환
        web_path = f"/images/{region_code}/{filename}"
        print(f"[로컬저장] 성공: {web_path}")
        return web_path
        
    except requests.exceptions.RequestException as e:
        print(f"[로컬저장] 다운로드 실패: {e}")
        return None
    except IOError as e:
        print(f"[로컬저장] 파일 저장 실패: {e}")
        return None


def delete_local_image(web_path: str) -> bool:
    """
    로컬 이미지 삭제 (기사 삭제 시 호출)
    
    Args:
        web_path: 웹 경로 (예: "/images/yeosu/yeosu_20251212_a3b4c5.jpg")
    
    Returns:
        삭제 성공 여부
    """
    if not web_path or not web_path.startswith('/images/'):
        return False
    
    try:
        # /images/region/filename -> web/public/images/region/filename
        relative_path = web_path.lstrip('/')
        file_path = os.path.join(PROJECT_ROOT, 'web', 'public', relative_path)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"[로컬삭제] 성공: {web_path}")
            return True
        else:
            print(f"[로컬삭제] 파일 없음: {file_path}")
            return False
            
    except IOError as e:
        print(f"[로컬삭제] 실패: {e}")
        return False


# 테스트용
if __name__ == '__main__':
    # 테스트 이미지 다운로드
    test_url = "https://via.placeholder.com/300x200.jpg"
    result = download_and_save_locally(
        image_url=test_url,
        referer_url="https://example.com",
        region_code="test"
    )
    print(f"테스트 결과: {result}")

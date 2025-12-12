"""
{지역명} 이미지 추출기 템플릿

- 버전: v1.0
- 최종수정: YYYY-MM-DD
- 담당: AI Agent

사용법:
1. 이 파일을 해당 지역 폴더에 복사
2. 파일명을 image_extractor.py로 변경
3. 셀렉터를 해당 사이트에 맞게 수정
"""

from typing import Optional
from urllib.parse import urljoin


def extract_image(page, base_url: str) -> Optional[str]:
    """
    상세 페이지에서 대표 이미지 URL을 추출합니다.
    
    Args:
        page: Playwright Page 객체
        base_url: 기본 URL (상대 경로를 절대 경로로 변환용)
    
    Returns:
        이미지 URL (절대 경로) 또는 None
    
    구현 가이드:
        1. 사이트 구조를 분석하여 이미지 셀렉터 확인
        2. 우선순위대로 시도 (본문 이미지 → 썸네일 → 첨부파일)
        3. 상대 경로면 절대 경로로 변환
    """
    
    # ============================================================
    # TODO: 아래 셀렉터를 해당 사이트에 맞게 수정하세요
    # ============================================================
    
    # 1순위: 본문 내 이미지
    CONTENT_SELECTORS = [
        '.board-view img',           # 예시 - 실제 셀렉터로 교체
        '.view-content img',
        '.article-content img',
    ]
    
    # 2순위: 썸네일 이미지
    THUMBNAIL_SELECTORS = [
        '.thumbnail img',
        '.thumb img',
    ]
    
    # ============================================================
    # 이미지 추출 로직 (수정 불필요)
    # ============================================================
    
    # 1순위 시도: 본문 이미지
    for selector in CONTENT_SELECTORS:
        try:
            img = page.query_selector(selector)
            if img:
                src = img.get_attribute('src')
                if src and not src.startswith('data:'):
                    return urljoin(base_url, src)
        except:
            continue
    
    # 2순위 시도: 썸네일
    for selector in THUMBNAIL_SELECTORS:
        try:
            img = page.query_selector(selector)
            if img:
                src = img.get_attribute('src')
                if src and not src.startswith('data:'):
                    return urljoin(base_url, src)
        except:
            continue
    
    # 이미지 없음
    return None


def extract_from_attachment(page, base_url: str) -> Optional[str]:
    """
    첨부파일 목록에서 이미지 파일 URL을 추출합니다.
    (이미지 첨부가 있는 사이트에서 사용)
    
    Args:
        page: Playwright Page 객체
        base_url: 기본 URL
    
    Returns:
        첫 번째 이미지 첨부파일 URL 또는 None
    """
    
    # TODO: 첨부파일 목록 셀렉터 수정
    ATTACHMENT_SELECTOR = '.file-list a, .attach-list a'
    IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    try:
        links = page.query_selector_all(ATTACHMENT_SELECTOR)
        for link in links:
            href = link.get_attribute('href') or ''
            text = link.inner_text() or ''
            
            for ext in IMAGE_EXTENSIONS:
                if ext in href.lower() or ext in text.lower():
                    return urljoin(base_url, href)
    except:
        pass
    
    return None

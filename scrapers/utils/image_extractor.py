"""
향상된 이미지 추출 함수
- 여러 전략으로 이미지 찾기
- 첨부파일 영역, 본문 영역, 전체 페이지 순으로 검색
"""

def extract_thumbnail(page, base_url, content_selectors):
    """
    향상된 이미지 추출 함수
    우선순위:
    1. 첨부파일에서 이미지 파일 찾기
    2. 본문 영역 내 이미지
    3. 미리보기 영역 이미지
    4. 전체 페이지에서 콘텐츠 이미지 찾기
    """
    from urllib.parse import urljoin
    from utils.scraper_utils import safe_get_attr
    
    # 제외할 이미지 키워드
    EXCLUDE_KEYWORDS = ['icon', 'logo', 'btn', 'button', 'arrow', 'bullet', 'bg', 'background', 
                        'banner', 'ad', 'loading', 'spinner', 'captcha', 'qrcode', 'favicon']
    
    def is_valid_image(src):
        if not src:
            return False
        src_lower = src.lower()
        # 제외 키워드 체크
        for kw in EXCLUDE_KEYWORDS:
            if kw in src_lower:
                return False
        # 이미지 확장자 또는 이미지 관련 URL 패턴
        if any(ext in src_lower for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
            return True
        if any(pattern in src_lower for pattern in ['upload', 'attach', 'image', 'photo', 'content', 'board']):
            return True
        return False
    
    thumbnail_url = None
    
    # 전략 1: 첨부파일 링크에서 이미지 찾기
    attach_selectors = [
        'a[href*="download"]',
        'a[href*="attach"]',
        'a[href*="file"]',
        'a[href*="boardDown"]',
        '.file_list a',
        '.attach_list a'
    ]
    for sel in attach_selectors:
        links = page.locator(sel)
        for i in range(links.count()):
            link = links.nth(i)
            title = safe_get_attr(link, 'title') or link.inner_text() or ''
            href = safe_get_attr(link, 'href') or ''
            if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                thumbnail_url = urljoin(base_url, href)
                return thumbnail_url
    
    # 전략 2: 본문 영역 내 이미지
    for sel in content_selectors:
        imgs = page.locator(f'{sel} img')
        for i in range(imgs.count()):
            src = safe_get_attr(imgs.nth(i), 'src')
            if is_valid_image(src):
                thumbnail_url = urljoin(base_url, src)
                return thumbnail_url
    
    # 전략 3: 미리보기/뷰어 영역
    preview_selectors = [
        '.preview_area img',
        '.viewer img',
        '.image_box img',
        '.photo_area img',
        '.thumb img',
        'figure img'
    ]
    for sel in preview_selectors:
        imgs = page.locator(sel)
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if is_valid_image(src):
                thumbnail_url = urljoin(base_url, src)
                return thumbnail_url
    
    # 전략 4: 전체 페이지에서 유효한 이미지 찾기 (마지막 수단)
    all_imgs = page.locator('img[src*="upload"], img[src*="attach"], img[src*="content"], img[src*="board"]')
    for i in range(min(all_imgs.count(), 10)):
        src = safe_get_attr(all_imgs.nth(i), 'src')
        if is_valid_image(src):
            thumbnail_url = urljoin(base_url, src)
            return thumbnail_url
    
    return thumbnail_url

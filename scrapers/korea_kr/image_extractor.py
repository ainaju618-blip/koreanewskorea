# -*- coding: utf-8 -*-
"""
korea.kr Image Extractor
- Version: v1.0
- Created: 2025-12-25

Site-specific image extraction logic for korea.kr
"""

import re
from typing import Optional
from urllib.parse import urljoin
from playwright.sync_api import Page


BASE_URL = 'https://www.korea.kr'

# Image selectors in priority order
IMAGE_SELECTORS = [
    # 1. OG image (most reliable)
    'meta[property="og:image"]',

    # 2. Content area images
    'div.news-content img',
    'article img',
    'div.view_cont img',
    'div#news_content img',

    # 3. Generic content images
    '.content_view img',
    '.board_view img',
    '.view_body img',
]

# Patterns to exclude (icons, buttons, logos)
EXCLUDE_PATTERNS = [
    r'icon',
    r'button',
    r'logo',
    r'banner',
    r'ad[\-_]',
    r'advertisement',
    r'sprite',
    r'\.gif$',
    r'sns_',
    r'share_',
    r'social_',
    r'loading',
    r'placeholder',
]


def is_valid_image(src: str) -> bool:
    """Check if image URL is valid (not an icon/logo/button)"""
    if not src:
        return False

    src_lower = src.lower()

    # Check exclude patterns
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, src_lower):
            return False

    # Check for common image extensions
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
    has_valid_ext = any(ext in src_lower for ext in valid_extensions)

    # Also accept URLs without clear extension but from known image paths
    is_image_path = '/images/' in src_lower or '/photo/' in src_lower or '/attaches/' in src_lower

    return has_valid_ext or is_image_path


def extract_image(page: Page, base_url: str = BASE_URL) -> Optional[str]:
    """
    Extract first valid image from the detail page

    Args:
        page: Playwright Page object
        base_url: Base URL for relative path resolution

    Returns:
        Absolute image URL or None if not found
    """

    # 1. Try OG image first (most reliable)
    try:
        og_image = page.locator('meta[property="og:image"]').first
        if og_image.count() > 0:
            content = og_image.get_attribute('content')
            if content and is_valid_image(content):
                # Ensure absolute URL
                if not content.startswith('http'):
                    content = urljoin(base_url, content)
                return content
    except Exception as e:
        print(f"   [DEBUG] OG image extraction failed: {e}")

    # 2. Try Twitter image
    try:
        twitter_image = page.locator('meta[name="twitter:image"]').first
        if twitter_image.count() > 0:
            content = twitter_image.get_attribute('content')
            if content and is_valid_image(content):
                if not content.startswith('http'):
                    content = urljoin(base_url, content)
                return content
    except Exception:
        pass

    # 3. Try content area images
    for selector in IMAGE_SELECTORS[1:]:  # Skip OG selector (already tried)
        try:
            imgs = page.locator(selector)
            count = imgs.count()

            for i in range(min(count, 10)):  # Check up to 10 images
                img = imgs.nth(i)
                src = img.get_attribute('src')

                if src and is_valid_image(src):
                    # Ensure absolute URL
                    if not src.startswith('http'):
                        src = urljoin(base_url, src)
                    return src

        except Exception as e:
            continue

    # 4. Fallback: Look for data-src (lazy loading)
    try:
        lazy_imgs = page.locator('img[data-src]')
        count = lazy_imgs.count()

        for i in range(min(count, 5)):
            img = lazy_imgs.nth(i)
            src = img.get_attribute('data-src')

            if src and is_valid_image(src):
                if not src.startswith('http'):
                    src = urljoin(base_url, src)
                return src

    except Exception:
        pass

    # No valid image found
    return None


def extract_all_images(page: Page, base_url: str = BASE_URL) -> list:
    """
    Extract all valid images from the page

    Args:
        page: Playwright Page object
        base_url: Base URL for relative path resolution

    Returns:
        List of absolute image URLs
    """
    images = []
    seen = set()

    for selector in IMAGE_SELECTORS:
        try:
            if selector.startswith('meta'):
                elem = page.locator(selector).first
                if elem.count() > 0:
                    content = elem.get_attribute('content')
                    if content and is_valid_image(content) and content not in seen:
                        if not content.startswith('http'):
                            content = urljoin(base_url, content)
                        images.append(content)
                        seen.add(content)
            else:
                imgs = page.locator(selector)
                count = imgs.count()

                for i in range(count):
                    src = imgs.nth(i).get_attribute('src')
                    if src and is_valid_image(src) and src not in seen:
                        if not src.startswith('http'):
                            src = urljoin(base_url, src)
                        images.append(src)
                        seen.add(src)

        except Exception:
            continue

    return images


# For testing
if __name__ == '__main__':
    from playwright.sync_api import sync_playwright

    test_url = 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156736831'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(test_url)
        page.wait_for_load_state('networkidle')

        # Test single extraction
        img = extract_image(page)
        print(f"[TEST] Single image: {img}")

        # Test all images
        all_imgs = extract_all_images(page)
        print(f"[TEST] All images ({len(all_imgs)}):")
        for img_url in all_imgs:
            print(f"   - {img_url}")

        browser.close()

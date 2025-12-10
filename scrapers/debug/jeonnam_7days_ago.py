# -*- coding: utf-8 -*-
"""전라남도청 보도자료 - 특정 날짜(7일 전) 기사만 추출"""

import sys
import os
import time
from datetime import datetime, timedelta
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright

# 올바른 경로 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image

# 설정
REGION_CODE = 'jeonnam'
REGION_NAME = '전라남도'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.jeonnam.go.kr'
LIST_URL = 'https://www.jeonnam.go.kr/M7116/boardList.do?menuId=jeonnam0202000000'
LIST_SELECTORS = ['tbody tr']
LINK_SELECTORS = ['td.title a', 'td a']
CONTENT_SELECTORS = ['div.bbs_view_contnet', 'div.preview_area', 'div.bbs_view', 'div.contents']

# 7일 전 날짜 계산
target_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

def normalize_date(date_str):
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    import re
    match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', date_str)
    if match:
        return match.group(1)
    return datetime.now().strftime('%Y-%m-%d')

def validate_article(article_data):
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "❌ 제목 너무 짧음"
    content = article_data.get('content', '')
    if not content or len(content) < 50:
        return False, f"❌ 본문 부족 ({len(content)}자)"
    return True, "✅ 검증 통과"

def fetch_detail(page, url):
    if not safe_goto(page, url, timeout=20000):
        return "", None
    
    content = ""
    for sel in CONTENT_SELECTORS:
        elem = page.locator(sel)
        if elem.count() > 0:
            text = safe_get_text(elem)
            if text and len(text) > 50:
                content = text[:5000]
                break
    
    thumbnail_url = None
    try:
        download_links = page.locator('a[href*="boardDown.do"]')
        for i in range(download_links.count()):
            link = download_links.nth(i)
            title = safe_get_attr(link, 'title') or ""
            href = safe_get_attr(link, 'href') or ""
            if any(ext in title.lower() for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                original_url = urljoin(BASE_URL, href)
                print(f"      📎 첨부파일 이미지: {title}")
                cloud_url = download_and_upload_image(original_url, BASE_URL, folder="jeonnam")
                if cloud_url and cloud_url.startswith('https://res.cloudinary.com'):
                    thumbnail_url = cloud_url
                    print(f"      ☁️ Cloudinary 업로드 완료")
                else:
                    thumbnail_url = original_url
                break
    except Exception as e:
        print(f"   ⚠️ 이미지 추출 에러: {str(e)[:50]}")
    
    return content, thumbnail_url

def main():
    print(f"🎯 타겟 날짜: {target_date}")
    print(f"🏛️ 전라남도 보도자료 수집 - {target_date} 기사만")
    log_to_server(REGION_CODE, '실행중', f'{target_date} 기사 수집 시작', 'info')
    
    collected_links = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        for page_num in range(1, 6):
            list_url = f'{LIST_URL}&pageIndex={page_num}'
            print(f"   📄 페이지 {page_num} 스캔 중...")
            
            if not safe_goto(page, list_url):
                continue
            
            rows = wait_and_find(page, LIST_SELECTORS, timeout=10000)
            if not rows:
                continue
            
            count = rows.count()
            for i in range(count):
                try:
                    row = rows.nth(i)
                    link_elem = wait_and_find(row, LINK_SELECTORS, timeout=3000)
                    if not link_elem:
                        continue
                    
                    title = safe_get_text(link_elem)
                    href = safe_get_attr(link_elem, 'href')
                    full_url = urljoin(BASE_URL, href) if href else ""
                    
                    date_elem = row.locator('td.date')
                    n_date = normalize_date(safe_get_text(date_elem))
                    
                    if n_date == target_date and title and full_url and 'boardView' in full_url:
                        collected_links.append({'title': title, 'url': full_url})
                        print(f"      ✅ 발견: {title[:30]}...")
                except:
                    continue
            
            time.sleep(0.5)
        
        print(f"✅ {target_date} 기사 {len(collected_links)}개 발견")
        
        success_count = 0
        for item in collected_links:
            url = item['url']
            title = item['title']
            
            print(f"   🔍 처리 중: {title[:30]}...")
            
            content, thumbnail_url = fetch_detail(page, url)
            
            article_data = {
                'title': title,
                'content': content,
                'published_at': f"{target_date}T09:00:00+09:00",
                'original_link': url,
                'source': REGION_NAME,
                'category': CATEGORY_NAME,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }
            
            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")
            
            if is_valid:
                result = send_article_to_server(article_data)
                if result and result.get('status') == 'created':
                    print(f"      ✅ [DB 저장 완료]")
                    success_count += 1
                else:
                    print(f"      ⚠️ [DB 결과] {result.get('status', 'unknown')}")
            
            time.sleep(1)
        
        browser.close()
    
    print(f"🎉 완료: {len(collected_links)}건 중 {success_count}건 신규 저장")

if __name__ == "__main__":
    main()

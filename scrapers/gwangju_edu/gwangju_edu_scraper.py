# -*- coding: utf-8 -*-
"""광주교육청 보도자료 스크래퍼 v3.1 (Robust Fallback)"""

import sys, os, time, re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image

# ===== 상수 정의 =====
REGION_CODE = 'kedu' 
REGION_NAME = '광주시교육청'
CATEGORY_NAME = '광주교육청'
BASE_URL = 'https://enews.gen.go.kr'
LIST_URL = 'https://enews.gen.go.kr/v5/?sid=25'

def normalize_date(date_str: str) -> str:
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', date_str)
        if match:
            return match.group(1)
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')

def validate_article(article_data: Dict) -> Tuple[bool, str]:
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "❌ 제목 너무 짧음"
    content = article_data.get('content', '')
    if not content or len(content) < 30:
        return False, f"❌ 본문 부족 ({len(content)}자)"
    return True, "✅ 검증 통과"

def fetch_detail(page: Page, url: str) -> Tuple[str, str, Optional[str]]:
    """상세 페이지에서 제목, 본문, 이미지 추출 (Robust)"""
    # 타임아웃 30초
    if not safe_goto(page, url, timeout=30000):
        return "", "", None
    
    time.sleep(2)  # 렌더링 대기
    
    title = ""
    content = ""
    thumbnail_url = None
    
    try:
        # 1. 제목 추출
        # 여러 셀렉터 시도
        title_selectors = ['div.board_view h3', 'div.view_title', 'h3']
        for sel in title_selectors:
            if page.locator(sel).count() > 0:
                title = page.locator(sel).first.text_content().strip()
                break
        if not title:
            title = page.title().split('-')[0].strip()

        # 2. 본문 추출 (텍스트 기반 추출로 변경)
        # HTML 텍스트를 가져와서 정제하는 것이 더 안전할 수 있음
        body_text = page.locator('body').text_content() or ""
        
        # 시작/끝 패턴 찾기
        start_patterns = ['광주시교육청', '교육감', '보도자료']
        end_patterns = ['저작권', 'COPYRIGHT', '만족도', '목록']
        
        start_idx = -1
        # 제목 이후부터 찾기
        if title in body_text:
            start_idx = body_text.find(title) + len(title)
        
        if start_idx == -1:
            for pat in start_patterns:
                idx = body_text.find(pat)
                if idx != -1:
                    start_idx = idx
                    break
        
        # 끝 패턴
        end_idx = len(body_text)
        for pat in end_patterns:
            idx = body_text.find(pat, start_idx)
            if idx != -1:
                end_idx = idx
                break
                
        if start_idx != -1:
            content = body_text[start_idx:end_idx].strip()
        else:
            # Fallback: div.board_view 전체
            if page.locator('div.board_view').count() > 0:
                content = page.locator('div.board_view').text_content().strip()
            
        # 정제
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        content = content[:5000]

        # 3. 이미지 추출 (첨부파일 방식 - JavaScript evaluate 사용)
        # 이 사이트는 이미지를 <img> 태그가 아닌 첨부파일 다운로드 링크로 제공
        # 예: <a href="javascript:file_download('274975');">[사진] 청렴골든벨.jpg</a>
        DOWNLOAD_BASE = 'https://enews.gen.go.kr/v5/decoboard/download.php?uid='
        
        # Playwright locator가 특정 속성 선택자에서 제대로 동작하지 않아 JS evaluate 사용
        try:
            js_result = page.evaluate("""() => {
                const links = Array.from(document.querySelectorAll('a'));
                for (const a of links) {
                    const href = a.getAttribute('href') || '';
                    const text = (a.textContent || '').toLowerCase();
                    if (href.includes('file_download') && (text.includes('.jpg') || text.includes('.jpeg') || text.includes('.png'))) {
                        const match = href.match(/file_download\\(['\"]?(\\d+)['\"]?\\)/);
                        if (match) {
                            return { uid: match[1], text: a.textContent.trim() };
                        }
                    }
                }
                return null;
            }""")
            
            if js_result and js_result.get('uid'):
                file_uid = js_result['uid']
                download_url = DOWNLOAD_BASE + file_uid
                print(f"      📷 이미지 발견: {js_result['text'][:30]}...")
                # Cloudinary에 업로드
                cloud_url = download_and_upload_image(download_url, BASE_URL, folder="gwangju_edu")
                if cloud_url and 'cloudinary' in cloud_url:
                    thumbnail_url = cloud_url
                    print(f"      ✅ 이미지 업로드 완료: {thumbnail_url[:50]}...")
                else:
                    thumbnail_url = download_url
        except Exception as img_err:
            print(f"      ⚠️ 이미지 추출 에러: {str(img_err)[:30]}")
        
    except Exception as e:
        print(f"   ⚠️ 상세 파싱 에러: {str(e)[:50]}")
    
    return title, content, thumbnail_url

def collect_articles(days: int = 3) -> List[Dict]:
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작")
    
    collected_links = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
             user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
             viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        print(f"   📄 목록 페이지 스캔 중...")
        if not safe_goto(page, LIST_URL):
            print("   ❌ 목록 페이지 접속 실패")
            browser.close()
            return []
        
        time.sleep(2)
        
        try:
            links = page.locator("a[href*='wbb=md:view;uid:']")
            count = links.count()
            print(f"   🔗 발견된 링크 수: {count}")
            
            for i in range(count):
                try:
                    link = links.nth(i)
                    href = safe_get_attr(link, 'href')
                    text = link.text_content() or ""
                    text = text.strip()
                    if href and 'uid:' in href:
                        full_url = BASE_URL + '/v5/' + href if href.startswith('?') else urljoin(BASE_URL, href)
                        if full_url not in [x['url'] for x in collected_links]:
                            collected_links.append({'title': text, 'url': full_url})
                except:
                    continue
        except Exception as e:
            print(f"   ❌ 링크 수집 에러: {str(e)}")
            
        print(f"✅ 총 {len(collected_links)}개의 수집 대상 링크 확보")
        
        success_count = 0
        for idx, item in enumerate(collected_links[:12]):
            url = item['url']
            print(f"   🔍 [{idx+1}] 분석 중: {item['title'][:20]}...")
            
            real_title, content, thumbnail_url = fetch_detail(page, url)
            final_title = real_title if real_title else item['title']
            
            published_at = f"{datetime.now().strftime('%Y-%m-%d')}T09:00:00+09:00"
            
            article_data = {
                'title': final_title,
                'content': content,
                'published_at': published_at,
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
                    print(f"      ⚠️ [DB 결과] {result.get('status', 'unknown') if result else 'no response'}")
            
            time.sleep(1)
            
        browser.close()

    print(f"🎉 작업 종료: {success_count}건 저장 성공")
    return []

if __name__ == "__main__":
    collect_articles()

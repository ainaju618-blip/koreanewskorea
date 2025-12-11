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
        # 1. 제목 추출 (JavaScript로 view_top 영역에서 추출)
        # 이 사이트는 제목이 h3 태그가 아닌 일반 텍스트 노드로 존재함
        try:
            title = page.evaluate("""() => {
                const viewTop = document.querySelector('div.view_top');
                if (!viewTop) return '';
                
                // view_top 내부의 텍스트에서 제목 추출
                const text = viewTop.textContent || '';
                const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 5);
                
                // 메타데이터가 아닌 줄 = 제목
                for (const line of lines) {
                    if (!line.includes('작성일:') && 
                        !line.includes('작성자:') && 
                        !line.includes('기관명') &&
                        !line.includes('자료문의') &&
                        !line.includes('조회수') &&
                        !line.includes('추천수') &&
                        !line.includes('등록일')) {
                        return line;
                    }
                }
                return lines[0] || '';
            }""")
            if title:
                print(f"      📌 제목 추출 (JS): {title[:30]}...")
        except Exception as title_err:
            print(f"      ⚠️ JS 제목 추출 실패: {str(title_err)[:30]}")
            title = ""

        # 2. 본문 추출 (JavaScript로 불필요한 요소 제외하고 순수 본문만 추출)
        content = ""
        
        try:
            # JavaScript로 div.view_top, div.inquiry, div.writer 등을 제외한 본문만 추출
            content = page.evaluate("""() => {
                const boardPress = document.querySelector('div.board_press');
                if (!boardPress) return '';
                
                // 복제하여 원본 DOM 유지
                const clone = boardPress.cloneNode(true);
                
                // 제외할 요소들 제거 (제목, 메타 정보 등)
                const excludeSelectors = [
                    'div.view_top',      // 제목 영역
                    'div.inquiry',       // 문의처
                    'div.writer',        // 작성자
                    'div.file_list',     // 첨부파일 목록
                    'div.view_bottom',   // 하단 네비게이션
                    '.btn_wrap',         // 버튼 영역
                ];
                
                excludeSelectors.forEach(sel => {
                    const els = clone.querySelectorAll(sel);
                    els.forEach(el => el.remove());
                });
                
                return clone.textContent?.trim() || '';
            }""")
            
            if content:
                print(f"      📄 본문 추출 (JS): {len(content)}자")
        except Exception as e:
            print(f"      ⚠️ JS 본문 추출 실패: {e}")
        
        # Fallback: 기존 셀렉터 방식
        if not content or len(content) < 100:
            content_selectors = ['div.board_press', 'div.board_view', 'div#contents']
            for sel in content_selectors:
                if page.locator(sel).count() > 0:
                    raw_content = page.locator(sel).first.text_content() or ""
                    if len(raw_content) > 100:
                        content = raw_content.strip()
                        print(f"      📄 본문 추출 (Fallback {sel}): {len(content)}자")
                        break
        
        # 본문 정제: 불필요한 텍스트 제거
        if content:
            # 메뉴/네비게이션 텍스트 제거
            noise_patterns = [
                r'HOME\s*',
                r'보도/해명자료\s*',
                r'오늘의 보도/해명자료란에 오신 것을 환영합니다\.?\s*',
                r'보도자료\s*(?=[^\w]|$)',
                r'만족도\s*조사.*',
                r'저작권.*',
                r'COPYRIGHT.*',
                r'목록\s*이전글\s*다음글.*',
                r'자료문의\s*:.*',  # 문의처 정보
            ]
            for pattern in noise_patterns:
                content = re.sub(pattern, '', content, flags=re.IGNORECASE)
            
            # 제목이 본문에 중복 포함된 경우 제거 (제목으로 시작하면 제거)
            if title and content.startswith(title):
                content = content[len(title):].strip()
            
            # 연속 공백/줄바꿈 정리
            content = re.sub(r'\n{3,}', '\n\n', content)
            content = re.sub(r' {2,}', ' ', content)
            content = content.strip()
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
            
            # 제목 결정 로직 강화
            # 1. 상세 페이지 제목이 사이트명이면 무시
            # 2. 상세 페이지 제목이 너무 짧으면 목록 제목 사용
            if real_title and len(real_title) > 10 and '홍보관' not in real_title and '교육청' not in real_title:
                final_title = real_title
            else:
                final_title = item['title']  # 목록에서 수집한 제목 사용
                print(f"      📌 목록 제목 사용: {final_title[:30]}...")
            
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

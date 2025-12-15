"""
목포시 보도자료 스크래퍼
- 버전: v3.0
- 최종수정: 2025-12-12
- 담당: AI Agent

변경점 (v3.0):
- 사용자 제공 상세 가이드 기반 완전 재작성
- URL 패턴: ?idx={ID}&mode=view
- 이미지 URL 패턴: ybmodule.file/board/www_report_material/
- 카드형 레이아웃 대응 (a[href*="idx="][href*="mode=view"])
- Cloudinary 업로드 통합
"""

# ============================================================
# 1. 표준 라이브러리
# ============================================================
import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

# ============================================================
# 2. 외부 라이브러리
# ============================================================
from playwright.sync_api import sync_playwright, Page

# ============================================================
# 3. 로컬 모듈
# ============================================================
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.text_cleaner import clean_article_content
from utils.category_detector import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'mokpo'
REGION_NAME = '목포시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.mokpo.go.kr'
LIST_URL = 'https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material'

# 페이지네이션: ?page={N}
# 상세 페이지: ?idx={게시물ID}&mode=view

# 목록 페이지 셀렉터 (카드형 레이아웃)
LIST_ITEM_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',  # 가이드 기반 정확한 셀렉터
    'a.item_cont',
    '.list_item a',
]

# 본문 페이지 셀렉터
CONTENT_SELECTORS = [
    'div.viewbox',
    'div.module_view_box',
    'div.board_view_cont',
    'section[role="region"]',
]

# 목포시 특화 이미지 패턴
MOKPO_IMAGE_PATTERNS = [
    'ybmodule.file/board/www_report_material',  # 본문 이미지 경로
    'build/images/',  # 썸네일 이미지 경로
]


# ============================================================
# 5. 유틸리티 함수
# ============================================================
def normalize_date(date_str: str) -> str:
    """
    날짜 문자열을 YYYY-MM-DD 형식으로 정규화
    
    목포시 날짜 형식:
    - 목록: YYYY-MM-DD (예: 2025-12-11)
    - 상세: YYYY.MM.DD (예: 2025.12.11)
    """
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        # YYYY-MM-DD 또는 YYYY.MM.DD 패턴
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def extract_article_id(href: str) -> Optional[str]:
    """href에서 idx 파라미터 추출"""
    if not href:
        return None
    match = re.search(r'idx=(\d+)', href)
    return match.group(1) if match else None


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str]:
    """
    상세 페이지에서 본문, 이미지, 날짜를 추출
    
    Returns:
        (본문 텍스트, 썸네일 URL, 날짜)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d')
    
    time.sleep(1)  # 페이지 안정화
    
    # 1. 날짜 추출 (상세 페이지: YYYY.MM.DD 형식)
    pub_date = datetime.now().strftime('%Y-%m-%d')
    try:
        # 페이지 전체에서 날짜 패턴 찾기
        page_text = page.locator('body').inner_text()
        date_match = re.search(r'(\d{4})\.(\d{2})\.(\d{2})', page_text[:3000])
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    
    # 2. 본문 추출
    content = ""
    
    # 전략 1: JavaScript 기반 추출 (region 내 본문)
    try:
        js_code = """
        () => {
            // 메인 컨텐츠 영역 찾기
            const mainArea = document.querySelector('section[role="region"]') ||
                           document.querySelector('div.viewbox') ||
                           document.querySelector('div.module_view_box');
            
            if (!mainArea) return '';
            
            // 본문 영역에서 텍스트 추출
            // 이미지 다음에 위치한 텍스트 블록이 본문
            const textBlocks = mainArea.querySelectorAll('div, p');
            let longestText = '';
            
            for (const block of textBlocks) {
                const text = block.innerText?.trim();
                if (text && text.length > longestText.length && 
                    text.length < 8000 && 
                    !text.includes('첨부파일') &&
                    !text.includes('사이트맵') &&
                    !text.includes('개인정보')) {
                    longestText = text;
                }
            }
            
            return longestText;
        }
        """
        content = page.evaluate(js_code)
        if content:
            content = content[:5000]
    except Exception as e:
        print(f"      ⚠️ JS 본문 추출 실패: {e}")
    
    # 전략 2: 일반 셀렉터 fallback
    if not content or len(content) < 50:
        for sel in CONTENT_SELECTORS:
            try:
                content_elem = page.locator(sel)
                if content_elem.count() > 0:
                    text = safe_get_text(content_elem)
                    if text and len(text) > 50:
                        content = text[:5000]
                        break
            except:
                continue

    # 본문 정제
    if content:
        content = clean_article_content(content)

    # 3. 이미지 추출
    thumbnail_url = None
    
    # 전략 1: 목포시 본문 이미지 패턴에서 직접 찾기
    for pattern in MOKPO_IMAGE_PATTERNS:
        imgs = page.locator(f'img[src*="{pattern}"]')
        if imgs.count() > 0:
            src = safe_get_attr(imgs.first, 'src')
            if src:
                full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                # Cloudinary 업로드
                cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                else:
                    thumbnail_url = full_url
                break
    
    # 전략 2: 본문 영역 내 일반 이미지
    if not thumbnail_url:
        for sel in CONTENT_SELECTORS:
            imgs = page.locator(f'{sel} img')
            for i in range(min(imgs.count(), 3)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                    full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    # Cloudinary 업로드
                    cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                    else:
                        thumbnail_url = full_url
                    break
            if thumbnail_url:
                break
    
    return content, thumbnail_url, pub_date


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송

    Args:
        days: 수집할 기간 (일)
        max_articles: 최대 수집 기사 수
        start_date: 수집 시작일 (YYYY-MM-DD)
        end_date: 수집 종료일 (YYYY-MM-DD)
    """
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.0 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    collected_count = 0
    success_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        page_num = 1
        stop = False
        
        while page_num <= 5 and not stop and collected_count < max_articles:
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   📄 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # 목록 항목 찾기 (카드형 레이아웃)
            items = wait_and_find(page, LIST_ITEM_SELECTORS, timeout=10000)
            if not items:
                print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                break
            
            item_count = items.count()
            print(f"      📰 {item_count}개 기사 발견")
            
            # 링크 정보 수집
            link_data = []
            seen_urls = set()  # ★ 중복 URL 체크용

            for i in range(item_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    item = items.nth(i)
                    
                    # 제목 추출 (h3 또는 첫 번째 자식)
                    title_elem = item.locator('h3')
                    if title_elem.count() > 0:
                        title = safe_get_text(title_elem)
                    else:
                        title = safe_get_text(item)
                    
                    title = title.strip() if title else ""
                    
                    href = safe_get_attr(item, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # 상세 페이지 URL 구성
                    if href.startswith('http'):
                        full_url = href
                    elif 'idx=' in href:
                        full_url = urljoin(BASE_URL, href)
                    else:
                        continue
                    
                    # 날짜 추출 (목록에서 - YYYY-MM-DD 형식)
                    try:
                        # 카드 내 날짜 요소 찾기
                        date_text = item.inner_text()
                        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_text)
                        n_date = date_match.group(1) if date_match else None
                    except:
                        n_date = None
                    
                    # 날짜 필터링 (가능한 경우)
                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    # ★ 중복 URL 체크
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    link_data.append({
                        'title': title,
                        'url': full_url,
                        'list_date': n_date
                    })

                except Exception as e:
                    continue

            # 상세 페이지 수집 및 전송
            for item in link_data:
                if collected_count >= max_articles:
                    break
                    
                title = item['title']
                full_url = item['url']
                
                print(f"      📰 {title[:35]}...")
                log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
                
                content, thumbnail_url, detail_date = fetch_detail(page, full_url)
                
                # 날짜 결정 (상세 > 목록)
                final_date = detail_date or item.get('list_date') or datetime.now().strftime('%Y-%m-%d')
                
                # 날짜 필터링 (상세 페이지에서 얻은 정확한 날짜로)
                if final_date < start_date:
                    stop = True
                    break
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"

                # 부제목 추출
                subtitle, content = extract_subtitle(content, title)

                # 카테고리 자동 분류
                cat_code, cat_name = detect_category(title, content)

                article_data = {
                    'title': title,
                    'subtitle': subtitle,
                    'content': content,
                    'published_at': f"{final_date}T09:00:00+09:00",
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': cat_name,
                    'region': REGION_CODE,
                    'thumbnail_url': thumbnail_url,
                }
                
                # 서버로 전송
                result = send_article_to_server(article_data)
                collected_count += 1
                
                if result.get('status') == 'created':
                    success_count += 1
                    img_status = "✓이미지" if thumbnail_url else "✗이미지"
                    print(f"         ✅ 저장 완료 ({img_status})")
                    log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                elif result.get('status') == 'exists':
                    print(f"         ⏩ 이미 존재")
                
                time.sleep(0.5)  # Rate limiting
            
            page_num += 1
            if stop:
                print("      🛑 수집 기간 초과, 종료합니다.")
                break
            
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개)"
    print(f"✅ {final_msg}")
    log_to_server(REGION_CODE, '성공', final_msg, 'success')
    
    return []


# ============================================================
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v3.0')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    # bot-service.ts 호환 인자 (필수)
    parser.add_argument('--start-date', type=str, default=None, help='수집 시작일 (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default=None, help='수집 종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()

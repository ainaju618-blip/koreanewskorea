"""
신안군 보도자료 스크래퍼
- 버전: v2.0
- 최종수정: 2025-12-13
- 담당: AI Agent

사이트 특징:
- wscms 기반 사이트
- 목록 URL: https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms
- 상세 페이지: /show/{ID} 패턴
- 페이지네이션: ?page={N}
- 본문 구조: table.show_form 내 label 태그 기반
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
from utils.api_client import send_article_to_server, log_to_server, ensure_server_running
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, extract_subtitle
from utils.cloudinary_uploader import download_and_upload_image
from utils.category_detector import detect_category

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'shinan'
REGION_NAME = '신안군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.shinan.go.kr'
LIST_URL = 'https://www.shinan.go.kr/home/www/openinfo/participation_07/participation_07_03/page.wscms'

# 목록 페이지 셀렉터
LIST_ITEM_SELECTORS = [
    'table.bbsListTbl tbody tr',
    'table tbody tr',
    '.bbs_list tbody tr',
]

# 본문 페이지 셀렉터
CONTENT_SELECTORS = [
    'div.bbsV_cont',
    'div.view_content',
    'div.board_view',
    'div.contents',
    'div.con-wrap',
    'section[role="region"]',
]


# ============================================================
# 5. 유틸리티 함수
# ============================================================
def normalize_date(date_str: str) -> str:
    """
    날짜 문자열을 YYYY-MM-DD 형식으로 정규화
    
    신안군 날짜 형식:
    - 목록: YYYY-MM-DD 또는 YYYY.MM.DD
    """
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    
    date_str = date_str.strip().replace('.', '-').replace('/', '-')
    try:
        match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if match:
            y, m, d = match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def extract_article_id(href: str) -> Optional[str]:
    """href에서 게시물 ID 추출 (/show/{ID} 패턴)"""
    if not href:
        return None
    # /show/{ID} 패턴
    match = re.search(r'/show/(\d+)', href)
    if match:
        return match.group(1)
    # idx={ID} 패턴 (폴백)
    match = re.search(r'idx=(\d+)', href)
    return match.group(1) if match else None


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str]:
    """
    상세 페이지에서 본문, 이미지, 날짜를 추출
    
    신안군 상세 페이지 구조:
    - table.show_form: 메인 테이블
    - <label>제목</label> -> 다음 td에 제목
    - <label>내용</label> -> 다음 td에 본문
    - <label>등록일</label> -> 다음 td에 날짜
    
    Returns:
        (본문 텍스트, 썸네일 URL, 날짜)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d')
    
    time.sleep(1.5)  # 페이지 안정화
    
    # JavaScript로 label 기반 데이터 추출
    try:
        result = page.evaluate("""
        () => {
            const data = {
                content: '',
                date: '',
                images: []
            };
            
            // table.show_form 내에서 label 기반으로 데이터 추출
            const labels = document.querySelectorAll('table.show_form label, table label');
            
            for (const label of labels) {
                const labelText = label.innerText?.trim();
                
                // 부모 th/td의 다음 형제 td에서 값 추출
                const parentCell = label.closest('th') || label.closest('td');
                const valueCell = parentCell?.nextElementSibling;
                
                if (!valueCell) continue;
                
                if (labelText === '내용') {
                    // 본문 추출 - HTML 태그 유지하며 텍스트 추출
                    data.content = valueCell.innerText?.trim() || '';
                    
                    // 본문 내 이미지 추출
                    const imgs = valueCell.querySelectorAll('img');
                    for (const img of imgs) {
                        const src = img.src;
                        if (src && !src.includes('icon') && !src.includes('btn') && 
                            !src.includes('logo') && !src.includes('bullet')) {
                            data.images.push(src);
                        }
                    }
                }
                else if (labelText === '등록일') {
                    data.date = valueCell.innerText?.trim() || '';
                }
            }
            
            // 폴백: label이 없는 경우 가장 긴 td 찾기
            if (!data.content) {
                const tds = document.querySelectorAll('table td');
                let longestTd = null;
                let maxLen = 0;
                
                for (const td of tds) {
                    const text = td.innerText?.trim();
                    // 메뉴 텍스트 제외
                    if (text && text.length > maxLen && text.length < 10000 &&
                        !text.includes('신안군소개') && 
                        !text.includes('전자민원') &&
                        !text.includes('열린군정') &&
                        !text.includes('참여마당') &&
                        !text.includes('분야별정보') &&
                        !text.includes('사이트맵')) {
                        maxLen = text.length;
                        longestTd = td;
                    }
                }
                
                if (longestTd && maxLen > 50) {
                    data.content = longestTd.innerText?.trim();
                    
                    // 이미지 추출
                    const imgs = longestTd.querySelectorAll('img');
                    for (const img of imgs) {
                        const src = img.src;
                        if (src && !src.includes('icon') && !src.includes('btn')) {
                            data.images.push(src);
                        }
                    }
                }
            }
            
            // 첨부파일에서 이미지 URL 찾기
            if (data.images.length === 0) {
                const attachments = document.querySelectorAll('a[href*="download"], a[href*="/data/"]');
                for (const a of attachments) {
                    const href = a.href;
                    if (href && (href.includes('.jpg') || href.includes('.jpeg') || 
                                 href.includes('.png') || href.includes('.gif'))) {
                        data.images.push(href);
                    }
                }
            }
            
            // 본문 내 인라인 이미지 URL 패턴 찾기 (img 태그가 아닌 경우)
            if (data.images.length === 0) {
                const allImgs = document.querySelectorAll('img[src*="/board/data/"], img[src*="/images/board/"]');
                for (const img of allImgs) {
                    const src = img.src;
                    if (src && !src.includes('list') && !src.includes('admin') &&
                        !src.includes('icon') && !src.includes('btn')) {
                        data.images.push(src);
                    }
                }
            }
            
            return data;
        }
        """)
        
        content = result.get('content', '')
        date_str = result.get('date', '')
        images = result.get('images', [])
        
    except Exception as e:
        print(f"      [WARN] JS extraction failed: {e}")
        content = ""
        date_str = ""
        images = []
    
    # 날짜 파싱
    pub_date = datetime.now().strftime('%Y-%m-%d')
    if date_str:
        date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', date_str)
        if date_match:
            y, m, d = date_match.groups()
            pub_date = f"{y}-{int(m):02d}-{int(d):02d}"
    
    # 본문 정리 - clean_article_content 함수 사용
    content = clean_article_content(content)
    
    # 이미지 처리
    thumbnail_url = None
    if images:
        for img_url in images[:3]:  # 최대 3개 시도
            try:
                full_url = urljoin(BASE_URL, img_url) if not img_url.startswith('http') else img_url
                # Cloudinary 업로드
                cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                    break
                else:
                    thumbnail_url = full_url
                    break
            except Exception as e:
                continue
    
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
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)
    

    # Ensure dev server is running before starting

    if not ensure_server_running():

        print("[ERROR] Dev server could not be started. Aborting.")

        return []
")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')

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
            
            # 목록 항목 찾기
            items = None
            for sel in LIST_ITEM_SELECTORS:
                try:
                    rows = page.locator(sel)
                    if rows.count() > 0:
                        items = rows
                        break
                except:
                    continue
            
            if not items:
                # 대안: 모든 링크에서 /show/ 패턴 찾기
                try:
                    items = page.locator('a[href*="/show/"]')
                    if items.count() == 0:
                        print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                        break
                except:
                    print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                    break
            
            item_count = items.count()
            print(f"      📰 {item_count}개 기사 발견")
            
            # 링크 정보 수집
            link_data = []
            seen_urls = set()

            for i in range(item_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    item = items.nth(i)
                    
                    # tr인 경우 내부 a 태그에서 링크 추출
                    link_elem = item.locator('a[href*="/show/"]')
                    if link_elem.count() == 0:
                        link_elem = item.locator('a').first
                    else:
                        link_elem = link_elem.first
                    
                    if link_elem.count() == 0:
                        # item 자체가 a 태그인 경우
                        href = safe_get_attr(item, 'href')
                        title = safe_get_text(item)
                    else:
                        href = safe_get_attr(link_elem, 'href')
                        title = safe_get_text(link_elem)
                    
                    title = title.strip() if title else ""
                    
                    if not title or not href:
                        continue
                    
                    # 제목 정리 (불필요한 텍스트 제거)
                    title = re.sub(r'\s+', ' ', title).strip()
                    
                    # 상세 페이지 URL 구성
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)
                    
                    # 날짜 추출 (목록 행에서)
                    try:
                        row_text = item.inner_text()
                        date_match = re.search(r'(\d{4})[-./](\d{1,2})[-./](\d{1,2})', row_text)
                        if date_match:
                            y, m, d = date_match.groups()
                            n_date = f"{y}-{int(m):02d}-{int(d):02d}"
                        else:
                            n_date = None
                    except:
                        n_date = None
                    
                    # 날짜 필터링
                    if n_date:
                        if n_date < start_date:
                            stop = True
                            break
                        if n_date > end_date:
                            continue

                    # 중복 URL 체크
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
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v1.0')
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

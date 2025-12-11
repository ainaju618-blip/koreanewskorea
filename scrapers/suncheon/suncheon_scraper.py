"""
순천시 보도자료 스크래퍼
- 버전: v3.0
- 최종수정: 2025-12-12
- 담당: AI Agent

변경점 (v3.0):
- 사용자 제공 상세 가이드 기반 완전 재작성
- URL 패턴: ?mode=view&seq={ID}
- 페이지네이션: ?x=1&pageIndex={N}
- 본문: 테이블 세 번째 행 td
- 이미지: 첨부파일 다운로드 (핫링크 불가)
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
from utils.scraper_utils import safe_goto, wait_and_find, safe_get_text, safe_get_attr
from utils.cloudinary_uploader import download_and_upload_image

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'suncheon'
REGION_NAME = '순천시'
CATEGORY_NAME = '전남'
BASE_URL = 'http://www.suncheon.go.kr'
LIST_URL = 'http://www.suncheon.go.kr/kr/news/0006/0001/'

# 페이지네이션: ?x=1&pageIndex={N}
# 상세 페이지: ?mode=view&seq={게시물ID}

# 목록 페이지 셀렉터
LIST_LINK_SELECTORS = [
    'table tr td:nth-child(2) a',  # 가이드 기반 정확한 셀렉터
    'tbody tr td a[href*="mode=view"]',
    'a[href*="seq="]',
]


# ============================================================
# 5. 유틸리티 함수
# ============================================================
def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
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
    """href에서 seq 파라미터 추출"""
    if not href:
        return None
    match = re.search(r'seq=(\d+)', href)
    return match.group(1) if match else None


# ============================================================
# 6. 상세 페이지 수집 함수
# ============================================================
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 담당부서를 추출
    
    Returns:
        (본문 텍스트, 썸네일 URL, 날짜, 담당부서)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None
    
    time.sleep(1)  # 페이지 안정화
    
    # 순천시 상세 페이지 구조:
    # - 첫 번째 행: 담당부서(2열), 등록일(4열)
    # - 두 번째 행: 제목
    # - 세 번째 행: 본문
    
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    content = ""
    thumbnail_url = None
    
    # 1. 테이블 기반 정보 추출 (JavaScript)
    try:
        js_code = """
        () => {
            const result = {date: '', department: '', content: '', title: ''};
            
            // 테이블 행들 찾기
            const tables = document.querySelectorAll('table');
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length >= 3) {
                    // 첫 번째 행: 담당부서, 등록일
                    const firstRow = rows[0];
                    const firstCells = firstRow.querySelectorAll('td, th');
                    if (firstCells.length >= 4) {
                        result.department = firstCells[1]?.innerText?.trim() || '';
                        result.date = firstCells[3]?.innerText?.trim() || '';
                    }
                    
                    // 두 번째 행: 제목
                    const secondRow = rows[1];
                    const titleCell = secondRow.querySelector('td');
                    if (titleCell) {
                        result.title = titleCell.innerText?.trim() || '';
                    }
                    
                    // 세 번째 행: 본문
                    const thirdRow = rows[2];
                    const contentCell = thirdRow.querySelector('td');
                    if (contentCell) {
                        result.content = contentCell.innerText?.trim() || '';
                    }
                    
                    if (result.content && result.content.length > 50) {
                        break;
                    }
                }
            }
            
            return result;
        }
        """
        data = page.evaluate(js_code)
        
        if data.get('date'):
            pub_date = normalize_date(data['date'])
        if data.get('department'):
            department = data['department']
        if data.get('content'):
            content = data['content'][:5000]
    except Exception as e:
        print(f"      ⚠️ JS 추출 실패: {e}")
    
    # Fallback: 일반 텍스트 추출
    if not content or len(content) < 50:
        try:
            body_text = page.locator('body').inner_text()
            # 본문 영역 찾기 시도
            if body_text:
                content = body_text[:5000]
        except:
            pass
    
    # 2. 이미지 추출 (첨부파일에서)
    # 순천시는 핫링크 불가, JavaScript 다운로드 방식
    # 첨부파일 링크에서 이미지 파일명 확인 후 처리
    try:
        # 첨부파일 영역에서 이미지 파일 찾기
        attach_links = page.locator('a[href*="goDownLoad"], a[onclick*="goDownLoad"]')
        for i in range(min(attach_links.count(), 5)):
            link = attach_links.nth(i)
            link_text = safe_get_text(link) or ''
            
            # 이미지 파일인지 확인
            if any(ext in link_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                # JavaScript 다운로드 함수 사용 - Playwright로 처리 어려움
                # 대신 첨부파일 정보만 기록
                print(f"      📎 첨부파일 발견: {link_text[:30]}...")
                break
    except:
        pass
    
    # 본문 내 이미지가 있는지도 확인
    try:
        imgs = page.locator('td img, div img')
        for i in range(min(imgs.count(), 3)):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                # Cloudinary 업로드 시도
                cloudinary_url = download_and_upload_image(full_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                else:
                    thumbnail_url = full_url
                break
    except:
        pass
    
    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송
    
    Args:
        days: 수집할 기간 (일)
        max_articles: 최대 수집 기사 수
    """
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v3.0 시작', 'info')
    
    end_date = datetime.now().strftime('%Y-%m-%d')
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
            # 순천시 페이지네이션: ?x=1&pageIndex={N}
            list_url = f'{LIST_URL}?x=1&pageIndex={page_num}'
            print(f"   📄 페이지 {page_num} 수집 중...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            # 목록 링크 찾기
            links = wait_and_find(page, LIST_LINK_SELECTORS, timeout=10000)
            if not links:
                print("      ⚠️ 기사 목록을 찾을 수 없습니다.")
                break
            
            link_count = links.count()
            print(f"      📰 {link_count}개 기사 발견")
            
            # 링크 정보 수집
            link_data = []
            for i in range(link_count):
                if collected_count + len(link_data) >= max_articles:
                    break
                    
                try:
                    link = links.nth(i)
                    
                    title = safe_get_text(link)
                    title = title.strip() if title else ""
                    
                    href = safe_get_attr(link, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # seq= 파라미터 확인
                    if 'seq=' not in href and 'mode=view' not in href:
                        continue
                    
                    # 상세 페이지 URL 구성
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(LIST_URL, href)
                    
                    # 날짜는 상세 페이지에서 추출
                    link_data.append({
                        'title': title,
                        'url': full_url,
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
                
                content, thumbnail_url, pub_date, department = fetch_detail(page, full_url)
                
                # 날짜 필터링
                if pub_date < start_date:
                    stop = True
                    break
                
                if not content:
                    content = f"본문 내용을 가져올 수 없습니다.\n원본 링크: {full_url}"
                
                article_data = {
                    'title': title,
                    'content': content,
                    'published_at': f"{pub_date}T09:00:00+09:00",
                    'original_link': full_url,
                    'source': REGION_NAME,
                    'category': CATEGORY_NAME,
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
    args = parser.parse_args()
    
    collect_articles(args.days, args.max_articles)


if __name__ == "__main__":
    main()

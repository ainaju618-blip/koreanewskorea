"""
여수시 보도자료 스크래퍼
- 버전: v2.0
- 최종수정: 2025-12-12
- 담당: AI Agent

특이사항:
- URL 패턴: ?idx={ID}&mode=view
- 페이지네이션: ?page={N}
- 이미지: 첨부파일 → web/public/images/yeosu/ 로컬 저장

변경점 (v2.0):
- cloudinary_uploader → local_image_saver 전환
- 이미지 경로: /images/yeosu/{filename} 형태로 반환
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
from urllib.parse import urljoin, unquote

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
from utils.local_image_saver import download_and_save_locally

# ============================================================
# 4. 상수 정의
# ============================================================
REGION_CODE = 'yeosu'
REGION_NAME = '여수시'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.yeosu.go.kr'
LIST_URL = 'https://www.yeosu.go.kr/www/govt/news/release/press'

# 페이지네이션: ?page={N}
# 상세 페이지: ?idx={게시물ID}&mode=view

# 목록 페이지 링크 셀렉터
LIST_LINK_SELECTORS = [
    'a[href*="idx="][href*="mode=view"]',
    'a.basic_cont',
]

# 본문 페이지 셀렉터
CONTENT_SELECTORS = [
    '.view_cont',
    '.board_view',
    '.content_view',
    'div.view_content',
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
def fetch_detail(page: Page, url: str) -> Tuple[str, Optional[str], str, Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 담당부서를 추출
    
    Returns:
        (본문 텍스트, 썸네일 URL, 날짜, 담당부서)
    """
    if not safe_goto(page, url, timeout=20000):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None
    
    time.sleep(1.5)  # 페이지 로딩 대기
    
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    content = ""
    thumbnail_url = None
    
    # 1. JavaScript로 정보 추출 (여수시 페이지 구조에 최적화)
    # 전략: og:description 메타태그 활용 + board_view 내 p 태그 텍스트 추출
    try:
        js_code = """
        () => {
            const result = {date: '', department: '', content: ''};
            
            // 1. og:description 메타태그에서 본문 추출 (가장 정확함)
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) {
                result.content = ogDesc.getAttribute('content') || '';
            }
            
            // 2. board_view 내에서 메타정보와 추가 본문 추출
            const boardView = document.querySelector('.board_view, div.board_view');
            if (boardView) {
                // dl 내에서 날짜, 담당부서 추출
                const dlInfo = boardView.querySelector('dl');
                if (dlInfo) {
                    const dts = dlInfo.querySelectorAll('dt');
                    const dds = dlInfo.querySelectorAll('dd');
                    
                    for (let i = 0; i < dts.length; i++) {
                        const dtText = dts[i]?.innerText?.trim() || '';
                        const ddText = dds[i]?.innerText?.trim() || '';
                        
                        if (dtText.includes('등록일')) {
                            result.date = ddText;
                        }
                        if (dtText.includes('담당부서')) {
                            result.department = ddText;
                        }
                    }
                }
                
                // og:description이 비어있으면 p 태그들에서 본문 추출
                if (!result.content || result.content.length < 50) {
                    const paragraphs = boardView.querySelectorAll('p');
                    let pTexts = [];
                    for (const p of paragraphs) {
                        const text = p.innerText?.trim();
                        if (text && text.length > 10) {
                            pTexts.push(text);
                        }
                    }
                    if (pTexts.length > 0) {
                        result.content = pTexts.join('\\n\\n');
                    }
                }
                
                // 여전히 비어있으면 board_view 전체에서 추출 (메타정보 제외)
                if (!result.content || result.content.length < 50) {
                    const fullText = boardView.innerText || '';
                    // 연락처 이후 텍스트 추출
                    const lines = fullText.split('\\n');
                    let contentLines = [];
                    let foundContact = false;
                    
                    for (const line of lines) {
                        // 연락처 라인 이후부터 수집
                        if (line.match(/\\d{2,4}-\\d{3,4}-\\d{4}/)) {
                            foundContact = true;
                            continue;
                        }
                        if (foundContact && line.trim().length > 5) {
                            // 푸터/메뉴 텍스트 제외
                            if (!line.includes('사이트맵') && 
                                !line.includes('개인정보') && 
                                !line.includes('만족하십니까') &&
                                !line.includes('첨부파일')) {
                                contentLines.push(line.trim());
                            }
                        }
                    }
                    if (contentLines.length > 0) {
                        result.content = contentLines.join('\\n');
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
    
    # Fallback: 일반 셀렉터
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
    
    # 2. 이미지 추출 (첨부파일 다운로드 링크에서)
    # 여수시 패턴: https://www.yeosu.go.kr/ybscript.io/common/file_download/{idx}/{file_id}/{filename}
    try:
        attach_links = page.locator('a[href*="file_download"]')
        attach_count = attach_links.count()
        print(f"      🔍 첨부파일 링크 {attach_count}개 발견")
        
        if attach_count > 0:
            for i in range(min(attach_count, 5)):
                link = attach_links.nth(i)
                href = link.get_attribute('href') or ''
                # text_content() 직접 사용
                try:
                    link_text = link.text_content() or ''
                except:
                    link_text = safe_get_text(link) or ''
                
                print(f"      📄 첨부 #{i}: {link_text[:40]}...")
                
                # 이미지 파일인지 확인 (URL 또는 텍스트에서)
                is_image = any(ext in link_text.lower() or ext in href.lower() 
                              for ext in ['.jpg', '.jpeg', '.png', '.gif'])
                
                if is_image and href:
                    full_url = urljoin(BASE_URL, href) if not href.startswith('http') else href
                    print(f"      📎 이미지 첨부파일 발견!")
                    
                    # 로컬 이미지 저장 (web/public/images/yeosu/)
                    local_path = download_and_save_locally(full_url, BASE_URL, REGION_CODE)
                    if local_path:
                        thumbnail_url = local_path
                        print(f"      💾 로컬 저장 완료: {local_path}")
                    break
    except Exception as e:
        print(f"      ⚠️ 첨부파일 처리 실패: {e}")
    
    # 3. 본문 내 이미지 (fallback)
    if not thumbnail_url:
        try:
            imgs = page.locator('.board_view img, .view_cont img, .content_view img, article img')
            for i in range(min(imgs.count(), 3)):
                src = safe_get_attr(imgs.nth(i), 'src')
                if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo', 'banner', 'bg', 'bullet']):
                    full_url = urljoin(BASE_URL, src) if not src.startswith('http') else src
                    print(f"      📷 본문 이미지 발견: {src[:50]}...")
                    local_path = download_and_save_locally(full_url, BASE_URL, REGION_CODE)
                    if local_path:
                        thumbnail_url = local_path
                        print(f"      💾 로컬 저장 완료")
                    else:
                        thumbnail_url = full_url  # 로컬 저장 실패 시 원본 URL 사용
                    break
        except:
            pass
    
    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. 메인 수집 함수
# ============================================================
def collect_articles(days: int = 3, max_articles: int = 10, dry_run: bool = False) -> List[Dict]:
    """
    보도자료를 수집하고 서버로 전송
    
    Args:
        days: 수집할 기간 (일)
        max_articles: 최대 수집 기사 수
        dry_run: 테스트 모드 (서버 전송 안함)
    """
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작 (최근 {days}일)")
    if not dry_run:
        log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v1.0 시작', 'info')
    
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
            # 여수시 페이지네이션: ?page={N}
            list_url = f'{LIST_URL}?page={page_num}' if page_num > 1 else LIST_URL
            print(f"   📄 페이지 {page_num} 수집 중...")
            if not dry_run:
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
                    # "새로운글" 제거
                    title = title.replace('새로운글', '').strip()
                    
                    href = safe_get_attr(link, 'href')
                    
                    if not title or not href:
                        continue
                    
                    # idx= 파라미터 확인
                    if 'idx=' not in href:
                        continue
                    
                    # 상세 페이지 URL 구성
                    if href.startswith('http'):
                        full_url = href
                    else:
                        full_url = urljoin(BASE_URL, href)
                    
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
                
                print(f"      📰 {title[:40]}...")
                if not dry_run:
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
                
                if dry_run:
                    print(f"         [DRY-RUN] 제목: {title[:30]}...")
                    print(f"         [DRY-RUN] 날짜: {pub_date}")
                    print(f"         [DRY-RUN] 본문: {len(content)}자")
                    print(f"         [DRY-RUN] 이미지: {'있음' if thumbnail_url else '없음'}")
                    success_count += 1
                else:
                    # 서버로 전송
                    result = send_article_to_server(article_data)
                    
                    if result.get('status') == 'created':
                        success_count += 1
                        img_status = "✓이미지" if thumbnail_url else "✗이미지"
                        print(f"         ✅ 저장 완료 ({img_status})")
                        log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
                    elif result.get('status') == 'exists':
                        print(f"         ⏩ 이미 존재")
                
                collected_count += 1
                time.sleep(0.5)  # Rate limiting
            
            page_num += 1
            if stop:
                print("      🛑 수집 기간 초과, 종료합니다.")
                break
            
            time.sleep(1)
        
        browser.close()
    
    final_msg = f"수집 완료 (총 {collected_count}개, 신규 {success_count}개)"
    print(f"✅ {final_msg}")
    if not dry_run:
        log_to_server(REGION_CODE, '성공', final_msg, 'success')
    
    return []


# ============================================================
# 8. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v2.0')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (서버 전송 안함)')
    args = parser.parse_args()
    
    collect_articles(args.days, args.max_articles, args.dry_run)


if __name__ == "__main__":
    main()

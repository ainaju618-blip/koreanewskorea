"""
광주광역시교육청 보도자료 스크래퍼
- 버전: v4.2
- 최종수정: 2025-12-14
- 담당: AI Agent

변경점 (v4.2):
- 메타데이터 제거 패턴 대폭 강화 (추천수, 첨부파일, 작성자, 사진 캡션 등)
- 줄바꿈 정리 개선 (2줄 이상 → 1줄, 연속 공백 정리)

사이트 특징:
- URL 경로에 /v5/와 /v4/가 혼용됨 (이미지는 v4 경로)
- 이미지 핫링크 허용 (직접 접근 가능)
- 본문이 여러 개의 generic 요소로 분리되어 있음
- bo_table=0201 = 보도자료 게시판 식별자
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
REGION_CODE = 'gwangju_edu'
REGION_NAME = '광주광역시교육청'
CATEGORY_NAME = '광주'
BASE_URL = 'https://enews.gen.go.kr'
LIST_URL = 'https://enews.gen.go.kr/v5/?sid=25'

# 상세 페이지 URL 패턴: https://enews.gen.go.kr/v5/?sid=25&wbb=md:view;uid:{ID};
# 페이지네이션: &page={N}
# 이미지 직접 접근 URL: https://enews.gen.go.kr/v4/decoboard/data/file/0201/{파일명}

# 목록 페이지 셀렉터
LIST_ROW_SELECTORS = [
    'form ul li',
    'ul > li',
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


def extract_id_from_href(href: str) -> Optional[str]:
    """href에서 uid 추출: uid:(\\d+);"""
    if not href:
        return None
    match = re.search(r'uid[=:](\d+)', href)
    if match:
        return match.group(1)
    return None


def convert_image_url(view_url: str) -> Optional[str]:
    """
    이미지 뷰어 URL을 직접 접근 URL로 변환
    view_image.php?fn={파일명}&bo_table=0201 
    → https://enews.gen.go.kr/v4/decoboard/data/file/0201/{파일명}
    """
    if not view_url:
        return None
    
    # fn 파라미터 추출
    match = re.search(r'fn=([^&]+)', view_url)
    if match:
        filename = match.group(1)
        return f"https://enews.gen.go.kr/v4/decoboard/data/file/0201/{filename}"
    
    return None


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
    
    time.sleep(1)  # 페이지 로딩 대기
    
    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    
    # 1. 메타 정보 추출 (.view-info 활용)
    try:
        # 날짜 추출 (본문 텍스트 패턴 또는 메타 영역)
        page_text = page.content()
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', page_text)
        if date_match:
            pub_date = date_match.group(1)
        
        # 기관명 (담당부서) 추출
        # 텍스트 "기관명 :" 찾기
        dept_match = re.search(r'기관명\s*[:]\s*([^\s<]+)', page.inner_text('body'))
        if dept_match:
            department = dept_match.group(1).strip()
        else:
            # fallback: .view-info 첫 번째 항목
            info_item = page.locator('ul.view-info li').first
            if info_item.count() > 0:
                department = safe_get_text(info_item)

    except Exception as e:
        print(f"      [WARN] Meta info extraction failed: {e}")
    
    # 2. 본문 추출 (.view-contents 클래스 활용)
    try:
        # .view-contents가 존재하는지 확인
        content_elem = page.locator('.view-contents')
        if content_elem.count() > 0:
            # 텍스트 추출 (innerText 사용)
            content = safe_get_text(content_elem)
        else:
            # Fallback: 첨부파일 영역(.file-list) 이후의 모든 p, div 태그 텍스트
            js_code = """
            () => {
                const fileSection = document.querySelector('.file-list') || document.querySelector('[class*="file"]');
                let text = '';
                if (fileSection) {
                    let next = fileSection.nextElementSibling;
                    while(next) {
                        if (next.tagName === 'P' || next.tagName === 'DIV' || next.tagName === 'SPAN') {
                            text += (next.innerText || '') + '\\n';
                        }
                        next = next.nextElementSibling;
                    }
                }
                
                // 만약 위 방법으로 실패하면, '기관명 :' 이후 텍스트 추출 시도
                if (text.length < 50) {
                    const bodyText = document.body.innerText;
                    const startIdx = bodyText.indexOf('기관명 :');
                    if (startIdx > -1) {
                        const contentArea = bodyText.substring(startIdx);
                        const endIdx = contentArea.indexOf('개인정보처리방침');
                        if (endIdx > -1) {
                            text = contentArea.substring(0, endIdx);
                        }
                    }
                }
                return text;
            }
            """
            content = page.evaluate(js_code)
            
        if content:
            # 공통 본문 정제 함수 사용 (v4.3)
            content = clean_article_content(content)
            
    except Exception as e:
        print(f"      [WARN] Content extraction failed: {e}")

    # 3. 이미지 추출 (개선된 로직)
    try:
        # 방법 A: .view-contents img
        imgs = page.locator('.view-contents img')
        for i in range(imgs.count()):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'btn', 'logo']):
                img_url = urljoin(BASE_URL, src)
                # v5 -> v5/ 경로 문제 해결 (필요시)
                if '/v5/../' in img_url:
                    img_url = img_url.replace('/v5/../', '/')
                
                cloudinary_url = download_and_upload_image(img_url, BASE_URL, folder=REGION_CODE)
                if cloudinary_url:
                    thumbnail_url = cloudinary_url
                    break
        
        # 방법 B: view_image.php 링크 (이미지 뷰어)
        if not thumbnail_url:
            view_links = page.locator('a[href*="view_image.php"]')
            for i in range(view_links.count()):
                href = safe_get_attr(view_links.nth(i), 'href')
                direct_url = convert_image_url(href)
                if direct_url:
                    cloudinary_url = download_and_upload_image(direct_url, BASE_URL, folder=REGION_CODE)
                    if cloudinary_url:
                        thumbnail_url = cloudinary_url
                        break
                        
        # 방법 C: 첨부파일에서 이미지 찾기 (마지막 수단)
        if not thumbnail_url:
            attach_links = page.locator('a[href*="javascript:file_download"]')
            for i in range(min(attach_links.count(), 5)):
                link = attach_links.nth(i)
                title_text = safe_get_text(link) or ''
                if any(ext in title_text.lower() for ext in ['.jpg', '.png', '.jpeg']):
                    onclick = safe_get_attr(link, 'href') or ''
                    match = re.search(r"file_download\(['\"]?(\d+)['\"]?\)", onclick)
                    if match:
                        file_uid = match.group(1)
                        # v5 경로 사용
                        download_url = f"https://enews.gen.go.kr/v5/decoboard/download.php?uid={file_uid}"
                        cloudinary_url = download_and_upload_image(download_url, BASE_URL, folder=REGION_CODE)
                        if cloudinary_url:
                            thumbnail_url = cloudinary_url
                            break
                            
    except Exception as e:
        print(f"      [WARN] Image extraction failed: {e}")
    
    return content, thumbnail_url, pub_date, department


# ============================================================
# 7. 목록 페이지 파싱 함수
# ============================================================
def parse_list_page(page: Page) -> List[Dict]:
    """
    목록 페이지에서 기사 정보 추출
    
    Returns:
        [{'title': ..., 'url': ..., 'date': ..., 'id': ...}, ...]
    """
    articles = []
    
    try:
        # JavaScript로 목록 파싱 (특수한 DOM 구조 대응)
        js_code = """
        () => {
            const items = [];
            // li > a 구조에서 추출 (uid:{ID}; 패턴)
            const links = document.querySelectorAll('a[href*="wbb=md:view;uid:"]');
            
            for (const link of links) {
                const href = link.getAttribute('href') || '';
                const uidMatch = href.match(/uid[=:](\\d+)/);
                if (!uidMatch) continue;
                
                const uid = uidMatch[1];
                
                // 부모 li 또는 링크 자체에서 텍스트 추출
                const li = link.closest('li');
                let title = '';
                let date = '';
                
                // generic 요소들에서 정보 추출
                const generics = li ? li.querySelectorAll('.generic, span, div') : link.querySelectorAll('*');
                for (const g of generics) {
                    const text = (g.textContent || '').trim();
                    
                    // 날짜 패턴
                    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) {
                        date = text;
                        continue;
                    }
                    
                    // 조회수 패턴 스킵
                    if (text.includes('조회수')) continue;
                    
                    // 제목 (가장 긴 텍스트)
                    if (text.length > title.length && text.length < 200 && !text.includes('조회수')) {
                        title = text;
                    }
                }
                
                // 제목이 없으면 링크 텍스트 사용
                if (!title) {
                    title = link.textContent?.trim() || '';
                }
                
                if (title && uid) {
                    items.push({
                        id: uid,
                        title: title.substring(0, 200),
                        date: date || '',
                        href: href
                    });
                }
            }
            
            return items;
        }
        """
        raw_items = page.evaluate(js_code)
        
        for item in raw_items:
            full_url = urljoin(BASE_URL, f"/v5/?sid=25&wbb=md:view;uid:{item['id']};")
            articles.append({
                'id': item['id'],
                'title': item['title'],
                'date': item['date'],
                'url': full_url
            })
            
    except Exception as e:
        print(f"      [WARN] List parsing failed: {e}")
    
    return articles


# ============================================================
# 8. 검증 함수
# ============================================================
def validate_article(article_data: Dict) -> bool:
    """
    기사 데이터 검증
    
    Returns:
        True if valid, False otherwise
    """
    title = article_data.get('title', '')
    content = article_data.get('content', '')
    
    # Title validation
    if len(title) < 5:
        print(f"         [WARN] Validation failed: title too short ({len(title)} chars)")
        return False

    # Content validation
    if len(content) < 50:
        print(f"         [WARN] Validation failed: content too short ({len(content)} chars)")
        return False

    # Check for error messages
    if "본문 내용을 가져올 수 없습니다" in content:
        print(f"         [WARN] Validation failed: content extraction failed")
        return False
    
    return True


# ============================================================
# 9. 메인 수집 함수
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
    print(f"[INFO] {REGION_NAME} 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")

    # Ensure dev server is running before starting
    if not ensure_server_running():
        print("[ERROR] Dev server could not be started. Aborting.")
        return []
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 v4.0 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    collected_count = 0
    success_count = 0
    skipped_count = 0
    image_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        page_num = 1
        stop = False
        all_links = []
        
        # Phase 1: Collect - 목록에서 링크 수집
        while page_num <= 3 and not stop and len(all_links) < max_articles:
            # 페이지네이션: &page={N}
            if page_num == 1:
                list_url = LIST_URL
            else:
                list_url = f'{LIST_URL}&wbb=md%3Alist%3B&page={page_num}'
            
            print(f"   [PAGE] Collecting page {page_num}...")
            log_to_server(REGION_CODE, '실행중', f'페이지 {page_num} 탐색', 'info')
            
            if not safe_goto(page, list_url):
                page_num += 1
                continue
            
            time.sleep(1.5)  # 페이지 로딩 대기
            
            articles = parse_list_page(page)
            print(f"      [FOUND] {len(articles)} articles found")
            
            for article in articles:
                if len(all_links) >= max_articles:
                    break
                
                n_date = article['date']
                if n_date:
                    if n_date < start_date:
                        stop = True
                        break
                    if n_date > end_date:
                        continue
                
                all_links.append(article)
            
            page_num += 1
            if stop:
                print("      [STOP] Collection period exceeded, stopping collection")
                break
            
            time.sleep(1)
        
        print(f"   [COMPLETE] Total {len(all_links)} article links collected")
        
        # Phase 2: Visit - 상세 페이지 방문 및 전송
        for item in all_links[:max_articles]:
            title = item['title']
            full_url = item['url']
            n_date = item['date'] or datetime.now().strftime('%Y-%m-%d')
            
            print(f"      [ARTICLE] {title[:35]}... ({n_date})")
            log_to_server(REGION_CODE, '실행중', f"수집 중: {title[:20]}...", 'info')
            
            content, thumbnail_url, detail_date, department = fetch_detail(page, full_url)
            
            # 상세 페이지에서 추출한 날짜가 있으면 사용
            if detail_date != datetime.now().strftime('%Y-%m-%d'):
                n_date = detail_date
            
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
                'published_at': f"{n_date}T09:00:00+09:00",
                'original_link': full_url,
                'source': department or REGION_NAME,
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }
            
            # 검증
            if not validate_article(article_data):
                continue
            
            # 서버로 전송
            result = send_article_to_server(article_data)
            collected_count += 1
            
            if result.get('status') == 'created':
                success_count += 1
                if thumbnail_url:
                    image_count += 1
                img_status = "[+image]" if thumbnail_url else "[-image]"
                print(f"         [OK] Saved ({img_status})")
                log_to_server(REGION_CODE, '실행중', f"저장 완료: {title[:15]}...", 'success')
            elif result.get('status') == 'exists':
                skipped_count += 1
                print(f"         [SKIP] Already exists")
            
            time.sleep(0.5)  # Rate limiting
        
        browser.close()
    
    if skipped_count > 0:
        final_msg = f"Completed: {success_count} new, {skipped_count} duplicates"
    else:
        final_msg = f"Completed: {success_count} new articles"
    print(f"[OK] {final_msg}")
    log_to_server(REGION_CODE, 'success', final_msg, 'success', created_count=success_count, skipped_count=skipped_count)
    
    return []


# ============================================================
# 10. CLI 진입점
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼 v4.0')
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

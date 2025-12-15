"""
담양군청 보도자료 스크래퍼
- 버전: v2.0
- 최종수정: 2025-12-12
- 담당: AI Agent

변경점 (v2.0):
- cloudinary_uploader → local_image_saver 전환
- 이미지 경로: /images/damyang/{filename} 형태로 반환
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin, parse_qs, urlparse

from playwright.sync_api import sync_playwright, Page

# 로컬 모듈 경로 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.scraper_utils import (
    safe_goto, wait_and_find, safe_get_text, safe_get_attr, clean_article_content, detect_category
)
from utils.cloudinary_uploader import download_and_upload_image

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

# ============================================================
# 상수 정의
# ============================================================
REGION_CODE = 'damyang'
REGION_NAME = '담양군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.damyang.go.kr'
LIST_URL = 'https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007&contentsSid=12&menuCd=DOM_000000190001005001'

# 셀렉터
LIST_ROW_SELECTOR = 'table:has(caption:has-text("보도자료")) tbody tr'
CONTENT_SELECTORS = [
    '.con-wrap',      # 담양군 SPA 본문 영역
    'div.view_con',
    'div.board_view', 
    'td.content',
    'div.bbs_view'
]

# 본문에서 제거할 패턴들 (담양군 푸터)
CONTENT_CUT_PATTERNS = [
    '첨부파일',
    '이전글',
    '다음글', 
    '목록',
    '공공누리',
    '담당부서',
    '이 페이지에서 제공하는 정보에',
    'QR CODE',
    '의견남기기',
    '결과보기'
]

# 본문 상단에서 제거할 메타정보 패턴
HEADER_PATTERNS = [
    r'등록일\s*\d{4}[-./]\d{1,2}[-./]\d{1,2}',
    r'조회수\s*\d+',
    r'작성자\s*\S+'
]

def clean_content(text: str, title: str = "") -> Tuple[str, Optional[str]]:
    """
    본문에서 불필요한 메타정보 및 푸터 텍스트 제거
    
    Args:
        text: 원본 본문 텍스트
        title: 기사 제목 (중복 제거용)
    
    Returns:
        (정제된 본문, 부제목)
    """
    if not text:
        return "", None
    
    subtitle = None
    
    # 1. 하단 푸터 제거 (가장 먼저 나오는 패턴 위치에서 자르기)
    cut_position = len(text)
    for pattern in CONTENT_CUT_PATTERNS:
        idx = text.find(pattern)
        if idx != -1 and idx < cut_position:
            cut_position = idx
    
    result = text[:cut_position].strip()
    
    # 2. 상단 메타정보 제거 (등록일, 조회수, 작성자)
    for pattern in HEADER_PATTERNS:
        result = re.sub(pattern, '', result)
    
    # 3. 제목 중복 제거 (본문에서 제목과 동일한 텍스트 제거)
    if title:
        title_clean = title.strip()
        # 제목이 여러 번 등장하면 모두 제거
        result = result.replace(title_clean, '')
    
    # 4. 부제목 추출 ("-"로 시작하는 첫 번째 라인)
    lines = result.split('\n')
    new_lines = []
    for line in lines:
        line_stripped = line.strip()
        if line_stripped.startswith('- ') and subtitle is None:
            # 부제목 추출 (첫 번째 "-" 라인만)
            subtitle = line_stripped[2:].strip()  # "- " 제거
        else:
            new_lines.append(line)
    
    result = '\n'.join(new_lines)
    
    # 5. 연속 공백/줄바꿈 정리
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = re.sub(r' {2,}', ' ', result)
    result = result.strip()
    
    # 6. 최대 길이 제한
    return result[:5000], subtitle



def fetch_detail(page: Page, url: str, title: str = "") -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:
    """
    상세 페이지에서 본문, 이미지, 날짜, 부서, 부제목 추출
    
    Returns:
        (본문, 썸네일URL, 날짜, 담당부서, 부제목)
    """
    if not safe_goto(page, url):
        return "", None, datetime.now().strftime('%Y-%m-%d'), None, None

    # 담양군 SPA 사이트: 동적 로딩 대기
    try:
        page.wait_for_selector('button.downBtn, .con-wrap', timeout=10000)
    except:
        pass
    time.sleep(1)

    content = ""
    thumbnail_url = None
    pub_date = datetime.now().strftime('%Y-%m-%d')
    department = None
    subtitle = None

    # 1. 날짜 및 부서 추출
    # 담양군청 상세: 리스트 형태의 메타데이터 예상 (작성자, 등록일, 조회수 등)
    # 예: <ul><li><span class="tit">등록일</span><span class="txt">2025-12-12</span></li>...</ul>
    info_items = page.locator('.view_info li, .board_info li, dl.info dd')
    count = info_items.count()
    for i in range(count):
        text = safe_get_text(info_items.nth(i))
        if '등록일' in text:
            # "등록일 : 2025-12-12" 형태 처리
            date_match = re.search(r'(\d{4}[-.]\d{1,2}[-.]\d{1,2})', text)
            if date_match:
                pub_date = normalize_date(date_match.group(1))
        if '담당부서' in text:
            dept_match = text.replace('담당부서', '').replace(':', '').strip()
            if dept_match:
                department = dept_match

    # Fallback: 본문 상단/하단에서 찾기
    if department is None:
        dept_elem = page.locator('span:has-text("담당부서")')
        if dept_elem.count() > 0:
             department = safe_get_text(dept_elem).replace('담당부서', '').strip()

    # 2. 본문 추출
    for sel in CONTENT_SELECTORS:
        content_elem = page.locator(sel)
        if content_elem.count() > 0:
            raw_content = safe_get_text(content_elem)
            if raw_content and len(raw_content) > 50:
                # 본문 정제: 제목 중복 제거, 부제목 추출, 푸터 제거
                content, subtitle = clean_content(raw_content, title)
                # clean_article_content 적용 (추가 정제)
                content = clean_article_content(content)
                break
    
    # 3. 이미지 추출 - 담양군 패턴: button.downBtn + expect_download
    # 첨부파일 다운로드 버튼에서 이미지 파일 찾기
    if not thumbnail_url:
        import tempfile
        import shutil
        
        download_btns = page.locator('button.downBtn')
        for i in range(download_btns.count()):
            btn = download_btns.nth(i)
            file_nm = btn.get_attribute('data-file-nm') or ''
            
            # 이미지 파일인지 확인
            if any(ext in file_nm.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                print(f"      📎 이미지 첨부파일 발견: {file_nm[:40]}...")
                
                try:
                    # expect_download로 파일 다운로드
                    with page.expect_download(timeout=15000) as download_info:
                        btn.click()
                    download = download_info.value
                    
                    # 임시 파일로 저장
                    temp_path = os.path.join(tempfile.gettempdir(), download.suggested_filename or f"damyang_{i}.jpg")
                    download.save_as(temp_path)
                    
                    # 로컬 이미지 저장소로 이동
                    from utils.local_image_saver import ensure_directory, generate_filename
                    folder = ensure_directory(REGION_CODE)
                    filename = generate_filename(REGION_CODE, file_nm)
                    final_path = os.path.join(folder, filename)
                    shutil.copy2(temp_path, final_path)
                    os.remove(temp_path)
                    
                    thumbnail_url = f"/images/{REGION_CODE}/{filename}"
                    print(f"      💾 이미지 저장 완료: {thumbnail_url}")
                    break
                    
                except Exception as e:
                    print(f"      ⚠️ 다운로드 실패: {e}")
                    continue
    
    # 전략 B: 본문 내 이미지 (fallback)
    if not thumbnail_url:
        imgs = page.locator('div.view_con img, div.board_view img, .bbs_view img')
        for i in range(imgs.count()):
            src = safe_get_attr(imgs.nth(i), 'src')
            if src and not any(x in src.lower() for x in ['icon', 'button', 'logo', 'blank', 'data:image']):
                img_url = urljoin(BASE_URL, src)
                local_path = download_and_upload_image(img_url, BASE_URL, REGION_CODE)
                if local_path:
                    thumbnail_url = local_path
                    print(f"      💾 본문 이미지 저장: {local_path}")
                    break
                    
    return content, thumbnail_url, pub_date, department, subtitle

def collect_articles(days: int = 3, max_articles: int = 10, start_date: str = None, end_date: str = None):
    print(f"🏛️ {REGION_NAME} 보도자료 수집 시작")
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    collected_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page_num = 1
        stop = False
        
        while page_num <= 5 and not stop and collected_count < max_articles:
            # URL 파라미터로 페이지 이동 시도 (`&page=N`)
            # 만약 이게 안되면 JS click 로직으로 변경해야 함
            curr_url = f"{LIST_URL}&page={page_num}"
            print(f"   📄 페이지 {page_num} 탐색: {curr_url}")
            
            if not safe_goto(page, curr_url):
                page_num += 1
                continue
            
            rows = wait_and_find(page, [LIST_ROW_SELECTOR])
            if not rows or rows.count() == 0:
                print("      ⚠️ 목록을 찾을 수 없음")
                break
                
            count = rows.count()
            print(f"      📰 {count}개 게시물 발견")
            
            # 목록 데이터 수집
            items = []
            for i in range(count):
                row = rows.nth(i)
                try:
                    # 제목/링크
                    title_link = row.locator('td.subject a, td.title a, a[href*="detail"]').first
                    if title_link.count() == 0:
                        continue
                        
                    title = safe_get_text(title_link)
                    href = safe_get_attr(title_link, 'href')
                    
                    # 날짜
                    date_elem = row.locator('td').nth(3) # 보통 4번째가 날짜
                    date_text = safe_get_text(date_elem)
                    n_date = normalize_date(date_text)
                    
                    if n_date < start_date:
                        stop = True
                        break
                    if n_date > end_date:
                        continue

                    # 상세 URL 구성
                    full_url = ""
                    if href:
                        if 'javascript' in href:
                            # href="javascript:view('1234')" 같은 형태일 경우 정규식으로 ID 추출
                            # 가이드에 따르면 href="/board/detail?dataSid=..." 형태일 수도 있음
                            match = re.search(r"dataSid=(\d+)", href)
                            if match:
                                # 기본 URL 파라미터 조합
                                # 상세 페이지 URL 패턴: /board/detail?dataSid={ID}&boardId=BBS_0000007&domainId=DOM_0000001&contentsSid=12&menuCd=DOM_000000190001005001
                                sid = match.group(1)
                                full_url = f"{BASE_URL}/board/detail?dataSid={sid}&boardId=BBS_0000007&domainId=DOM_0000001&contentsSid=12&menuCd=DOM_000000190001005001"
                        else:
                            full_url = urljoin(BASE_URL, href)
                    
                    if title and full_url:
                        items.append({
                            'title': title,
                            'url': full_url,
                            'date': n_date
                        })

                except Exception as e:
                    print(f"      ⚠️ 항목 파싱 에러: {e}")
                    continue
            
            # 상세 수집
            for item in items:
                if collected_count >= max_articles: 
                    break
                    
                print(f"      Reading: {item['title']} ({item['date']})")
                
                # 제목을 전달하여 본문에서 중복 제거
                content, thumb, final_date, dept, subtitle = fetch_detail(page, item['url'], item['title'])
                
                # 날짜 우선순위: 상세 > 목록
                pub_at = final_date if final_date else item['date']
                
                # 카테고리 자동 분류
                cat_code, cat_name = detect_category(item['title'], content)

                article = {
                    'title': item['title'],
                    'subtitle': subtitle,  # 부제목 추가
                    'content': content,
                    'published_at': f"{pub_at}T09:00:00+09:00",
                    'original_link': item['url'],
                    'source': REGION_NAME,
                    'category': cat_name,  # 자동 분류된 카테고리
                    'region': REGION_CODE,
                    'thumbnail_url': thumb
                }
                
                res = send_article_to_server(article)
                if res.get('status') == 'created':
                    print("         ✅ Saved")
                    collections_msg = "이미지 포함" if thumb else "텍스트만"
                    log_to_server(REGION_CODE, '성공', f"저장: {item['title']} ({collections_msg})", 'success')
                    collected_count += 1
                elif res.get('status') == 'exists':
                    print("         ⏩ Skipped (Exists)")
                
                # 목록으로 돌아가거나 그냥 URL 이동 (SPA가 아니면 URL 이동이 나음)
                # 여기서는 그냥 다음 루프에서 goto 하므로 back 안 함
                time.sleep(0.5)

            page_num += 1
        
        browser.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=f'{REGION_NAME} 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=3, help='수집 기간 (일)')
    parser.add_argument('--max-articles', type=int, default=10, help='최대 수집 기사 수')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드')
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

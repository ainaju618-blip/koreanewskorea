# -*- coding: utf-8 -*-
"""무안군청 보도자료 스크래퍼 v1.4
- 사이트: https://www.muan.go.kr/
- 대상: 보도자료 게시판 (/www/openmuan/new/report)
- 최종수정: 2025-12-14
- 변경사항: 
  - v1.4: 이미지 추출 로직 일반화 (더 다양한 경로 지원, 첨부파일 이미지 추출)
  - v1.3: 본문 추출 전면 재설계 (시작/종료점 기반)
  - 첨부파일 정보 완전 제거
"""

import sys
import os
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright, Page

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api_client import send_article_to_server, log_to_server
from utils.cloudinary_uploader import download_and_upload_image
from utils.text_cleaner import clean_article_content
from utils.category_detector import detect_category

# ============================================
# 상수 정의
# ============================================
REGION_CODE = 'muan'
REGION_NAME = '무안군'
CATEGORY_NAME = '전남'
BASE_URL = 'https://www.muan.go.kr'
LIST_URL = 'https://www.muan.go.kr/www/openmuan/new/report'

TABLE_ROW_SELECTOR = 'table tbody tr'
TITLE_LINK_SELECTOR = 'a.title_cont'


def normalize_date(date_str: str) -> str:
    """날짜 문자열을 YYYY-MM-DD 형식으로 정규화"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    try:
        match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        pass
    return datetime.now().strftime('%Y-%m-%d')


def validate_article(article_data: Dict) -> Tuple[bool, str]:
    """데이터 검증"""
    if not article_data.get('title') or len(article_data['title']) < 5:
        return False, "[검증 실패] 제목이 너무 짧거나 없습니다."
    content = article_data.get('content', '')
    if not content or len(content) < 50:
        return False, f"[검증 실패] 본문 내용이 부족합니다. (길이: {len(content)})"
    return True, "[검증 통과]"


def clean_content_v3(content: str) -> str:
    """본문 정제 v3 - 더 엄격한 필터링"""
    if not content:
        return ""
    
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        
        # 빈 줄은 적당히 유지
        if not line_stripped:
            if cleaned_lines and cleaned_lines[-1].strip():  # 연속 빈줄 방지
                cleaned_lines.append("")
            continue
        
        # === 제거할 패턴들 (v1.3 강화) ===
        should_skip = False
        
        # 첨부파일 관련 (무안군 특화)
        if re.match(r'^이미지\s*\d*번?\s*붙임', line_stripped):  # "이미지 2번 붙임"
            should_skip = True
        elif re.match(r'^붙임\s*\d*', line_stripped):  # "붙임 1"
            should_skip = True
        elif re.match(r'^\d+\s*hit/', line_stripped):  # "5 hit/"
            should_skip = True
        elif re.search(r'\d+\.?\d*\s*(KB|MB|GB)', line_stripped):  # "234.9 KB"
            should_skip = True
        elif line_stripped == '다운로드':
            should_skip = True
        
        # 메타 정보 헤더
        elif re.match(r'^작성일\s*\d{4}', line_stripped):
            should_skip = True
        elif re.match(r'^등록자\s', line_stripped):
            should_skip = True
        elif re.match(r'^조회수\s*\d', line_stripped):
            should_skip = True
        elif line_stripped.startswith('첨부파일'):
            should_skip = True
        
        # 하단 메타 정보 (종료 지점)
        elif line_stripped == '목록':
            should_skip = True
        elif re.match(r'^.{2,10}(실|과|팀|센터)\s*$', line_stripped):  # "기획실 홍보팀"
            should_skip = True
        elif line_stripped.startswith('담당전화번호'):
            should_skip = True
        elif re.match(r'^061-\d{3}-\d{4}', line_stripped):  # 전화번호
            should_skip = True
        elif line_stripped.startswith('최종업데이트'):
            should_skip = True
        elif '만족하십니까' in line_stripped:
            should_skip = True
        elif line_stripped in ['만족', '보통', '불만족', '매우불만족', '의견남기기', '제출하기', '결과보기']:
            should_skip = True
        
        # 저작권/공공누리
        elif '공공누리' in line_stripped:
            should_skip = True
        elif '출처표시' in line_stripped:
            should_skip = True
        elif '이용할 수 있습니다' in line_stripped:
            should_skip = True
        
        # 파일명만 있는 줄 (확장자로 끝남)
        elif re.match(r'^.*\.(jpg|jpeg|png|gif|hwp|pdf|xlsx?|docx?|pptx?)$', line_stripped.lower()) and len(line_stripped) < 150:
            should_skip = True
        
        if not should_skip:
            cleaned_lines.append(line)
    
    result = '\n'.join(cleaned_lines).strip()
    
    # 연속된 빈 줄 정리
    while '\n\n\n' in result:
        result = result.replace('\n\n\n', '\n\n')
    
    return result


def fetch_detail(page: Page, url: str, title: str) -> Tuple[str, Optional[str], Optional[str]]:
    """상세 페이지에서 본문/이미지/날짜 추출 (v1.3)"""
    try:
        page.goto(url, timeout=20000, wait_until='networkidle')
        page.wait_for_timeout(2000)
    except Exception as e:
        print(f"   [WARN] 페이지 접속 실패: {url}")
        return "", None, None

    # 1. 본문 추출 (v1.3 - 시작/종료점 기반)
    content = ""
    try:
        js_code = """
        (articleTitle) => {
            const subInner = document.querySelector('div.sub_inner');
            if (!subInner) return '';
            
            const fullText = subInner.innerText;
            const lines = fullText.split('\\n');
            
            // === 본문 시작점 찾기 ===
            // 방법 1: 마지막 "다운로드" 버튼 이후
            // 방법 2: 부제목 (- 로 시작하는 줄)
            // 방법 3: 제목이 두 번째로 나오는 지점
            
            let startIdx = -1;
            let lastDownloadIdx = -1;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line === '다운로드') {
                    lastDownloadIdx = i;
                }
            }
            
            // 마지막 다운로드 이후부터 탐색
            const searchStart = lastDownloadIdx > 0 ? lastDownloadIdx + 1 : 0;
            
            for (let i = searchStart; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 첨부파일 라인 스킵
                if (line.includes('hit/') || 
                    line.match(/\\d+\\.?\\d*\\s*(KB|MB)/) ||
                    line.startsWith('이미지') ||
                    line.startsWith('붙임') ||
                    line === '다운로드' ||
                    line.length < 3) {
                    continue;
                }
                
                // 본문 시작 조건:
                // 1. 기사 제목과 동일한 줄
                // 2. 부제목 (- 로 시작)
                // 3. 30자 이상의 의미있는 텍스트
                if (line === articleTitle ||
                    (line.startsWith('-') && line.length > 10) ||
                    (line.length > 30 && !line.includes('hit'))) {
                    startIdx = i;
                    break;
                }
            }
            
            if (startIdx === -1) startIdx = searchStart;
            
            // === 본문 종료점 찾기 ===
            let endIdx = lines.length;
            
            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 종료 조건
                if (line === '목록' ||
                    line.match(/^.{2,10}(실|과|팀)\\s*$/) ||
                    line.startsWith('담당전화번호') ||
                    line.startsWith('최종업데이트') ||
                    line.includes('만족하십니까') ||
                    line === '만족' ||
                    line === '의견남기기') {
                    endIdx = i;
                    break;
                }
            }
            
            // 본문 추출
            const bodyLines = lines.slice(startIdx, endIdx);
            return bodyLines.join('\\n').trim();
        }
        """
        content = page.evaluate(js_code, title)
        if content:
            content = clean_content_v3(content)
            content = clean_article_content(content)
            content = content[:5000]
    except Exception as e:
        print(f"   [WARN] 본문 추출 에러: {str(e)}")

    # 2. 날짜 추출
    pub_date = None
    try:
        page_text = page.locator('div.sub_inner').inner_text()[:2000]
        match = re.search(r'작성일\s*(\d{4}\.\d{2}\.\d{2})', page_text)
        if match:
            pub_date = normalize_date(match.group(1))
    except:
        pass

    # 3. 이미지 추출 (v1.4: 더 일반화된 이미지 추출)
    thumbnail_url = None
    original_image_url = None
    
    try:
        # 전략 1: 본문 영역 내 모든 이미지 (아이콘 등 제외)
        imgs = page.locator('div.sub_inner img')
        for i in range(min(imgs.count(), 15)):
            src = imgs.nth(i).get_attribute('src') or ''
            
            # 제외할 이미지 패턴
            if any(x in src.lower() for x in ['icon', 'logo', 'kogl', 'opentype', 'btn', 'qr', 'banner', 'bg_']):
                continue
            
            # 작은 이미지 제외 (width/height 체크)
            try:
                width = imgs.nth(i).get_attribute('width')
                height = imgs.nth(i).get_attribute('height')
                if width and int(width) < 50:
                    continue
                if height and int(height) < 50:
                    continue
            except:
                pass
            
            # 유효한 이미지 경로인지 확인
            if src and ('ybmodule' in src or 'file' in src or 'upload' in src or 
                       'board' in src or 'www_report' in src or 
                       src.endswith(('.jpg', '.jpeg', '.png', '.gif'))):
                if src.startswith('./'):
                    original_image_url = f"{BASE_URL}{src[1:]}"
                elif src.startswith('/'):
                    original_image_url = f"{BASE_URL}{src}"
                elif not src.startswith('http'):
                    original_image_url = urljoin(BASE_URL, src)
                else:
                    original_image_url = src
                print(f"      [IMG] 본문 이미지 발견: {src[:50]}...")
                break
        
        # 전략 2: 첨부파일 영역에서 이미지 링크 찾기
        if not original_image_url:
            file_links = page.locator('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".gif"]')
            for i in range(min(file_links.count(), 5)):
                href = file_links.nth(i).get_attribute('href') or ''
                if href and not any(x in href.lower() for x in ['icon', 'logo', 'btn']):
                    if href.startswith('/'):
                        original_image_url = f"{BASE_URL}{href}"
                    elif not href.startswith('http'):
                        original_image_url = urljoin(BASE_URL, href)
                    else:
                        original_image_url = href
                    print(f"      [IMG] 첨부파일 이미지: {href[:50]}...")
                    break
                    
    except Exception as e:
        print(f"   [WARN] 이미지 추출 에러: {str(e)}")

    # 로컬 저장
    if original_image_url:
        try:
            local_path = download_and_upload_image(original_image_url, BASE_URL, REGION_CODE)
            if local_path and local_path.startswith('/images/'):
                thumbnail_url = local_path
                print(f"      [LOCAL] 저장: {local_path}")
            else:
                thumbnail_url = original_image_url
        except Exception as e:
            thumbnail_url = original_image_url
            print(f"      [WARN] 저장 실패: {str(e)[:30]}")

    return content, thumbnail_url, pub_date


def collect_articles(days: int = 7, max_articles: int = 10, start_date: str = None, end_date: str = None, dry_run: bool = False) -> List[Dict]:
    """기사 수집"""
    print(f"[{REGION_NAME}] 보도자료 수집 시작 (최근 {days}일, 최대 {max_articles}개)")
    if dry_run:
        print("   ⚠️ DRY-RUN 모드")
    
    log_to_server(REGION_CODE, '실행중', f'{REGION_NAME} 스크래퍼 시작', 'info')

    collected_links = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()

        # Phase 1: 링크 수집
        for page_num in range(1, 4):
            list_url = f'{LIST_URL}?page={page_num}'
            print(f"   [PAGE] 페이지 {page_num} 스캔...")

            try:
                page.goto(list_url, timeout=20000, wait_until='domcontentloaded')
                page.wait_for_timeout(1500)
            except:
                continue

            rows = page.locator(TABLE_ROW_SELECTOR)
            row_count = rows.count()

            for i in range(row_count):
                try:
                    row = rows.nth(i)
                    link = row.locator(TITLE_LINK_SELECTOR)
                    if link.count() == 0:
                        link = row.locator('td:nth-child(2) a')
                    if link.count() == 0:
                        continue

                    title = link.first.inner_text().strip()
                    href = link.first.get_attribute('href')
                    if not title or not href:
                        continue

                    full_url = urljoin(BASE_URL, href)
                    
                    try:
                        date_cell = row.locator('td:nth-child(4)')
                        list_date = normalize_date(date_cell.inner_text().strip()) if date_cell.count() > 0 else None
                    except:
                        list_date = None

                    collected_links.append({
                        'title': title,
                        'url': full_url,
                        'date': list_date or datetime.now().strftime('%Y-%m-%d')
                    })
                except:
                    continue

            time.sleep(0.5)

        print(f"[OK] {len(collected_links)}개 링크 확보")

        # Phase 2: 상세 수집
        success_count = 0
        for idx, item in enumerate(collected_links[:max_articles]):
            title = item['title']
            url = item['url']
            list_date = item['date']

            print(f"   [{idx+1}] {title[:40]}...")

            content, thumbnail_url, pub_date = fetch_detail(page, url, title)
            final_date = pub_date or list_date

            # 카테고리 자동 분류
            cat_code, cat_name = detect_category(title, content)

            article_data = {
                'title': title,
                'content': content,
                'published_at': f"{final_date}T09:00:00+09:00",
                'original_link': url,
                'source': REGION_NAME,
                'category': cat_name,
                'region': REGION_CODE,
                'thumbnail_url': thumbnail_url,
            }

            is_valid, msg = validate_article(article_data)
            print(f"      {msg}")

            if is_valid:
                if dry_run:
                    print(f"      [DRY-RUN] 본문: {len(content)}자")
                    print(f"      본문 시작: {content[:80]}...")
                    print(f"      이미지: {thumbnail_url if thumbnail_url else '없음'}")
                    success_count += 1
                else:
                    result = send_article_to_server(article_data)
                    if result and result.get('status') == 'created':
                        success_count += 1
                        log_to_server(REGION_CODE, '실행중', f"성공: {title[:15]}...", 'success')

            time.sleep(1)

        browser.close()

    print(f"[완료] {success_count}건 저장")
    log_to_server(REGION_CODE, '성공', f'{success_count}건 저장', 'success')
    return []


def main():
    import argparse
    parser = argparse.ArgumentParser(description='무안군청 보도자료 스크래퍼')
    parser.add_argument('--days', type=int, default=7)
    parser.add_argument('--max-articles', type=int, default=10)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--start-date', type=str, default=None)
    parser.add_argument('--end-date', type=str, default=None)
    args = parser.parse_args()

    collect_articles(
        days=args.days,
        max_articles=args.max_articles,
        start_date=args.start_date,
        end_date=args.end_date,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()

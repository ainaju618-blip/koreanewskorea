# 무안군 본문 추출 디버그 v3 - 실제 저장된 본문 패턴 분석
from playwright.sync_api import sync_playwright
import re

# 첨부파일이 여러개인 기사로 테스트
url = "https://www.muan.go.kr/www/openmuan/new/report"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(2000)
    
    # 첫 번째 기사 클릭하여 상세 페이지로 이동
    first_link = page.locator('a.title_cont').first
    href = first_link.get_attribute('href')
    detail_url = f"https://www.muan.go.kr{href}"
    
    page.goto(detail_url, wait_until='networkidle')
    page.wait_for_timeout(3000)
    
    print("=" * 60)
    print(f"무안군 본문 추출 디버그 v3")
    print(f"URL: {detail_url}")
    print("=" * 60)
    
    # 전체 sub_inner 텍스트 확인
    sub_inner = page.locator('div.sub_inner')
    full_text = sub_inner.inner_text() if sub_inner.count() > 0 else ""
    
    print("\n[전체 텍스트 (sub_inner)]")
    print("-" * 60)
    print(full_text[:2000])
    print("-" * 60)
    
    # 패턴 분석 - 본문 시작점 찾기
    lines = full_text.split('\n')
    print(f"\n[라인 분석 - 총 {len(lines)}줄]")
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if len(line_stripped) > 5:
            # 특징적인 패턴 표시
            markers = []
            if '다운로드' in line_stripped:
                markers.append('📥')
            if 'hit/' in line_stripped or ' KB' in line_stripped or ' MB' in line_stripped:
                markers.append('📎')
            if line_stripped.startswith('이미지') or line_stripped.startswith('붙임'):
                markers.append('🖼️')
            if line_stripped.startswith('-'):
                markers.append('📌부제목')
            if '목록' == line_stripped:
                markers.append('🛑')
            if '담당' in line_stripped or '전화번호' in line_stripped:
                markers.append('📞')
                
            marker_str = ' '.join(markers) if markers else ''
            print(f"  [{i:3d}] {line_stripped[:60]:60s} {marker_str}")
    
    browser.close()

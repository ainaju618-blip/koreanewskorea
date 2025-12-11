"""
홍보담당자 정보 자동 추출 스크립트
- 각 기관의 보도자료 페이지에서 담당자 정보 스크래핑
- 결과는 JSON으로 저장하여 관리자가 검토 후 DB 반영

Python 실행: python extract_contacts.py
"""

import os
import sys
import json
import re
import time
from datetime import datetime
from typing import Optional, Dict, List

from playwright.sync_api import sync_playwright, Page

# 출력 파일 경로
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'extracted_contacts.json')

# 기관별 보도자료 URL 정의
AGENCIES = [
    {"region_code": "gwangju", "name": "광주광역시", "url": "https://www.gwangju.go.kr/boardList.do?boardId=BD_0000000027&pageId=www789"},
    {"region_code": "naju", "name": "나주시", "url": "https://www.naju.go.kr/www/administration/reporting/coverage"},
    {"region_code": "mokpo", "name": "목포시", "url": "https://www.mokpo.go.kr/www/mokpo_news/press_release/report_material"},
    {"region_code": "yeosu", "name": "여수시", "url": "https://www.yeosu.go.kr/www/administration/news/press"},
    {"region_code": "suncheon", "name": "순천시", "url": "https://www.suncheon.go.kr/kr/news/0004/0005/0001/"},
    {"region_code": "gwangyang", "name": "광양시", "url": "https://gwangyang.go.kr/board.es?mid=a11007000000&bid=0057"},
    {"region_code": "damyang", "name": "담양군", "url": "https://www.damyang.go.kr/board/list?domainId=DOM_0000001&boardId=BBS_0000007"},
    {"region_code": "gokseong", "name": "곡성군", "url": "https://www.gokseong.go.kr/kr/board/list.do?boardId=BBS_0000125"},
    {"region_code": "gurye", "name": "구례군", "url": "https://www.gurye.go.kr/kr/board/list.do?boardId=BBS_0000072"},
    {"region_code": "goheung", "name": "고흥군", "url": "https://www.goheung.go.kr/board/list.do?boardId=BBS_0000029"},
    {"region_code": "boseong", "name": "보성군", "url": "https://www.boseong.go.kr/board/list.do?boardId=BBS_0000061"},
    {"region_code": "hwasun", "name": "화순군", "url": "https://www.hwasun.go.kr/gallery.do?S=S01&M=020101000000&b_code=0000000001"},
    {"region_code": "jangheung", "name": "장흥군", "url": "https://www.jangheung.go.kr/board/list.do?boardId=BBS_0000041"},
    {"region_code": "gangjin", "name": "강진군", "url": "https://www.gangjin.go.kr/board/list.do?boardId=BBS_0000039"},
    {"region_code": "haenam", "name": "해남군", "url": "https://www.haenam.go.kr/board/list.do?boardId=BBS_0000035"},
    {"region_code": "yeongam", "name": "영암군", "url": "https://www.yeongam.go.kr/board/list.do?boardId=BBS_0000047"},
    {"region_code": "muan", "name": "무안군", "url": "https://www.muan.go.kr/www/muan02/muan0203/muan020301.jsp"},
    {"region_code": "hampyeong", "name": "함평군", "url": "https://www.hampyeong.go.kr/main/board.do?menu=03&boardId=news"},
    {"region_code": "yeonggwang", "name": "영광군", "url": "https://www.yeonggwang.go.kr/board/list.do?boardId=BBS_0000053"},
    {"region_code": "jangseong", "name": "장성군", "url": "https://www.jangseong.go.kr/board/list.do?boardId=BBS_0000051"},
    {"region_code": "wando", "name": "완도군", "url": "https://www.wando.go.kr/board/list.do?boardId=BBS_0000043"},
    {"region_code": "jindo", "name": "진도군", "url": "https://www.jindo.go.kr/board/list.do?boardId=BBS_0000037"},
    {"region_code": "shinan", "name": "신안군", "url": "https://www.shinan.go.kr/board/list.do?boardId=BBS_0000045"},
]

# 전화번호 패턴 (한국)
PHONE_PATTERNS = [
    r'0\d{1,2}-\d{3,4}-\d{4}',  # 061-xxx-xxxx
    r'0\d{1,2}\.\d{3,4}\.\d{4}',  # 061.xxx.xxxx
]

# 담당자 정보 추출용 키워드
CONTACT_KEYWORDS = ['담당', '문의', '연락처', '홍보', '기획', '미디어']


def extract_phone(text: str) -> Optional[str]:
    """텍스트에서 전화번호 추출"""
    for pattern in PHONE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return match.group()
    return None


def extract_contact_from_page(page: Page) -> Dict[str, Optional[str]]:
    """페이지 하단 또는 상세 페이지에서 담당자 정보 추출"""
    result = {
        'department': None,
        'person': None,
        'phone': None,
        'email': None,
    }
    
    try:
        # 페이지 전체 텍스트
        html = page.content()
        
        # 전화번호 추출
        phone = extract_phone(html)
        if phone:
            result['phone'] = phone
        
        # 담당부서 추출 시도 (일반적인 패턴)
        dept_patterns = [
            r'담당부서\s*[:\s]*([가-힣]+(?:과|팀|실))',
            r'담당\s*[:\s]*([가-힣]+(?:과|팀|실))',
            r'부서\s*[:\s]*([가-힣]+(?:과|팀|실))',
        ]
        for pattern in dept_patterns:
            match = re.search(pattern, html)
            if match:
                result['department'] = match.group(1)
                break
        
        # 이메일 추출
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, html)
        if email_match:
            result['email'] = email_match.group()
        
    except Exception as e:
        print(f"   ⚠️ 추출 오류: {str(e)[:50]}")
    
    return result


def run_extraction():
    """전체 기관 담당자 정보 추출 실행"""
    print(f"🔍 {len(AGENCIES)}개 기관 담당자 정보 추출 시작...")
    print(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport={'width': 1280, 'height': 1024}
        )
        page = context.new_page()
        
        for idx, agency in enumerate(AGENCIES, 1):
            print(f"\n[{idx}/{len(AGENCIES)}] {agency['name']} 분석 중...")
            
            try:
                page.goto(agency['url'], timeout=30000, wait_until='domcontentloaded')
                time.sleep(2)
                
                # 첫 번째 기사 클릭하여 상세 페이지로 이동
                first_link = page.locator('td.subject a, td.title a, a.title, a[href*="view"]').first
                if first_link.count() > 0:
                    try:
                        first_link.click()
                        time.sleep(2)
                    except:
                        pass
                
                # 담당자 정보 추출
                contact = extract_contact_from_page(page)
                
                results.append({
                    'region_code': agency['region_code'],
                    'name': agency['name'],
                    'url': agency['url'],
                    'contact_department': contact['department'],
                    'contact_person': contact['person'],
                    'contact_phone': contact['phone'],
                    'contact_email': contact['email'],
                    'extracted_at': datetime.now().isoformat(),
                })
                
                # 결과 출력
                if contact['phone'] or contact['department']:
                    print(f"   ✅ 담당: {contact['department'] or '?'}, 전화: {contact['phone'] or '?'}")
                else:
                    print(f"   ⚠️ 담당자 정보 찾지 못함")
                
            except Exception as e:
                print(f"   ❌ 오류: {str(e)[:50]}")
                results.append({
                    'region_code': agency['region_code'],
                    'name': agency['name'],
                    'url': agency['url'],
                    'error': str(e)[:100],
                    'extracted_at': datetime.now().isoformat(),
                })
            
            time.sleep(1)  # 부하 방지
        
        browser.close()
    
    # 결과 저장
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # 요약
    success_count = sum(1 for r in results if r.get('contact_phone') or r.get('contact_department'))
    print(f"\n✅ 추출 완료!")
    print(f"   - 성공: {success_count}개")
    print(f"   - 실패: {len(results) - success_count}개")
    print(f"   - 결과 파일: {OUTPUT_FILE}")
    print(f"\n💡 결과 파일을 검토한 후, 관리자 페이지에서 수동으로 입력하세요.")


if __name__ == "__main__":
    run_extraction()

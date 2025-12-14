# -*- coding: utf-8 -*-
"""
스크래퍼 일괄 수정 스크립트
- content_validator 모듈 import 추가
- 기존 개별 패턴 코드 clean_content() 호출로 교체
"""

import os
import re

SCRAPERS_DIR = os.path.dirname(os.path.abspath(__file__))

# 수정할 스크래퍼 목록 (광양시 제외)
SCRAPERS = [
    # 광역/도
    'gwangju/gwangju_scraper.py',
    'jeonnam/jeonnam_scraper.py',
    # 시 (광양시 제외)
    'mokpo/mokpo_scraper.py',
    'yeosu/yeosu_scraper.py',
    'suncheon/suncheon_scraper.py',
    'naju/naju_scraper.py',
    # 군
    'damyang/damyang_scraper.py',
    'gokseong/gokseong_scraper.py',
    'gurye/gurye_scraper.py',
    'goheung/goheung_scraper.py',
    'boseong/boseong_scraper.py',
    'hwasun/hwasun_scraper.py',
    'jangheung/jangheung_scraper.py',
    'gangjin/gangjin_scraper.py',
    'haenam/haenam_scraper.py',
    'yeongam/yeongam_scraper.py',
    'muan/muan_scraper.py',
    'hampyeong/hampyeong_scraper.py',
    'yeonggwang/yeonggwang_scraper.py',
    'jangseong/jangseong_scraper.py',
    'wando/wando_scraper.py',
    'jindo/jindo_scraper.py',
    'shinan/shinan_scraper.py',
    # 교육청
    'gwangju_edu/gwangju_edu_scraper.py',
    'jeonnam_edu/jeonnam_edu_scraper.py',
]

# import 추가 패턴
IMPORT_LINE = "from utils.content_validator import clean_content, validate_article"

def add_import(content: str) -> str:
    """content_validator import 추가"""
    if 'content_validator' in content:
        return content  # 이미 있음
    
    # api_client import 다음에 추가
    patterns = [
        r'(from utils\.api_client import[^\n]+\n)',
        r'(from utils\.local_image_saver import[^\n]+\n)',
        r'(from utils\.scraper_utils import[^\n]+\n)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            return content[:insert_pos] + IMPORT_LINE + '\n' + content[insert_pos:]
    
    return content

def replace_patterns_with_clean_content(content: str) -> str:
    """기존 개별 패턴 코드를 clean_content() 호출로 교체"""
    
    # 패턴 1: patterns_to_remove 배열 + for 루프
    pattern1 = r'# 메타정보 제거.*?patterns_to_remove\s*=\s*\[.*?\].*?for pattern in patterns_to_remove:.*?content = re\.sub\(pattern.*?\n'
    
    # 패턴 2: 단순 re.sub 연속 호출
    pattern2 = r"content = re\.sub\(r'(등록일|작성자|조회수|담당부서|연락처|전화번호|첨부파일).*?', '', content\)\n"
    
    # 패턴 3: 연속 공백 정리 (clean_content에서 처리하므로 제거)
    pattern3 = r"content = re\.sub\(r'\\\\n\{3,\}', '\\\\n\\\\n', content\)\n"
    
    # 교체 시도 - 복잡한 패턴은 수동 처리 필요
    result = content
    
    # 간단한 교체만 시도
    old_pattern = r"content = content\.strip\(\)\[:5000\]"
    if old_pattern in result and 'clean_content' not in result:
        result = result.replace(
            "content = content.strip()[:5000]",
            "content = clean_content(content)"
        )
    
    return result

def update_version(content: str) -> str:
    """버전 번호 업데이트"""
    # 버전 숫자 찾아서 +0.1
    def increment_version(match):
        version = match.group(1)
        try:
            parts = version.split('.')
            if len(parts) >= 2:
                major = int(parts[0].lstrip('v'))
                minor = int(parts[1]) + 1
                return f'v{major}.{minor}'
        except:
            pass
        return version
    
    result = re.sub(r'버전:\s*(v?\d+\.\d+)', lambda m: f"버전: {increment_version(m)}", content, count=1)
    return result

def process_scraper(filepath: str) -> dict:
    """스크래퍼 파일 처리"""
    result = {'path': filepath, 'status': 'skipped', 'changes': []}
    
    if not os.path.exists(filepath):
        result['status'] = 'not_found'
        return result
    
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    
    modified = original
    
    # 1. import 추가
    if 'content_validator' not in modified:
        modified = add_import(modified)
        result['changes'].append('import 추가')
    
    # 2. 패턴 교체 (간단한 경우만)
    if 'content.strip()[:5000]' in modified and 'clean_content(content)' not in modified:
        modified = replace_patterns_with_clean_content(modified)
        result['changes'].append('clean_content() 적용')
    
    # 3. 버전 업데이트
    if result['changes']:
        modified = update_version(modified)
        result['changes'].append('버전 업데이트')
    
    # 저장
    if modified != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)
        result['status'] = 'modified'
    else:
        result['status'] = 'already_applied'
    
    return result

def main():
    print("=" * 60)
    print("content_validator 모듈 일괄 적용 스크립트")
    print("=" * 60)
    
    results = []
    
    for scraper in SCRAPERS:
        filepath = os.path.join(SCRAPERS_DIR, scraper)
        result = process_scraper(filepath)
        results.append(result)
        
        status_icon = {
            'modified': '[OK]',
            'already_applied': '[SKIP]',
            'not_found': '[ERR]',
            'skipped': '[SKIP]'
        }.get(result['status'], '[?]')
        
        print(f"{status_icon} {scraper}")
        if result['changes']:
            print(f"    -> {', '.join(result['changes'])}")
    
    # 요약
    print("\n" + "=" * 60)
    print("요약")
    print("=" * 60)
    modified = sum(1 for r in results if r['status'] == 'modified')
    skipped = sum(1 for r in results if r['status'] in ['already_applied', 'skipped'])
    errors = sum(1 for r in results if r['status'] == 'not_found')
    
    print(f"수정됨: {modified}")
    print(f"스킵됨: {skipped}")
    print(f"오류: {errors}")
    
    # 수동 처리 필요한 파일 목록
    print("\n[주의] 복잡한 패턴은 수동 확인 필요")

if __name__ == '__main__':
    main()

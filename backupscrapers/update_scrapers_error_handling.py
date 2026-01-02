# -*- coding: utf-8 -*-
"""
스크래퍼 일괄 수정 스크립트
- ErrorCollector import 추가
- fetch_detail 반환값에 error_reason 추가
- collect_articles에서 ErrorCollector 사용

사용법:
    python update_scrapers_error_handling.py [--dry-run]
"""

import os
import re
import sys
from pathlib import Path

# 수정 대상 스크래퍼 목록 (jeonnam은 이미 완료)
SCRAPERS_TO_UPDATE = [
    'boseong', 'damyang', 'gangjin', 'goheung', 'gokseong', 'gurye',
    'gwangju', 'gwangju_edu', 'gwangyang', 'haenam', 'hampyeong', 'hwasun',
    'jangheung', 'jangseong', 'jeonnam_edu', 'jindo',
    'mokpo', 'muan', 'naju', 'shinan', 'suncheon',
    'wando', 'yeongam', 'yeonggwang', 'yeosu'
]

def get_scraper_path(region: str) -> Path:
    """스크래퍼 파일 경로 반환"""
    base = Path(__file__).parent
    return base / region / f"{region}_scraper.py"


def add_error_collector_import(content: str) -> str:
    """ErrorCollector import 추가"""
    if 'from utils.error_collector import ErrorCollector' in content:
        return content  # 이미 있음
    
    # cloudinary_uploader import 다음에 추가
    pattern = r'(from utils\.cloudinary_uploader import.*\n)'
    replacement = r'\1from utils.error_collector import ErrorCollector\n'
    return re.sub(pattern, replacement, content)


def update_fetch_detail_signature(content: str) -> str:
    """fetch_detail 반환 타입에 Optional[str] 추가 (error_reason)"""
    # 다양한 패턴 처리
    patterns = [
        # 3개 반환 -> 4개
        (r'def fetch_detail\(([^)]+)\) -> Tuple\[str, Optional\[str\], str\]:',
         r'def fetch_detail(\1) -> Tuple[str, Optional[str], str, Optional[str]]:'),
        # 이미 4개 또는 5개인 경우는 마지막에 Optional[str] 추가가 필요한지 체크
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    return content


def analyze_scraper(filepath: Path) -> dict:
    """스크래퍼 분석"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # fetch_detail 반환값 개수 파악
    match = re.search(r'def fetch_detail[^)]+\) -> Tuple\[([^\]]+)\]:', content)
    if match:
        return_types = match.group(1).split(',')
        return_count = len(return_types)
    else:
        return_count = 0
    
    # ErrorCollector import 여부
    has_import = 'from utils.error_collector import ErrorCollector' in content
    
    # 현재 fallback 패턴 사용 여부
    has_fallback = 'thumbnail_url = original_image_url' in content or \
                   'thumbnail = img_url' in content or \
                   '원본 URL 사용' in content
    
    return {
        'path': filepath,
        'return_count': return_count,
        'has_import': has_import,
        'has_fallback': has_fallback,
        'needs_update': not has_import or has_fallback
    }


def main():
    dry_run = '--dry-run' in sys.argv
    
    print("=" * 60)
    print("스크래퍼 에러 처리 일괄 수정 스크립트")
    print("=" * 60)
    
    if dry_run:
        print("[DRY-RUN MODE] 실제 수정하지 않습니다.\n")
    
    results = []
    for region in SCRAPERS_TO_UPDATE:
        filepath = get_scraper_path(region)
        if filepath.exists():
            info = analyze_scraper(filepath)
            results.append((region, info))
            status = "수정 필요" if info['needs_update'] else "완료됨"
            print(f"[{region}] 반환값: {info['return_count']}개, import: {info['has_import']}, fallback: {info['has_fallback']} -> {status}")
        else:
            print(f"[{region}] 파일 없음: {filepath}")
    
    print("\n" + "=" * 60)
    needs_update = [r for r in results if r[1]['needs_update']]
    print(f"총 {len(results)}개 중 {len(needs_update)}개 수정 필요")
    print("=" * 60)


if __name__ == '__main__':
    main()

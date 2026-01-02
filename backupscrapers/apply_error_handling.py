# -*- coding: utf-8 -*-
"""
스크래퍼 일괄 수정 스크립트 v2
- ErrorCollector import 추가
- fetch_detail 반환값에 error_reason 추가
- 이미지 없으면 스킵 로직 추가
- collect_articles에 ErrorCollector 통합

사용법:
    python apply_error_handling.py
"""

import os
import re
from pathlib import Path

# 수정 대상 스크래퍼 목록 (jeonnam, boseong은 이미 완료)
SCRAPERS_TO_UPDATE = [
    'damyang', 'gangjin', 'goheung', 'gokseong', 'gurye',
    'gwangju', 'gwangju_edu', 'gwangyang', 'haenam', 'hampyeong', 'hwasun',
    'jangheung', 'jangseong', 'jeonnam_edu', 'jindo',
    'mokpo', 'muan', 'naju', 'shinan', 'suncheon',
    'wando', 'yeongam', 'yeonggwang', 'yeosu'
]

BASE_DIR = Path(__file__).parent


def update_scraper(region: str) -> bool:
    """단일 스크래퍼 수정"""
    filepath = BASE_DIR / region / f"{region}_scraper.py"
    
    if not filepath.exists():
        print(f"[{region}] 파일 없음: {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. ErrorCollector import 추가
        if 'from utils.error_collector import ErrorCollector' not in content:
            # cloudinary_uploader 또는 category 관련 import 다음에 추가
            patterns = [
                (r'(from utils\.cloudinary_uploader import[^\n]+\n)', r'\1from utils.error_collector import ErrorCollector\n'),
                (r'(from utils\.category_utils import[^\n]+\n)', r'\1from utils.error_collector import ErrorCollector\n'),
                (r'(from utils\.category_detector import[^\n]+\n)', r'\1from utils.error_collector import ErrorCollector\n'),
            ]
            for pattern, replacement in patterns:
                if re.search(pattern, content):
                    content = re.sub(pattern, replacement, content, count=1)
                    break
        
        # 2. fetch_detail 반환 타입에 Optional[str] 추가 (error_reason)
        # 다양한 패턴 처리
        # 3개 반환 -> 4개
        content = re.sub(
            r'(def fetch_detail\([^)]+\) -> Tuple\[str, Optional\[str\], str\]):',
            r'\1 -> Tuple[str, Optional[str], str, Optional[str]]:',
            content
        )
        # 4개 반환 -> 5개 (없으면 추가)
        content = re.sub(
            r'(def fetch_detail\([^)]+\) -> Tuple\[str, Optional\[str\], str, Optional\[str\]\]):',
            r'def fetch_detail(\1) -> Tuple[str, Optional[str], str, Optional[str], Optional[str]]:',
            content
        )
        
        # 수정 확인
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[{region}] import 추가 완료")
            return True
        else:
            print(f"[{region}] 변경 없음 (이미 수정됨 또는 패턴 불일치)")
            return False
            
    except Exception as e:
        print(f"[{region}] 오류: {e}")
        return False


def main():
    print("=" * 60)
    print("스크래퍼 에러 처리 일괄 수정 스크립트 v2")
    print("=" * 60)
    
    success_count = 0
    for region in SCRAPERS_TO_UPDATE:
        if update_scraper(region):
            success_count += 1
    
    print("=" * 60)
    print(f"완료: {success_count}/{len(SCRAPERS_TO_UPDATE)}개 수정")
    print("=" * 60)
    print("\n[NOTE] 이 스크립트는 import만 추가합니다.")
    print("fetch_detail 반환값 및 collect_articles 수정은 수동 작업 필요.")


if __name__ == '__main__':
    main()

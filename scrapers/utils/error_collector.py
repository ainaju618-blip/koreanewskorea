# -*- coding: utf-8 -*-
"""
ErrorCollector - 스크래핑 에러 수집 및 요약 보고 유틸리티
- 스크래핑 중 발생한 에러를 수집
- 작업 완료 시 콘솔에 요약 보고 출력
- 최종수정: 2025-12-21
"""

from typing import Dict, List, Optional
from collections import Counter


class ErrorCollector:
    """스크래핑 에러 수집기"""
    
    # 에러 타입 상수
    CLOUDINARY_FAIL = 'CLOUDINARY_FAIL'
    IMAGE_MISSING = 'IMAGE_MISSING'
    CONTENT_EMPTY = 'CONTENT_EMPTY'
    VALIDATION_FAIL = 'VALIDATION_FAIL'
    PARSE_ERROR = 'PARSE_ERROR'
    NETWORK_ERROR = 'NETWORK_ERROR'
    
    def __init__(self, region_code: str, region_name: str):
        self.region_code = region_code
        self.region_name = region_name
        self.errors: List[Dict] = []
        self.success_count = 0
        self.skip_count = 0
        self.total_processed = 0
    
    def add_error(self, error_type: str, title: str, url: str, reason: str = ''):
        """
        에러 기록 추가
        
        Args:
            error_type: 에러 유형 (CLOUDINARY_FAIL, CONTENT_EMPTY 등)
            title: 기사 제목
            url: 기사 URL
            reason: 상세 에러 사유 (선택)
        """
        self.errors.append({
            'type': error_type,
            'title': title[:50] if title else 'Unknown',
            'url': url,
            'reason': reason[:100] if reason else ''
        })
        self.skip_count += 1
    
    def add_success(self):
        """성공 카운트 증가"""
        self.success_count += 1
    
    def increment_processed(self):
        """처리 카운트 증가"""
        self.total_processed += 1
    
    def get_summary(self) -> Dict:
        """
        에러 요약 반환
        
        Returns:
            dict: {
                'total_errors': int,
                'by_type': {'CLOUDINARY_FAIL': 3, ...},
                'details': [첫 10개 에러]
            }
        """
        type_counter = Counter(e['type'] for e in self.errors)
        return {
            'total_errors': len(self.errors),
            'by_type': dict(type_counter),
            'details': self.errors[:10]
        }
    
    def print_report(self):
        """콘솔에 에러 요약 보고 출력"""
        summary = self.get_summary()
        
        print("\n" + "=" * 50)
        print(f"[{self.region_name}] 스크래핑 완료 보고")
        print("=" * 50)
        print(f"  처리: {self.total_processed}건 / 저장: {self.success_count}건 / 스킵: {self.skip_count}건")
        
        if summary['total_errors'] > 0:
            print(f"\n[에러 요약] 총 {summary['total_errors']}건")
            for err_type, count in summary['by_type'].items():
                print(f"  - {err_type}: {count}건")
            
            # 상세 내역 (최대 5건만)
            if summary['details']:
                print(f"\n[상세 내역 (최대 5건)]")
                for i, err in enumerate(summary['details'][:5], 1):
                    print(f"  {i}. [{err['type']}] {err['title'][:30]}...")
                    if err['reason']:
                        print(f"     사유: {err['reason'][:50]}")
        else:
            print("\n  [OK] 모든 기사가 정상 처리되었습니다.")
        
        print("=" * 50 + "\n")
    
    def has_errors(self) -> bool:
        """에러가 있는지 확인"""
        return len(self.errors) > 0
    
    def get_error_message(self) -> str:
        """log_to_server용 에러 메시지 생성"""
        summary = self.get_summary()
        if not self.has_errors():
            return f"완료: {self.success_count}건 저장"
        
        parts = [f"완료: {self.success_count}건 저장, {self.skip_count}건 스킵"]
        for err_type, count in summary['by_type'].items():
            parts.append(f"{err_type}:{count}")
        return " / ".join(parts)

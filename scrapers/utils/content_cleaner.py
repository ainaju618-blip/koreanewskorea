"""
본문 정리 공통 모듈
- 버전: v1.0
- 최종수정: 2025-12-14
- 담당: AI Agent

기능:
- 스크래핑된 본문에서 메타데이터 제거
- 줄바꿈, 공백 정리
- 모든 스크래퍼에서 공통으로 사용
"""

import re
from typing import Optional


# ============================================================
# 제거할 메타데이터 패턴
# ============================================================
METADATA_PATTERNS = [
    # 기본 메타데이터
    r'조회수?\s*[:：]?\s*\d+',
    r'조회\s*[:：]\s*\d+',
    r'추천수?\s*[:：]?\s*\d+',
    r'작성일\s*[:：]?\s*[\d\-\.]+',
    r'등록일\s*[:：]?\s*[\d\-\.]+',
    r'작성자\s*[:：]?\s*[^\s\n]+',
    r'수정일\s*[:：]?\s*[\d\-\.]+',
    
    # 날짜 형식 (본문 중간 날짜는 유지할 수 있으므로 선택적)
    # r'\d{4}-\d{2}-\d{2}',
    
    # 기관/담당자 정보
    r'기관명\s*[:：]\s*[^\n]+',
    r'기관주소\s*[:：]\s*[^\n]+',
    r'담당자\s*[:：]\s*[^\n]+',
    r'담당부서\s*[:：]\s*[^\n]+',
    r'전화번호\s*[:：]?\s*[\d\-]+',
    r'연락처\s*[:：]?\s*[\d\-]+',
    
    # 첨부파일 관련
    r'첨부파일\s*\(?\d*\)?',
    r'첨부\s*[:：]?\s*\d*개?',
    r'▲\s*\d+\.\s*\[[^\]]*\][^\n]*',  # ▲ 1.[사진1] 형태
    r'\[\s*사진\d*\s*\][^\n]*',  # [사진1] 형태
    r'<사진\d*>[^\n]*',  # <사진1> 형태
    
    # 저작권/푸터 관련
    r'개인정보처리방침.*',
    r'공공누리.*',
    r'출처\s*[:：]?\s*[^\n]*표시[^\n]*',
]


def clean_content(content: str, max_length: int = 5000, extra_patterns: list = None) -> str:
    """
    본문 텍스트를 정리합니다.
    
    Args:
        content: 원본 본문 텍스트
        max_length: 최대 길이 (기본 5000자)
        extra_patterns: 추가로 제거할 정규식 패턴 리스트 (선택)
        
    Returns:
        정리된 본문 텍스트
    """
    if not content:
        return ""
    
    # 1. 메타데이터 패턴 제거
    all_patterns = METADATA_PATTERNS.copy()
    if extra_patterns:
        all_patterns.extend(extra_patterns)
    
    for pattern in all_patterns:
        try:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)
        except re.error:
            # 잘못된 정규식 패턴 무시
            pass
    
    # 2. 줄바꿈 정리 (2줄 이상 → 1줄)
    content = re.sub(r'\n{2,}', '\n', content)
    
    # 3. 연속 공백 정리
    content = re.sub(r'[ \t]+', ' ', content)
    
    # 4. 각 줄 앞뒤 공백 제거
    lines = [line.strip() for line in content.split('\n')]
    content = '\n'.join(line for line in lines if line)  # 빈 줄 제거
    
    # 5. 최종 정리 및 길이 제한
    content = content.strip()
    if len(content) > max_length:
        content = content[:max_length]
    
    return content


def remove_date_from_content(content: str) -> str:
    """
    본문에서 날짜 형식을 제거합니다.
    (본문 앞부분의 날짜만 제거하고 싶을 때 사용)
    
    Args:
        content: 원본 본문 텍스트
        
    Returns:
        날짜가 제거된 본문 텍스트
    """
    if not content:
        return ""
    
    # 본문 시작 부분의 날짜만 제거
    content = re.sub(r'^\s*\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*', '', content)
    return content.strip()


def extract_clean_text(html_content: str) -> str:
    """
    HTML에서 텍스트만 추출하고 정리합니다.
    
    Args:
        html_content: HTML 문자열
        
    Returns:
        정리된 텍스트
    """
    if not html_content:
        return ""
    
    # HTML 태그 제거
    text = re.sub(r'<[^>]+>', ' ', html_content)
    
    # HTML 엔티티 변환
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    
    # 정리
    return clean_content(text)


# ============================================================
# Alias for compatibility with different import paths
# ============================================================
# scraper_utils.py의 clean_article_content를 사용하는 스크래퍼를 위한 alias
from utils.scraper_utils import clean_article_content

__all__ = ['clean_content', 'remove_date_from_content', 'extract_clean_text', 'clean_article_content']

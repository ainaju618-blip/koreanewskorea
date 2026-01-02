"""
content_validator.py - 스크래퍼 공통 콘텐츠 검증 및 정제 모듈
Version: 1.0
Created: 2025-12-14

모든 스크래퍼에서 공통으로 사용하는 본문 정제 및 품질 검증 로직.
새로운 오염 패턴 발견 시 이 파일만 수정하면 전체 스크래퍼에 적용됨.
"""

import re
from typing import Optional, Tuple

# ============================================================
# 메타정보 제거 패턴 (공통)
# - 새로운 패턴 발견 시 여기에 추가
# ============================================================

META_PATTERNS = [
    # 담당부서/담당자 정보
    r'담당부서\s*[:：]?\s*[^\n]+',
    r'담당자\s*[:：]?\s*[^\n]+',
    r'기관명\s*[:：]?\s*[^\n]+',

    # 연락처 정보
    r'연락처\s*[:：]?\s*[\d\-\s\(\)]+',
    r'전화번호\s*[:：]?\s*[\d\-\s\(\)]+',
    r'전화\s*[:：]?\s*[\d\-\s\(\)]+',
    r'팩스\s*[:：]?\s*[\d\-\s\(\)]+',
    r'FAX\s*[:：]?\s*[\d\-\s\(\)]+',

    # 전화번호 패턴 (독립적으로 있는 경우)
    r'(?<!\d)\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}(?!\d)',

    # 조회수/통계 정보
    r'조회수?\s*[:：]?\s*\d+',
    r'조회\s*[:：]\s*\d+',
    r'읽음\s*[:：]?\s*\d+',
    r'클릭\s*[:：]?\s*\d+',

    # 날짜 메타정보 (본문 시작부분에 있는 경우)
    r'^작성일\s*[:：]?\s*[\d\-\.\/]+\s*',
    r'^등록일\s*[:：]?\s*[\d\-\.\/]+\s*',
    r'^수정일\s*[:：]?\s*[\d\-\.\/]+\s*',
    r'^게시일\s*[:：]?\s*[\d\-\.\/]+\s*',

    # 이메일 (연락처 맥락에서)
    r'이메일\s*[:：]?\s*\S+@\S+',
    r'E-?mail\s*[:：]?\s*\S+@\S+',

    # 기타 메타정보
    r'출처\s*[:：]?\s*[^\n]+',
    r'문의\s*[:：]?\s*[^\n]+',
]

# 본문 최소/최대 길이
MIN_CONTENT_LENGTH = 300  # 최소 300자 (SEO 권장 - 짧은 기사 제외)
MAX_CONTENT_LENGTH = 5000  # 최대 5000자

# 제목 필터링 키워드 (이 키워드가 포함된 기사는 제외)
EXCLUDED_TITLE_KEYWORDS = [
    '[포토]',
    '[인사]',
    '[부고]',
    '[동정]',
    '[게시판]',
]


def clean_content(content: str) -> str:
    """
    본문에서 메타정보를 제거하고 정제된 텍스트 반환

    Args:
        content: 원본 본문 텍스트

    Returns:
        정제된 본문 텍스트
    """
    if not content:
        return ""

    cleaned = content

    # 모든 메타 패턴 제거
    for pattern in META_PATTERNS:
        cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.IGNORECASE)

    # 연속된 공백/줄바꿈 정리
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)  # 3줄 이상 -> 2줄
    cleaned = re.sub(r'[ \t]{2,}', ' ', cleaned)  # 연속 공백 -> 1개
    cleaned = cleaned.strip()

    # 최대 길이 제한
    if len(cleaned) > MAX_CONTENT_LENGTH:
        cleaned = cleaned[:MAX_CONTENT_LENGTH] + '...'

    return cleaned


def validate_content(content: str) -> Tuple[bool, str]:
    """
    본문 품질 검증

    Args:
        content: 검증할 본문 텍스트

    Returns:
        (통과여부, 실패사유)
    """
    if not content:
        return False, "본문이 비어있음"

    if len(content) < MIN_CONTENT_LENGTH:
        return False, f"본문이 너무 짧음 ({len(content)}자 < {MIN_CONTENT_LENGTH}자)"

    # 의미없는 반복 텍스트 감지
    if re.search(r'(.{10,})\1{3,}', content):
        return False, "반복 텍스트 감지"

    return True, ""


def validate_article(article: dict, require_image: bool = True) -> Tuple[bool, str]:
    """
    기사 전체 품질 검증

    Args:
        article: 기사 딕셔너리 {'title', 'content', 'thumbnail', ...}
        require_image: 이미지 필수 여부 (기본값: True - SEO 권장)

    Returns:
        (통과여부, 실패사유)
    """
    # 제목 검증
    title = article.get('title', '')
    if not title or len(title) < 5:
        return False, "제목이 없거나 너무 짧음"

    # 제목 키워드 필터링 (SEO 권장 - 저품질 기사 제외)
    for keyword in EXCLUDED_TITLE_KEYWORDS:
        if keyword in title:
            return False, f"제외 키워드 포함: {keyword}"

    # 본문 검증
    content = article.get('content', '')
    is_valid, reason = validate_content(content)
    if not is_valid:
        return False, reason

    # 이미지 검증 (기본값: 필수 - SEO 권장)
    if require_image:
        thumbnail = article.get('thumbnail') or article.get('thumbnail_url')
        if not thumbnail:
            return False, "이미지가 없음"

    return True, ""


def process_article(article: dict) -> dict:
    """
    기사 전처리 - 정제 + 검증을 한번에 수행

    Args:
        article: 원본 기사 딕셔너리

    Returns:
        정제된 기사 딕셔너리 (검증 실패 시 '_valid': False 추가)
    """
    result = article.copy()

    # 본문 정제
    if 'content' in result:
        result['content'] = clean_content(result['content'])

    # 제목 정제 (공백 정리)
    if 'title' in result:
        result['title'] = ' '.join(result['title'].split())

    # 검증
    is_valid, reason = validate_article(result)
    result['_valid'] = is_valid
    result['_validation_reason'] = reason if not is_valid else ""

    return result


# ============================================================
# 사용 예시
# ============================================================
#
# from utils.content_validator import clean_content, validate_article, process_article
#
# # 방법 1: 본문만 정제
# content = clean_content(raw_content)
#
# # 방법 2: 기사 전체 처리
# article = process_article({
#     'title': '제목',
#     'content': '본문...',
#     'thumbnail': 'https://...'
# })
# if article['_valid']:
#     save_article(article)
# else:
#     print(f"스킵: {article['_validation_reason']}")
#

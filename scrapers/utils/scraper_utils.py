"""
스크래퍼 안정화 유틸리티 모듈
- 재시도 로직, 동적 대기, Fallback 셀렉터 체인
"""

import time
import logging
from typing import Optional, List, Callable, Any
from playwright.sync_api import Page, Locator, TimeoutError as PlaywrightTimeout

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================
# 설정 상수
# ============================================================
MAX_RETRIES = 3
BASE_WAIT_MS = 2000  # 기본 대기 시간 (ms)
ELEMENT_TIMEOUT_MS = 10000  # 요소 대기 타임아웃 (ms)


def safe_goto(page: Page, url: str, retries: int = MAX_RETRIES, timeout: int = 30000) -> bool:
    """
    안전한 페이지 이동 (재시도 포함)
    
    변경점:
    - networkidle 대신 domcontentloaded 사용 (더 안정적)
    - 실패 시 exponential backoff로 재시도
    """
    for attempt in range(retries):
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=timeout)
            # 추가 안정화 대기
            time.sleep(BASE_WAIT_MS / 1000)
            return True
        except PlaywrightTimeout:
            wait_time = (attempt + 1) * 2
            logger.warning(f"[Retry {attempt+1}/{retries}] 페이지 로드 타임아웃: {url[:50]}... ({wait_time}초 후 재시도)")
            time.sleep(wait_time)
        except Exception as e:
            logger.error(f"[Retry {attempt+1}/{retries}] 페이지 로드 오류: {str(e)[:50]}")
            time.sleep(2)
    
    logger.error(f"❌ 페이지 로드 실패 (최대 재시도 초과): {url[:50]}...")
    return False


def wait_and_find(page: Page, selectors: List[str], timeout: int = ELEMENT_TIMEOUT_MS) -> Optional[Locator]:
    """
    Fallback 셀렉터 체인으로 요소 찾기
    
    여러 셀렉터를 순차 시도하여 첫 번째 성공한 것 반환
    """
    for selector in selectors:
        try:
            locator = page.locator(selector)
            # 요소가 실제로 존재하는지 대기
            locator.first.wait_for(timeout=timeout, state='attached')
            count = locator.count()
            if count > 0:
                logger.info(f"   ✅ 셀렉터 성공: '{selector}' ({count}개)")
                return locator
        except PlaywrightTimeout:
            logger.debug(f"   ⚪ 셀렉터 타임아웃: '{selector}'")
            continue
        except Exception as e:
            logger.debug(f"   ⚪ 셀렉터 실패: '{selector}' - {str(e)[:30]}")
            continue
    
    logger.warning(f"   ⚠️ 모든 셀렉터 실패: {selectors}")
    return None


def safe_get_text(locator: Locator, default: str = "") -> str:
    """안전한 텍스트 추출"""
    try:
        if locator.count() > 0:
            return locator.first.inner_text().strip()
    except:
        pass
    return default


def safe_get_attr(locator: Locator, attr: str, default: str = "") -> str:
    """안전한 속성 추출"""
    try:
        if locator.count() > 0:
            value = locator.first.get_attribute(attr)
            return value if value else default
    except:
        pass
    return default


def safe_click_and_wait(page: Page, locator: Locator, wait_ms: int = BASE_WAIT_MS) -> bool:
    """안전한 클릭 및 대기"""
    try:
        locator.click()
        time.sleep(wait_ms / 1000)
        return True
    except Exception as e:
        logger.warning(f"클릭 실패: {str(e)[:30]}")
        return False


def extract_with_fallback(page: Page, selectors: List[str], extract_fn: Callable[[Locator], Any]) -> Any:
    """
    Fallback 셀렉터 체인으로 데이터 추출
    
    Args:
        page: Playwright Page 객체
        selectors: 시도할 CSS 셀렉터 리스트 (우선순위 순)
        extract_fn: Locator를 받아 데이터를 추출하는 함수
    
    Returns:
        추출된 데이터 또는 None
    """
    for selector in selectors:
        try:
            locator = page.locator(selector)
            if locator.count() > 0:
                result = extract_fn(locator)
                if result:
                    return result
        except:
            continue
    return None


def collect_links_from_list(
    page: Page, 
    list_selectors: List[str],
    max_items: int = 10
) -> List[dict]:
    """
    목록 페이지에서 링크들을 안전하게 수집
    
    Returns:
        [{'title': str, 'href': str, 'date': str}, ...]
    """
    links = wait_and_find(page, list_selectors)
    if not links:
        return []
    
    results = []
    count = min(links.count(), max_items)
    
    for i in range(count):
        try:
            item = links.nth(i)
            
            # 텍스트 추출 (제목)
            title = safe_get_text(item)
            
            # href 추출
            href = safe_get_attr(item, 'href')
            
            if title and href:
                results.append({
                    'title': title,
                    'href': href,
                    'index': i
                })
        except Exception as e:
            logger.debug(f"링크 {i} 추출 실패: {str(e)[:30]}")
            continue
    
    return results


def log_scraper_result(region_name: str, total: int, images: int = 0):
    """스크래퍼 결과 로깅"""
    img_info = f" (이미지: {images}개)" if images else ""
    logger.info(f"✅ {region_name}: 총 {total}개 기사 수집 완료{img_info}")


# ============================================================
# 공통 셀렉터 패턴 (지자체 사이트 분석 기반)
# ============================================================

# 목록 페이지 링크 셀렉터들 (우선순위 순)
COMMON_LIST_SELECTORS = [
    'a[href*="boardView"]',
    'a[href*="idx="]',
    'a[href*="view"]',
    'td.title a',
    'td.subject a',
    '.board_list td a',
    'table tbody tr td a',
    'a.item_cont',
    '.list_item a',
]

# 본문 컨텐츠 셀렉터들
COMMON_CONTENT_SELECTORS = [
    'div.board_view_body',
    'div.board_view_cont',
    'div.view_content',
    'div.view_cont',
    'div.bbs_view_cont',
    'div.board_view',
    'article',
    '.content_view',
]

# 본문 이미지 셀렉터들
COMMON_IMAGE_SELECTORS = [
    'div.board_view_body img',
    'div.board_view_cont img',
    'div.view_content img',
    'div.view_cont img',
    'article img',
    '.content_view img',
]


# ============================================================
# 본문 정제 유틸리티 (v1.0)
# ============================================================
import re

def clean_article_content(content: str, max_length: int = 5000) -> str:
    """
    기사 본문에서 불필요한 메타데이터, 첨부파일 정보 등을 제거

    제거 대상:
    - 첨부파일 목록 (1.[사진1], 2.[홍보물], *.jpg, *.hwp 등)
    - 메타데이터 (조회수, 작성일, 작성자, 담당자 등)
    - 파일 크기/다운로드 정보 (123.45 KB, Hit: 0 등)
    - 기관 정보 (기관명, 전화번호 등)
    - 불필요한 공백/줄바꿈

    Args:
        content: 원본 본문 텍스트
        max_length: 최대 문자 수 (기본 5000자)

    Returns:
        정제된 본문 텍스트
    """
    if not content:
        return ""

    # 1. 첨부파일 관련 패턴 제거
    attachment_patterns = [
        # 번호.[파일명].확장자 (파일크기) Hit: N 형태
        r'^\d+\.\s*\[[^\]]*\][^\n]*\.(jpg|jpeg|png|gif|hwp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip)\s*\([^)]*\)\s*Hit:\s*\d+',
        r'\d+\.\s*\[[^\]]*\][^\n]*\.(jpg|jpeg|png|gif|hwp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip)\s*\([^)]*\)\s*Hit:\s*\d+',
        # 번호.[파일명] 형태 (한 줄 전체)
        r'^\d+\.\s*\[[^\]]*\]\s*[^\n]*$',
        # 파일명 (크기) Hit: N 형태
        r'[^\s]+\.(jpg|jpeg|png|gif|hwp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip)\s*\(\d+\.?\d*\s*(KB|MB|Kb|Mb|kb|mb)\)\s*Hit:\s*\d+',
        # 단순 파일 정보
        r'\(\d+\.?\d*\s*(KB|MB|Kb|Mb|kb|mb)\)\s*Hit:\s*\d+',
        # 첨부파일 (N개) 형태
        r'첨부파일\s*\(?\d*\)?',
        # [사진], [사진1], [홍보물] 등 캡션
        r'\[\s*사진\d*\s*\][^\n]*',
        r'\[\s*홍보물\d*\s*\][^\n]*',
        r'\[\s*보도자료\s*\][^\n]*',
        r'\[\s*포스터\s*\][^\n]*',
    ]

    # 2. 메타데이터 패턴 제거
    metadata_patterns = [
        # 조회/추천 정보
        r'조회수?\s*[:]\s*\d+',
        r'조회\s*[:]\s*\d+',
        r'추천수?\s*[:]\s*\d+',
        r'추천\s*[:]\s*\d+',
        # 날짜/작성자 정보
        r'작성일\s*[:]\s*[\d\-\.\/]+',
        r'등록일\s*[:]\s*[\d\-\.\/]+',
        r'수정일\s*[:]\s*[\d\-\.\/]+',
        r'작성자\s*[:]\s*[^\s\n]+',
        r'담당자\s*[:]\s*[^\n]+',
        # 기관 정보
        r'기관명\s*[:]\s*[^\n]+',
        r'기관주소\s*[:]\s*[^\n]+',
        r'전화번호\s*[:]\s*[\d\-]+',
        r'팩스\s*[:]\s*[\d\-]+',
        r'문의\s*[:]\s*[^\n]+',
        # 업무담당자 정보 (예: 업무담당자 창평면사무소 조경화 061-380-3801)
        r'업무담당자\s*[^\n]+',
        r'\([업업무무담담당당자자]?\s*[가-힣]+\s*[가-힣]+\s*[\d\-]+\)',
    ]

    # 3. 기타 불필요한 패턴
    misc_patterns = [
        # 사진 캡션 패턴
        r'사진\s*[:]\s*[^\n]+',
        r'▲\s*[^\n]+',  # ▲ 로 시작하는 사진 캡션
        r'△\s*[^\n]+',  # △ 로 시작하는 사진 캡션
        # 저작권/면책 문구
        r'개인정보처리방침.*',
        r'Copyright.*',
        r'저작권.*',
        # 빈 번호만 있는 줄
        r'^\d+\.\s*$',
    ]

    # 모든 패턴 적용 (MULTILINE 모드)
    all_patterns = attachment_patterns + metadata_patterns + misc_patterns
    for pattern in all_patterns:
        content = re.sub(pattern, '', content, flags=re.MULTILINE | re.IGNORECASE)

    # 4. 공백/줄바꿈 정리
    # 3줄 이상 연속 줄바꿈 -> 2줄로
    content = re.sub(r'\n{3,}', '\n\n', content)
    # 연속 공백 정리
    content = re.sub(r'[ \t]+', ' ', content)
    # 각 줄 앞뒤 공백 제거
    lines = [line.strip() for line in content.split('\n')]
    content = '\n'.join(lines)
    # 빈 줄만 있는 경우 제거
    content = re.sub(r'\n\s*\n', '\n\n', content)

    # 5. 앞뒤 공백 제거 및 길이 제한
    content = content.strip()
    if len(content) > max_length:
        content = content[:max_length]

    return content


def extract_clean_text_from_html(html_content: str) -> str:
    """
    HTML에서 텍스트만 추출하고 정제

    Args:
        html_content: HTML 문자열

    Returns:
        정제된 텍스트
    """
    if not html_content:
        return ""

    # HTML 태그 제거 (간단한 방식)
    text = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)

    # HTML 엔티티 변환
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&amp;', '&')
    text = text.replace('&quot;', '"')

    # 본문 정제 적용
    return clean_article_content(text)

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

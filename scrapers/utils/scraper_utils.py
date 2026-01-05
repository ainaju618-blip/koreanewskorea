"""
Scraper Stabilization Utility Module
- Retry logic, dynamic wait, fallback selector chains
"""

import os
import time
import logging
from typing import Optional, List, Callable, Any
from playwright.sync_api import Page, Locator, TimeoutError as PlaywrightTimeout

# Logging setup - all logs go to logs/ folder
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'scraper_utils.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('ScraperUtils')

# ============================================================
# Configuration Constants
# ============================================================
MAX_RETRIES = 3
BASE_WAIT_MS = 2000  # Base wait time (ms)
ELEMENT_TIMEOUT_MS = 10000  # Element wait timeout (ms)


def safe_goto(page: Page, url: str, retries: int = MAX_RETRIES, timeout: int = 30000) -> bool:
    """
    Safe page navigation with retries.

    Notes:
    - Uses domcontentloaded instead of networkidle (more stable)
    - Retries with exponential backoff on failure
    """
    for attempt in range(retries):
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=timeout)
            # Additional stabilization wait
            time.sleep(BASE_WAIT_MS / 1000)
            return True
        except PlaywrightTimeout:
            wait_time = (attempt + 1) * 2
            logger.warning(f"[Retry {attempt+1}/{retries}] Page load timeout: {url[:50]}... (retry in {wait_time}s)")
            time.sleep(wait_time)
        except Exception as e:
            logger.error(f"[Retry {attempt+1}/{retries}] Page load error: {str(e)[:50]}")
            time.sleep(2)

    logger.error(f"[FAIL] Page load failed (max retries exceeded): {url[:50]}...")
    return False


def wait_and_find(page: Page, selectors: List[str], timeout: int = ELEMENT_TIMEOUT_MS) -> Optional[Locator]:
    """
    Find element using fallback selector chain.

    Tries multiple selectors sequentially, returns first successful match.
    """
    for selector in selectors:
        try:
            locator = page.locator(selector)
            # Wait for element to actually exist
            locator.first.wait_for(timeout=timeout, state='attached')
            count = locator.count()
            if count > 0:
                logger.info(f"   [OK] Selector success: '{selector}' ({count} items)")
                return locator
        except PlaywrightTimeout:
            logger.debug(f"   [-] Selector timeout: '{selector}'")
            continue
        except Exception as e:
            logger.debug(f"   [-] Selector failed: '{selector}' - {str(e)[:30]}")
            continue

    logger.warning(f"   [WARN] All selectors failed: {selectors}")
    return None


def safe_get_text(locator: Locator, default: str = "") -> str:
    """Safe text extraction from locator."""
    try:
        if locator.count() > 0:
            return locator.first.inner_text().strip()
    except:
        pass
    return default


def safe_get_attr(locator: Locator, attr: str, default: str = "") -> str:
    """Safe attribute extraction from locator."""
    try:
        if locator.count() > 0:
            value = locator.first.get_attribute(attr)
            return value if value else default
    except:
        pass
    return default


def safe_click_and_wait(page: Page, locator: Locator, wait_ms: int = BASE_WAIT_MS) -> bool:
    """Safe click with wait."""
    try:
        locator.click()
        time.sleep(wait_ms / 1000)
        return True
    except Exception as e:
        logger.warning(f"Click failed: {str(e)[:30]}")
        return False


def extract_with_fallback(page: Page, selectors: List[str], extract_fn: Callable[[Locator], Any]) -> Any:
    """
    Extract data using fallback selector chain.

    Args:
        page: Playwright Page object
        selectors: List of CSS selectors to try (in priority order)
        extract_fn: Function that takes Locator and extracts data

    Returns:
        Extracted data or None
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
    Safely collect links from list page.

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

            # Extract text (title)
            title = safe_get_text(item)

            # Extract href
            href = safe_get_attr(item, 'href')

            if title and href:
                results.append({
                    'title': title,
                    'href': href,
                    'index': i
                })
        except Exception as e:
            logger.debug(f"Link {i} extraction failed: {str(e)[:30]}")
            continue

    return results


def log_scraper_result(region_name: str, total: int, images: int = 0):
    """Log scraper result summary."""
    img_info = f" (images: {images})" if images else ""
    logger.info(f"[OK] {region_name}: {total} articles collected{img_info}")


# ============================================================
# Common Selector Patterns (based on local government site analysis)
# ============================================================

# List page link selectors (in priority order)
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

# Content selectors
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

# Content image selectors
COMMON_IMAGE_SELECTORS = [
    'div.board_view_body img',
    'div.board_view_cont img',
    'div.view_content img',
    'div.view_cont img',
    'article img',
    '.content_view img',
]


# ============================================================
# Content Cleaning Utility (v1.2)
# ============================================================
import re

def clean_article_content(content: str, max_length: int = 5000) -> str:
    """
    Clean article content by removing metadata, attachments, and noise.

    Removes:
    - Attachment lists (1.[photo1], 2.[promo], *.jpg, *.hwp, etc.)
    - Metadata (view count, date, author, department info)
    - File size/download info (123.45 KB, Hit: 0, etc.)
    - Organization info (name, phone numbers)
    - Staff info (Manager Hong 123-4567 format)
    - Photo description sections
    - Copyright/public license notices
    - Navigation (next/prev article, print, list)
    - Excessive whitespace/newlines
    - Empty numbered lines (1. 2. 3. etc.)
    - Region-specific START lines (Gokseong, Jangseong, Hampyeong)

    Args:
        content: Original article text
        max_length: Maximum characters (default 5000)

    Returns:
        Cleaned article text
    """
    if not content:
        return ""

    # =================================================================
    # STEP 0: Remove START-of-content noise (region-specific first lines)
    # =================================================================
    lines = content.split('\n')

    # Gokseong: Remove first 4 lines (team name / time / department / title repeat)
    # Pattern: line starts with team name like "과수특작팀" or time like "16:05"
    gokseong_start_patterns = [
        r'^[가-힣]+(?:팀|과|실|센터)\s*$',  # Team/dept name only line
        r'^\d{1,2}:\d{2}\s*$',  # Time only line (16:05)
        r'^담당부서\s*$',  # "담당부서" only line
    ]

    # Jangseong: Remove first 3 lines (title / date | dept / bracket line)
    jangseong_start_patterns = [
        r'^\d{4}-\d{2}-\d{2}\s*\|\s*[가-힣]+',  # 2025-12-19 | 기획실
        r'^\[\s*$',  # Opening bracket only
    ]

    # Hampyeong: Remove first line if it's preview photo info (expanded patterns)
    hampyeong_start_patterns = [
        r'^미리보기\s*\(사진자료\)',
        r'^미리보기\s*\([^)]*사진[^)]*\)',
        r'^미리보기\s+\(사진자료\)\s*함평군',
    ]

    # Check and remove Gokseong first 4 lines pattern
    if len(lines) >= 4:
        matches = 0
        for i in range(min(4, len(lines))):
            for pattern in gokseong_start_patterns:
                if re.match(pattern, lines[i].strip()):
                    matches += 1
                    break
        if matches >= 2:  # At least 2 patterns matched in first 4 lines
            lines = lines[4:]

    # Check and remove Jangseong first 3 lines pattern
    if len(lines) >= 3:
        for pattern in jangseong_start_patterns:
            if re.match(pattern, lines[0].strip()) or re.match(pattern, lines[1].strip()):
                lines = lines[3:]
                break

    # Check and remove Hampyeong first line (expanded)
    if len(lines) >= 1:
        for pattern in hampyeong_start_patterns:
            if re.match(pattern, lines[0].strip()):
                lines = lines[1:]
                break

    content = '\n'.join(lines)

    # =================================================================
    # STEP 1: Remove everything after photo description section
    # =================================================================
    section_cutoff_patterns = [
        r'[\u25C7\u25C6\u25CB\u25CF]\s*사진\s*설명.*',  # After diamond/circle + photo desc
        r'사진\s*설명\s*[:.]?.*',  # After photo description
    ]
    for pattern in section_cutoff_patterns:
        content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)

    # =================================================================
    # STEP 2: Attachment patterns
    # =================================================================
    attachment_patterns = [
        # Gwangju Edu format: N.[tag] filename.ext (size) Hit: N
        r'^\d+\s*\.\s*\[[^\]]+\][^\n]*\.(jpg|jpeg|png|gif|hwp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip)\s*\([^)]+\)\s*Hit\s*:\s*\d+',
        r'\d+\s*\.\s*\[[^\]]+\][^\n]*\.(jpg|jpeg|png|gif|hwp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip)\s*\([^)]+\)\s*Hit\s*:\s*\d+',
        # General filename.ext (size) Hit: N
        r'^[^\n]*\.(jpg|jpeg|png|gif|hwp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip)\s*\(\d+\.?\d*\s*(KB|MB|Kb|Mb|kb|mb)\)\s*Hit\s*:\s*\d+',
        # N.[filename] format (entire line)
        r'^\d+\s*\.\s*\[[^\]]+\][^\n]*$',
        # Simple file info (size) Hit: N
        r'\(\d+\.?\d*\s*(KB|MB|Kb|Mb|kb|mb)\)\s*Hit\s*:\s*\d+',
        # Attachment count
        r'첨부파일\s*\(?\d*\)?',
        # [photo], [photo1], [promo] captions (entire line)
        r'^\s*\[\s*사진\d*\s*\][^\n]*$',
        r'^\s*\[\s*홍보물\d*\s*\][^\n]*$',
        r'^\s*\[\s*보도자료\s*\][^\n]*$',
        r'^\s*\[\s*포스터\s*\][^\n]*$',
        # (N photos attached) format
        r'\([^)]*사진[^)]*\d*[^)]*장?[^)]*첨부[^)]*\)',
        r'^\s*\([^)]*\d*\s*장?\s*첨부\)\s*$',
        # Gurye: file.jpg (size KB) download: N download preview
        r'[^\s]+\.(jpg|jpeg|png|gif|hwp|pdf)\s*\(\d+\.?\d*\s*(KB|MB)\)\s*다운로드\s*:\s*\d+\s*다운로드\s*미리보기',
        r'[^\s]+\.(jpg|jpeg|png|gif|hwp|pdf)\s*\(\d+\.?\d*\s*(KB|MB)\)\s*다운로드\s*:\s*\d+',
        # Hampyeong: preview (photo) filename.jpg [size: X KB, Download: N]
        r'^미리보기\s*\([^)]*\)[^\n]*\[size:\s*[\d\.]+\s*KB[^\]]*\]',
        r'\[size:\s*[\d\.]+\s*(KB|MB)[^\]]*Download:\s*\d+\]',
    ]

    # =================================================================
    # STEP 3: Metadata patterns
    # =================================================================
    metadata_patterns = [
        # View/recommend counts
        r'조회수?\s*[:]\s*\d+',
        r'조회\s*[:]\s*\d+',
        r'추천수?\s*[:]\s*\d+',
        r'추천\s*[:]\s*\d+',
        # Date/author info
        r'작성일\s*[:]\s*[\d\-\.\/]+',
        r'등록일\s*[:]\s*[\d\-\.\/]+',
        r'수정일\s*[:]\s*[\d\-\.\/]+',
        r'작성자\s*[:]\s*[^\s\n]+',
        r'담당자\s*[:]\s*[^\n]+',
        # Organization info
        r'기관명\s*[:]\s*[^\n]+',
        r'기관주소\s*[:]\s*[^\n]+',
        r'전화번호\s*[:]\s*[\d\-]+',
        r'팩스\s*[:]\s*[\d\-]+',
        r'문의\s*[:]\s*[^\n]+',
        # Staff info
        r'업무담당자\s*[^\n]+',
        r'\([업무담당자]?\s*[가-힣]+\s*[가-힣]+\s*[\d\-]+\)',
        # Bracket format staff info
        r'[\u3010\u3011【】\[\]][^【】\[\]\u3010\u3011]*?(?:과장|팀장|담당|주무관)[^【】\[\]\u3010\u3011]*?[\d\-]{7,}[^【】\[\]\u3010\u3011]*[\u3010\u3011【】\[\]]',

        # === REGIONAL SPECIFIC: Department/Contact ===
        # Mokpo: (name position, name position phone) - entire parenthetical block
        r'\([가-힣]+\s*[가-힣]{2,4},\s*[가-힣]+\s*[가-힣]{2,4}\s*[\d\-]+[^)]*\)',
        r'\([가-힣]+(?:동장|과장|팀장|계장|주무관)\s*[가-힣]{2,4}[^)]*[\d\-]{3,}[^)]*\)',
        # Gwangyang: 담당부서 : XX과 / 연락처 : 061)XXX-XXXX (entire line)
        r'^담당부서\s*:\s*[가-힣]+(?:과|팀|실)?\s*/?\s*연락처\s*:\s*[\d\)\(\-]+\s*$',
        r'담당부서\s*:\s*[^\n]+연락처\s*:\s*[\d\)\(\-]+',
        # Goheung: 관련부서 : 고흥군 XX과(description phone)
        r'^관련부서\s*:\s*[^\n]+$',
        r'관련부서\s*:\s*[가-힣]+군?\s*[가-힣]+(?:과|팀|실)[^\n]*',
        # General department/contact line
        r'^담당부서\s*:\s*[^\n]+$',
        r'^연락처\s*:\s*[\d\)\(\-]+\s*$',
    ]

    # =================================================================
    # STEP 4: Miscellaneous patterns
    # =================================================================
    misc_patterns = [
        # Photo caption patterns
        r'사진\s*[:]\s*[^\n]+',
        r'.*관련\s*이미지.*©.*',  # Image caption with copyright
        r'.*©\s*코리아NEWS.*',    # Specific copyright pattern
        r'^보도자료\s*제공\s*[:].*', # Press release provider info
        r'^\s*[\u25B2\u25BC\u25C0\u25B6]\s*[^\n]+',  # Arrow captions (line start only)
        r'^\s*[\u25B3\u25BD]\s*[^\n]+',  # Triangle captions (line start only)
        # Copyright/disclaimer
        r'개인정보처리방침.*',
        r'Copyright.*',
        r'저작권.*',

        # === PUBLIC LICENSE (Gonggongnuri) - expanded patterns ===
        r'본\s*저작물은\s*[""\']?공공누리[""\']?[^\n]*',
        r'본\s*공공저작물은\s*공공누리[^\n]*',
        r'공공누리\s*제?\s*\d?\s*유형[^\n]*',
        r'\(?\s*공공누리\s*[^\n)]*\)?',

        # Navigation
        r'^다음글\s*$',
        r'^이전글\s*$',
        r'^인쇄\s*$',
        r'^목록\s*$',
        r'^인쇄\s+목록\s*$',
        r'다음글\s+[^\n]+\s+\d{4}-\d{2}-\d{2}',
        r'이전글\s+[^\n]+\s+\d{4}-\d{2}-\d{2}',
        # Related article links
        r'^[^\n]+\s*/\s*\d{4}-\d{2}-\d{2}\s*$',

        # === REGIONAL SPECIFIC: End markers ===
        # Damyang: ※ 사진 있음. (
        r'※\s*사진\s*있음[^\n]*',
        r'^\s*※\s*사진[^\n]*$',
        # Yeongam: <끝> or 끝
        r'<\s*끝\s*>',
        r'^끝\s*$',
        r'^<끝>$',
        # Muan: ※ at end (standalone)
        r'^※\s*$',
        r'※\s*문의[^\n]*',
        # Yeonggwang: paragraph spacing - handle in cleanup step

        # === REGIONAL SPECIFIC: Preview/Download info ===
        # Hampyeong: preview photo line
        r'^미리보기\s*\([^)]*사진[^)]*\)[^\n]*',
        r'^\s*미리보기\s+\(사진자료\)[^\n]*',
        # Gurye: pagination
        r'^\d+\s*/\s*\d+\s*$',  # 1 / 1 format
        r'다운로드\s*:\s*\d+\s*다운로드\s*미리보기',
        r'^전체다운로드\s*$',
        r'다운로드\s*미리보기\s*$',

        # === COMMON: Phone in parentheses at end ===
        r'\([^)]*☎[^)]+\)',  # (XXX ☎ 123-4567)
        r'☎\s*[\d\-]+',  # ☎ 123-4567
    ]

    # Apply all patterns (MULTILINE mode)
    all_patterns = attachment_patterns + metadata_patterns + misc_patterns
    for pattern in all_patterns:
        content = re.sub(pattern, '', content, flags=re.MULTILINE | re.IGNORECASE)

    # =================================================================
    # STEP 5: Remove empty numbered lines (1. 2. 3.) - apply multiple times
    # =================================================================
    for _ in range(3):
        content = re.sub(r'^\d+\.\s*$', '', content, flags=re.MULTILINE)

    # =================================================================
    # STEP 6: Whitespace/newline cleanup
    # =================================================================
    # 3+ consecutive newlines -> 2
    content = re.sub(r'\n{3,}', '\n\n', content)
    # Multiple spaces -> single
    content = re.sub(r'[ \t]+', ' ', content)
    # Strip each line
    lines = [line.strip() for line in content.split('\n')]
    # Filter empty/numbered-only lines
    lines = [line for line in lines if line and not re.match(r'^\d+\.\s*$', line)]
    content = '\n'.join(lines)
    # Clean excessive blank lines
    content = re.sub(r'\n\s*\n', '\n\n', content)

    # =================================================================
    # STEP 7: END-of-content cleanup (last lines removal)
    # =================================================================
    lines = content.split('\n')

    # Remove problematic last lines (check last 3 lines)
    end_line_patterns = [
        # Mokpo: (Name position, Name position phone...) pattern
        r'^\s*\([가-힣]+\s*[가-힣]{2,4},\s*[가-힣]+\s*[가-힣]{2,4}\s*[\d\-]+',
        r'^\s*\([가-힣]+(?:동장|과장|팀장|계장|주무관)\s*[가-힣]{2,4}',
        # Gwangyang: 담당부서 : XX과 / 연락처 : 061)XXX-XXXX
        r'^\s*담당부서\s*:\s*[가-힣]+(?:과|팀|실)',
        r'^\s*담당\s*:\s*[가-힣]+(?:과|팀|실)',
        # Goheung: 관련부서 : 고흥군 XX과
        r'^\s*관련부서\s*:\s*',
        # Goheung/General: 공공누리 copyright
        r'^\s*본\s*저작물은\s*["\']?공공누리',
        r'^\s*본\s*공공저작물은\s*공공누리',
        r'^\s*\(?\s*공공누리',
        # Damyang: ※ 사진 있음. (
        r'^\s*※\s*사진\s*있음',
        r'^\s*※\s*사진',
        # Yeongam: <끝> or 끝
        r'^\s*<\s*끝\s*>\s*$',
        r'^\s*끝\s*$',
        # Muan: ※ at end
        r'^\s*※\s*$',
        r'^\s*※\s*문의',
        # General: contact with phone
        r'^\s*문의\s*:\s*[\d\-\(\)]+',
        r'^\s*☎\s*[\d\-]+',
        r'^\s*전화\s*:\s*[\d\-\(\)]+',
    ]

    # Check and remove last 3 lines if they match patterns
    lines_to_remove = 0
    for i in range(min(3, len(lines))):
        line_idx = len(lines) - 1 - i
        if line_idx < 0:
            break
        line = lines[line_idx]
        for pattern in end_line_patterns:
            if re.match(pattern, line, re.IGNORECASE):
                lines_to_remove = i + 1
                break

    if lines_to_remove > 0:
        lines = lines[:-lines_to_remove]

    content = '\n'.join(lines)

    # =================================================================
    # STEP 8: Final trim and length limit
    # =================================================================
    content = content.strip()
    if len(content) > max_length:
        content = content[:max_length]

    return content


def extract_clean_text_from_html(html_content: str) -> str:
    """
    Extract and clean text from HTML content.

    Args:
        html_content: HTML string

    Returns:
        Cleaned text content
    """
    if not html_content:
        return ""

    # Remove HTML tags (simple approach)
    text = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)

    # Convert HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&amp;', '&')
    text = text.replace('&quot;', '"')

    # Apply content cleaning
    return clean_article_content(text)


# ============================================================
# Category Auto-Classification (v1.0)
# ============================================================

# Category keyword mapping
CATEGORY_KEYWORDS = {
    'education': {
        'name': '교육',
        'keywords': [
            '학교', '학생', '교육', '장학', '입학', '졸업', '수업', '교사', '선생',
            '유치원', '초등', '중학', '고등', '대학', '학부모', '교원', '교직',
            '학력', '진학', '입시', '수능', '학원', '방과후', '돌봄', '급식',
            '특수교육', '영재', '학습', '교과', '체험학습', '수학여행'
        ]
    },
    'welfare': {
        'name': '복지',
        'keywords': [
            '복지', '지원금', '수당', '어르신', '노인', '장애인', '보육', '돌봄',
            '기초생활', '저소득', '취약계층', '아동', '청소년', '여성', '다문화',
            '의료', '건강', '요양', '연금', '급여', '바우처', '사회서비스',
            '자립', '재활', '상담', '쉼터', '보호', '양육'
        ]
    },
    'culture': {
        'name': '문화',
        'keywords': [
            '축제', '공연', '전시', '문화', '행사', '예술', '음악', '미술',
            '박물관', '도서관', '문화재', '유적', '관광', '체육', '스포츠',
            '레저', '여가', '동아리', '문화센터', '공원', '휴양', '페스티벌',
            '콘서트', '연극', '영화', '국악', '전통', '문화원'
        ]
    },
    'economy': {
        'name': '경제',
        'keywords': [
            '일자리', '취업', '창업', '기업', '투자', '경제', '산업', '상권',
            '농업', '어업', '축산', '농산물', '특산물', '시장', '상인',
            '소상공인', '자영업', '무역', '수출', '수입', '공장', '제조',
            '벤처', '스타트업', '고용', '실업', '구인', '구직', '직업훈련'
        ]
    },
    'environment': {
        'name': '환경',
        'keywords': [
            '환경', '쓰레기', '재활용', '분리수거', '청소', '미세먼지', '대기',
            '수질', '하천', '녹지', '공원', '생태', '자연', '산림', '숲',
            '탄소', '에너지', '태양광', '신재생', '기후', '온실가스',
            '폐기물', '오염', '정화', '보전', '생물', '야생동물'
        ]
    },
    'safety': {
        'name': '안전',
        'keywords': [
            '안전', '재난', '화재', '소방', '구조', '구급', '응급', '사고',
            '교통', '도로', '신호등', '횡단보도', 'CCTV', '방범', '치안',
            '경찰', '범죄', '예방', '대피', '훈련', '비상', '홍수', '태풍',
            '지진', '폭염', '한파', '재해', '복구', '긴급'
        ]
    },
    'construction': {
        'name': '건설',
        'keywords': [
            '건설', '공사', '도로', '교량', '터널', '건물', '시설', '인프라',
            '개발', '정비', '재개발', '재건축', '주택', '아파트', '주거',
            '상하수도', '하수처리', '배수', '포장', '보수', '신축', '증축',
            '리모델링', '설계', '착공', '준공', '입찰'
        ]
    },
    'administration': {
        'name': '행정',
        'keywords': [
            '조례', '의회', '예산', '인사', '공고', '민원', '행정', '정책',
            '계획', '사업', '추진', '시행', '공무원', '청사', '기관',
            '위원회', '협의회', '간담회', '회의', '보고', '감사', '평가',
            '선거', '투표', '지방자치', '자치단체', '군수', '시장', '도지사'
        ]
    }
}

# Default category (when no match)
DEFAULT_CATEGORY = 'general'
DEFAULT_CATEGORY_NAME = '일반'


def detect_category(title: str, content: str = '') -> tuple:
    """
    Analyze title and content to auto-classify category.

    Args:
        title: Article title
        content: Article content (optional)

    Returns:
        tuple: (category_code, category_name)
               e.g., ('education', '교육')
    """
    if not title:
        return DEFAULT_CATEGORY, DEFAULT_CATEGORY_NAME

    # Combine title + first 500 chars of content for analysis
    text = title.lower()
    if content:
        text += ' ' + content[:500].lower()

    # Calculate matching score for each category
    scores = {}
    for cat_code, cat_data in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in cat_data['keywords']:
            # 3x weight if in title
            if keyword in title:
                score += 3
            # 1x weight if in content
            elif keyword in text:
                score += 1
        scores[cat_code] = score

    # Select highest scoring category
    if scores:
        best_category = max(scores, key=scores.get)
        if scores[best_category] > 0:
            return best_category, CATEGORY_KEYWORDS[best_category]['name']

    return DEFAULT_CATEGORY, DEFAULT_CATEGORY_NAME


def get_category_name(category_code: str) -> str:
    """Get Korean category name from category code."""
    if category_code in CATEGORY_KEYWORDS:
        return CATEGORY_KEYWORDS[category_code]['name']
    return DEFAULT_CATEGORY_NAME


# ============================================================
# Subtitle Extraction Utility (v1.1)
# ============================================================

def extract_subtitle(content: str, title: str = '') -> tuple:
    """
    Extract subtitle from content and remove it from body.
    Also removes title if repeated in content.

    Subtitle patterns:
    - "- subtitle content -"    (dashes on both sides)
    - "-- subtitle content --"  (double dashes)
    - "- subtitle content"      (leading dash only)

    Args:
        content: Original article text
        title: Article title (for duplicate removal)

    Returns:
        tuple: (subtitle, cleaned_content)
               - subtitle: Extracted subtitle (None if not found)
               - cleaned_content: Content with subtitle removed
    """
    if not content:
        return None, ""

    lines = content.strip().split('\n')
    subtitle = None
    lines_to_remove = []

    # 1. Remove title if repeated in content (within first 3 lines)
    if title:
        title_normalized = title.strip()
        for i, line in enumerate(lines[:3]):
            line_stripped = line.strip()
            # Identical or very similar to title
            if line_stripped and (
                line_stripped == title_normalized or
                line_stripped.replace(' ', '') == title_normalized.replace(' ', '')
            ):
                lines_to_remove.append(i)
                break

    # 2. Search for subtitle pattern (within first 5 lines)
    subtitle_line_index = None
    for i, line in enumerate(lines[:5]):
        if i in lines_to_remove:
            continue
        line_stripped = line.strip()
        if not line_stripped:
            continue

        # Pattern 1: "- subtitle -" (dashes on both sides)
        match = re.match(r'^-+\s*(.+?)\s*-+\s*$', line_stripped)
        if match:
            subtitle = match.group(1).strip()
            subtitle_line_index = i
            break

        # Pattern 2: "- subtitle" (leading dash only, min 5 chars)
        match = re.match(r'^-\s+(.{5,})$', line_stripped)
        if match:
            potential_subtitle = match.group(1).strip()
            # Subtitle characteristic: usually under 100 chars, doesn't end with period
            if len(potential_subtitle) < 100 and not potential_subtitle.endswith('.'):
                subtitle = potential_subtitle
                subtitle_line_index = i
                break

    # Add subtitle line to removal list
    if subtitle_line_index is not None:
        lines_to_remove.append(subtitle_line_index)

    # 3. Remove lines (in reverse order to avoid index issues)
    for idx in sorted(lines_to_remove, reverse=True):
        if idx < len(lines):
            lines.pop(idx)

    # 4. Clean leading empty lines
    while lines and not lines[0].strip():
        lines.pop(0)

    cleaned_content = '\n'.join(lines)

    return subtitle, cleaned_content


def extract_subtitle_and_clean(content: str, title: str = '') -> dict:
    """
    Extract subtitle from content and return cleaned content

    Args:
        content: Original article content text
        title: Article title (for duplicate removal)

    Returns:
        dict: {
            'subtitle': Extracted subtitle (None if not found),
            'content': Cleaned article content
        }
    """
    # 1. Extract subtitle (includes title duplicate removal)
    subtitle, content_without_subtitle = extract_subtitle(content, title)

    # 2. Clean article content
    cleaned_content = clean_article_content(content_without_subtitle)

    return {
        'subtitle': subtitle,
        'content': cleaned_content
    }


# ============================================================
# URL Parameter Safe Generation Utility (v1.0)
# ============================================================
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

def safe_add_pagination(base_url: str, page_param: str, page_num: int) -> str:
    """
    Safely add pagination parameter to URL without duplicating '?'.

    Handles all edge cases:
    - URL already has query parameters
    - URL has no query parameters
    - Page parameter already exists (will be updated)

    Args:
        base_url: Base URL (may or may not have existing query params)
        page_param: Name of the pagination parameter (e.g., 'page', 'pageIndex', 'bpage')
        page_num: Page number to set

    Returns:
        str: Properly constructed URL with pagination parameter

    Example:
        >>> safe_add_pagination('https://example.com/list?cat=1', 'page', 2)
        'https://example.com/list?cat=1&page=2'
        >>> safe_add_pagination('https://example.com/list', 'page', 2)
        'https://example.com/list?page=2'
    """
    parsed = urlparse(base_url)
    query = parse_qs(parsed.query)
    query[page_param] = [str(page_num)]
    new_query = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(query=new_query))

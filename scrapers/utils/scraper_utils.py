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
# 본문 정제 유틸리티 (v1.1)
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
    - 빈 번호 (1. 2. 3. 등)

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
    ]

    # 모든 패턴 적용 (MULTILINE 모드)
    all_patterns = attachment_patterns + metadata_patterns + misc_patterns
    for pattern in all_patterns:
        content = re.sub(pattern, '', content, flags=re.MULTILINE | re.IGNORECASE)

    # 4. 빈 번호만 있는 줄 제거 (1. 2. 3. 등) - 여러 번 반복 적용
    for _ in range(3):
        content = re.sub(r'^\d+\.\s*$', '', content, flags=re.MULTILINE)

    # 5. 공백/줄바꿈 정리
    # 3줄 이상 연속 줄바꿈 -> 2줄로
    content = re.sub(r'\n{3,}', '\n\n', content)
    # 연속 공백 정리
    content = re.sub(r'[ \t]+', ' ', content)
    # 각 줄 앞뒤 공백 제거
    lines = [line.strip() for line in content.split('\n')]
    # 빈 줄 또는 번호만 있는 줄 필터링
    lines = [line for line in lines if line and not re.match(r'^\d+\.\s*$', line)]
    content = '\n'.join(lines)
    # 빈 줄만 있는 경우 제거
    content = re.sub(r'\n\s*\n', '\n\n', content)

    # 6. 앞뒤 공백 제거 및 길이 제한
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


# ============================================================
# 카테고리 자동 분류 (v1.0)
# ============================================================

# 카테고리 키워드 매핑
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

# 기본 카테고리 (매칭 안될 경우)
DEFAULT_CATEGORY = 'general'
DEFAULT_CATEGORY_NAME = '일반'


def detect_category(title: str, content: str = '') -> tuple:
    """
    제목과 본문을 분석하여 카테고리를 자동 분류

    Args:
        title: 기사 제목
        content: 기사 본문 (선택)

    Returns:
        tuple: (category_code, category_name)
               예: ('education', '교육')
    """
    if not title:
        return DEFAULT_CATEGORY, DEFAULT_CATEGORY_NAME

    # 제목 + 본문 앞부분(500자) 결합하여 분석
    text = title.lower()
    if content:
        text += ' ' + content[:500].lower()

    # 각 카테고리별 매칭 점수 계산
    scores = {}
    for cat_code, cat_data in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in cat_data['keywords']:
            # 제목에 있으면 가중치 3배
            if keyword in title:
                score += 3
            # 본문에 있으면 가중치 1배
            elif keyword in text:
                score += 1
        scores[cat_code] = score

    # 최고 점수 카테고리 선택
    if scores:
        best_category = max(scores, key=scores.get)
        if scores[best_category] > 0:
            return best_category, CATEGORY_KEYWORDS[best_category]['name']

    return DEFAULT_CATEGORY, DEFAULT_CATEGORY_NAME


def get_category_name(category_code: str) -> str:
    """카테고리 코드로 한글 이름 반환"""
    if category_code in CATEGORY_KEYWORDS:
        return CATEGORY_KEYWORDS[category_code]['name']
    return DEFAULT_CATEGORY_NAME


# ============================================================
# 부제목 추출 유틸리티 (v1.0)
# ============================================================

def extract_subtitle(content: str) -> tuple:
    """
    본문에서 부제목을 추출하고 본문에서 제거

    부제목 패턴:
    - "- 부제목 내용"         (앞에 - 만)
    - "- 부제목 내용 -"       (앞뒤 -)
    - "-- 부제목 내용 --"     (앞뒤 --)

    Args:
        content: 원본 본문 텍스트

    Returns:
        tuple: (subtitle, cleaned_content)
               - subtitle: 추출된 부제목 (없으면 None)
               - cleaned_content: 부제목이 제거된 본문
    """
    if not content:
        return None, ""

    lines = content.strip().split('\n')
    subtitle = None
    subtitle_line_index = None

    # 처음 5줄 내에서 부제목 패턴 검색
    for i, line in enumerate(lines[:5]):
        line = line.strip()
        if not line:
            continue

        # 패턴 1: "- 부제목 내용 -" (앞뒤 -)
        match = re.match(r'^-+\s*(.+?)\s*-+$', line)
        if match:
            subtitle = match.group(1).strip()
            subtitle_line_index = i
            break

        # 패턴 2: "- 부제목 내용" (앞에 - 만, 최소 5자 이상)
        match = re.match(r'^-\s+(.{5,})$', line)
        if match:
            # 본문 첫 문장이 아닌 경우만 (보통 부제목은 본문보다 짧음)
            potential_subtitle = match.group(1).strip()
            # 부제목 특성: 보통 한 문장이고 마침표로 안 끝남
            if len(potential_subtitle) < 100 and not potential_subtitle.endswith('.'):
                subtitle = potential_subtitle
                subtitle_line_index = i
                break

    # 부제목이 발견되면 해당 줄 제거
    if subtitle_line_index is not None:
        lines.pop(subtitle_line_index)
        # 빈 줄 정리
        while lines and not lines[0].strip():
            lines.pop(0)

    cleaned_content = '\n'.join(lines)

    return subtitle, cleaned_content


def extract_subtitle_and_clean(content: str) -> dict:
    """
    본문에서 부제목을 추출하고 본문을 정제하여 반환

    Args:
        content: 원본 본문 텍스트

    Returns:
        dict: {
            'subtitle': 추출된 부제목 (없으면 None),
            'content': 정제된 본문
        }
    """
    # 1. 부제목 추출
    subtitle, content_without_subtitle = extract_subtitle(content)

    # 2. 본문 정제
    cleaned_content = clean_article_content(content_without_subtitle)

    return {
        'subtitle': subtitle,
        'content': cleaned_content
    }

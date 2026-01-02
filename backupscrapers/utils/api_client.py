"""
API 클라이언트 공통 모듈
- Next.js /api/bot/ingest 엔드포인트와 통신
- 예외 처리 및 재시도 로직 포함
- 개발 서버 자동 시작 기능 포함
"""

import os
import sys
import time
import logging
import subprocess
import requests
from typing import Dict, Any, Optional, Callable
from dotenv import load_dotenv


def safe_str(text: str) -> str:
    """Safely encode text for Windows console output (cp949)"""
    try:
        return str(text).encode('cp949', errors='replace').decode('cp949')
    except:
        return str(text)


# 로깅 설정 - all logs go to logs/ folder
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'api_client.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('ApiClient')

# .env 파일 로드 (프로젝트 루트 기준)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# 설정 상수
API_URL = os.getenv('BOT_API_URL', 'http://localhost:3000/api/bot/ingest')
LOG_API_URL = os.getenv('BOT_LOG_API_URL', 'http://localhost:3000/api/bot/logs')
DUPLICATE_CHECK_URL = os.getenv('BOT_DUPLICATE_CHECK_URL', 'http://localhost:3000/api/bot/check-duplicate')
API_KEY = os.getenv('BOT_API_KEY', '')
REQUEST_TIMEOUT = 10  # 초
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1  # 초 (Exponential Backoff 기준)


def send_article_to_server(article_data: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
    """
    Next.js API로 기사 전송 (재시도 로직 포함)

    Args:
        article_data: 기사 데이터 딕셔너리
            - title (필수): 기사 제목
            - original_link (필수): 원본 링크 (중복 방지 키)
            - content: 기사 본문
            - source: 출처 (예: "나주시", "TechCrunch")
            - category: 카테고리 (예: "나주", "AI")
            - published_at: 발행일 (ISO 8601)
            - thumbnail_url: 썸네일 이미지 URL
            - ai_summary: AI 요약 (선택)
        max_retries: 최대 재시도 횟수 (기본 3회)

    Returns:
        Dict with keys:
            - success: bool
            - status: 'created' | 'exists' | 'error'
            - message: 상세 메시지
    """
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }

    last_error = None

    for attempt in range(max_retries):
        try:
            resp = requests.post(
                API_URL,
                json=article_data,
                headers=headers,
                timeout=REQUEST_TIMEOUT
            )

            if resp.status_code == 201:
                # 새로 생성됨
                print(f'   [OK] 전송 완료: {safe_str(article_data.get("title", "제목없음")[:40])}')
                return {'success': True, 'status': 'created', 'message': '기사 저장 완료'}

            elif resp.status_code == 200:
                # 이미 존재함 (중복)
                print(f'   [SKIP] 이미 존재: {safe_str(article_data.get("title", "제목없음")[:40])}')
                return {'success': True, 'status': 'exists', 'message': '이미 존재하는 기사'}

            elif resp.status_code == 401:
                # 인증 실패 - 재시도 의미 없음
                print(f'   [AUTH] 인증 실패 - BOT_API_KEY 확인 필요')
                return {'success': False, 'status': 'error', 'message': '인증 실패'}

            elif resp.status_code == 400:
                # 필수 필드 누락 - 재시도 의미 없음
                try:
                    error_msg = resp.json().get('error', '필수 필드 누락')
                except:
                    error_msg = resp.text[:100] if resp.text else '필수 필드 누락'
                print(f'   [FAIL] 요청 오류: {safe_str(error_msg)}')
                return {'success': False, 'status': 'error', 'message': error_msg}

            elif resp.status_code >= 500:
                # 서버 오류 - 재시도 가능
                last_error = f'서버 오류: {resp.status_code}'
                if attempt < max_retries - 1:
                    delay = RETRY_BASE_DELAY * (2 ** attempt)
                    print(f'   [RETRY] 서버 오류 ({resp.status_code}), {delay}초 후 재시도...')
                    time.sleep(delay)
                    continue
            else:
                # 기타 오류
                print(f'   [FAIL] 서버 오류 ({resp.status_code}): {safe_str(resp.text[:100])}')
                return {'success': False, 'status': 'error', 'message': f'서버 오류: {resp.status_code}'}

        except requests.exceptions.Timeout:
            last_error = '요청 시간 초과'
            if attempt < max_retries - 1:
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                print(f'   [RETRY] 타임아웃, {delay}초 후 재시도...')
                time.sleep(delay)
                continue

        except requests.exceptions.ConnectionError:
            last_error = '서버 연결 실패'
            if attempt < max_retries - 1:
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                print(f'   [RETRY] 연결 오류, {delay}초 후 재시도...')
                time.sleep(delay)
                continue

        except Exception as e:
            last_error = str(e)
            print(f'   [ERROR] 예외 발생: {safe_str(str(e))}')
            return {'success': False, 'status': 'error', 'message': str(e)}

    # All retries exhausted
    print(f'   [FAIL] 최대 재시도 횟수 초과: {safe_str(last_error or "알 수 없는 오류")}')
    return {'success': False, 'status': 'error', 'message': last_error or '최대 재시도 횟수 초과'}


def check_duplicates(urls: list) -> set:
    """
    Check which URLs already exist in DB BEFORE visiting detail pages.
    This saves time by avoiding unnecessary page loads for duplicate articles.

    Args:
        urls: List of original_link URLs to check

    Returns:
        Set of URLs that already exist in DB (should be skipped)

    Usage:
        from utils.api_client import check_duplicates

        # After collecting URLs from list page
        all_urls = ['http://...', 'http://...', ...]
        existing_urls = check_duplicates(all_urls)

        for url in all_urls:
            if url in existing_urls:
                print(f'[SKIP] Already exists: {url}')
                continue
            # Only visit detail page for new articles
            content = fetch_detail(url)
    """
    if not urls:
        return set()

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }

    try:
        resp = requests.post(
            DUPLICATE_CHECK_URL,
            json={'urls': urls},
            headers=headers,
            timeout=REQUEST_TIMEOUT
        )

        if resp.status_code == 200:
            data = resp.json()
            existing = set(data.get('exists', []))
            if existing:
                print(f'   [PRE-CHECK] {len(existing)}/{len(urls)} articles already exist in DB')
            return existing
        else:
            print(f'   [WARN] Duplicate check failed ({resp.status_code}), proceeding without pre-check')
            return set()

    except requests.exceptions.Timeout:
        print('   [WARN] Duplicate check timeout, proceeding without pre-check')
        return set()

    except requests.exceptions.ConnectionError:
        print('   [WARN] Duplicate check connection failed, proceeding without pre-check')
        return set()

    except Exception as e:
        print(f'   [WARN] Duplicate check error: {str(e)}, proceeding without pre-check')
        return set()


def log_to_server(
    region: str,
    status: str,
    message: str,
    type: str = 'info',
    created_count: int = 0,
    skipped_count: int = 0
) -> None:
    """
    Send real-time log to server

    Args:
        region: Region code (e.g., 'naju', 'mokpo')
        status: Current status ('running', 'success', 'failed')
        message: Log message
        type: Log type ('info', 'error', 'warning', 'success')
        created_count: Number of newly created articles (for completion log)
        skipped_count: Number of skipped/duplicate articles (for completion log)
    """
    try:
        # Phase 3: Use BOT_LOG_ID env var if available (exact log matching)
        log_id = os.getenv('BOT_LOG_ID')

        data = {
            'region': region,
            'status': status,
            'message': message,
            'type': type,
            'timestamp': str(time.time())
        }

        # Add log_id if available (for API priority matching)
        if log_id:
            data['log_id'] = int(log_id)

        # Add article counts on completion (for GitHub Actions)
        if status == 'success' or status == 'failed':
            data['created_count'] = created_count
            data['skipped_count'] = skipped_count

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        }

        # Log failures should not stop the process (short timeout)
        requests.post(LOG_API_URL, json=data, headers=headers, timeout=2)

    except:
        pass  # Ignore log sending failures


def check_server_health() -> bool:
    """
    서버 상태 확인 (개발용)
    """
    try:
        # 간단한 연결 테스트 (실제 엔드포인트가 없으면 405 Method Not Allowed 반환됨)
        resp = requests.get(API_URL.replace('/ingest', ''), timeout=3)
        return resp.status_code < 500
    except:
        return False


# Global variable to track dev server process
_dev_server_process: Optional[subprocess.Popen] = None


def ensure_server_running(max_wait: int = 30) -> bool:
    """
    Check if dev server is running; if not, start it automatically.

    Args:
        max_wait: Maximum seconds to wait for server to be ready (default: 30)

    Returns:
        True if server is running/started successfully, False otherwise

    Usage:
        from utils.api_client import ensure_server_running

        if not ensure_server_running():
            print("Failed to start server")
            sys.exit(1)
    """
    global _dev_server_process

    # Skip if using production URL (not localhost)
    if 'localhost' not in API_URL and '127.0.0.1' not in API_URL:
        print('[SERVER] Production URL detected, skipping server check')
        return True

    # Check if server is already running
    if _is_server_accessible():
        print('[SERVER] Dev server is already running')
        return True

    print('[SERVER] Dev server not running, starting...')

    # Find project root (two levels up from utils/)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    # Check if package.json exists
    package_json = os.path.join(project_root, 'package.json')
    if not os.path.exists(package_json):
        print(f'[SERVER] ERROR: package.json not found at {project_root}')
        return False

    try:
        # Start dev server in background
        # Use shell=True on Windows for npm command
        if sys.platform == 'win32':
            _dev_server_process = subprocess.Popen(
                'npm run dev',
                cwd=project_root,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            _dev_server_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=project_root,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )

        print(f'[SERVER] Started dev server (PID: {_dev_server_process.pid})')

        # Wait for server to be ready
        start_time = time.time()
        while time.time() - start_time < max_wait:
            if _is_server_accessible():
                elapsed = int(time.time() - start_time)
                print(f'[SERVER] Dev server ready ({elapsed}s)')
                return True
            time.sleep(1)
            print('.', end='', flush=True)

        print(f'\n[SERVER] ERROR: Server did not start within {max_wait}s')
        return False

    except Exception as e:
        print(f'[SERVER] ERROR: Failed to start dev server: {str(e)}')
        return False


def _is_server_accessible() -> bool:
    """
    Internal function to check if server is accessible.
    """
    try:
        # Try to connect to the API endpoint
        resp = requests.get(API_URL, timeout=2)
        # 405 Method Not Allowed is expected for POST-only endpoints
        return resp.status_code in [200, 400, 401, 405]
    except:
        return False


def stop_dev_server() -> None:
    """
    Stop the dev server if it was started by this module.
    Call this at the end of scraping if you want to clean up.
    """
    global _dev_server_process

    if _dev_server_process is not None:
        try:
            if sys.platform == 'win32':
                # On Windows, use taskkill to terminate process tree
                subprocess.run(
                    f'taskkill /F /T /PID {_dev_server_process.pid}',
                    shell=True,
                    capture_output=True
                )
            else:
                import signal
                os.killpg(os.getpgid(_dev_server_process.pid), signal.SIGTERM)

            print(f'[SERVER] Stopped dev server (PID: {_dev_server_process.pid})')
            _dev_server_process = None
        except Exception as e:
            print(f'[SERVER] Warning: Could not stop dev server: {str(e)}')


def retry_request(
    url: str,
    method: str = 'GET',
    max_retries: int = MAX_RETRIES,
    timeout: int = REQUEST_TIMEOUT,
    **kwargs
) -> Optional[requests.Response]:
    """
    Exponential Backoff을 적용한 HTTP 요청 재시도 유틸리티
    
    Args:
        url: 요청 URL
        method: HTTP 메서드 ('GET', 'POST' 등)
        max_retries: 최대 재시도 횟수 (기본: 3)
        timeout: 요청 타임아웃 (초)
        **kwargs: requests 추가 인자 (headers, json, params 등)
        
    Returns:
        성공 시 Response 객체, 실패 시 None
        
    Usage:
        from utils.api_client import retry_request
        
        resp = retry_request('https://example.com/api', timeout=15)
        if resp:
            data = resp.text
    """
    for attempt in range(max_retries):
        try:
            if method.upper() == 'GET':
                resp = requests.get(url, timeout=timeout, **kwargs)
            elif method.upper() == 'POST':
                resp = requests.post(url, timeout=timeout, **kwargs)
            else:
                resp = requests.request(method, url, timeout=timeout, **kwargs)
            
            resp.raise_for_status()
            return resp
            
        except requests.exceptions.Timeout:
            logger.warning(f"[Retry {attempt+1}/{max_retries}] 타임아웃: {url[:50]}...")
        except requests.exceptions.ConnectionError:
            logger.warning(f"[Retry {attempt+1}/{max_retries}] 연결 오류: {url[:50]}...")
        except requests.exceptions.HTTPError as e:
            logger.warning(f"[Retry {attempt+1}/{max_retries}] HTTP 오류 {e.response.status_code}: {url[:50]}...")
        except Exception as e:
            logger.error(f"[Retry {attempt+1}/{max_retries}] 예외: {str(e)[:50]}")
        
        # Exponential Backoff (1초, 2초, 4초...)
        if attempt < max_retries - 1:
            delay = RETRY_BASE_DELAY * (2 ** attempt)
            logger.info(f"   {delay}초 후 재시도...")
            time.sleep(delay)
    
    logger.error(f"[FAIL] 최대 재시도 횟수 초과: {url[:50]}...")
    return None


def safe_scrape(func: Callable) -> Callable:
    """
    스크래핑 함수를 안전하게 감싸는 데코레이터
    에러 발생 시 전체 프로세스가 중단되지 않고 로깅 후 계속 진행
    
    Usage:
        @safe_scrape
        def fetch_article(url):
            ...
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"[SKIP] {func.__name__} 실패: {str(e)[:100]}")
            return None
    return wrapper

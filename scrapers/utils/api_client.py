"""
API 클라이언트 공통 모듈
- Next.js /api/bot/ingest 엔드포인트와 통신
- 예외 처리 및 재시도 로직 포함
"""

import os
import time
import logging
import requests
from typing import Dict, Any, Optional, Callable
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# .env 파일 로드 (프로젝트 루트 기준)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# 설정 상수
API_URL = os.getenv('BOT_API_URL', 'http://localhost:3000/api/bot/ingest')
LOG_API_URL = os.getenv('BOT_LOG_API_URL', 'http://localhost:3000/api/bot/logs')
API_KEY = os.getenv('BOT_API_KEY', '')
REQUEST_TIMEOUT = 10  # 초
MAX_RETRIES = 3
RETRY_BASE_DELAY = 1  # 초 (Exponential Backoff 기준)


def send_article_to_server(article_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Next.js API로 기사 전송
    
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
    
    try:
        resp = requests.post(
            API_URL, 
            json=article_data, 
            headers=headers, 
            timeout=REQUEST_TIMEOUT
        )
        
        if resp.status_code == 201:
            # 새로 생성됨
            print(f'   ✅ [SUCCESS] 전송 완료: {article_data.get("title", "제목없음")[:40]}')
            return {'success': True, 'status': 'created', 'message': '기사 저장 완료'}
        
        elif resp.status_code == 200:
            # 이미 존재함 (중복)
            print(f'   ⏩ [SKIP] 이미 존재: {article_data.get("title", "제목없음")[:40]}')
            return {'success': True, 'status': 'exists', 'message': '이미 존재하는 기사'}
        
        elif resp.status_code == 401:
            # 인증 실패
            print(f'   🔒 [AUTH] 인증 실패 - BOT_API_KEY 확인 필요')
            return {'success': False, 'status': 'error', 'message': '인증 실패'}
        
        elif resp.status_code == 400:
            # 필수 필드 누락
            error_msg = resp.json().get('error', '필수 필드 누락')
            print(f'   ⚠️ [FAIL] 요청 오류: {error_msg}')
            return {'success': False, 'status': 'error', 'message': error_msg}
        
        else:
            # 기타 서버 오류
            print(f'   ⚠️ [FAIL] 서버 오류 ({resp.status_code}): {resp.text[:100]}')
            return {'success': False, 'status': 'error', 'message': f'서버 오류: {resp.status_code}'}
    
    except requests.exceptions.Timeout:
        print(f'   ❌ [TIMEOUT] 요청 시간 초과')
        return {'success': False, 'status': 'error', 'message': '요청 시간 초과'}
    
    except requests.exceptions.ConnectionError:
        print(f'   ❌ [ERROR] 서버 연결 실패 - Next.js 서버 실행 여부 확인')
        return {'success': False, 'status': 'error', 'message': '서버 연결 실패'}
    
    except Exception as e:
        print(f'   ❌ [ERROR] 예외 발생: {str(e)}')
        return {'success': False, 'status': 'error', 'message': str(e)}


def log_to_server(region: str, status: str, message: str, type: str = 'info') -> None:
    """
    서버로 실시간 로그 전송
    
    Args:
        region: 지역 코드 (jeonnam)
        status: 현재 상태 (실행중, 성공, 실패)
        message: 로그 메시지
        type: 로그 타입 (info, error, warning, success)
    """
    try:
        data = {
            'region': region,
            'status': status,
            'message': message,
            'type': type,
            'timestamp': str(time.time())
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        }
        
        # 로그는 실패해도 프로세스를 중단하지 않음 (타임아웃 짧게 설정)
        requests.post(LOG_API_URL, json=data, headers=headers, timeout=2)
        
    except:
        pass  # 로그 전송 실패는 무시


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
    
    logger.error(f"❌ 최대 재시도 횟수 초과: {url[:50]}...")
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

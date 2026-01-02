"""
재시도 데코레이터 및 유틸리티
- Exponential Backoff 적용
- 네트워크 오류, 타임아웃 자동 재시도
"""

import time
from functools import wraps
from typing import Callable, Optional, Type, Tuple
import logging

logger = logging.getLogger(__name__)


def retry(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
) -> Callable:
    """
    Exponential Backoff 재시도 데코레이터
    
    Args:
        max_attempts: 최대 시도 횟수 (기본: 3)
        delay: 초기 대기 시간 (초) (기본: 1초)
        backoff: 대기 시간 증가 배수 (기본: 2배)
        exceptions: 재시도할 예외 타입 튜플
        
    Usage:
        @retry(max_attempts=3, delay=1, backoff=2)
        def fetch_data(url):
            response = requests.get(url)
            response.raise_for_status()
            return response.text
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_attempts:
                        logger.error(
                            f"[{func.__name__}] 최대 {max_attempts}회 시도 실패: {str(e)[:100]}"
                        )
                        raise
                    
                    wait_time = delay * (backoff ** (attempt - 1))
                    logger.warning(
                        f"[{func.__name__}] 시도 {attempt}/{max_attempts} 실패, "
                        f"{wait_time:.1f}초 후 재시도: {str(e)[:50]}"
                    )
                    time.sleep(wait_time)
            
            raise last_exception
        return wrapper
    return decorator


def safe_execute(func: Callable, *args, default=None, **kwargs):
    """
    안전 실행 함수 - 예외 발생 시 기본값 반환
    
    Args:
        func: 실행할 함수
        *args: 함수 인자
        default: 예외 발생 시 반환할 기본값
        **kwargs: 함수 키워드 인자
        
    Returns:
        함수 결과 또는 default 값
        
    Usage:
        result = safe_execute(fetch_data, url, default=None)
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"[{func.__name__}] 실행 실패: {str(e)[:100]}")
        return default


class RetryableError(Exception):
    """재시도 가능한 오류를 나타내는 커스텀 예외"""
    pass


class SkipItemError(Exception):
    """해당 아이템을 건너뛰어야 함을 나타내는 예외"""
    pass

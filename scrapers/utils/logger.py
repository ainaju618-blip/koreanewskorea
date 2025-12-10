"""
Korea NEWS 로깅 유틸리티
- 파일 및 콘솔 로깅 설정
- RotatingFileHandler로 로그 파일 크기 관리
"""

import os
import logging
from logging.handlers import RotatingFileHandler
from typing import Optional

# 로그 디렉토리 생성
LOG_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# 기본 로그 파일 경로
DEFAULT_LOG_FILE = os.path.join(LOG_DIR, 'scraper.log')


def setup_logger(
    name: str, 
    log_file: Optional[str] = None,
    level: int = logging.INFO,
    max_bytes: int = 5 * 1024 * 1024,  # 5MB
    backup_count: int = 3
) -> logging.Logger:
    """
    로거 설정 및 반환
    
    Args:
        name: 로거 이름 (보통 __name__ 사용)
        log_file: 로그 파일 경로 (None이면 기본 경로 사용)
        level: 로깅 레벨 (기본: INFO)
        max_bytes: 로그 파일 최대 크기 (기본: 5MB)
        backup_count: 백업 파일 개수 (기본: 3)
        
    Returns:
        설정된 Logger 인스턴스
        
    Usage:
        from utils.logger import setup_logger
        logger = setup_logger(__name__)
        logger.info("스크래핑 시작")
        logger.error("오류 발생", exc_info=True)
    """
    logger = logging.getLogger(name)
    
    # 이미 핸들러가 있으면 재설정 방지
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # 파일 핸들러 (RotatingFileHandler)
    log_path = log_file or DEFAULT_LOG_FILE
    file_handler = RotatingFileHandler(
        log_path,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # 콘솔 핸들러
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_formatter = logging.Formatter(
        '%(levelname)s: %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    return logger


# 편의를 위한 전역 로거
_default_logger: Optional[logging.Logger] = None

def get_logger() -> logging.Logger:
    """기본 로거 반환 (싱글톤)"""
    global _default_logger
    if _default_logger is None:
        _default_logger = setup_logger('koreanews')
    return _default_logger

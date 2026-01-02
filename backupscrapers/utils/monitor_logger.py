# -*- coding: utf-8 -*-
"""
Monitor Logger - Real-time Activity Logging for 24h Monitor

Logs detailed progress messages to database for live feed display.

Event Types:
- monitor_start: Monitor daemon started
- monitor_stop: Monitor daemon stopped
- check_start: Starting region check cycle
- check_region: Checking specific region
- new_detected: New article detected
- scrape_start: Starting scrape
- scrape_progress: Scrape in progress
- scrape_complete: Scrape completed
- ai_start: AI processing started
- ai_complete: AI processing completed
- publish: Article published
- block_detected: Site blocking detected
- error: Error occurred

Version: 1.0
Created: 2025-12-27
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any
import httpx

# Supabase connection
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Korean region names
REGION_NAMES = {
    'gwangju': '광주광역시',
    'jeonnam': '전라남도',
    'mokpo': '목포시',
    'yeosu': '여수시',
    'suncheon': '순천시',
    'naju': '나주시',
    'gwangyang': '광양시',
    'damyang': '담양군',
    'gokseong': '곡성군',
    'gurye': '구례군',
    'goheung': '고흥군',
    'boseong': '보성군',
    'hwasun': '화순군',
    'jangheung': '장흥군',
    'gangjin': '강진군',
    'haenam': '해남군',
    'yeongam': '영암군',
    'muan': '무안군',
    'hampyeong': '함평군',
    'yeonggwang': '영광군',
    'jangseong': '장성군',
    'wando': '완도군',
    'jindo': '진도군',
    'shinan': '신안군',
    'gwangju_edu': '광주교육청',
    'jeonnam_edu': '전남교육청',
}


class MonitorLogger:
    """
    Logs real-time monitoring activity to database.

    Usage:
        logger = MonitorLogger()

        # Log monitoring start
        logger.monitor_started(26)

        # Log region check
        logger.checking_region('gwangju')

        # Log new article found
        logger.new_article_detected('gwangju', 'Title here')

        # Log scraping progress
        logger.scraping_started('gwangju', 'Title here')
        logger.scraping_completed('gwangju', 'Title here')

        # Log AI processing
        logger.ai_processing_started('gwangju', 'Title here')
        logger.ai_processing_completed('gwangju', 'Title here')

        # Log publish
        logger.article_published('gwangju', 'Title here', article_id=123)
    """

    def __init__(self):
        self.headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
        }
        self.base_url = f"{SUPABASE_URL}/rest/v1"

    def _get_region_name(self, region_code: str) -> str:
        """Get Korean name for region."""
        return REGION_NAMES.get(region_code, region_code)

    def _log(
        self,
        event_type: str,
        message: str,
        region_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Write log entry to database."""
        try:
            url = f"{self.base_url}/monitor_activity_log"
            data = {
                'event_type': event_type,
                'message': message,
                'region_code': region_code,
                'details': details or {},
            }

            response = httpx.post(
                url,
                headers={**self.headers, 'Prefer': 'return=minimal'},
                json=data,
                timeout=5
            )

            return response.status_code in (200, 201)

        except Exception as e:
            print(f"[LOG ERROR] Failed to write log: {e}")
            return False

    # ============================================================
    # Monitor Lifecycle
    # ============================================================

    def monitor_started(self, region_count: int) -> bool:
        """Log monitor daemon started."""
        return self._log(
            'start',
            f'{region_count}개 시군 모니터링을 시작합니다',
            details={'region_count': region_count}
        )

    def monitor_stopped(self) -> bool:
        """Log monitor daemon stopped."""
        return self._log('stop', '모니터링이 중지되었습니다')

    def monitor_cycle_start(self, region_count: int) -> bool:
        """Log start of a monitoring cycle."""
        return self._log(
            'check',
            f'{region_count}개 지역 점검 시작',
            details={'region_count': region_count}
        )

    def monitor_cycle_complete(self, checked: int, new_found: int, duration_sec: float) -> bool:
        """Log completion of a monitoring cycle."""
        return self._log(
            'check',
            f'점검 완료: {checked}개 지역, 새 기사 {new_found}건 ({duration_sec:.1f}초)',
            details={'checked': checked, 'new_found': new_found, 'duration': duration_sec}
        )

    # ============================================================
    # Region Checking
    # ============================================================

    def checking_region(self, region_code: str) -> bool:
        """Log that we're checking a specific region."""
        name = self._get_region_name(region_code)
        return self._log(
            'check',
            f'{name} 점검 중...',
            region_code=region_code
        )

    def region_no_new(self, region_code: str) -> bool:
        """Log that no new articles in region."""
        name = self._get_region_name(region_code)
        return self._log(
            'check',
            f'{name} - 새 기사 없음',
            region_code=region_code
        )

    # ============================================================
    # New Article Detection
    # ============================================================

    def new_article_detected(self, region_code: str, title: str, count: int = 1) -> bool:
        """Log new article(s) detected."""
        name = self._get_region_name(region_code)
        if count == 1:
            msg = f'{name}에서 새로운 기사가 감지되었습니다'
        else:
            msg = f'{name}에서 새로운 기사 {count}건이 감지되었습니다'

        return self._log(
            'new_article',
            msg,
            region_code=region_code,
            details={'title': title[:100], 'count': count}
        )

    # ============================================================
    # Scraping Progress
    # ============================================================

    def scraping_started(self, region_code: str, title: str) -> bool:
        """Log scraping started."""
        name = self._get_region_name(region_code)
        return self._log(
            'scrape',
            f'{name} 기사 추출 중...',
            region_code=region_code,
            details={'title': title[:100], 'status': 'started'}
        )

    def scraping_progress(self, region_code: str, message: str) -> bool:
        """Log scraping progress."""
        return self._log(
            'scrape',
            message,
            region_code=region_code,
            details={'status': 'in_progress'}
        )

    def scraping_completed(self, region_code: str, title: str) -> bool:
        """Log scraping completed."""
        name = self._get_region_name(region_code)
        short_title = title[:30] + '...' if len(title) > 30 else title
        return self._log(
            'scrape',
            f'추출 완료: {short_title}',
            region_code=region_code,
            details={'title': title[:100], 'status': 'completed'}
        )

    def scraping_failed(self, region_code: str, error: str) -> bool:
        """Log scraping failed."""
        name = self._get_region_name(region_code)
        return self._log(
            'error',
            f'{name} 기사 추출 실패: {error}',
            region_code=region_code,
            details={'error': error}
        )

    # ============================================================
    # AI Processing
    # ============================================================

    def ai_processing_started(self, region_code: str, title: str) -> bool:
        """Log AI processing started."""
        return self._log(
            'ai',
            'AI 기사 가공 중...',
            region_code=region_code,
            details={'title': title[:100], 'status': 'started'}
        )

    def ai_processing_completed(self, region_code: str, title: str) -> bool:
        """Log AI processing completed."""
        return self._log(
            'ai',
            'AI 가공 완료',
            region_code=region_code,
            details={'title': title[:100], 'status': 'completed'}
        )

    def ai_processing_failed(self, region_code: str, error: str) -> bool:
        """Log AI processing failed."""
        return self._log(
            'error',
            f'AI 가공 실패: {error}',
            region_code=region_code,
            details={'error': error}
        )

    # ============================================================
    # Publishing
    # ============================================================

    def article_published(self, region_code: str, title: str, article_id: int) -> bool:
        """Log article published."""
        name = self._get_region_name(region_code)
        short_title = title[:30] + '...' if len(title) > 30 else title
        return self._log(
            'publish',
            f'기사 발행 완료! "{short_title}"',
            region_code=region_code,
            details={'title': title[:100], 'article_id': article_id}
        )

    def article_saved_draft(self, region_code: str, title: str, article_id: int) -> bool:
        """Log article saved as draft."""
        return self._log(
            'publish',
            f'기사 초안 저장 (ID: {article_id})',
            region_code=region_code,
            details={'title': title[:100], 'article_id': article_id, 'status': 'draft'}
        )

    # ============================================================
    # Errors and Blocks
    # ============================================================

    def block_detected(self, region_code: str, cooldown_hours: int) -> bool:
        """Log site blocking detected."""
        name = self._get_region_name(region_code)
        return self._log(
            'block',
            f'{name} 사이트 접근 차단됨 ({cooldown_hours}시간 대기)',
            region_code=region_code,
            details={'cooldown_hours': cooldown_hours}
        )

    def error(self, message: str, region_code: Optional[str] = None, error: Optional[str] = None) -> bool:
        """Log general error."""
        return self._log(
            'error',
            message,
            region_code=region_code,
            details={'error': error} if error else None
        )

    # ============================================================
    # Status Updates
    # ============================================================

    def update_monitor_stats(self, checks: int, found: int, collected: int) -> bool:
        """Update monitor statistics in realtime_monitor table."""
        try:
            url = f"{self.base_url}/realtime_monitor"

            # Get current row ID
            response = httpx.get(
                url,
                headers=self.headers,
                params={'select': 'id'},
                timeout=5
            )

            if response.status_code != 200:
                return False

            data = response.json()
            if not data:
                return False

            row_id = data[0]['id']

            # Update stats
            update_response = httpx.patch(
                url,
                headers={**self.headers, 'Prefer': 'return=minimal'},
                params={'id': f'eq.{row_id}'},
                json={
                    'total_checks': checks,
                    'total_articles_found': found,
                    'total_articles_collected': collected,
                    'last_check_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                },
                timeout=5
            )

            return update_response.status_code in (200, 204)

        except Exception as e:
            print(f"[LOG ERROR] Failed to update stats: {e}")
            return False

    def is_monitor_running(self) -> bool:
        """Check if monitor should be running."""
        try:
            url = f"{self.base_url}/realtime_monitor"
            response = httpx.get(
                url,
                headers=self.headers,
                params={'select': 'is_running'},
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0].get('is_running', False)

            return False

        except Exception as e:
            print(f"[LOG ERROR] Failed to check monitor status: {e}")
            return False

    def check_force_check(self) -> bool:
        """Check if immediate check is requested and clear the flag."""
        try:
            url = f"{self.base_url}/realtime_monitor"
            response = httpx.get(
                url,
                headers=self.headers,
                params={'select': 'id,config'},
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                if data and data[0].get('config', {}).get('force_check'):
                    # Clear the flag
                    row_id = data[0]['id']
                    config = data[0].get('config', {})
                    config['force_check'] = False
                    httpx.patch(
                        url,
                        headers={**self.headers, 'Prefer': 'return=minimal'},
                        params={'id': f'eq.{row_id}'},
                        json={'config': config},
                        timeout=5
                    )
                    print("[FORCE CHECK] Immediate check triggered by admin")
                    return True

            return False

        except Exception as e:
            print(f"[LOG ERROR] Failed to check force_check: {e}")
            return False


# ============================================================
# Singleton instance
# ============================================================
_logger = None


def get_logger() -> MonitorLogger:
    """Get singleton logger instance."""
    global _logger
    if _logger is None:
        _logger = MonitorLogger()
    return _logger


# ============================================================
# Convenience functions
# ============================================================
def log_checking(region_code: str) -> bool:
    return get_logger().checking_region(region_code)


def log_new_article(region_code: str, title: str, count: int = 1) -> bool:
    return get_logger().new_article_detected(region_code, title, count)


def log_scraping(region_code: str, title: str) -> bool:
    return get_logger().scraping_started(region_code, title)


def log_scrape_done(region_code: str, title: str) -> bool:
    return get_logger().scraping_completed(region_code, title)


def log_ai_start(region_code: str, title: str) -> bool:
    return get_logger().ai_processing_started(region_code, title)


def log_ai_done(region_code: str, title: str) -> bool:
    return get_logger().ai_processing_completed(region_code, title)


def log_published(region_code: str, title: str, article_id: int) -> bool:
    return get_logger().article_published(region_code, title, article_id)


def log_error(message: str, region_code: Optional[str] = None) -> bool:
    return get_logger().error(message, region_code)

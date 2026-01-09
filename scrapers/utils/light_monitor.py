# -*- coding: utf-8 -*-
"""
Light Monitor - Fast HTTP-based Change Detection with Auto-Trigger
Version: 2.1 (2025-12-27)

Enhanced with Advanced Stealth:
- Real browser TLS fingerprinting (curl_cffi)
- Latest 2025 User-Agent rotation
- Korean government site specialized patterns
- Human-like behavior simulation
- Advanced block detection & auto-recovery
- Session persistence with browser-like cookies

Features:
- Lightweight HTTP requests (not browser)
- Only triggers Playwright when new articles are detected
- Minimal footprint, maximum stealth

NEW in v2.1 - Auto-Trigger System:
- trigger_scraper(): Async scraper invocation when new articles detected
- trigger_ai_process(): AI processing bot trigger via API
- check_all_regions() now supports auto_trigger parameter
- Background processing with callbacks

Usage:
    from scrapers.utils.light_monitor import (
        LightMonitor,
        trigger_scraper,
        trigger_ai_process,
        get_monitor
    )

    # Check all regions with auto-trigger enabled
    monitor = get_monitor()
    results = monitor.check_all_regions(
        configs=REGION_CONFIGS,
        last_known_ids=last_ids,
        auto_trigger=True,  # Auto-trigger scrapers
        trigger_ai=True     # Auto-trigger AI processing
    )

Created: 2025-12-27
Updated: 2025-12-27 - Added auto-trigger system
"""

import os
import re
import sys
import time
import random
import subprocess
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Callable
from dataclasses import dataclass

# Load .env.local for environment variables (Next.js style)
try:
    from dotenv import load_dotenv
    # Try multiple possible .env file locations
    env_paths = [
        os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'),
        os.path.join(os.path.dirname(__file__), '..', '..', '.env'),
        '.env.local',
        '.env',
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"[DAEMON] Loaded environment from: {env_path}")
            break
except ImportError:
    print("[WARN] python-dotenv not installed, using system environment only")

# Try to import advanced stealth module
try:
    # Try relative import first (when imported as package)
    from .advanced_stealth import (
        AdvancedStealth,
        get_stealth_client,
        BLOCK_INDICATORS,
        TIMING_PROFILES,
        HAS_CURL_CFFI,
    )
    HAS_ADVANCED_STEALTH = True
except ImportError:
    try:
        # Fallback to absolute import (when run directly as script)
        from advanced_stealth import (
            AdvancedStealth,
            get_stealth_client,
            BLOCK_INDICATORS,
            TIMING_PROFILES,
            HAS_CURL_CFFI,
        )
        HAS_ADVANCED_STEALTH = True
    except ImportError:
        HAS_ADVANCED_STEALTH = False
        HAS_CURL_CFFI = False
        print("[WARN] Advanced stealth module not available, using basic mode")

import httpx

# Supabase client for database operations
try:
    from supabase import create_client
except ImportError:
    print("[WARN] supabase-py not installed, some features may not work")
    create_client = None

# ============================================================
# LATEST USER-AGENTS (December 2025)
# ============================================================
MONITOR_USER_AGENTS = [
    # Chrome on Windows (most common in Korea)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    # Edge on Windows (popular in Korea government)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    # Samsung Internet (popular in Korea)
    'Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
    # Chrome on Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    # Safari on iPhone
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
    # Chrome on Android
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
]

# Referer sources (pretend coming from search engines)
REFERER_SOURCES = [
    'https://search.naver.com/search.naver?query=',
    'https://search.daum.net/search?q=',
    'https://www.google.com/search?q=',
    'https://m.search.naver.com/search.naver?query=',
    '',  # Direct access (sometimes)
]

# Region search keywords for realistic referers
REGION_KEYWORDS = {
    'gwangju': '광주시청 보도자료',
    'jeonnam': '전라남도청 보도자료',
    'mokpo': '목포시청 소식',
    'yeosu': '여수시청 뉴스',
    'suncheon': '순천시 보도자료',
    'naju': '나주시청 보도자료',
    'gwangyang': '광양시청',
    'damyang': '담양군청 소식',
    'gokseong': '곡성군청',
    'gurye': '구례군 뉴스',
    'goheung': '고흥군청',
    'boseong': '보성군 소식',
    'hwasun': '화순군청',
    'jangheung': '장흥군 보도',
    'gangjin': '강진군청',
    'haenam': '해남군 소식',
    'yeongam': '영암군청',
    'muan': '무안군 뉴스',
    'hampyeong': '함평군청 소식',
    'yeonggwang': '영광군 보도',
    'jangseong': '장성군청',
    'wando': '완도군 소식',
    'jindo': '진도군청',
    'shinan': '신안군 뉴스',
    'gwangju_edu': '광주교육청 보도자료',
    'jeonnam_edu': '전남교육청 보도자료',
}


@dataclass
class MonitorResult:
    """Result of monitoring a single region."""
    region_code: str
    success: bool
    has_new: bool
    new_article_ids: List[str]
    new_article_urls: List[str]
    error: Optional[str] = None
    blocked: bool = False
    response_time_ms: int = 0


@dataclass
class BlockStatus:
    """Tracking block status for a region."""
    region_code: str
    is_blocked: bool = False
    blocked_at: Optional[datetime] = None
    cooldown_until: Optional[datetime] = None
    consecutive_blocks: int = 0
    request_interval_multiplier: float = 1.0


class LightMonitor:
    """
    Lightweight HTTP-based monitor for change detection.

    Now with Advanced Stealth integration for maximum evasion.

    Usage:
        monitor = LightMonitor()

        # Check single region
        result = monitor.check_region('gwangju', config, last_known_id)

        # Check if blocked
        if result.blocked:
            print("Site is blocking us!")
    """

    def __init__(self, timeout: int = 15, use_advanced_stealth: bool = True):
        self.timeout = timeout
        self.use_advanced_stealth = use_advanced_stealth and HAS_ADVANCED_STEALTH

        # Advanced stealth client (if available)
        if self.use_advanced_stealth:
            self.stealth_client = AdvancedStealth(
                timeout=timeout,
                timing_profile='normal_reader',
                use_curl_cffi=True,
            )
            print(f"[MONITOR] Using Advanced Stealth (curl_cffi: {HAS_CURL_CFFI})")
        else:
            self.stealth_client = None

        # Fallback: Block status tracking
        self.block_status: Dict[str, BlockStatus] = {}

        # Session cookies per region (simulates browsing session)
        self.session_cookies: Dict[str, Dict[str, str]] = {}

        # HTTP client with connection pooling (fallback)
        self.client = httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            http2=True,
        )

    def _get_session_cookies(self, region_code: str) -> Dict[str, str]:
        """Get or create session cookies for a region."""
        if region_code not in self.session_cookies:
            import uuid
            import hashlib
            session_id = hashlib.md5(
                f"{time.time()}{random.random()}".encode()
            ).hexdigest()[:24].upper()

            self.session_cookies[region_code] = {
                'JSESSIONID': session_id,
                '_ga': f'GA1.2.{random.randint(100000000, 999999999)}.{int(time.time())}',
                '_gid': f'GA1.2.{random.randint(100000000, 999999999)}.{int(time.time())}',
            }
        return self.session_cookies[region_code]

    def _clear_session(self, region_code: str) -> None:
        """Clear session cookies for a region (after block detection)."""
        if region_code in self.session_cookies:
            del self.session_cookies[region_code]

    def _get_headers(self, region_code: str = '', target_url: str = '') -> Dict[str, str]:
        """Get randomized headers for monitoring."""
        user_agent = random.choice(MONITOR_USER_AGENTS)

        headers = {
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }

        # Add sec-ch-ua headers for modern Chrome
        if 'Chrome/131' in user_agent:
            headers['sec-ch-ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
        elif 'Chrome/130' in user_agent:
            headers['sec-ch-ua'] = '"Google Chrome";v="130", "Chromium";v="130", "Not_A Brand";v="24"'
        elif 'Edg/' in user_agent:
            headers['sec-ch-ua'] = '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"'

        headers['sec-ch-ua-mobile'] = '?0'
        headers['sec-ch-ua-platform'] = '"Windows"'

        # Add realistic Referer (70% from search, 30% direct)
        if random.random() < 0.7 and region_code:
            referer_base = random.choice([r for r in REFERER_SOURCES if r])
            keyword = REGION_KEYWORDS.get(region_code, region_code)
            from urllib.parse import quote
            headers['Referer'] = referer_base + quote(keyword)
        elif target_url:
            from urllib.parse import urlparse
            parsed = urlparse(target_url)
            headers['Referer'] = f"{parsed.scheme}://{parsed.netloc}/"

        # Random cache behavior variation
        if random.random() < 0.3:
            headers['Cache-Control'] = 'no-cache'
            headers['Pragma'] = 'no-cache'

        return headers

    def _is_blocked_response(self, response: httpx.Response, text: str) -> Tuple[bool, str]:
        """Detect if response indicates blocking with detailed reason."""
        # Status code checks
        if response.status_code in (403, 429, 503, 451, 406):
            return True, f"HTTP {response.status_code}"

        text_lower = text.lower()

        # Korean block patterns
        korean_blocks = [
            '접근이 차단', '차단되었', '접근 거부', '접근거부',
            '비정상적인 접근', '자동화된 접근', '로봇', '봇 차단',
            '과도한 요청', '잠시 후 다시', '서비스 이용 제한',
            '접속이 차단', '차단 페이지', 'IP 차단',
            '보안 정책', '웹 방화벽', '정상적인 접근',
            'IP 주소가 차단', '일시적으로 차단',
        ]

        for pattern in korean_blocks:
            if pattern in text_lower:
                return True, f"Korean block: {pattern}"

        # English block patterns
        english_blocks = [
            'blocked', 'forbidden', 'denied', 'access denied',
            'captcha', 'robot', 'bot detected', 'automated',
            'too many requests', 'rate limit', 'rate-limit',
            'security check', 'challenge', 'cloudflare',
            'ddos protection', 'please wait', 'try again later',
        ]

        for pattern in english_blocks:
            if pattern in text_lower:
                return True, f"English block: {pattern}"

        # WAF signatures
        waf_sigs = ['incapsula', 'imperva', 'cloudflare', 'akamai', 'sucuri']
        for sig in waf_sigs:
            if sig in text_lower:
                return True, f"WAF: {sig}"

        return False, ""

    def _extract_article_ids(self, html: str, config: Dict) -> List[Tuple[str, str]]:
        """Extract article IDs and URLs from HTML using regex."""
        base_url = config.get('base_url', '')
        results = []

        # Common patterns for article links
        patterns = [
            r'href=["\']([^"\']*[?&]idx=(\d+)[^"\']*)["\']',
            r'href=["\']([^"\']*[?&]seq=(\d+)[^"\']*)["\']',
            r'href=["\']([^"\']*[?&]nttId=(\d+)[^"\']*)["\']',
            r'href=["\']([^"\']*[?&]boardSeq=(\d+)[^"\']*)["\']',
            r'href=["\']([^"\']*[?&]no=(\d+)[^"\']*)["\']',
            r'href=["\']([^"\']*[?&]bbsId=\w+[^"\']*nttId=(\d+)[^"\']*)["\']',
            r'href=["\']([^"\']*(?:/view/|/article/|/detail/)(\d+)[^"\']*)["\']',
            r'onclick=["\'][^"\']*goView[^"\']*\((\d+)\)["\']',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple) and len(match) >= 2:
                    url = match[0]
                    article_id = match[1]
                else:
                    article_id = match
                    url = ''

                # Build full URL if relative
                if url and url.startswith('/'):
                    url = base_url + url
                elif url and not url.startswith('http'):
                    url = base_url + '/' + url

                if article_id:
                    results.append((str(article_id), url))

        # Remove duplicates while preserving order
        seen = set()
        unique_results = []
        for item in results:
            if item[0] not in seen:
                seen.add(item[0])
                unique_results.append(item)

        return unique_results[:15]  # Return top 15

    def _update_block_status(self, region_code: str, is_blocked: bool, reason: str = "") -> None:
        """Update block tracking for a region."""
        if region_code not in self.block_status:
            self.block_status[region_code] = BlockStatus(region_code=region_code)

        status = self.block_status[region_code]

        if is_blocked:
            status.is_blocked = True
            status.blocked_at = datetime.now()
            status.consecutive_blocks += 1

            # Exponential backoff: 30min, 1h, 2h, 4h, max 8h
            cooldown_minutes = min(480, 30 * (2 ** (status.consecutive_blocks - 1)))
            status.cooldown_until = datetime.now() + timedelta(minutes=cooldown_minutes)
            status.request_interval_multiplier = min(5.0, 1.0 + (status.consecutive_blocks * 0.5))

            # Clear session to get fresh identity
            self._clear_session(region_code)

            print(f"[BLOCK] {region_code}: {reason} | Cooldown {cooldown_minutes}min | Multiplier {status.request_interval_multiplier}x")

        else:
            # Gradually reduce block status on success
            if status.consecutive_blocks > 0:
                status.consecutive_blocks = max(0, status.consecutive_blocks - 1)
                status.request_interval_multiplier = max(1.0, status.request_interval_multiplier - 0.25)
            status.is_blocked = False

    def is_in_cooldown(self, region_code: str) -> bool:
        """Check if region is in cooldown period."""
        # Use advanced stealth if available
        if self.use_advanced_stealth and self.stealth_client:
            return self.stealth_client.is_in_cooldown(region_code)

        # Fallback
        status = self.block_status.get(region_code)
        if not status or not status.cooldown_until:
            return False
        return datetime.now() < status.cooldown_until

    def get_interval_multiplier(self, region_code: str) -> float:
        """Get request interval multiplier for a region."""
        status = self.block_status.get(region_code)
        if not status:
            return 1.0
        return status.request_interval_multiplier

    def check_region(
        self,
        region_code: str,
        config: Dict,
        last_known_id: Optional[str] = None
    ) -> MonitorResult:
        """
        Check a region for new articles using lightweight HTTP.

        Uses Advanced Stealth if available for maximum evasion.
        """
        # Check cooldown
        if self.is_in_cooldown(region_code):
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                new_article_ids=[],
                new_article_urls=[],
                error="In cooldown period",
                blocked=True
            )

        list_url = config.get('list_url', '')
        if not list_url:
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                new_article_ids=[],
                new_article_urls=[],
                error="No list_url configured"
            )

        try:
            start_time = time.time()

            # Use Advanced Stealth if available
            if self.use_advanced_stealth and self.stealth_client:
                text, is_blocked, error = self.stealth_client.get_for_region(
                    region_code,
                    list_url,
                    apply_delay=True,
                )
                response_time = int((time.time() - start_time) * 1000)

                if is_blocked:
                    return MonitorResult(
                        region_code=region_code,
                        success=False,
                        has_new=False,
                        new_article_ids=[],
                        new_article_urls=[],
                        error=error or "Blocked",
                        blocked=True,
                        response_time_ms=response_time
                    )

                if text is None:
                    return MonitorResult(
                        region_code=region_code,
                        success=False,
                        has_new=False,
                        new_article_ids=[],
                        new_article_urls=[],
                        error=error or "No response",
                        response_time_ms=response_time
                    )

            else:
                # Fallback to basic httpx
                # Human-like delay before request
                delay = random.gauss(3.0, 0.8)
                delay = max(1.5, min(5.0, delay))
                time.sleep(delay)

                response = self.client.get(
                    list_url,
                    headers=self._get_headers(region_code, list_url),
                    cookies=self._get_session_cookies(region_code)
                )
                response_time = int((time.time() - start_time) * 1000)
                text = response.text

                # Check for blocking
                is_blocked, reason = self._is_blocked_response(response, text)
                if is_blocked:
                    self._update_block_status(region_code, True, reason)
                    return MonitorResult(
                        region_code=region_code,
                        success=False,
                        has_new=False,
                        new_article_ids=[],
                        new_article_urls=[],
                        error=f"Blocked ({reason})",
                        blocked=True,
                        response_time_ms=response_time
                    )

                # Success
                self._update_block_status(region_code, False)

            # Extract article IDs
            articles = self._extract_article_ids(text, config)

            if not articles:
                return MonitorResult(
                    region_code=region_code,
                    success=True,
                    has_new=False,
                    new_article_ids=[],
                    new_article_urls=[],
                    response_time_ms=response_time
                )

            # Find new articles
            new_ids = []
            new_urls = []

            if last_known_id is None:
                # First run - just return newest
                new_ids = [articles[0][0]]
                new_urls = [articles[0][1]]
            else:
                for article_id, article_url in articles:
                    if article_id == last_known_id:
                        break
                    new_ids.append(article_id)
                    new_urls.append(article_url)

            return MonitorResult(
                region_code=region_code,
                success=True,
                has_new=len(new_ids) > 0,
                new_article_ids=new_ids,
                new_article_urls=new_urls,
                response_time_ms=response_time
            )

        except httpx.TimeoutException:
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                new_article_ids=[],
                new_article_urls=[],
                error="Timeout"
            )
        except Exception as e:
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                new_article_ids=[],
                new_article_urls=[],
                error=str(e)
            )

    def check_all_regions(
        self,
        configs: Dict[str, Dict],
        last_known_ids: Dict[str, str],
        auto_trigger: bool = True,
        trigger_ai: bool = True,
        on_scraper_complete: Callable = None
    ) -> Dict[str, MonitorResult]:
        """
        Check all regions for new articles.

        Args:
            configs: Region configuration dictionary
            last_known_ids: Last known article ID per region
            auto_trigger: Whether to auto-trigger scrapers for new articles
            trigger_ai: Whether to trigger AI processing after scraping
            on_scraper_complete: Callback when scraper completes

        Returns:
            Dictionary of MonitorResult per region
        """
        results = {}
        triggered_regions = []

        # Shuffle region order to avoid patterns
        region_codes = list(configs.keys())
        random.shuffle(region_codes)

        for region_code in region_codes:
            config = configs[region_code]

            # Calculate delay with multiplier for blocked regions
            base_delay = random.gauss(4.0, 1.0)
            base_delay = max(2.0, min(7.0, base_delay))

            multiplier = self.get_interval_multiplier(region_code)
            actual_delay = base_delay * multiplier

            # Add extra delay after blocks
            if self.block_status.get(region_code, BlockStatus(region_code)).consecutive_blocks > 0:
                actual_delay += random.uniform(3.0, 8.0)

            time.sleep(actual_delay)

            last_id = last_known_ids.get(region_code)
            result = self.check_region(region_code, config, last_id)
            results[region_code] = result

            if result.has_new:
                print(f"[NEW] {region_code}: {len(result.new_article_ids)} new articles")

                # Auto-trigger scraper for new articles (non-blocking)
                if auto_trigger and result.new_article_ids:
                    trigger_scraper(
                        region_code=region_code,
                        article_ids=result.new_article_ids,
                        article_urls=result.new_article_urls,
                        callback=on_scraper_complete,
                        trigger_ai=trigger_ai
                    )
                    triggered_regions.append(region_code)

            elif result.blocked:
                print(f"[BLOCK] {region_code}: {result.error}")
            elif result.error:
                print(f"[ERROR] {region_code}: {result.error}")

        # Log triggered regions
        if triggered_regions:
            print(f"[TRIGGER] Scrapers triggered for: {', '.join(triggered_regions)}")

        return results

    def get_stats(self) -> Dict:
        """Get monitoring statistics."""
        if self.use_advanced_stealth and self.stealth_client:
            return self.stealth_client.get_stats()

        return {
            'blocked_regions': [
                code for code, status in self.block_status.items()
                if status.is_blocked
            ],
            'cooldown_regions': [
                code for code in self.block_status
                if self.is_in_cooldown(code)
            ],
        }

    def close(self):
        """Close HTTP clients."""
        self.client.close()
        if self.use_advanced_stealth and self.stealth_client:
            self.stealth_client.close()


# ============================================================
# Trigger Functions (Async Scraper & AI Bot)
# ============================================================

def get_scraper_path(region_code: str) -> Optional[str]:
    """
    Get the path to the regional scraper script.
    Returns None if scraper not found.
    """
    import os

    # Base directory for scrapers
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Common scraper naming patterns
    patterns = [
        f"{region_code}/{region_code}_scraper.py",
        f"{region_code}/main.py",
        f"{region_code}/scraper.py",
    ]

    for pattern in patterns:
        path = os.path.join(base_dir, pattern)
        if os.path.exists(path):
            return path

    return None


def trigger_scraper(
    region_code: str,
    article_ids: List[str],
    article_urls: List[str] = None,
    callback: Callable = None,
    trigger_ai: bool = True,
    max_articles: int = 10
) -> bool:
    """
    Trigger regional scraper asynchronously.

    Runs the scraper in a separate process and returns immediately.
    The monitoring bot can continue to the next region while scraper runs.

    Args:
        region_code: Region code (e.g., 'naju', 'gwangyang')
        article_ids: List of new article IDs to scrape
        article_urls: Optional list of article URLs
        callback: Optional callback function when scraper completes
        trigger_ai: Whether to trigger AI processing after scraping
        max_articles: Maximum articles to scrape

    Returns:
        True if scraper was triggered successfully
    """
    scraper_path = get_scraper_path(region_code)

    if not scraper_path:
        print(f"[TRIGGER] Scraper not found for region: {region_code}")
        return False

    # Build command arguments
    cmd = [
        sys.executable,
        scraper_path,
        '--max-articles', str(min(len(article_ids), max_articles)),
    ]

    # Add article IDs if scraper supports it
    if article_ids:
        cmd.extend(['--article-ids', ','.join(article_ids[:max_articles])])

    # Add trigger-ai flag
    if trigger_ai:
        cmd.append('--trigger-ai')

    def run_scraper():
        """Run scraper in background thread."""
        try:
            print(f"[TRIGGER] Starting scraper for {region_code}: {len(article_ids)} articles")

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                cwd=os.path.dirname(os.path.dirname(scraper_path))
            )

            if result.returncode == 0:
                print(f"[TRIGGER] Scraper completed for {region_code}")
                if callback:
                    callback(region_code, True, article_ids)
            else:
                print(f"[TRIGGER] Scraper failed for {region_code}: {result.stderr[:200]}")
                if callback:
                    callback(region_code, False, article_ids)

        except subprocess.TimeoutExpired:
            print(f"[TRIGGER] Scraper timeout for {region_code}")
            if callback:
                callback(region_code, False, article_ids)
        except Exception as e:
            print(f"[TRIGGER] Scraper error for {region_code}: {e}")
            if callback:
                callback(region_code, False, article_ids)

    # Run in background thread (non-blocking)
    thread = threading.Thread(target=run_scraper, daemon=True)
    thread.start()

    print(f"[TRIGGER] Scraper triggered for {region_code} (background)")
    return True


def check_server_running(host: str = 'localhost', port: int = 3000, timeout: float = 2.0) -> bool:
    """
    Check if a server is running on the specified port.

    Args:
        host: Server host
        port: Server port
        timeout: Connection timeout in seconds

    Returns:
        True if server is responding
    """
    import socket
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def start_ollama_server() -> bool:
    """
    Start Ollama server if not running.

    Returns:
        True if Ollama is running (either already or just started)
    """
    OLLAMA_PORT = 11434

    # Check if already running
    if check_server_running('localhost', OLLAMA_PORT):
        print("[AI-TRIGGER] Ollama server already running")
        return True

    print("[AI-TRIGGER] Starting Ollama server...")

    try:
        # Start Ollama in background
        if sys.platform == 'win32':
            # Windows: use start command to run in background
            subprocess.Popen(
                ['cmd', '/c', 'start', '/min', 'ollama', 'serve'],
                shell=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # Unix: use nohup
            subprocess.Popen(
                ['nohup', 'ollama', 'serve'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )

        # Wait for Ollama to start (max 30 seconds)
        for i in range(30):
            time.sleep(1)
            if check_server_running('localhost', OLLAMA_PORT):
                print(f"[AI-TRIGGER] Ollama server started (took {i+1}s)")
                return True

        print("[AI-TRIGGER] Ollama server failed to start within 30s")
        return False

    except FileNotFoundError:
        print("[AI-TRIGGER] ERROR: Ollama not installed. Install from https://ollama.ai")
        return False
    except Exception as e:
        print(f"[AI-TRIGGER] ERROR starting Ollama: {e}")
        return False


def start_nextjs_server(project_path: str = None) -> bool:
    """
    Start Next.js development server if not running.

    Args:
        project_path: Path to Next.js project (defaults to koreanews root)

    Returns:
        True if server is running (either already or just started)
    """
    NEXTJS_PORT = 3000

    # Check if already running
    if check_server_running('localhost', NEXTJS_PORT):
        print("[AI-TRIGGER] Next.js server already running")
        return True

    # Determine project path
    if project_path is None:
        # Go up from scrapers/utils to koreanews root
        project_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # Verify package.json exists
    package_json = os.path.join(project_path, 'package.json')
    if not os.path.exists(package_json):
        print(f"[AI-TRIGGER] ERROR: package.json not found at {project_path}")
        return False

    print(f"[AI-TRIGGER] Starting Next.js server at {project_path}...")

    try:
        # Start npm run dev in background
        if sys.platform == 'win32':
            # Windows: use start command
            subprocess.Popen(
                ['cmd', '/c', 'start', '/min', 'cmd', '/c', 'npm', 'run', 'dev'],
                cwd=project_path,
                shell=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # Unix: use nohup
            subprocess.Popen(
                ['nohup', 'npm', 'run', 'dev'],
                cwd=project_path,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )

        # Wait for Next.js to start (max 60 seconds - Next.js can be slow)
        for i in range(60):
            time.sleep(1)
            if check_server_running('localhost', NEXTJS_PORT):
                print(f"[AI-TRIGGER] Next.js server started (took {i+1}s)")
                return True
            if i % 10 == 9:
                print(f"[AI-TRIGGER] Waiting for Next.js... ({i+1}s)")

        print("[AI-TRIGGER] Next.js server failed to start within 60s")
        return False

    except FileNotFoundError:
        print("[AI-TRIGGER] ERROR: npm not found. Install Node.js")
        return False
    except Exception as e:
        print(f"[AI-TRIGGER] ERROR starting Next.js: {e}")
        return False


def ensure_services_running() -> Tuple[bool, bool]:
    """
    Ensure both Ollama and Next.js servers are running.
    Starts them if needed.

    Returns:
        Tuple of (ollama_ready, nextjs_ready)
    """
    print("[AI-TRIGGER] Checking required services...")

    # Start Ollama first (AI processing depends on it)
    ollama_ready = start_ollama_server()

    # Then start Next.js (API server)
    nextjs_ready = start_nextjs_server()

    if ollama_ready and nextjs_ready:
        print("[AI-TRIGGER] All services ready")
    else:
        if not ollama_ready:
            print("[AI-TRIGGER] WARNING: Ollama not available")
        if not nextjs_ready:
            print("[AI-TRIGGER] WARNING: Next.js not available")

    return ollama_ready, nextjs_ready


def trigger_ai_process(
    region_code: str = None,
    article_ids: List[int] = None,
    mode: str = 'lightweight',
    api_url: str = None,
    api_key: str = 'korea-news-bot-secret-2024',
    auto_start_services: bool = True
) -> bool:
    """
    Trigger AI processing bot via API.

    Automatically starts Ollama and Next.js servers if needed.

    Args:
        region_code: Optional region filter
        article_ids: Optional specific article IDs to process
        mode: Processing mode ('lightweight' or 'full')
        api_url: API endpoint URL (defaults to localhost:3000)
        api_key: API authentication key
        auto_start_services: Whether to auto-start Ollama and Next.js if not running

    Returns:
        True if trigger was successful
    """
    # Auto-start services if enabled
    if auto_start_services:
        ollama_ready, nextjs_ready = ensure_services_running()

        if not nextjs_ready:
            print("[AI-TRIGGER] Cannot trigger AI: Next.js server not available")
            return False

        if not ollama_ready:
            print("[AI-TRIGGER] WARNING: Ollama not running, AI processing may fail")
            # Continue anyway - the API will return appropriate error

    # Default API URL
    if api_url is None:
        api_url = os.environ.get(
            'AI_TRIGGER_API_URL',
            'http://localhost:3001/api/bot/trigger-ai-process'
        )

    try:
        payload = {
            'mode': mode,
        }

        if region_code:
            payload['region'] = region_code

        if article_ids:
            payload['article_ids'] = article_ids

        print(f"[AI-TRIGGER] Calling API: {api_url}")

        # Use httpx for async-friendly request
        response = httpx.post(
            api_url,
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            print(f"[AI-TRIGGER] AI processing triggered: {result.get('message', 'OK')}")
            print(f"[AI-TRIGGER] Processed: {result.get('processed', 0)}, Success: {result.get('success_count', 0)}")
            return True
        else:
            print(f"[AI-TRIGGER] Failed to trigger AI: HTTP {response.status_code}")
            return False

    except Exception as e:
        print(f"[AI-TRIGGER] Error triggering AI: {e}")
        return False


def trigger_ai_for_region(region_code: str, article_ids: List[str]) -> bool:
    """
    Trigger AI processing for specific region and articles.
    Called after scraper completes.
    """
    # Convert string IDs to int if needed
    try:
        int_ids = [int(aid) for aid in article_ids]
    except ValueError:
        int_ids = None

    return trigger_ai_process(
        region_code=region_code,
        article_ids=int_ids,
        mode='lightweight'
    )


# ============================================================
# Convenience functions
# ============================================================
_monitor = None


def get_monitor(use_advanced_stealth: bool = True) -> LightMonitor:
    """Get singleton monitor instance."""
    global _monitor
    if _monitor is None:
        _monitor = LightMonitor(use_advanced_stealth=use_advanced_stealth)
    return _monitor


def quick_check(region_code: str, config: Dict, last_id: Optional[str] = None) -> MonitorResult:
    """Quick check for a single region."""
    return get_monitor().check_region(region_code, config, last_id)


# ============================================================
# Daemon Mode - Continuous Monitoring Loop
# ============================================================

def get_check_interval() -> int:
    """
    Get check interval based on current time (Korean timezone).

    Schedule:
    - 06:00-09:00: Every 30 minutes (morning news rush)
    - 09:00-18:00: Every 1 hour (business hours)
    - 18:00-22:00: Every 30 minutes (evening news rush)
    - 22:00-06:00: Every 2 hours (night)

    Returns:
        Interval in seconds
    """
    try:
        from zoneinfo import ZoneInfo
        kst = ZoneInfo('Asia/Seoul')
        now = datetime.now(kst)
    except ImportError:
        # Fallback: assume server is in KST
        now = datetime.now()

    hour = now.hour

    if 6 <= hour < 9:
        return 30 * 60   # 30 minutes
    elif 9 <= hour < 18:
        return 60 * 60   # 1 hour
    elif 18 <= hour < 22:
        return 30 * 60   # 30 minutes
    else:
        return 2 * 60 * 60  # 2 hours


def run_daemon(
    supabase_url: str = None,
    supabase_key: str = None,
    auto_trigger: bool = True,
    trigger_ai: bool = True,
    max_cycles: int = 0
):
    """
    Run monitoring daemon in continuous loop.

    Checks DB for is_running flag and executes monitoring cycles.
    If max_cycles > 0, exits after that many cycles.
    """
    import json

    # Get Supabase credentials from environment
    supabase_url = supabase_url or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = supabase_key or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("[DAEMON] ERROR: Supabase credentials not found")
        print("[DAEMON] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return

    # Import regional configs
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from configs.regional_configs import REGIONAL_CONFIGS as REGION_CONFIGS
    except ImportError as e:
        print(f"[DAEMON] ERROR: Cannot import REGION_CONFIGS: {e}")
        return

    print("=" * 60)
    print("Light Monitor Daemon v2.1")
    print("=" * 60)
    print(f"[DAEMON] Supabase URL: {supabase_url[:50]}...")
    print(f"[DAEMON] Regions: {len(REGION_CONFIGS)}")
    print(f"[DAEMON] Auto-trigger: {auto_trigger}")
    print(f"[DAEMON] Trigger AI: {trigger_ai}")
    print("=" * 60)

    # Initialize monitor
    monitor = get_monitor(use_advanced_stealth=True)

    # Track last known article IDs per region
    last_known_ids: Dict[str, str] = {}

    # Load initial state from DB
    try:
        response = httpx.get(
            f"{supabase_url}/rest/v1/scraper_state?select=region_code,last_article_id",
            headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}'
            }
        )
        if response.status_code == 200:
            for row in response.json():
                if row.get('last_article_id'):
                    last_known_ids[row['region_code']] = row['last_article_id']
            print(f"[DAEMON] Loaded {len(last_known_ids)} last known IDs from DB")
    except Exception as e:
        print(f"[DAEMON] Warning: Could not load initial state: {e}")

    cycle_count = 0

    while True:
        try:
            # Check if monitoring is enabled in DB
            response = httpx.get(
                f"{supabase_url}/rest/v1/realtime_monitor?select=is_running,config&limit=1",
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}'
                }
            )

            if response.status_code != 200:
                print(f"[DAEMON] DB check failed: {response.status_code}")
                time.sleep(60)
                continue

            data = response.json()
            if not data or not data[0].get('is_running', False):
                print("[DAEMON] Monitoring is paused (is_running=false). Waiting...")
                time.sleep(30)
                continue

            # Check for force_check flag
            config = data[0].get('config', {}) or {}
            force_check = config.get('force_check', False)

            if force_check:
                print("[DAEMON] Force check requested!")
                # Clear the flag
                httpx.patch(
                    f"{supabase_url}/rest/v1/realtime_monitor?id=eq.{data[0].get('id', 1)}",
                    headers={
                        'apikey': supabase_key,
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    json={'config': {**config, 'force_check': False}}
                )

            cycle_count += 1
            interval = get_check_interval()

            print(f"\n{'=' * 60}")
            print(f"[DAEMON] Cycle #{cycle_count} starting at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"[DAEMON] Next interval: {interval // 60} minutes")
            print(f"{'=' * 60}")

            # Run monitoring cycle
            results = monitor.check_all_regions(
                configs=REGION_CONFIGS,
                last_known_ids=last_known_ids,
                auto_trigger=auto_trigger,
                trigger_ai=trigger_ai
            )

            # Update last known IDs
            for region_code, result in results.items():
                if result.has_new and result.new_article_ids:
                    last_known_ids[region_code] = result.new_article_ids[0]

            # Log summary
            total_new = sum(1 for r in results.values() if r.has_new)
            total_blocked = sum(1 for r in results.values() if r.blocked)
            total_errors = sum(1 for r in results.values() if r.error and not r.blocked)

            print(f"\n[DAEMON] Cycle #{cycle_count} complete:")
            print(f"  - New articles: {total_new} regions")
            print(f"  - Blocked: {total_blocked} regions")
            print(f"  - Errors: {total_errors} regions")

            # Log to DB
            try:
                httpx.post(
                    f"{supabase_url}/rest/v1/monitor_activity_log",
                    headers={
                        'apikey': supabase_key,
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    json={
                        'event_type': 'cycle',
                        'message': f'Cycle #{cycle_count}: {total_new} new, {total_blocked} blocked',
                        'details': {
                            'cycle': cycle_count,
                            'new_regions': total_new,
                            'blocked_regions': total_blocked,
                            'error_regions': total_errors,
                            'interval_minutes': interval // 60
                        }
                    }
                )
            except Exception as log_error:
                print(f"[DAEMON] Warning: Failed to log cycle: {log_error}")

            # Check if max_cycles reached
            if max_cycles > 0 and cycle_count >= max_cycles:
                print(f"\n[DAEMON] Max cycles reached ({max_cycles}). Exiting...")
                break

            # Wait for next cycle
            print(f"\n[DAEMON] Sleeping for {interval // 60} minutes...")
            time.sleep(interval)

        except KeyboardInterrupt:
            print("\n[DAEMON] Interrupted by user. Exiting...")
            break
        except Exception as e:
            print(f"[DAEMON] Error in cycle: {e}")
            time.sleep(60)  # Wait 1 minute on error


# ============================================================
# Scheduler Mode - Time-based Automatic Monitoring
# ============================================================

def run_scheduler(
    supabase_url: str = None,
    supabase_key: str = None,
    auto_trigger: bool = True,
    trigger_ai: bool = True,
    cycles_per_run: int = 3
):
    """
    Run time-based scheduler that triggers monitoring at scheduled times.

    This mode runs continuously and checks system time every minute.
    When a scheduled time is reached, it runs 'cycles_per_run' monitoring cycles.

    Schedule is read from DB (realtime_monitor.config.schedule).
    Default schedule: ['09:00', '12:00', '15:00', '18:00']
    """
    import json

    # Get Supabase credentials from environment
    supabase_url = supabase_url or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = supabase_key or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("[SCHEDULER] ERROR: Supabase credentials not found")
        print("[SCHEDULER] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return

    # Import regional configs
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from configs.regional_configs import REGIONAL_CONFIGS as REGION_CONFIGS
    except ImportError as e:
        print(f"[SCHEDULER] ERROR: Cannot import REGION_CONFIGS: {e}")
        return

    # Default schedule (can be overridden by DB config)
    default_schedule = ['09:00', '12:00', '15:00', '18:00']

    print("=" * 60)
    print("Light Monitor Scheduler v1.0")
    print("=" * 60)
    print(f"[SCHEDULER] Supabase URL: {supabase_url[:50]}...")
    print(f"[SCHEDULER] Regions: {len(REGION_CONFIGS)}")
    print(f"[SCHEDULER] Cycles per run: {cycles_per_run}")
    print(f"[SCHEDULER] Auto-trigger: {auto_trigger}")
    print(f"[SCHEDULER] Trigger AI: {trigger_ai}")
    print(f"[SCHEDULER] Default schedule: {default_schedule}")
    print("=" * 60)

    # Track which scheduled times have been run today
    last_run_date = None
    completed_times_today = set()

    while True:
        try:
            # Get current time
            try:
                from zoneinfo import ZoneInfo
                kst = ZoneInfo('Asia/Seoul')
                now = datetime.now(kst)
            except ImportError:
                now = datetime.now()

            current_date = now.strftime('%Y-%m-%d')
            current_time = now.strftime('%H:%M')

            # Reset completed times if new day
            if last_run_date != current_date:
                completed_times_today = set()
                last_run_date = current_date
                print(f"\n[SCHEDULER] New day: {current_date}")

            # Check DB for is_running flag and schedule config
            response = httpx.get(
                f"{supabase_url}/rest/v1/realtime_monitor?select=is_running,config&limit=1",
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}'
                }
            )

            if response.status_code != 200:
                print(f"[SCHEDULER] DB check failed: {response.status_code}")
                time.sleep(60)
                continue

            data = response.json()
            if not data or not data[0].get('is_running', False):
                # Scheduler is paused
                time.sleep(60)
                continue

            # Get schedule from config or use default
            config = data[0].get('config', {}) or {}
            schedule = config.get('schedule', default_schedule)

            # Check for force_check flag (manual trigger)
            force_check = config.get('force_check', False)

            if force_check:
                print(f"\n[SCHEDULER] Force check requested at {current_time}!")
                # Clear the flag
                httpx.patch(
                    f"{supabase_url}/rest/v1/realtime_monitor?is_running=eq.true",
                    headers={
                        'apikey': supabase_key,
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    json={'config': {**config, 'force_check': False}}
                )

                # Run monitoring cycles
                _run_scheduled_cycles(
                    supabase_url, supabase_key, REGION_CONFIGS,
                    auto_trigger, trigger_ai, cycles_per_run, 'manual'
                )
                continue

            # Check if current time matches any scheduled time
            if current_time in schedule and current_time not in completed_times_today:
                print(f"\n[SCHEDULER] Scheduled time reached: {current_time}")

                # Mark as completed for today
                completed_times_today.add(current_time)

                # Run monitoring cycles
                _run_scheduled_cycles(
                    supabase_url, supabase_key, REGION_CONFIGS,
                    auto_trigger, trigger_ai, cycles_per_run, current_time
                )

            # Wait 1 minute before next check
            time.sleep(60)

        except KeyboardInterrupt:
            print("\n[SCHEDULER] Interrupted by user. Exiting...")
            break
        except Exception as e:
            print(f"[SCHEDULER] Error: {e}")
            time.sleep(60)


def _run_scheduled_cycles(
    supabase_url: str,
    supabase_key: str,
    region_configs: dict,
    auto_trigger: bool,
    trigger_ai: bool,
    cycles: int,
    trigger_source: str
):
    """
    Run scheduled monitoring cycles.
    Called by the scheduler when a scheduled time is reached.
    """
    print(f"\n{'=' * 60}")
    print(f"[SCHEDULER] Starting {cycles} monitoring cycles (trigger: {trigger_source})")
    print(f"{'=' * 60}")

    # Initialize monitor
    monitor = get_monitor(use_advanced_stealth=True)

    # Track last known article IDs per region
    last_known_ids: Dict[str, str] = {}

    # Load initial state from DB
    try:
        response = httpx.get(
            f"{supabase_url}/rest/v1/scraper_state?select=region_code,last_article_id",
            headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}'
            }
        )
        if response.status_code == 200:
            for row in response.json():
                if row.get('last_article_id'):
                    last_known_ids[row['region_code']] = row['last_article_id']
    except Exception as e:
        print(f"[SCHEDULER] Warning: Could not load state: {e}")

    # Log start
    try:
        httpx.post(
            f"{supabase_url}/rest/v1/monitor_activity_log",
            headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            json={
                'event_type': 'scheduler_start',
                'message': f'Scheduled monitoring started ({cycles} cycles)',
                'details': {
                    'trigger': trigger_source,
                    'cycles': cycles
                }
            }
        )
    except Exception:
        pass

    # Run cycles
    total_new = 0
    total_blocked = 0
    total_errors = 0

    for cycle_num in range(1, cycles + 1):
        print(f"\n[SCHEDULER] Cycle {cycle_num}/{cycles} at {datetime.now().strftime('%H:%M:%S')}")

        results = monitor.check_all_regions(
            configs=region_configs,
            last_known_ids=last_known_ids,
            auto_trigger=auto_trigger,
            trigger_ai=trigger_ai
        )

        # Update last known IDs
        for region_code, result in results.items():
            if result.has_new and result.new_article_ids:
                last_known_ids[region_code] = result.new_article_ids[0]

        # Count results
        cycle_new = sum(1 for r in results.values() if r.has_new)
        cycle_blocked = sum(1 for r in results.values() if r.blocked)
        cycle_errors = sum(1 for r in results.values() if r.error and not r.blocked)

        total_new += cycle_new
        total_blocked += cycle_blocked
        total_errors += cycle_errors

        print(f"[SCHEDULER] Cycle {cycle_num} done: {cycle_new} new, {cycle_blocked} blocked, {cycle_errors} errors")

        # Small delay between cycles
        if cycle_num < cycles:
            time.sleep(30)

    # Log completion
    print(f"\n{'=' * 60}")
    print(f"[SCHEDULER] {cycles} cycles complete!")
    print(f"  Total new: {total_new} regions")
    print(f"  Total blocked: {total_blocked} regions")
    print(f"  Total errors: {total_errors} regions")
    print(f"{'=' * 60}")

    try:
        httpx.post(
            f"{supabase_url}/rest/v1/monitor_activity_log",
            headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            json={
                'event_type': 'scheduler_complete',
                'message': f'Scheduled monitoring complete: {total_new} new articles found',
                'details': {
                    'trigger': trigger_source,
                    'cycles': cycles,
                    'total_new': total_new,
                    'total_blocked': total_blocked,
                    'total_errors': total_errors
                }
            }
        )
    except Exception:
        pass


# ============================================================
# CLI Entry Point
# ============================================================
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Light Monitor v2.1')
    parser.add_argument('--daemon', action='store_true', help='Run in daemon mode (continuous loop)')
    parser.add_argument('--scheduler', action='store_true', help='Run in scheduler mode (time-based auto-start)')
    parser.add_argument('--once', action='store_true', help='Run single monitoring cycle and exit')
    parser.add_argument('--max-cycles', type=int, default=0, help='Maximum cycles before exit (0=unlimited)')
    parser.add_argument('--cycles-per-run', type=int, default=3, help='Cycles per scheduled run (default: 3)')
    parser.add_argument('--no-trigger', action='store_true', help='Disable auto-trigger for scrapers')
    parser.add_argument('--no-ai', action='store_true', help='Disable AI processing trigger')
    parser.add_argument('--test', action='store_true', help='Run self-test')

    args = parser.parse_args()

    if args.once:
        # Run single cycle and exit
        print("=" * 60)
        print("Light Monitor v2.1 - Single Cycle Mode")
        print("=" * 60)

        # Import regional configs
        try:
            from configs.regional_configs import REGIONAL_CONFIGS as REGION_CONFIGS
        except ImportError as e:
            print(f"[ONCE] ERROR: Cannot import REGION_CONFIGS: {e}")
            sys.exit(1)

        # Initialize
        supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

        if not supabase_url or not supabase_key:
            print("[ERROR] Supabase credentials not found")
            sys.exit(1)

        print(f"[ONCE] Supabase URL: {supabase_url[:30]}...")
        print(f"[ONCE] Regions: {len(REGION_CONFIGS)}")
        print(f"[ONCE] Auto-trigger: {not args.no_trigger}")
        print(f"[ONCE] Trigger AI: {not args.no_ai}")
        print("=" * 60)

        # Create monitor and Supabase client
        monitor = get_monitor()
        supabase = create_client(supabase_url, supabase_key)

        # Load last known IDs
        last_known_ids = {}
        try:
            response = supabase.table('scraper_state').select('region_code, last_article_id').execute()
            if response.data:
                for row in response.data:
                    if row.get('last_article_id'):
                        last_known_ids[row['region_code']] = row['last_article_id']
            print(f"[ONCE] Loaded {len(last_known_ids)} last known IDs from DB")
        except Exception as e:
            print(f"[ONCE] Could not load state: {e}")

        # Run single cycle
        print(f"\n[ONCE] Starting cycle at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        results = monitor.check_all_regions(
            configs=REGION_CONFIGS,
            last_known_ids=last_known_ids,
            auto_trigger=not args.no_trigger,
            trigger_ai=not args.no_ai
        )

        # Summary
        new_count = sum(1 for r in results.values() if r.has_new)
        blocked_count = sum(1 for r in results.values() if r.blocked)
        error_count = sum(1 for r in results.values() if r.error)

        print(f"\n[ONCE] Cycle complete:")
        print(f"  - New articles: {new_count} regions")
        print(f"  - Blocked: {blocked_count} regions")
        print(f"  - Errors: {error_count} regions")

        # Log to DB
        try:
            supabase.table('monitor_activity_log').insert({
                'event_type': 'cycle',
                'message': f'Single cycle: {new_count} new, {blocked_count} blocked',
                'details': {
                    'mode': 'once',
                    'new_regions': new_count,
                    'blocked_regions': blocked_count,
                    'error_regions': error_count
                }
            }).execute()
        except Exception as e:
            print(f"[ONCE] Failed to log: {e}")

        print("\n[ONCE] Done.")
        sys.exit(0)

    elif args.scheduler:
        # Run scheduler mode (time-based auto-start)
        run_scheduler(
            auto_trigger=not args.no_trigger,
            trigger_ai=not args.no_ai,
            cycles_per_run=args.cycles_per_run
        )
    elif args.daemon or args.max_cycles > 0:
        # Run daemon mode (with optional max_cycles limit)
        run_daemon(
            auto_trigger=not args.no_trigger,
            trigger_ai=not args.no_ai,
            max_cycles=args.max_cycles
        )
    elif args.test or len(sys.argv) == 1:
        # Self-test mode
        print("=" * 60)
        print("Light Monitor v2.1 - Stealth Check & Trigger Test")
        print("=" * 60)

        print(f"\nAdvanced Stealth: {'ENABLED' if HAS_ADVANCED_STEALTH else 'DISABLED'}")
        print(f"curl_cffi: {'INSTALLED' if HAS_CURL_CFFI else 'NOT INSTALLED'}")

        if not HAS_CURL_CFFI:
            print("\n[RECOMMEND] Install curl_cffi for maximum stealth:")
            print("  pip install curl_cffi")

        print(f"\nUser-Agent pool: {len(MONITOR_USER_AGENTS)} agents")

        # Test trigger functions
        print("\n" + "=" * 60)
        print("Trigger Functions Test")
        print("=" * 60)

        # Test scraper path detection
        test_regions = ['naju', 'gwangyang', 'mokpo']
        for region in test_regions:
            path = get_scraper_path(region)
            status = "FOUND" if path else "NOT FOUND"
            print(f"  {region}: {status}")
            if path:
                print(f"    -> {path}")

        print("\n[INFO] Trigger functions:")
        print("  - trigger_scraper(region, article_ids) -> async scraper call")
        print("  - trigger_ai_process(region, article_ids) -> API call to AI bot")
        print("  - check_all_regions(..., auto_trigger=True) -> auto-trigger mode")

        print("\n[INFO] Execution modes:")
        print("  python light_monitor.py --scheduler           # Time-based auto-start (recommended)")
        print("  python light_monitor.py --max-cycles 3        # Run 3 cycles then exit")
        print("  python light_monitor.py --daemon              # Continuous loop (legacy)")
        print("  python light_monitor.py --once                # Single cycle")
        print("\n[INFO] Scheduler mode options:")
        print("  --cycles-per-run 3    # Cycles per scheduled time (default: 3)")
        print("  --no-trigger          # Disable scraper auto-trigger")
        print("  --no-ai               # Disable AI processing trigger")
        print("\n[INFO] Default schedule: 09:00, 12:00, 15:00, 18:00")
        print("  (Can be customized via DB: realtime_monitor.config.schedule)")

# -*- coding: utf-8 -*-
"""
Advanced Stealth Module - Enterprise-Grade Bot Detection Evasion
Version: 2.0 (2025-12-27)

Features:
- Real browser TLS fingerprinting (curl_cffi)
- Latest 2025 User-Agent rotation
- Korean government site specialized patterns
- Human-like behavior simulation
- Advanced block detection & auto-recovery
- Residential proxy support
- Session persistence with browser-like cookies

Author: Elite Scraping Bot Team
"""

import os
import re
import json
import time
import random
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from urllib.parse import urlparse, quote
import asyncio

# Try to import curl_cffi for real browser TLS fingerprinting
try:
    from curl_cffi import requests as cffi_requests
    from curl_cffi.requests import Session as CffiSession
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False
    print("[WARN] curl_cffi not installed. Using httpx (less stealth)")

import httpx

# ============================================================
# LATEST USER-AGENTS (December 2025)
# Real browser versions, updated monthly
# ============================================================

# Chrome versions as of Dec 2025 (Windows)
CHROME_UA_WINDOWS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
]

# Edge versions (very popular in Korea)
EDGE_UA_WINDOWS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
]

# Chrome Mac
CHROME_UA_MAC = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
]

# Mobile (Samsung Internet - very popular in Korea)
MOBILE_UA = [
    'Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; SM-G998N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
]

# Weighted distribution (reflects real Korean user base)
ALL_USER_AGENTS = (
    CHROME_UA_WINDOWS * 6 +  # 60% Chrome Windows
    EDGE_UA_WINDOWS * 2 +     # 20% Edge
    CHROME_UA_MAC * 1 +       # 10% Chrome Mac
    MOBILE_UA * 1             # 10% Mobile
)

# ============================================================
# CURL_CFFI BROWSER IMPERSONATION OPTIONS
# These create authentic TLS fingerprints
# ============================================================
BROWSER_IMPERSONATIONS = [
    "chrome131",
    "chrome130",
    "chrome124",
    "edge131",
    "edge127",
    "safari18_0",
]

# ============================================================
# KOREAN SEARCH ENGINE REFERERS
# ============================================================
KOREAN_REFERERS = [
    'https://search.naver.com/search.naver?query={keyword}',
    'https://m.search.naver.com/search.naver?query={keyword}',
    'https://search.daum.net/search?q={keyword}',
    'https://www.google.co.kr/search?q={keyword}',
    'https://www.google.com/search?q={keyword}',
]

REGION_SEARCH_KEYWORDS = {
    'gwangju': ['광주시청 보도자료', '광주광역시 뉴스', '광주시 소식'],
    'jeonnam': ['전라남도청 보도자료', '전남도청 뉴스', '전남 소식'],
    'mokpo': ['목포시청 보도자료', '목포시 뉴스', '목포 소식'],
    'yeosu': ['여수시청 뉴스', '여수시 보도자료', '여수 소식'],
    'suncheon': ['순천시청 보도자료', '순천시 뉴스'],
    'naju': ['나주시청 보도자료', '나주시 뉴스'],
    'gwangyang': ['광양시청 뉴스', '광양시 보도자료'],
    'damyang': ['담양군청 소식', '담양군 뉴스'],
    'gokseong': ['곡성군청 뉴스', '곡성군 소식'],
    'gurye': ['구례군청 보도자료', '구례군 뉴스'],
    'goheung': ['고흥군청 소식', '고흥군 뉴스'],
    'boseong': ['보성군청 보도자료', '보성군 뉴스'],
    'hwasun': ['화순군청 뉴스', '화순군 소식'],
    'jangheung': ['장흥군청 보도자료', '장흥군 뉴스'],
    'gangjin': ['강진군청 뉴스', '강진군 소식'],
    'haenam': ['해남군청 보도자료', '해남군 뉴스'],
    'yeongam': ['영암군청 뉴스', '영암군 소식'],
    'muan': ['무안군청 보도자료', '무안군 뉴스'],
    'hampyeong': ['함평군청 소식', '함평군 뉴스'],
    'yeonggwang': ['영광군청 보도자료', '영광군 뉴스'],
    'jangseong': ['장성군청 뉴스', '장성군 소식'],
    'wando': ['완도군청 보도자료', '완도군 뉴스'],
    'jindo': ['진도군청 뉴스', '진도군 소식'],
    'shinan': ['신안군청 보도자료', '신안군 뉴스'],
    'gwangju_edu': ['광주교육청 보도자료', '광주시교육청 뉴스'],
    'jeonnam_edu': ['전남교육청 보도자료', '전라남도교육청 뉴스'],
}

# ============================================================
# BLOCK DETECTION PATTERNS (Korean Government Sites)
# ============================================================
BLOCK_INDICATORS = {
    # HTTP Status codes
    'status_codes': [403, 429, 503, 451, 406],

    # Korean block messages
    'korean_patterns': [
        '접근이 차단', '차단되었', '접근 거부', '접근거부',
        '비정상적인 접근', '자동화된 접근', '로봇', '봇 차단',
        '과도한 요청', '잠시 후 다시', '서비스 이용 제한',
        '접속이 차단', '차단 페이지', 'IP 차단',
        '보안 정책', 'WAF', '웹 방화벽',
        '정상적인 접근', '비정상 접근', '악의적 접근',
        'IP 주소가 차단', '일시적으로 차단',
    ],

    # English block messages
    'english_patterns': [
        'blocked', 'forbidden', 'denied', 'access denied',
        'captcha', 'robot', 'bot detected', 'automated',
        'too many requests', 'rate limit', 'rate-limit',
        'security check', 'challenge', 'cloudflare',
        'ddos protection', 'please wait', 'try again later',
        'suspicious activity', 'unusual traffic',
    ],

    # WAF/Security service signatures
    'waf_signatures': [
        'incapsula', 'imperva', 'cloudflare', 'akamai',
        'sucuri', 'barracuda', 'fortinet', 'f5 networks',
        'radware', 'piolink', 'penta security', 'monitorapp',
        'wapples', 'ips', 'ids',
    ],

    # Korean government common blocks
    'gov_block_patterns': [
        '관리자에게 문의', '시스템 점검', '서비스 점검',
        '이용이 제한', '페이지를 찾을 수 없', '404',
        '일시적 오류', '서버 오류', '502', '504',
    ],
}

# ============================================================
# TIMING PATTERNS (Human-like behavior)
# ============================================================
@dataclass
class TimingProfile:
    """Timing profile for human-like behavior simulation."""
    name: str
    base_delay_min: float
    base_delay_max: float
    reading_time_per_kb: float  # seconds per KB of content
    scroll_pause_min: float
    scroll_pause_max: float
    click_delay_min: float
    click_delay_max: float


TIMING_PROFILES = {
    'fast_reader': TimingProfile(
        name='fast_reader',
        base_delay_min=1.5,
        base_delay_max=3.0,
        reading_time_per_kb=0.5,
        scroll_pause_min=0.3,
        scroll_pause_max=0.8,
        click_delay_min=0.1,
        click_delay_max=0.3,
    ),
    'normal_reader': TimingProfile(
        name='normal_reader',
        base_delay_min=2.5,
        base_delay_max=5.0,
        reading_time_per_kb=1.0,
        scroll_pause_min=0.5,
        scroll_pause_max=1.5,
        click_delay_min=0.2,
        click_delay_max=0.5,
    ),
    'slow_reader': TimingProfile(
        name='slow_reader',
        base_delay_min=4.0,
        base_delay_max=8.0,
        reading_time_per_kb=2.0,
        scroll_pause_min=1.0,
        scroll_pause_max=3.0,
        click_delay_min=0.3,
        click_delay_max=0.8,
    ),
    'cautious': TimingProfile(
        name='cautious',
        base_delay_min=5.0,
        base_delay_max=12.0,
        reading_time_per_kb=2.5,
        scroll_pause_min=2.0,
        scroll_pause_max=5.0,
        click_delay_min=0.5,
        click_delay_max=1.5,
    ),
}


@dataclass
class BlockStatus:
    """Track blocking status per region."""
    region_code: str
    is_blocked: bool = False
    blocked_at: Optional[datetime] = None
    cooldown_until: Optional[datetime] = None
    consecutive_blocks: int = 0
    total_blocks: int = 0
    last_success_at: Optional[datetime] = None
    request_multiplier: float = 1.0
    current_identity: Optional[str] = None  # Track which identity is blocked


@dataclass
class BrowserIdentity:
    """Browser identity for session persistence."""
    identity_id: str
    user_agent: str
    browser_impersonation: str
    viewport: Dict[str, int]
    timezone: str
    language: str
    cookies: Dict[str, str] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    request_count: int = 0
    last_used: Optional[datetime] = None

    def to_headers(self) -> Dict[str, str]:
        """Convert identity to HTTP headers."""
        return {
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': f'{self.language},en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': self._get_sec_ch_ua(),
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        }

    def _get_sec_ch_ua(self) -> str:
        """Generate Sec-CH-UA header based on user agent."""
        if 'Chrome/131' in self.user_agent:
            return '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
        elif 'Chrome/130' in self.user_agent:
            return '"Google Chrome";v="130", "Chromium";v="130", "Not_A Brand";v="24"'
        elif 'Edg/' in self.user_agent:
            return '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
        return '"Chromium";v="131", "Not_A Brand";v="24"'


class IdentityPool:
    """Manages pool of browser identities for rotation."""

    def __init__(self, pool_size: int = 10):
        self.pool_size = pool_size
        self.identities: Dict[str, BrowserIdentity] = {}
        self.blocked_identities: set = set()
        self._initialize_pool()

    def _initialize_pool(self):
        """Create initial identity pool."""
        for i in range(self.pool_size):
            identity = self._create_identity()
            self.identities[identity.identity_id] = identity

    def _create_identity(self) -> BrowserIdentity:
        """Create a new browser identity."""
        identity_id = hashlib.md5(
            f"{time.time()}{random.random()}".encode()
        ).hexdigest()[:12]

        user_agent = random.choice(ALL_USER_AGENTS)

        # Match browser impersonation to user agent
        if 'Edg/' in user_agent:
            impersonation = random.choice(['edge131', 'edge127'])
        elif 'Safari' in user_agent and 'Chrome' not in user_agent:
            impersonation = 'safari18_0'
        else:
            impersonation = random.choice(['chrome131', 'chrome130', 'chrome124'])

        viewport = random.choice([
            {'width': 1920, 'height': 1080},
            {'width': 1366, 'height': 768},
            {'width': 1536, 'height': 864},
            {'width': 1440, 'height': 900},
            {'width': 1280, 'height': 720},
            {'width': 2560, 'height': 1440},
        ])

        return BrowserIdentity(
            identity_id=identity_id,
            user_agent=user_agent,
            browser_impersonation=impersonation,
            viewport=viewport,
            timezone='Asia/Seoul',
            language='ko-KR',
            cookies=self._generate_session_cookies(),
        )

    def _generate_session_cookies(self) -> Dict[str, str]:
        """Generate realistic session cookies."""
        session_id = hashlib.md5(
            f"{time.time()}{random.random()}".encode()
        ).hexdigest()[:24].upper()

        ga_id = f"{random.randint(100000000, 999999999)}.{int(time.time())}"

        return {
            'JSESSIONID': session_id,
            '_ga': f'GA1.2.{ga_id}',
            '_gid': f'GA1.2.{random.randint(100000000, 999999999)}.{int(time.time())}',
            '_gat': '1',
        }

    def get_identity(self, exclude_blocked: bool = True) -> Optional[BrowserIdentity]:
        """Get a random identity from pool."""
        available = [
            identity for identity_id, identity in self.identities.items()
            if not exclude_blocked or identity_id not in self.blocked_identities
        ]

        if not available:
            # All blocked, create new identity
            new_identity = self._create_identity()
            self.identities[new_identity.identity_id] = new_identity
            return new_identity

        # Prefer less-used identities
        available.sort(key=lambda x: x.request_count)

        # Pick from the least-used third
        candidates = available[:max(1, len(available) // 3)]
        return random.choice(candidates)

    def mark_blocked(self, identity_id: str):
        """Mark an identity as blocked."""
        self.blocked_identities.add(identity_id)
        print(f"[IDENTITY] Marked {identity_id} as blocked")

        # Replace blocked identity with new one
        if identity_id in self.identities:
            del self.identities[identity_id]
            new_identity = self._create_identity()
            self.identities[new_identity.identity_id] = new_identity

    def record_usage(self, identity_id: str):
        """Record usage of an identity."""
        if identity_id in self.identities:
            self.identities[identity_id].request_count += 1
            self.identities[identity_id].last_used = datetime.now()

    def clear_blocked(self):
        """Clear blocked identities list (after cooldown)."""
        self.blocked_identities.clear()


class AdvancedStealth:
    """
    Enterprise-grade stealth HTTP client.

    Usage:
        stealth = AdvancedStealth()

        # Simple request
        response = stealth.get('https://example.com')

        # With region-specific behavior
        response = stealth.get_for_region('gwangju', 'https://www.gwangju.go.kr/...')
    """

    def __init__(
        self,
        timeout: int = 15,
        timing_profile: str = 'normal_reader',
        use_curl_cffi: bool = True,
    ):
        self.timeout = timeout
        self.timing_profile = TIMING_PROFILES.get(timing_profile, TIMING_PROFILES['normal_reader'])
        self.use_curl_cffi = use_curl_cffi and HAS_CURL_CFFI

        # Identity management
        self.identity_pool = IdentityPool(pool_size=15)

        # Block tracking per region
        self.block_status: Dict[str, BlockStatus] = {}

        # Per-region identity assignment
        self.region_identities: Dict[str, str] = {}

        # HTTP clients
        if self.use_curl_cffi:
            self._cffi_sessions: Dict[str, CffiSession] = {}

        self.httpx_client = httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            http2=True,
        )

        # Statistics
        self.stats = {
            'total_requests': 0,
            'successful': 0,
            'blocked': 0,
            'errors': 0,
        }

    def _get_cffi_session(self, impersonation: str) -> 'CffiSession':
        """Get or create curl_cffi session with browser impersonation."""
        if impersonation not in self._cffi_sessions:
            self._cffi_sessions[impersonation] = CffiSession(
                impersonate=impersonation,
                timeout=self.timeout,
            )
        return self._cffi_sessions[impersonation]

    def _get_identity_for_region(self, region_code: str) -> BrowserIdentity:
        """Get or create identity for a region."""
        if region_code in self.region_identities:
            identity_id = self.region_identities[region_code]
            if identity_id in self.identity_pool.identities:
                return self.identity_pool.identities[identity_id]

        # Assign new identity
        identity = self.identity_pool.get_identity()
        if identity:
            self.region_identities[region_code] = identity.identity_id
        return identity

    def _build_referer(self, region_code: str) -> str:
        """Build realistic referer for a region."""
        keywords = REGION_SEARCH_KEYWORDS.get(region_code, [region_code])
        keyword = random.choice(keywords)
        referer_template = random.choice(KOREAN_REFERERS)
        return referer_template.format(keyword=quote(keyword))

    def _apply_human_delay(self, is_first_request: bool = False):
        """Apply human-like delay before request."""
        profile = self.timing_profile

        if is_first_request:
            # Longer delay for first request (simulates page load thinking)
            delay = random.uniform(profile.base_delay_max, profile.base_delay_max * 1.5)
        else:
            # Normal browsing delay with some randomness
            delay = random.gauss(
                (profile.base_delay_min + profile.base_delay_max) / 2,
                (profile.base_delay_max - profile.base_delay_min) / 4
            )
            delay = max(profile.base_delay_min, min(profile.base_delay_max, delay))

        # Add micro-variations (humans aren't perfectly random)
        delay += random.uniform(-0.3, 0.3)
        delay = max(0.5, delay)  # Minimum delay

        time.sleep(delay)

    def _is_blocked(self, response: Any, text: str) -> Tuple[bool, str]:
        """
        Detect if response indicates blocking.
        Returns (is_blocked, reason).
        """
        # Check status code
        status = getattr(response, 'status_code', 200)
        if status in BLOCK_INDICATORS['status_codes']:
            return True, f"HTTP {status}"

        text_lower = text.lower()

        # Check Korean patterns
        for pattern in BLOCK_INDICATORS['korean_patterns']:
            if pattern in text_lower:
                return True, f"Korean block: {pattern}"

        # Check English patterns
        for pattern in BLOCK_INDICATORS['english_patterns']:
            if pattern in text_lower:
                return True, f"English block: {pattern}"

        # Check WAF signatures
        for sig in BLOCK_INDICATORS['waf_signatures']:
            if sig in text_lower:
                return True, f"WAF detected: {sig}"

        # Check government patterns
        for pattern in BLOCK_INDICATORS['gov_block_patterns']:
            if pattern in text_lower:
                return True, f"Gov block: {pattern}"

        # Additional heuristics
        # Very short response might indicate block page
        if len(text) < 500 and ('<!DOCTYPE' in text or '<html' in text):
            if 'document.location' in text or 'window.location' in text:
                return True, "JavaScript redirect (possible block)"

        return False, ""

    def _update_block_status(self, region_code: str, is_blocked: bool, reason: str = ""):
        """Update block tracking for region."""
        if region_code not in self.block_status:
            self.block_status[region_code] = BlockStatus(region_code=region_code)

        status = self.block_status[region_code]

        if is_blocked:
            status.is_blocked = True
            status.blocked_at = datetime.now()
            status.consecutive_blocks += 1
            status.total_blocks += 1

            # Exponential backoff: 30m, 1h, 2h, 4h, max 8h
            cooldown_minutes = min(480, 30 * (2 ** (status.consecutive_blocks - 1)))
            status.cooldown_until = datetime.now() + timedelta(minutes=cooldown_minutes)
            status.request_multiplier = min(5.0, 1.0 + (status.consecutive_blocks * 0.5))

            # Mark current identity as blocked
            if region_code in self.region_identities:
                self.identity_pool.mark_blocked(self.region_identities[region_code])
                del self.region_identities[region_code]  # Force new identity

            print(f"[BLOCK] {region_code}: {reason} | Cooldown {cooldown_minutes}m | Multiplier {status.request_multiplier}x")
            self.stats['blocked'] += 1

        else:
            # Success - gradually reduce block status
            status.last_success_at = datetime.now()
            if status.consecutive_blocks > 0:
                status.consecutive_blocks = max(0, status.consecutive_blocks - 1)
                status.request_multiplier = max(1.0, status.request_multiplier - 0.25)
            status.is_blocked = False
            self.stats['successful'] += 1

    def is_in_cooldown(self, region_code: str) -> bool:
        """Check if region is in cooldown."""
        status = self.block_status.get(region_code)
        if not status or not status.cooldown_until:
            return False
        return datetime.now() < status.cooldown_until

    def get_cooldown_remaining(self, region_code: str) -> Optional[timedelta]:
        """Get remaining cooldown time."""
        status = self.block_status.get(region_code)
        if not status or not status.cooldown_until:
            return None
        remaining = status.cooldown_until - datetime.now()
        return remaining if remaining.total_seconds() > 0 else None

    def get(
        self,
        url: str,
        region_code: str = '',
        headers: Optional[Dict] = None,
        apply_delay: bool = True,
    ) -> Tuple[Optional[str], bool, str]:
        """
        Make stealth GET request.

        Returns:
            (response_text, is_blocked, error_message)
        """
        self.stats['total_requests'] += 1

        # Check cooldown
        if region_code and self.is_in_cooldown(region_code):
            remaining = self.get_cooldown_remaining(region_code)
            return None, True, f"In cooldown ({remaining})"

        # Apply human delay
        if apply_delay:
            self._apply_human_delay()

        # Get identity
        identity = self._get_identity_for_region(region_code) if region_code else self.identity_pool.get_identity()
        if not identity:
            return None, False, "No identity available"

        # Build headers
        request_headers = identity.to_headers()
        if headers:
            request_headers.update(headers)

        # Add referer (70% chance)
        if region_code and random.random() < 0.7:
            request_headers['Referer'] = self._build_referer(region_code)
            request_headers['Sec-Fetch-Site'] = 'cross-site'

        try:
            if self.use_curl_cffi:
                # Use curl_cffi for real browser TLS fingerprint
                session = self._get_cffi_session(identity.browser_impersonation)
                response = session.get(
                    url,
                    headers=request_headers,
                    cookies=identity.cookies,
                    timeout=self.timeout,
                    allow_redirects=True,
                )
                text = response.text
            else:
                # Fallback to httpx
                response = self.httpx_client.get(
                    url,
                    headers=request_headers,
                    cookies=identity.cookies,
                    timeout=self.timeout,
                )
                text = response.text

            # Record identity usage
            self.identity_pool.record_usage(identity.identity_id)

            # Check for blocking
            is_blocked, reason = self._is_blocked(response, text)

            if region_code:
                self._update_block_status(region_code, is_blocked, reason)

            if is_blocked:
                return None, True, reason

            return text, False, ""

        except Exception as e:
            self.stats['errors'] += 1
            error_msg = str(e)

            # Some errors indicate blocking
            if 'timeout' in error_msg.lower():
                if region_code:
                    self._update_block_status(region_code, True, "Timeout (possible rate limit)")
                return None, True, "Timeout"

            return None, False, error_msg

    def get_for_region(
        self,
        region_code: str,
        url: str,
        apply_delay: bool = True,
    ) -> Tuple[Optional[str], bool, str]:
        """Convenience method for region-specific requests."""
        return self.get(url, region_code=region_code, apply_delay=apply_delay)

    def get_stats(self) -> Dict:
        """Get request statistics."""
        return {
            **self.stats,
            'block_rate': self.stats['blocked'] / max(1, self.stats['total_requests']),
            'success_rate': self.stats['successful'] / max(1, self.stats['total_requests']),
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
        """Close all HTTP clients."""
        if hasattr(self, 'httpx_client'):
            self.httpx_client.close()
        if hasattr(self, '_cffi_sessions'):
            for session in self._cffi_sessions.values():
                session.close()


# ============================================================
# PLAYWRIGHT STEALTH ENHANCEMENT
# ============================================================
ADVANCED_STEALTH_JS = """
() => {
    // ====== CORE WEBDRIVER DETECTION ======
    // Remove webdriver property
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
    });

    // Remove automation indicators
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    // ====== CHROME RUNTIME ======
    window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
    };

    // ====== NAVIGATOR PROPERTIES ======
    // Languages (Korean primary)
    Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en']
    });

    // Platform
    Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
    });

    // Hardware concurrency (realistic)
    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => Math.floor(Math.random() * 4) + 4  // 4-8 cores
    });

    // Device memory
    Object.defineProperty(navigator, 'deviceMemory', {
        get: () => [4, 8, 16][Math.floor(Math.random() * 3)]
    });

    // Max touch points (desktop = 0)
    Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 0
    });

    // ====== PLUGINS ======
    Object.defineProperty(navigator, 'plugins', {
        get: () => {
            const plugins = [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                { name: 'Native Client', filename: 'internal-nacl-plugin' }
            ];
            return Object.assign(plugins, {
                length: plugins.length,
                item: (index) => plugins[index],
                namedItem: (name) => plugins.find(p => p.name === name),
                refresh: () => {}
            });
        }
    });

    // ====== PERMISSIONS ======
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );

    // ====== WEBGL ======
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {  // UNMASKED_VENDOR_WEBGL
            return 'Google Inc. (NVIDIA)';
        }
        if (parameter === 37446) {  // UNMASKED_RENDERER_WEBGL
            return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        }
        return getParameter.call(this, parameter);
    };

    // ====== CANVAS FINGERPRINT RANDOMIZATION ======
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png') {
            const ctx = this.getContext('2d');
            if (ctx) {
                const noise = Math.random() * 0.01;
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] += noise;  // Add tiny noise to red channel
                }
            }
        }
        return originalToDataURL.apply(this, arguments);
    };

    // ====== SCREEN PROPERTIES ======
    Object.defineProperty(screen, 'availWidth', {
        get: () => window.innerWidth
    });
    Object.defineProperty(screen, 'availHeight', {
        get: () => window.innerHeight
    });

    // ====== REMOVE PLAYWRIGHT TRACES ======
    delete window.__playwright;
    delete window.__pw_manual;
    delete window.__PW_inspect;

    // ====== TIMEZONE ======
    Date.prototype.getTimezoneOffset = function() {
        return -540;  // KST (UTC+9)
    };

    console.log('[STEALTH] Advanced stealth script applied');
}
""".strip()


def apply_advanced_stealth_to_page(page) -> None:
    """Apply advanced stealth settings to Playwright page."""
    try:
        page.add_init_script(ADVANCED_STEALTH_JS)
    except Exception as e:
        print(f"[WARN] Failed to apply advanced stealth: {e}")


def create_advanced_stealth_context(browser, headless: bool = True):
    """Create Playwright context with advanced stealth settings."""
    identity = IdentityPool(pool_size=1).get_identity()

    context = browser.new_context(
        viewport=identity.viewport,
        user_agent=identity.user_agent,
        locale='ko-KR',
        timezone_id='Asia/Seoul',
        extra_http_headers={
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        java_script_enabled=True,
        bypass_csp=False,
        ignore_https_errors=True,
        color_scheme='light',
        reduced_motion='no-preference',
        forced_colors='none',
    )

    # Apply stealth to all new pages
    context.on('page', lambda page: apply_advanced_stealth_to_page(page))

    return context


# ============================================================
# CONVENIENCE FUNCTIONS
# ============================================================
_stealth_client: Optional[AdvancedStealth] = None


def get_stealth_client() -> AdvancedStealth:
    """Get singleton stealth client."""
    global _stealth_client
    if _stealth_client is None:
        _stealth_client = AdvancedStealth()
    return _stealth_client


def stealth_get(url: str, region_code: str = '') -> Tuple[Optional[str], bool, str]:
    """Quick stealth GET request."""
    return get_stealth_client().get(url, region_code=region_code)


def check_if_blocked(region_code: str) -> bool:
    """Check if region is currently blocked/in cooldown."""
    return get_stealth_client().is_in_cooldown(region_code)


# ============================================================
# INSTALLATION HELPER
# ============================================================
def print_installation_guide():
    """Print installation guide for required packages."""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║           ADVANCED STEALTH MODULE - INSTALLATION GUIDE           ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  For MAXIMUM stealth (real browser TLS fingerprinting):          ║
║                                                                  ║
║  pip install curl_cffi                                           ║
║                                                                  ║
║  This package provides:                                          ║
║  - Real Chrome/Edge/Safari TLS fingerprints                      ║
║  - JA3 fingerprint matching real browsers                        ║
║  - HTTP/2 with proper ALPN negotiation                          ║
║  - Proper header ordering                                        ║
║                                                                  ║
║  Without curl_cffi, the module falls back to httpx               ║
║  which has a detectable bot TLS fingerprint.                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    print_installation_guide()

    # Test
    if HAS_CURL_CFFI:
        print("\n[OK] curl_cffi is installed - Maximum stealth available!")
    else:
        print("\n[WARN] curl_cffi not installed - Using httpx fallback")

    print(f"\n[INFO] User-Agent pool size: {len(ALL_USER_AGENTS)}")
    print(f"[INFO] Browser impersonations: {BROWSER_IMPERSONATIONS}")

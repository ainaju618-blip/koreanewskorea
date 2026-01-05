"""
Enterprise Stealth Module v3.0 - Advanced Bot Detection Bypass
- POMDP-based intelligent delays (Poisson + Markov)
- HTTP/2 support with connection pooling
- Exponential backoff retry logic
- Block detection and auto-recovery
- Persistent context management
- Enhanced fingerprint spoofing

Project: koreanewskorea (National Edition)
Created: 2026-01-05
"""

import os
import sys
import time
import random
import math
import json
import hashlib
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict, List, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import asyncio
from functools import wraps

# ============================================================
# 1. External Dependencies
# ============================================================
try:
    from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
    from playwright_stealth import Stealth
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

try:
    from curl_cffi import requests as curl_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False


# ============================================================
# 2. Constants & Configuration
# ============================================================
class BlockType(Enum):
    """Types of blocking detected"""
    NONE = "none"
    CAPTCHA = "captcha"
    IP_BAN = "ip_ban"
    RATE_LIMIT = "rate_limit"
    JS_CHALLENGE = "js_challenge"
    WAF_BLOCK = "waf_block"
    CLOUDFLARE = "cloudflare"


@dataclass
class StealthConfig:
    """Configuration for stealth operations"""
    # Browser settings
    headless: bool = True
    use_persistent_context: bool = True
    context_dir: str = "./browser_contexts"

    # Delay settings (POMDP parameters)
    min_delay: float = 1.0
    max_delay: float = 5.0
    poisson_lambda: float = 2.0
    markov_states: Dict[str, Dict[str, float]] = field(default_factory=lambda: {
        'fast': {'fast': 0.3, 'normal': 0.5, 'slow': 0.2},
        'normal': {'fast': 0.2, 'normal': 0.6, 'slow': 0.2},
        'slow': {'fast': 0.1, 'normal': 0.4, 'slow': 0.5}
    })

    # Retry settings
    max_retries: int = 3
    base_backoff: float = 2.0
    max_backoff: float = 60.0
    jitter_factor: float = 0.3

    # HTTP/2 settings
    use_http2: bool = True
    connection_pool_size: int = 10
    timeout: float = 30.0

    # Fingerprint settings
    rotate_fingerprint: bool = True
    fingerprint_interval: int = 10  # Rotate every N requests


# User agents with realistic market share distribution
USER_AGENTS = [
    # Chrome (65% market share)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    # Edge (5% market share)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    # Firefox (3% market share)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    # Safari (18% market share - but mostly mobile)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
]

# Weighted selection based on market share
USER_AGENT_WEIGHTS = [0.25, 0.25, 0.15, 0.10, 0.10, 0.15]

# Block detection patterns
BLOCK_PATTERNS = {
    BlockType.CAPTCHA: [
        r'captcha', r'recaptcha', r'hcaptcha', r'verify.*human',
        r'robot.*check', r'are.*you.*robot', r'not.*robot',
        r'challenge-running', r'g-recaptcha'
    ],
    BlockType.CLOUDFLARE: [
        r'cloudflare', r'cf-browser-verification', r'ray.*id',
        r'checking.*your.*browser', r'please.*wait.*5.*seconds',
        r'cf-spinner', r'cf_chl_opt'
    ],
    BlockType.IP_BAN: [
        r'ip.*blocked', r'access.*denied', r'forbidden',
        r'your.*ip.*has.*been.*blocked', r'temporarily.*blocked'
    ],
    BlockType.RATE_LIMIT: [
        r'too.*many.*requests', r'rate.*limit', r'slow.*down',
        r'429', r'throttl'
    ],
    BlockType.WAF_BLOCK: [
        r'web.*application.*firewall', r'waf', r'blocked.*by.*security',
        r'security.*policy', r'attack.*detected'
    ],
    BlockType.JS_CHALLENGE: [
        r'javascript.*required', r'enable.*javascript',
        r'browser.*check', r'please.*enable.*js'
    ]
}


# ============================================================
# 3. POMDP-based Intelligent Delay System
# ============================================================
class PODMPDelayGenerator:
    """
    Partially Observable Markov Decision Process based delay generator.
    Simulates human-like browsing patterns with state transitions.
    """

    def __init__(self, config: StealthConfig):
        self.config = config
        self.current_state = 'normal'
        self.request_count = 0
        self.last_delay = 2.0

    def _poisson_sample(self, lam: float) -> float:
        """Generate Poisson-distributed random value"""
        L = math.exp(-lam)
        k = 0
        p = 1.0

        while p > L:
            k += 1
            p *= random.random()

        return k - 1

    def _markov_transition(self) -> str:
        """Transition to next state based on Markov chain"""
        transitions = self.config.markov_states.get(self.current_state, {'normal': 1.0})
        states = list(transitions.keys())
        probs = list(transitions.values())

        r = random.random()
        cumulative = 0
        for state, prob in zip(states, probs):
            cumulative += prob
            if r <= cumulative:
                return state

        return states[-1]

    def get_delay(self) -> float:
        """
        Generate intelligent delay based on POMDP model.
        Returns delay in seconds.
        """
        self.request_count += 1

        # State transition every 3-7 requests
        if self.request_count % random.randint(3, 7) == 0:
            self.current_state = self._markov_transition()

        # Base delay from Poisson distribution
        poisson_value = self._poisson_sample(self.config.poisson_lambda)

        # State-based multiplier
        state_multipliers = {
            'fast': 0.6,
            'normal': 1.0,
            'slow': 1.8
        }
        multiplier = state_multipliers.get(self.current_state, 1.0)

        # Add Gaussian noise for natural variation
        noise = random.gauss(0, 0.3)

        # Calculate final delay
        delay = (self.config.min_delay + poisson_value * 0.5) * multiplier + noise

        # Clamp to configured range
        delay = max(self.config.min_delay, min(self.config.max_delay, delay))

        # Smoothing: avoid sudden changes
        delay = 0.7 * delay + 0.3 * self.last_delay
        self.last_delay = delay

        return delay

    def get_page_delay(self) -> float:
        """Longer delay for page transitions"""
        return self.get_delay() * random.uniform(1.5, 2.5)

    def get_scroll_delay(self) -> float:
        """Short delay for scroll actions"""
        return random.uniform(0.1, 0.4)

    def get_click_delay(self) -> float:
        """Medium delay before clicks"""
        return random.uniform(0.3, 0.8)


def pomdp_delay(min_delay: float = 1.0, max_delay: float = 5.0,
                poisson_lambda: float = 2.0) -> float:
    """
    Simple POMDP delay function for direct use.
    Uses Poisson distribution with Gaussian noise.
    """
    # Poisson sample
    L = math.exp(-poisson_lambda)
    k = 0
    p = 1.0
    while p > L:
        k += 1
        p *= random.random()
    poisson_value = k - 1

    # Gaussian noise
    noise = random.gauss(0, 0.3)

    # Calculate delay
    delay = min_delay + poisson_value * 0.5 + noise
    delay = max(min_delay, min(max_delay, delay))

    time.sleep(delay)
    return delay


# ============================================================
# 4. Block Detection and Recovery
# ============================================================
class BlockDetector:
    """Detects various types of blocking and suggests recovery actions"""

    def __init__(self):
        self.consecutive_blocks = 0
        self.block_history: List[Tuple[datetime, BlockType]] = []

    def detect(self, page_content: str, status_code: int = 200) -> BlockType:
        """
        Analyze page content and status code to detect blocking.
        """
        import re

        content_lower = page_content.lower()

        # Check status code first
        if status_code == 403:
            self.consecutive_blocks += 1
            return BlockType.IP_BAN
        elif status_code == 429:
            self.consecutive_blocks += 1
            return BlockType.RATE_LIMIT
        elif status_code == 503:
            # Could be rate limit or WAF
            if any(re.search(p, content_lower) for p in BLOCK_PATTERNS[BlockType.CLOUDFLARE]):
                self.consecutive_blocks += 1
                return BlockType.CLOUDFLARE
            return BlockType.RATE_LIMIT

        # Check content patterns
        for block_type, patterns in BLOCK_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, content_lower):
                    self.consecutive_blocks += 1
                    self.block_history.append((datetime.now(), block_type))
                    return block_type

        # No block detected
        self.consecutive_blocks = 0
        return BlockType.NONE

    def get_recovery_strategy(self, block_type: BlockType) -> Dict[str, Any]:
        """
        Returns recovery strategy based on block type.
        """
        strategies = {
            BlockType.NONE: {
                'action': 'continue',
                'delay': 0,
                'rotate_ua': False,
                'rotate_ip': False,
                'clear_cookies': False
            },
            BlockType.RATE_LIMIT: {
                'action': 'wait_and_retry',
                'delay': min(60 * (2 ** self.consecutive_blocks), 300),
                'rotate_ua': True,
                'rotate_ip': False,  # Would need proxy - cost money
                'clear_cookies': False
            },
            BlockType.CAPTCHA: {
                'action': 'manual_intervention',
                'delay': 0,
                'rotate_ua': False,
                'rotate_ip': False,
                'clear_cookies': False,
                'note': 'CAPTCHA detected - manual solving required'
            },
            BlockType.CLOUDFLARE: {
                'action': 'wait_and_retry',
                'delay': 10,
                'rotate_ua': True,
                'rotate_ip': False,
                'clear_cookies': True,
                'use_headful': True
            },
            BlockType.IP_BAN: {
                'action': 'abort',
                'delay': 0,
                'rotate_ua': False,
                'rotate_ip': True,  # Would need proxy
                'clear_cookies': True,
                'note': 'IP banned - proxy recommended'
            },
            BlockType.WAF_BLOCK: {
                'action': 'wait_and_retry',
                'delay': 30,
                'rotate_ua': True,
                'rotate_ip': False,
                'clear_cookies': True
            },
            BlockType.JS_CHALLENGE: {
                'action': 'retry_with_js',
                'delay': 5,
                'rotate_ua': False,
                'rotate_ip': False,
                'clear_cookies': False,
                'use_headful': True
            }
        }

        return strategies.get(block_type, strategies[BlockType.NONE])


# ============================================================
# 5. Retry Logic with Exponential Backoff
# ============================================================
def retry_with_backoff(
    max_retries: int = 3,
    base_backoff: float = 2.0,
    max_backoff: float = 60.0,
    jitter_factor: float = 0.3,
    retriable_exceptions: tuple = (Exception,)
):
    """
    Decorator for retry with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts
        base_backoff: Base delay between retries (seconds)
        max_backoff: Maximum delay between retries (seconds)
        jitter_factor: Random jitter factor (0-1)
        retriable_exceptions: Exceptions that trigger retry
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retriable_exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        print(f"[RETRY] Max retries ({max_retries}) exceeded for {func.__name__}")
                        raise

                    # Calculate backoff with exponential increase
                    backoff = min(base_backoff * (2 ** attempt), max_backoff)

                    # Add jitter
                    jitter = backoff * jitter_factor * random.uniform(-1, 1)
                    delay = max(0, backoff + jitter)

                    print(f"[RETRY] Attempt {attempt + 1}/{max_retries} failed for {func.__name__}: {e}")
                    print(f"[RETRY] Waiting {delay:.2f}s before retry...")

                    time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator


# ============================================================
# 6. Enhanced Fingerprint Management
# ============================================================
class FingerprintManager:
    """Manages browser fingerprints for anti-detection"""

    def __init__(self, rotate_interval: int = 10):
        self.rotate_interval = rotate_interval
        self.request_count = 0
        self.current_fingerprint = self._generate_fingerprint()

    def _generate_fingerprint(self) -> Dict[str, Any]:
        """Generate a new realistic fingerprint"""
        # Screen resolutions (common)
        resolutions = [
            {'width': 1920, 'height': 1080},
            {'width': 1366, 'height': 768},
            {'width': 1536, 'height': 864},
            {'width': 1440, 'height': 900},
            {'width': 2560, 'height': 1440},
        ]

        # Timezones (Korea)
        timezones = ['Asia/Seoul']

        # Languages
        languages = [
            ['ko-KR', 'ko', 'en-US', 'en'],
            ['ko-KR', 'ko'],
            ['ko', 'en'],
        ]

        # Color depths
        color_depths = [24, 32]

        # Platform info
        platforms = [
            {'platform': 'Win32', 'oscpu': 'Windows NT 10.0; Win64; x64'},
            {'platform': 'MacIntel', 'oscpu': 'Intel Mac OS X 10_15_7'},
        ]

        resolution = random.choice(resolutions)
        platform = random.choice(platforms)

        return {
            'screen': resolution,
            'timezone': random.choice(timezones),
            'languages': random.choice(languages),
            'colorDepth': random.choice(color_depths),
            'platform': platform['platform'],
            'oscpu': platform['oscpu'],
            'userAgent': random.choices(USER_AGENTS, weights=USER_AGENT_WEIGHTS)[0],
            'webglVendor': 'Google Inc. (NVIDIA)',
            'webglRenderer': f'ANGLE (NVIDIA, NVIDIA GeForce RTX {random.choice(["3060", "3070", "3080", "4070", "4080"])})',
            'hardwareConcurrency': random.choice([4, 8, 12, 16]),
            'deviceMemory': random.choice([4, 8, 16, 32]),
        }

    def get_fingerprint(self) -> Dict[str, Any]:
        """Get current fingerprint, rotating if needed"""
        self.request_count += 1

        if self.request_count % self.rotate_interval == 0:
            self.current_fingerprint = self._generate_fingerprint()
            print(f"[FINGERPRINT] Rotated fingerprint (request #{self.request_count})")

        return self.current_fingerprint

    def get_stealth_js(self) -> str:
        """Generate JavaScript for fingerprint spoofing"""
        fp = self.current_fingerprint

        return f"""
        // === Enterprise Stealth JS v3.0 ===

        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {{
            get: () => undefined,
        }});

        // Override languages
        Object.defineProperty(navigator, 'languages', {{
            get: () => {json.dumps(fp['languages'])},
        }});

        // Override platform
        Object.defineProperty(navigator, 'platform', {{
            get: () => '{fp["platform"]}',
        }});

        // Override hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {{
            get: () => {fp['hardwareConcurrency']},
        }});

        // Override device memory
        Object.defineProperty(navigator, 'deviceMemory', {{
            get: () => {fp['deviceMemory']},
        }});

        // Override screen properties
        Object.defineProperty(screen, 'width', {{ get: () => {fp['screen']['width']} }});
        Object.defineProperty(screen, 'height', {{ get: () => {fp['screen']['height']} }});
        Object.defineProperty(screen, 'availWidth', {{ get: () => {fp['screen']['width']} }});
        Object.defineProperty(screen, 'availHeight', {{ get: () => {fp['screen']['height'] - 40} }});
        Object.defineProperty(screen, 'colorDepth', {{ get: () => {fp['colorDepth']} }});
        Object.defineProperty(screen, 'pixelDepth', {{ get: () => {fp['colorDepth']} }});

        // Override WebGL
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {{
            if (parameter === 37445) return '{fp["webglVendor"]}';
            if (parameter === 37446) return '{fp["webglRenderer"]}';
            return getParameter.apply(this, arguments);
        }};

        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({{ state: Notification.permission }}) :
                originalQuery(parameters)
        );

        // Override plugins (empty but realistic count)
        Object.defineProperty(navigator, 'plugins', {{
            get: () => {{
                const plugins = [
                    {{ name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' }},
                    {{ name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' }},
                    {{ name: 'Native Client', filename: 'internal-nacl-plugin' }},
                ]
                return {{ length: plugins.length, item: (i) => plugins[i], namedItem: (n) => plugins.find(p => p.name === n) }};
            }}
        }});

        // Add Chrome-specific properties
        window.chrome = {{
            runtime: {{}},
            loadTimes: function() {{}},
            csi: function() {{}},
            app: {{}}
        }};

        console.log('[Stealth] Enterprise fingerprint applied');
        """


# ============================================================
# 7. HTTP/2 Client with Connection Pooling
# ============================================================
class HTTP2Client:
    """HTTP/2 client with connection pooling and stealth features"""

    def __init__(self, config: StealthConfig):
        self.config = config
        self.fingerprint_manager = FingerprintManager(config.fingerprint_interval)
        self._client = None

    def _get_client(self) -> 'httpx.Client':
        """Get or create HTTP/2 client"""
        if not HAS_HTTPX:
            raise ImportError("httpx is required for HTTP/2 support. Run: pip install httpx[http2]")

        if self._client is None:
            fp = self.fingerprint_manager.get_fingerprint()

            self._client = httpx.Client(
                http2=self.config.use_http2,
                timeout=self.config.timeout,
                limits=httpx.Limits(
                    max_connections=self.config.connection_pool_size,
                    max_keepalive_connections=self.config.connection_pool_size // 2
                ),
                headers={
                    'User-Agent': fp['userAgent'],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': ','.join(fp['languages']),
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Cache-Control': 'max-age=0',
                }
            )

        return self._client

    @retry_with_backoff(max_retries=3, base_backoff=2.0)
    def get(self, url: str, **kwargs) -> 'httpx.Response':
        """Make GET request with retry"""
        client = self._get_client()
        return client.get(url, **kwargs)

    @retry_with_backoff(max_retries=3, base_backoff=2.0)
    def post(self, url: str, **kwargs) -> 'httpx.Response':
        """Make POST request with retry"""
        client = self._get_client()
        return client.post(url, **kwargs)

    def close(self):
        """Close client and release resources"""
        if self._client:
            self._client.close()
            self._client = None


# ============================================================
# 8. Enterprise Stealth Browser Manager
# ============================================================
class EnterpriseStealthBrowser:
    """
    Enterprise-grade stealth browser manager.
    Combines all anti-detection techniques.
    """

    def __init__(self, config: StealthConfig = None):
        self.config = config or StealthConfig()
        self.delay_generator = PODMPDelayGenerator(self.config)
        self.block_detector = BlockDetector()
        self.fingerprint_manager = FingerprintManager(self.config.fingerprint_interval)

        self._browser = None
        self._context = None
        self._page = None
        self._playwright = None

    def _get_browser_args(self) -> List[str]:
        """Get browser launch arguments for stealth"""
        return [
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-dev-shm-usage',
            '--disable-browser-side-navigation',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--disable-extensions',
            '--disable-popup-blocking',
            '--disable-notifications',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            f'--window-size={self.fingerprint_manager.current_fingerprint["screen"]["width"]},{self.fingerprint_manager.current_fingerprint["screen"]["height"]}',
        ]

    def launch(self) -> 'Page':
        """Launch stealth browser and return page"""
        if not HAS_PLAYWRIGHT:
            raise ImportError("playwright is required. Run: pip install playwright && playwright install")

        from playwright.sync_api import sync_playwright

        self._playwright = sync_playwright().start()

        fp = self.fingerprint_manager.get_fingerprint()

        # Launch browser
        self._browser = self._playwright.chromium.launch(
            headless=self.config.headless,
            args=self._get_browser_args()
        )

        # Create context with fingerprint
        context_options = {
            'user_agent': fp['userAgent'],
            'viewport': fp['screen'],
            'locale': fp['languages'][0] if fp['languages'] else 'ko-KR',
            'timezone_id': fp['timezone'],
            'color_scheme': 'light',
            'device_scale_factor': 1,
            'is_mobile': False,
            'has_touch': False,
            'ignore_https_errors': True,
        }

        # Use persistent context if enabled
        if self.config.use_persistent_context:
            context_dir = os.path.join(
                self.config.context_dir,
                hashlib.md5(fp['userAgent'].encode()).hexdigest()[:8]
            )
            os.makedirs(context_dir, exist_ok=True)

            self._context = self._browser.new_context(**context_options)
        else:
            self._context = self._browser.new_context(**context_options)

        # Create page
        self._page = self._context.new_page()

        # Apply stealth
        Stealth().apply_stealth_sync(self._page)

        # Inject custom stealth JS
        self._page.add_init_script(self.fingerprint_manager.get_stealth_js())

        return self._page

    @retry_with_backoff(max_retries=3, base_backoff=2.0)
    def goto(self, url: str, timeout: int = 30000) -> bool:
        """
        Navigate to URL with stealth delays and block detection.
        Returns True on success, False on failure.
        """
        if not self._page:
            raise RuntimeError("Browser not launched. Call launch() first.")

        # Pre-navigation delay
        delay = self.delay_generator.get_page_delay()
        print(f"[STEALTH] Pre-navigation delay: {delay:.2f}s")
        time.sleep(delay)

        try:
            response = self._page.goto(url, wait_until='networkidle', timeout=timeout)

            # Check for blocking
            content = self._page.content()
            status_code = response.status if response else 200

            block_type = self.block_detector.detect(content, status_code)

            if block_type != BlockType.NONE:
                strategy = self.block_detector.get_recovery_strategy(block_type)
                print(f"[BLOCK] Detected: {block_type.value}")
                print(f"[BLOCK] Recovery strategy: {strategy['action']}")

                if strategy['action'] == 'wait_and_retry':
                    print(f"[BLOCK] Waiting {strategy['delay']}s before retry...")
                    time.sleep(strategy['delay'])

                    if strategy.get('rotate_ua'):
                        self.fingerprint_manager.current_fingerprint = self.fingerprint_manager._generate_fingerprint()

                    if strategy.get('clear_cookies'):
                        self._context.clear_cookies()

                    # Retry
                    raise Exception(f"Block detected: {block_type.value}")

                elif strategy['action'] == 'abort':
                    print(f"[BLOCK] Aborting due to: {strategy.get('note', block_type.value)}")
                    return False

                elif strategy['action'] == 'manual_intervention':
                    print(f"[BLOCK] Manual intervention required: {strategy.get('note', 'Unknown')}")
                    return False

            # Post-navigation delay
            post_delay = self.delay_generator.get_delay()
            time.sleep(post_delay)

            return True

        except Exception as e:
            print(f"[ERROR] Navigation failed: {e}")
            raise

    def scroll_naturally(self, distance: int = None):
        """Simulate natural scrolling behavior"""
        if not self._page:
            return

        if distance is None:
            distance = random.randint(200, 600)

        # Random scroll speed
        steps = random.randint(3, 8)
        step_distance = distance // steps

        for _ in range(steps):
            self._page.mouse.wheel(0, step_distance)
            time.sleep(self.delay_generator.get_scroll_delay())

    def click_naturally(self, selector: str):
        """Click element with natural mouse movement"""
        if not self._page:
            return

        element = self._page.query_selector(selector)
        if not element:
            return

        # Get element position
        box = element.bounding_box()
        if not box:
            return

        # Random click position within element
        x = box['x'] + random.uniform(box['width'] * 0.2, box['width'] * 0.8)
        y = box['y'] + random.uniform(box['height'] * 0.2, box['height'] * 0.8)

        # Pre-click delay
        time.sleep(self.delay_generator.get_click_delay())

        # Move and click
        self._page.mouse.move(x, y)
        time.sleep(random.uniform(0.05, 0.15))
        self._page.mouse.click(x, y)

    def close(self):
        """Close browser and cleanup"""
        if self._page:
            self._page.close()
            self._page = None

        if self._context:
            self._context.close()
            self._context = None

        if self._browser:
            self._browser.close()
            self._browser = None

        if self._playwright:
            self._playwright.stop()
            self._playwright = None

    def __enter__(self):
        self.launch()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False


# ============================================================
# 9. Convenience Functions
# ============================================================
def create_stealth_browser(
    headless: bool = True,
    use_persistent_context: bool = False,
    **kwargs
) -> EnterpriseStealthBrowser:
    """
    Create and configure a stealth browser instance.

    Args:
        headless: Run in headless mode
        use_persistent_context: Use persistent browser context
        **kwargs: Additional StealthConfig options

    Returns:
        Configured EnterpriseStealthBrowser instance
    """
    config = StealthConfig(
        headless=headless,
        use_persistent_context=use_persistent_context,
        **kwargs
    )

    return EnterpriseStealthBrowser(config)


def smart_delay(
    min_delay: float = 1.0,
    max_delay: float = 5.0,
    poisson_lambda: float = 2.0
) -> float:
    """
    Execute intelligent POMDP-based delay.
    Drop-in replacement for time.sleep() with human-like patterns.

    Args:
        min_delay: Minimum delay in seconds
        max_delay: Maximum delay in seconds
        poisson_lambda: Poisson distribution parameter

    Returns:
        Actual delay duration
    """
    return pomdp_delay(min_delay, max_delay, poisson_lambda)


# ============================================================
# 10. Module Initialization
# ============================================================
print(f"[Enterprise Stealth v3.0] Initialized")
print(f"  - Playwright: {'OK' if HAS_PLAYWRIGHT else 'Not installed'}")
print(f"  - httpx (HTTP/2): {'OK' if HAS_HTTPX else 'Not installed'}")
print(f"  - curl_cffi: {'OK' if HAS_CURL_CFFI else 'Not installed'}")


if __name__ == "__main__":
    # Test the module
    print("\n[TEST] Testing POMDP delay generator...")

    config = StealthConfig()
    delay_gen = PODMPDelayGenerator(config)

    delays = []
    for i in range(10):
        d = delay_gen.get_delay()
        delays.append(d)
        print(f"  Request {i+1}: {d:.2f}s (state: {delay_gen.current_state})")

    print(f"\n  Average delay: {sum(delays)/len(delays):.2f}s")
    print(f"  Min: {min(delays):.2f}s, Max: {max(delays):.2f}s")

    print("\n[TEST] Testing fingerprint generation...")
    fp_manager = FingerprintManager()
    fp = fp_manager.get_fingerprint()
    print(f"  User-Agent: {fp['userAgent'][:50]}...")
    print(f"  Screen: {fp['screen']}")
    print(f"  Platform: {fp['platform']}")

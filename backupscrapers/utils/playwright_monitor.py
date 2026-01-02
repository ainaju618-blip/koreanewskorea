# -*- coding: utf-8 -*-
"""
Playwright Monitor - Heavy Browser-based Stealth Monitoring
Version: 1.1 (2025-12-29)

Uses real Playwright browser instead of HTTP requests to avoid detection.

Features:
- Full browser emulation (Chrome/Edge)
- Advanced stealth JavaScript injection
- Human-like behavior simulation
- Random delays and mouse movements
- Session persistence with cookies
- Block detection and auto-recovery
- Comprehensive logging to logs/playwright_monitor.log

Created: 2025-12-28
Updated: 2025-12-29 - Added logging, changed schedule to hourly 07:00-19:00
"""

import os
import re
import sys
import time
import random
import logging
from datetime import datetime, timedelta, timezone

# ============================================================
# Global Logging Setup
# ============================================================
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'playwright_monitor.log')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Create module logger
logger = logging.getLogger('PlaywrightMonitor')

# Korea timezone (UTC+9)
KST = timezone(timedelta(hours=9))
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

# Load environment variables
try:
    from dotenv import load_dotenv
    env_paths = [
        os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'),
        os.path.join(os.path.dirname(__file__), '..', '..', '.env'),
        '.env.local',
        '.env',
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            break
except ImportError:
    pass

# Import Playwright
try:
    from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False
    print("[ERROR] Playwright not installed. Run: pip install playwright && playwright install chromium")

# Import stealth module
try:
    from .stealth import (
        STEALTH_JS,
        USER_AGENTS,
        REFERERS,
        VIEWPORTS,
        get_random_user_agent,
        get_random_viewport,
        random_delay,
    )
except ImportError:
    try:
        from stealth import (
            STEALTH_JS,
            USER_AGENTS,
            REFERERS,
            VIEWPORTS,
            get_random_user_agent,
            get_random_viewport,
            random_delay,
        )
    except ImportError:
        print("[ERROR] stealth.py module not found")
        STEALTH_JS = ""
        USER_AGENTS = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36']
        REFERERS = ['https://www.google.com/', '']
        VIEWPORTS = [{'width': 1920, 'height': 1080}]
        def get_random_user_agent(): return random.choice(USER_AGENTS)
        def get_random_viewport(): return random.choice(VIEWPORTS)
        def random_delay(base=2.0, var=0.3): time.sleep(random.gauss(base, base*var))

# Supabase client
try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    create_client = None


# ============================================================
# CONSTANTS
# ============================================================

# Monitoring intervals (seconds)
MIN_INTERVAL = 30       # Minimum between checks
MAX_INTERVAL = 120      # Maximum between checks
REGION_DELAY_MIN = 5    # Min delay between regions
REGION_DELAY_MAX = 15   # Max delay between regions

# Human behavior simulation
SCROLL_CHANCE = 0.7     # 70% chance to scroll
MOUSE_MOVE_CHANCE = 0.5 # 50% chance to move mouse
PAUSE_CHANCE = 0.3      # 30% chance to pause reading


@dataclass
class MonitorResult:
    """Result of monitoring a single region."""
    region_code: str
    success: bool
    has_new: bool
    new_article_ids: List[str] = field(default_factory=list)
    new_article_urls: List[str] = field(default_factory=list)
    latest_id: Optional[str] = None
    error: Optional[str] = None
    blocked: bool = False
    response_time_ms: int = 0


@dataclass
class BlockStatus:
    """Track blocking status for a region."""
    region_code: str
    is_blocked: bool = False
    blocked_at: Optional[datetime] = None
    cooldown_until: Optional[datetime] = None
    consecutive_blocks: int = 0


class PlaywrightMonitor:
    """
    Playwright-based monitor using real browser for stealth.

    Usage:
        monitor = PlaywrightMonitor()
        monitor.start()

        result = monitor.check_region('naju', config, last_id)

        monitor.stop()
    """

    def __init__(
        self,
        headless: bool = True,
        timeout: int = 30000,
        slow_mo: int = 0,
    ):
        self.headless = headless
        self.timeout = timeout
        self.slow_mo = slow_mo

        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

        # Block tracking
        self.block_status: Dict[str, BlockStatus] = {}

        # Last check times per region (for rate limiting)
        self.last_check: Dict[str, datetime] = {}

        # Supabase client
        self.supabase = None
        if HAS_SUPABASE and create_client:
            url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
            key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
            if url and key:
                try:
                    self.supabase = create_client(url, key)
                except Exception as e:
                    print(f"[MONITOR] Supabase init failed: {e}")

    def start(self) -> bool:
        """Start the browser."""
        if not HAS_PLAYWRIGHT:
            print("[ERROR] Playwright not available")
            return False

        try:
            self.playwright = sync_playwright().start()

            # Launch browser with stealth args
            self.browser = self.playwright.chromium.launch(
                headless=self.headless,
                slow_mo=self.slow_mo,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--disable-extensions',
                    '--disable-gpu',
                    '--lang=ko-KR',
                ]
            )

            # Create stealth context
            self._create_context()

            print(f"[MONITOR] Browser started (headless={self.headless})")
            return True

        except Exception as e:
            print(f"[ERROR] Failed to start browser: {e}")
            return False

    def _create_context(self) -> None:
        """Create a new browser context with stealth settings."""
        if not self.browser:
            return

        viewport = get_random_viewport()
        user_agent = get_random_user_agent()

        self.context = self.browser.new_context(
            viewport=viewport,
            user_agent=user_agent,
            locale='ko-KR',
            timezone_id='Asia/Seoul',
            extra_http_headers={
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            java_script_enabled=True,
            bypass_csp=True,
            ignore_https_errors=True,
        )

        self.context.set_default_timeout(self.timeout)

        # Create page and apply stealth
        self.page = self.context.new_page()

        if STEALTH_JS:
            self.page.add_init_script(STEALTH_JS)

        print(f"[MONITOR] Context created: {viewport['width']}x{viewport['height']}, UA: {user_agent[:50]}...")

    def _refresh_context(self) -> None:
        """Refresh context with new identity (after block detection)."""
        if self.context:
            try:
                self.context.close()
            except:
                pass
        self._create_context()
        print("[MONITOR] Context refreshed with new identity")

    def stop(self) -> None:
        """Stop the browser."""
        try:
            if self.page:
                self.page.close()
            if self.context:
                self.context.close()
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
            print("[MONITOR] Browser stopped")
        except Exception as e:
            print(f"[WARN] Error stopping browser: {e}")
        finally:
            self.page = None
            self.context = None
            self.browser = None
            self.playwright = None

    def _simulate_human_behavior(self, page: Page) -> None:
        """Simulate human-like behavior on the page."""
        try:
            # Random scroll
            if random.random() < SCROLL_CHANCE:
                scroll_amount = random.randint(100, 500)
                page.evaluate(f"window.scrollBy(0, {scroll_amount})")
                time.sleep(random.uniform(0.3, 0.8))

            # Random mouse movement
            if random.random() < MOUSE_MOVE_CHANCE:
                x = random.randint(100, 800)
                y = random.randint(100, 600)
                page.mouse.move(x, y)
                time.sleep(random.uniform(0.1, 0.3))

            # Random pause (pretend reading)
            if random.random() < PAUSE_CHANCE:
                time.sleep(random.uniform(1.0, 3.0))

        except Exception:
            pass  # Ignore errors in simulation

    def _detect_block(self, page: Page) -> Tuple[bool, str]:
        """Detect if the page indicates blocking."""
        try:
            # Get page title and visible text (not raw HTML to avoid meta tag false positives)
            title = page.title().lower()

            # Get body text only (excludes meta tags and head)
            try:
                body_text = page.evaluate("document.body ? document.body.innerText.toLowerCase() : ''")
            except Exception:
                body_text = ""

            # Check title for block indicators
            title_blocks = ['차단', '접근 거부', 'blocked', 'forbidden', '403', '접근금지']
            for pattern in title_blocks:
                if pattern in title:
                    return True, f"Title block: {pattern}"

            # Check HTTP status via response (if available)
            # Note: This is just a backup check

            # Korean block patterns (more specific)
            korean_blocks = [
                '접근이 차단되었습니다',
                '접근이 거부되었습니다',
                '비정상적인 접근이 감지',
                '자동화된 접근이 감지',
                '로봇 차단',
                '봇이 감지되었습니다',
                '과도한 요청으로',
                '잠시 후 다시 시도',
                '서비스 이용이 제한',
                '접속이 차단되었습니다',
                'IP가 차단',
                'IP 차단 안내',
                '웹 방화벽에 의해',
                '정상적인 접근이 아닙니다',
            ]

            for pattern in korean_blocks:
                if pattern in body_text:
                    return True, f"Korean block: {pattern}"

            # English block patterns (more specific, excludes common false positives)
            english_blocks = [
                'you have been blocked',
                'access has been denied',
                'access is denied',
                'your access is blocked',
                'please complete the captcha',
                'prove you are not a robot',
                'automated access detected',
                'too many requests from your ip',
                'rate limit exceeded',
                'ddos protection by cloudflare',
                'checking your browser',
                'please wait while we verify',
            ]

            for pattern in english_blocks:
                if pattern in body_text:
                    return True, f"English block: {pattern}"

            # Check for CAPTCHA elements
            captcha_selectors = [
                'iframe[src*="captcha"]',
                'iframe[src*="recaptcha"]',
                'div[class*="captcha"]',
                '#captcha',
                '.g-recaptcha',
                '#cf-turnstile',
                '.cf-turnstile',
            ]

            for selector in captcha_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        return True, "CAPTCHA detected"
                except Exception:
                    pass

            return False, ""

        except Exception as e:
            return False, f"Detection error: {e}"

    def _update_block_status(self, region_code: str, is_blocked: bool, reason: str = "") -> None:
        """Update block tracking for a region."""
        if region_code not in self.block_status:
            self.block_status[region_code] = BlockStatus(region_code=region_code)

        status = self.block_status[region_code]

        if is_blocked:
            status.is_blocked = True
            status.blocked_at = datetime.now(KST)
            status.consecutive_blocks += 1

            # Exponential backoff: 30min, 1h, 2h, 4h, max 8h
            cooldown_minutes = min(480, 30 * (2 ** (status.consecutive_blocks - 1)))
            status.cooldown_until = datetime.now(KST) + timedelta(minutes=cooldown_minutes)

            # Refresh context to get new identity
            self._refresh_context()

            print(f"[BLOCK] {region_code}: {reason} | Cooldown {cooldown_minutes}min")
        else:
            if status.consecutive_blocks > 0:
                status.consecutive_blocks = max(0, status.consecutive_blocks - 1)
            status.is_blocked = False

    def is_in_cooldown(self, region_code: str) -> bool:
        """Check if region is in cooldown period."""
        status = self.block_status.get(region_code)
        if not status or not status.cooldown_until:
            return False
        return datetime.now(KST) < status.cooldown_until

    def _extract_article_ids(self, html: str, config: Dict) -> List[Tuple[str, str]]:
        """Extract article IDs and URLs from HTML."""
        base_url = config.get('base_url', '')
        results = []

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

                if url and url.startswith('/'):
                    url = base_url + url
                elif url and not url.startswith('http'):
                    url = base_url + '/' + url

                if article_id:
                    results.append((str(article_id), url))

        # Remove duplicates
        seen = set()
        unique_results = []
        for item in results:
            if item[0] not in seen:
                seen.add(item[0])
                unique_results.append(item)

        return unique_results[:15]

    def check_region(
        self,
        region_code: str,
        config: Dict,
        last_known_id: Optional[str] = None
    ) -> MonitorResult:
        """
        Check a region for new articles using Playwright browser.

        Args:
            region_code: Region identifier
            config: Region configuration with list_url, base_url
            last_known_id: Last known article ID

        Returns:
            MonitorResult with check results
        """
        # Check cooldown
        if self.is_in_cooldown(region_code):
            cooldown_until = self.block_status[region_code].cooldown_until
            remaining = (cooldown_until - datetime.now(KST)).seconds // 60
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                error=f"In cooldown ({remaining}min remaining)",
                blocked=True
            )

        # Check rate limiting
        now = datetime.now(KST)
        if region_code in self.last_check:
            elapsed = (now - self.last_check[region_code]).seconds
            if elapsed < MIN_INTERVAL:
                wait_time = MIN_INTERVAL - elapsed
                return MonitorResult(
                    region_code=region_code,
                    success=False,
                    has_new=False,
                    error=f"Rate limited ({wait_time}s remaining)"
                )

        list_url = config.get('list_url', '')
        if not list_url:
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                error="No list_url configured"
            )

        if not self.page:
            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                error="Browser not started"
            )

        try:
            start_time = time.time()

            # Random delay before navigation
            delay = random.uniform(REGION_DELAY_MIN, REGION_DELAY_MAX)
            print(f"[MONITOR] {region_code}: Waiting {delay:.1f}s before check...")
            time.sleep(delay)

            # Set random referer
            referer = random.choice(REFERERS)
            if referer:
                self.page.set_extra_http_headers({'Referer': referer})

            # Navigate to listing page
            print(f"[MONITOR] {region_code}: Navigating to {list_url[:60]}...")
            response = self.page.goto(list_url, wait_until='domcontentloaded')

            # Record check time
            self.last_check[region_code] = datetime.now(KST)

            # Check for blocks
            is_blocked, block_reason = self._detect_block(self.page)
            if is_blocked:
                self._update_block_status(region_code, True, block_reason)
                return MonitorResult(
                    region_code=region_code,
                    success=False,
                    has_new=False,
                    error=block_reason,
                    blocked=True
                )

            # Simulate human behavior
            self._simulate_human_behavior(self.page)

            # Get page content
            html = self.page.content()
            response_time = int((time.time() - start_time) * 1000)

            # Extract article IDs
            articles = self._extract_article_ids(html, config)

            if not articles:
                return MonitorResult(
                    region_code=region_code,
                    success=True,
                    has_new=False,
                    error=None,  # No articles is normal
                    response_time_ms=response_time
                )

            # Check for new articles
            latest_id = articles[0][0]
            new_articles = []

            if last_known_id:
                for article_id, url in articles:
                    if article_id == last_known_id:
                        break
                    new_articles.append((article_id, url))
            else:
                # First check - no baseline
                new_articles = articles[:1]  # Just mark latest as "new"

            has_new = len(new_articles) > 0

            # Update block status on success
            self._update_block_status(region_code, False)

            result = MonitorResult(
                region_code=region_code,
                success=True,
                has_new=has_new,
                new_article_ids=[a[0] for a in new_articles],
                new_article_urls=[a[1] for a in new_articles],
                latest_id=latest_id,
                response_time_ms=response_time
            )

            if has_new:
                print(f"[MONITOR] {region_code}: Found {len(new_articles)} new article(s)!")
            else:
                print(f"[MONITOR] {region_code}: No new articles (latest: {latest_id})")

            return result

        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] {region_code}: {error_msg}")

            # Check if error indicates blocking
            if 'timeout' in error_msg.lower() or 'navigation' in error_msg.lower():
                self._update_block_status(region_code, True, f"Navigation error: {error_msg[:50]}")

            return MonitorResult(
                region_code=region_code,
                success=False,
                has_new=False,
                error=error_msg[:100],
                blocked='timeout' in error_msg.lower()
            )

    def check_all_regions(
        self,
        configs: Dict[str, Dict],
        last_known_ids: Dict[str, str],
        shuffle: bool = True,
        log_to_db: bool = True
    ) -> List[MonitorResult]:
        """
        Check all regions with random ordering and delays.

        Args:
            configs: Dictionary of region configs
            last_known_ids: Last known article IDs per region
            shuffle: Randomize check order
            log_to_db: Log activity to Supabase

        Returns:
            List of MonitorResult for each region
        """
        results = []
        region_codes = list(configs.keys())

        # Randomize order
        if shuffle:
            random.shuffle(region_codes)

        print(f"[MONITOR] Checking {len(region_codes)} regions (shuffled={shuffle})...")

        for i, region_code in enumerate(region_codes):
            config = configs.get(region_code, {})
            last_id = last_known_ids.get(region_code)

            # Check region
            result = self.check_region(region_code, config, last_id)
            results.append(result)

            # Log to database
            if log_to_db and self.supabase and result.success:
                try:
                    self._log_activity(region_code, result)
                except Exception as e:
                    print(f"[WARN] Failed to log activity: {e}")

            # Don't delay after last region
            if i < len(region_codes) - 1:
                delay = random.uniform(REGION_DELAY_MIN, REGION_DELAY_MAX)
                time.sleep(delay)

        # Summary
        success_count = sum(1 for r in results if r.success)
        new_count = sum(1 for r in results if r.has_new)
        blocked_count = sum(1 for r in results if r.blocked)

        print(f"[MONITOR] Complete: {success_count}/{len(results)} success, {new_count} with new articles, {blocked_count} blocked")

        return results

    def _log_activity(self, region_code: str, result: MonitorResult) -> None:
        """Log monitoring activity to Supabase."""
        if not self.supabase:
            return

        event_type = 'check'
        message = f"Checked {region_code}"

        if result.has_new:
            event_type = 'new_article'
            message = f"Found {len(result.new_article_ids)} new article(s)"
        elif result.blocked:
            event_type = 'block'
            message = f"Blocked: {result.error}"
        elif result.error:
            event_type = 'error'
            message = result.error

        try:
            self.supabase.table('monitor_activity_log').insert({
                'event_type': event_type,
                'region_code': region_code,
                'message': message,
                'details': {
                    'latest_id': result.latest_id,
                    'new_count': len(result.new_article_ids),
                    'response_time_ms': result.response_time_ms,
                },
                'created_at': datetime.now(KST).isoformat(),
            }).execute()

            # Update scraper_state with latest article ID (prevents duplicate detection)
            if result.latest_id:
                try:
                    self.supabase.table('scraper_state').upsert({
                        'region_code': region_code,
                        'last_article_id': result.latest_id,
                        'last_check_at': datetime.now(KST).isoformat(),
                        'last_article_at': datetime.now(KST).isoformat() if result.has_new else None,
                    }, on_conflict='region_code').execute()
                    print(f"[STATE] Saved {region_code} latest_id={result.latest_id}")
                except Exception as state_err:
                    print(f"[STATE-ERR] {region_code}: {state_err}")
        except Exception as e:
            print(f"[WARN] DB log failed: {e}")


# ============================================================
# Singleton accessor
# ============================================================

_monitor_instance: Optional[PlaywrightMonitor] = None

def get_playwright_monitor(headless: bool = True) -> PlaywrightMonitor:
    """Get or create the singleton PlaywrightMonitor instance."""
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = PlaywrightMonitor(headless=headless)
        _monitor_instance.start()
    return _monitor_instance


def shutdown_monitor() -> None:
    """Shutdown the singleton monitor."""
    global _monitor_instance
    if _monitor_instance:
        _monitor_instance.stop()
        _monitor_instance = None


# ============================================================
# Helper Functions for Scheduler
# ============================================================

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


def restart_ollama_server() -> bool:
    """
    Restart Ollama server (kill existing and start fresh).
    Always restarts to ensure clean state.

    Returns:
        True if Ollama is running after restart
    """
    import subprocess

    OLLAMA_PORT = 11434

    print("[OLLAMA] Restarting Ollama server for clean state...")

    # Step 1: Kill existing Ollama process
    try:
        if sys.platform == 'win32':
            # Windows: taskkill
            subprocess.run(
                ['taskkill', '/F', '/IM', 'ollama.exe'],
                capture_output=True,
                timeout=10
            )
            print("[OLLAMA] Killed existing Ollama process")
        else:
            # Unix: pkill
            subprocess.run(
                ['pkill', '-f', 'ollama'],
                capture_output=True,
                timeout=10
            )
            print("[OLLAMA] Killed existing Ollama process")
    except Exception as e:
        print(f"[OLLAMA] No existing process to kill: {e}")

    # Wait for port to be released
    time.sleep(2)

    # Step 2: Start Ollama fresh
    try:
        if sys.platform == 'win32':
            # Windows: start in background
            subprocess.Popen(
                ['cmd', '/c', 'start', '/min', 'ollama', 'serve'],
                shell=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # Unix: nohup
            subprocess.Popen(
                ['nohup', 'ollama', 'serve'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )

        print("[OLLAMA] Starting fresh Ollama server...")

        # Wait for Ollama to start (max 30 seconds)
        for i in range(30):
            time.sleep(1)
            if check_server_running('localhost', OLLAMA_PORT):
                print(f"[OLLAMA] Server ready (took {i+1}s)")
                return True

        print("[OLLAMA] ERROR: Server failed to start within 30s")
        return False

    except FileNotFoundError:
        print("[OLLAMA] ERROR: Ollama not installed. Install from https://ollama.ai")
        return False
    except Exception as e:
        print(f"[OLLAMA] ERROR starting server: {e}")
        return False


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
        now = datetime.now(KST)

    hour = now.hour

    if 6 <= hour < 9:
        return 30 * 60   # 30 minutes
    elif 9 <= hour < 18:
        return 60 * 60   # 1 hour
    elif 18 <= hour < 22:
        return 30 * 60   # 30 minutes
    else:
        return 2 * 60 * 60  # 2 hours


def get_scraper_path(region_code: str) -> Optional[str]:
    """
    Get the path to the regional scraper script.
    Returns None if scraper not found.
    """
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
    max_articles: int = 10
) -> bool:
    """
    Trigger regional scraper to collect new articles.
    Runs synchronously (blocking) to ensure articles are collected before AI processing.

    Args:
        region_code: Region code (e.g., 'naju', 'gwangyang')
        article_ids: List of new article IDs to scrape
        max_articles: Maximum articles to scrape

    Returns:
        True if scraper completed successfully
    """
    import subprocess

    scraper_path = get_scraper_path(region_code)

    if not scraper_path:
        print(f"[SCRAPER] Scraper not found for region: {region_code}")
        return False

    # Build command arguments
    # Note: Regional scrapers only support --max-articles, not --article-ids
    cmd = [
        sys.executable,
        scraper_path,
        '--max-articles', str(min(len(article_ids), max_articles)),
    ]

    cwd = os.path.dirname(os.path.dirname(scraper_path))
    print(f"[SCRAPER] Command: {' '.join(cmd)}")
    print(f"[SCRAPER] Working dir: {cwd}")

    try:
        print(f"[SCRAPER] Starting scraper for {region_code}: {len(article_ids)} articles")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=cwd
        )

        # Always log returncode for debugging
        print(f"[SCRAPER] Return code: {result.returncode}")

        # Log stdout/stderr for debugging (first 500 chars)
        if result.stdout:
            stdout_preview = result.stdout[:500].replace('\n', ' | ')
            print(f"[SCRAPER][STDOUT]: {stdout_preview}...")
        if result.stderr:
            stderr_preview = result.stderr[:500].replace('\n', ' | ')
            print(f"[SCRAPER][STDERR]: {stderr_preview}...")

        if result.returncode == 0:
            print(f"[SCRAPER] Completed successfully for {region_code}")
            return True
        else:
            print(f"[SCRAPER] Failed for {region_code} (exit code: {result.returncode})")
            return False

    except subprocess.TimeoutExpired:
        print(f"[SCRAPER] Timeout for {region_code} (5 min)")
        return False
    except Exception as e:
        print(f"[SCRAPER] Error for {region_code}: {e}")
        return False


def trigger_ai_process(
    region_code: str = None,
    mode: str = 'lightweight',
    api_url: str = None,
    api_key: str = 'korea-news-bot-secret-2024',
    skip_ollama_restart: bool = False
) -> bool:
    """
    Trigger AI processing bot via API.
    Optionally restarts Ollama server before calling API.

    Args:
        region_code: Optional region filter
        mode: Processing mode ('lightweight' or 'full')
        api_url: API endpoint URL (defaults to localhost:3000)
        api_key: API authentication key
        skip_ollama_restart: Skip Ollama restart if True

    Returns:
        True if trigger was successful
    """
    import requests

    # Step 1: Restart Ollama server if not skipped
    if not skip_ollama_restart:
        print("[AI-TRIGGER] Ensuring Ollama server is ready...")
        if not restart_ollama_server():
            print("[AI-TRIGGER] ERROR: Ollama server not ready. Skipping AI processing.")
            return False
        # Wait for network stack to stabilize after Ollama restart
        time.sleep(3)

    if api_url is None:
        api_url = os.environ.get(
            'AI_TRIGGER_API_URL',
            'http://localhost:3000/api/bot/trigger-ai-process'
        )

    # Retry logic for API call
    max_retries = 3
    for attempt in range(max_retries):
        try:
            payload = {'mode': mode}
            if region_code:
                payload['region'] = region_code

            print(f"[AI-TRIGGER] Calling API (attempt {attempt + 1}/{max_retries}): {api_url}")

            response = requests.post(
                api_url,
                json=payload,
                headers={
                    'x-api-key': api_key,
                    'Content-Type': 'application/json'
                },
                timeout=120
            )

            if response.status_code == 200:
                result = response.json()
                processed = result.get('processed', 0)
                print(f"[AI-TRIGGER] Success: {processed} articles processed")
                return True
            else:
                print(f"[AI-TRIGGER] Failed: {response.status_code} - {response.text[:100]}")
                if attempt < max_retries - 1:
                    print(f"[AI-TRIGGER] Retrying in 5s...")
                    time.sleep(5)

        except requests.exceptions.Timeout:
            print(f"[AI-TRIGGER] Timeout on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                time.sleep(5)
        except Exception as e:
            print(f"[AI-TRIGGER] Error: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)

    print("[AI-TRIGGER] All retries failed")
    return False


# ============================================================
# Daemon Mode - Continuous Monitoring Loop
# ============================================================

def run_daemon(
    supabase_url: str = None,
    supabase_key: str = None,
    trigger_ai: bool = True,
    max_cycles: int = 0,
    headless: bool = True
):
    """
    Run Playwright monitoring daemon in continuous loop.

    Checks DB for is_running flag and executes monitoring cycles.
    If max_cycles > 0, exits after that many cycles.
    """
    import httpx

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
    print("Playwright Monitor Daemon v1.0 (Stealth Browser)")
    print("=" * 60)
    print(f"[DAEMON] Supabase URL: {supabase_url[:50]}...")
    print(f"[DAEMON] Regions: {len(REGION_CONFIGS)}")
    print(f"[DAEMON] Trigger AI: {trigger_ai}")
    print(f"[DAEMON] Headless: {headless}")
    print("=" * 60)

    # Initialize monitor
    monitor = PlaywrightMonitor(headless=headless)
    if not monitor.start():
        print("[DAEMON] ERROR: Failed to start browser")
        return

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

    try:
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
                        f"{supabase_url}/rest/v1/realtime_monitor?is_running=eq.true",
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
                print(f"[DAEMON] Cycle #{cycle_count} starting at {datetime.now(KST).strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"[DAEMON] Next interval: {interval // 60} minutes")
                print(f"{'=' * 60}")

                # Run monitoring cycle
                results = monitor.check_all_regions(
                    configs=REGION_CONFIGS,
                    last_known_ids=last_known_ids,
                    shuffle=True,
                    log_to_db=True
                )

                # Update last known IDs and count stats
                total_new = 0
                total_blocked = 0
                total_errors = 0
                regions_with_new = []  # Track regions with new articles

                for result in results:
                    if result.has_new and result.new_article_ids:
                        last_known_ids[result.region_code] = result.new_article_ids[0]
                        total_new += 1
                        regions_with_new.append({
                            'region_code': result.region_code,
                            'article_ids': result.new_article_ids
                        })
                    if result.blocked:
                        total_blocked += 1
                    if result.error and not result.blocked:
                        total_errors += 1

                print(f"\n[DAEMON] Cycle #{cycle_count} complete:")
                print(f"  - New articles: {total_new} regions")
                print(f"  - Blocked: {total_blocked} regions")
                print(f"  - Errors: {total_errors} regions")

                # IMPORTANT: Scraping runs independently of AI toggle
                # Scraping collects raw articles to posts table
                # AI processing is optional post-processing step
                if regions_with_new:
                    print(f"\n[DAEMON] Triggering scrapers for {len(regions_with_new)} regions...")
                    scraper_success = 0
                    for region_info in regions_with_new:
                        if trigger_scraper(region_info['region_code'], region_info['article_ids']):
                            scraper_success += 1
                    print(f"[DAEMON] Scrapers completed: {scraper_success}/{len(regions_with_new)}")

                    # Trigger AI processing only if enabled
                    if trigger_ai:
                        print("[DAEMON] Triggering AI processing...")
                        trigger_ai_process()
                    else:
                        print("[DAEMON] AI processing disabled (--no-ai flag)")

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
                            'message': f'Playwright Cycle #{cycle_count}: {total_new} new, {total_blocked} blocked',
                            'details': {
                                'cycle': cycle_count,
                                'new_regions': total_new,
                                'blocked_regions': total_blocked,
                                'error_regions': total_errors,
                                'interval_minutes': interval // 60,
                                'monitor_type': 'playwright'
                            }
                        }
                    )
                except Exception as log_error:
                    print(f"[DAEMON] Warning: Failed to log cycle: {log_error}")

                # Check if max_cycles reached
                if max_cycles > 0 and cycle_count >= max_cycles:
                    print(f"\n[DAEMON] Max cycles reached ({max_cycles}). Exiting...")
                    break

                # Wait for next cycle with random jitter
                jitter = random.randint(-60, 60)  # +/- 1 minute
                wait_time = interval + jitter
                print(f"\n[DAEMON] Sleeping for {wait_time // 60} minutes...")
                time.sleep(wait_time)

            except KeyboardInterrupt:
                raise
            except Exception as e:
                print(f"[DAEMON] Error in cycle: {e}")
                time.sleep(60)  # Wait 1 minute on error

    except KeyboardInterrupt:
        print("\n[DAEMON] Interrupted by user. Exiting...")
    finally:
        monitor.stop()


# ============================================================
# Scheduler Mode - Time-based Automatic Monitoring
# ============================================================

def run_scheduler(
    supabase_url: str = None,
    supabase_key: str = None,
    trigger_ai: bool = True,
    cycles_per_run: int = 1,  # Changed from 3 to 1 (single cycle per scheduled time)
    headless: bool = True
):
    """
    Run time-based scheduler that triggers monitoring at scheduled times.

    This mode runs continuously and checks system time every minute.
    When a scheduled time is reached, it runs 'cycles_per_run' monitoring cycles.

    Schedule is read from DB (realtime_monitor.config.schedule).
    Default schedule: 07:00 ~ 19:00, every 1 hour (13 times/day)
    """
    import httpx

    # Get Supabase credentials from environment
    supabase_url = supabase_url or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = supabase_key or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        logger.error("Supabase credentials not found")
        logger.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return

    # Import regional configs
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from configs.regional_configs import REGIONAL_CONFIGS as REGION_CONFIGS
    except ImportError as e:
        logger.error(f"Cannot import REGION_CONFIGS: {e}")
        return

    # Default schedule: 07:00 ~ 19:00, every 1 hour (13 times/day)
    default_schedule = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
    ]

    logger.info("=" * 60)
    logger.info("Playwright Monitor Scheduler v1.1 (Stealth Browser)")
    logger.info("=" * 60)
    logger.info(f"Supabase URL: {supabase_url[:50]}...")
    logger.info(f"Regions: {len(REGION_CONFIGS)}")
    logger.info(f"Cycles per run: {cycles_per_run}")
    logger.info(f"Trigger AI: {trigger_ai}")
    logger.info(f"Default schedule: {default_schedule}")
    logger.info(f"Log file: {LOG_FILE}")
    logger.info("=" * 60)

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
                now = datetime.now(KST)

            current_date = now.strftime('%Y-%m-%d')
            current_time = now.strftime('%H:%M')

            # Reset completed times if new day
            if last_run_date != current_date:
                completed_times_today = set()
                last_run_date = current_date
                logger.info(f"New day started: {current_date}")

            # Check DB for is_running flag and schedule config
            response = httpx.get(
                f"{supabase_url}/rest/v1/realtime_monitor?select=is_running,config&limit=1",
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}'
                }
            )

            if response.status_code != 200:
                logger.warning(f"DB check failed: {response.status_code}")
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
                logger.info(f"Force check requested at {current_time}!")
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
                    trigger_ai, cycles_per_run, 'manual', headless
                )
                continue

            # Check if current time matches any scheduled time
            if current_time in schedule and current_time not in completed_times_today:
                logger.info(f"Scheduled time reached: {current_time}")

                # Mark as completed for today
                completed_times_today.add(current_time)

                # Run monitoring cycles
                _run_scheduled_cycles(
                    supabase_url, supabase_key, REGION_CONFIGS,
                    trigger_ai, cycles_per_run, current_time, headless
                )

            # Wait 1 minute before next check
            time.sleep(60)

        except KeyboardInterrupt:
            logger.info("Interrupted by user. Exiting...")
            break
        except Exception as e:
            logger.error(f"Error: {e}")
            time.sleep(60)


def _run_scheduled_cycles(
    supabase_url: str,
    supabase_key: str,
    region_configs: dict,
    trigger_ai: bool,
    cycles: int,
    trigger_source: str,
    headless: bool = True
):
    """
    Run scheduled monitoring cycles using Playwright.
    Called by the scheduler when a scheduled time is reached.
    """
    import httpx

    print(f"\n{'=' * 60}")
    print(f"[SCHEDULER] Starting {cycles} Playwright monitoring cycles (trigger: {trigger_source})")
    print(f"{'=' * 60}")

    # Initialize Playwright monitor
    monitor = PlaywrightMonitor(headless=headless)
    if not monitor.start():
        print("[SCHEDULER] ERROR: Failed to start browser")
        return

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
            print(f"[SCHEDULER] Loaded {len(last_known_ids)} last known IDs")
    except Exception as e:
        print(f"[SCHEDULER] Warning: Could not load initial state: {e}")

    total_new = 0
    total_blocked = 0
    total_errors = 0
    all_regions_with_new = []  # Track all regions with new articles across cycles

    try:
        for cycle_num in range(1, cycles + 1):
            print(f"\n[SCHEDULER] Cycle {cycle_num}/{cycles} at {datetime.now(KST).strftime('%H:%M:%S')}")

            # Run monitoring
            results = monitor.check_all_regions(
                configs=region_configs,
                last_known_ids=last_known_ids,
                shuffle=True,
                log_to_db=True
            )

            # Update stats
            cycle_new = 0
            cycle_blocked = 0
            cycle_errors = 0

            for result in results:
                if result.has_new and result.new_article_ids:
                    last_known_ids[result.region_code] = result.new_article_ids[0]
                    cycle_new += 1
                    # Add to collection (avoid duplicates)
                    existing = next((r for r in all_regions_with_new if r['region_code'] == result.region_code), None)
                    if existing:
                        # Merge article IDs
                        existing['article_ids'] = list(set(existing['article_ids'] + result.new_article_ids))
                    else:
                        all_regions_with_new.append({
                            'region_code': result.region_code,
                            'article_ids': result.new_article_ids
                        })
                if result.blocked:
                    cycle_blocked += 1
                if result.error and not result.blocked:
                    cycle_errors += 1

            total_new += cycle_new
            total_blocked += cycle_blocked
            total_errors += cycle_errors

            print(f"[SCHEDULER] Cycle {cycle_num} done: {cycle_new} new, {cycle_blocked} blocked, {cycle_errors} errors")

            # Small delay between cycles (30-60 seconds with random)
            if cycle_num < cycles:
                delay = random.randint(30, 60)
                time.sleep(delay)

    finally:
        monitor.stop()

    # IMPORTANT: Scraping runs independently of AI toggle
    # Scraping collects raw articles to posts table
    if all_regions_with_new:
        print(f"\n[SCHEDULER] Triggering scrapers for {len(all_regions_with_new)} regions...")
        scraper_success = 0
        for region_info in all_regions_with_new:
            if trigger_scraper(region_info['region_code'], region_info['article_ids']):
                scraper_success += 1
        print(f"[SCHEDULER] Scrapers completed: {scraper_success}/{len(all_regions_with_new)}")

        # Trigger AI processing only if enabled
        if trigger_ai:
            print("[SCHEDULER] Triggering AI processing...")
            trigger_ai_process()
        else:
            print("[SCHEDULER] AI processing disabled (--no-ai flag)")

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
                'message': f'Playwright scheduled monitoring complete: {total_new} new articles found',
                'details': {
                    'trigger': trigger_source,
                    'cycles': cycles,
                    'total_new': total_new,
                    'total_blocked': total_blocked,
                    'total_errors': total_errors,
                    'monitor_type': 'playwright'
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

    parser = argparse.ArgumentParser(description='Playwright Monitor v1.0 (Stealth Browser)')
    parser.add_argument('--daemon', action='store_true', help='Run in daemon mode (continuous loop)')
    parser.add_argument('--scheduler', action='store_true', help='Run in scheduler mode (time-based auto-start)')
    parser.add_argument('--once', action='store_true', help='Run single monitoring cycle and exit')
    parser.add_argument('--max-cycles', type=int, default=0, help='Maximum cycles before exit (0=unlimited)')
    parser.add_argument('--cycles-per-run', type=int, default=3, help='Cycles per scheduled run (default: 3)')
    parser.add_argument('--no-ai', action='store_true', help='Disable AI processing trigger')
    parser.add_argument('--visible', action='store_true', help='Run browser in visible mode (not headless)')
    parser.add_argument('--test', action='store_true', help='Run quick test with one region')

    args = parser.parse_args()
    headless = not args.visible

    if args.test:
        # Quick test with one region
        print("=" * 60)
        print("Playwright Monitor - Quick Test")
        print("=" * 60)

        test_config = {
            'naju': {
                'base_url': 'https://www.naju.go.kr',
                'list_url': 'https://www.naju.go.kr/www/administration/news/report',
            }
        }

        monitor = PlaywrightMonitor(headless=headless)

        if monitor.start():
            result = monitor.check_region('naju', test_config['naju'], None)

            print(f"\nResult:")
            print(f"  Success: {result.success}")
            print(f"  Has new: {result.has_new}")
            print(f"  Latest ID: {result.latest_id}")
            print(f"  New articles: {len(result.new_article_ids)}")
            print(f"  Response time: {result.response_time_ms}ms")
            if result.error:
                print(f"  Error: {result.error}")

            monitor.stop()
        else:
            print("Failed to start browser")

    elif args.once:
        # Run single cycle and exit
        print("=" * 60)
        print("Playwright Monitor v1.0 - Single Cycle Mode")
        print("=" * 60)

        # Import regional configs
        try:
            sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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
        print(f"[ONCE] Trigger AI: {not args.no_ai}")
        print(f"[ONCE] Headless: {headless}")
        print("=" * 60)

        # Initialize monitor
        monitor = PlaywrightMonitor(headless=headless)
        if not monitor.start():
            print("[ONCE] ERROR: Failed to start browser")
            sys.exit(1)

        # Load last known IDs
        last_known_ids = {}
        try:
            import httpx
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
            print(f"[ONCE] Loaded {len(last_known_ids)} last known IDs from DB")
        except Exception as e:
            print(f"[ONCE] Could not load state: {e}")

        # Run single cycle
        print(f"\n[ONCE] Starting cycle at {datetime.now(KST).strftime('%Y-%m-%d %H:%M:%S')}")

        try:
            results = monitor.check_all_regions(
                configs=REGION_CONFIGS,
                last_known_ids=last_known_ids,
                shuffle=True,
                log_to_db=True
            )

            # Summary and collect regions with new articles
            regions_with_new = []
            for r in results:
                if r.has_new and r.new_article_ids:
                    regions_with_new.append({
                        'region_code': r.region_code,
                        'article_ids': r.new_article_ids
                    })

            new_count = len(regions_with_new)
            blocked_count = sum(1 for r in results if r.blocked)
            error_count = sum(1 for r in results if r.error)

            print(f"\n[ONCE] Cycle complete:")
            print(f"  - New articles: {new_count} regions")
            print(f"  - Blocked: {blocked_count} regions")
            print(f"  - Errors: {error_count} regions")

            # IMPORTANT: Scraping runs independently of AI toggle
            if regions_with_new:
                print(f"\n[ONCE] Triggering scrapers for {len(regions_with_new)} regions...")
                scraper_success = 0
                for region_info in regions_with_new:
                    if trigger_scraper(region_info['region_code'], region_info['article_ids']):
                        scraper_success += 1
                print(f"[ONCE] Scrapers completed: {scraper_success}/{len(regions_with_new)}")

                # Trigger AI processing only if enabled
                if not args.no_ai:
                    print("[ONCE] Triggering AI processing...")
                    trigger_ai_process()
                else:
                    print("[ONCE] AI processing disabled (--no-ai flag)")

        finally:
            monitor.stop()

        print("\n[ONCE] Done.")
        sys.exit(0)

    elif args.scheduler:
        # Run in scheduler mode
        run_scheduler(
            trigger_ai=not args.no_ai,
            cycles_per_run=args.cycles_per_run,
            headless=headless
        )

    elif args.daemon:
        # Run in daemon mode
        run_daemon(
            trigger_ai=not args.no_ai,
            max_cycles=args.max_cycles,
            headless=headless
        )

    elif args.max_cycles > 0:
        # Run limited cycles
        run_daemon(
            trigger_ai=not args.no_ai,
            max_cycles=args.max_cycles,
            headless=headless
        )

    else:
        # Default: show help
        parser.print_help()
        print("\nExamples:")
        print("  python playwright_monitor.py --test              # Quick test")
        print("  python playwright_monitor.py --once              # Single cycle")
        print("  python playwright_monitor.py --max-cycles 3      # Run 3 cycles")
        print("  python playwright_monitor.py --scheduler         # Time-based scheduler")
        print("  python playwright_monitor.py --daemon            # Continuous daemon")
        print("  python playwright_monitor.py --visible --test    # Test with visible browser")

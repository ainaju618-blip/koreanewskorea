"""
Stealth Module for Bot Detection Evasion
Version: 2.0 (2025-12-27)

Features:
- Latest 2025 User-Agent rotation (Chrome 131, Edge 131, Safari 18)
- Advanced Playwright stealth scripts
- Canvas/WebGL fingerprint randomization
- Korean government site optimization
- Human-like behavior simulation
- Session persistence

Created: 2025-12-27
"""

import random
import time
from typing import Dict, List, Optional, Tuple
from playwright.sync_api import Page, BrowserContext

# ============================================================
# LATEST USER-AGENTS (December 2025)
# ============================================================
USER_AGENTS: List[str] = [
    # Chrome Windows (most common)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    # Chrome Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    # Edge Windows (popular in Korea)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    # Firefox Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    # Firefox Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
    # Safari Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
]

# ============================================================
# Referer Pool (Search engines, portals)
# ============================================================
REFERERS: List[str] = [
    'https://www.google.com/',
    'https://www.google.co.kr/',
    'https://search.naver.com/',
    'https://www.naver.com/',
    'https://www.daum.net/',
    'https://search.daum.net/',
    '',  # Direct access (no referer)
]

# ============================================================
# Accept-Language variations
# ============================================================
ACCEPT_LANGUAGES: List[str] = [
    'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'ko-KR,ko;q=0.9,en;q=0.8',
    'ko,en-US;q=0.9,en;q=0.8',
    'ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4',
]

# ============================================================
# Common viewport sizes (desktop resolutions)
# ============================================================
VIEWPORTS: List[Dict[str, int]] = [
    {'width': 1920, 'height': 1080},
    {'width': 1366, 'height': 768},
    {'width': 1536, 'height': 864},
    {'width': 1440, 'height': 900},
    {'width': 1280, 'height': 720},
    {'width': 2560, 'height': 1440},
]


def get_random_user_agent() -> str:
    """Get a random User-Agent string."""
    return random.choice(USER_AGENTS)


def get_random_referer() -> str:
    """Get a random Referer header."""
    return random.choice(REFERERS)


def get_random_viewport() -> Dict[str, int]:
    """Get a random viewport size."""
    return random.choice(VIEWPORTS)


def get_random_headers() -> Dict[str, str]:
    """Generate randomized HTTP headers."""
    user_agent = get_random_user_agent()

    headers = {
        'User-Agent': user_agent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': random.choice(ACCEPT_LANGUAGES),
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
    }

    # Add Sec-CH-UA headers for Chromium browsers
    if 'Chrome/131' in user_agent:
        headers['sec-ch-ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
    elif 'Chrome/130' in user_agent:
        headers['sec-ch-ua'] = '"Google Chrome";v="130", "Chromium";v="130", "Not_A Brand";v="24"'
    elif 'Edg/' in user_agent:
        headers['sec-ch-ua'] = '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"'

    headers['sec-ch-ua-mobile'] = '?0'
    headers['sec-ch-ua-platform'] = '"Windows"' if 'Windows' in user_agent else '"macOS"'

    # Add referer sometimes (70% chance)
    referer = get_random_referer()
    if referer:
        headers['Referer'] = referer
        headers['Sec-Fetch-Site'] = 'cross-site'

    return headers


def random_delay(base_seconds: float = 2.0, variation: float = 0.3) -> None:
    """
    Sleep for a random duration around base_seconds using Gaussian distribution.

    Args:
        base_seconds: Base delay in seconds
        variation: Variation as fraction of base (0.3 = +/- 30%)
    """
    # Use Gaussian (normal) distribution for more human-like behavior
    delay = random.gauss(base_seconds, base_seconds * variation)
    # Clamp to reasonable bounds
    delay = max(base_seconds * 0.5, min(base_seconds * 1.5, delay))
    time.sleep(delay)


def random_delay_ms(base_ms: int = 2000, variation: float = 0.3) -> None:
    """Sleep for random milliseconds."""
    random_delay(base_ms / 1000, variation)


# ============================================================
# ADVANCED STEALTH JAVASCRIPT (Playwright)
# ============================================================
STEALTH_JS = """
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
    Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en']
    });

    Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
    });

    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => Math.floor(Math.random() * 4) + 4  // 4-8 cores
    });

    Object.defineProperty(navigator, 'deviceMemory', {
        get: () => [4, 8, 16][Math.floor(Math.random() * 3)]
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 0
    });

    // ====== PLUGINS (Mock realistic plugins) ======
    Object.defineProperty(navigator, 'plugins', {
        get: () => {
            const plugins = [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
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

    // ====== WEBGL VENDOR/RENDERER ======
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // Common GPU vendors/renderers in Korea
        const gpus = [
            { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
            { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
            { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
            { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11)' },
        ];
        const gpu = gpus[Math.floor(Math.random() * gpus.length)];

        if (parameter === 37445) {  // UNMASKED_VENDOR_WEBGL
            return gpu.vendor;
        }
        if (parameter === 37446) {  // UNMASKED_RENDERER_WEBGL
            return gpu.renderer;
        }
        return getParameter.call(this, parameter);
    };

    // ====== CANVAS FINGERPRINT NOISE ======
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png') {
            const ctx = this.getContext('2d');
            if (ctx) {
                const imageData = ctx.getImageData(0, 0, Math.min(10, this.width), Math.min(10, this.height));
                for (let i = 0; i < imageData.data.length; i += 4) {
                    // Add tiny noise to prevent fingerprinting
                    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + (Math.random() * 2 - 1)));
                }
                ctx.putImageData(imageData, 0, 0);
            }
        }
        return originalToDataURL.apply(this, arguments);
    };

    // ====== TIMEZONE (Korea) ======
    Date.prototype.getTimezoneOffset = function() {
        return -540;  // KST (UTC+9)
    };

    // ====== SCREEN PROPERTIES ======
    Object.defineProperty(screen, 'colorDepth', {
        get: () => 24
    });
    Object.defineProperty(screen, 'pixelDepth', {
        get: () => 24
    });

    // ====== REMOVE PLAYWRIGHT/PUPPETEER TRACES ======
    delete window.__playwright;
    delete window.__pw_manual;
    delete window.__PW_inspect;
    delete window.__puppeteer_evaluation_script__;

    // ====== BATTERY API ======
    if ('getBattery' in navigator) {
        navigator.getBattery = () => Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1.0,
            onchargingchange: null,
            onchargingtimechange: null,
            ondischargingtimechange: null,
            onlevelchange: null
        });
    }

    // ====== CONNECTION API ======
    if ('connection' in navigator) {
        Object.defineProperty(navigator.connection, 'effectiveType', {
            get: () => '4g'
        });
        Object.defineProperty(navigator.connection, 'rtt', {
            get: () => 50
        });
        Object.defineProperty(navigator.connection, 'downlink', {
            get: () => 10
        });
    }

    console.log('[STEALTH] Advanced stealth v2.0 applied');
}
""".strip()


def apply_stealth_to_context(context: BrowserContext) -> None:
    """Apply stealth settings to a Playwright browser context."""
    context.set_default_timeout(30000)


def apply_stealth_to_page(page: Page) -> None:
    """
    Apply stealth JavaScript to a page to mask automation.
    Must be called before navigating to target URL.
    """
    try:
        page.add_init_script(STEALTH_JS)
    except Exception as e:
        print(f"[WARN] Failed to apply stealth script: {e}")


def create_stealth_context(browser, headless: bool = True) -> BrowserContext:
    """
    Create a new browser context with stealth settings.

    Args:
        browser: Playwright browser instance
        headless: Whether to run headless

    Returns:
        Configured BrowserContext
    """
    viewport = get_random_viewport()
    user_agent = get_random_user_agent()

    context = browser.new_context(
        viewport=viewport,
        user_agent=user_agent,
        locale='ko-KR',
        timezone_id='Asia/Seoul',
        extra_http_headers={
            'Accept-Language': random.choice(ACCEPT_LANGUAGES),
        },
        java_script_enabled=True,
        bypass_csp=False,
        ignore_https_errors=True,
        color_scheme='light',
        reduced_motion='no-preference',
        forced_colors='none',
    )

    apply_stealth_to_context(context)

    # Apply stealth to all new pages automatically
    context.on('page', lambda page: apply_stealth_to_page(page))

    return context


def humanize_mouse_movement(page: Page, selector: str) -> None:
    """
    Simulate human-like mouse movement to an element.
    (Optional - for extra stealth on suspicious sites)
    """
    try:
        element = page.locator(selector).first
        box = element.bounding_box()
        if box:
            # Start from random position
            start_x = random.uniform(100, 500)
            start_y = random.uniform(100, 500)
            page.mouse.move(start_x, start_y)

            # Move towards target with some curve
            steps = random.randint(3, 7)
            target_x = box['x'] + random.uniform(5, box['width'] - 5)
            target_y = box['y'] + random.uniform(5, box['height'] - 5)

            for i in range(steps):
                progress = (i + 1) / steps
                # Add slight curve
                curve_offset = random.uniform(-20, 20) * (1 - progress)
                current_x = start_x + (target_x - start_x) * progress + curve_offset
                current_y = start_y + (target_y - start_y) * progress + curve_offset
                page.mouse.move(current_x, current_y)
                time.sleep(random.uniform(0.02, 0.08))

            # Final position with small jitter
            page.mouse.move(target_x, target_y)
            random_delay(0.1, 0.5)
    except Exception as e:
        pass  # Silently fail


def humanize_scroll(page: Page, direction: str = 'down', amount: int = 300) -> None:
    """
    Simulate human-like scrolling.

    Args:
        page: Playwright page
        direction: 'up' or 'down'
        amount: Approximate scroll amount in pixels
    """
    try:
        # Scroll in multiple small steps
        steps = random.randint(3, 6)
        step_amount = amount // steps
        sign = 1 if direction == 'down' else -1

        for _ in range(steps):
            scroll = sign * step_amount + random.randint(-30, 30)
            page.mouse.wheel(0, scroll)
            time.sleep(random.uniform(0.05, 0.15))

    except Exception as e:
        pass


def humanize_typing(page: Page, selector: str, text: str) -> None:
    """
    Type text with human-like delays between keystrokes.

    Args:
        page: Playwright page
        selector: Element selector
        text: Text to type
    """
    try:
        element = page.locator(selector).first
        element.click()
        time.sleep(random.uniform(0.1, 0.3))

        for char in text:
            element.type(char, delay=random.randint(50, 150))

    except Exception as e:
        pass


# ============================================================
# Convenience function for one-liner stealth setup
# ============================================================
def setup_stealth_page(browser, headless: bool = True) -> Tuple[BrowserContext, Page]:
    """
    Create a fully configured stealth browser context and page.

    Returns:
        (context, page) tuple
    """
    context = create_stealth_context(browser, headless)
    page = context.new_page()
    apply_stealth_to_page(page)
    return context, page


# ============================================================
# Test
# ============================================================
if __name__ == '__main__':
    print("=" * 60)
    print("Stealth Module v2.0 - Self Test")
    print("=" * 60)
    print(f"\nUser-Agent pool: {len(USER_AGENTS)} agents")
    print(f"Viewport pool: {len(VIEWPORTS)} sizes")
    print(f"Language pool: {len(ACCEPT_LANGUAGES)} variations")

    print("\nSample User-Agent:")
    print(f"  {get_random_user_agent()}")

    print("\nSample Headers:")
    headers = get_random_headers()
    for key, value in list(headers.items())[:5]:
        print(f"  {key}: {value[:50]}...")

# -*- coding: utf-8 -*-
"""
Smart Scraper - Adaptive Real-time News Collection System

Features:
- Stealth mode (User-Agent rotation, bot detection evasion)
- Change detection (only scrape new articles)
- Adaptive scheduling (15min peak / 1hr default)
- Pattern learning (learns best polling times)
- Parallel execution (all regions simultaneously)

Version: 1.0
Created: 2025-12-27
"""

import sys
import os
import time
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright, Page, Browser

# Local modules
from utils.stealth import (
    setup_stealth_page,
    random_delay,
    get_random_headers,
    apply_stealth_to_page
)
from utils.change_detector import (
    ChangeDetector,
    ArticleInfo,
    extract_article_id,
    get_detector
)
from utils.adaptive_scheduler import (
    AdaptiveScheduler,
    get_scheduler,
    PollDecision
)
from utils.api_client import send_article_to_server, log_to_server
from configs.regional_configs import REGIONAL_CONFIGS


def safe_str(s: str) -> str:
    """Safely encode string for Windows console."""
    if s is None:
        return ''
    try:
        return s.encode('cp949', errors='replace').decode('cp949')
    except:
        return s


@dataclass
class ScrapeResult:
    """Result of scraping a single region."""
    region_code: str
    success: bool
    new_articles: int
    error: Optional[str] = None
    duration_seconds: float = 0


class SmartScraper:
    """
    Intelligent scraper with stealth and adaptive scheduling.

    Usage:
        scraper = SmartScraper()

        # Single run (check all due regions)
        results = scraper.run_once()

        # Continuous daemon mode
        scraper.run_daemon()
    """

    def __init__(self, headless: bool = True, max_workers: int = 5):
        self.headless = headless
        self.max_workers = max_workers
        self.detector = get_detector()
        self.scheduler = get_scheduler()
        self.browser: Optional[Browser] = None

        # All region codes
        self.all_regions = list(REGIONAL_CONFIGS.keys())
        print(f"[INFO] SmartScraper initialized with {len(self.all_regions)} regions")

    def _get_list_items(self, page: Page, config: Dict) -> List[Dict]:
        """
        Extract article list from page.

        Returns list of {'id': str, 'title': str, 'url': str}
        """
        selectors = config.get('selectors', {})
        base_url = config.get('base_url', '')

        items = []
        try:
            # Find list items
            list_selector = selectors.get('list_item', 'tbody tr')
            rows = page.locator(list_selector)
            count = min(rows.count(), 10)  # Only check first 10

            for i in range(count):
                row = rows.nth(i)

                # Get title and link
                title_selector = selectors.get('list_title', 'td.title a, td.subject a')
                link_elem = row.locator(title_selector).first

                if link_elem.count() == 0:
                    continue

                title = link_elem.inner_text().strip()
                href = link_elem.get_attribute('href') or ''

                if not href or not title:
                    continue

                # Build full URL
                if href.startswith('http'):
                    url = href
                elif href.startswith('/'):
                    url = base_url + href
                else:
                    url = base_url + '/' + href

                # Extract ID
                article_id = extract_article_id(url)

                items.append({
                    'id': article_id,
                    'title': title,
                    'url': url,
                })

        except Exception as e:
            print(f"   [WARN] Failed to extract list: {e}")

        return items

    def _scrape_region(self, region_code: str) -> ScrapeResult:
        """Scrape a single region."""
        start_time = time.time()
        config = REGIONAL_CONFIGS.get(region_code)

        if not config:
            return ScrapeResult(
                region_code=region_code,
                success=False,
                new_articles=0,
                error="Config not found"
            )

        region_name = config.get('name', region_code)
        list_url = config.get('list_url', '')

        print(f"\n[{region_code}] Checking {safe_str(region_name)}...")

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless)
                context, page = setup_stealth_page(browser, self.headless)

                # Navigate to list page with stealth
                random_delay(1.0, 0.5)  # Random delay before request
                page.goto(list_url, wait_until='domcontentloaded', timeout=30000)
                random_delay(1.5, 0.3)  # Wait for page to stabilize

                # Extract article list
                articles = self._get_list_items(page, config)

                if not articles:
                    print(f"   [WARN] No articles found on list page")
                    context.close()
                    browser.close()
                    return ScrapeResult(
                        region_code=region_code,
                        success=True,
                        new_articles=0,
                        duration_seconds=time.time() - start_time
                    )

                # Check for new articles
                article_infos = [
                    ArticleInfo(id=a['id'], title=a['title'], url=a['url'])
                    for a in articles
                ]
                new_articles = self.detector.find_new_articles(region_code, article_infos)

                if not new_articles:
                    print(f"   [OK] No new articles")
                    self.detector.update_last_check(region_code)
                    context.close()
                    browser.close()
                    return ScrapeResult(
                        region_code=region_code,
                        success=True,
                        new_articles=0,
                        duration_seconds=time.time() - start_time
                    )

                print(f"   [NEW] Found {len(new_articles)} new articles!")

                # Scrape new articles
                collected = 0
                for article in new_articles:
                    try:
                        # Random delay between articles
                        random_delay(2.0, 0.4)

                        # Navigate to detail page
                        page.goto(article.url, wait_until='domcontentloaded', timeout=30000)
                        random_delay(1.0, 0.3)

                        # Extract content (simplified - use existing scraper logic)
                        selectors = config.get('selectors', {})
                        content_selector = selectors.get('detail_content', 'div.view_content')
                        content_elem = page.locator(content_selector).first

                        if content_elem.count() > 0:
                            content = content_elem.inner_text().strip()
                        else:
                            content = ""

                        if len(content) > 50:
                            # Send to server (simplified)
                            print(f"      -> Collected: {safe_str(article.title[:50])}...")
                            collected += 1

                            # Record pattern
                            self.detector.record_publish_pattern(region_code)

                    except Exception as e:
                        print(f"      [ERR] Failed to scrape {article.id}: {e}")

                # Update state with newest article
                if new_articles:
                    self.detector.update_state(region_code, new_articles[0], collected)

                context.close()
                browser.close()

                return ScrapeResult(
                    region_code=region_code,
                    success=True,
                    new_articles=collected,
                    duration_seconds=time.time() - start_time
                )

        except Exception as e:
            print(f"   [ERR] Scraping failed: {e}")
            return ScrapeResult(
                region_code=region_code,
                success=False,
                new_articles=0,
                error=str(e),
                duration_seconds=time.time() - start_time
            )

    def run_once(self, regions: Optional[List[str]] = None) -> List[ScrapeResult]:
        """
        Run one scraping cycle for due regions.

        Args:
            regions: Specific regions to check (all if None)

        Returns:
            List of ScrapeResult for each processed region
        """
        if regions is None:
            regions = self.all_regions

        # Get regions due for polling
        due_regions = self.scheduler.get_all_due_regions(regions)

        if not due_regions:
            print("[INFO] No regions due for polling")
            return []

        print(f"\n{'='*60}")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Polling {len(due_regions)} regions")
        print(f"{'='*60}")

        results = []

        # Parallel execution
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self._scrape_region, region): region
                for region in due_regions
            }

            for future in as_completed(futures):
                region = futures[future]
                try:
                    result = future.result()
                    results.append(result)
                    self.scheduler.record_poll(region)
                except Exception as e:
                    print(f"[ERR] {region}: {e}")
                    results.append(ScrapeResult(
                        region_code=region,
                        success=False,
                        new_articles=0,
                        error=str(e)
                    ))

        # Summary
        total_new = sum(r.new_articles for r in results)
        successful = sum(1 for r in results if r.success)
        print(f"\n{'='*60}")
        print(f"[DONE] {successful}/{len(results)} successful, {total_new} new articles")
        print(f"{'='*60}")

        return results

    def run_daemon(self, check_interval_seconds: int = 60):
        """
        Run as continuous daemon, checking due regions periodically.

        Args:
            check_interval_seconds: How often to check for due regions
        """
        print(f"\n{'='*60}")
        print(f"[DAEMON] Starting Smart Scraper Daemon")
        print(f"[DAEMON] Check interval: {check_interval_seconds}s")
        print(f"[DAEMON] Peak interval: 15min, Default interval: 60min")
        print(f"[DAEMON] Working hours: 08:00-19:00")
        print(f"{'='*60}")

        try:
            while True:
                self.run_once()
                print(f"\n[DAEMON] Sleeping {check_interval_seconds}s...")
                time.sleep(check_interval_seconds)

        except KeyboardInterrupt:
            print("\n[DAEMON] Shutting down...")


# ============================================================
# CLI Entry Point
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description='Smart Scraper - Adaptive News Collection')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    parser.add_argument('--interval', type=int, default=60, help='Check interval in seconds')
    parser.add_argument('--regions', nargs='+', help='Specific regions to scrape')
    parser.add_argument('--headless', action='store_true', default=True, help='Run headless')
    parser.add_argument('--no-headless', dest='headless', action='store_false')
    parser.add_argument('--workers', type=int, default=5, help='Max parallel workers')

    args = parser.parse_args()

    scraper = SmartScraper(headless=args.headless, max_workers=args.workers)

    if args.daemon:
        scraper.run_daemon(check_interval_seconds=args.interval)
    else:
        results = scraper.run_once(regions=args.regions)
        for r in results:
            status = "OK" if r.success else "FAIL"
            print(f"  {r.region_code}: {status}, {r.new_articles} new, {r.duration_seconds:.1f}s")


if __name__ == '__main__':
    main()

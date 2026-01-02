# -*- coding: utf-8 -*-
"""
Smart Scraper v2 - Dual-Mode Adaptive News Collection

Two separate modes for maximum stealth:
1. MONITOR MODE: Light HTTP requests (99% of requests)
2. SCRAPE MODE: Playwright browser (1% of requests)

Features:
- Light HTTP monitoring (fast, low footprint)
- Playwright scraping only when new articles detected
- Auto block detection and cooldown
- Adaptive scheduling with pattern learning
- Telegram alerts on blocking

Version: 2.0
Created: 2025-12-27
"""

import sys
import os
import time
from datetime import datetime
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

# Load environment variables from .env.local
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright

# Local modules
from utils.light_monitor import LightMonitor, MonitorResult, get_monitor
from utils.stealth import setup_stealth_page, random_delay, apply_stealth_to_page
from utils.change_detector import ChangeDetector, ArticleInfo, get_detector
from utils.adaptive_scheduler import AdaptiveScheduler, get_scheduler
from utils.api_client import send_article_to_server, log_to_server
from utils.monitor_logger import get_logger, MonitorLogger
from configs.regional_configs import REGIONAL_CONFIGS

# Optional: Telegram notifications
try:
    from utils.telegram_notifier import send_telegram_message
    TELEGRAM_ENABLED = True
except:
    TELEGRAM_ENABLED = False


def safe_str(s: str) -> str:
    """Safely encode for Windows console."""
    if s is None:
        return ''
    try:
        return s.encode('cp949', errors='replace').decode('cp949')
    except:
        return s


@dataclass
class ScrapeResult:
    """Result of scraping articles."""
    region_code: str
    success: bool
    articles_collected: int
    error: Optional[str] = None
    duration_seconds: float = 0


class SmartScraperV2:
    """
    Dual-mode scraper: Light monitoring + Heavy scraping.

    Usage:
        scraper = SmartScraperV2()
        scraper.run_daemon()  # Runs forever
    """

    def __init__(self, headless: bool = True, max_workers: int = 3):
        self.headless = headless
        self.max_workers = max_workers

        # Components
        self.monitor = get_monitor()
        self.detector = get_detector()
        self.scheduler = get_scheduler()
        self.logger = get_logger()

        # All regions
        self.all_regions = list(REGIONAL_CONFIGS.keys())

        # Stats
        self.stats = {
            'monitor_requests': 0,
            'scrape_requests': 0,
            'articles_collected': 0,
            'blocks_detected': 0,
        }

        print(f"[INIT] SmartScraperV2 with {len(self.all_regions)} regions")
        print(f"[INIT] Mode: Monitor=HTTP, Scrape=Playwright")

    def _get_last_known_ids(self) -> Dict[str, str]:
        """Get last known article IDs for all regions."""
        ids = {}
        for region in self.all_regions:
            last_id = self.detector.get_last_article_id(region)
            if last_id:
                ids[region] = last_id
        return ids

    def _monitor_all(self) -> Dict[str, MonitorResult]:
        """
        MONITOR MODE: Check all regions with light HTTP requests.
        """
        print(f"\n[MONITOR] Checking {len(self.all_regions)} regions with HTTP...")
        start = time.time()

        # Log cycle start
        due_regions = [r for r in self.all_regions if self.scheduler.should_poll(r).should_poll]
        self.logger.monitor_cycle_start(len(due_regions))

        # Get last known IDs
        last_ids = self._get_last_known_ids()

        # Check all regions
        results = {}
        for region_code in self.all_regions:
            # Check scheduler
            decision = self.scheduler.should_poll(region_code)
            if not decision.should_poll:
                continue

            config = REGIONAL_CONFIGS.get(region_code, {})
            last_id = last_ids.get(region_code)

            # Log checking
            self.logger.checking_region(region_code)

            # Apply interval multiplier if previously blocked
            multiplier = self.monitor.get_interval_multiplier(region_code)
            if multiplier > 1:
                time.sleep(0.5 * multiplier)

            result = self.monitor.check_region(region_code, config, last_id)
            results[region_code] = result
            self.stats['monitor_requests'] += 1

            # Record poll
            self.scheduler.record_poll(region_code)

            # Log results
            if result.has_new:
                self.logger.new_article_detected(
                    region_code,
                    "New articles found",
                    len(result.new_article_ids)
                )
            elif result.blocked:
                self.stats['blocks_detected'] += 1
                block_stat = self.monitor.block_status.get(region_code)
                consecutive = block_stat.consecutive_blocks if block_stat else 1
                # Match light_monitor.py calculation: 2^(n-1) = 1h, 2h, 4h, 8h, max 24h
                cooldown_hours = min(24, 2 ** (consecutive - 1))
                self.logger.block_detected(region_code, cooldown_hours)
                self._notify_block(region_code, result.error)

            # Small delay between regions
            time.sleep(0.1)

        elapsed = time.time() - start
        new_count = sum(1 for r in results.values() if r.has_new)

        # Log cycle complete
        self.logger.monitor_cycle_complete(len(results), new_count, elapsed)

        print(f"[MONITOR] Done in {elapsed:.1f}s. {new_count} regions have new articles.")

        return results

    def _scrape_new_articles(self, region_code: str, article_urls: List[str]) -> ScrapeResult:
        """
        SCRAPE MODE: Use Playwright to scrape specific articles.
        """
        if not article_urls:
            return ScrapeResult(region_code=region_code, success=True, articles_collected=0)

        start = time.time()
        config = REGIONAL_CONFIGS.get(region_code, {})
        region_name = config.get('name', region_code)
        base_url = config.get('base_url', '')

        print(f"\n[SCRAPE] {safe_str(region_name)}: {len(article_urls)} articles")

        collected = 0

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless)
                context, page = setup_stealth_page(browser, self.headless)

                for url in article_urls:
                    try:
                        # Log scraping start
                        self.logger.scraping_started(region_code, f"Article from {region_name}")

                        # Human-like delay
                        random_delay(2.0, 0.5)

                        # Navigate
                        page.goto(url, wait_until='domcontentloaded', timeout=30000)
                        random_delay(1.5, 0.3)

                        # Extract content
                        selectors = config.get('selectors', {})

                        # Title
                        title = ""
                        title_sel = selectors.get('detail_title', 'h4, h3, h2')
                        try:
                            title_elem = page.locator(title_sel).first
                            if title_elem.count() > 0:
                                title = title_elem.inner_text().strip()
                        except:
                            pass

                        # Content
                        content = ""
                        content_sel = selectors.get('detail_content', 'div.view_content, div.board_content')
                        try:
                            content_elem = page.locator(content_sel).first
                            if content_elem.count() > 0:
                                content = content_elem.inner_text().strip()
                        except:
                            pass

                        # Image
                        thumbnail = None
                        try:
                            img_sel = selectors.get('detail_image', 'div.view_content img')
                            img_elem = page.locator(img_sel).first
                            if img_elem.count() > 0:
                                src = img_elem.get_attribute('src')
                                if src:
                                    if src.startswith('/'):
                                        thumbnail = base_url + src
                                    elif src.startswith('http'):
                                        thumbnail = src
                        except:
                            pass

                        # Validate and save
                        if title and len(content) > 50:
                            # Log scrape complete
                            self.logger.scraping_completed(region_code, title)

                            # Log AI processing
                            self.logger.ai_processing_started(region_code, title)

                            # Send to API for AI processing and storage
                            article_data = {
                                'title': title,
                                'original_link': url,
                                'content': content,
                                'source': region_name,
                                'category': config.get('category', '전남'),
                                'thumbnail_url': thumbnail,
                            }

                            result = send_article_to_server(article_data)

                            if result['success']:
                                self.logger.ai_processing_completed(region_code, title)

                                if result['status'] == 'created':
                                    article_id = result.get('article_id', hash(url) % 100000)
                                    self.logger.article_published(region_code, title, article_id)
                                    collected += 1
                                    self.stats['articles_collected'] += 1
                                    print(f"   [OK] {safe_str(title[:50])}...")

                                    # Record pattern for learning
                                    self.detector.record_publish_pattern(region_code)
                                elif result['status'] == 'exists':
                                    print(f"   [SKIP] Already exists: {safe_str(title[:40])}...")
                            else:
                                self.logger.ai_processing_failed(region_code, result.get('message', 'API error'))
                        else:
                            self.logger.scraping_failed(region_code, "Content too short or no title")

                    except Exception as e:
                        self.logger.scraping_failed(region_code, str(e))
                        print(f"   [ERR] {url}: {e}")

                context.close()
                browser.close()

            # Update detector state
            if collected > 0 and article_urls:
                from utils.change_detector import extract_article_id
                first_url = article_urls[0]
                self.detector.update_state(
                    region_code,
                    ArticleInfo(
                        id=extract_article_id(first_url),
                        title="",
                        url=first_url
                    ),
                    collected
                )

            self.stats['scrape_requests'] += len(article_urls)

            return ScrapeResult(
                region_code=region_code,
                success=True,
                articles_collected=collected,
                duration_seconds=time.time() - start
            )

        except Exception as e:
            self.logger.error(f"Scrape failed: {str(e)}", region_code)
            return ScrapeResult(
                region_code=region_code,
                success=False,
                articles_collected=0,
                error=str(e),
                duration_seconds=time.time() - start
            )

    def _notify_block(self, region_code: str, error: str) -> None:
        """Send notification when blocked."""
        message = f"[BLOCK] {region_code}: {error}"
        print(message)

        if TELEGRAM_ENABLED:
            try:
                send_telegram_message(message)
            except:
                pass

    def run_once(self) -> Dict:
        """
        Run one cycle:
        1. Monitor all regions (HTTP)
        2. Scrape new articles (Playwright)
        """
        print(f"\n{'='*60}")
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting cycle")
        print(f"{'='*60}")

        # Phase 1: Monitor
        monitor_results = self._monitor_all()

        # Phase 2: Scrape regions with new articles
        regions_to_scrape = {
            region: result.new_article_urls
            for region, result in monitor_results.items()
            if result.has_new and result.new_article_urls
        }

        scrape_results = []
        if regions_to_scrape:
            print(f"\n[SCRAPE] {len(regions_to_scrape)} regions need scraping")

            # Parallel scraping (but limited)
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                futures = {
                    executor.submit(self._scrape_new_articles, region, urls): region
                    for region, urls in regions_to_scrape.items()
                }

                for future in as_completed(futures):
                    try:
                        result = future.result()
                        scrape_results.append(result)
                    except Exception as e:
                        region = futures[future]
                        print(f"   [ERR] Thread failed for {region}: {e}")
                        self.logger.error(f"Thread failed: {str(e)}", region)

        # Summary
        total_new = sum(r.articles_collected for r in scrape_results)
        print(f"\n{'='*60}")
        print(f"[DONE] Collected {total_new} new articles")
        print(f"[STATS] Monitor: {self.stats['monitor_requests']}, "
              f"Scrape: {self.stats['scrape_requests']}, "
              f"Blocks: {self.stats['blocks_detected']}")
        print(f"{'='*60}")

        return {
            'monitor_results': monitor_results,
            'scrape_results': scrape_results,
            'total_new': total_new,
        }

    def run_daemon(self, check_interval: int = 60):
        """
        Run continuously, checking DB is_running flag.

        Args:
            check_interval: Seconds between monitor cycles
        """
        print(f"\n{'='*60}")
        print(f"[DAEMON] Smart Scraper v2 Starting")
        print(f"[DAEMON] Monitor: HTTP (scheduled intervals)")
        print(f"[DAEMON] Scrape: Playwright (on new articles)")
        print(f"[DAEMON] Schedule: 09-18: 30min | 18-23: 2hr | 23-07: OFF | 07-09: 1hr")
        print(f"[DAEMON] Checking DB is_running flag...")
        print(f"{'='*60}")

        was_running = False
        last_check_time = None

        try:
            while True:
                # Check if monitor should be running
                is_running = self.logger.is_monitor_running()

                # Check for force check (immediate check request from admin)
                force_check = self.logger.check_force_check() if is_running else False

                if is_running and not was_running:
                    # Just started
                    print(f"\n[DAEMON] Monitor STARTED by admin")
                    self.logger.monitor_started(len(self.all_regions))
                    was_running = True
                    last_check_time = None  # Force immediate check on start

                elif not is_running and was_running:
                    # Just stopped
                    print(f"\n[DAEMON] Monitor STOPPED by admin")
                    self.logger.monitor_stopped()
                    was_running = False

                if is_running:
                    # Determine if we should run a check
                    should_check = force_check

                    if not should_check and last_check_time:
                        # Check based on scheduled interval
                        from utils.adaptive_scheduler import _get_current_schedule
                        interval, reason = _get_current_schedule(datetime.now().hour)

                        if interval == 0:
                            # Night hours - no monitoring
                            print(f"\r[DAEMON] {reason} - sleeping...", end='', flush=True)
                            time.sleep(60)  # Check again in 1 minute
                            continue

                        elapsed = (datetime.now() - last_check_time).total_seconds() / 60
                        if elapsed >= interval:
                            should_check = True
                    elif not last_check_time:
                        # First check after start
                        should_check = True

                    if should_check:
                        # Run monitoring cycle
                        if force_check:
                            print(f"\n[DAEMON] === IMMEDIATE CHECK (admin request) ===")
                        result = self.run_once()
                        last_check_time = datetime.now()

                        # Update stats in DB
                        self.logger.update_monitor_stats(
                            self.stats['monitor_requests'],
                            self.stats['articles_collected'],
                            self.stats['articles_collected']
                        )

                        # Calculate next check time
                        from utils.adaptive_scheduler import _get_current_schedule
                        interval, reason = _get_current_schedule(datetime.now().hour)
                        print(f"\n[DAEMON] {reason} - next check in {interval} minutes...")
                    else:
                        # Still waiting
                        time.sleep(5)
                else:
                    # Not running, just wait
                    if not was_running:
                        print(f"\r[DAEMON] Waiting for start signal...", end='', flush=True)
                    time.sleep(5)

        except KeyboardInterrupt:
            print("\n[DAEMON] Shutting down...")
            if was_running:
                self.logger.monitor_stopped()
            self.monitor.close()


# ============================================================
# CLI
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description='Smart Scraper v2')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    parser.add_argument('--interval', type=int, default=60, help='Check interval (seconds)')
    parser.add_argument('--headless', action='store_true', default=True)
    parser.add_argument('--no-headless', dest='headless', action='store_false')
    parser.add_argument('--workers', type=int, default=3, help='Max parallel scrapers')

    args = parser.parse_args()

    scraper = SmartScraperV2(headless=args.headless, max_workers=args.workers)

    if args.daemon:
        scraper.run_daemon(check_interval=args.interval)
    else:
        scraper.run_once()


if __name__ == '__main__':
    main()

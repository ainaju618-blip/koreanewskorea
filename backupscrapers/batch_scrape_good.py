# -*- coding: utf-8 -*-
"""
Batch Scraper for Well-Performing Regions (50+ articles)
Target: 100 articles per region

Regions: suncheon, gangjin, jeonnam, muan, naju, mokpo
(yeosu already has 125, skip)

Usage:
    python scrapers/batch_scrape_good.py
    python scrapers/batch_scrape_good.py --dry-run
"""

import sys
import os
import subprocess
import time
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Target regions (50+ articles, need ~40-50 more each)
BATCH_REGIONS = {
    'suncheon': {'current': 67, 'target': 100, 'need': 33},
    'gangjin': {'current': 64, 'target': 100, 'need': 36},
    'jeonnam': {'current': 63, 'target': 100, 'need': 37},
    'muan': {'current': 56, 'target': 100, 'need': 44},
    'naju': {'current': 56, 'target': 100, 'need': 44},
    'mokpo': {'current': 53, 'target': 100, 'need': 47},
}

def safe_print(msg: str):
    """Safe print for Windows console."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('cp949', errors='replace').decode('cp949'))

def run_scraper(region: str, max_articles: int = 50) -> bool:
    """Run individual region scraper."""
    scraper_path = os.path.join(
        os.path.dirname(__file__),
        region,
        f'{region}_scraper.py'
    )

    if not os.path.exists(scraper_path):
        safe_print(f"[ERROR] Scraper not found: {scraper_path}")
        return False

    safe_print(f"\n{'='*60}")
    safe_print(f"[START] {region.upper()} - Target: {max_articles} articles")
    safe_print(f"{'='*60}")

    start_time = time.time()

    try:
        result = subprocess.run(
            [sys.executable, scraper_path, '--max-articles', str(max_articles)],
            capture_output=False,
            text=True,
            timeout=600  # 10 min timeout per region
        )

        duration = time.time() - start_time

        if result.returncode == 0:
            safe_print(f"[SUCCESS] {region} completed in {duration:.1f}s")
            return True
        else:
            safe_print(f"[FAILED] {region} - exit code: {result.returncode}")
            return False

    except subprocess.TimeoutExpired:
        safe_print(f"[TIMEOUT] {region} - exceeded 10 minutes")
        return False
    except Exception as e:
        safe_print(f"[ERROR] {region} - {str(e)}")
        return False

def main(dry_run: bool = False):
    """Run batch scraping for good regions."""
    safe_print("=" * 60)
    safe_print(" BATCH SCRAPER - Well-Performing Regions")
    safe_print(f" Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    safe_print("=" * 60)

    safe_print("\n[TARGETS]")
    for region, info in BATCH_REGIONS.items():
        safe_print(f"  {region}: {info['current']} -> {info['target']} (+{info['need']})")

    if dry_run:
        safe_print("\n[DRY-RUN MODE] No actual scraping will be performed.")
        return

    results = {}
    total_start = time.time()

    for region, info in BATCH_REGIONS.items():
        # Request slightly more than needed (buffer for duplicates)
        max_articles = info['need'] + 10
        success = run_scraper(region, max_articles)
        results[region] = success

        # Small delay between regions
        time.sleep(5)

    # Summary
    total_duration = time.time() - total_start

    safe_print("\n" + "=" * 60)
    safe_print(" BATCH SCRAPING COMPLETE")
    safe_print("=" * 60)
    safe_print(f"\nTotal Duration: {total_duration/60:.1f} minutes")
    safe_print("\n[RESULTS]")

    success_count = 0
    for region, success in results.items():
        status = "OK" if success else "FAILED"
        safe_print(f"  {region}: {status}")
        if success:
            success_count += 1

    safe_print(f"\nSuccess Rate: {success_count}/{len(results)}")

if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    main(dry_run=dry_run)

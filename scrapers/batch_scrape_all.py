# -*- coding: utf-8 -*-
"""
Batch Scraper for ALL Regions - Parallel Execution
===================================================
Collects articles from all regions in parallel (3 at a time).
Prioritizes low-performing regions first.

Usage:
    python scrapers/batch_scrape_all.py
    python scrapers/batch_scrape_all.py --dry-run
    python scrapers/batch_scrape_all.py --low-only   # Only low-performing regions
    python scrapers/batch_scrape_all.py --yes        # Skip confirmation prompt
    python scrapers/batch_scrape_all.py --workers 5  # Set parallel workers (default: 3)
"""

import sys
import os
import subprocess
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Thread-safe print lock
print_lock = threading.Lock()

# All regions with current article counts (from recent query)
# TEMP: Increased targets for bulk scraping
ALL_REGIONS = {
    # LOW (priority 1) - Need more articles urgently
    'boseong': {'current': 7, 'priority': 1, 'target': 30},
    'yeonggwang': {'current': 7, 'priority': 1, 'target': 30},
    'shinan': {'current': 8, 'priority': 1, 'target': 30},
    'jindo': {'current': 15, 'priority': 1, 'target': 25},
    'jangheung': {'current': 15, 'priority': 1, 'target': 25},
    'wando': {'current': 17, 'priority': 1, 'target': 25},
    'haenam': {'current': 19, 'priority': 1, 'target': 25},
    'damyang': {'current': 22, 'priority': 1, 'target': 20},

    # MEDIUM (priority 2) - Could use more
    'gwangju_edu': {'current': 27, 'priority': 2, 'target': 20},
    'jeonnam_edu': {'current': 31, 'priority': 2, 'target': 20},
    'hwasun': {'current': 32, 'priority': 2, 'target': 20},
    'gwangyang': {'current': 33, 'priority': 2, 'target': 20},
    'gwangju': {'current': 35, 'priority': 2, 'target': 20},
    'gokseong': {'current': 40, 'priority': 2, 'target': 15},
    'jangseong': {'current': 42, 'priority': 2, 'target': 15},
    'goheung': {'current': 44, 'priority': 2, 'target': 15},
    'yeongam': {'current': 44, 'priority': 2, 'target': 15},
    'hampyeong': {'current': 46, 'priority': 2, 'target': 15},

    # HIGH (priority 3) - Already good, just a few more
    'mokpo': {'current': 53, 'priority': 3, 'target': 10},
    'naju': {'current': 56, 'priority': 3, 'target': 10},
    'muan': {'current': 56, 'priority': 3, 'target': 10},
    'jeonnam': {'current': 63, 'priority': 3, 'target': 10},
    'gangjin': {'current': 64, 'priority': 3, 'target': 10},
    'suncheon': {'current': 67, 'priority': 3, 'target': 10},

    # SKIP - Already plenty
    # 'yeosu': {'current': 125, 'priority': 4, 'target': 0},  # Skip
}

def safe_print(msg: str):
    """Thread-safe print for Windows console with flush."""
    with print_lock:
        try:
            print(msg, flush=True)
        except UnicodeEncodeError:
            print(msg.encode('cp949', errors='replace').decode('cp949'), flush=True)

def run_scraper(region: str, max_articles: int = 10) -> tuple:
    """
    Run individual region scraper.
    Returns: (region, success: bool, collected: int, duration: float)
    """
    scraper_path = os.path.join(
        os.path.dirname(__file__),
        region,
        f'{region}_scraper.py'
    )

    if not os.path.exists(scraper_path):
        safe_print(f"  [SKIP] {region}: Scraper not found")
        return region, False, 0, 0

    safe_print(f"  [START] {region}: Collecting {max_articles} articles...")

    start_time = time.time()

    try:
        result = subprocess.run(
            [sys.executable, scraper_path, '--max-articles', str(max_articles), '--days', '30'],
            capture_output=True,
            text=True,
            timeout=300,  # 5 min timeout per region
            encoding='utf-8',
            errors='replace'
        )

        duration = time.time() - start_time

        # Parse output to find collected count
        output = result.stdout + result.stderr
        collected = 0

        # Look for success messages in output
        import re
        # Try multiple patterns
        patterns = [
            r'(\d+)\s*(articles?|건)',
            r'Saved:\s*(\d+)',
            r'Total:\s*(\d+)',
            r'collected:\s*(\d+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                collected = int(match.group(1))
                break

        if result.returncode == 0:
            safe_print(f"  [OK] {region}: {collected} articles in {duration:.0f}s")
            return region, True, collected, duration
        else:
            safe_print(f"  [WARN] {region}: exit code {result.returncode} ({duration:.0f}s)")
            return region, False, 0, duration

    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        safe_print(f"  [TIMEOUT] {region}: after {duration:.0f}s")
        return region, False, 0, duration
    except Exception as e:
        duration = time.time() - start_time
        safe_print(f"  [ERROR] {region}: {str(e)[:50]}")
        return region, False, 0, duration

def main(dry_run: bool = False, low_only: bool = False, auto_confirm: bool = False, max_workers: int = 3):
    """Run batch scraping for all regions in parallel."""
    safe_print("=" * 60)
    safe_print(" BATCH SCRAPER - Parallel Execution")
    safe_print(f" Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    safe_print(f" Workers: {max_workers} concurrent scrapers")
    safe_print("=" * 60)

    # Filter regions by priority if low_only
    if low_only:
        regions = {k: v for k, v in ALL_REGIONS.items() if v['priority'] == 1}
        safe_print("\n[MODE] Low-performing regions only")
    else:
        regions = ALL_REGIONS

    # Sort by priority (low-performing first)
    sorted_regions = sorted(regions.items(), key=lambda x: x[1]['priority'])

    # Calculate totals
    total_target = sum(info['target'] for _, info in sorted_regions)
    safe_print(f"\n[PLAN] {len(sorted_regions)} regions, ~{total_target} articles target")

    safe_print("\n[PRIORITY 1 - LOW] Need urgent collection:")
    for region, info in sorted_regions:
        if info['priority'] == 1:
            safe_print(f"  {region}: {info['current']} -> +{info['target']}")

    safe_print("\n[PRIORITY 2 - MEDIUM]:")
    for region, info in sorted_regions:
        if info['priority'] == 2:
            safe_print(f"  {region}: {info['current']} -> +{info['target']}")

    safe_print("\n[PRIORITY 3 - HIGH] Already good:")
    for region, info in sorted_regions:
        if info['priority'] == 3:
            safe_print(f"  {region}: {info['current']} -> +{info['target']}")

    if dry_run:
        safe_print("\n[DRY-RUN] No actual scraping. Remove --dry-run to execute.")
        return

    if not auto_confirm:
        input_confirm = input("\nProceed with scraping? (y/N): ")
        if input_confirm.lower() != 'y':
            safe_print("[CANCELLED]")
            return
    else:
        safe_print("\n[AUTO-CONFIRM] Starting parallel scraping...")

    results = {}
    total_collected = 0
    total_start = time.time()

    # Run scrapers in parallel
    safe_print(f"\n[RUNNING] {len(sorted_regions)} scrapers with {max_workers} workers...\n")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        futures = {
            executor.submit(run_scraper, region, info['target']): region
            for region, info in sorted_regions
        }

        # Process as they complete
        for future in as_completed(futures):
            region = futures[future]
            try:
                region, success, collected, duration = future.result()
                results[region] = {'success': success, 'collected': collected, 'duration': duration}
                total_collected += collected
            except Exception as e:
                safe_print(f"  [EXCEPTION] {region}: {e}")
                results[region] = {'success': False, 'collected': 0, 'duration': 0}

    # Summary
    total_duration = time.time() - total_start

    safe_print("\n" + "=" * 60)
    safe_print(" BATCH COMPLETE")
    safe_print("=" * 60)
    safe_print(f"\nTotal Duration: {total_duration/60:.1f} minutes")
    safe_print(f"Total Collected: ~{total_collected} articles")

    safe_print("\n[RESULTS BY PRIORITY]")

    for priority in [1, 2, 3]:
        priority_results = [(r, v) for r, v in results.items()
                           if ALL_REGIONS[r]['priority'] == priority]
        if priority_results:
            label = {1: 'LOW', 2: 'MEDIUM', 3: 'HIGH'}[priority]
            safe_print(f"\n  [{label}]")
            for region, data in priority_results:
                status = "OK" if data['success'] else "FAIL"
                count = data.get('collected', 0)
                safe_print(f"    {region}: {status} ({count} articles)")

    success_count = sum(1 for v in results.values() if v['success'])
    safe_print(f"\nSuccess Rate: {success_count}/{len(results)}")

if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    low_only = '--low-only' in sys.argv
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv

    # Parse workers count
    max_workers = 3
    for i, arg in enumerate(sys.argv):
        if arg == '--workers' and i + 1 < len(sys.argv):
            try:
                max_workers = int(sys.argv[i + 1])
            except ValueError:
                pass

    main(dry_run=dry_run, low_only=low_only, auto_confirm=auto_confirm, max_workers=max_workers)

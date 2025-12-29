# -*- coding: utf-8 -*-
"""
Manual Scraper Check - Low-Performing Regions
Regions with < 50 articles (need manual verification before bulk scraping)

Usage:
    python scrapers/manual_scrape_check.py                    # Show all regions
    python scrapers/manual_scrape_check.py --region boseong   # Check specific region
    python scrapers/manual_scrape_check.py --run boseong 100  # Run scraper for region
"""

import sys
import os
import subprocess
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Manual verification regions (priority order: most urgent first)
MANUAL_REGIONS = {
    # Critical (< 15 articles)
    'boseong': {'current': 7, 'target': 100, 'need': 93, 'priority': 'CRITICAL'},
    'yeonggwang': {'current': 7, 'target': 100, 'need': 93, 'priority': 'CRITICAL'},
    'shinan': {'current': 8, 'target': 100, 'need': 92, 'priority': 'CRITICAL'},
    'jangheung': {'current': 15, 'target': 100, 'need': 85, 'priority': 'CRITICAL'},
    'jindo': {'current': 15, 'target': 100, 'need': 85, 'priority': 'CRITICAL'},
    'wando': {'current': 17, 'target': 100, 'need': 83, 'priority': 'CRITICAL'},
    'haenam': {'current': 19, 'target': 100, 'need': 81, 'priority': 'CRITICAL'},
    'damyang': {'current': 22, 'target': 100, 'need': 78, 'priority': 'CRITICAL'},
    'gwangju_edu': {'current': 27, 'target': 100, 'need': 73, 'priority': 'CRITICAL'},

    # Medium (30-50 articles)
    'hwasun': {'current': 32, 'target': 100, 'need': 68, 'priority': 'MEDIUM'},
    'gwangyang': {'current': 33, 'target': 100, 'need': 67, 'priority': 'MEDIUM'},
    'gwangju': {'current': 35, 'target': 100, 'need': 65, 'priority': 'MEDIUM'},
    'gokseong': {'current': 40, 'target': 100, 'need': 60, 'priority': 'MEDIUM'},
    'jangseong': {'current': 42, 'target': 100, 'need': 58, 'priority': 'MEDIUM'},
    'goheung': {'current': 44, 'target': 100, 'need': 56, 'priority': 'MEDIUM'},
    'yeongam': {'current': 44, 'target': 100, 'need': 56, 'priority': 'MEDIUM'},
    'hampyeong': {'current': 46, 'target': 100, 'need': 54, 'priority': 'MEDIUM'},
}

def safe_print(msg: str):
    """Safe print for Windows console."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('cp949', errors='replace').decode('cp949'))

def show_status():
    """Show all manual regions status."""
    safe_print("=" * 70)
    safe_print(" MANUAL CHECK REGIONS - Status Overview")
    safe_print(f" Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    safe_print("=" * 70)

    safe_print("\n[CRITICAL - Need 70+ articles]")
    safe_print("-" * 50)
    for region, info in MANUAL_REGIONS.items():
        if info['priority'] == 'CRITICAL':
            safe_print(f"  {region:15} | Current: {info['current']:3} | Need: +{info['need']:2}")

    safe_print("\n[MEDIUM - Need 50-70 articles]")
    safe_print("-" * 50)
    for region, info in MANUAL_REGIONS.items():
        if info['priority'] == 'MEDIUM':
            safe_print(f"  {region:15} | Current: {info['current']:3} | Need: +{info['need']:2}")

    safe_print("\n[COMMANDS]")
    safe_print("-" * 50)
    safe_print("  Check scraper:  python manual_scrape_check.py --region <name>")
    safe_print("  Run scraper:    python manual_scrape_check.py --run <name> <count>")
    safe_print("  Test (1 article): python manual_scrape_check.py --test <name>")

def check_region(region: str):
    """Check if scraper exists and show info."""
    scraper_path = os.path.join(
        os.path.dirname(__file__),
        region,
        f'{region}_scraper.py'
    )

    safe_print(f"\n[CHECK] Region: {region}")
    safe_print("-" * 40)

    if os.path.exists(scraper_path):
        safe_print(f"  Scraper: FOUND")
        safe_print(f"  Path: {scraper_path}")

        if region in MANUAL_REGIONS:
            info = MANUAL_REGIONS[region]
            safe_print(f"  Current: {info['current']} articles")
            safe_print(f"  Target:  {info['target']} articles")
            safe_print(f"  Need:    +{info['need']} articles")
            safe_print(f"  Priority: {info['priority']}")

        safe_print(f"\n  To test: python {scraper_path} --max-articles 1")
        safe_print(f"  To run:  python {scraper_path} --max-articles {info['need'] + 10}")
    else:
        safe_print(f"  Scraper: NOT FOUND")
        safe_print(f"  Expected: {scraper_path}")

def test_region(region: str):
    """Test scraper with 1 article."""
    scraper_path = os.path.join(
        os.path.dirname(__file__),
        region,
        f'{region}_scraper.py'
    )

    if not os.path.exists(scraper_path):
        safe_print(f"[ERROR] Scraper not found: {scraper_path}")
        return False

    safe_print(f"\n[TEST] Running {region} scraper with 1 article...")
    safe_print("-" * 50)

    try:
        result = subprocess.run(
            [sys.executable, scraper_path, '--max-articles', '1'],
            timeout=120
        )
        return result.returncode == 0
    except Exception as e:
        safe_print(f"[ERROR] {e}")
        return False

def run_region(region: str, count: int):
    """Run scraper for specific region."""
    scraper_path = os.path.join(
        os.path.dirname(__file__),
        region,
        f'{region}_scraper.py'
    )

    if not os.path.exists(scraper_path):
        safe_print(f"[ERROR] Scraper not found: {scraper_path}")
        return False

    safe_print(f"\n[RUN] {region} - Target: {count} articles")
    safe_print("=" * 50)

    try:
        result = subprocess.run(
            [sys.executable, scraper_path, '--max-articles', str(count)],
            timeout=600
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        safe_print(f"[TIMEOUT] Exceeded 10 minutes")
        return False
    except Exception as e:
        safe_print(f"[ERROR] {e}")
        return False

def main():
    args = sys.argv[1:]

    if not args:
        show_status()
        return

    if args[0] == '--region' and len(args) >= 2:
        check_region(args[1])
    elif args[0] == '--test' and len(args) >= 2:
        test_region(args[1])
    elif args[0] == '--run' and len(args) >= 3:
        run_region(args[1], int(args[2]))
    else:
        safe_print("Usage:")
        safe_print("  python manual_scrape_check.py                    # Show status")
        safe_print("  python manual_scrape_check.py --region <name>    # Check region")
        safe_print("  python manual_scrape_check.py --test <name>      # Test (1 article)")
        safe_print("  python manual_scrape_check.py --run <name> <N>   # Run for N articles")

if __name__ == '__main__':
    main()

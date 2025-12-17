# -*- coding: utf-8 -*-
"""
Scraper Import Test
All scrapers should import successfully without errors.
"""

import sys
import os

# Add scrapers directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

REGIONS = [
    'gwangju', 'jeonnam', 'naju', 'mokpo', 'yeosu', 'suncheon', 'gwangyang',
    'damyang', 'gokseong', 'gurye', 'goheung', 'boseong', 'hwasun', 'jangheung',
    'gangjin', 'haenam', 'yeongam', 'muan', 'hampyeong', 'yeonggwang',
    'jangseong', 'wando', 'jindo', 'shinan', 'gwangju_edu', 'jeonnam_edu'
]

def test_imports():
    success = []
    failed = []

    for region in REGIONS:
        module_name = f"{region}.{region}_scraper"
        try:
            __import__(module_name)
            success.append(region)
            print(f"[OK] {region}")
        except Exception as e:
            failed.append((region, str(e)))
            print(f"[FAIL] {region}: {e}")

    print("\n" + "=" * 50)
    print(f"SUCCESS: {len(success)}/{len(REGIONS)}")
    print(f"FAILED: {len(failed)}/{len(REGIONS)}")

    if failed:
        print("\n=== FAILED DETAILS ===")
        for region, error in failed:
            print(f"  {region}: {error[:100]}")

    return len(failed) == 0

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)

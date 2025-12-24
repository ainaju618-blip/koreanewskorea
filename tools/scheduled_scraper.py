"""
Scheduled Scraper Runner
- Called by Windows Task Scheduler
- Runs all regions in parallel (headless mode)
- Logs results to Supabase

Usage: python tools/scheduled_scraper.py
"""

import os
import sys
import subprocess
import concurrent.futures
from datetime import datetime
from typing import List, Dict, Any

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'scrapers'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

# Supabase
from supabase import create_client

# All regions
ALL_REGIONS = [
    'gwangju', 'jeonnam', 'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang',
    'damyang', 'gokseong', 'gurye', 'goheung', 'boseong', 'hwasun', 'jangheung',
    'gangjin', 'haenam', 'yeongam', 'muan', 'hampyeong', 'yeonggwang',
    'jangseong', 'wando', 'jindo', 'shinan', 'gwangju_edu', 'jeonnam_edu'
]

# Max parallel workers
MAX_WORKERS = 5


def get_supabase():
    """Get Supabase client"""
    url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if url and key:
        return create_client(url, key)
    return None


def create_bot_log(supabase, region: str) -> int:
    """Create bot log entry"""
    try:
        result = supabase.table('bot_logs').insert({
            'region': region,
            'status': 'running',
            'log_message': 'Starting scraper...',
            'created_at': datetime.now().isoformat()
        }).execute()
        return result.data[0]['id']
    except Exception as e:
        print(f"[ERROR] Failed to create log for {region}: {e}")
        return None


def update_bot_log(supabase, log_id: int, status: str, message: str, articles: int = 0):
    """Update bot log entry"""
    try:
        supabase.table('bot_logs').update({
            'status': status,
            'log_message': message,
            'articles_processed': articles,
            'completed_at': datetime.now().isoformat()
        }).eq('id', log_id).execute()
    except Exception as e:
        print(f"[ERROR] Failed to update log {log_id}: {e}")


def run_scraper(region: str, start_date: str, end_date: str) -> Dict[str, Any]:
    """Run a single scraper"""
    script_path = os.path.join(PROJECT_ROOT, 'scrapers', region, f'{region}_scraper.py')

    if not os.path.exists(script_path):
        return {
            'region': region,
            'success': False,
            'error': 'Script not found',
            'articles': 0
        }

    try:
        # Set headless mode
        env = os.environ.copy()
        env['PLAYWRIGHT_HEADLESS'] = '1'

        # Run scraper
        cmd = [sys.executable, script_path, '--start', start_date, '--end', end_date]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,  # 10 minute timeout per region
            cwd=os.path.join(PROJECT_ROOT, 'scrapers'),
            env=env
        )

        # Parse output for article count
        articles = 0
        for line in result.stdout.split('\n'):
            if 'articles' in line.lower() or 'processed' in line.lower():
                # Try to extract number
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    articles = max(int(n) for n in numbers)

        return {
            'region': region,
            'success': result.returncode == 0,
            'output': result.stdout[-500:] if result.stdout else '',
            'error': result.stderr[-200:] if result.stderr else '',
            'articles': articles
        }

    except subprocess.TimeoutExpired:
        return {
            'region': region,
            'success': False,
            'error': 'Timeout (10 min)',
            'articles': 0
        }
    except Exception as e:
        return {
            'region': region,
            'success': False,
            'error': str(e)[:200],
            'articles': 0
        }


def main():
    """Main execution"""
    print(f"[{datetime.now()}] Starting scheduled scraper run...")

    supabase = get_supabase()
    if not supabase:
        print("[ERROR] Supabase connection failed")
        return

    # Today's date
    today = datetime.now().strftime('%Y-%m-%d')
    start_date = today
    end_date = today

    print(f"[INFO] Date range: {start_date} ~ {end_date}")
    print(f"[INFO] Regions: {len(ALL_REGIONS)}")
    print(f"[INFO] Max parallel: {MAX_WORKERS}")

    # Create log entries for all regions first
    log_ids = {}
    for region in ALL_REGIONS:
        log_id = create_bot_log(supabase, region)
        if log_id:
            log_ids[region] = log_id

    # Run scrapers in parallel
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_region = {
            executor.submit(run_scraper, region, start_date, end_date): region
            for region in ALL_REGIONS
        }

        for future in concurrent.futures.as_completed(future_to_region):
            region = future_to_region[future]
            try:
                result = future.result()
                results.append(result)

                # Update log
                if region in log_ids:
                    status = 'completed' if result['success'] else 'failed'
                    message = result.get('output', '')[:500] or result.get('error', '')[:500]
                    update_bot_log(supabase, log_ids[region], status, message, result.get('articles', 0))

                status_icon = '[OK]' if result['success'] else '[FAIL]'
                print(f"{status_icon} {region}: {result.get('articles', 0)} articles")

            except Exception as e:
                print(f"[ERROR] {region}: {e}")
                results.append({
                    'region': region,
                    'success': False,
                    'error': str(e)
                })

    # Summary
    succeeded = sum(1 for r in results if r['success'])
    failed = len(results) - succeeded
    total_articles = sum(r.get('articles', 0) for r in results)

    print(f"\n[SUMMARY]")
    print(f"  Succeeded: {succeeded}")
    print(f"  Failed: {failed}")
    print(f"  Total articles: {total_articles}")

    # Update lastRun in site_settings
    try:
        supabase.table('site_settings').upsert({
            'key': 'automation_schedule',
            'value': {
                'lastRun': datetime.now().isoformat(),
                'lastResult': {
                    'succeeded': succeeded,
                    'failed': failed,
                    'articles': total_articles
                }
            },
            'updated_at': datetime.now().isoformat()
        }, on_conflict='key').execute()
    except Exception as e:
        print(f"[WARN] Failed to update lastRun: {e}")

    print(f"\n[{datetime.now()}] Scheduled run completed.")


if __name__ == "__main__":
    main()

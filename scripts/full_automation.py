#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Korea NEWS - Full Automation Script
====================================
Version: 1.1
Created: 2025-12-24
Updated: 2025-12-24

This script runs from Windows Task Scheduler to:
1. Check if automation is enabled in DB
2. PHASE 1: AI Processing (process pending articles FIRST)
3. PHASE 2: Scraping (collect new articles if time permits)
4. Log results to DB

Phase Order Rationale:
- AI processing is MORE CRITICAL than new article collection
- Pending articles (Grade C/D) need retry processing
- Scraping can take 10+ minutes for 26 regions and may timeout
- By processing AI first, pending articles are guaranteed to be handled

Debug logging is enabled by default.
"""

import os
import sys
import json
import time
import socket
import logging
import argparse
import subprocess
import requests
from datetime import datetime, timedelta, timezone
import signal
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from article_processor import ArticleProcessor

# =============================================================================
# CONFIGURATION
# =============================================================================

# Load .env file from project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(PROJECT_ROOT, '.env.local')
if not os.path.exists(ENV_FILE):
    ENV_FILE = os.path.join(PROJECT_ROOT, '.env')
load_dotenv(ENV_FILE)

# Supabase settings (read from environment or use defaults for local dev)
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# API endpoints
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://www.koreanewsone.com')

# 27 regions (26 + 1 extra for shinan alias)
REGIONS = [
    'gwangju', 'jeonnam', 'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang',
    'damyang', 'gokseong', 'gurye', 'goheung', 'boseong', 'hwasun',
    'jangheung', 'gangjin', 'haenam', 'yeongam', 'muan', 'hampyeong',
    'yeonggwang', 'jangseong', 'wando', 'jindo', 'shinan',
    'gwangju_edu', 'jeonnam_edu'
]

# Rate limiting
AI_REQUEST_DELAY = 3  # seconds between AI API calls
SCRAPER_DELAY = 2  # seconds between scraper runs

# Retry settings
MAX_RETRIES = 3
RETRY_DELAYS = [3, 6, 12]  # exponential backoff

# Self-timeout (gracefully exit before scheduler's 10min timeout kills us)
MAX_RUNTIME_MINUTES = 9  # Must be less than scheduler's AUTOMATION_TIMEOUT (10 min)
HEARTBEAT_INTERVAL_MINUTES = 3  # Update heartbeat every 3 minutes

# Project paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPERS_DIR = os.path.join(PROJECT_ROOT, 'scrapers')
LOGS_DIR = os.path.join(PROJECT_ROOT, 'logs')

# =============================================================================
# LOGGING SETUP
# =============================================================================

def setup_logging():
    """Setup comprehensive logging to file and console."""
    os.makedirs(LOGS_DIR, exist_ok=True)

    log_file = os.path.join(LOGS_DIR, f'automation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )

    return logging.getLogger(__name__)

logger = setup_logging()

# =============================================================================
# SUPABASE CLIENT
# =============================================================================

class SupabaseClient:
    """Simple Supabase REST client with debugging."""

    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        logger.debug(f'[SupabaseClient] Initialized with URL: {url[:50]}...')

    def select(self, table: str, columns: str = '*', filters: Dict = None) -> Dict:
        """SELECT query with debugging."""
        logger.debug(f'[SupabaseClient] SELECT {columns} FROM {table}')
        logger.debug(f'[SupabaseClient] Filters: {filters}')

        url = f'{self.url}/rest/v1/{table}?select={columns}'

        if filters:
            for key, value in filters.items():
                url += f'&{key}=eq.{value}'

        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            logger.debug(f'[SupabaseClient] Response status: {response.status_code}')

            if response.status_code == 200:
                data = response.json()
                logger.debug(f'[SupabaseClient] Returned {len(data)} rows')
                return {'data': data, 'error': None}
            else:
                logger.error(f'[SupabaseClient] Error: {response.text}')
                return {'data': None, 'error': response.text}
        except Exception as e:
            logger.error(f'[SupabaseClient] Exception: {str(e)}')
            return {'data': None, 'error': str(e)}

    def upsert(self, table: str, data: Dict) -> Dict:
        """UPSERT with debugging."""
        logger.debug(f'[SupabaseClient] UPSERT into {table}')
        logger.debug(f'[SupabaseClient] Data: {json.dumps(data, default=str)[:200]}...')

        url = f'{self.url}/rest/v1/{table}'
        headers = {**self.headers, 'Prefer': 'resolution=merge-duplicates,return=representation'}

        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            logger.debug(f'[SupabaseClient] Response status: {response.status_code}')

            if response.status_code in [200, 201]:
                return {'data': response.json(), 'error': None}
            else:
                logger.error(f'[SupabaseClient] Error: {response.text}')
                return {'data': None, 'error': response.text}
        except Exception as e:
            logger.error(f'[SupabaseClient] Exception: {str(e)}')
            return {'data': None, 'error': str(e)}

    def update(self, table: str, data: Dict, filters: Dict) -> Dict:
        """UPDATE with debugging."""
        logger.debug(f'[SupabaseClient] UPDATE {table}')
        logger.debug(f'[SupabaseClient] Data: {json.dumps(data, default=str)[:200]}...')
        logger.debug(f'[SupabaseClient] Filters: {filters}')

        url = f'{self.url}/rest/v1/{table}'
        for key, value in filters.items():
            url += f'?{key}=eq.{value}'

        try:
            response = requests.patch(url, headers=self.headers, json=data, timeout=30)
            logger.debug(f'[SupabaseClient] Response status: {response.status_code}')

            if response.status_code in [200, 204]:
                return {'data': response.json() if response.text else [], 'error': None}
            else:
                logger.error(f'[SupabaseClient] Error: {response.text}')
                return {'data': None, 'error': response.text}
        except Exception as e:
            logger.error(f'[SupabaseClient] Exception: {str(e)}')
            return {'data': None, 'error': str(e)}

    def delete(self, table: str, filters: Dict) -> Dict:
        """DELETE with debugging."""
        logger.debug(f'[SupabaseClient] DELETE from {table}')
        logger.debug(f'[SupabaseClient] Filters: {filters}')

        url = f'{self.url}/rest/v1/{table}'
        for key, value in filters.items():
            url += f'?{key}=eq.{value}'

        try:
            response = requests.delete(url, headers=self.headers, timeout=30)
            logger.debug(f'[SupabaseClient] Response status: {response.status_code}')
            return {'data': None, 'error': None if response.status_code in [200, 204] else response.text}
        except Exception as e:
            logger.error(f'[SupabaseClient] Exception: {str(e)}')
            return {'data': None, 'error': str(e)}

# =============================================================================
# LOCK MECHANISM (P0)
# =============================================================================

class AutomationLock:
    """Database-based lock to prevent duplicate runs."""

    def __init__(self, supabase: SupabaseClient, lock_id: str = 'full_automation'):
        self.supabase = supabase
        self.lock_id = lock_id
        self.run_id = f'{datetime.now().strftime("%Y%m%d_%H%M%S")}_{socket.gethostname()}'
        self.heartbeat_enabled = True  # Will be set to False if column doesn't exist
        logger.debug(f'[Lock] Initialized with lock_id={lock_id}, run_id={self.run_id}')

    def acquire(self, expire_minutes: int = 20, stale_minutes: int = 18) -> bool:
        """Try to acquire lock. Returns True if successful.

        Args:
            expire_minutes: Lock expiration time in minutes (default: 20, shorter than scheduler timeout)
            stale_minutes: Consider lock stale if started_at is older than this (default: 18)
                          This handles cases where process was killed and couldn't release lock.
        """
        logger.info(f'[Lock] Attempting to acquire lock: {self.lock_id}')

        # Step 1: Check if lock exists
        result = self.supabase.select('automation_locks', '*', {'id': self.lock_id})

        if result['data'] and len(result['data']) > 0:
            existing = result['data'][0]

            # Check for stale lock first (process might have been killed)
            # Use last_heartbeat if available (more accurate), otherwise use started_at
            heartbeat_str = existing.get('last_heartbeat') or existing.get('started_at')
            if heartbeat_str:
                try:
                    # Parse timestamp with timezone handling
                    last_activity = datetime.fromisoformat(heartbeat_str.replace('Z', '+00:00'))
                    # Ensure we compare in UTC
                    if last_activity.tzinfo is None:
                        last_activity = last_activity.replace(tzinfo=timezone.utc)

                    now_utc = datetime.now(timezone.utc)
                    age_minutes = (now_utc - last_activity).total_seconds() / 60

                    # Stale if no heartbeat for too long OR negative age (timestamp corruption)
                    if age_minutes > stale_minutes or age_minutes < -5:
                        logger.warning(f'[Lock] Stale lock detected!')
                        logger.warning(f'[Lock] Lock held by: {existing.get("host_name")}')
                        logger.warning(f'[Lock] Lock age: {age_minutes:.1f} minutes (threshold: {stale_minutes} min, or <-5 min)')
                        if age_minutes < 0:
                            logger.warning(f'[Lock] Negative age indicates timestamp corruption (timezone mismatch)')
                        logger.warning(f'[Lock] Force releasing stale lock and re-acquiring...')
                        self.force_release()
                        # Continue to acquire new lock below
                    else:
                        # Lock is recent, check expiration
                        expires_at = datetime.fromisoformat(existing['expires_at'].replace('Z', '+00:00'))
                        if expires_at.tzinfo is None:
                            expires_at = expires_at.replace(tzinfo=timezone.utc)

                        if expires_at > now_utc:
                            logger.warning(f'[Lock] Lock already held by {existing.get("host_name")}')
                            logger.warning(f'[Lock] Lock age: {age_minutes:.1f} minutes')
                            logger.warning(f'[Lock] Expires at: {expires_at}')
                            return False
                        else:
                            logger.info('[Lock] Existing lock expired, will overwrite')
                except Exception as e:
                    logger.warning(f'[Lock] Error parsing lock timestamps: {e}')
                    # If we can't parse, check just expires_at
                    expires_at = datetime.fromisoformat(existing['expires_at'].replace('Z', '+00:00'))
                    if expires_at > datetime.now(timezone.utc):
                        logger.warning(f'[Lock] Lock already held by {existing.get("host_name")}')
                        return False
            else:
                # No started_at, fall back to expires_at check
                expires_at = datetime.fromisoformat(existing['expires_at'].replace('Z', '+00:00'))
                if expires_at > datetime.now(timezone.utc):
                    logger.warning(f'[Lock] Lock already held by {existing.get("host_name")}')
                    logger.warning(f'[Lock] Expires at: {expires_at}')
                    return False
                else:
                    logger.info('[Lock] Existing lock expired, will overwrite')

        # Step 2: Create/update lock (use UTC for consistency)
        now_utc = datetime.now(timezone.utc)
        lock_data = {
            'id': self.lock_id,
            'started_at': now_utc.isoformat(),
            'expires_at': (now_utc + timedelta(minutes=expire_minutes)).isoformat(),
            'last_heartbeat': now_utc.isoformat(),
            'host_name': socket.gethostname(),
            'run_id': self.run_id
        }

        result = self.supabase.upsert('automation_locks', lock_data)

        # If failed due to missing last_heartbeat column, retry without it
        if result['error'] and 'last_heartbeat' in str(result['error']):
            logger.warning('[Lock] last_heartbeat column not found, retrying without it')
            self.heartbeat_enabled = False
            del lock_data['last_heartbeat']
            result = self.supabase.upsert('automation_locks', lock_data)

        if result['error']:
            logger.error(f'[Lock] Failed to acquire: {result["error"]}')
            return False

        logger.info(f'[Lock] Successfully acquired lock: {self.lock_id}')
        if not self.heartbeat_enabled:
            logger.warning('[Lock] Heartbeat disabled - add last_heartbeat column for better stale detection')
        return True

    def release(self):
        """Release the lock."""
        logger.info(f'[Lock] Releasing lock: {self.lock_id}')

        result = self.supabase.delete('automation_locks', {'id': self.lock_id})

        if result['error']:
            logger.warning(f'[Lock] Failed to release: {result["error"]}')
        else:
            logger.info('[Lock] Lock released successfully')

    def force_release(self):
        """Force release lock regardless of owner (for stale lock cleanup)."""
        logger.warning(f'[Lock] Force releasing stale lock: {self.lock_id}')
        result = self.supabase.delete('automation_locks', {'id': self.lock_id})
        if result['error']:
            logger.error(f'[Lock] Failed to force release: {result["error"]}')
        else:
            logger.info('[Lock] Stale lock force released successfully')

    def heartbeat(self):
        """Update last_heartbeat timestamp to indicate process is still alive."""
        if not self.heartbeat_enabled:
            return  # Skip if column doesn't exist

        now_utc = datetime.now(timezone.utc)
        result = self.supabase.update('automation_locks', {
            'last_heartbeat': now_utc.isoformat()
        }, {'id': self.lock_id})

        if result['error']:
            logger.warning(f'[Lock] Failed to update heartbeat: {result["error"]}')
            # Disable heartbeat if column doesn't exist
            if 'last_heartbeat' in str(result['error']):
                self.heartbeat_enabled = False
        else:
            logger.debug(f'[Lock] Heartbeat updated: {now_utc.isoformat()}')

# =============================================================================
# AUTOMATION CHECKER
# =============================================================================

def check_automation_enabled(supabase: SupabaseClient) -> bool:
    """Check if automation is enabled in site_settings."""
    logger.info('[Check] Checking if automation is enabled...')

    result = supabase.select('site_settings', 'value', {'key': 'full_automation_enabled'})

    if result['error']:
        logger.error(f'[Check] Error checking settings: {result["error"]}')
        return False

    if not result['data'] or len(result['data']) == 0:
        logger.warning('[Check] Setting not found, assuming disabled')
        return False

    value = result['data'][0].get('value', 'false')
    enabled = value == 'true' or value == True

    logger.info(f'[Check] Automation enabled: {enabled}')
    return enabled

# =============================================================================
# SCRAPER RUNNER
# =============================================================================

def find_scraper_path(region: str) -> Optional[str]:
    """Find the scraper file for a region."""
    logger.debug(f'[Scraper] Looking for scraper for region: {region}')

    # Priority 1: Folder-based scraper
    folder_path = os.path.join(SCRAPERS_DIR, region, f'{region}_scraper.py')
    if os.path.exists(folder_path):
        logger.debug(f'[Scraper] Found folder scraper: {folder_path}')
        return folder_path

    # Priority 2: Root-level scraper
    root_path = os.path.join(SCRAPERS_DIR, f'{region}_scraper.py')
    if os.path.exists(root_path):
        logger.debug(f'[Scraper] Found root scraper: {root_path}')
        return root_path

    # Priority 3: Universal scraper
    universal_path = os.path.join(SCRAPERS_DIR, 'universal_scraper.py')
    if os.path.exists(universal_path):
        logger.debug(f'[Scraper] Will use universal scraper: {universal_path}')
        return universal_path

    logger.warning(f'[Scraper] No scraper found for region: {region}')
    return None


def run_scraper(region: str, today: str) -> Dict[str, Any]:
    """Run scraper for a region with retry logic."""
    logger.info(f'[Scraper] ========== Starting: {region} ==========')

    scraper_path = find_scraper_path(region)
    if not scraper_path:
        return {'success': False, 'error': 'Scraper not found', 'articles': 0}

    # Build command
    cmd = [
        sys.executable,  # Python interpreter
        scraper_path,
        '--days', '1',
        '--start-date', today,
        '--end-date', today,
        '--max-articles', '30'
    ]

    # Add region arg if using universal scraper
    if 'universal_scraper' in scraper_path:
        cmd.extend(['--region', region])

    logger.info(f'[Scraper] Command: {" ".join(cmd)}')

    for attempt in range(MAX_RETRIES):
        try:
            logger.debug(f'[Scraper] Attempt {attempt + 1}/{MAX_RETRIES}')

            result = subprocess.run(
                cmd,
                cwd=SCRAPERS_DIR,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes max
                encoding='utf-8',
                errors='replace',  # Replace undecodable chars
                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}
            )

            logger.debug(f'[Scraper] Exit code: {result.returncode}')

            if result.stdout:
                logger.debug(f'[Scraper] STDOUT (last 500 chars): ...{result.stdout[-500:]}')
            if result.stderr:
                logger.warning(f'[Scraper] STDERR: {result.stderr[:500]}...')

            if result.returncode == 0:
                # Parse article count from output
                articles = 0
                stdout_text = result.stdout or ''
                for line in stdout_text.split('\n'):
                    if 'new' in line.lower() and ('article' in line.lower() or 'created' in line.lower()):
                        # Try to extract number
                        import re
                        numbers = re.findall(r'\d+', line)
                        if numbers:
                            articles = int(numbers[0])
                            break

                logger.info(f'[Scraper] {region} completed: {articles} new articles')
                return {'success': True, 'articles': articles}
            else:
                logger.warning(f'[Scraper] {region} failed with code {result.returncode}')
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.info(f'[Scraper] Retrying in {delay} seconds...')
                    time.sleep(delay)

        except subprocess.TimeoutExpired:
            logger.error(f'[Scraper] {region} timed out')
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAYS[attempt])
        except Exception as e:
            logger.error(f'[Scraper] {region} exception: {str(e)}')
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAYS[attempt])

    return {'success': False, 'error': 'Max retries exceeded', 'articles': 0}

# =============================================================================
# AI PROCESSING
# =============================================================================

def get_unprocessed_articles(supabase: SupabaseClient, today: str = None, all_pending: bool = False) -> List[Dict]:
    """Get articles that need AI processing.

    Args:
        supabase: Supabase client
        today: Date filter (YYYY-MM-DD). If None, no date filter.
        all_pending: If True, get ALL unprocessed articles regardless of date.
    """
    if all_pending:
        logger.info('[AI] Fetching ALL unprocessed articles (pending approval)...')
    else:
        logger.info(f'[AI] Fetching unprocessed articles from {today}...')

    # Query posts table
    url = f'{supabase.url}/rest/v1/posts'
    url += '?status=eq.draft'
    url += '&or=(ai_processed.is.null,ai_processed.eq.false)'
    url += '&select=id,title,content,region,status'

    # Add date filter only if not processing all pending
    if not all_pending and today:
        url += f'&created_at=gte.{today}T00:00:00'

    url += '&order=created_at.asc'
    url += '&limit=500'  # Process up to 500 pending articles

    try:
        response = requests.get(url, headers=supabase.headers, timeout=30)
        if response.status_code == 200:
            articles = response.json()
            logger.info(f'[AI] Found {len(articles)} unprocessed articles')
            return articles
        else:
            logger.error(f'[AI] Error fetching articles: {response.text}')
            return []
    except Exception as e:
        logger.error(f'[AI] Exception: {str(e)}')
        return []


def process_with_local_ollama(article: Dict, supabase: SupabaseClient, ai_processor: ArticleProcessor) -> Dict[str, Any]:
    """Process article with local Ollama and update DB."""
    article_id = article.get('id')
    content = article.get('content', '')
    region = article.get('region', 'unknown')

    logger.info(f'[AI] Processing article {article_id} from {region}')
    logger.debug(f'[AI] Content length: {len(content)} chars')

    if not content or len(content) < 100:
        logger.warning(f'[AI] Article {article_id} has insufficient content')
        return {'success': False, 'error': 'Insufficient content'}

    try:
        # Process with local Ollama (2-stage: convert + verify)
        result = ai_processor.process_article(content)

        # Determine grade
        if result.has_hallucination:
            grade = "C"
        else:
            verification = result.stage3_verification.lower()
            if "통과" in verification and "수정필요" not in verification:
                grade = "A"
            else:
                grade = "B"

        # Prepare update data
        updates = {
            'content': result.final_article,
            'ai_summary': result.stage1_converted[:500] if result.stage1_converted else None,
            'ai_processed': True,
            'ai_processed_at': datetime.now().isoformat(),
            'ai_validation_grade': grade,
        }

        # Auto-publish if Grade A or B
        published = False
        if grade in ["A", "B"]:
            updates['status'] = 'published'
            updates['published_at'] = datetime.now().isoformat()
            published = True

        # Update DB
        supabase.update('posts', updates, {'id': article_id})

        logger.info(f'[AI] Article {article_id}: Grade {grade}, Published: {published}')
        return {
            'success': True,
            'published': published,
            'grade': grade
        }

    except Exception as e:
        logger.error(f'[AI] Exception: {str(e)}')
        return {'success': False, 'error': str(e)}

# =============================================================================
# LOGGING TO DB
# =============================================================================

def create_run_log(supabase: SupabaseClient, run_id: str) -> Optional[str]:
    """Create automation log entry."""
    logger.info(f'[Log] Creating run log: {run_id}')

    log_data = {
        'run_id': run_id,
        'started_at': datetime.now().isoformat(),
        'status': 'running',
        'host_name': socket.gethostname()
    }

    result = supabase.upsert('automation_logs', log_data)

    if result['error']:
        logger.error(f'[Log] Failed to create log: {result["error"]}')
        return None

    log_id = result['data'][0].get('id') if result['data'] else None
    logger.info(f'[Log] Created log with ID: {log_id}')
    return log_id


def update_run_log(supabase: SupabaseClient, run_id: str, stats: Dict):
    """Update automation log with final stats."""
    logger.info(f'[Log] Updating run log: {run_id}')
    logger.debug(f'[Log] Stats: {stats}')

    update_data = {
        'completed_at': datetime.now().isoformat(),
        'status': 'success' if stats.get('errors', 0) == 0 else 'partial',
        'regions_scraped': stats.get('regions_scraped', 0),
        'articles_found': stats.get('articles_found', 0),
        'articles_new': stats.get('articles_new', 0),
        'articles_processed': stats.get('articles_processed', 0),
        'articles_published': stats.get('articles_published', 0),
        'articles_held': stats.get('articles_held', 0),
        'articles_failed': stats.get('articles_failed', 0),
        'region_results': json.dumps(stats.get('region_results', {}))
    }

    result = supabase.update('automation_logs', update_data, {'run_id': run_id})

    if result['error']:
        logger.error(f'[Log] Failed to update log: {result["error"]}')
    else:
        logger.info('[Log] Log updated successfully')

# =============================================================================
# RUNTIME TRACKER (Self-timeout to prevent force kill)
# =============================================================================

class RuntimeTracker:
    """Track runtime and provide graceful timeout before scheduler kills us."""

    def __init__(self, max_minutes: int = MAX_RUNTIME_MINUTES, heartbeat_interval: int = HEARTBEAT_INTERVAL_MINUTES):
        self.start_time = datetime.now()
        self.max_runtime = timedelta(minutes=max_minutes)
        self.heartbeat_interval = timedelta(minutes=heartbeat_interval)
        self.last_heartbeat = self.start_time
        self.lock = None
        logger.info(f'[Runtime] Started at {self.start_time.strftime("%H:%M:%S")}, max runtime: {max_minutes} min')

    def set_lock(self, lock):
        """Set the lock object for heartbeat updates."""
        self.lock = lock

    def should_stop(self) -> bool:
        """Check if we should stop to allow graceful exit."""
        elapsed = datetime.now() - self.start_time
        if elapsed >= self.max_runtime:
            remaining = (self.max_runtime - elapsed).total_seconds()
            logger.warning(f'[Runtime] TIMEOUT! Elapsed: {elapsed.total_seconds()/60:.1f} min, stopping gracefully...')
            return True
        return False

    def get_elapsed_minutes(self) -> float:
        """Get elapsed time in minutes."""
        return (datetime.now() - self.start_time).total_seconds() / 60

    def get_remaining_minutes(self) -> float:
        """Get remaining time in minutes."""
        elapsed = datetime.now() - self.start_time
        remaining = self.max_runtime - elapsed
        return max(0, remaining.total_seconds() / 60)

    def maybe_heartbeat(self):
        """Send heartbeat if enough time has passed."""
        if not self.lock:
            return

        now = datetime.now()
        if now - self.last_heartbeat >= self.heartbeat_interval:
            self.lock.heartbeat()
            self.last_heartbeat = now
            logger.info(f'[Runtime] Heartbeat sent. Elapsed: {self.get_elapsed_minutes():.1f} min, Remaining: {self.get_remaining_minutes():.1f} min')

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main(args=None):
    """Main automation execution."""
    logger.info('=' * 60)
    logger.info('KOREA NEWS FULL AUTOMATION - STARTING')
    logger.info('=' * 60)
    logger.info(f'Timestamp: {datetime.now().isoformat()}')
    logger.info(f'Host: {socket.gethostname()}')
    logger.info(f'Project root: {PROJECT_ROOT}')

    # Determine regions to process
    if args and args.regions:
        regions_to_process = [r for r in args.regions if r in REGIONS]
        if not regions_to_process:
            logger.error(f'[FATAL] No valid regions specified. Valid: {REGIONS}')
            sys.exit(1)
        logger.info(f'[Args] Processing specific regions: {regions_to_process}')
    else:
        regions_to_process = REGIONS
        logger.info(f'[Args] Processing all {len(REGIONS)} regions')

    # Check for dry-run mode
    dry_run = args.dry_run if args else False
    skip_ai = args.skip_ai if args else False
    override_date = args.date if args else None
    process_pending = args.process_pending if args else False
    ai_only = args.ai_only if args else False

    if dry_run:
        logger.info('[Args] DRY-RUN mode enabled - no actual processing')
    if skip_ai:
        logger.info('[Args] SKIP-AI mode enabled - scraping only')
    if override_date:
        logger.info(f'[Args] Date override: {override_date}')
    if process_pending:
        logger.info('[Args] PROCESS-PENDING mode - will process ALL pending articles')
    if ai_only:
        logger.info('[Args] AI-ONLY mode - skip scraping, process pending articles')

    # Validate configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error('[FATAL] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
        logger.error('[FATAL] Set these environment variables before running')
        sys.exit(1)

    # Initialize Supabase client
    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

    # Create lock
    lock = AutomationLock(supabase)

    # Try to acquire lock
    if not lock.acquire():
        logger.error('[FATAL] Could not acquire lock - another instance may be running')
        sys.exit(1)

    # Setup signal handlers for graceful shutdown (release lock on SIGTERM/SIGINT)
    def signal_handler(signum, frame):
        sig_name = 'SIGTERM' if signum == signal.SIGTERM else 'SIGINT' if signum == signal.SIGINT else str(signum)
        logger.warning(f'[Signal] Received {sig_name}, releasing lock before exit...')
        lock.release()
        sys.exit(1)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    logger.info('[Signal] Signal handlers installed for graceful shutdown')

    # Initialize runtime tracker for self-timeout
    runtime = RuntimeTracker()
    runtime.set_lock(lock)

    try:
        # Check if automation is enabled
        if not check_automation_enabled(supabase):
            logger.info('[EXIT] Automation is disabled. Exiting.')
            return

        # Get processing date (use override if provided)
        today = override_date if override_date else datetime.now().strftime('%Y-%m-%d')
        logger.info(f'[Main] Processing date: {today}')

        # Create run log
        run_id = lock.run_id
        create_run_log(supabase, run_id)

        # Stats tracking
        stats = {
            'regions_scraped': 0,
            'articles_found': 0,
            'articles_new': 0,
            'articles_processed': 0,
            'articles_published': 0,
            'articles_held': 0,
            'articles_failed': 0,
            'errors': 0,
            'region_results': {}
        }

        # =====================================================================
        # PHASE 1: AI PROCESSING FIRST (Process pending articles before scraping)
        # =====================================================================
        # Rationale: AI processing is more critical than new article collection.
        # Pending articles (Grade C/D) need retry. Process them first to ensure
        # they get handled even if scraping takes too long and times out.
        # =====================================================================
        logger.info('[Main] ===== PHASE 1: AI PROCESSING (Local Ollama) =====')
        logger.info('[Main] Processing pending articles FIRST to ensure they get handled')

        if skip_ai or dry_run:
            logger.info(f'[Main] Skipping AI processing (skip_ai={skip_ai}, dry_run={dry_run})')
            articles = []
        else:
            # Always get ALL pending articles (not just today's) for retry processing
            articles = get_unprocessed_articles(supabase, today, all_pending=True)

        stats['articles_found'] = len(articles)

        # Initialize local AI processor (Korean-specialized model)
        ai_processor = ArticleProcessor(model="benedict/linkbricks-llama3.1-korean:8b")
        logger.info('[Main] Initialized local Ollama processor (Korean-specialized: linkbricks-llama3.1-korean:8b)')

        for i, article in enumerate(articles):
            # Check for self-timeout before each article
            if runtime.should_stop():
                logger.warning(f'[Main] Stopping AI processing due to timeout ({i}/{len(articles)} articles done)')
                break

            # Send heartbeat periodically
            runtime.maybe_heartbeat()

            logger.info(f'[Main] AI processing article {i+1}/{len(articles)}')

            try:
                result = process_with_local_ollama(article, supabase, ai_processor)
                stats['articles_processed'] += 1

                if result.get('success'):
                    if result.get('published'):
                        stats['articles_published'] += 1
                    else:
                        stats['articles_held'] += 1
                else:
                    stats['articles_failed'] += 1

            except Exception as e:
                logger.error(f'[Main] Exception processing article: {str(e)}')
                stats['articles_failed'] += 1

            # Delay between AI calls (reduced for local processing)
            if i < len(articles) - 1:
                time.sleep(0.5)

        logger.info(f'[Main] AI processing complete: {stats["articles_processed"]} processed, {stats["articles_published"]} published')

        # =====================================================================
        # PHASE 2: SCRAPING (Collect new articles if time permits)
        # =====================================================================
        # Rationale: Scraping can take 10+ minutes for 26 regions. Running it
        # second ensures pending articles are processed even if scraping times out.
        # =====================================================================
        logger.info('[Main] ===== PHASE 2: SCRAPING =====')

        # Check timeout before starting Phase 2
        if runtime.should_stop():
            logger.warning('[Main] Skipping scraping due to timeout (AI processing completed)')
        elif ai_only:
            logger.info('[Main] AI-ONLY mode: Skipping scraping phase')
        elif dry_run:
            logger.info('[DRY-RUN] Skipping actual scraping')
            for region in regions_to_process:
                logger.info(f'[DRY-RUN] Would process: {region}')
        else:
            remaining_minutes = runtime.get_remaining_minutes()
            logger.info(f'[Main] Remaining time: {remaining_minutes:.1f} minutes')
            logger.info(f'[Main] Regions to process: {len(regions_to_process)}')

            for i, region in enumerate(regions_to_process):
                # Check for self-timeout before each region
                if runtime.should_stop():
                    logger.warning(f'[Main] Stopping scraping due to timeout ({i}/{len(regions_to_process)} regions done)')
                    break

                # Send heartbeat periodically
                runtime.maybe_heartbeat()

                logger.info(f'[Main] Processing region {i+1}/{len(regions_to_process)}: {region}')

                try:
                    result = run_scraper(region, today)
                    stats['region_results'][region] = result

                    if result['success']:
                        stats['regions_scraped'] += 1
                        stats['articles_new'] += result.get('articles', 0)
                    else:
                        stats['errors'] += 1

                except Exception as e:
                    logger.error(f'[Main] Exception processing {region}: {str(e)}')
                    stats['errors'] += 1
                    stats['region_results'][region] = {'success': False, 'error': str(e)}

                # Delay between scrapers
                if i < len(regions_to_process) - 1:
                    time.sleep(SCRAPER_DELAY)

        logger.info(f'[Main] Scraping complete: {stats["regions_scraped"]} regions, {stats["articles_new"]} new articles')

        # Update run log
        update_run_log(supabase, run_id, stats)

        # Update last run in site_settings
        last_run_data = {
            'timestamp': datetime.now().isoformat(),
            'status': 'success' if stats['errors'] == 0 else 'partial',
            'stats': {
                'scraped': stats['regions_scraped'],
                'processed': stats['articles_processed'],
                'published': stats['articles_published'],
                'held': stats['articles_held']
            }
        }

        supabase.upsert('site_settings', {
            'key': 'full_automation_last_run',
            'value': json.dumps(last_run_data),
            'updated_at': datetime.now().isoformat()
        })

        # Final summary
        logger.info('=' * 60)
        logger.info('AUTOMATION COMPLETE - SUMMARY')
        logger.info('=' * 60)
        logger.info(f'Regions scraped: {stats["regions_scraped"]}/{len(regions_to_process)}')
        logger.info(f'Articles found: {stats["articles_found"]}')
        logger.info(f'Articles processed: {stats["articles_processed"]}')
        logger.info(f'Articles published (Grade A): {stats["articles_published"]}')
        logger.info(f'Articles held (Grade B/C/D): {stats["articles_held"]}')
        logger.info(f'Articles failed: {stats["articles_failed"]}')
        logger.info(f'Errors: {stats["errors"]}')
        logger.info('=' * 60)

    except Exception as e:
        logger.error(f'[FATAL] Unhandled exception: {str(e)}')
        import traceback
        logger.error(traceback.format_exc())
    finally:
        # Always release lock
        lock.release()


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Korea NEWS Full Automation Script',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        '--regions',
        nargs='+',
        help='Specific regions to process (space-separated). Default: all regions'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Check configuration without running scrapers'
    )
    parser.add_argument(
        '--skip-ai',
        action='store_true',
        help='Skip AI processing phase (scraping only)'
    )
    parser.add_argument(
        '--date',
        help='Override processing date (YYYY-MM-DD format)'
    )
    parser.add_argument(
        '--process-pending',
        action='store_true',
        help='Process ALL pending articles (regardless of date)'
    )
    parser.add_argument(
        '--ai-only',
        action='store_true',
        help='Skip scraping, only run AI processing on pending articles'
    )
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()
    main(args)

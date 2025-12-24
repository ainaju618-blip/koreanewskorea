"""
Scheduled Scraper Runner + AI Processing
- Called by Windows Task Scheduler
- Runs all regions in parallel (headless mode)
- Then processes all pending articles with AI
- Logs results to Supabase

Usage: python tools/scheduled_scraper.py
"""

import os
import sys
import subprocess
import concurrent.futures
import socket
import time
import requests
import threading
from datetime import datetime
from typing import List, Dict, Any

# GUI imports for AI log window
try:
    import customtkinter as ctk
    from tkinter import messagebox
    GUI_AVAILABLE = True
except ImportError:
    GUI_AVAILABLE = False
    print("[WARN] customtkinter not available, running without GUI")

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

# Color theme for GUI
COLORS = {
    'primary': '#1f6aa5',
    'success': '#2fa572',
    'danger': '#dc3545',
    'warning': '#ffc107',
    'bg_dark': '#1a1a2e',
    'bg_card': '#16213e',
    'text': '#e4e4e4',
    'text_secondary': '#a0a0a0',
}

# Global log window reference
ai_log_window = None
gui_root = None


class AILogWindow:
    """Standalone AI Processing Log Window for scheduled execution"""

    def __init__(self):
        if not GUI_AVAILABLE:
            return

        # Create root window
        self.root = ctk.CTk()
        self.root.title("AI Processing Log - Scheduled Execution")
        self.root.geometry("900x700")
        self.root.minsize(700, 500)

        # Keep on top
        self.root.attributes('-topmost', True)
        self.root.after(3000, lambda: self.root.attributes('-topmost', False))

        # Configure theme
        ctk.set_appearance_mode("dark")

        # Configure grid
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(1, weight=1)

        # Header with stats
        header_frame = ctk.CTkFrame(self.root, corner_radius=10, fg_color=COLORS['bg_card'])
        header_frame.grid(row=0, column=0, padx=15, pady=(15, 10), sticky="ew")
        header_frame.grid_columnconfigure(4, weight=1)

        # Title
        ctk.CTkLabel(
            header_frame,
            text="AI Processing Monitor (Scheduled)",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLORS['text']
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")

        # Stats
        self.stat_frames = {}
        stats = [
            ("total", "Total", "0", COLORS['text']),
            ("success", "Success", "0", COLORS['success']),
            ("failed", "Failed", "0", COLORS['danger']),
            ("grade_a", "Grade A", "0", "#4ade80"),
        ]

        for i, (key, label, val, color) in enumerate(stats):
            frame = ctk.CTkFrame(header_frame, fg_color=COLORS['bg_dark'], corner_radius=8)
            frame.grid(row=0, column=i+1, padx=5, pady=10, ipadx=10, ipady=5)

            ctk.CTkLabel(frame, text=label, font=ctk.CTkFont(size=11),
                        text_color=COLORS['text_secondary']).pack()

            stat_label = ctk.CTkLabel(frame, text=val, font=ctk.CTkFont(size=20, weight="bold"),
                                     text_color=color)
            stat_label.pack()
            self.stat_frames[key] = stat_label

        # Main log area
        log_frame = ctk.CTkFrame(self.root, corner_radius=10, fg_color=COLORS['bg_card'])
        log_frame.grid(row=1, column=0, padx=15, pady=10, sticky="nsew")
        log_frame.grid_columnconfigure(0, weight=1)
        log_frame.grid_rowconfigure(0, weight=1)

        self.log_text = ctk.CTkTextbox(
            log_frame,
            corner_radius=8,
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color=COLORS['bg_dark'],
            wrap="word"
        )
        self.log_text.grid(row=0, column=0, padx=15, pady=15, sticky="nsew")

        # Progress bar at bottom
        progress_frame = ctk.CTkFrame(self.root, corner_radius=10, fg_color=COLORS['bg_card'])
        progress_frame.grid(row=2, column=0, padx=15, pady=(0, 15), sticky="ew")

        self.progress_label = ctk.CTkLabel(
            progress_frame,
            text="Waiting...",
            font=ctk.CTkFont(size=13),
            text_color=COLORS['text_secondary']
        )
        self.progress_label.pack(side="left", padx=20, pady=12)

        self.progress_bar = ctk.CTkProgressBar(progress_frame, width=300, height=12)
        self.progress_bar.pack(side="right", padx=20, pady=12)
        self.progress_bar.set(0)

        # State
        self.stats = {"total": 0, "success": 0, "failed": 0, "grade_a": 0}

        # Welcome message
        self._add_log("=" * 60)
        self._add_log("  AI Processing Log - Scheduled Execution")
        self._add_log("  Real-time monitoring of article processing")
        self._add_log("=" * 60)
        self._add_log("")

        # Start GUI update loop
        self._schedule_update()

    def _schedule_update(self):
        """Schedule GUI update"""
        if hasattr(self, 'root') and self.root.winfo_exists():
            self.root.update_idletasks()
            self.root.after(100, self._schedule_update)

    def _add_log(self, message):
        """Add log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        if hasattr(self, 'log_text'):
            self.log_text.insert("end", f"[{timestamp}] {message}\n")
            self.log_text.see("end")
            self.root.update_idletasks()

    def log(self, message, level="info"):
        """Public method to add log"""
        prefix = ""
        if level == "success":
            prefix = "[OK] "
        elif level == "error":
            prefix = "[ERR] "
        elif level == "warning":
            prefix = "[WARN] "
        self._add_log(f"{prefix}{message}")

    def log_article_start(self, idx, total, region, title):
        """Log article processing start"""
        self._add_log("")
        self._add_log("-" * 50)
        self._add_log(f"Article [{idx}/{total}]")
        self._add_log(f"  Region: {region}")
        self._add_log(f"  Title: {title[:50]}...")
        self.stats["total"] = idx
        self._update_stats()
        self._update_progress(idx, total)

    def log_validation_step(self, attempt, max_attempts, grade, passed):
        """Log validation step"""
        status = "PASS" if passed else "RETRY"
        icon = "[OK]" if passed else "[!!]"
        self._add_log(f"  Validation [{attempt}/{max_attempts}]: Grade {grade} -> {icon} {status}")

    def log_article_result(self, success, grade="", message=""):
        """Log article result"""
        if success:
            self._add_log(f"  Result: [SUCCESS] Published (Grade: {grade})")
            self.stats["success"] += 1
            if grade == "A":
                self.stats["grade_a"] += 1
        else:
            self._add_log(f"  Result: [FAILED] {message}")
            self.stats["failed"] += 1
        self._update_stats()

    def _update_stats(self):
        """Update stats display"""
        for key, label in self.stat_frames.items():
            label.configure(text=str(self.stats.get(key, 0)))
        self.root.update_idletasks()

    def _update_progress(self, current, total):
        """Update progress bar"""
        progress = current / total if total > 0 else 0
        self.progress_bar.set(progress)
        self.progress_label.configure(
            text=f"Processing: {current}/{total} ({int(progress*100)}%)"
        )
        self.root.update_idletasks()

    def set_complete(self):
        """Mark processing as complete"""
        self.progress_bar.set(1.0)
        self.progress_label.configure(text="Processing Complete!")
        self._add_log("")
        self._add_log("=" * 50)
        self._add_log("  PROCESSING COMPLETE")
        self._add_log(f"  Total: {self.stats['total']} | Success: {self.stats['success']} | Failed: {self.stats['failed']}")
        self._add_log(f"  Grade A: {self.stats['grade_a']}")
        self._add_log("=" * 50)
        self.root.update_idletasks()

    def mainloop(self):
        """Start GUI mainloop"""
        if hasattr(self, 'root'):
            self.root.mainloop()

    def destroy(self):
        """Destroy window"""
        if hasattr(self, 'root'):
            self.root.destroy()


# Region names for logging (Korean)
REGION_NAMES = {
    'gwangju': 'Gwangju', 'jeonnam': 'Jeonnam', 'mokpo': 'Mokpo',
    'yeosu': 'Yeosu', 'suncheon': 'Suncheon', 'naju': 'Naju',
    'gwangyang': 'Gwangyang', 'damyang': 'Damyang', 'gokseong': 'Gokseong',
    'gurye': 'Gurye', 'goheung': 'Goheung', 'boseong': 'Boseong',
    'hwasun': 'Hwasun', 'jangheung': 'Jangheung', 'gangjin': 'Gangjin',
    'haenam': 'Haenam', 'yeongam': 'Yeongam', 'muan': 'Muan',
    'hampyeong': 'Hampyeong', 'yeonggwang': 'Yeonggwang', 'jangseong': 'Jangseong',
    'wando': 'Wando', 'jindo': 'Jindo', 'shinan': 'Shinan',
    'gwangju_edu': 'GwangjuEdu', 'jeonnam_edu': 'JeonnamEdu'
}


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
            'started_at': datetime.now().isoformat()
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
            'articles_count': articles,
            'ended_at': datetime.now().isoformat()
        }).eq('id', log_id).execute()
    except Exception as e:
        print(f"[ERROR] Failed to update log {log_id}: {e}")


# =========================================================================
# AI Processing Functions
# =========================================================================

def is_server_running():
    """Check if dev server is running on localhost:3000"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', 3000))
        sock.close()
        return result == 0
    except:
        return False


def start_dev_server():
    """Start the Next.js dev server"""
    print("[AI] Starting dev server...")

    # Kill existing node processes if any
    subprocess.run('taskkill /f /im node.exe', shell=True, capture_output=True)
    time.sleep(2)

    # Start new server
    subprocess.Popen(
        'npm run dev',
        shell=True,
        cwd=PROJECT_ROOT,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )

    # Wait for server to be ready (max 30 seconds)
    for i in range(30):
        time.sleep(1)
        if is_server_running():
            print(f"[AI] Server ready ({i+1}s)")
            return True
        if i % 5 == 4:
            print(f"[AI] Waiting for server... ({i+1}s)")

    print("[AI] Server failed to start")
    return False


def process_ai_articles(supabase) -> Dict[str, Any]:
    """Process all pending articles with AI"""
    global ai_log_window

    print("\n" + "=" * 50)
    print("[AI PROCESSING] Starting AI article processing...")
    print("=" * 50)

    # Create log window if GUI available
    log_window = None
    if GUI_AVAILABLE:
        try:
            log_window = AILogWindow()
            log_window.log("Starting AI article processing...")
        except Exception as e:
            print(f"[WARN] Could not create log window: {e}")
            log_window = None

    # Log file for saving
    log_file_path = os.path.join(PROJECT_ROOT, 'tools', f'ai_log_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt')
    log_lines = []

    def log_both(msg, level="info"):
        """Log to both console and window"""
        print(msg)
        log_lines.append(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
        if log_window:
            log_window.log(msg, level)

    # Create AI processing log entry
    ai_log_id = None
    try:
        result = supabase.table('bot_logs').insert({
            'region': 'ai_processing',
            'status': 'running',
            'log_message': 'AI processing started...',
            'started_at': datetime.now().isoformat()
        }).execute()
        ai_log_id = result.data[0]['id']
    except Exception as e:
        log_both(f"[AI] Failed to create log: {e}", "error")

    # Check/start server
    if not is_server_running():
        log_both("[AI] Starting dev server...")
        if not start_dev_server():
            if ai_log_id:
                update_bot_log(supabase, ai_log_id, 'failed', 'Dev server failed to start', 0)
            if log_window:
                log_window.log("Dev server failed to start", "error")
                log_window.set_complete()
                time.sleep(3)
                log_window.destroy()
            return {'success': False, 'error': 'Server failed', 'processed': 0}
    else:
        log_both("[AI] Server already running")

    time.sleep(1)

    # Get pending articles
    api_url = 'http://localhost:3000/api/bot/process-single-article'
    total_processed = 0
    total_success = 0
    total_failed = 0
    log_messages = []

    batch_num = 0
    while True:
        batch_num += 1
        log_both(f"\n[AI] Batch {batch_num}: Loading pending articles...")

        try:
            result = supabase.table('posts').select(
                'id, title, source, content'
            ).eq('status', 'draft').or_(
                'ai_processed.is.null,ai_processed.eq.false'
            ).order('created_at', desc=True).limit(100).execute()

            if not result.data:
                log_both("[AI] No more pending articles")
                break

            pending = result.data
            log_both(f"[AI] Found {len(pending)} articles in batch {batch_num}")
            log_messages.append(f"Batch {batch_num}: {len(pending)} articles")

            for idx, article in enumerate(pending):
                article_id = article['id']
                title = (article.get('title') or '')[:40]
                content = article.get('content', '')
                region = article.get('source', 'unknown')
                region_name = REGION_NAMES.get(region, region)

                if not content:
                    log_both(f"  [{idx+1}/{len(pending)}] Skip (no content): {title}")
                    total_failed += 1
                    if log_window:
                        log_window.log_article_result(False, message="No content")
                    continue

                # Log article start
                log_both(f"  [{idx+1}/{len(pending)}] {region_name} | {title}...")
                if log_window:
                    log_window.log_article_start(idx+1, len(pending), region_name, title)

                log_both(f"          -> AI processing...")

                try:
                    # Ollama API only needs articleId (content fetched from DB)
                    response = requests.post(api_url, json={
                        'articleId': article_id
                    }, timeout=180)

                    if response.status_code == 200:
                        data = response.json()
                        grade = data.get('grade', '?')
                        attempts = data.get('attempts', 1)

                        if data.get('success') or data.get('published'):
                            total_success += 1
                            log_both(f"          -> OK (Grade:{grade}, Attempts:{attempts})", "success")
                            if log_window:
                                log_window.log_article_result(True, grade=grade)
                        else:
                            total_failed += 1
                            msg = data.get('message', data.get('error', ''))[:30]
                            log_both(f"          -> HOLD: {msg}", "warning")
                            if log_window:
                                log_window.log_article_result(False, message=msg)
                    else:
                        total_failed += 1
                        log_both(f"          -> HTTP {response.status_code}", "error")
                        if log_window:
                            log_window.log_article_result(False, message=f"HTTP {response.status_code}")

                except requests.exceptions.Timeout:
                    total_failed += 1
                    log_both(f"          -> Timeout", "error")
                    if log_window:
                        log_window.log_article_result(False, message="Timeout")
                except requests.exceptions.ConnectionError:
                    total_failed += 1
                    log_both(f"          -> Connection error", "error")
                    if log_window:
                        log_window.log_article_result(False, message="Connection error")
                except Exception as e:
                    total_failed += 1
                    log_both(f"          -> Error: {str(e)[:30]}", "error")
                    if log_window:
                        log_window.log_article_result(False, message=str(e)[:30])

                total_processed += 1

                # Rate limiting (3 seconds between requests)
                if idx < len(pending) - 1:
                    time.sleep(3)

            # Brief pause between batches
            time.sleep(2)

        except Exception as e:
            print(f"[AI] Batch error: {e}")
            log_messages.append(f"Batch {batch_num} error: {str(e)[:50]}")
            break

    # Summary
    log_both(f"\n[AI SUMMARY]")
    log_both(f"  Total processed: {total_processed}")
    log_both(f"  Success: {total_success}")
    log_both(f"  Failed: {total_failed}")

    # Update AI log
    if ai_log_id:
        status = 'completed' if total_failed == 0 else 'partial'
        log_msg = f"Processed:{total_processed}, Success:{total_success}, Failed:{total_failed}\n" + "\n".join(log_messages[-10:])
        update_bot_log(supabase, ai_log_id, status, log_msg, total_success)

    # Save log file
    try:
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(log_lines))
        log_both(f"[AI] Log saved: {log_file_path}")
    except Exception as e:
        print(f"[WARN] Failed to save log file: {e}")

    # Complete and close window
    if log_window:
        log_window.set_complete()
        log_window.log(f"Log saved to: {log_file_path}")
        # Wait 5 seconds before closing
        time.sleep(5)
        log_window.destroy()

    return {
        'success': True,
        'processed': total_processed,
        'success_count': total_success,
        'failed_count': total_failed
    }


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
    schedule_start_time = time.time()  # Record schedule start time
    TIMEOUT_SECONDS = 600  # 10 minutes timeout

    print(f"[{datetime.now()}] Starting scheduled scraper run...")
    print(f"[INFO] Timeout: {TIMEOUT_SECONDS // 60} minutes")

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

    # Run scrapers in parallel with timeout
    results = []
    timed_out = False

    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_region = {
            executor.submit(run_scraper, region, start_date, end_date): region
            for region in ALL_REGIONS
        }

        # Calculate remaining time until timeout
        elapsed = time.time() - schedule_start_time
        remaining_timeout = max(0, TIMEOUT_SECONDS - elapsed)

        # Wait for futures with timeout
        done, not_done = concurrent.futures.wait(
            future_to_region.keys(),
            timeout=remaining_timeout,
            return_when=concurrent.futures.ALL_COMPLETED
        )

        # Check if we timed out
        if not_done:
            timed_out = True
            elapsed_min = (time.time() - schedule_start_time) / 60
            print(f"\n[TIMEOUT] {elapsed_min:.1f} minutes elapsed. {len(not_done)} scrapers still running.")
            print("[INFO] Proceeding to AI processing with completed scrapers...")

            # Cancel remaining futures
            for future in not_done:
                future.cancel()
                region = future_to_region[future]
                # Mark as timed out in bot_logs
                if region in log_ids:
                    update_bot_log(supabase, log_ids[region], 'timeout',
                                   f'Cancelled after {TIMEOUT_SECONDS // 60} min timeout', 0)
                print(f"[TIMEOUT] {region}: Cancelled")

        # Process completed futures
        for future in done:
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
    timed_out_count = len(ALL_REGIONS) - len(results) if timed_out else 0

    print(f"\n[SUMMARY]")
    print(f"  Succeeded: {succeeded}")
    print(f"  Failed: {failed}")
    if timed_out:
        print(f"  Timed out: {timed_out_count}")
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
                    'timed_out': timed_out_count,
                    'articles': total_articles
                }
            },
            'updated_at': datetime.now().isoformat()
        }, on_conflict='key').execute()
    except Exception as e:
        print(f"[WARN] Failed to update lastRun: {e}")

    if timed_out:
        print(f"\n[{datetime.now()}] Scraping phase ended (timeout).")
    else:
        print(f"\n[{datetime.now()}] Scraping completed.")

    # =========================================================================
    # Phase 2: AI Processing (runs after scraping completes OR timeout)
    # =========================================================================
    print("\n" + "=" * 60)
    print("[PHASE 2] Starting AI article processing...")
    if timed_out:
        print("[INFO] Processing all pending articles (including from timed-out scrapers)")
    print("=" * 60)

    ai_result = process_ai_articles(supabase)

    # Update site_settings with AI result
    try:
        supabase.table('site_settings').upsert({
            'key': 'ai_processing_last_run',
            'value': {
                'lastRun': datetime.now().isoformat(),
                'result': ai_result
            },
            'updated_at': datetime.now().isoformat()
        }, on_conflict='key').execute()
    except Exception as e:
        print(f"[WARN] Failed to update AI lastRun: {e}")

    # Final summary
    print("\n" + "=" * 60)
    print("[FINAL SUMMARY]")
    print("=" * 60)
    print(f"  Scraping: {succeeded} regions, {total_articles} articles")
    print(f"  AI Processing: {ai_result.get('processed', 0)} processed, "
          f"{ai_result.get('success_count', 0)} success, "
          f"{ai_result.get('failed_count', 0)} failed")

    print(f"\n[{datetime.now()}] Scheduled run completed.")


if __name__ == "__main__":
    main()

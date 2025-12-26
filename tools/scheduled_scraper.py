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
    print("[경고] customtkinter 미설치, GUI 없이 실행")

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'scrapers'))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'tools'))

# Import job logger for real-time monitoring
from job_logger import JobLogger, get_logger, reset_logger

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
        self.root.title("AI 처리 로그 - 예약 실행")
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
            text="AI 처리 모니터 (예약 실행)",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLORS['text']
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")

        # Stats
        self.stat_frames = {}
        stats = [
            ("total", "전체", "0", COLORS['text']),
            ("success", "성공", "0", COLORS['success']),
            ("failed", "실패", "0", COLORS['danger']),
            ("grade_a", "A등급", "0", "#4ade80"),
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
            text="대기 중...",
            font=ctk.CTkFont(size=13),
            text_color=COLORS['text_secondary']
        )
        self.progress_label.pack(side="left", padx=20, pady=12)

        self.progress_bar = ctk.CTkProgressBar(progress_frame, width=300, height=12)
        self.progress_bar.pack(side="right", padx=20, pady=12)
        self.progress_bar.set(0)

        # State
        self.stats = {"total": 0, "success": 0, "failed": 0, "grade_a": 0}
        self._closing = False  # Flag to stop update loop

        # Welcome message
        self._add_log("=" * 60)
        self._add_log("  AI 처리 로그 - 예약 실행")
        self._add_log("  기사 처리 실시간 모니터링")
        self._add_log("=" * 60)
        self._add_log("")

        # Force window to show immediately
        self.root.update()
        self.root.deiconify()  # Ensure window is visible
        self.root.lift()  # Bring to front

        # Start GUI update loop
        self._schedule_update()

    def _schedule_update(self):
        """Schedule GUI update"""
        if self._closing:
            return  # Stop update loop when closing
        if hasattr(self, 'root') and self.root.winfo_exists():
            self.root.update()  # Full update to keep window responsive
            self.root.after(100, self._schedule_update)

    def _add_log(self, message):
        """Add log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        if hasattr(self, 'log_text') and hasattr(self, 'root'):
            try:
                self.log_text.insert("end", f"[{timestamp}] {message}\n")
                self.log_text.see("end")
                self.root.update()  # Full update for visibility
            except Exception:
                pass  # Window may be closed

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
        self._add_log(f"기사 [{idx}/{total}]")
        self._add_log(f"  지역: {region}")
        self._add_log(f"  제목: {title[:50]}...")
        self.stats["total"] = idx
        self._update_stats()
        self._update_progress(idx, total)

    def log_validation_step(self, attempt, max_attempts, grade, passed):
        """Log validation step"""
        status = "통과" if passed else "재시도"
        icon = "[OK]" if passed else "[!!]"
        self._add_log(f"  검증 [{attempt}/{max_attempts}]: 등급 {grade} -> {icon} {status}")

    def log_article_result(self, success, grade="", message=""):
        """Log article result"""
        if success:
            self._add_log(f"  결과: [성공] 발행됨 (등급: {grade})")
            self.stats["success"] += 1
            if grade == "A":
                self.stats["grade_a"] += 1
        else:
            self._add_log(f"  결과: [실패] {message}")
            self.stats["failed"] += 1
        self._update_stats()

    def _update_stats(self):
        """Update stats display"""
        try:
            for key, label in self.stat_frames.items():
                label.configure(text=str(self.stats.get(key, 0)))
            self.root.update()  # Full update for visibility
        except Exception:
            pass  # Window may be closed

    def _update_progress(self, current, total):
        """Update progress bar"""
        try:
            progress = current / total if total > 0 else 0
            self.progress_bar.set(progress)
            self.progress_label.configure(
                text=f"처리 중: {current}/{total} ({int(progress*100)}%)"
            )
            self.root.update()  # Full update for visibility
        except Exception:
            pass  # Window may be closed

    def set_complete(self):
        """Mark processing as complete"""
        try:
            self.progress_bar.set(1.0)
            self.progress_label.configure(text="처리 완료!")
            self._add_log("")
            self._add_log("=" * 50)
            self._add_log("  처리 완료")
            self._add_log(f"  전체: {self.stats['total']} | 성공: {self.stats['success']} | 실패: {self.stats['failed']}")
            self._add_log(f"  A등급: {self.stats['grade_a']}")
            self._add_log("=" * 50)
            self.root.update()  # Full update for visibility
        except Exception:
            pass  # Window may be closed

    def mainloop(self):
        """Start GUI mainloop"""
        if hasattr(self, 'root'):
            self.root.mainloop()

    def destroy(self):
        """Destroy window - ensure complete cleanup"""
        self._closing = True  # Stop update loop
        if hasattr(self, 'root'):
            try:
                # Process any pending events
                self.root.update()
                # Withdraw first (hide immediately)
                self.root.withdraw()
                # Then destroy
                self.root.destroy()
                self.root.quit()  # Exit mainloop if running
            except Exception:
                pass  # Ignore errors during cleanup


# Region names for logging (Korean)
REGION_NAMES = {
    'gwangju': '광주시', 'jeonnam': '전라남도', 'mokpo': '목포시',
    'yeosu': '여수시', 'suncheon': '순천시', 'naju': '나주시',
    'gwangyang': '광양시', 'damyang': '담양군', 'gokseong': '곡성군',
    'gurye': '구례군', 'goheung': '고흥군', 'boseong': '보성군',
    'hwasun': '화순군', 'jangheung': '장흥군', 'gangjin': '강진군',
    'haenam': '해남군', 'yeongam': '영암군', 'muan': '무안군',
    'hampyeong': '함평군', 'yeonggwang': '영광군', 'jangseong': '장성군',
    'wando': '완도군', 'jindo': '진도군', 'shinan': '신안군',
    'gwangju_edu': '광주교육청', 'jeonnam_edu': '전남교육청'
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
            'log_message': '스크래퍼 시작 중...',
            'started_at': datetime.now().isoformat()
        }).execute()
        return result.data[0]['id']
    except Exception as e:
        print(f"[오류] {region} 로그 생성 실패: {e}")
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
        print(f"[오류] 로그 {log_id} 업데이트 실패: {e}")


# =========================================================================
# Ollama Server Functions
# =========================================================================

OLLAMA_URL = 'http://localhost:11434'


def is_ollama_running():
    """Check if Ollama server is running on localhost:11434"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', 11434))
        sock.close()
        return result == 0
    except:
        return False


def start_ollama():
    """Start Ollama server"""
    print("[OLLAMA] Ollama 서버 시작 중...")

    try:
        # Start Ollama serve in background (hidden)
        subprocess.Popen(
            'ollama serve',
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )

        # Wait for Ollama to be ready (max 30 seconds)
        for i in range(30):
            time.sleep(1)
            if is_ollama_running():
                print(f"[OLLAMA] 서버 준비 완료 ({i+1}초)")
                return True
            if i % 5 == 4:
                print(f"[OLLAMA] 서버 대기 중... ({i+1}초)")

        print("[OLLAMA] 서버 시작 실패")
        return False
    except Exception as e:
        print(f"[OLLAMA] 서버 시작 오류: {e}")
        return False


def stop_ollama():
    """Stop Ollama server"""
    print("[OLLAMA] 서버 종료 중...")
    try:
        subprocess.run(
            'taskkill /f /im ollama.exe',
            shell=True,
            capture_output=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        time.sleep(1)
        print("[OLLAMA] 서버 종료 완료")
    except Exception as e:
        print(f"[OLLAMA] 서버 종료 오류: {e}")


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
    print("[AI] 개발 서버 시작 중...")

    # Kill existing node processes if any
    subprocess.run('taskkill /f /im node.exe', shell=True, capture_output=True,
                   creationflags=subprocess.CREATE_NO_WINDOW)
    time.sleep(2)

    # Start new server (hidden)
    subprocess.Popen(
        'npm run dev',
        shell=True,
        cwd=PROJECT_ROOT,
        creationflags=subprocess.CREATE_NO_WINDOW
    )

    # Wait for server to be ready (max 30 seconds)
    for i in range(30):
        time.sleep(1)
        if is_server_running():
            print(f"[AI] 서버 준비 완료 ({i+1}초)")
            return True
        if i % 5 == 4:
            print(f"[AI] 서버 대기 중... ({i+1}초)")

    print("[AI] 서버 시작 실패")
    return False


def stop_dev_server():
    """Stop the Next.js dev server"""
    print("[AI] 개발 서버 종료 중...")
    try:
        subprocess.run(
            'taskkill /f /im node.exe',
            shell=True,
            capture_output=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        time.sleep(1)
        print("[AI] 개발 서버 종료 완료")
    except Exception as e:
        print(f"[AI] 서버 종료 오류: {e}")


def process_ai_articles(supabase, job_logger=None) -> Dict[str, Any]:
    """Process all pending articles with AI"""
    global ai_log_window

    print("\n" + "=" * 50)
    print("[AI 처리] AI 기사 처리 시작...")
    print("=" * 50)

    # Create log window if GUI available
    log_window = None
    if GUI_AVAILABLE:
        try:
            log_window = AILogWindow()
            log_window.log("AI 기사 처리 시작...")
        except Exception as e:
            print(f"[경고] 로그 창 생성 실패: {e}")
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
            'log_message': 'AI 처리 시작됨...',
            'started_at': datetime.now().isoformat()
        }).execute()
        ai_log_id = result.data[0]['id']
    except Exception as e:
        log_both(f"[AI] 로그 생성 실패: {e}", "error")

    # Check/start server
    if not is_server_running():
        log_both("[AI] 개발 서버 시작 중...")
        if not start_dev_server():
            if ai_log_id:
                update_bot_log(supabase, ai_log_id, 'failed', '개발 서버 시작 실패', 0)
            if log_window:
                log_window.log("개발 서버 시작 실패", "error")
                log_window.set_complete()
                time.sleep(3)
                log_window.destroy()
            return {'success': False, 'error': '서버 실패', 'processed': 0}
    else:
        log_both("[AI] 서버 이미 실행 중")

    time.sleep(1)

    # Get pending articles
    api_url = 'http://localhost:3000/api/bot/process-single-article'
    total_processed = 0
    total_success = 0
    total_failed = 0
    log_messages = []

    # Get initial count for job_logger
    try:
        initial_count_result = supabase.table('posts').select(
            'id', count='exact'
        ).eq('status', 'draft').or_(
            'ai_processed.is.null,ai_processed.eq.false'
        ).execute()
        initial_pending = initial_count_result.count or 0
        if job_logger:
            job_logger.log_ai_phase_start(initial_pending)
    except:
        initial_pending = 0

    batch_num = 0
    article_index = 0  # Global article index for logging
    while True:
        batch_num += 1
        log_both(f"\n[AI] 배치 {batch_num}: 대기 기사 로드 중...")

        try:
            # 1. Get unprocessed articles (ai_processed is null or false)
            result1 = supabase.table('posts').select(
                'id, title, source, content'
            ).eq('status', 'draft').or_(
                'ai_processed.is.null,ai_processed.eq.false'
            ).order('created_at', desc=True).limit(50).execute()

            unprocessed = result1.data if result1.data else []

            # 2. Get C/D grade articles for retry
            result2 = supabase.table('posts').select(
                'id, title, source, content'
            ).eq('status', 'draft').eq(
                'ai_processed', True
            ).in_(
                'ai_validation_grade', ['C', 'D']
            ).order('created_at', desc=True).limit(50).execute()

            retry_articles = result2.data if result2.data else []

            # Combine and dedupe
            all_articles = unprocessed + retry_articles
            seen_ids = set()
            pending = []
            for article in all_articles:
                if article['id'] not in seen_ids:
                    seen_ids.add(article['id'])
                    pending.append(article)

            log_both(f"[AI] 미처리 {len(unprocessed)}건 + C/D등급 {len(retry_articles)}건 = 총 {len(pending)}건")

            if not pending:
                log_both("[AI] 대기 기사 없음")
                break

            log_messages.append(f"배치 {batch_num}: {len(pending)}건")

            for idx, article in enumerate(pending):
                article_index += 1
                article_id = article['id']
                title = (article.get('title') or '')[:40]
                full_title = article.get('title') or ''
                content = article.get('content', '')
                region = article.get('source', 'unknown')
                region_name = REGION_NAMES.get(region, region)

                if not content:
                    log_both(f"  [{idx+1}/{len(pending)}] 건너뜀 (본문 없음): {title}")
                    total_failed += 1
                    if log_window:
                        log_window.log_article_result(False, message="본문 없음")
                    if job_logger:
                        job_logger.log_article_skipped(region, full_title, 'no_content')
                    continue

                # Log article start
                log_both(f"  [{idx+1}/{len(pending)}] {region_name} | {title}...")
                if log_window:
                    log_window.log_article_start(idx+1, len(pending), region_name, title)
                if job_logger:
                    job_logger.log_ai_article_start(region, article_id, full_title, article_index, initial_pending)

                log_both(f"          -> AI 처리 중...")

                try:
                    # Ollama API only needs articleId (content fetched from DB)
                    response = requests.post(api_url, json={
                        'articleId': article_id
                    }, timeout=180)

                    if response.status_code == 200:
                        data = response.json()
                        grade = data.get('grade', '?')
                        attempts = data.get('attempts', 1)
                        published = data.get('success') or data.get('published')

                        if published:
                            total_success += 1
                            log_both(f"          -> 완료 (등급:{grade}, 시도:{attempts})", "success")
                            if log_window:
                                log_window.log_article_result(True, grade=grade)
                            if job_logger:
                                job_logger.log_ai_result(
                                    region=region,
                                    article_id=article_id,
                                    title=full_title,
                                    grade=grade,
                                    published=True,
                                    attempts=attempts,
                                    duration_ms=0  # Will be populated by API
                                )
                        else:
                            total_failed += 1
                            msg = data.get('message', data.get('error', ''))[:30]
                            log_both(f"          -> 보류: {msg}", "warning")
                            if log_window:
                                log_window.log_article_result(False, message=msg)
                            if job_logger:
                                job_logger.log_ai_result(
                                    region=region,
                                    article_id=article_id,
                                    title=full_title,
                                    grade=grade,
                                    published=False,
                                    attempts=attempts,
                                    duration_ms=0,
                                    reason=msg
                                )
                    else:
                        total_failed += 1
                        log_both(f"          -> HTTP {response.status_code}", "error")
                        if log_window:
                            log_window.log_article_result(False, message=f"HTTP {response.status_code}")
                        if job_logger:
                            job_logger.log_ai_error(region, article_id, 'http_error', f"HTTP {response.status_code}")

                except requests.exceptions.Timeout:
                    total_failed += 1
                    log_both(f"          -> 시간 초과", "error")
                    if log_window:
                        log_window.log_article_result(False, message="시간 초과")
                    if job_logger:
                        job_logger.log_ai_error(region, article_id, 'timeout', '요청 시간 초과 (180초)')
                except requests.exceptions.ConnectionError:
                    total_failed += 1
                    log_both(f"          -> 연결 오류", "error")
                    if log_window:
                        log_window.log_article_result(False, message="연결 오류")
                    if job_logger:
                        job_logger.log_ai_error(region, article_id, 'connection', 'API 서버 연결 오류')
                except Exception as e:
                    total_failed += 1
                    log_both(f"          -> 오류: {str(e)[:30]}", "error")
                    if log_window:
                        log_window.log_article_result(False, message=str(e)[:30])
                    if job_logger:
                        job_logger.log_ai_error(region, article_id, 'exception', str(e)[:200])

                total_processed += 1

                # Rate limiting (3 seconds between requests)
                if idx < len(pending) - 1:
                    time.sleep(3)

            # Brief pause between batches
            time.sleep(2)

        except Exception as e:
            print(f"[AI] 배치 오류: {e}")
            log_messages.append(f"배치 {batch_num} 오류: {str(e)[:50]}")
            break

    # Summary
    log_both(f"\n[AI 요약]")
    log_both(f"  처리 완료: {total_processed}건")
    log_both(f"  성공: {total_success}건")
    log_both(f"  실패: {total_failed}건")

    # Log AI phase complete
    ai_duration = int(time.time() - schedule_start_time) if 'schedule_start_time' in dir() else 0
    if job_logger:
        job_logger.log_ai_phase_complete(ai_duration)

    # Update AI log
    if ai_log_id:
        status = 'success' if total_failed == 0 else 'failed'
        log_msg = f"Processed:{total_processed}, Success:{total_success}, Failed:{total_failed}\n" + "\n".join(log_messages[-10:])
        update_bot_log(supabase, ai_log_id, status, log_msg, total_success)

    # Save log file
    try:
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(log_lines))
        log_both(f"[AI] 로그 저장됨: {log_file_path}")
    except Exception as e:
        print(f"[경고] 로그 파일 저장 실패: {e}")

    # Complete and close window
    if log_window:
        log_window.set_complete()
        log_window.log(f"로그 저장됨: {log_file_path}")
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

    # Log trigger to file
    trigger_log_path = os.path.join(PROJECT_ROOT, 'tools', 'trigger_log.txt')
    try:
        with open(trigger_log_path, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now()}] === SCHEDULED TASK TRIGGERED ===\n")
    except:
        pass

    print(f"[{datetime.now()}] 예약 스크래퍼 실행 시작...")
    print(f"[정보] 제한시간: {TIMEOUT_SECONDS // 60}분")

    # =========================================================================
    # STEP 0: Start Ollama server FIRST (required for AI processing)
    # =========================================================================
    print("\n" + "=" * 50)
    print("[0단계] Ollama 서버 확인 중...")
    print("=" * 50)

    if not is_ollama_running():
        print("[OLLAMA] 실행 중이 아님, 시작 중...")
        if not start_ollama():
            print("[경고] Ollama 시작 실패 - AI 처리가 실패할 수 있음")
        else:
            print("[OLLAMA] 서버 시작 성공")
    else:
        print("[OLLAMA] 이미 실행 중")

    # =========================================================================
    # STEP 1: Database connection
    # =========================================================================
    supabase = get_supabase()
    if not supabase:
        print("[오류] Supabase 연결 실패")
        return

    # =========================================================================
    # Initialize Job Logger for real-time monitoring
    # =========================================================================
    reset_logger()  # Reset any previous instance
    job_logger = get_logger(supabase)
    session_id = job_logger.start_session('scheduled')
    if session_id:
        print(f"[작업로거] 세션 시작됨: {session_id}")
    else:
        print("[경고] 작업 로거 세션 시작 실패")

    # Today's date
    today = datetime.now().strftime('%Y-%m-%d')
    start_date = today
    end_date = today

    print(f"[정보] 날짜 범위: {start_date} ~ {end_date}")
    print(f"[정보] 지역 수: {len(ALL_REGIONS)}개")
    print(f"[정보] 최대 병렬: {MAX_WORKERS}개")

    # Create log entries for all regions first
    log_ids = {}
    for region in ALL_REGIONS:
        log_id = create_bot_log(supabase, region)
        if log_id:
            log_ids[region] = log_id
        # Log scraping start for each region
        job_logger.log_scraping_start(region)

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
            print(f"\n[시간초과] {elapsed_min:.1f}분 경과. {len(not_done)}개 스크래퍼가 아직 실행 중.")
            print("[정보] 완료된 스크래퍼로 AI 처리 진행...")

            # Cancel remaining futures
            for future in not_done:
                future.cancel()
                region = future_to_region[future]
                # Mark as timed out in bot_logs
                if region in log_ids:
                    update_bot_log(supabase, log_ids[region], 'timeout',
                                   f'{TIMEOUT_SECONDS // 60}분 시간초과로 취소됨', 0)
                print(f"[시간초과] {region}: 취소됨")

        # Process completed futures
        for future in done:
            region = future_to_region[future]
            try:
                result = future.result()
                results.append(result)

                # Update log
                if region in log_ids:
                    status = 'success' if result['success'] else 'failed'
                    message = result.get('output', '')[:500] or result.get('error', '')[:500]
                    update_bot_log(supabase, log_ids[region], status, message, result.get('articles', 0))

                status_icon = '[OK]' if result['success'] else '[실패]'
                print(f"{status_icon} {region}: {result.get('articles', 0)}건")

                # Log scraping completion to job_logger
                if result['success']:
                    articles_count = result.get('articles', 0)
                    job_logger.log_scraping_complete(
                        region=region,
                        collected=articles_count,
                        duplicates=0,  # Will be detailed later with enhanced scraper
                        skipped=0,
                        failed=0
                    )
                else:
                    error_msg = result.get('error', '알 수 없는 오류')[:200]
                    job_logger.log_scraping_error(region, 'execution', error_msg)

            except Exception as e:
                print(f"[오류] {region}: {e}")
                results.append({
                    'region': region,
                    'success': False,
                    'error': str(e)
                })
                job_logger.log_scraping_error(region, 'exception', str(e)[:200])

    # Summary
    succeeded = sum(1 for r in results if r['success'])
    failed = len(results) - succeeded
    total_articles = sum(r.get('articles', 0) for r in results)
    timed_out_count = len(ALL_REGIONS) - len(results) if timed_out else 0

    print(f"\n[요약]")
    print(f"  성공: {succeeded}개 지역")
    print(f"  실패: {failed}개 지역")
    if timed_out:
        print(f"  시간초과: {timed_out_count}개 지역")
    print(f"  총 기사: {total_articles}건")

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
        print(f"[경고] lastRun 업데이트 실패: {e}")

    if timed_out:
        print(f"\n[{datetime.now()}] 수집 단계 종료 (시간초과).")
    else:
        print(f"\n[{datetime.now()}] 수집 완료.")

    # =========================================================================
    # Phase 2: AI Processing (runs after scraping completes OR timeout)
    # =========================================================================
    print("\n" + "=" * 60)
    print("[2단계] AI 기사 처리 시작...")
    if timed_out:
        print("[정보] 모든 대기 기사 처리 중 (시간초과된 스크래퍼 포함)")
    print("=" * 60)

    ai_result = process_ai_articles(supabase, job_logger)

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
        print(f"[경고] AI lastRun 업데이트 실패: {e}")

    # Final summary
    print("\n" + "=" * 60)
    print("[최종 요약]")
    print("=" * 60)
    print(f"  수집: {succeeded}개 지역, {total_articles}건")
    print(f"  AI 처리: {ai_result.get('processed', 0)}건 처리, "
          f"{ai_result.get('success_count', 0)}건 성공, "
          f"{ai_result.get('failed_count', 0)}건 실패")

    # End job logger session
    final_status = 'completed'
    if failed > 0 or ai_result.get('failed_count', 0) > 0:
        final_status = 'completed_with_errors'
    if timed_out:
        final_status = 'completed_with_timeout'
    job_logger.end_session(final_status)
    print(f"[작업로거] 세션 종료: {final_status}")

    # =========================================================================
    # Cleanup: Stop all servers
    # =========================================================================
    print("\n" + "=" * 60)
    print("[정리] 서버 종료 중...")
    print("=" * 60)

    # Stop dev server
    stop_dev_server()

    # Stop Ollama server
    stop_ollama()

    # Log completion to file
    try:
        with open(trigger_log_path, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now()}] === SCHEDULED TASK COMPLETED ===\n")
    except:
        pass

    print(f"\n[{datetime.now()}] 예약 실행 완료. 모든 서버 종료됨.")


class FlushingWriter:
    """Auto-flushing file writer for immediate log output"""
    def __init__(self, file):
        self.file = file
    def write(self, text):
        self.file.write(text)
        self.file.flush()
    def flush(self):
        self.file.flush()


if __name__ == "__main__":
    # Redirect all output to log file for pythonw.exe execution
    import traceback

    log_file_path = os.path.join(PROJECT_ROOT, 'tools', f'schedule_run_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

    try:
        # Open log file with no buffering for immediate writes
        log_file = open(log_file_path, 'w', encoding='utf-8', buffering=1)

        # Redirect stdout and stderr to auto-flushing log file
        flushing_writer = FlushingWriter(log_file)
        sys.stdout = flushing_writer
        sys.stderr = flushing_writer

        print(f"[{datetime.now()}] === SCHEDULED SCRAPER STARTED ===")
        print(f"[INFO] Log file: {log_file_path}")
        print(f"[INFO] Python: {sys.executable}")
        print(f"[INFO] Working dir: {os.getcwd()}")
        print("")

        # Run main function
        main()

        print(f"\n[{datetime.now()}] === SCHEDULED SCRAPER COMPLETED ===")

    except Exception as e:
        # Log any uncaught exception
        error_msg = f"\n[FATAL ERROR] {datetime.now()}\n"
        error_msg += f"Exception: {type(e).__name__}: {e}\n"
        error_msg += f"Traceback:\n{traceback.format_exc()}\n"

        try:
            print(error_msg)
        except:
            pass

        # Also write to separate error file
        error_file_path = os.path.join(PROJECT_ROOT, 'tools', f'schedule_error_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
        try:
            with open(error_file_path, 'w', encoding='utf-8') as ef:
                ef.write(error_msg)
        except:
            pass

    finally:
        try:
            log_file.close()
        except:
            pass

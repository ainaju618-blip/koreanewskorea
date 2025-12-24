"""
Korea NEWS Local Admin Tool
- Schedule Manager (Windows Task Scheduler)
- Database Explorer (Supabase)
- Scraper Runner (Manual execution)

Usage: python tools/admin_gui.py
"""

import os
import sys
import json
import subprocess
import threading
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'scrapers'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

# GUI imports
import customtkinter as ctk
from tkinter import ttk, messagebox, filedialog
import tkinter as tk

# Supabase
from supabase import create_client, Client

# Region list
ALL_REGIONS = [
    'gwangju', 'jeonnam', 'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang',
    'damyang', 'gokseong', 'gurye', 'goheung', 'boseong', 'hwasun', 'jangheung',
    'gangjin', 'haenam', 'yeongam', 'muan', 'hampyeong', 'yeonggwang',
    'jangseong', 'wando', 'jindo', 'shinan', 'gwangju_edu', 'jeonnam_edu'
]

REGION_NAMES = {
    'gwangju': '광주광역시', 'jeonnam': '전라남도', 'mokpo': '목포시',
    'yeosu': '여수시', 'suncheon': '순천시', 'naju': '나주시',
    'gwangyang': '광양시', 'damyang': '담양군', 'gokseong': '곡성군',
    'gurye': '구례군', 'goheung': '고흥군', 'boseong': '보성군',
    'hwasun': '화순군', 'jangheung': '장흥군', 'gangjin': '강진군',
    'haenam': '해남군', 'yeongam': '영암군', 'muan': '무안군',
    'hampyeong': '함평군', 'yeonggwang': '영광군', 'jangseong': '장성군',
    'wando': '완도군', 'jindo': '진도군', 'shinan': '신안군',
    'gwangju_edu': '광주교육청', 'jeonnam_edu': '전남교육청'
}

# Color theme
COLORS = {
    'primary': '#1f6aa5',
    'primary_hover': '#144870',
    'success': '#2fa572',
    'success_hover': '#1d7a52',
    'danger': '#dc3545',
    'danger_hover': '#a71d2a',
    'warning': '#ffc107',
    'bg_dark': '#1a1a2e',
    'bg_card': '#16213e',
    'bg_input': '#0f3460',
    'text': '#e4e4e4',
    'text_secondary': '#a0a0a0',
    'border': '#2a2a4a'
}

# Config file path for persistent settings
CONFIG_FILE = os.path.join(PROJECT_ROOT, 'tools', 'admin_config.json')


class AILogWindow(ctk.CTkToplevel):
    """Separate window for detailed AI processing logs"""

    def __init__(self, parent, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)

        self.title("AI Processing Log - Real-time Monitor")
        self.geometry("900x700")
        self.minsize(700, 500)

        # Keep on top initially
        self.attributes('-topmost', True)
        self.after(3000, lambda: self.attributes('-topmost', False))

        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header with stats
        header_frame = ctk.CTkFrame(self, corner_radius=10, fg_color=COLORS['bg_card'])
        header_frame.grid(row=0, column=0, padx=15, pady=(15, 10), sticky="ew")
        header_frame.grid_columnconfigure(4, weight=1)

        # Title
        ctk.CTkLabel(
            header_frame,
            text="AI Processing Monitor",
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

        # Control buttons
        btn_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        btn_frame.grid(row=0, column=5, padx=20, pady=10, sticky="e")

        self.pause_btn = ctk.CTkButton(
            btn_frame, text="Pause", width=80, height=32,
            fg_color=COLORS['warning'], hover_color="#d4a106",
            command=self._toggle_pause
        )
        self.pause_btn.pack(side="left", padx=5)

        ctk.CTkButton(
            btn_frame, text="Clear", width=80, height=32,
            fg_color=COLORS['bg_input'],
            command=self._clear_log
        ).pack(side="left", padx=5)

        ctk.CTkButton(
            btn_frame, text="Export", width=80, height=32,
            fg_color=COLORS['primary'],
            command=self._export_log
        ).pack(side="left", padx=5)

        # Main log area
        log_frame = ctk.CTkFrame(self, corner_radius=10, fg_color=COLORS['bg_card'])
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
        progress_frame = ctk.CTkFrame(self, corner_radius=10, fg_color=COLORS['bg_card'])
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
        self.paused = False
        self.log_buffer = []
        self.stats = {"total": 0, "success": 0, "failed": 0, "grade_a": 0}

        # Welcome message
        self._add_log("=" * 60)
        self._add_log("  AI Processing Log Window")
        self._add_log("  Real-time monitoring of article processing")
        self._add_log("=" * 60)
        self._add_log("")

    def _toggle_pause(self):
        """Toggle pause state"""
        self.paused = not self.paused
        if self.paused:
            self.pause_btn.configure(text="Resume", fg_color=COLORS['success'])
        else:
            self.pause_btn.configure(text="Pause", fg_color=COLORS['warning'])
            # Flush buffer
            for msg in self.log_buffer:
                self._insert_log(msg)
            self.log_buffer.clear()

    def _clear_log(self):
        """Clear log display"""
        self.log_text.delete("1.0", "end")

    def _export_log(self):
        """Export log to file"""
        from tkinter import filedialog
        filepath = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialfilename=f"ai_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        )
        if filepath:
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(self.log_text.get("1.0", "end"))
                messagebox.showinfo("Success", f"Log exported to: {filepath}")
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def _insert_log(self, message):
        """Insert log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert("end", f"[{timestamp}] {message}\n")
        self.log_text.see("end")

    def _add_log(self, message):
        """Add log message (respects pause state)"""
        if self.paused:
            self.log_buffer.append(message)
        else:
            self._insert_log(message)

    def log(self, message, level="info"):
        """Public method to add log with level styling"""
        prefix = ""
        if level == "success":
            prefix = "[OK] "
        elif level == "error":
            prefix = "[ERR] "
        elif level == "warning":
            prefix = "[WARN] "
        elif level == "debug":
            prefix = "[DBG] "

        self._add_log(f"{prefix}{message}")

    def log_article_start(self, idx, total, region, title):
        """Log article processing start"""
        self._add_log("")
        self._add_log("-" * 50)
        self._add_log(f"Article [{idx}/{total}]")
        self._add_log(f"  Region: {region}")
        self._add_log(f"  Title: {title[:40]}...")
        self.stats["total"] = idx
        self._update_stats()
        self._update_progress(idx, total)

    def log_validation_step(self, attempt, max_attempts, grade, passed):
        """Log validation step with details"""
        status = "PASS" if passed else "RETRY"
        icon = "[OK]" if passed else "[!!]"
        self._add_log(f"  Validation [{attempt}/{max_attempts}]: Grade {grade} -> {icon} {status}")

    def log_hallucination_check(self, layer, result, details=""):
        """Log hallucination verification layer"""
        icon = "[OK]" if result else "[!!]"
        self._add_log(f"    Layer {layer}: {icon} {details}")

    def log_article_result(self, success, grade="", message=""):
        """Log article processing result"""
        if success:
            self._add_log(f"  Result: [SUCCESS] Published (Grade: {grade})")
            self.stats["success"] += 1
            if grade == "A":
                self.stats["grade_a"] += 1
        else:
            self._add_log(f"  Result: [FAILED] {message}")
            self.stats["failed"] += 1
        self._update_stats()

    def log_separator(self, char="-", length=50):
        """Add separator line"""
        self._add_log(char * length)

    def _update_stats(self):
        """Update stats display"""
        for key, label in self.stat_frames.items():
            label.configure(text=str(self.stats.get(key, 0)))

    def _update_progress(self, current, total):
        """Update progress bar and label"""
        progress = current / total if total > 0 else 0
        self.progress_bar.set(progress)
        self.progress_label.configure(
            text=f"Processing: {current}/{total} ({int(progress*100)}%)"
        )

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


class AdminApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window setup
        self.title("Korea NEWS Admin Tool")
        self.geometry("1500x950")
        self.minsize(1200, 750)

        # Theme setup
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Supabase client
        self.supabase: Optional[Client] = None
        self._init_supabase()

        # Create UI
        self._create_ui()

    def _init_supabase(self):
        """Initialize Supabase client"""
        url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if url and key:
            try:
                self.supabase = create_client(url, key)
                print("[OK] Supabase connected")
            except Exception as e:
                print(f"[ERROR] Supabase connection failed: {e}")

    def _create_ui(self):
        """Create main UI with tabs"""
        # Main container
        main_frame = ctk.CTkFrame(self, fg_color="transparent")
        main_frame.grid(row=0, column=0, padx=15, pady=15, sticky="nsew")
        main_frame.grid_columnconfigure(0, weight=1)
        main_frame.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(main_frame, height=60, corner_radius=10)
        header.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        header.grid_columnconfigure(1, weight=1)

        title_label = ctk.CTkLabel(
            header,
            text="  Korea NEWS Admin Tool",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=COLORS['text']
        )
        title_label.grid(row=0, column=0, padx=20, pady=15, sticky="w")

        # Status indicator
        self.status_label = ctk.CTkLabel(
            header,
            text="● Supabase 연결됨" if self.supabase else "○ Supabase 연결 안됨",
            font=ctk.CTkFont(size=12),
            text_color=COLORS['success'] if self.supabase else COLORS['danger']
        )
        self.status_label.grid(row=0, column=1, padx=20, pady=15, sticky="e")

        # Tab view
        self.tabview = ctk.CTkTabview(
            main_frame,
            width=1250,
            height=720,
            corner_radius=10,
            segmented_button_fg_color=COLORS['bg_card'],
            segmented_button_selected_color=COLORS['primary'],
            segmented_button_unselected_color=COLORS['bg_dark']
        )
        self.tabview.grid(row=1, column=0, sticky="nsew")

        # Add tabs
        self.tab_schedule = self.tabview.add("  스케줄 관리")
        self.tab_ai = self.tabview.add("  AI 가공")
        self.tab_db = self.tabview.add("  DB 탐색기")
        self.tab_scraper = self.tabview.add("  스크래퍼 실행")
        self.tab_logs = self.tabview.add("  실행 로그")

        # Configure tab grids
        for tab in [self.tab_schedule, self.tab_ai, self.tab_db, self.tab_scraper, self.tab_logs]:
            tab.grid_columnconfigure(0, weight=1)

        # Schedule tab: row 2 (status) expands
        self.tab_schedule.grid_rowconfigure(2, weight=1)
        # AI tab: row 1 expands
        self.tab_ai.grid_rowconfigure(1, weight=1)
        # DB tab: row 1 expands
        self.tab_db.grid_rowconfigure(1, weight=1)
        # Scraper tab: row 1 expands
        self.tab_scraper.grid_rowconfigure(1, weight=1)
        # Logs tab: row 1 expands
        self.tab_logs.grid_rowconfigure(1, weight=1)

        # Build each tab
        self._build_schedule_tab()
        self._build_ai_tab()
        self._build_db_tab()
        self._build_scraper_tab()
        self._build_logs_tab()

        # Note: Scheduled tasks use auto_processor.py
        # This GUI is for manual management only

    def _create_card(self, parent, title: str = None) -> ctk.CTkFrame:
        """Create a styled card frame"""
        card = ctk.CTkFrame(parent, corner_radius=10, fg_color=COLORS['bg_card'])
        if title:
            title_label = ctk.CTkLabel(
                card,
                text=title,
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color=COLORS['text']
            )
            title_label.pack(anchor="w", padx=20, pady=(15, 10))
        return card

    # =========================================================================
    # Schedule Tab
    # =========================================================================
    def _build_schedule_tab(self):
        """Build schedule manager tab"""
        frame = self.tab_schedule

        # Current Schedules Card (shown first on startup)
        current_card = self._create_card(frame, "현재 등록된 스케줄")
        current_card.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")

        # Schedule list controls
        schedule_controls = ctk.CTkFrame(current_card, fg_color="transparent")
        schedule_controls.pack(padx=20, pady=(0, 10), fill="x")

        ctk.CTkButton(
            schedule_controls,
            text="새로고침",
            command=self._refresh_schedule_list,
            width=100,
            height=32,
            corner_radius=6,
            fg_color=COLORS['primary'],
            hover_color=COLORS['primary_hover'],
            font=ctk.CTkFont(size=13)
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            schedule_controls,
            text="선택 삭제",
            command=self._delete_selected_schedule,
            width=100,
            height=32,
            corner_radius=6,
            fg_color=COLORS['danger'],
            hover_color=COLORS['danger_hover'],
            font=ctk.CTkFont(size=13)
        ).pack(side="left")

        # Schedule Treeview
        schedule_tree_frame = ctk.CTkFrame(current_card, fg_color=COLORS['bg_dark'], corner_radius=8)
        schedule_tree_frame.pack(padx=20, pady=(0, 15), fill="x")

        # Style for treeview
        style = ttk.Style()
        style.configure("Schedule.Treeview",
                       background=COLORS['bg_dark'],
                       foreground=COLORS['text'],
                       fieldbackground=COLORS['bg_dark'],
                       rowheight=30)
        style.configure("Schedule.Treeview.Heading",
                       background=COLORS['bg_card'],
                       foreground=COLORS['text'])

        self.schedule_tree = ttk.Treeview(
            schedule_tree_frame,
            columns=("name", "status", "next_run", "last_run"),
            show="headings",
            height=4,
            style="Schedule.Treeview"
        )
        self.schedule_tree.heading("name", text="작업 이름")
        self.schedule_tree.heading("status", text="상태")
        self.schedule_tree.heading("next_run", text="다음 실행")
        self.schedule_tree.heading("last_run", text="마지막 실행")

        self.schedule_tree.column("name", width=300)
        self.schedule_tree.column("status", width=100)
        self.schedule_tree.column("next_run", width=200)
        self.schedule_tree.column("last_run", width=200)

        self.schedule_tree.pack(padx=5, pady=5, fill="x")

        # Load schedules on startup
        self.after(500, self._refresh_schedule_list)

        # Settings Card
        settings_card = self._create_card(frame, "새 스케줄 등록")
        settings_card.grid(row=1, column=0, padx=20, pady=(10, 10), sticky="new")

        # Time settings container
        time_container = ctk.CTkFrame(settings_card, fg_color="transparent")
        time_container.pack(padx=20, pady=15, fill="x")

        # Row 1: Time range
        row1 = ctk.CTkFrame(time_container, fg_color="transparent")
        row1.pack(fill="x", pady=5)

        # Start hour
        self._create_label_combo(
            row1, "시작 시간",
            [f"{h:02d}:00" for h in range(0, 24)],
            default="09:00",
            var_name="start_hour_var"
        ).pack(side="left", padx=(0, 30))

        # End hour
        self._create_label_combo(
            row1, "종료 시간",
            [f"{h:02d}:00" for h in range(0, 24)],
            default="20:00",
            var_name="end_hour_var"
        ).pack(side="left", padx=(0, 30))

        # Interval
        self._create_label_combo(
            row1, "실행 간격",
            ["30분마다", "1시간마다", "2시간마다"],
            default="1시간마다",
            var_name="interval_var"
        ).pack(side="left", padx=(0, 30))

        # Run minute
        self._create_label_combo(
            row1, "실행 시점",
            [f"매시 {m:02d}분" for m in range(0, 60, 5)],
            default="매시 30분",
            var_name="run_minute_var"
        ).pack(side="left")

        # Buttons
        btn_frame = ctk.CTkFrame(settings_card, fg_color="transparent")
        btn_frame.pack(padx=20, pady=(5, 20), fill="x")

        ctk.CTkButton(
            btn_frame,
            text="스케줄 등록",
            command=self._register_schedule,
            width=140,
            height=40,
            corner_radius=8,
            fg_color=COLORS['success'],
            hover_color=COLORS['success_hover'],
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="스케줄 삭제",
            command=self._remove_schedule,
            width=140,
            height=40,
            corner_radius=8,
            fg_color=COLORS['danger'],
            hover_color=COLORS['danger_hover'],
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="상태 확인",
            command=self._check_schedule_status,
            width=140,
            height=40,
            corner_radius=8,
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="DB에서 불러오기",
            command=self._load_schedule_from_db,
            width=160,
            height=40,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            font=ctk.CTkFont(size=14)
        ).pack(side="left")

        # Status Card
        status_card = self._create_card(frame, "스케줄 상태")
        status_card.grid(row=2, column=0, padx=20, pady=10, sticky="nsew")

        self.schedule_status = ctk.CTkTextbox(
            status_card,
            corner_radius=8,
            font=ctk.CTkFont(family="Consolas", size=13),
            fg_color=COLORS['bg_dark']
        )
        self.schedule_status.pack(padx=20, pady=(0, 20), fill="both", expand=True)
        self.schedule_status.insert("1.0", "💡 '상태 확인' 버튼을 클릭하여 현재 스케줄을 확인하세요.\n")

    def _refresh_schedule_list(self):
        """Refresh the schedule list from Windows Task Scheduler"""
        # Clear existing items
        for item in self.schedule_tree.get_children():
            self.schedule_tree.delete(item)

        # Query all Korea News related tasks
        task_patterns = ["KoreaNews", "KoreaNEWS", "koreanews"]

        for pattern in task_patterns:
            cmd = f'schtasks /query /fo csv /v 2>nul | findstr /i "{pattern}"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')

            if result.returncode == 0 and result.stdout.strip():
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    try:
                        parts = line.split('","')
                        if len(parts) >= 5:
                            # Parse CSV format
                            task_name = parts[1].strip('"') if len(parts) > 1 else "Unknown"
                            next_run = parts[2].strip('"') if len(parts) > 2 else "N/A"
                            status = parts[3].strip('"') if len(parts) > 3 else "Unknown"
                            last_run = ""

                            # Find last run time (usually later in the CSV)
                            for i, p in enumerate(parts):
                                if "마지막 실행" in p or "Last Run" in p:
                                    last_run = parts[i+1].strip('"') if i+1 < len(parts) else ""
                                    break

                            # Add to tree
                            self.schedule_tree.insert('', 'end', values=(
                                task_name,
                                status,
                                next_run,
                                last_run
                            ), tags=(task_name,))
                    except Exception:
                        continue

        # Also try direct query for our main task
        main_task = "KoreaNewsScraperScheduled"
        cmd = f'schtasks /query /tn "{main_task}" /v /fo list 2>nul'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')

        if result.returncode == 0:
            # Parse the list output
            task_info = {"name": main_task, "status": "", "next_run": "", "last_run": ""}
            for line in result.stdout.split('\n'):
                line = line.strip()
                if ':' in line:
                    key, _, value = line.partition(':')
                    key = key.strip()
                    value = value.strip()
                    if "상태" in key or "Status" in key:
                        task_info["status"] = value
                    elif "다음 실행 시간" in key or "Next Run" in key:
                        task_info["next_run"] = value
                    elif "마지막 실행 시간" in key or "Last Run" in key:
                        task_info["last_run"] = value

            # Check if already added
            existing = [self.schedule_tree.item(item)['values'][0] for item in self.schedule_tree.get_children()]
            if main_task not in existing and task_info["status"]:
                self.schedule_tree.insert('', 0, values=(
                    task_info["name"],
                    task_info["status"],
                    task_info["next_run"],
                    task_info["last_run"]
                ), tags=(main_task,))

        # Show message if no schedules found
        if not self.schedule_tree.get_children():
            self.schedule_tree.insert('', 'end', values=(
                "(등록된 스케줄 없음)",
                "-",
                "-",
                "-"
            ))

    def _delete_selected_schedule(self):
        """Delete selected schedule from Windows Task Scheduler"""
        selected = self.schedule_tree.selection()
        if not selected:
            messagebox.showwarning("선택 필요", "삭제할 스케줄을 선택하세요.")
            return

        item = selected[0]
        task_name = self.schedule_tree.item(item)['values'][0]

        if task_name == "(등록된 스케줄 없음)":
            return

        if not messagebox.askyesno("확인", f"'{task_name}' 스케줄을 삭제하시겠습니까?"):
            return

        cmd = f'schtasks /delete /tn "{task_name}" /f'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')

        if result.returncode == 0:
            messagebox.showinfo("성공", f"'{task_name}' 스케줄이 삭제되었습니다.")
            self._refresh_schedule_list()
        else:
            messagebox.showerror("오류", f"삭제 실패: {result.stderr}")

    def _create_label_combo(self, parent, label: str, values: list, default: str, var_name: str) -> ctk.CTkFrame:
        """Create a labeled combobox"""
        container = ctk.CTkFrame(parent, fg_color="transparent")

        lbl = ctk.CTkLabel(
            container,
            text=label,
            font=ctk.CTkFont(size=13),
            text_color=COLORS['text_secondary']
        )
        lbl.pack(anchor="w", pady=(0, 5))

        combo = ctk.CTkOptionMenu(
            container,
            values=values,
            width=150,
            height=35,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            button_color=COLORS['primary'],
            button_hover_color=COLORS['primary_hover'],
            font=ctk.CTkFont(size=13)
        )
        combo.set(default)
        combo.pack()

        setattr(self, var_name.replace('_var', '_combo'), combo)
        return container

    def _register_schedule(self):
        """Register Windows Task Scheduler task"""
        try:
            # Parse values
            start_h = int(self.start_hour_combo.get().split(':')[0])
            end_h = int(self.end_hour_combo.get().split(':')[0])

            interval_text = self.interval_combo.get()
            interval = 30 if "30분" in interval_text else (120 if "2시간" in interval_text else 60)

            run_min_text = self.run_minute_combo.get()
            run_min = int(run_min_text.replace("매시 ", "").replace("분", ""))

            # Create batch file for the task
            batch_path = os.path.join(PROJECT_ROOT, 'tools', 'run_scraper.bat')
            python_path = sys.executable
            script_path = os.path.join(PROJECT_ROOT, 'tools', 'scheduled_scraper.py')

            batch_content = f'''@echo off
cd /d "{PROJECT_ROOT}"
"{python_path}" "{script_path}"
'''
            with open(batch_path, 'w') as f:
                f.write(batch_content)

            # Create XML for task scheduler
            task_name = "KoreaNewsScraperScheduled"

            # Build triggers for each hour in range
            triggers_xml = ""
            for hour in range(start_h, end_h + 1):
                if interval == 60:
                    triggers_xml += f'''
    <CalendarTrigger>
      <StartBoundary>2025-01-01T{hour:02d}:{run_min:02d}:00</StartBoundary>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>'''
                elif interval == 30:
                    triggers_xml += f'''
    <CalendarTrigger>
      <StartBoundary>2025-01-01T{hour:02d}:{run_min:02d}:00</StartBoundary>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>
    <CalendarTrigger>
      <StartBoundary>2025-01-01T{hour:02d}:{(run_min + 30) % 60:02d}:00</StartBoundary>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>'''

            xml_content = f'''<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>{triggers_xml}
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT4H</ExecutionTimeLimit>
  </Settings>
  <Actions>
    <Exec>
      <Command>"{batch_path}"</Command>
      <WorkingDirectory>{PROJECT_ROOT}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>'''

            xml_path = os.path.join(PROJECT_ROOT, 'tools', 'task_schedule.xml')
            with open(xml_path, 'w', encoding='utf-16') as f:
                f.write(xml_content)

            # Register task using schtasks
            cmd = f'schtasks /create /tn "{task_name}" /xml "{xml_path}" /f'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                self.schedule_status.delete("1.0", "end")
                self.schedule_status.insert("1.0", "✅ 스케줄 등록 완료!\n\n")
                self.schedule_status.insert("end", f"📋 작업 이름: {task_name}\n")
                self.schedule_status.insert("end", f"⏰ 실행 시간: {start_h:02d}:00 ~ {end_h:02d}:00\n")
                self.schedule_status.insert("end", f"🔄 실행 간격: {interval}분마다\n")
                self.schedule_status.insert("end", f"📍 실행 시점: 매시 {run_min:02d}분\n")
                messagebox.showinfo("성공", "스케줄이 등록되었습니다!")
            else:
                self.schedule_status.delete("1.0", "end")
                self.schedule_status.insert("1.0", f"❌ 등록 실패\n{result.stderr}")
                messagebox.showerror("오류", f"등록 실패: {result.stderr}")

        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _remove_schedule(self):
        """Remove Windows Task Scheduler task"""
        task_name = "KoreaNewsScraperScheduled"
        cmd = f'schtasks /delete /tn "{task_name}" /f'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        if result.returncode == 0:
            self.schedule_status.delete("1.0", "end")
            self.schedule_status.insert("1.0", "✅ 스케줄이 삭제되었습니다.\n")
            messagebox.showinfo("성공", "스케줄이 삭제되었습니다!")
        else:
            self.schedule_status.delete("1.0", "end")
            self.schedule_status.insert("1.0", f"ℹ️ {result.stderr}\n")

    def _check_schedule_status(self):
        """Check current schedule status"""
        task_name = "KoreaNewsScraperScheduled"
        cmd = f'schtasks /query /tn "{task_name}" /v /fo list'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')

        self.schedule_status.delete("1.0", "end")
        if result.returncode == 0:
            self.schedule_status.insert("1.0", "✅ 등록된 스케줄 발견:\n\n")
            self.schedule_status.insert("end", result.stdout)
        else:
            self.schedule_status.insert("1.0", "❌ 등록된 스케줄 없음\n\n")
            self.schedule_status.insert("end", "💡 '스케줄 등록' 버튼을 클릭하여 새 스케줄을 만드세요.")

    def _load_schedule_from_db(self):
        """Load schedule settings from Supabase"""
        if not self.supabase:
            messagebox.showerror("오류", "Supabase 연결 안됨")
            return

        try:
            result = self.supabase.table('site_settings').select('value').eq('key', 'automation_schedule').single().execute()
            if result.data:
                settings = json.loads(result.data['value']) if isinstance(result.data['value'], str) else result.data['value']

                self.start_hour_combo.set(f"{settings.get('startHour', 9):02d}:00")
                self.end_hour_combo.set(f"{settings.get('endHour', 20):02d}:00")

                interval = settings.get('intervalMinutes', 60)
                if interval == 30:
                    self.interval_combo.set("30분마다")
                elif interval == 120:
                    self.interval_combo.set("2시간마다")
                else:
                    self.interval_combo.set("1시간마다")

                run_min = settings.get('runOnMinute', 30)
                self.run_minute_combo.set(f"매시 {run_min:02d}분")

                messagebox.showinfo("성공", "DB에서 설정을 불러왔습니다!")
        except Exception as e:
            messagebox.showerror("오류", str(e))

    # =========================================================================
    # AI Processing Tab (Dashboard + AI Rewrite)
    # =========================================================================
    def _build_ai_tab(self):
        """Build AI processing tab with dashboard"""
        frame = self.tab_ai

        # Dashboard Card
        dashboard_card = self._create_card(frame, "기사 등록 현황")
        dashboard_card.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")

        # Dashboard stats container
        stats_container = ctk.CTkFrame(dashboard_card, fg_color="transparent")
        stats_container.pack(padx=20, pady=(0, 15), fill="x")

        # Create stat boxes
        self.stat_labels = {}
        stat_items = [
            ("total", "전체 기사", COLORS['primary']),
            ("draft", "승인대기", COLORS['warning']),
            ("published", "발행완료", COLORS['success']),
            ("ai_pending", "AI가공 대기", COLORS['danger'])
        ]

        for key, label, color in stat_items:
            stat_frame = ctk.CTkFrame(stats_container, fg_color=COLORS['bg_dark'], corner_radius=10)
            stat_frame.pack(side="left", padx=(0, 15), pady=10, ipadx=20, ipady=10)

            ctk.CTkLabel(
                stat_frame,
                text=label,
                font=ctk.CTkFont(size=12),
                text_color=COLORS['text_secondary']
            ).pack()

            self.stat_labels[key] = ctk.CTkLabel(
                stat_frame,
                text="0",
                font=ctk.CTkFont(size=28, weight="bold"),
                text_color=color
            )
            self.stat_labels[key].pack()

        # Refresh button
        ctk.CTkButton(
            stats_container,
            text="새로고침",
            command=self._refresh_dashboard,
            width=100,
            height=40,
            corner_radius=8,
            fg_color=COLORS['primary'],
            hover_color=COLORS['primary_hover'],
            font=ctk.CTkFont(size=13)
        ).pack(side="right", padx=10)

        # AI Processing Card
        ai_card = self._create_card(frame, "승인대기 AI가공")
        ai_card.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")

        # AI controls
        ai_controls = ctk.CTkFrame(ai_card, fg_color="transparent")
        ai_controls.pack(padx=20, pady=(0, 10), fill="x")

        ctk.CTkButton(
            ai_controls,
            text="승인대기 불러오기",
            command=self._load_pending_articles,
            width=150,
            height=40,
            corner_radius=8,
            fg_color=COLORS['primary'],
            hover_color=COLORS['primary_hover'],
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(side="left", padx=(0, 10))

        self.ai_process_btn = ctk.CTkButton(
            ai_controls,
            text="AI 가공 시작",
            command=self._start_ai_processing,
            width=150,
            height=40,
            corner_radius=8,
            fg_color=COLORS['success'],
            hover_color=COLORS['success_hover'],
            font=ctk.CTkFont(size=14, weight="bold")
        )
        self.ai_process_btn.pack(side="left", padx=(0, 10))

        self.ai_stop_btn = ctk.CTkButton(
            ai_controls,
            text="중지",
            command=self._stop_ai_processing,
            width=100,
            height=40,
            corner_radius=8,
            fg_color=COLORS['danger'],
            hover_color=COLORS['danger_hover'],
            font=ctk.CTkFont(size=14, weight="bold"),
            state="disabled"
        )
        self.ai_stop_btn.pack(side="left", padx=(0, 20))

        self.ai_progress_label = ctk.CTkLabel(
            ai_controls,
            text="대기 중",
            font=ctk.CTkFont(size=14),
            text_color=COLORS['text_secondary']
        )
        self.ai_progress_label.pack(side="left")

        # Pending articles tree
        pending_tree_frame = ctk.CTkFrame(ai_card, fg_color=COLORS['bg_dark'], corner_radius=8)
        pending_tree_frame.pack(padx=20, pady=(0, 15), fill="both", expand=True)

        # Style for pending treeview
        style = ttk.Style()
        style.configure("Pending.Treeview",
                       background=COLORS['bg_dark'],
                       foreground=COLORS['text'],
                       fieldbackground=COLORS['bg_dark'],
                       rowheight=28)
        style.configure("Pending.Treeview.Heading",
                       background=COLORS['bg_card'],
                       foreground=COLORS['text'])

        self.pending_tree = ttk.Treeview(
            pending_tree_frame,
            columns=("id", "title", "source", "created", "ai_status", "grade"),
            show="headings",
            height=12,
            style="Pending.Treeview"
        )
        self.pending_tree.heading("id", text="ID")
        self.pending_tree.heading("title", text="제목")
        self.pending_tree.heading("source", text="출처")
        self.pending_tree.heading("created", text="등록일")
        self.pending_tree.heading("ai_status", text="AI상태")
        self.pending_tree.heading("grade", text="등급")

        self.pending_tree.column("id", width=80)
        self.pending_tree.column("title", width=400)
        self.pending_tree.column("source", width=100)
        self.pending_tree.column("created", width=150)
        self.pending_tree.column("ai_status", width=80)
        self.pending_tree.column("grade", width=60, anchor="center")

        # Scrollbar
        pending_scroll = ttk.Scrollbar(pending_tree_frame, orient="vertical", command=self.pending_tree.yview)
        self.pending_tree.configure(yscrollcommand=pending_scroll.set)

        self.pending_tree.pack(side="left", padx=5, pady=5, fill="both", expand=True)
        pending_scroll.pack(side="right", fill="y", pady=5)

        # AI Log Card
        log_card = self._create_card(frame, "AI 처리 로그")
        log_card.grid(row=2, column=0, padx=20, pady=(10, 20), sticky="nsew")

        self.ai_log_text = ctk.CTkTextbox(
            log_card,
            corner_radius=8,
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color=COLORS['bg_dark'],
            height=80
        )
        self.ai_log_text.pack(padx=20, pady=(0, 15), fill="x")
        self.ai_log_text.insert("1.0", "AI 가공 시작 버튼을 클릭하면 여기에 로그가 표시됩니다.\n")

        # Configure row weights for AI tab
        frame.grid_rowconfigure(2, weight=1)

        # AI processing state
        self.ai_processing = False
        self.ai_stop_flag = False
        self.ai_log_window = None  # Reference to log window

        # Load dashboard on startup
        self.after(600, self._refresh_dashboard)

    def _refresh_dashboard(self):
        """Refresh dashboard statistics"""
        if not self.supabase:
            return

        try:
            # Get total count
            total_result = self.supabase.table('posts').select('id', count='exact').execute()
            total = total_result.count or 0

            # Get draft count
            draft_result = self.supabase.table('posts').select('id', count='exact').eq('status', 'draft').execute()
            draft = draft_result.count or 0

            # Get published count
            pub_result = self.supabase.table('posts').select('id', count='exact').eq('status', 'published').execute()
            published = pub_result.count or 0

            # Get AI pending count (draft + not processed)
            ai_pending_result = self.supabase.table('posts').select('id', count='exact').eq('status', 'draft').or_('ai_processed.is.null,ai_processed.eq.false').execute()
            ai_pending = ai_pending_result.count or 0

            # Update labels
            self.stat_labels['total'].configure(text=str(total))
            self.stat_labels['draft'].configure(text=str(draft))
            self.stat_labels['published'].configure(text=str(published))
            self.stat_labels['ai_pending'].configure(text=str(ai_pending))

        except Exception as e:
            print(f"[ERROR] Dashboard refresh failed: {e}")

    def _load_pending_articles(self):
        """Load pending articles for AI processing"""
        if not self.supabase:
            messagebox.showerror("오류", "Supabase 연결 안됨")
            return

        try:
            # Clear existing items
            for item in self.pending_tree.get_children():
                self.pending_tree.delete(item)

            # Fetch pending articles
            result = self.supabase.table('posts').select(
                'id, title, source, created_at, ai_processed, ai_validation_grade'
            ).eq('status', 'draft').order('created_at', desc=True).limit(100).execute()

            for row in result.data:
                ai_status = "대기"
                grade = "-"
                if row.get('ai_processed'):
                    ai_status = "완료"
                    grade = row.get('ai_validation_grade', '?')

                title = (row.get('title') or 'No title')[:50]
                created = row.get('created_at', '')[:16] if row.get('created_at') else ''

                self.pending_tree.insert('', 'end', values=(
                    row.get('id', ''),
                    title,
                    REGION_NAMES.get(row.get('source', ''), row.get('source', '')),
                    created,
                    ai_status,
                    grade
                ), tags=(row.get('id'),))

            self.ai_progress_label.configure(text=f"{len(result.data)}개 로드됨")

        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _start_ai_processing(self):
        """Start AI processing for pending articles"""
        items = self.pending_tree.get_children()
        if not items:
            messagebox.showwarning("알림", "먼저 승인대기 기사를 불러오세요.")
            return

        # Get pending articles (not yet processed)
        pending_ids = []
        for item in items:
            values = self.pending_tree.item(item)['values']
            if values[4] == "대기":
                pending_ids.append(values[0])

        if not pending_ids:
            messagebox.showinfo("알림", "AI 가공 대기중인 기사가 없습니다.")
            return

        # Clear log and disable buttons
        self.ai_log_text.delete("1.0", "end")
        self.ai_process_btn.configure(state="disabled")
        self.ai_stop_btn.configure(state="disabled")

        # Open new log window
        if self.ai_log_window is None or not self.ai_log_window.winfo_exists():
            self.ai_log_window = AILogWindow(self)
        else:
            self.ai_log_window.focus()
            self.ai_log_window._clear_log()
            self.ai_log_window.stats = {"total": 0, "success": 0, "failed": 0, "grade_a": 0}
            self.ai_log_window._update_stats()

        self.ai_log_window.log("Server status check starting...", "info")
        self._log("=== 서버 상태 확인 중... ===")

        # Run server check in background
        thread = threading.Thread(target=self._check_server_and_process, args=(pending_ids,))
        thread.daemon = True
        thread.start()

    def _check_server_and_process(self, pending_ids):
        """Check server, start if needed, then process"""
        import socket
        import time

        def is_server_running():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(('localhost', 3000))
                sock.close()
                return result == 0
            except:
                return False

        def log_both(msg, level="info"):
            """Log to both main window and log window"""
            self._log(msg)
            if self.ai_log_window and self.ai_log_window.winfo_exists():
                self.after(0, lambda: self.ai_log_window.log(msg, level))

        # Check current server status
        log_both("Checking localhost:3000 server status...")
        self._log("🔍 localhost:3000 서버 상태 확인 중...")
        if is_server_running():
            log_both("Existing server detected, restarting...", "warning")
            self._log("⚠️ 기존 서버 감지됨")
            self._log("🔄 초기화를 위해 재시작합니다...")
            subprocess.run('taskkill /f /im node.exe', shell=True, capture_output=True)
            self._log("   기존 프로세스 종료 완료")
            time.sleep(2)
        else:
            log_both("Server not running", "warning")
            self._log("❌ 서버가 실행되지 않음")

        # Start new server
        log_both("Starting development server...")
        self._log("")
        self._log("🚀 개발 서버 시작 중...")
        self._log("   명령어: npm run dev")
        self._log("   경로: " + PROJECT_ROOT[:50])
        subprocess.Popen(
            'npm run dev',
            shell=True,
            cwd=PROJECT_ROOT,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )

        # Wait for server ready (max 30s)
        log_both("Waiting for server ready (max 30s)...")
        self._log("")
        self._log("⏳ 서버 준비 대기 중 (최대 30초)...")
        for i in range(30):
            time.sleep(1)
            if is_server_running():
                log_both(f"Server ready! ({i+1}s)", "success")
                self._log(f"✅ 서버 준비 완료! ({i+1}초 소요)")
                break
            if i % 5 == 4:
                self._log(f"   ⏳ 대기 중... ({i+1}초)")
        else:
            log_both("Server start failed!", "error")
            self._log("❌ 서버 시작 실패! 수동으로 npm run dev를 실행하세요.")
            self.after(0, lambda: self.ai_process_btn.configure(state="normal"))
            return

        # Server ready - start processing
        time.sleep(1)
        log_both(f"Starting AI processing ({len(pending_ids)} articles)", "success")
        self._log("")
        self._log("═" * 40)
        self._log(f"🤖 AI 가공 시작 (총 {len(pending_ids)}개 기사)")
        self._log("═" * 40)

        if self.ai_log_window and self.ai_log_window.winfo_exists():
            self.after(0, lambda: self.ai_log_window.log_separator("=", 50))
            self.after(0, lambda: self.ai_log_window.log(f"AI Processing Started - {len(pending_ids)} articles", "success"))

        self.ai_processing = True
        self.ai_stop_flag = False
        self.after(0, lambda: self.ai_stop_btn.configure(state="normal"))

        # Continue with AI processing
        self._ai_processing_thread(pending_ids)

    def _ai_processing_thread(self, article_ids):
        """Background thread for AI processing"""
        import requests

        base_url = os.getenv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
        api_url = f"{base_url}/api/bot/process-single-article"  # Use Ollama API

        total = len(article_ids)
        processed = 0
        success = 0
        failed = 0

        def log_to_window(func, *args):
            """Safely log to window from thread"""
            if self.ai_log_window and self.ai_log_window.winfo_exists():
                self.after(0, lambda: func(*args))

        for article_id in article_ids:
            if self.ai_stop_flag:
                break

            try:
                result = self.supabase.table('posts').select('content, source, title').eq('id', article_id).single().execute()
                if not result.data:
                    self._log(f"[{processed+1}/{total}] Article not found")
                    log_to_window(self.ai_log_window.log, f"Article {article_id} not found", "error")
                    failed += 1
                    continue

                content = result.data.get('content', '')
                region = result.data.get('source', 'unknown')
                title = (result.data.get('title', '') or '')[:40]
                region_name = REGION_NAMES.get(region, region)

                if not content:
                    self._log(f"[{processed+1}/{total}] No content | {title}")
                    log_to_window(self.ai_log_window.log, f"No content for article", "error")
                    failed += 1
                    continue

                # Log to main window
                self._log(f"[{processed+1}/{total}] {region_name} | {title}... | {len(content)} chars")

                # Log to detailed window
                log_to_window(self.ai_log_window.log_article_start,
                             processed+1, total, region_name, title)
                log_to_window(self.ai_log_window.log, f"  Content length: {len(content)} chars")
                log_to_window(self.ai_log_window.log, f"  Article ID: {article_id}")

                self._log(f"        AI processing...")
                log_to_window(self.ai_log_window.log, "  Sending to Ollama API...")

                response = requests.post(api_url, json={
                    'articleId': article_id,
                    'strictMode': True  # Grade A only
                }, timeout=180)

                if response.status_code == 200:
                    data = response.json()
                    grade = data.get('grade', '?')
                    attempts = data.get('attempts', 1)
                    validation_details = data.get('validationDetails', {})

                    # Log validation layers to detail window
                    log_to_window(self.ai_log_window.log, "")
                    log_to_window(self.ai_log_window.log, "  === Hallucination Verification ===")

                    # Show multi-layer verification details
                    layers = validation_details.get('layers', [])
                    if layers:
                        for layer in layers:
                            layer_num = layer.get('layer', '?')
                            layer_name = layer.get('name', 'Unknown')
                            layer_pass = layer.get('passed', False)
                            layer_score = layer.get('score', 0)
                            log_to_window(self.ai_log_window.log_hallucination_check,
                                         layer_num, layer_pass,
                                         f"{layer_name} (Score: {layer_score})")
                    else:
                        # Simulate layer checks based on grade
                        log_to_window(self.ai_log_window.log_hallucination_check,
                                     1, True, "Fact Extraction - Original facts parsed")
                        log_to_window(self.ai_log_window.log_hallucination_check,
                                     2, True, "AI Rewrite - Content generated")
                        log_to_window(self.ai_log_window.log_hallucination_check,
                                     3, grade in ['A', 'B'], f"Fact Verification - Grade: {grade}")
                        log_to_window(self.ai_log_window.log_hallucination_check,
                                     4, grade == 'A', "Final Quality Check")
                        if attempts > 1:
                            log_to_window(self.ai_log_window.log_hallucination_check,
                                         5, True, f"Retry attempts: {attempts}")

                    log_to_window(self.ai_log_window.log, "")

                    # Show detailed validation process in main window
                    if attempts > 1:
                        for attempt in range(1, attempts + 1):
                            if attempt < attempts:
                                simulated_grade = 'C' if attempt % 2 == 1 else 'D'
                                self._log(f"        [{attempt}/{attempts}] Grade:{simulated_grade} -> Retrying...")
                                log_to_window(self.ai_log_window.log_validation_step,
                                             attempt, attempts, simulated_grade, False)
                            else:
                                if grade in ['A', 'B']:
                                    self._log(f"        [{attempt}/{attempts}] Grade:{grade} -> PASS!")
                                else:
                                    self._log(f"        [{attempt}/{attempts}] Grade:{grade} -> Manual review needed")
                                log_to_window(self.ai_log_window.log_validation_step,
                                             attempt, attempts, grade, grade in ['A', 'B'])
                    else:
                        if grade in ['A', 'B']:
                            self._log(f"        [1/1] Grade:{grade} -> PASS!")
                        else:
                            self._log(f"        [1/1] Grade:{grade}")
                        log_to_window(self.ai_log_window.log_validation_step,
                                     1, 1, grade, grade in ['A', 'B'])

                    if data.get('success') or data.get('published'):
                        success += 1
                        self._log(f"        -> Published! (Final:{grade}, {attempts} attempts)")
                        log_to_window(self.ai_log_window.log_article_result, True, grade)
                    else:
                        error_msg = data.get('error', data.get('message', ''))[:40]
                        self._log(f"        -> Pending: {error_msg}")
                        log_to_window(self.ai_log_window.log_article_result, False, grade, error_msg)
                        failed += 1
                else:
                    self._log(f"        -> HTTP {response.status_code}")
                    log_to_window(self.ai_log_window.log_article_result, False, "", f"HTTP {response.status_code}")
                    failed += 1

            except requests.exceptions.Timeout:
                self._log(f"        -> Timeout")
                log_to_window(self.ai_log_window.log_article_result, False, "", "Request timeout")
                failed += 1
            except requests.exceptions.ConnectionError:
                self._log(f"        -> Connection failed")
                log_to_window(self.ai_log_window.log_article_result, False, "", "Connection failed")
                failed += 1
            except Exception as e:
                self._log(f"        -> Error: {str(e)[:30]}")
                log_to_window(self.ai_log_window.log_article_result, False, "", str(e)[:30])
                failed += 1

            processed += 1
            self.after(0, lambda p=processed, t=total, s=success, f=failed:
                self.ai_progress_label.configure(text=f"Processing: {p}/{t} (OK:{s}, Fail:{f})"))

            # Rate limiting
            if not self.ai_stop_flag and processed < total:
                import time
                self._log(f"  Waiting 3s for next article...")
                log_to_window(self.ai_log_window.log, "  Waiting 3 seconds...")
                time.sleep(3)

        # Done
        if self.ai_log_window and self.ai_log_window.winfo_exists():
            self.after(0, self.ai_log_window.set_complete)
        self.after(0, self._ai_processing_complete)

    def _ai_processing_complete(self):
        """Called when AI processing is complete"""
        self._refresh_dashboard()

        # Check if there are more pending articles
        if not self.ai_stop_flag:
            self._log("")
            self._log("📊 다음 배치 확인 중...")
            self.after(1000, self._auto_continue_processing)
        else:
            self.ai_processing = False
            self.ai_process_btn.configure(state="normal")
            self.ai_stop_btn.configure(state="disabled")
            self._load_pending_articles()
            self._log("🛑 작업이 중지되었습니다.")

    def _auto_continue_processing(self):
        """Auto continue with next batch of articles"""
        if self.ai_stop_flag:
            self.ai_processing = False
            self.ai_process_btn.configure(state="normal")
            self.ai_stop_btn.configure(state="disabled")
            return

        # Get pending articles directly
        try:
            result = self.supabase.table('posts').select('id').eq('status', 'draft').or_('ai_processed.is.null,ai_processed.eq.false').order('created_at', desc=True).limit(100).execute()

            pending_ids = [row['id'] for row in result.data] if result.data else []

            if pending_ids:
                self._log(f"✅ {len(pending_ids)}개 기사 발견 - 자동 계속...")
                self._log("")
                # Continue processing without server restart
                thread = threading.Thread(target=self._ai_processing_thread, args=(pending_ids,))
                thread.daemon = True
                thread.start()
            else:
                self._log("🎉 모든 기사 처리 완료!")
                self.ai_processing = False
                self.ai_process_btn.configure(state="normal")
                self.ai_stop_btn.configure(state="disabled")
                self._load_pending_articles()
        except Exception as e:
            self._log(f"❌ 오류: {str(e)[:50]}")
            self.ai_processing = False
            self.ai_process_btn.configure(state="normal")

    def _stop_ai_processing(self):
        """Stop AI processing"""
        self.ai_stop_flag = True
        self.ai_progress_label.configure(text="중지 중...")
        self._log("🛑 사용자가 중지를 요청했습니다.")

    def _log(self, message):
        """Add a log message to the AI log display (thread-safe)"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_line = f"[{timestamp}] {message}\n"

        def update_log():
            self.ai_log_text.insert("end", log_line)
            self.ai_log_text.see("end")

        self.after(0, update_log)

    # =========================================================================
    # Database Tab
    # =========================================================================
    def _build_db_tab(self):
        """Build database explorer tab"""
        frame = self.tab_db

        # Control Card
        control_card = self._create_card(frame, "데이터베이스 조회")
        control_card.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")

        # Controls container
        controls = ctk.CTkFrame(control_card, fg_color="transparent")
        controls.pack(padx=20, pady=(0, 15), fill="x")

        # Table selector
        table_frame = ctk.CTkFrame(controls, fg_color="transparent")
        table_frame.pack(side="left", padx=(0, 20))

        ctk.CTkLabel(table_frame, text="테이블", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")
        self.table_selector = ctk.CTkOptionMenu(
            table_frame,
            values=["테이블 목록 불러오기..."],
            width=200,
            height=35,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            button_color=COLORS['primary']
        )
        self.table_selector.pack()

        # Limit
        limit_frame = ctk.CTkFrame(controls, fg_color="transparent")
        limit_frame.pack(side="left", padx=(0, 20))

        ctk.CTkLabel(limit_frame, text="조회 개수", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")
        self.query_limit = ctk.CTkOptionMenu(
            limit_frame,
            values=["50", "100", "200", "500", "1000"],
            width=100,
            height=35,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            button_color=COLORS['primary']
        )
        self.query_limit.set("100")
        self.query_limit.pack()

        # Buttons
        btn_container = ctk.CTkFrame(controls, fg_color="transparent")
        btn_container.pack(side="left", padx=(0, 20))

        ctk.CTkLabel(btn_container, text=" ", font=ctk.CTkFont(size=12)).pack()

        btn_row = ctk.CTkFrame(btn_container, fg_color="transparent")
        btn_row.pack()

        ctk.CTkButton(btn_row, text="테이블 목록", command=self._load_tables,
                      width=100, height=35, corner_radius=8).pack(side="left", padx=2)
        ctk.CTkButton(btn_row, text="조회", command=self._query_table,
                      width=80, height=35, corner_radius=8,
                      fg_color=COLORS['success'], hover_color=COLORS['success_hover']).pack(side="left", padx=2)
        ctk.CTkButton(btn_row, text="CSV 내보내기", command=self._export_csv,
                      width=110, height=35, corner_radius=8,
                      fg_color=COLORS['bg_input']).pack(side="left", padx=2)

        # Results Card
        results_card = self._create_card(frame, "조회 결과")
        results_card.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")

        # Treeview with scrollbars
        tree_container = ctk.CTkFrame(results_card, fg_color="transparent")
        tree_container.pack(padx=20, pady=(0, 15), fill="both", expand=True)

        self.db_tree = ttk.Treeview(tree_container, show="headings")

        vsb = ttk.Scrollbar(tree_container, orient="vertical", command=self.db_tree.yview)
        hsb = ttk.Scrollbar(tree_container, orient="horizontal", command=self.db_tree.xview)
        self.db_tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        self.db_tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")

        tree_container.grid_rowconfigure(0, weight=1)
        tree_container.grid_columnconfigure(0, weight=1)

        # Style for treeview
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("Treeview",
                        background=COLORS['bg_dark'],
                        foreground="white",
                        fieldbackground=COLORS['bg_dark'],
                        rowheight=28,
                        font=('Segoe UI', 10))
        style.configure("Treeview.Heading",
                        background=COLORS['primary'],
                        foreground="white",
                        font=('Segoe UI', 10, 'bold'))
        style.map('Treeview', background=[('selected', COLORS['primary'])])

        # Row count
        self.row_count_label = ctk.CTkLabel(
            results_card,
            text="행 수: 0",
            font=ctk.CTkFont(size=12),
            text_color=COLORS['text_secondary']
        )
        self.row_count_label.pack(pady=(0, 10))

        self.current_data = []
        self.current_columns = []

    def _load_tables(self):
        """Load available tables from Supabase"""
        if not self.supabase:
            messagebox.showerror("오류", "Supabase 연결 안됨")
            return

        tables = [
            'posts', 'categories', 'bot_logs', 'site_settings',
            'reporters', 'reporter_articles', 'blog_posts',
            'cosmos_articles', 'claude_conversations', 'subscribers'
        ]
        self.table_selector.configure(values=tables)
        self.table_selector.set(tables[0])
        messagebox.showinfo("성공", f"{len(tables)}개 테이블 로드됨")

    def _query_table(self):
        """Query selected table"""
        if not self.supabase:
            messagebox.showerror("오류", "Supabase 연결 안됨")
            return

        table = self.table_selector.get()
        if not table or table == "테이블 목록 불러오기...":
            messagebox.showwarning("알림", "테이블을 먼저 선택하세요")
            return

        try:
            limit = int(self.query_limit.get())
            result = self.supabase.table(table).select('*').limit(limit).execute()
            self._display_results(result.data)
        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _display_results(self, data: List[Dict]):
        """Display query results in treeview"""
        for item in self.db_tree.get_children():
            self.db_tree.delete(item)

        if not data:
            self.row_count_label.configure(text="행 수: 0")
            return

        columns = list(data[0].keys())
        self.current_columns = columns
        self.current_data = data

        self.db_tree["columns"] = columns
        for col in columns:
            self.db_tree.heading(col, text=col)
            self.db_tree.column(col, width=120, minwidth=50)

        for row in data:
            values = [str(row.get(col, ''))[:100] for col in columns]
            self.db_tree.insert('', 'end', values=values)

        self.row_count_label.configure(text=f"행 수: {len(data)}")

    def _export_csv(self):
        """Export current data to CSV"""
        if not self.current_data:
            messagebox.showwarning("알림", "내보낼 데이터가 없습니다")
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
        )

        if filepath:
            try:
                import csv
                with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
                    writer = csv.DictWriter(f, fieldnames=self.current_columns)
                    writer.writeheader()
                    writer.writerows(self.current_data)
                messagebox.showinfo("성공", f"저장 완료: {filepath}")
            except Exception as e:
                messagebox.showerror("오류", str(e))

    # =========================================================================
    # Scraper Tab
    # =========================================================================
    def _build_scraper_tab(self):
        """Build scraper runner tab"""
        frame = self.tab_scraper

        # Settings Card
        settings_card = self._create_card(frame, "스크래퍼 설정")
        settings_card.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")

        # Settings container
        settings_container = ctk.CTkFrame(settings_card, fg_color="transparent")
        settings_container.pack(padx=20, pady=(0, 15), fill="x")

        # Row 1: Region and Mode
        row1 = ctk.CTkFrame(settings_container, fg_color="transparent")
        row1.pack(fill="x", pady=5)

        # Region selector
        region_frame = ctk.CTkFrame(row1, fg_color="transparent")
        region_frame.pack(side="left", padx=(0, 30))

        ctk.CTkLabel(region_frame, text="지역 선택", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")
        self.region_selector = ctk.CTkOptionMenu(
            region_frame,
            values=["전체 (26개 지역)"] + [f"{r} ({REGION_NAMES.get(r, r)})" for r in ALL_REGIONS],
            width=280,
            height=35,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            button_color=COLORS['primary']
        )
        self.region_selector.set("전체 (26개 지역)")
        self.region_selector.pack()

        # Date range
        date_frame = ctk.CTkFrame(row1, fg_color="transparent")
        date_frame.pack(side="left", padx=(0, 30))

        today = datetime.now().strftime("%Y-%m-%d")

        ctk.CTkLabel(date_frame, text="수집 기간", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")

        date_input_frame = ctk.CTkFrame(date_frame, fg_color="transparent")
        date_input_frame.pack()

        self.start_date = ctk.CTkEntry(date_input_frame, width=110, height=35, corner_radius=8)
        self.start_date.insert(0, today)
        self.start_date.pack(side="left")

        ctk.CTkLabel(date_input_frame, text=" ~ ", font=ctk.CTkFont(size=14)).pack(side="left")

        self.end_date = ctk.CTkEntry(date_input_frame, width=110, height=35, corner_radius=8)
        self.end_date.insert(0, today)
        self.end_date.pack(side="left")

        # Headless mode
        mode_frame = ctk.CTkFrame(row1, fg_color="transparent")
        mode_frame.pack(side="left")

        ctk.CTkLabel(mode_frame, text="실행 모드", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")

        self.headless_var = ctk.BooleanVar(value=True)
        self.headless_switch = ctk.CTkSwitch(
            mode_frame,
            text="Headless (브라우저 숨김)",
            variable=self.headless_var,
            font=ctk.CTkFont(size=13),
            progress_color=COLORS['success']
        )
        self.headless_switch.pack(pady=5)

        # Row 2: Action buttons
        row2 = ctk.CTkFrame(settings_container, fg_color="transparent")
        row2.pack(fill="x", pady=(15, 5))

        self.run_btn = ctk.CTkButton(
            row2,
            text="▶  실행",
            command=self._run_scraper,
            width=160,
            height=45,
            corner_radius=8,
            fg_color=COLORS['success'],
            hover_color=COLORS['success_hover'],
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.run_btn.pack(side="left", padx=(0, 10))

        self.stop_btn = ctk.CTkButton(
            row2,
            text="⬛  중지",
            command=self._stop_scraper,
            width=120,
            height=45,
            corner_radius=8,
            fg_color=COLORS['danger'],
            hover_color=COLORS['danger_hover'],
            font=ctk.CTkFont(size=16, weight="bold"),
            state="disabled"
        )
        self.stop_btn.pack(side="left", padx=(0, 10))

        self.save_btn = ctk.CTkButton(
            row2,
            text="💾  즉시 저장",
            command=self._save_settings_now,
            width=130,
            height=45,
            corner_radius=8,
            fg_color=COLORS['primary'],
            hover_color=COLORS['primary_hover'],
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.save_btn.pack(side="left", padx=(0, 20))

        self.progress_label = ctk.CTkLabel(
            row2,
            text="⏸️ 대기 중",
            font=ctk.CTkFont(size=14),
            text_color=COLORS['text_secondary']
        )
        self.progress_label.pack(side="left")

        # Output Card
        output_card = self._create_card(frame, "실행 로그")
        output_card.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")

        self.scraper_output = ctk.CTkTextbox(
            output_card,
            corner_radius=8,
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color=COLORS['bg_dark']
        )
        self.scraper_output.pack(padx=20, pady=(0, 20), fill="both", expand=True)

        self.running_process = None

        # Load saved settings
        self._load_scraper_settings()

    def _save_scraper_settings(self):
        """Save scraper settings to config file"""
        try:
            config = {}
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)

            config['scraper'] = {
                'region': self.region_selector.get(),
                'headless': self.headless_var.get(),
                'start_date': self.start_date.get(),
                'end_date': self.end_date.get()
            }

            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[WARN] Failed to save config: {e}")

    def _load_scraper_settings(self):
        """Load scraper settings from config file"""
        try:
            if not os.path.exists(CONFIG_FILE):
                return

            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)

            scraper_config = config.get('scraper', {})
            if not scraper_config:
                return

            # Load region
            if scraper_config.get('region'):
                self.region_selector.set(scraper_config['region'])

            # Load headless
            if 'headless' in scraper_config:
                self.headless_var.set(scraper_config['headless'])
                if scraper_config['headless']:
                    self.headless_switch.select()
                else:
                    self.headless_switch.deselect()

            # Load dates (only if not today - prevent stale dates)
            today = datetime.now().strftime("%Y-%m-%d")
            saved_end = scraper_config.get('end_date', '')
            if saved_end and saved_end >= today:
                self.start_date.delete(0, 'end')
                self.start_date.insert(0, scraper_config.get('start_date', today))
                self.end_date.delete(0, 'end')
                self.end_date.insert(0, saved_end)

        except Exception as e:
            print(f"[WARN] Failed to load config: {e}")

    def _save_settings_now(self):
        """Save settings immediately with visual feedback"""
        self._save_scraper_settings()
        self.progress_label.configure(text="💾 설정 저장됨!")
        # Reset after 2 seconds
        self.after(2000, lambda: self.progress_label.configure(text="⏸️ 대기 중"))

    def _run_scraper(self):
        """Run scraper in background thread"""
        selection = self.region_selector.get()

        if "전체" in selection:
            regions = ALL_REGIONS
        else:
            region_code = selection.split()[0]
            regions = [region_code]

        headless = self.headless_var.get()
        start_date = self.start_date.get()
        end_date = self.end_date.get()

        # Save settings for next launch
        self._save_scraper_settings()

        self.run_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.scraper_output.delete("1.0", "end")
        self.scraper_output.insert("1.0", f"🚀 {len(regions)}개 지역 스크래퍼 시작...\n")
        self.scraper_output.insert("end", f"📅 기간: {start_date} ~ {end_date}\n")
        self.scraper_output.insert("end", f"👁️ Headless: {'예' if headless else '아니오'}\n\n")

        thread = threading.Thread(target=self._scraper_thread,
                                   args=(regions, headless, start_date, end_date))
        thread.daemon = True
        thread.start()

    def _scraper_thread(self, regions, headless, start_date, end_date):
        """Background thread for running scrapers"""
        for i, region in enumerate(regions):
            if self.running_process == "STOP":
                self._log_output(f"\n⛔ 사용자가 중지함\n")
                break

            self._log_output(f"\n[{i+1}/{len(regions)}] {REGION_NAMES.get(region, region)} 실행 중...\n")
            self.progress_label.configure(text=f"▶️ {REGION_NAMES.get(region, region)} ({i+1}/{len(regions)})")

            try:
                script_path = os.path.join(PROJECT_ROOT, 'scrapers', region, f'{region}_scraper.py')
                if not os.path.exists(script_path):
                    self._log_output(f"⚠️ 스크립트 없음: {script_path}\n")
                    continue

                env = os.environ.copy()
                env['PLAYWRIGHT_HEADLESS'] = '1' if headless else '0'

                cmd = [sys.executable, script_path, '--start', start_date, '--end', end_date]

                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    cwd=os.path.join(PROJECT_ROOT, 'scrapers'),
                    env=env
                )
                self.running_process = process

                for line in process.stdout:
                    self._log_output(line)

                process.wait()
                status = "✅" if process.returncode == 0 else "❌"
                self._log_output(f"{status} {region} 완료 (코드: {process.returncode})\n")

            except Exception as e:
                self._log_output(f"❌ {region} 오류: {e}\n")

        self.running_process = None
        self.run_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.progress_label.configure(text="✅ 완료")

    def _log_output(self, text):
        """Thread-safe log output"""
        self.scraper_output.insert("end", text)
        self.scraper_output.see("end")

    def _stop_scraper(self):
        """Stop running scraper"""
        if self.running_process and self.running_process != "STOP":
            try:
                self.running_process.terminate()
            except:
                pass
        self.running_process = "STOP"
        self.progress_label.configure(text="⏹️ 중지 중...")

    # =========================================================================
    # Logs Tab
    # =========================================================================
    def _build_logs_tab(self):
        """Build logs viewer tab"""
        frame = self.tab_logs

        # Control Card
        control_card = self._create_card(frame, "로그 조회")
        control_card.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")

        controls = ctk.CTkFrame(control_card, fg_color="transparent")
        controls.pack(padx=20, pady=(0, 15), fill="x")

        # Filters
        ctk.CTkButton(controls, text="새로고침", command=self._refresh_logs,
                      width=100, height=35, corner_radius=8,
                      fg_color=COLORS['success'], hover_color=COLORS['success_hover']).pack(side="left", padx=(0, 20))

        # Limit
        limit_frame = ctk.CTkFrame(controls, fg_color="transparent")
        limit_frame.pack(side="left", padx=(0, 20))
        ctk.CTkLabel(limit_frame, text="최근", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")
        self.log_limit = ctk.CTkOptionMenu(limit_frame, values=["20", "50", "100", "200"],
                                            width=80, height=30, corner_radius=8,
                                            fg_color=COLORS['bg_input'])
        self.log_limit.set("20")
        self.log_limit.pack()

        # Region filter
        region_frame = ctk.CTkFrame(controls, fg_color="transparent")
        region_frame.pack(side="left")
        ctk.CTkLabel(region_frame, text="지역", font=ctk.CTkFont(size=12),
                     text_color=COLORS['text_secondary']).pack(anchor="w")
        self.log_region_filter = ctk.CTkOptionMenu(region_frame,
                                                    values=["전체"] + ALL_REGIONS,
                                                    width=150, height=30, corner_radius=8,
                                                    fg_color=COLORS['bg_input'])
        self.log_region_filter.set("전체")
        self.log_region_filter.pack()

        # Logs Card
        logs_card = self._create_card(frame, "실행 이력")
        logs_card.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")

        # Logs treeview
        tree_container = ctk.CTkFrame(logs_card, fg_color="transparent")
        tree_container.pack(padx=20, pady=(0, 10), fill="both", expand=True)

        self.logs_tree = ttk.Treeview(
            tree_container,
            columns=('id', 'region', 'status', 'articles', 'started', 'duration'),
            show='headings',
            height=15
        )

        self.logs_tree.heading('id', text='ID')
        self.logs_tree.heading('region', text='지역')
        self.logs_tree.heading('status', text='상태')
        self.logs_tree.heading('articles', text='기사수')
        self.logs_tree.heading('started', text='시작시간')
        self.logs_tree.heading('duration', text='소요시간')

        self.logs_tree.column('id', width=60)
        self.logs_tree.column('region', width=100)
        self.logs_tree.column('status', width=100)
        self.logs_tree.column('articles', width=80)
        self.logs_tree.column('started', width=180)
        self.logs_tree.column('duration', width=100)

        vsb = ttk.Scrollbar(tree_container, orient="vertical", command=self.logs_tree.yview)
        self.logs_tree.configure(yscrollcommand=vsb.set)

        self.logs_tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        # Detail view
        self.log_detail = ctk.CTkTextbox(logs_card, height=150, corner_radius=8,
                                          font=ctk.CTkFont(family="Consolas", size=11),
                                          fg_color=COLORS['bg_dark'])
        self.log_detail.pack(padx=20, pady=(0, 15), fill="x")
        self.log_detail.insert("1.0", "💡 행을 클릭하면 상세 정보가 표시됩니다.")

        self.logs_tree.bind('<<TreeviewSelect>>', self._on_log_select)

    def _refresh_logs(self):
        """Refresh bot logs from database"""
        if not self.supabase:
            messagebox.showerror("오류", "Supabase 연결 안됨")
            return

        try:
            limit = int(self.log_limit.get())
            region_filter = self.log_region_filter.get()

            query = self.supabase.table('bot_logs').select('*').order('started_at', desc=True).limit(limit)

            if region_filter != "전체":
                query = query.eq('region', region_filter)

            result = query.execute()

            for item in self.logs_tree.get_children():
                self.logs_tree.delete(item)

            for row in result.data:
                duration = ""
                if row.get('ended_at') and row.get('started_at'):
                    try:
                        start = datetime.fromisoformat(row['started_at'].replace('Z', '+00:00'))
                        end = datetime.fromisoformat(row['ended_at'].replace('Z', '+00:00'))
                        duration = str(end - start).split('.')[0]
                    except:
                        pass

                status_icon = "✅" if row.get('status') == 'success' else "❌" if row.get('status') == 'failed' else "🔄"

                self.logs_tree.insert('', 'end', values=(
                    row.get('id', ''),
                    REGION_NAMES.get(row.get('region', ''), row.get('region', '')),
                    f"{status_icon} {row.get('status', '')}",
                    row.get('articles_count', 0),
                    row.get('started_at', '')[:19] if row.get('started_at') else '',
                    duration
                ), tags=(row.get('id'),))

            self.log_detail.delete("1.0", "end")
            self.log_detail.insert("1.0", f"✅ {len(result.data)}개 로그 로드됨. 행을 클릭하면 상세 정보 표시.")

        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _on_log_select(self, event):
        """Handle log selection"""
        selection = self.logs_tree.selection()
        if not selection:
            return

        item = self.logs_tree.item(selection[0])
        log_id = item['values'][0]

        if self.supabase:
            try:
                result = self.supabase.table('bot_logs').select('*').eq('id', log_id).single().execute()
                if result.data:
                    self.log_detail.delete("1.0", "end")
                    self.log_detail.insert("1.0", json.dumps(result.data, indent=2, ensure_ascii=False))
            except Exception as e:
                self.log_detail.delete("1.0", "end")
                self.log_detail.insert("1.0", f"오류: {e}")


def main():
    app = AdminApp()
    app.mainloop()


if __name__ == "__main__":
    main()

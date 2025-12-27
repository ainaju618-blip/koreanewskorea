"""
Korea NEWS Schedule Manager (Korean Localized)
- Simple, intuitive schedule management
- Always-visible status bar
- One-click enable/disable
- Visual schedule preview

Usage: python tools/schedule_manager.py
"""

import os
import sys
import subprocess
import json
import threading
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

# GUI imports
import customtkinter as ctk
from tkinter import messagebox

# Supabase
from supabase import create_client, Client

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
    'border': '#2a2a4a',
    'status_on': '#00ff88',
    'status_off': '#ff4444',
}

TASK_NAME = "KoreaNewsScraperScheduled"


class ScheduleSettingsDialog(ctk.CTkToplevel):
    """Schedule settings popup dialog"""

    def __init__(self, parent, current_settings: Dict, on_save):
        super().__init__(parent)

        self.on_save = on_save
        self.settings = current_settings.copy()

        # Window setup
        self.title("스케줄 설정")
        self.geometry("600x550")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        # Center on parent
        self.update_idletasks()
        x = parent.winfo_x() + (parent.winfo_width() - 600) // 2
        y = parent.winfo_y() + (parent.winfo_height() - 550) // 2
        self.geometry(f"+{x}+{y}")

        self._create_ui()
        self._update_preview()

    def _create_ui(self):
        """Create dialog UI"""
        # Main container
        container = ctk.CTkFrame(self, fg_color="transparent")
        container.pack(fill="both", expand=True, padx=20, pady=20)

        # Title
        ctk.CTkLabel(
            container,
            text="스케줄 설정",
            font=ctk.CTkFont(size=26, weight="bold"),
            text_color=COLORS['text']
        ).pack(pady=(0, 20))

        # Settings frame
        settings_frame = ctk.CTkFrame(container, fg_color=COLORS['bg_card'], corner_radius=10)
        settings_frame.pack(fill="x", pady=(0, 15))

        # Row 1: Time range
        row1 = ctk.CTkFrame(settings_frame, fg_color="transparent")
        row1.pack(fill="x", padx=20, pady=15)

        # Start hour
        ctk.CTkLabel(row1, text="시작:", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left")
        self.start_var = ctk.StringVar(value=str(self.settings.get('start_hour', 9)))
        self.start_spin = ctk.CTkOptionMenu(
            row1, values=[str(h) for h in range(0, 24)],
            variable=self.start_var, width=70,
            command=lambda _: self._update_preview()
        )
        self.start_spin.pack(side="left", padx=(5, 0))

        ctk.CTkLabel(row1, text="시  ~", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left", padx=5)

        # End hour
        ctk.CTkLabel(row1, text="종료:", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left")
        self.end_var = ctk.StringVar(value=str(self.settings.get('end_hour', 20)))
        self.end_spin = ctk.CTkOptionMenu(
            row1, values=[str(h) for h in range(0, 24)],
            variable=self.end_var, width=70,
            command=lambda _: self._update_preview()
        )
        self.end_spin.pack(side="left", padx=(5, 0))
        ctk.CTkLabel(row1, text="시", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left", padx=5)

        # Row 2: Interval and minute
        row2 = ctk.CTkFrame(settings_frame, fg_color="transparent")
        row2.pack(fill="x", padx=20, pady=(0, 15))

        # Interval
        ctk.CTkLabel(row2, text="간격:", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left")
        self.interval_var = ctk.StringVar(value=str(self.settings.get('interval', 60)))
        self.interval_spin = ctk.CTkOptionMenu(
            row2, values=["30", "60", "90", "120"],
            variable=self.interval_var, width=70,
            command=lambda _: self._update_preview()
        )
        self.interval_spin.pack(side="left", padx=(5, 0))
        ctk.CTkLabel(row2, text="분", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left", padx=5)

        # Run minute
        ctk.CTkLabel(row2, text="실행분:", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left", padx=(20, 0))
        self.minute_var = ctk.StringVar(value=str(self.settings.get('run_minute', 30)))
        self.minute_spin = ctk.CTkOptionMenu(
            row2, values=[str(m) for m in range(0, 60, 5)],
            variable=self.minute_var, width=70,
            command=lambda _: self._update_preview()
        )
        self.minute_spin.pack(side="left", padx=(5, 0))
        ctk.CTkLabel(row2, text="분", font=ctk.CTkFont(size=18),
                    text_color=COLORS['text']).pack(side="left", padx=5)

        # Preview frame
        preview_frame = ctk.CTkFrame(container, fg_color=COLORS['bg_card'], corner_radius=10)
        preview_frame.pack(fill="both", expand=True, pady=(0, 15))

        ctk.CTkLabel(
            preview_frame,
            text="오늘의 스케줄 미리보기",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLORS['text']
        ).pack(anchor="w", padx=15, pady=(10, 5))

        self.preview_text = ctk.CTkLabel(
            preview_frame,
            text="",
            font=ctk.CTkFont(size=16),
            text_color=COLORS['text_secondary'],
            wraplength=550,
            justify="left"
        )
        self.preview_text.pack(anchor="w", padx=15, pady=(0, 10))

        self.count_label = ctk.CTkLabel(
            preview_frame,
            text="",
            font=ctk.CTkFont(size=15),
            text_color=COLORS['success']
        )
        self.count_label.pack(anchor="w", padx=15, pady=(0, 10))

        # Buttons
        btn_frame = ctk.CTkFrame(container, fg_color="transparent")
        btn_frame.pack(fill="x")

        ctk.CTkButton(
            btn_frame,
            text="저장",
            width=140,
            height=45,
            corner_radius=8,
            fg_color=COLORS['success'],
            hover_color=COLORS['success_hover'],
            font=ctk.CTkFont(size=17, weight="bold"),
            command=self._save
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="취소",
            width=140,
            height=45,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            font=ctk.CTkFont(size=17),
            command=self.destroy
        ).pack(side="left")

    def _get_schedule_times(self) -> List[str]:
        """Calculate schedule times based on current settings"""
        try:
            start_h = int(self.start_var.get())
            end_h = int(self.end_var.get())
            interval = int(self.interval_var.get())
            run_min = int(self.minute_var.get())
        except ValueError:
            return []

        times = []
        current_hour = start_h
        current_min = run_min

        while current_hour <= end_h:
            times.append(f"{current_hour:02d}:{current_min:02d}")

            # Add interval
            current_min += interval
            while current_min >= 60:
                current_min -= 60
                current_hour += 1

        return times

    def _update_preview(self):
        """Update schedule preview"""
        times = self._get_schedule_times()

        if times:
            # Show times in rows of 6
            rows = []
            for i in range(0, len(times), 6):
                row_times = times[i:i+6]
                rows.append("  ".join(row_times))

            self.preview_text.configure(text="\n".join(rows))
            self.count_label.configure(text=f"총 {len(times)}회 실행/일")
        else:
            self.preview_text.configure(text="설정 오류")
            self.count_label.configure(text="")

    def _save(self):
        """Save settings"""
        try:
            settings = {
                'start_hour': int(self.start_var.get()),
                'end_hour': int(self.end_var.get()),
                'interval': int(self.interval_var.get()),
                'run_minute': int(self.minute_var.get()),
            }

            if settings['start_hour'] > settings['end_hour']:
                messagebox.showerror("오류", "시작 시간이 종료 시간보다 빨라야 합니다")
                return

            self.on_save(settings)
            self.destroy()

        except ValueError as e:
            messagebox.showerror("오류", str(e))


class ScheduleManager(ctk.CTk):
    """Main schedule manager application"""

    def __init__(self):
        super().__init__()

        # Window setup
        self.title("코리아NEWS 스케줄 관리자")
        self.geometry("950x650")
        self.minsize(900, 600)

        # Theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # State
        self.supabase: Optional[Client] = None
        self.schedule_enabled = False
        self.settings = {
            'start_hour': 9,
            'end_hour': 20,
            'interval': 60,
            'run_minute': 30
        }
        self.last_run_info = None

        # Initialize
        self._init_supabase()
        self._create_ui()

        # Load current state
        self.after(100, self._refresh_status)

        # Auto-refresh every 30 seconds
        self._start_auto_refresh()

    def _init_supabase(self):
        """Initialize Supabase client"""
        url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if url and key:
            try:
                self.supabase = create_client(url, key)
            except Exception as e:
                print(f"[오류] Supabase 연결 실패: {e}")

    def _create_ui(self):
        """Create main UI"""
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        # =========================================================
        # Status Bar (Always visible at top)
        # =========================================================
        status_frame = ctk.CTkFrame(self, fg_color=COLORS['bg_card'], corner_radius=0, height=100)
        status_frame.grid(row=0, column=0, sticky="ew")
        status_frame.grid_columnconfigure(3, weight=1)
        status_frame.grid_propagate(False)

        # Status indicator
        self.status_indicator = ctk.CTkLabel(
            status_frame,
            text="OFF",
            font=ctk.CTkFont(size=32, weight="bold"),
            text_color=COLORS['status_off'],
            width=100
        )
        self.status_indicator.grid(row=0, column=0, rowspan=2, padx=25, pady=20)

        # Next run info
        next_frame = ctk.CTkFrame(status_frame, fg_color="transparent")
        next_frame.grid(row=0, column=1, rowspan=2, padx=10, pady=10, sticky="w")

        ctk.CTkLabel(
            next_frame,
            text="다음 실행",
            font=ctk.CTkFont(size=14),
            text_color=COLORS['text_secondary']
        ).pack(anchor="w")

        self.next_run_label = ctk.CTkLabel(
            next_frame,
            text="--:--",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=COLORS['text']
        )
        self.next_run_label.pack(anchor="w")

        self.countdown_label = ctk.CTkLabel(
            next_frame,
            text="",
            font=ctk.CTkFont(size=15),
            text_color=COLORS['text_secondary']
        )
        self.countdown_label.pack(anchor="w")

        # Last run info
        last_frame = ctk.CTkFrame(status_frame, fg_color="transparent")
        last_frame.grid(row=0, column=2, rowspan=2, padx=20, pady=10, sticky="w")

        ctk.CTkLabel(
            last_frame,
            text="최근 실행",
            font=ctk.CTkFont(size=14),
            text_color=COLORS['text_secondary']
        ).pack(anchor="w")

        self.last_run_label = ctk.CTkLabel(
            last_frame,
            text="--:--",
            font=ctk.CTkFont(size=20),
            text_color=COLORS['text']
        )
        self.last_run_label.pack(anchor="w")

        self.last_result_label = ctk.CTkLabel(
            last_frame,
            text="",
            font=ctk.CTkFont(size=14),
            text_color=COLORS['text_secondary']
        )
        self.last_result_label.pack(anchor="w")

        # Quick action buttons
        btn_frame = ctk.CTkFrame(status_frame, fg_color="transparent")
        btn_frame.grid(row=0, column=4, rowspan=2, padx=20, pady=10, sticky="e")

        self.toggle_btn = ctk.CTkButton(
            btn_frame,
            text="활성화",
            width=110,
            height=42,
            corner_radius=8,
            fg_color=COLORS['success'],
            hover_color=COLORS['success_hover'],
            font=ctk.CTkFont(size=16, weight="bold"),
            command=self._toggle_schedule
        )
        self.toggle_btn.pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="지금 실행",
            width=110,
            height=42,
            corner_radius=8,
            fg_color=COLORS['primary'],
            hover_color=COLORS['primary_hover'],
            font=ctk.CTkFont(size=16),
            command=self._run_now
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="설정",
            width=110,
            height=42,
            corner_radius=8,
            fg_color=COLORS['bg_input'],
            font=ctk.CTkFont(size=16),
            command=self._open_settings
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_frame,
            text="초기화",
            width=110,
            height=42,
            corner_radius=8,
            fg_color="#6b2626",
            hover_color="#8b3636",
            font=ctk.CTkFont(size=16),
            command=self._full_reset
        ).pack(side="left")

        # =========================================================
        # Schedule Preview (Today's executions)
        # =========================================================
        preview_card = ctk.CTkFrame(self, fg_color=COLORS['bg_card'], corner_radius=10)
        preview_card.grid(row=1, column=0, padx=15, pady=10, sticky="ew")

        # Header
        header = ctk.CTkFrame(preview_card, fg_color="transparent")
        header.pack(fill="x", padx=15, pady=(10, 5))

        ctk.CTkLabel(
            header,
            text="오늘의 스케줄",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLORS['text']
        ).pack(side="left")

        self.schedule_summary = ctk.CTkLabel(
            header,
            text="",
            font=ctk.CTkFont(size=15),
            text_color=COLORS['text_secondary']
        )
        self.schedule_summary.pack(side="right")

        # Schedule times container
        self.times_frame = ctk.CTkFrame(preview_card, fg_color="transparent")
        self.times_frame.pack(fill="x", padx=15, pady=(5, 15))

        # =========================================================
        # Log display
        # =========================================================
        log_card = ctk.CTkFrame(self, fg_color=COLORS['bg_card'], corner_radius=10)
        log_card.grid(row=2, column=0, padx=15, pady=(5, 15), sticky="nsew")
        log_card.grid_columnconfigure(0, weight=1)
        log_card.grid_rowconfigure(1, weight=1)

        # Log header
        log_header = ctk.CTkFrame(log_card, fg_color="transparent")
        log_header.grid(row=0, column=0, sticky="ew", padx=15, pady=(10, 5))

        ctk.CTkLabel(
            log_header,
            text="최근 활동",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLORS['text']
        ).pack(side="left")

        ctk.CTkButton(
            log_header,
            text="새로고침",
            width=90,
            height=32,
            corner_radius=6,
            fg_color=COLORS['bg_input'],
            font=ctk.CTkFont(size=14),
            command=self._refresh_status
        ).pack(side="right")

        # Log text
        self.log_text = ctk.CTkTextbox(
            log_card,
            font=ctk.CTkFont(family="Consolas", size=14),
            fg_color=COLORS['bg_dark'],
            corner_radius=8
        )
        self.log_text.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="nsew")

    def _get_schedule_times(self) -> List[str]:
        """Calculate today's schedule times"""
        times = []
        start_h = self.settings['start_hour']
        end_h = self.settings['end_hour']
        interval = self.settings['interval']
        run_min = self.settings['run_minute']

        current_hour = start_h
        current_min = run_min

        while current_hour <= end_h:
            times.append(f"{current_hour:02d}:{current_min:02d}")

            current_min += interval
            while current_min >= 60:
                current_min -= 60
                current_hour += 1

        return times

    def _update_schedule_display(self):
        """Update the schedule times display"""
        # Clear existing
        for widget in self.times_frame.winfo_children():
            widget.destroy()

        # If schedule is disabled, show message instead of times
        if not self.schedule_enabled:
            msg_frame = ctk.CTkFrame(self.times_frame, fg_color="transparent")
            msg_frame.pack(fill="x", pady=15)

            ctk.CTkLabel(
                msg_frame,
                text="스케줄이 비활성화되어 있습니다",
                font=ctk.CTkFont(size=18, weight="bold"),
                text_color=COLORS['warning']
            ).pack()

            ctk.CTkLabel(
                msg_frame,
                text="[활성화] 버튼을 클릭하여 스케줄을 시작하세요",
                font=ctk.CTkFont(size=14),
                text_color=COLORS['text_secondary']
            ).pack(pady=(5, 0))

            # Update summary
            self.schedule_summary.configure(text="")
            return

        times = self._get_schedule_times()
        now = datetime.now()
        current_time = now.strftime("%H:%M")

        completed = 0
        next_time = None

        # Create time labels in rows
        row_frame = None
        for i, t in enumerate(times):
            if i % 8 == 0:
                row_frame = ctk.CTkFrame(self.times_frame, fg_color="transparent")
                row_frame.pack(fill="x", pady=2)

            # Determine status
            if t < current_time:
                # Completed
                color = COLORS['success']
                symbol = "OK"
                completed += 1
            elif next_time is None and t >= current_time:
                # Next
                color = COLORS['primary']
                symbol = "NEXT"
                next_time = t
            else:
                # Pending
                color = COLORS['text_secondary']
                symbol = ""

            # Create label
            label_text = f"{t}"
            if symbol == "OK":
                label_text = f"{t}"
            elif symbol == "NEXT":
                label_text = f"{t}"

            lbl = ctk.CTkLabel(
                row_frame,
                text=label_text,
                font=ctk.CTkFont(size=16, weight="bold" if symbol else "normal"),
                text_color=color,
                width=85
            )
            lbl.pack(side="left", padx=3)

        # Update summary
        self.schedule_summary.configure(
            text=f"완료: {completed} / 전체: {len(times)}"
        )

        # Update next run display
        if self.schedule_enabled and next_time:
            self.next_run_label.configure(text=next_time)

            # Calculate countdown
            next_dt = datetime.strptime(f"{now.strftime('%Y-%m-%d')} {next_time}", "%Y-%m-%d %H:%M")
            diff = next_dt - now
            if diff.total_seconds() > 0:
                mins = int(diff.total_seconds() // 60)
                self.countdown_label.configure(text=f"{mins}분 후")
            else:
                self.countdown_label.configure(text="")
        else:
            self.next_run_label.configure(text="--:--")
            self.countdown_label.configure(text="")

    def _refresh_status(self):
        """Refresh schedule status from Windows Task Scheduler"""
        self._log("상태 새로고침 중...")

        # Check if task exists
        cmd = f'schtasks /query /tn "{TASK_NAME}" /v /fo list 2>nul'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')

        if result.returncode == 0:
            self.schedule_enabled = True
            self.status_indicator.configure(text="ON", text_color=COLORS['status_on'])
            self.toggle_btn.configure(
                text="비활성화",
                fg_color=COLORS['danger'],
                hover_color=COLORS['danger_hover']
            )

            # Parse last run time
            for line in result.stdout.split('\n'):
                if ':' in line:
                    key, _, value = line.partition(':')
                    key = key.strip()
                    value = value.strip()
                    if 'Last Run' in key or '마지막 실행' in key:
                        self.last_run_label.configure(text=value[:16] if len(value) > 16 else value)
        else:
            self.schedule_enabled = False
            self.status_indicator.configure(text="OFF", text_color=COLORS['status_off'])
            self.toggle_btn.configure(
                text="활성화",
                fg_color=COLORS['success'],
                hover_color=COLORS['success_hover']
            )

        # Load settings from DB
        self._load_settings_from_db()

        # Update display
        self._update_schedule_display()

        # Load last run result from DB
        self._load_last_run_result()

        self._log("상태 새로고침 완료")

    def _load_settings_from_db(self):
        """Load schedule settings from Supabase"""
        if not self.supabase:
            return

        try:
            result = self.supabase.table('site_settings').select('value').eq('key', 'automation_schedule').single().execute()
            if result.data:
                data = result.data['value']
                if isinstance(data, str):
                    data = json.loads(data)

                self.settings = {
                    'start_hour': data.get('startHour', 9),
                    'end_hour': data.get('endHour', 20),
                    'interval': data.get('intervalMinutes', 60),
                    'run_minute': data.get('runOnMinute', 30)
                }
        except Exception as e:
            self._log(f"설정 로드 실패: {e}")

    def _load_last_run_result(self):
        """Load last run result from Supabase"""
        if not self.supabase:
            return

        try:
            result = self.supabase.table('site_settings').select('value').eq('key', 'automation_schedule').single().execute()
            if result.data:
                data = result.data['value']
                if isinstance(data, str):
                    data = json.loads(data)

                last_result = data.get('lastResult', {})
                if last_result:
                    articles = last_result.get('articles', 0)
                    succeeded = last_result.get('succeeded', 0)
                    self.last_result_label.configure(
                        text=f"수집: {articles}건, 지역: {succeeded}/26"
                    )
        except Exception as e:
            pass

    def _toggle_schedule(self):
        """Toggle schedule on/off"""
        if self.schedule_enabled:
            # Disable
            cmd = f'schtasks /delete /tn "{TASK_NAME}" /f'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                self._log("스케줄 비활성화됨")
                messagebox.showinfo("완료", "스케줄이 비활성화되었습니다")
            else:
                self._log(f"비활성화 실패: {result.stderr}")
                messagebox.showerror("오류", f"스케줄 비활성화 실패: {result.stderr}")
        else:
            # Enable - register the schedule
            self._register_schedule()

        self._refresh_status()

    def _register_schedule(self):
        """Register Windows Task Scheduler task"""
        try:
            start_h = self.settings['start_hour']
            end_h = self.settings['end_hour']
            interval = self.settings['interval']
            run_min = self.settings['run_minute']

            self._log(f"스케줄 등록: {start_h}시~{end_h}시, {interval}분 간격, {run_min}분")

            # Validate settings
            if start_h > end_h:
                messagebox.showerror("오류", "시작 시간이 종료 시간보다 늦습니다")
                return

            # Use pythonw.exe for no console window (GUI only)
            python_dir = os.path.dirname(sys.executable)
            pythonw_path = os.path.join(python_dir, 'pythonw.exe')
            if not os.path.exists(pythonw_path):
                pythonw_path = sys.executable  # Fallback to python.exe

            script_path = os.path.join(PROJECT_ROOT, 'tools', 'scheduled_scraper.py')

            # Build triggers using _get_schedule_times()
            times = self._get_schedule_times()
            self._log(f"트리거 생성: {len(times)}개")

            if not times:
                messagebox.showerror("오류", "생성할 트리거가 없습니다. 설정을 확인하세요.")
                return

            triggers_xml = ""
            for t in times:
                hour, minute = map(int, t.split(':'))
                triggers_xml += f'''
    <CalendarTrigger>
      <StartBoundary>2025-01-01T{hour:02d}:{minute:02d}:00</StartBoundary>
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
      <Command>{pythonw_path}</Command>
      <Arguments>"{script_path}"</Arguments>
      <WorkingDirectory>{PROJECT_ROOT}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>'''

            xml_path = os.path.join(PROJECT_ROOT, 'tools', 'task_schedule.xml')
            with open(xml_path, 'w', encoding='utf-16') as f:
                f.write(xml_content)

            self._log(f"XML 저장됨: {xml_path}")

            # Register task
            cmd = f'schtasks /create /tn "{TASK_NAME}" /xml "{xml_path}" /f'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                self._log(f"스케줄 등록 성공 ({len(times)}개 트리거)")
                messagebox.showinfo("완료", f"스케줄이 활성화되었습니다!\n{len(times)}개 시간대 등록됨")
            else:
                self._log(f"등록 실패: {result.stderr}")
                messagebox.showerror("오류", f"스케줄 등록 실패: {result.stderr}")

        except Exception as e:
            self._log(f"오류: {e}")
            messagebox.showerror("오류", str(e))

    def _run_now(self):
        """Run scraper immediately"""
        if messagebox.askyesno("확인", "지금 스크래퍼를 실행하시겠습니까?"):
            self._log("스크래퍼 시작 중...")

            script_path = os.path.join(PROJECT_ROOT, 'tools', 'scheduled_scraper.py')

            # Run in new console (hidden)
            subprocess.Popen(
                f'"{sys.executable}" "{script_path}"',
                shell=True,
                cwd=PROJECT_ROOT,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            self._log("스크래퍼가 백그라운드에서 시작됨")

    def _open_settings(self):
        """Open settings dialog"""
        def on_save(new_settings):
            self.settings = new_settings
            self._save_settings_to_db()
            self._update_schedule_display()

            # Re-register if enabled
            if self.schedule_enabled:
                self._register_schedule()
                self._log("스케줄 업데이트됨")

        dialog = ScheduleSettingsDialog(self, self.settings, on_save)

    def _save_settings_to_db(self):
        """Save settings to Supabase"""
        if not self.supabase:
            return

        try:
            self.supabase.table('site_settings').upsert({
                'key': 'automation_schedule',
                'value': {
                    'startHour': self.settings['start_hour'],
                    'endHour': self.settings['end_hour'],
                    'intervalMinutes': self.settings['interval'],
                    'runOnMinute': self.settings['run_minute']
                },
                'updated_at': datetime.now().isoformat()
            }, on_conflict='key').execute()
            self._log("설정이 DB에 저장됨")
        except Exception as e:
            self._log(f"설정 저장 실패: {e}")

    def _full_reset(self):
        """Full system reset - delete schedule and reset all settings"""
        if not messagebox.askyesno(
            "전체 초기화",
            "정말로 모든 스케줄 설정을 초기화하시겠습니까?\n\n"
            "- Windows 스케줄 삭제\n"
            "- 설정 기본값으로 리셋\n"
            "- 실행 중인 작업 로그 초기화\n\n"
            "이 작업은 되돌릴 수 없습니다.",
            icon='warning'
        ):
            return

        self._log("전체 초기화 시작...")

        # Run reset in background thread
        def do_reset():
            errors = []

            # 1. Delete Windows Task Scheduler task (fast)
            try:
                cmd = f'schtasks /delete /tn "{TASK_NAME}" /f 2>nul'
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')
                self.after(0, lambda: self._log("Windows 스케줄 삭제됨" if result.returncode == 0 else "스케줄이 없거나 이미 삭제됨"))
            except Exception as e:
                errors.append(f"스케줄 삭제 실패: {e}")

            # 2. Reset settings to defaults
            self.settings = {
                'start_hour': 9,
                'end_hour': 20,
                'interval': 60,
                'run_minute': 30
            }

            # 3. Save default settings to DB
            if self.supabase:
                try:
                    # Reset automation_schedule
                    self.supabase.table('site_settings').upsert({
                        'key': 'automation_schedule',
                        'value': {
                            'enabled': False,
                            'startHour': 9,
                            'endHour': 20,
                            'intervalMinutes': 60,
                            'runOnMinute': 30
                        },
                        'description': 'Local automation schedule settings',
                        'updated_at': datetime.now().isoformat()
                    }, on_conflict='key').execute()
                    self.after(0, lambda: self._log("스케줄 설정 초기화됨"))

                    # Reset full_automation_enabled
                    self.supabase.table('site_settings').upsert({
                        'key': 'full_automation_enabled',
                        'value': {'enabled': False},
                        'description': 'Full automation enabled status',
                        'updated_at': datetime.now().isoformat()
                    }, on_conflict='key').execute()
                    self.after(0, lambda: self._log("자동화 비활성화됨"))

                    # Reset running bot_logs to failed (batch update)
                    self.supabase.table('bot_logs').update({
                        'status': 'failed',
                        'log_message': '[Force reset by Schedule Manager]'
                    }).eq('status', 'running').execute()
                    self.after(0, lambda: self._log("실행 중 로그 초기화됨"))

                except Exception as e:
                    errors.append(f"DB 초기화 실패: {e}")
                    self.after(0, lambda: self._log(f"DB 초기화 오류: {e}"))

            # 4. Update UI state (must run in main thread)
            def update_ui():
                self.schedule_enabled = False
                self.status_indicator.configure(text="OFF", text_color=COLORS['status_off'])
                self.toggle_btn.configure(
                    text="활성화",
                    fg_color=COLORS['success'],
                    hover_color=COLORS['success_hover']
                )
                self.next_run_label.configure(text="--:--")
                self.countdown_label.configure(text="")
                self.last_result_label.configure(text="")
                self._update_schedule_display()
                self._log("전체 초기화 완료")

                if errors:
                    messagebox.showwarning(
                        "초기화 완료 (일부 오류)",
                        f"초기화가 완료되었으나 일부 오류가 발생했습니다:\n\n" + "\n".join(errors)
                    )
                else:
                    messagebox.showinfo("완료", "모든 스케줄 설정이 초기화되었습니다.")

            self.after(0, update_ui)

        # Start background thread
        threading.Thread(target=do_reset, daemon=True).start()

    def _log(self, message: str):
        """Add log message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert("end", f"[{timestamp}] {message}\n")
        self.log_text.see("end")

    def _start_auto_refresh(self):
        """Start auto-refresh timer"""
        def refresh():
            self._update_schedule_display()
            self.after(30000, refresh)  # Every 30 seconds

        self.after(30000, refresh)


if __name__ == "__main__":
    app = ScheduleManager()
    app.mainloop()

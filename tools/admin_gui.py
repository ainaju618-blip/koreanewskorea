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


class AdminApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window setup
        self.title("Korea NEWS Admin Tool")
        self.geometry("1200x800")
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

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
        # Tab view
        self.tabview = ctk.CTkTabview(self, width=1180, height=780)
        self.tabview.pack(padx=10, pady=10, fill="both", expand=True)

        # Add tabs
        self.tab_schedule = self.tabview.add("📅 스케줄 관리")
        self.tab_db = self.tabview.add("🗄️ DB 탐색기")
        self.tab_scraper = self.tabview.add("🤖 스크래퍼 실행")
        self.tab_logs = self.tabview.add("📋 실행 로그")

        # Build each tab
        self._build_schedule_tab()
        self._build_db_tab()
        self._build_scraper_tab()
        self._build_logs_tab()

    # =========================================================================
    # Schedule Tab
    # =========================================================================
    def _build_schedule_tab(self):
        """Build schedule manager tab"""
        frame = self.tab_schedule

        # Title
        ctk.CTkLabel(frame, text="Windows 작업 스케줄러 관리",
                     font=ctk.CTkFont(size=20, weight="bold")).pack(pady=10)

        # Settings frame
        settings_frame = ctk.CTkFrame(frame)
        settings_frame.pack(padx=20, pady=10, fill="x")

        # Time settings
        time_frame = ctk.CTkFrame(settings_frame)
        time_frame.pack(padx=10, pady=10, fill="x")

        ctk.CTkLabel(time_frame, text="시작 시간:").grid(row=0, column=0, padx=5, pady=5)
        self.start_hour = ctk.CTkEntry(time_frame, width=60)
        self.start_hour.insert(0, "9")
        self.start_hour.grid(row=0, column=1, padx=5, pady=5)

        ctk.CTkLabel(time_frame, text="종료 시간:").grid(row=0, column=2, padx=5, pady=5)
        self.end_hour = ctk.CTkEntry(time_frame, width=60)
        self.end_hour.insert(0, "20")
        self.end_hour.grid(row=0, column=3, padx=5, pady=5)

        ctk.CTkLabel(time_frame, text="실행 간격(분):").grid(row=0, column=4, padx=5, pady=5)
        self.interval = ctk.CTkComboBox(time_frame, values=["30", "60", "120"], width=80)
        self.interval.set("60")
        self.interval.grid(row=0, column=5, padx=5, pady=5)

        ctk.CTkLabel(time_frame, text="실행 분:").grid(row=0, column=6, padx=5, pady=5)
        self.run_minute = ctk.CTkEntry(time_frame, width=60)
        self.run_minute.insert(0, "30")
        self.run_minute.grid(row=0, column=7, padx=5, pady=5)

        # Buttons
        btn_frame = ctk.CTkFrame(settings_frame)
        btn_frame.pack(padx=10, pady=10, fill="x")

        ctk.CTkButton(btn_frame, text="스케줄 등록",
                      command=self._register_schedule, width=150).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="스케줄 삭제",
                      command=self._remove_schedule, width=150,
                      fg_color="red", hover_color="darkred").pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="상태 확인",
                      command=self._check_schedule_status, width=150).pack(side="left", padx=5)
        ctk.CTkButton(btn_frame, text="DB에서 불러오기",
                      command=self._load_schedule_from_db, width=150).pack(side="left", padx=5)

        # Status display
        self.schedule_status = ctk.CTkTextbox(frame, height=400)
        self.schedule_status.pack(padx=20, pady=10, fill="both", expand=True)
        self.schedule_status.insert("1.0", "'상태 확인' 버튼을 클릭하여 현재 스케줄을 확인하세요.\n")

    def _register_schedule(self):
        """Register Windows Task Scheduler task"""
        try:
            start_h = int(self.start_hour.get())
            end_h = int(self.end_hour.get())
            interval = int(self.interval.get())
            run_min = int(self.run_minute.get())

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
                self.schedule_status.insert("1.0", f"[SUCCESS] Schedule registered!\n\n")
                self.schedule_status.insert("end", f"Task Name: {task_name}\n")
                self.schedule_status.insert("end", f"Hours: {start_h}:00 - {end_h}:00\n")
                self.schedule_status.insert("end", f"Interval: Every {interval} minutes\n")
                self.schedule_status.insert("end", f"Run at: XX:{run_min:02d}\n")
                messagebox.showinfo("Success", "Schedule registered successfully!")
            else:
                self.schedule_status.delete("1.0", "end")
                self.schedule_status.insert("1.0", f"[ERROR] Failed to register\n{result.stderr}")
                messagebox.showerror("Error", f"Failed: {result.stderr}")

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _remove_schedule(self):
        """Remove Windows Task Scheduler task"""
        task_name = "KoreaNewsScraperScheduled"
        cmd = f'schtasks /delete /tn "{task_name}" /f'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        if result.returncode == 0:
            self.schedule_status.delete("1.0", "end")
            self.schedule_status.insert("1.0", "[SUCCESS] Schedule removed!\n")
            messagebox.showinfo("Success", "Schedule removed!")
        else:
            self.schedule_status.delete("1.0", "end")
            self.schedule_status.insert("1.0", f"[INFO] {result.stderr}\n")

    def _check_schedule_status(self):
        """Check current schedule status"""
        task_name = "KoreaNewsScraperScheduled"
        cmd = f'schtasks /query /tn "{task_name}" /v /fo list'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='cp949')

        self.schedule_status.delete("1.0", "end")
        if result.returncode == 0:
            self.schedule_status.insert("1.0", "[REGISTERED] Task found:\n\n")
            self.schedule_status.insert("end", result.stdout)
        else:
            self.schedule_status.insert("1.0", "[NOT FOUND] No scheduled task registered.\n")
            self.schedule_status.insert("end", "\nClick 'Register Schedule' to create one.")

    def _load_schedule_from_db(self):
        """Load schedule settings from Supabase"""
        if not self.supabase:
            messagebox.showerror("Error", "Supabase not connected")
            return

        try:
            result = self.supabase.table('site_settings').select('value').eq('key', 'automation_schedule').single().execute()
            if result.data:
                settings = json.loads(result.data['value']) if isinstance(result.data['value'], str) else result.data['value']
                self.start_hour.delete(0, 'end')
                self.start_hour.insert(0, str(settings.get('startHour', 9)))
                self.end_hour.delete(0, 'end')
                self.end_hour.insert(0, str(settings.get('endHour', 20)))
                self.interval.set(str(settings.get('intervalMinutes', 60)))
                self.run_minute.delete(0, 'end')
                self.run_minute.insert(0, str(settings.get('runOnMinute', 30)))
                messagebox.showinfo("Success", "Settings loaded from DB!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    # =========================================================================
    # Database Tab
    # =========================================================================
    def _build_db_tab(self):
        """Build database explorer tab"""
        frame = self.tab_db

        # Title
        ctk.CTkLabel(frame, text="Supabase 데이터베이스 탐색기",
                     font=ctk.CTkFont(size=20, weight="bold")).pack(pady=10)

        # Top controls
        control_frame = ctk.CTkFrame(frame)
        control_frame.pack(padx=20, pady=10, fill="x")

        # Table selector
        ctk.CTkLabel(control_frame, text="테이블:").pack(side="left", padx=5)
        self.table_selector = ctk.CTkComboBox(control_frame, values=[], width=200)
        self.table_selector.pack(side="left", padx=5)

        ctk.CTkButton(control_frame, text="테이블 목록",
                      command=self._load_tables, width=100).pack(side="left", padx=5)
        ctk.CTkButton(control_frame, text="조회",
                      command=self._query_table, width=100).pack(side="left", padx=5)

        # Limit
        ctk.CTkLabel(control_frame, text="개수:").pack(side="left", padx=5)
        self.query_limit = ctk.CTkEntry(control_frame, width=60)
        self.query_limit.insert(0, "100")
        self.query_limit.pack(side="left", padx=5)

        ctk.CTkButton(control_frame, text="CSV 내보내기",
                      command=self._export_csv, width=100).pack(side="right", padx=5)

        # SQL Query area
        sql_frame = ctk.CTkFrame(frame)
        sql_frame.pack(padx=20, pady=5, fill="x")

        ctk.CTkLabel(sql_frame, text="SQL 쿼리 (선택):").pack(anchor="w", padx=5)
        self.sql_entry = ctk.CTkTextbox(sql_frame, height=60)
        self.sql_entry.pack(padx=5, pady=5, fill="x")

        ctk.CTkButton(sql_frame, text="SQL 실행",
                      command=self._run_sql, width=100).pack(pady=5)

        # Results area - using Treeview for table display
        results_frame = ctk.CTkFrame(frame)
        results_frame.pack(padx=20, pady=10, fill="both", expand=True)

        # Create Treeview with scrollbars
        self.tree_frame = ctk.CTkFrame(results_frame)
        self.tree_frame.pack(fill="both", expand=True)

        self.db_tree = ttk.Treeview(self.tree_frame, show="headings")

        # Scrollbars
        vsb = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.db_tree.yview)
        hsb = ttk.Scrollbar(self.tree_frame, orient="horizontal", command=self.db_tree.xview)
        self.db_tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        self.db_tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")

        self.tree_frame.grid_rowconfigure(0, weight=1)
        self.tree_frame.grid_columnconfigure(0, weight=1)

        # Style for treeview
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("Treeview", background="#2b2b2b", foreground="white",
                        fieldbackground="#2b2b2b", rowheight=25)
        style.configure("Treeview.Heading", background="#1f538d", foreground="white")

        # Row count label
        self.row_count_label = ctk.CTkLabel(frame, text="행 수: 0")
        self.row_count_label.pack(pady=5)

        # Store current data for export
        self.current_data = []
        self.current_columns = []

    def _load_tables(self):
        """Load available tables from Supabase"""
        if not self.supabase:
            messagebox.showerror("Error", "Supabase not connected")
            return

        # Common tables in the project
        tables = [
            'posts', 'categories', 'bot_logs', 'site_settings',
            'reporters', 'reporter_articles', 'blog_posts',
            'cosmos_articles', 'claude_conversations', 'subscribers'
        ]
        self.table_selector.configure(values=tables)
        self.table_selector.set(tables[0])
        messagebox.showinfo("Success", f"Loaded {len(tables)} tables")

    def _query_table(self):
        """Query selected table"""
        if not self.supabase:
            messagebox.showerror("Error", "Supabase not connected")
            return

        table = self.table_selector.get()
        if not table:
            messagebox.showwarning("Warning", "Select a table first")
            return

        try:
            limit = int(self.query_limit.get() or 100)
            result = self.supabase.table(table).select('*').limit(limit).execute()
            self._display_results(result.data)
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _run_sql(self):
        """Run custom SQL query"""
        if not self.supabase:
            messagebox.showerror("Error", "Supabase not connected")
            return

        sql = self.sql_entry.get("1.0", "end").strip()
        if not sql:
            messagebox.showwarning("Warning", "Enter a SQL query")
            return

        try:
            # Use RPC for custom queries (requires a function in Supabase)
            # For now, parse simple SELECT queries
            if sql.lower().startswith('select'):
                # Extract table name from simple queries
                import re
                match = re.search(r'from\s+(\w+)', sql.lower())
                if match:
                    table = match.group(1)
                    limit = int(self.query_limit.get() or 100)
                    result = self.supabase.table(table).select('*').limit(limit).execute()
                    self._display_results(result.data)
                else:
                    messagebox.showwarning("Warning", "Could not parse table name")
            else:
                messagebox.showwarning("Warning", "Only SELECT queries supported in GUI")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _display_results(self, data: List[Dict]):
        """Display query results in treeview"""
        # Clear existing data
        for item in self.db_tree.get_children():
            self.db_tree.delete(item)

        if not data:
            self.row_count_label.configure(text="Rows: 0")
            return

        # Get columns from first row
        columns = list(data[0].keys())
        self.current_columns = columns
        self.current_data = data

        # Configure columns
        self.db_tree["columns"] = columns
        for col in columns:
            self.db_tree.heading(col, text=col)
            self.db_tree.column(col, width=120, minwidth=50)

        # Insert data
        for row in data:
            values = [str(row.get(col, ''))[:100] for col in columns]  # Truncate long values
            self.db_tree.insert('', 'end', values=values)

        self.row_count_label.configure(text=f"행 수: {len(data)}")

    def _export_csv(self):
        """Export current data to CSV"""
        if not self.current_data:
            messagebox.showwarning("Warning", "No data to export")
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
                messagebox.showinfo("Success", f"Exported to {filepath}")
            except Exception as e:
                messagebox.showerror("Error", str(e))

    # =========================================================================
    # Scraper Tab
    # =========================================================================
    def _build_scraper_tab(self):
        """Build scraper runner tab"""
        frame = self.tab_scraper

        # Title
        ctk.CTkLabel(frame, text="스크래퍼 수동 실행",
                     font=ctk.CTkFont(size=20, weight="bold")).pack(pady=10)

        # Options frame
        options_frame = ctk.CTkFrame(frame)
        options_frame.pack(padx=20, pady=10, fill="x")

        # Region selector
        region_frame = ctk.CTkFrame(options_frame)
        region_frame.pack(padx=10, pady=10, fill="x")

        ctk.CTkLabel(region_frame, text="지역 선택:").pack(side="left", padx=5)
        self.region_selector = ctk.CTkComboBox(
            region_frame,
            values=["전체"] + [f"{r} ({REGION_NAMES.get(r, r)})" for r in ALL_REGIONS],
            width=300
        )
        self.region_selector.set("전체")
        self.region_selector.pack(side="left", padx=5)

        # Headless option
        self.headless_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(region_frame, text="Headless 모드 (브라우저 숨김)",
                        variable=self.headless_var).pack(side="left", padx=20)

        # Date range
        date_frame = ctk.CTkFrame(options_frame)
        date_frame.pack(padx=10, pady=10, fill="x")

        today = datetime.now().strftime("%Y-%m-%d")

        ctk.CTkLabel(date_frame, text="시작일:").pack(side="left", padx=5)
        self.start_date = ctk.CTkEntry(date_frame, width=120)
        self.start_date.insert(0, today)
        self.start_date.pack(side="left", padx=5)

        ctk.CTkLabel(date_frame, text="종료일:").pack(side="left", padx=5)
        self.end_date = ctk.CTkEntry(date_frame, width=120)
        self.end_date.insert(0, today)
        self.end_date.pack(side="left", padx=5)

        # Buttons
        btn_frame = ctk.CTkFrame(options_frame)
        btn_frame.pack(padx=10, pady=10, fill="x")

        self.run_btn = ctk.CTkButton(btn_frame, text="▶ 실행",
                                      command=self._run_scraper, width=150,
                                      fg_color="green", hover_color="darkgreen")
        self.run_btn.pack(side="left", padx=5)

        self.stop_btn = ctk.CTkButton(btn_frame, text="⬛ 중지",
                                       command=self._stop_scraper, width=100,
                                       fg_color="red", hover_color="darkred",
                                       state="disabled")
        self.stop_btn.pack(side="left", padx=5)

        # Progress
        self.progress_label = ctk.CTkLabel(btn_frame, text="대기 중")
        self.progress_label.pack(side="left", padx=20)

        # Output log
        self.scraper_output = ctk.CTkTextbox(frame, height=400)
        self.scraper_output.pack(padx=20, pady=10, fill="both", expand=True)

        # Running process reference
        self.running_process = None

    def _run_scraper(self):
        """Run scraper in background thread"""
        selection = self.region_selector.get()

        if selection == "전체":
            regions = ALL_REGIONS
        else:
            region_code = selection.split()[0]
            regions = [region_code]

        headless = self.headless_var.get()
        start_date = self.start_date.get()
        end_date = self.end_date.get()

        self.run_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.scraper_output.delete("1.0", "end")
        self.scraper_output.insert("1.0", f"{len(regions)}개 지역 스크래퍼 시작...\n")
        self.scraper_output.insert("end", f"Headless: {headless}, 기간: {start_date} ~ {end_date}\n\n")

        # Run in background thread
        thread = threading.Thread(target=self._scraper_thread,
                                   args=(regions, headless, start_date, end_date))
        thread.daemon = True
        thread.start()

    def _scraper_thread(self, regions, headless, start_date, end_date):
        """Background thread for running scrapers"""
        for i, region in enumerate(regions):
            if self.running_process == "STOP":
                self._log_output(f"\n[중지됨] 사용자가 취소함\n")
                break

            self._log_output(f"\n[{i+1}/{len(regions)}] {region} 실행 중...\n")
            self.progress_label.configure(text=f"{region} 실행 중 ({i+1}/{len(regions)})")

            try:
                script_path = os.path.join(PROJECT_ROOT, 'scrapers', region, f'{region}_scraper.py')
                if not os.path.exists(script_path):
                    self._log_output(f"[건너뜀] 스크립트 없음: {script_path}\n")
                    continue

                env = os.environ.copy()
                if headless:
                    env['PLAYWRIGHT_HEADLESS'] = '1'
                else:
                    env['PLAYWRIGHT_HEADLESS'] = '0'

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
                self._log_output(f"[완료] {region} 종료 (코드: {process.returncode})\n")

            except Exception as e:
                self._log_output(f"[오류] {region}: {e}\n")

        self.running_process = None
        self.run_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.progress_label.configure(text="완료")

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
        self.progress_label.configure(text="중지 중...")

    # =========================================================================
    # Logs Tab
    # =========================================================================
    def _build_logs_tab(self):
        """Build logs viewer tab"""
        frame = self.tab_logs

        # Title
        ctk.CTkLabel(frame, text="봇 실행 로그",
                     font=ctk.CTkFont(size=20, weight="bold")).pack(pady=10)

        # Controls
        control_frame = ctk.CTkFrame(frame)
        control_frame.pack(padx=20, pady=10, fill="x")

        ctk.CTkButton(control_frame, text="새로고침",
                      command=self._refresh_logs, width=120).pack(side="left", padx=5)

        ctk.CTkLabel(control_frame, text="최근:").pack(side="left", padx=5)
        self.log_limit = ctk.CTkComboBox(control_frame, values=["20", "50", "100"], width=80)
        self.log_limit.set("20")
        self.log_limit.pack(side="left", padx=5)

        # Filter by region
        ctk.CTkLabel(control_frame, text="지역:").pack(side="left", padx=5)
        self.log_region_filter = ctk.CTkComboBox(
            control_frame,
            values=["전체"] + ALL_REGIONS,
            width=150
        )
        self.log_region_filter.set("전체")
        self.log_region_filter.pack(side="left", padx=5)

        # Logs display
        self.logs_tree = ttk.Treeview(frame, columns=('id', 'region', 'status', 'articles', 'started', 'duration'),
                                       show='headings', height=20)

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

        self.logs_tree.pack(padx=20, pady=10, fill="both", expand=True)

        # Log detail
        self.log_detail = ctk.CTkTextbox(frame, height=150)
        self.log_detail.pack(padx=20, pady=10, fill="x")

        # Bind selection event
        self.logs_tree.bind('<<TreeviewSelect>>', self._on_log_select)

    def _refresh_logs(self):
        """Refresh bot logs from database"""
        if not self.supabase:
            messagebox.showerror("Error", "Supabase not connected")
            return

        try:
            limit = int(self.log_limit.get())
            region_filter = self.log_region_filter.get()

            query = self.supabase.table('bot_logs').select('*').order('created_at', desc=True).limit(limit)

            if region_filter != "전체":
                query = query.eq('region', region_filter)

            result = query.execute()

            # Clear existing
            for item in self.logs_tree.get_children():
                self.logs_tree.delete(item)

            # Insert new data
            for row in result.data:
                duration = ""
                if row.get('completed_at') and row.get('created_at'):
                    try:
                        start = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                        end = datetime.fromisoformat(row['completed_at'].replace('Z', '+00:00'))
                        duration = str(end - start).split('.')[0]
                    except:
                        pass

                self.logs_tree.insert('', 'end', values=(
                    row.get('id', ''),
                    row.get('region', ''),
                    row.get('status', ''),
                    row.get('articles_processed', 0),
                    row.get('created_at', '')[:19] if row.get('created_at') else '',
                    duration
                ), tags=(row.get('id'),))

                # Store full data for detail view
                self.logs_tree.set(self.logs_tree.get_children()[-1], 'id', row.get('id'))

            self.log_detail.delete("1.0", "end")
            self.log_detail.insert("1.0", f"{len(result.data)}개 로그 로드됨. 행을 클릭하면 상세 정보 표시.")

        except Exception as e:
            messagebox.showerror("Error", str(e))

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
                self.log_detail.insert("1.0", f"Error: {e}")


def main():
    app = AdminApp()
    app.mainloop()


if __name__ == "__main__":
    main()

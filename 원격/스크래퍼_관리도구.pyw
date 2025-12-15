"""
Korea NEWS 스크래퍼 관리 도구 (GUI) - v2.0
웹 UI와 동일한 수집 조건 설정 인터페이스
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import subprocess
import os
import sys
import threading
import json
import webbrowser
from datetime import datetime, timedelta

# tkcalendar 조건부 import
try:
    from tkcalendar import DateEntry
    HAS_CALENDAR = True
except ImportError:
    HAS_CALENDAR = False

# 프로젝트 경로 설정 (상대경로 사용)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # 원격 폴더
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)  # koreanews 폴더
SCRAPERS_DIR = os.path.join(PROJECT_DIR, 'scrapers')  # scrapers 폴더

# 원격 폴더 내 scrapers 폴더가 있으면 그것을 사용 (독립 실행 모드)
LOCAL_SCRAPERS_DIR = os.path.join(SCRIPT_DIR, 'scrapers')
if os.path.exists(LOCAL_SCRAPERS_DIR):
    SCRAPERS_DIR = LOCAL_SCRAPERS_DIR

# 스크래퍼 활성 상태 확인 함수
def check_scraper_status(region_code):
    """스크래퍼 폴더 내 파일 개수로 활성 상태 판단 (3개 이상이면 활성)"""
    region_path = os.path.join(SCRAPERS_DIR, region_code)
    MIN_FILES = 3

    if not os.path.exists(region_path) or not os.path.isdir(region_path):
        return False

    try:
        files = [f for f in os.listdir(region_path)
                 if f != '__pycache__' and os.path.isfile(os.path.join(region_path, f))]
        return len(files) >= MIN_FILES
    except:
        return False

# 지역 기본 데이터
REGION_BASE = {
    "교육기관": [
        {"code": "gwangju_edu", "name": "광주광역시교육청"},
        {"code": "jeonnam_edu", "name": "전라남도교육청"},
    ],
    "지자체": [
        {"code": "gwangju", "name": "광주광역시"},
        {"code": "jeonnam", "name": "전라남도"},
        {"code": "naju", "name": "나주시"},
        {"code": "mokpo", "name": "목포시"},
        {"code": "yeosu", "name": "여수시"},
        {"code": "suncheon", "name": "순천시"},
        {"code": "gwangyang", "name": "광양시"},
        {"code": "damyang", "name": "담양군"},
        {"code": "gokseong", "name": "곡성군"},
        {"code": "gurye", "name": "구례군"},
        {"code": "goheung", "name": "고흥군"},
        {"code": "boseong", "name": "보성군"},
        {"code": "hwasun", "name": "화순군"},
        {"code": "jangheung", "name": "장흥군"},
        {"code": "gangjin", "name": "강진군"},
        {"code": "haenam", "name": "해남군"},
        {"code": "yeongam", "name": "영암군"},
        {"code": "muan", "name": "무안군"},
        {"code": "hampyeong", "name": "함평군"},
        {"code": "yeonggwang", "name": "영광군"},
        {"code": "jangseong", "name": "장성군"},
        {"code": "wando", "name": "완도군"},
        {"code": "jindo", "name": "진도군"},
        {"code": "shinan", "name": "신안군"},
    ]
}

def get_regions_with_status():
    """스크래퍼 폴더를 스캔하여 활성 상태를 동적으로 설정"""
    regions = {}
    for category, region_list in REGION_BASE.items():
        regions[category] = []
        for region in region_list:
            regions[category].append({
                "code": region["code"],
                "name": region["name"],
                "active": check_scraper_status(region["code"]),
                "count": None  # 실제 기사 수는 DB에서 조회해야 함
            })
    return regions

# 프로그램 시작 시 스크래퍼 상태 확인
REGIONS = get_regions_with_status()

WEBSITE_URL = "https://koreanewsone.vercel.app"
ADMIN_URL = f"{WEBSITE_URL}/admin"


class ModernButton(tk.Canvas):
    """둥근 모서리 버튼"""
    def __init__(self, parent, text, command=None, width=80, height=32,
                 bg_color="#e8f4fd", fg_color="#1a73e8", hover_color="#d2e8fc",
                 active=False, **kwargs):
        super().__init__(parent, width=width, height=height,
                        highlightthickness=0, bg=parent.cget('bg'), **kwargs)

        self.command = command
        self.bg_color = bg_color
        self.fg_color = fg_color
        self.hover_color = hover_color
        self.text = text
        self.active = active

        self.draw_button()

        self.bind("<Enter>", self.on_enter)
        self.bind("<Leave>", self.on_leave)
        self.bind("<Button-1>", self.on_click)

    def draw_button(self, hover=False):
        self.delete("all")
        w, h = self.winfo_reqwidth(), self.winfo_reqheight()
        r = 15  # radius

        color = self.hover_color if hover else self.bg_color

        # 둥근 사각형 그리기
        self.create_arc(0, 0, r*2, r*2, start=90, extent=90, fill=color, outline=color)
        self.create_arc(w-r*2, 0, w, r*2, start=0, extent=90, fill=color, outline=color)
        self.create_arc(0, h-r*2, r*2, h, start=180, extent=90, fill=color, outline=color)
        self.create_arc(w-r*2, h-r*2, w, h, start=270, extent=90, fill=color, outline=color)
        self.create_rectangle(r, 0, w-r, h, fill=color, outline=color)
        self.create_rectangle(0, r, w, h-r, fill=color, outline=color)

        # 텍스트
        self.create_text(w/2, h/2, text=self.text, fill=self.fg_color,
                        font=('맑은 고딕', 9))

    def on_enter(self, event):
        self.draw_button(hover=True)

    def on_leave(self, event):
        self.draw_button(hover=False)

    def on_click(self, event):
        if self.command:
            self.command()


class ScraperManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🗞️ Korea NEWS 스크래퍼 관리 도구 v2.0")

        # 화면 크기 계산 (풀스크린 - 200)
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        window_width = screen_width - 200
        window_height = screen_height - 200

        # 창 위치 중앙 정렬
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2 - 30

        self.root.geometry(f"{window_width}x{window_height}+{x}+{y}")
        self.root.resizable(True, True)
        self.root.configure(bg='#f5f5f5')

        # 변수 초기화
        self.running = False
        self.region_vars = {}
        self.selected_count = tk.IntVar(value=0)

        # 날짜 변수
        self.start_date = tk.StringVar(value=datetime.now().strftime("%Y-%m-%d"))
        self.end_date = tk.StringVar(value=datetime.now().strftime("%Y-%m-%d"))

        # 스타일 설정
        self.setup_styles()
        self.create_menu()
        self.create_widgets()

        # F5 단축키로 새로고침
        self.root.bind("<F5>", lambda e: self.refresh_app())

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')

        # 기본 스타일
        style.configure("TFrame", background="#f5f5f5")
        style.configure("TLabel", background="#f5f5f5", font=('맑은 고딕', 10))
        style.configure("TButton", padding=6, font=('맑은 고딕', 10))
        style.configure("Header.TLabel", font=('맑은 고딕', 14, 'bold'), foreground="#333")
        style.configure("SubHeader.TLabel", font=('맑은 고딕', 11, 'bold'), foreground="#555")

        # 카드 스타일
        style.configure("Card.TFrame", background="white", relief="flat")
        style.configure("Card.TLabel", background="white", font=('맑은 고딕', 10))
        style.configure("CardHeader.TLabel", background="white", font=('맑은 고딕', 11, 'bold'))

        # 체크박스 스타일
        style.configure("Region.TCheckbutton", background="white", font=('맑은 고딕', 10))

        # 실행 버튼 스타일
        style.configure("Run.TButton", font=('맑은 고딕', 12, 'bold'), padding=15)

    def create_menu(self):
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)

        # 파일 메뉴
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="파일", menu=file_menu)
        file_menu.add_command(label="설정 내보내기", command=self.export_settings)
        file_menu.add_command(label="설정 가져오기", command=self.import_settings)
        file_menu.add_separator()
        file_menu.add_command(label="종료", command=self.root.quit)

        # 도구 메뉴
        tool_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="도구", menu=tool_menu)
        tool_menu.add_command(label="🔄 새로고침 (F5)", command=self.refresh_app)
        tool_menu.add_separator()
        tool_menu.add_command(label="프로젝트 폴더 열기", command=lambda: os.startfile(PROJECT_DIR))
        tool_menu.add_command(label="CMD 열기", command=lambda: subprocess.Popen(f'cmd /k cd /d "{PROJECT_DIR}"', shell=True))

        # 웹사이트 메뉴
        web_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="웹사이트", menu=web_menu)
        web_menu.add_command(label="🌐 메인 페이지", command=lambda: webbrowser.open(WEBSITE_URL))
        web_menu.add_command(label="👤 관리자 페이지", command=lambda: webbrowser.open(ADMIN_URL))

    def create_widgets(self):
        # 메인 프레임 (스크롤 없이 전체 화면 사용)
        self.main_frame = tk.Frame(self.root, bg='#f5f5f5')
        self.main_frame.pack(fill="both", expand=True)

        # 내용 생성
        self.create_collection_settings()

    def create_collection_settings(self):
        """수집 조건 설정 카드"""
        # 카드 컨테이너
        card = tk.Frame(self.main_frame, bg="white", relief="flat", bd=0)
        card.pack(fill="both", expand=True, padx=15, pady=10)

        # 패딩을 위한 내부 프레임
        inner = tk.Frame(card, bg="white")
        inner.pack(fill="both", expand=True, padx=20, pady=15)

        # === 헤더 ===
        header_frame = tk.Frame(inner, bg="white")
        header_frame.pack(fill="x", pady=(0, 10))

        tk.Label(header_frame, text="🔽", font=('Segoe UI Emoji', 14), bg="white", fg="#6366f1").pack(side="left")
        tk.Label(header_frame, text=" 수집 조건 설정", font=('맑은 고딕', 16, 'bold'), bg="white", fg="#1f2937").pack(side="left", padx=(5, 0))

        # 오른쪽 상단 새로고침 버튼
        refresh_btn = tk.Button(header_frame, text="🔄 새로고침",
                               font=('맑은 고딕', 10),
                               bg="#f3f4f6", fg="#374151",
                               relief="flat", cursor="hand2",
                               padx=10, pady=3,
                               command=self.refresh_app)
        refresh_btn.pack(side="right")
        refresh_btn.bind("<Enter>", lambda e: refresh_btn.configure(bg="#e5e7eb"))
        refresh_btn.bind("<Leave>", lambda e: refresh_btn.configure(bg="#f3f4f6"))

        # === 수집 기간 섹션 ===
        self.create_date_section(inner)

        # 구분선
        ttk.Separator(inner, orient="horizontal").pack(fill="x", pady=10)

        # === 수집 대상 섹션 ===
        self.create_region_section(inner)

        # === 실행 버튼 ===
        self.create_run_button(inner)

    def create_date_section(self, parent):
        """수집 기간 섹션"""
        date_frame = tk.Frame(parent, bg="white")
        date_frame.pack(fill="x", pady=(0, 5))

        # 제목
        title_frame = tk.Frame(date_frame, bg="white")
        title_frame.pack(fill="x", pady=(0, 8))
        tk.Label(title_frame, text="📅", font=('Segoe UI Emoji', 12), bg="white").pack(side="left")
        tk.Label(title_frame, text=" 수집 기간", font=('맑은 고딕', 12, 'bold'), bg="white", fg="#374151").pack(side="left", padx=(3, 0))

        # 날짜 선택기
        picker_frame = tk.Frame(date_frame, bg="white")
        picker_frame.pack(fill="x", pady=(0, 8))

        # 시작 날짜
        if HAS_CALENDAR:
            self.start_date_picker = DateEntry(picker_frame, width=12,
                                               date_pattern='yyyy-mm-dd',
                                               font=('맑은 고딕', 10))
            self.start_date_picker.pack(side="left", padx=(0, 10))
        else:
            self.start_date_picker = ttk.Entry(picker_frame, textvariable=self.start_date, width=14,
                                               font=('맑은 고딕', 10))
            self.start_date_picker.pack(side="left", padx=(0, 10))

        tk.Label(picker_frame, text="~", font=('맑은 고딕', 12), bg="white", fg="#6b7280").pack(side="left", padx=10)

        # 종료 날짜
        if HAS_CALENDAR:
            self.end_date_picker = DateEntry(picker_frame, width=12,
                                             date_pattern='yyyy-mm-dd',
                                             font=('맑은 고딕', 10))
            self.end_date_picker.pack(side="left", padx=(10, 0))
        else:
            self.end_date_picker = ttk.Entry(picker_frame, textvariable=self.end_date, width=14,
                                             font=('맑은 고딕', 10))
            self.end_date_picker.pack(side="left", padx=(10, 0))

        # 빠른 선택 버튼
        quick_frame = tk.Frame(date_frame, bg="white")
        quick_frame.pack(fill="x", pady=(0, 5))

        quick_buttons = [
            ("오늘", 0),
            ("최근 1일", 1),
            ("최근 2일", 2),
            ("최근 3일", 3),
            ("최근 1주", 7),
            ("최근 한달", 30)
        ]

        for text, days in quick_buttons:
            btn = tk.Button(quick_frame, text=text, font=('맑은 고딕', 9),
                           bg="#e0f2fe", fg="#0369a1", relief="flat",
                           padx=12, pady=5, cursor="hand2",
                           command=lambda d=days: self.set_date_range(d))
            btn.pack(side="left", padx=(0, 8))
            btn.bind("<Enter>", lambda e, b=btn: b.configure(bg="#bae6fd"))
            btn.bind("<Leave>", lambda e, b=btn: b.configure(bg="#e0f2fe"))

        # 선택된 기간 표시
        self.date_info_label = tk.Label(date_frame, text="", font=('맑은 고딕', 10),
                                        bg="white", fg="#059669")
        self.date_info_label.pack(fill="x")
        self.update_date_info()

    def create_region_section(self, parent):
        """수집 대상 섹션"""
        region_frame = tk.Frame(parent, bg="white")
        region_frame.pack(fill="x")

        # 제목
        title_frame = tk.Frame(region_frame, bg="white")
        title_frame.pack(fill="x", pady=(0, 15))
        tk.Label(title_frame, text="🔽", font=('Segoe UI Emoji', 12), bg="white", fg="#6366f1").pack(side="left")
        tk.Label(title_frame, text=" 수집 대상", font=('맑은 고딕', 12, 'bold'), bg="white", fg="#374151").pack(side="left", padx=(3, 0))

        self.count_label = tk.Label(title_frame, text="(0개 선택)", font=('맑은 고딕', 10), bg="white", fg="#6b7280")
        self.count_label.pack(side="left", padx=(10, 0))

        # 교육기관 카테고리
        self.create_category_section(region_frame, "교육기관", REGIONS["교육기관"])

        # 지자체 카테고리
        self.create_category_section(region_frame, "지자체", REGIONS["지자체"])

        # 전체 선택/해제 버튼
        btn_frame = tk.Frame(region_frame, bg="white")
        btn_frame.pack(fill="x", pady=(15, 0))

        select_all_link = tk.Label(btn_frame, text="전체 선택", font=('맑은 고딕', 10, 'underline'),
                                   bg="white", fg="#2563eb", cursor="hand2")
        select_all_link.pack(side="left")
        select_all_link.bind("<Button-1>", lambda e: self.select_all_regions())

        tk.Label(btn_frame, text="    ", bg="white").pack(side="left")

        deselect_all_link = tk.Label(btn_frame, text="전체 해제", font=('맑은 고딕', 10, 'underline'),
                                     bg="white", fg="#6b7280", cursor="hand2")
        deselect_all_link.pack(side="left")
        deselect_all_link.bind("<Button-1>", lambda e: self.deselect_all_regions())

        # 선택 현황
        self.selection_info = tk.Label(btn_frame, text="(0/26 선택됨)",
                                       font=('맑은 고딕', 10), bg="white", fg="#6b7280")
        self.selection_info.pack(side="left", padx=(20, 0))

    def create_category_section(self, parent, category_name, regions):
        """카테고리별 섹션 생성"""
        cat_frame = tk.Frame(parent, bg="white")
        cat_frame.pack(fill="x", pady=(10, 5))

        # 카테고리 헤더
        header = tk.Frame(cat_frame, bg="white")
        header.pack(fill="x", pady=(0, 8))

        tk.Label(header, text="●", font=('맑은 고딕', 8), bg="white", fg="#3b82f6").pack(side="left")
        tk.Label(header, text=f" {category_name}", font=('맑은 고딕', 11, 'bold'),
                bg="white", fg="#1f2937").pack(side="left", padx=(3, 0))

        # 스크래퍼 활성 표시
        tk.Label(header, text="(", bg="white", fg="#6b7280", font=('맑은 고딕', 9)).pack(side="left", padx=(8, 0))
        tk.Label(header, text="●", bg="white", fg="#22c55e", font=('맑은 고딕', 8)).pack(side="left")
        tk.Label(header, text=" 스크래퍼 활성)", bg="white", fg="#6b7280", font=('맑은 고딕', 9)).pack(side="left")

        # 체크박스 그리드
        check_frame = tk.Frame(cat_frame, bg="#f8fafc", relief="flat", bd=1)
        check_frame.pack(fill="x", pady=5, padx=5)

        inner_check = tk.Frame(check_frame, bg="#f8fafc")
        inner_check.pack(fill="x", padx=10, pady=10)

        cols = 8  # 한 줄에 8개
        for i, region in enumerate(regions):
            row = i // cols
            col = i % cols

            self.create_region_checkbox(inner_check, region, row, col)

    def create_region_checkbox(self, parent, region, row, col):
        """개별 지역 체크박스 생성"""
        cell = tk.Frame(parent, bg="#f8fafc")
        cell.grid(row=row, column=col, sticky="w", padx=5, pady=3)

        var = tk.BooleanVar(value=False)
        self.region_vars[region["code"]] = var

        # 체크박스
        cb_frame = tk.Frame(cell, bg="#f8fafc")
        cb_frame.pack(side="left")

        cb = ttk.Checkbutton(cb_frame, variable=var,
                            command=self.update_selection_count)
        cb.pack(side="left")

        # 활성 상태 표시
        status_color = "#22c55e" if region["active"] else "#d1d5db"
        tk.Label(cb_frame, text="●", font=('맑은 고딕', 8), bg="#f8fafc",
                fg=status_color).pack(side="left")

        # 지역명 (모두 동일한 진한 색상)
        tk.Label(cb_frame, text=f" {region['name']}", font=('맑은 고딕', 10),
                bg="#f8fafc", fg="#1f2937").pack(side="left")

        # 기사 수 (있는 경우) - 파란색으로 구분
        if region["count"]:
            tk.Label(cb_frame, text=f"  ({region['count']})", font=('맑은 고딕', 9),
                    bg="#f8fafc", fg="#2563eb").pack(side="left")

    def create_run_button(self, parent):
        """수집 시작 버튼"""
        btn_frame = tk.Frame(parent, bg="white")
        btn_frame.pack(fill="x", pady=(15, 5))

        # 메인 실행 버튼
        self.run_btn = tk.Button(btn_frame, text="▷  수집 시작",
                                font=('맑은 고딕', 14, 'bold'),
                                bg="#818cf8", fg="white",
                                activebackground="#6366f1", activeforeground="white",
                                relief="flat", cursor="hand2",
                                padx=40, pady=15,
                                command=self.run_scraper)
        self.run_btn.pack(fill="x", ipady=5)

        # 호버 효과
        self.run_btn.bind("<Enter>", lambda e: self.run_btn.configure(bg="#6366f1"))
        self.run_btn.bind("<Leave>", lambda e: self.run_btn.configure(bg="#818cf8"))

        # 진행 상태 프레임 (초기에는 숨김)
        self.progress_frame = tk.Frame(parent, bg="white")

        self.progress_label = tk.Label(self.progress_frame, text="수집 중...",
                                       font=('맑은 고딕', 11), bg="white", fg="#374151")
        self.progress_label.pack(pady=(10, 5))

        self.progress_bar = ttk.Progressbar(self.progress_frame, mode='determinate', length=400)
        self.progress_bar.pack(pady=5)

        self.progress_detail = tk.Label(self.progress_frame, text="",
                                        font=('맑은 고딕', 10), bg="white", fg="#6b7280")
        self.progress_detail.pack(pady=5)

        # 중지 버튼
        self.stop_btn = tk.Button(self.progress_frame, text="⏹ 중지",
                                 font=('맑은 고딕', 10),
                                 bg="#ef4444", fg="white",
                                 relief="flat", cursor="hand2",
                                 padx=20, pady=5,
                                 command=self.stop_scraper)
        self.stop_btn.pack(pady=10)

        # 로그 영역
        log_frame = tk.Frame(parent, bg="white")
        log_frame.pack(fill="both", expand=True, pady=(10, 0))

        tk.Label(log_frame, text="📋 실행 로그", font=('맑은 고딕', 11, 'bold'),
                bg="white", fg="#374151").pack(anchor="w", pady=(0, 5))

        self.log_text = scrolledtext.ScrolledText(log_frame, height=6,
                                                  font=('Consolas', 9),
                                                  wrap=tk.WORD, bg="#f8fafc")
        self.log_text.pack(fill="both", expand=True)

        # 로그 태그 설정
        self.log_text.tag_configure("success", foreground="#059669")
        self.log_text.tag_configure("error", foreground="#dc2626")
        self.log_text.tag_configure("info", foreground="#2563eb")
        self.log_text.tag_configure("warning", foreground="#d97706")

    # === 기능 함수들 ===

    def set_date_range(self, days):
        """빠른 날짜 선택"""
        end = datetime.now()
        start = end - timedelta(days=days)

        try:
            self.start_date_picker.set_date(start)
            self.end_date_picker.set_date(end)
        except:
            self.start_date.set(start.strftime("%Y-%m-%d"))
            self.end_date.set(end.strftime("%Y-%m-%d"))

        self.update_date_info()

    def update_date_info(self):
        """날짜 정보 업데이트"""
        try:
            start = self.start_date_picker.get_date()
            end = self.end_date_picker.get_date()
            days = (end - start).days + 1
        except:
            try:
                start = datetime.strptime(self.start_date.get(), "%Y-%m-%d")
                end = datetime.strptime(self.end_date.get(), "%Y-%m-%d")
                days = (end - start).days + 1
            except:
                days = 1
                start = end = datetime.now()

        self.date_info_label.config(
            text=f"📅 {start.strftime('%Y-%m-%d')} ~ {end.strftime('%Y-%m-%d')} ({days}일간)"
        )

    def update_selection_count(self):
        """선택된 지역 수 업데이트"""
        count = sum(1 for var in self.region_vars.values() if var.get())
        total = len(self.region_vars)
        self.count_label.config(text=f"({count}개 선택)")
        self.selection_info.config(text=f"({count}/{total} 선택됨)")

    def select_all_regions(self):
        """전체 선택"""
        for var in self.region_vars.values():
            var.set(True)
        self.update_selection_count()

    def deselect_all_regions(self):
        """전체 해제"""
        for var in self.region_vars.values():
            var.set(False)
        self.update_selection_count()

    def log(self, message, level="info"):
        """로그 추가"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {"success": "✅", "error": "❌", "warning": "⚠️", "info": "ℹ️"}.get(level, "")

        self.log_text.insert(tk.END, f"[{timestamp}] {prefix} {message}\n", level)
        self.log_text.see(tk.END)

    def run_scraper(self):
        """스크래퍼 실행"""
        if self.running:
            messagebox.showwarning("경고", "이미 실행 중입니다!")
            return

        selected = [code for code, var in self.region_vars.items() if var.get()]

        if not selected:
            messagebox.showwarning("경고", "수집할 지역을 선택하세요!")
            return

        # 날짜 계산
        try:
            start = self.start_date_picker.get_date()
            end = self.end_date_picker.get_date()
            days = (end - start).days + 1
        except:
            try:
                start = datetime.strptime(self.start_date.get(), "%Y-%m-%d")
                end = datetime.strptime(self.end_date.get(), "%Y-%m-%d")
                days = (end - start).days + 1
            except:
                days = 1

        self.running = True
        self.current_process = None
        self.progress_frame.pack(fill="x", pady=(15, 0))
        self.run_btn.config(state="disabled", bg="#d1d5db")

        self.progress_bar['value'] = 0
        self.progress_bar['maximum'] = len(selected)
        self.progress_label.config(text=f"수집 중... (0/{len(selected)})")

        self.log(f"스크래퍼 실행 시작: {len(selected)}개 지역, {days}일간", "info")
        self.log(f"스크래퍼 폴더: {SCRAPERS_DIR}", "info")

        def run_thread():
            try:
                completed = 0
                total = len(selected)

                for region_code in selected:
                    if not self.running:
                        break

                    # 스크래퍼 파일 경로
                    scraper_path = os.path.join(SCRAPERS_DIR, region_code, f"{region_code}_scraper.py")

                    if not os.path.exists(scraper_path):
                        self.root.after(0, lambda r=region_code: self.log(f"[SKIP] {r}: 스크래퍼 파일 없음", "warning"))
                        completed += 1
                        self.root.after(0, lambda c=completed: self.update_progress(c, total))
                        continue

                    self.root.after(0, lambda r=region_code: self.log(f"[RUN] {r} 수집 시작...", "info"))

                    # 스크래퍼 실행
                    cmd = [sys.executable, scraper_path, "--days", str(days), "--max-articles", "30"]

                    try:
                        self.current_process = subprocess.Popen(
                            cmd,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            text=True,
                            cwd=SCRAPERS_DIR,
                            encoding='utf-8',
                            errors='replace',
                            env={**os.environ, "PYTHONIOENCODING": "utf-8"}
                        )

                        # 출력 실시간 표시
                        output_lines = []
                        for line in iter(self.current_process.stdout.readline, ''):
                            if not self.running:
                                self.current_process.terminate()
                                break
                            line = line.strip()
                            if line:
                                output_lines.append(line)
                                # 중요 메시지만 로그에 표시
                                if any(kw in line for kw in ['신규', '저장', '오류', 'Error', '완료']):
                                    level = "success" if '신규' in line or '저장' in line else "error" if '오류' in line or 'Error' in line else "info"
                                    self.root.after(0, lambda l=line, lv=level: self.log(f"  {l}", lv))

                        self.current_process.wait(timeout=300)  # 5분 타임아웃

                        # 결과 판단
                        if self.current_process.returncode == 0:
                            # 신규 건수 파싱
                            import re
                            full_output = '\n'.join(output_lines)
                            match = re.search(r'신규\s+(\d+)', full_output)
                            count = int(match.group(1)) if match else 0
                            self.root.after(0, lambda r=region_code, c=count: self.log(f"[OK] {r}: {c}건 수집 완료", "success"))
                        else:
                            self.root.after(0, lambda r=region_code: self.log(f"[FAIL] {r}: 실행 오류", "error"))

                    except subprocess.TimeoutExpired:
                        self.current_process.kill()
                        self.root.after(0, lambda r=region_code: self.log(f"[TIMEOUT] {r}: 5분 초과", "error"))
                    except Exception as e:
                        self.root.after(0, lambda r=region_code, err=str(e): self.log(f"[ERROR] {r}: {err[:50]}", "error"))

                    completed += 1
                    self.root.after(0, lambda c=completed: self.update_progress(c, total))

                    # 지역 간 대기
                    if self.running and completed < total:
                        time.sleep(1)

                self.root.after(0, self.on_complete)

            except Exception as e:
                self.root.after(0, lambda: self.on_error(str(e)))

        threading.Thread(target=run_thread, daemon=True).start()

    def update_progress(self, current, total):
        """진행률 업데이트"""
        self.progress_bar['value'] = current
        self.progress_label.config(text=f"수집 중... ({current}/{total})")

    def stop_scraper(self):
        """스크래퍼 중지"""
        if self.running:
            self.running = False
            # 현재 실행 중인 프로세스 종료
            if hasattr(self, 'current_process') and self.current_process:
                try:
                    self.current_process.terminate()
                except:
                    pass
            self.progress_label.config(text="사용자에 의해 중지됨")
            self.log("스크래퍼 실행이 중지되었습니다.", "warning")
            self.reset_ui()

    def on_complete(self):
        """완료 처리"""
        self.running = False
        self.progress_label.config(text="✅ 수집 완료!")
        self.progress_bar['value'] = self.progress_bar['maximum']
        self.log("스크래퍼 실행 완료!", "success")
        messagebox.showinfo("완료", "스크래퍼 실행이 완료되었습니다!")
        self.reset_ui()

    def on_error(self, error):
        """오류 처리"""
        self.running = False
        self.progress_label.config(text="❌ 오류 발생")
        self.log(f"오류: {error}", "error")
        messagebox.showerror("오류", f"실행 중 오류 발생:\n{error}")
        self.reset_ui()

    def reset_ui(self):
        """UI 초기화"""
        self.run_btn.config(state="normal", bg="#818cf8")

    def refresh_app(self):
        """앱 새로고침 - 프로그램 재시작"""
        python = sys.executable
        os.execl(python, python, *sys.argv)

    def export_settings(self):
        """설정 내보내기"""
        settings = {
            "selected_regions": [code for code, var in self.region_vars.items() if var.get()],
            "date_range": {
                "start": self.start_date.get() if hasattr(self, 'start_date') else "",
                "end": self.end_date.get() if hasattr(self, 'end_date') else ""
            }
        }

        filename = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON 파일", "*.json")],
            initialfilename="scraper_settings.json"
        )

        if filename:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
            messagebox.showinfo("완료", "설정이 저장되었습니다!")

    def import_settings(self):
        """설정 가져오기"""
        filename = filedialog.askopenfilename(filetypes=[("JSON 파일", "*.json")])

        if filename:
            with open(filename, 'r', encoding='utf-8') as f:
                settings = json.load(f)

            # 지역 선택 복원
            for code in self.region_vars:
                self.region_vars[code].set(code in settings.get("selected_regions", []))

            self.update_selection_count()
            messagebox.showinfo("완료", "설정을 불러왔습니다!")


def main():
    # tkcalendar 없으면 설치 제안 (선택사항)
    if not HAS_CALENDAR:
        root_temp = tk.Tk()
        root_temp.withdraw()
        result = messagebox.askyesno(
            "달력 패키지 (선택)",
            "tkcalendar 패키지를 설치하면 달력으로 날짜를 선택할 수 있습니다.\n설치하시겠습니까?\n\n(아니오를 선택해도 프로그램은 정상 작동합니다)"
        )
        root_temp.destroy()

        if result:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", "tkcalendar"], check=True)
                messagebox.showinfo("완료", "패키지 설치 완료!\n프로그램을 다시 실행하세요.")
                return
            except:
                pass

    root = tk.Tk()
    app = ScraperManagerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()

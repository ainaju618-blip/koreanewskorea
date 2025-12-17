"""
Claude Hub - Desktop GUI Application
Modern Knowledge Management System with CustomTkinter
VS Code Dark Theme - Border-First Design
"""
import customtkinter as ctk
from pathlib import Path
import json
from datetime import datetime
import threading

# Theme configuration
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# VS Code Dark Theme - Grayscale Only
THEME = {
    # Backgrounds
    "bg_main": "#1e1e1e",
    "bg_sidebar": "#252526",
    "bg_card": "#252526",
    "bg_hover": "#2d2d2d",
    "bg_selected": "#37373d",

    # Borders
    "border": "#3c3c3c",
    "border_hover": "#555555",

    # Text - All grayscale
    "text_bright": "#ffffff",
    "text_primary": "#e0e0e0",
    "text_secondary": "#cccccc",
    "text_muted": "#808080",
    "text_disabled": "#5a5a5a",

    # Accent - Only for status
    "success": "#4ec9b0",
    "error": "#f14c4c",
}

# Constants
RAW_DIR = Path("d:/cbt/claude-hub/knowledge/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)


class ClaudeHubApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window configuration
        self.title("Claude Hub - Knowledge Management")
        self.geometry("1200x800")
        self.minsize(900, 600)
        self.configure(fg_color=THEME["bg_main"])

        # Configure grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Create sidebar
        self.create_sidebar()

        # Create main content area
        self.main_frame = ctk.CTkFrame(
            self,
            corner_radius=0,
            fg_color=THEME["bg_main"]
        )
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
        self.main_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_rowconfigure(1, weight=1)

        # Show dashboard by default
        self.show_dashboard()

    def create_sidebar(self):
        """Create navigation sidebar - VS Code style"""
        self.sidebar = ctk.CTkFrame(
            self,
            width=220,
            corner_radius=0,
            fg_color=THEME["bg_sidebar"],
            border_width=0
        )
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(6, weight=1)

        # Separator line (right edge of sidebar)
        separator = ctk.CTkFrame(
            self.sidebar,
            width=1,
            fg_color=THEME["border"]
        )
        separator.place(relx=1, rely=0, relheight=1, anchor="ne")

        # Logo/Title
        self.logo_label = ctk.CTkLabel(
            self.sidebar,
            text="Claude Hub",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=THEME["text_bright"]
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(30, 5))

        self.subtitle = ctk.CTkLabel(
            self.sidebar,
            text="Knowledge Management",
            font=ctk.CTkFont(size=12),
            text_color=THEME["text_muted"]
        )
        self.subtitle.grid(row=1, column=0, padx=20, pady=(0, 30))

        # Navigation buttons - Border style
        self.nav_buttons = []
        self.nav_indicators = []
        nav_items = [
            ("대시보드", self.show_dashboard),
            ("프로젝트", self.show_projects),
            ("지식 허브", self.show_knowledge),
            ("원본 저장소", self.show_raw_sources),
        ]

        for i, (text, command) in enumerate(nav_items):
            # Container for indicator + button
            container = ctk.CTkFrame(self.sidebar, fg_color="transparent")
            container.grid(row=i+2, column=0, padx=10, pady=3, sticky="ew")
            container.grid_columnconfigure(1, weight=1)

            # Left indicator bar (VS Code style)
            indicator = ctk.CTkFrame(
                container,
                width=3,
                height=35,
                corner_radius=0,
                fg_color="transparent"
            )
            indicator.grid(row=0, column=0, padx=(0, 5))
            self.nav_indicators.append(indicator)

            # Button
            btn = ctk.CTkButton(
                container,
                text=text,
                font=ctk.CTkFont(size=14),
                fg_color="transparent",
                text_color=THEME["text_muted"],
                hover_color=THEME["bg_hover"],
                anchor="w",
                height=40,
                corner_radius=4,
                border_width=0,
                command=command
            )
            btn.grid(row=0, column=1, sticky="ew")
            self.nav_buttons.append(btn)

    def clear_main_frame(self):
        """Clear all widgets from main frame"""
        for widget in self.main_frame.winfo_children():
            widget.destroy()

    def show_dashboard(self):
        """Show dashboard view"""
        self.clear_main_frame()
        self.highlight_nav(0)

        # Header
        header = ctk.CTkLabel(
            self.main_frame,
            text="대시보드",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=THEME["text_bright"]
        )
        header.grid(row=0, column=0, padx=20, pady=(20, 30), sticky="w")

        # Stats cards container
        cards_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        cards_frame.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        cards_frame.grid_columnconfigure((0, 1, 2), weight=1)

        # Stat cards - Border style (no colored backgrounds)
        stats = [
            ("프로젝트", self.count_projects()),
            ("지식 항목", self.count_knowledge()),
            ("원본 소스", self.count_raw_files()),
        ]

        for i, (title, count) in enumerate(stats):
            card = ctk.CTkFrame(
                cards_frame,
                corner_radius=8,
                fg_color=THEME["bg_card"],
                border_width=1,
                border_color=THEME["border"]
            )
            card.grid(row=0, column=i, padx=10, pady=10, sticky="nsew")
            card.grid_columnconfigure(0, weight=1)

            count_label = ctk.CTkLabel(
                card,
                text=str(count),
                font=ctk.CTkFont(size=48, weight="bold"),
                text_color=THEME["text_bright"]
            )
            count_label.grid(row=0, column=0, padx=30, pady=(30, 5))

            title_label = ctk.CTkLabel(
                card,
                text=title,
                font=ctk.CTkFont(size=16),
                text_color=THEME["text_muted"]
            )
            title_label.grid(row=1, column=0, padx=30, pady=(0, 30))

        # Recent activity section
        activity_label = ctk.CTkLabel(
            self.main_frame,
            text="최근 원본 소스",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=THEME["text_primary"]
        )
        activity_label.grid(row=2, column=0, padx=20, pady=(30, 10), sticky="w")

        # Divider line
        divider = ctk.CTkFrame(self.main_frame, height=1, fg_color=THEME["border"])
        divider.grid(row=3, column=0, padx=20, pady=(0, 10), sticky="ew")

        # Activity list
        activity_frame = ctk.CTkScrollableFrame(
            self.main_frame,
            corner_radius=8,
            fg_color=THEME["bg_card"],
            border_width=1,
            border_color=THEME["border"]
        )
        activity_frame.grid(row=4, column=0, padx=20, pady=10, sticky="nsew")
        activity_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_rowconfigure(4, weight=1)

        files = self.get_raw_files()[:5]
        if files:
            for i, f in enumerate(files):
                item = ctk.CTkFrame(
                    activity_frame,
                    fg_color="transparent",
                    corner_radius=4,
                    border_width=1,
                    border_color=THEME["border"]
                )
                item.grid(row=i, column=0, padx=5, pady=5, sticky="ew")
                item.grid_columnconfigure(1, weight=1)

                title = ctk.CTkLabel(
                    item,
                    text=f["title"],
                    font=ctk.CTkFont(size=14, weight="bold"),
                    text_color=THEME["text_primary"]
                )
                title.grid(row=0, column=0, columnspan=2, padx=15, pady=(10, 2), sticky="w")

                info = ctk.CTkLabel(
                    item,
                    text=f"{f['filename']} - {f['size']/1024:.1f} KB",
                    text_color=THEME["text_muted"]
                )
                info.grid(row=1, column=0, padx=15, pady=(0, 10), sticky="w")
        else:
            empty = ctk.CTkLabel(
                activity_frame,
                text="원본 소스가 없습니다",
                text_color=THEME["text_disabled"]
            )
            empty.grid(row=0, column=0, pady=30)

    def show_projects(self):
        """Show projects view"""
        self.clear_main_frame()
        self.highlight_nav(1)

        header = ctk.CTkLabel(
            self.main_frame,
            text="프로젝트",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=THEME["text_bright"]
        )
        header.grid(row=0, column=0, padx=20, pady=(20, 20), sticky="w")

        # Projects list
        projects_frame = ctk.CTkScrollableFrame(
            self.main_frame,
            corner_radius=8,
            fg_color=THEME["bg_card"],
            border_width=1,
            border_color=THEME["border"]
        )
        projects_frame.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        projects_frame.grid_columnconfigure(0, weight=1)

        # Sample projects
        projects = [
            {"name": "General", "git_email": "-", "status": "active"},
            {"name": "koreanews", "git_email": "kyh6412057153@gmail.com", "status": "active"},
            {"name": "hobakflower", "git_email": "ko518533@gmail.com", "status": "active"},
            {"name": "electrical-cbt", "git_email": "multi618@gmail.com", "status": "active"},
            {"name": "thub", "git_email": "multi618@gmail.com", "status": "active"},
        ]

        for i, proj in enumerate(projects):
            card = ctk.CTkFrame(
                projects_frame,
                fg_color="transparent",
                corner_radius=6,
                border_width=1,
                border_color=THEME["border"]
            )
            card.grid(row=i, column=0, padx=5, pady=8, sticky="ew")
            card.grid_columnconfigure(1, weight=1)

            # Project name
            name = ctk.CTkLabel(
                card,
                text=proj["name"],
                font=ctk.CTkFont(size=18, weight="bold"),
                text_color=THEME["text_bright"]
            )
            name.grid(row=0, column=0, padx=20, pady=(15, 5), sticky="w")

            # Git email
            email = ctk.CTkLabel(
                card,
                text=f"Git: {proj['git_email']}",
                font=ctk.CTkFont(size=12),
                text_color=THEME["text_muted"]
            )
            email.grid(row=1, column=0, padx=20, pady=(0, 15), sticky="w")

            # Status - just a dot + text
            status_frame = ctk.CTkFrame(card, fg_color="transparent")
            status_frame.grid(row=0, column=1, rowspan=2, padx=20, pady=15, sticky="e")

            # Green dot for active
            dot = ctk.CTkLabel(
                status_frame,
                text="●",
                font=ctk.CTkFont(size=10),
                text_color=THEME["success"] if proj["status"] == "active" else THEME["text_disabled"]
            )
            dot.pack(side="left", padx=(0, 5))

            status_text = ctk.CTkLabel(
                status_frame,
                text=proj["status"].upper(),
                font=ctk.CTkFont(size=11),
                text_color=THEME["text_muted"]
            )
            status_text.pack(side="left")

    def show_knowledge(self):
        """Show knowledge hub view"""
        self.clear_main_frame()
        self.highlight_nav(2)

        header = ctk.CTkLabel(
            self.main_frame,
            text="지식 허브",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=THEME["text_bright"]
        )
        header.grid(row=0, column=0, padx=20, pady=(20, 20), sticky="w")

        # Info message
        info = ctk.CTkLabel(
            self.main_frame,
            text="지식 항목은 Supabase에 저장됩니다.\n웹 인터페이스에서 지식을 보고 관리할 수 있습니다.",
            font=ctk.CTkFont(size=14),
            text_color=THEME["text_muted"]
        )
        info.grid(row=1, column=0, padx=20, pady=20, sticky="w")

        # Open web button - Border style
        web_btn = ctk.CTkButton(
            self.main_frame,
            text="웹 인터페이스 열기",
            font=ctk.CTkFont(size=14),
            height=45,
            corner_radius=6,
            fg_color="transparent",
            text_color=THEME["text_primary"],
            border_width=1,
            border_color=THEME["border_hover"],
            hover_color=THEME["bg_hover"],
            command=self.open_web
        )
        web_btn.grid(row=2, column=0, padx=20, pady=10, sticky="w")

    def show_raw_sources(self):
        """Show raw sources view with upload functionality"""
        self.clear_main_frame()
        self.highlight_nav(3)

        # Configure grid
        self.main_frame.grid_columnconfigure(0, weight=2)
        self.main_frame.grid_columnconfigure(1, weight=1)

        # Header
        header = ctk.CTkLabel(
            self.main_frame,
            text="원본 저장소",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=THEME["text_bright"]
        )
        header.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 20), sticky="w")

        # Left side: Input form
        form_frame = ctk.CTkFrame(
            self.main_frame,
            corner_radius=8,
            fg_color=THEME["bg_card"],
            border_width=1,
            border_color=THEME["border"]
        )
        form_frame.grid(row=1, column=0, padx=(20, 10), pady=10, sticky="nsew")
        form_frame.grid_columnconfigure(0, weight=1)
        form_frame.grid_rowconfigure(5, weight=1)

        # Title input
        title_label = ctk.CTkLabel(
            form_frame,
            text="제목 (선택)",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text_primary"]
        )
        title_label.grid(row=0, column=0, padx=20, pady=(20, 5), sticky="w")

        self.title_entry = ctk.CTkEntry(
            form_frame,
            placeholder_text="제목을 입력하세요...",
            height=40,
            corner_radius=4,
            fg_color=THEME["bg_main"],
            border_width=1,
            border_color=THEME["border"],
            text_color=THEME["text_secondary"]
        )
        self.title_entry.grid(row=1, column=0, padx=20, pady=(0, 15), sticky="ew")

        # Topic dropdown
        topic_label = ctk.CTkLabel(
            form_frame,
            text="토픽",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text_primary"]
        )
        topic_label.grid(row=2, column=0, padx=20, pady=(0, 5), sticky="w")

        self.topic_dropdown = ctk.CTkComboBox(
            form_frame,
            values=["prompting", "development", "troubleshooting", "workflow", "reference", "general"],
            height=40,
            corner_radius=4,
            fg_color=THEME["bg_main"],
            border_width=1,
            border_color=THEME["border"],
            button_color=THEME["border"],
            button_hover_color=THEME["border_hover"],
            text_color=THEME["text_secondary"]
        )
        self.topic_dropdown.grid(row=3, column=0, padx=20, pady=(0, 15), sticky="ew")
        self.topic_dropdown.set("general")

        # Content textbox
        content_label = ctk.CTkLabel(
            form_frame,
            text="내용",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=THEME["text_primary"]
        )
        content_label.grid(row=4, column=0, padx=20, pady=(0, 5), sticky="w")

        self.content_textbox = ctk.CTkTextbox(
            form_frame,
            corner_radius=4,
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color=THEME["bg_main"],
            border_width=1,
            border_color=THEME["border"],
            text_color=THEME["text_secondary"]
        )
        self.content_textbox.grid(row=5, column=0, padx=20, pady=(0, 10), sticky="nsew")

        # Character count
        self.char_count_label = ctk.CTkLabel(
            form_frame,
            text="0 글자 | ~0 토큰",
            text_color=THEME["text_muted"]
        )
        self.char_count_label.grid(row=6, column=0, padx=20, pady=(0, 10), sticky="w")

        # Bind text change event
        self.content_textbox.bind("<KeyRelease>", self.update_char_count)

        # Buttons
        btn_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        btn_frame.grid(row=7, column=0, padx=20, pady=(0, 20), sticky="ew")

        # Primary button - Border style
        save_btn = ctk.CTkButton(
            btn_frame,
            text="파일로 저장",
            font=ctk.CTkFont(size=14),
            height=45,
            corner_radius=6,
            fg_color="transparent",
            text_color=THEME["text_primary"],
            border_width=1,
            border_color=THEME["border_hover"],
            hover_color=THEME["bg_hover"],
            command=self.save_raw_file
        )
        save_btn.pack(side="left", padx=(0, 10))

        # Secondary button - Ghost style
        clear_btn = ctk.CTkButton(
            btn_frame,
            text="지우기",
            font=ctk.CTkFont(size=14),
            height=45,
            corner_radius=6,
            fg_color="transparent",
            text_color=THEME["text_muted"],
            border_width=0,
            hover_color=THEME["bg_hover"],
            command=self.clear_form
        )
        clear_btn.pack(side="left")

        # Status label
        self.status_label = ctk.CTkLabel(
            form_frame,
            text="",
            text_color=THEME["success"]
        )
        self.status_label.grid(row=8, column=0, padx=20, pady=(0, 20), sticky="w")

        # Right side: Files list
        list_frame = ctk.CTkFrame(
            self.main_frame,
            corner_radius=8,
            fg_color=THEME["bg_card"],
            border_width=1,
            border_color=THEME["border"]
        )
        list_frame.grid(row=1, column=1, padx=(10, 20), pady=10, sticky="nsew")
        list_frame.grid_columnconfigure(0, weight=1)
        list_frame.grid_rowconfigure(1, weight=1)

        list_header = ctk.CTkLabel(
            list_frame,
            text="저장된 파일",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=THEME["text_primary"]
        )
        list_header.grid(row=0, column=0, padx=15, pady=(15, 10), sticky="w")

        # Refresh button - Ghost style
        refresh_btn = ctk.CTkButton(
            list_frame,
            text="새로고침",
            width=80,
            height=30,
            corner_radius=4,
            fg_color="transparent",
            text_color=THEME["text_muted"],
            border_width=0,
            hover_color=THEME["bg_hover"],
            command=lambda: self.refresh_file_list(files_scroll)
        )
        refresh_btn.grid(row=0, column=0, padx=15, pady=(15, 10), sticky="e")

        # Files scrollable frame
        files_scroll = ctk.CTkScrollableFrame(
            list_frame,
            corner_radius=4,
            fg_color="transparent"
        )
        files_scroll.grid(row=1, column=0, padx=10, pady=(0, 15), sticky="nsew")
        files_scroll.grid_columnconfigure(0, weight=1)

        self.refresh_file_list(files_scroll)

    def refresh_file_list(self, parent):
        """Refresh the files list"""
        # Clear existing items
        for widget in parent.winfo_children():
            widget.destroy()

        files = self.get_raw_files()

        if not files:
            empty = ctk.CTkLabel(
                parent,
                text="파일이 없습니다",
                text_color=THEME["text_disabled"]
            )
            empty.grid(row=0, column=0, pady=30)
            return

        for i, f in enumerate(files):
            item = ctk.CTkFrame(
                parent,
                fg_color="transparent",
                corner_radius=4,
                border_width=1,
                border_color=THEME["border"]
            )
            item.grid(row=i, column=0, padx=5, pady=5, sticky="ew")
            item.grid_columnconfigure(0, weight=1)

            title = ctk.CTkLabel(
                item,
                text=f["title"][:30] + "..." if len(f["title"]) > 30 else f["title"],
                font=ctk.CTkFont(size=12, weight="bold"),
                text_color=THEME["text_primary"]
            )
            title.grid(row=0, column=0, padx=10, pady=(8, 2), sticky="w")

            info = ctk.CTkLabel(
                item,
                text=f"{f['size']/1024:.1f} KB",
                font=ctk.CTkFont(size=10),
                text_color=THEME["text_muted"]
            )
            info.grid(row=1, column=0, padx=10, pady=(0, 8), sticky="w")

            # Delete button - Danger style (only button with color)
            del_btn = ctk.CTkButton(
                item,
                text="X",
                width=30,
                height=30,
                corner_radius=4,
                fg_color="transparent",
                text_color=THEME["error"],
                border_width=1,
                border_color=THEME["error"],
                hover_color=THEME["error"],
                command=lambda fn=f["filename"]: self.delete_file(fn, parent)
            )
            del_btn.grid(row=0, column=1, rowspan=2, padx=10, pady=8, sticky="e")

    def update_char_count(self, event=None):
        """Update character and token count"""
        content = self.content_textbox.get("1.0", "end-1c")
        char_count = len(content)
        token_estimate = int(char_count * 1.5)
        self.char_count_label.configure(text=f"{char_count:,} 글자 | ~{token_estimate:,} 토큰")

    def save_raw_file(self):
        """Save content to raw file"""
        title = self.title_entry.get().strip()
        topic = self.topic_dropdown.get()
        content = self.content_textbox.get("1.0", "end-1c").strip()

        if not content:
            self.status_label.configure(text="내용을 입력하세요", text_color=THEME["error"])
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if title:
            safe_title = "".join(c if c.isalnum() or c in "-_ " else "_" for c in title)[:30]
            filename = f"{topic}_{safe_title}_{timestamp}.txt"
        else:
            title = f"Untitled_{timestamp}"
            filename = f"{topic}_{timestamp}.txt"

        header = f"""---
title: {title}
topic: {topic}
created: {datetime.now().isoformat()}
---

"""

        filepath = RAW_DIR / filename
        filepath.write_text(header + content, encoding="utf-8")

        self.status_label.configure(text=f"저장됨: {filename}", text_color=THEME["success"])
        self.show_raw_sources()

    def clear_form(self):
        """Clear the input form"""
        self.title_entry.delete(0, "end")
        self.content_textbox.delete("1.0", "end")
        self.topic_dropdown.set("general")
        self.char_count_label.configure(text="0 글자 | ~0 토큰")
        self.status_label.configure(text="")

    def delete_file(self, filename, parent):
        """Delete a raw file"""
        filepath = RAW_DIR / filename
        if filepath.exists():
            filepath.unlink()
        self.refresh_file_list(parent)

    def highlight_nav(self, index):
        """Highlight the active navigation button - VS Code style"""
        for i, btn in enumerate(self.nav_buttons):
            if i == index:
                # Selected: white text + left indicator bar
                btn.configure(
                    fg_color=THEME["bg_selected"],
                    text_color=THEME["text_bright"]
                )
                self.nav_indicators[i].configure(fg_color=THEME["text_bright"])
            else:
                # Not selected: muted text
                btn.configure(
                    fg_color="transparent",
                    text_color=THEME["text_muted"]
                )
                self.nav_indicators[i].configure(fg_color="transparent")

    def count_projects(self):
        """Count projects (placeholder)"""
        return 5

    def count_knowledge(self):
        """Count knowledge items (placeholder)"""
        return 0

    def count_raw_files(self):
        """Count raw files"""
        return len(list(RAW_DIR.glob("*.txt")))

    def get_raw_files(self):
        """Get list of raw files with metadata"""
        files = []
        for filepath in sorted(RAW_DIR.glob("*.txt"), key=lambda x: x.stat().st_mtime, reverse=True):
            content = filepath.read_text(encoding="utf-8")
            title = filepath.stem
            if "title:" in content:
                for line in content.split("\n"):
                    if line.startswith("title:"):
                        title = line.replace("title:", "").strip()
                        break

            files.append({
                "filename": filepath.name,
                "title": title,
                "size": filepath.stat().st_size
            })
        return files

    def open_web(self):
        """Open web interface"""
        import webbrowser
        webbrowser.open("http://localhost:8001")


if __name__ == "__main__":
    app = ClaudeHubApp()
    app.mainloop()

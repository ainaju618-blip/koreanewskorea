"""
Korea NEWS Auto Processor
- Scheduled task runner with log viewer
- Phase 1: Scraping all regions
- Phase 2: AI processing all pending articles
- Shows real-time processing logs
- Stop button to cancel processing

Usage: python tools/auto_processor.py
"""

import os
import sys
import subprocess
import socket
import time
import threading
import concurrent.futures
import requests
from datetime import datetime
from typing import Optional, Dict, Any

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'scrapers'))

# All regions for scraping
ALL_REGIONS = [
    'gwangju', 'jeonnam', 'mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang',
    'damyang', 'gokseong', 'gurye', 'goheung', 'boseong', 'hwasun', 'jangheung',
    'gangjin', 'haenam', 'yeongam', 'muan', 'hampyeong', 'yeonggwang',
    'jangseong', 'wando', 'jindo', 'shinan', 'gwangju_edu', 'jeonnam_edu'
]

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

# GUI
import customtkinter as ctk
from supabase import create_client, Client

# Region names
REGION_NAMES = {
    'gwangju': '광주광역??, 'jeonnam': '?�라?�도', 'mokpo': '목포??,
    'yeosu': '?�수??, 'suncheon': '?�천??, 'naju': '?�주??,
    'gwangyang': '광양??, 'damyang': '?�양�?, 'gokseong': '곡성�?,
    'gurye': '구�?�?, 'goheung': '고흥�?, 'boseong': '보성�?,
    'hwasun': '?�순�?, 'jangheung': '?�흥�?, 'gangjin': '강진�?,
    'haenam': '?�남�?, 'yeongam': '?�암�?, 'muan': '무안�?,
    'hampyeong': '?�평�?, 'yeonggwang': '?�광�?, 'jangseong': '?�성�?,
    'wando': '?�도�?, 'jindo': '진도�?, 'shinan': '?�안�?,
    'gwangju_edu': '광주교육�?, 'jeonnam_edu': '?�남교육�?
}


class AutoProcessorApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window setup
        self.title("Korea NEWS Auto Processor")
        self.geometry("800x500")
        self.minsize(600, 400)

        # Theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # State
        self.stop_flag = False
        self.processing = False
        self.supabase: Optional[Client] = None

        # Initialize Supabase
        self._init_supabase()

        # Create UI
        self._create_ui()

        # Auto-start processing
        self.after(500, self._auto_start)

    def _init_supabase(self):
        """Initialize Supabase client"""
        url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if url and key:
            try:
                self.supabase = create_client(url, key)
            except Exception as e:
                print(f"Supabase error: {e}")

    def _create_ui(self):
        """Create the UI"""
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header with status and stop button
        header = ctk.CTkFrame(self, height=60)
        header.grid(row=0, column=0, padx=10, pady=(10, 5), sticky="ew")
        header.grid_columnconfigure(1, weight=1)

        # Title
        ctk.CTkLabel(
            header,
            text="?�� Korea NEWS Auto Processor",
            font=ctk.CTkFont(size=18, weight="bold")
        ).grid(row=0, column=0, padx=15, pady=15, sticky="w")

        # Status
        self.status_label = ctk.CTkLabel(
            header,
            text="???�작 �?..",
            font=ctk.CTkFont(size=14)
        )
        self.status_label.grid(row=0, column=1, padx=10, pady=15)

        # Stop button
        self.stop_btn = ctk.CTkButton(
            header,
            text="??중�?",
            width=100,
            height=36,
            corner_radius=8,
            fg_color="#dc3545",
            hover_color="#a71d2a",
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._stop_processing
        )
        self.stop_btn.grid(row=0, column=2, padx=15, pady=15, sticky="e")

        # Log area
        log_frame = ctk.CTkFrame(self)
        log_frame.grid(row=1, column=0, padx=10, pady=(5, 10), sticky="nsew")
        log_frame.grid_columnconfigure(0, weight=1)
        log_frame.grid_rowconfigure(0, weight=1)

        self.log_text = ctk.CTkTextbox(
            log_frame,
            font=ctk.CTkFont(family="Consolas", size=12),
            wrap="word"
        )
        self.log_text.grid(row=0, column=0, padx=5, pady=5, sticky="nsew")

    def _log(self, message: str):
        """Add log message (thread-safe)"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_line = f"[{timestamp}] {message}\n"

        def update():
            self.log_text.insert("end", log_line)
            self.log_text.see("end")

        self.after(0, update)

    def _set_status(self, text: str):
        """Update status label (thread-safe)"""
        self.after(0, lambda: self.status_label.configure(text=text))

    def _format_checks(self, checks: Dict[str, Any]) -> str:
        """Format check results as checkbox string based on actual scraper output"""
        parts = []

        # Basic checks (boolean) - Korean labels
        basic_checks = [
            ('script_exists', '?�크립트'),
            ('process_ran', '?�행'),
            ('no_timeout', '?�간'),
            ('returncode_ok', '종료'),
            ('no_critical_error', '?�러?�음'),
            ('report_found', '보고'),
        ]

        for key, label in basic_checks:
            if checks.get(key):
                parts.append(f"[v]{label}")
            else:
                parts.append(f"[x]{label}")

        # Counts
        saved = checks.get('saved_count', 0)
        skip = checks.get('skip_count', 0)
        parts.append(f"?�??{saved}")
        if skip > 0:
            parts.append(f"?�킵:{skip}")

        # Error types if any - translate common errors to Korean
        error_types = checks.get('error_types', [])
        if error_types:
            # Translate common error types
            error_kr = {
                'IMAGE_MISSING': '?��?지?�음',
                'CLOUDINARY_FAIL': '?�라?�드?�패',
                'DB_ERROR': 'DB?�류',
                'PARSE_ERROR': '?�싱?�류',
                'TIMEOUT': '?�간초과',
            }
            translated = []
            for et in error_types[:2]:
                # Parse "ERROR_TYPE:count" format
                if ':' in et:
                    err_name, count = et.rsplit(':', 1)
                    kr_name = error_kr.get(err_name, err_name)
                    translated.append(f"{kr_name}:{count}")
                else:
                    translated.append(error_kr.get(et, et))
            parts.append(f"?�류:{','.join(translated)}")

        return " ".join(parts)

    def _stop_processing(self):
        """Stop button clicked"""
        self.stop_flag = True
        self._log("?�� ?�용?��? 중�?�??�청?�습?�다...")
        self._set_status("?�� 중�? �?..")
        self.stop_btn.configure(state="disabled")

    def _auto_start(self):
        """Auto-start processing"""
        self._log("=" * 50)
        self._log("?? Korea NEWS Auto Processor ?�작")
        self._log("=" * 50)
        self._log("")

        # Start processing in background thread
        thread = threading.Thread(target=self._run_processing)
        thread.daemon = True
        thread.start()

    def _is_server_running(self) -> bool:
        """Check if dev server is running"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex(('localhost', 3000))
            sock.close()
            return result == 0
        except:
            return False

    def _start_server(self) -> bool:
        """Start the dev server"""
        self._log("?�� ?�버 ?�태 ?�인 �?..")

        if self._is_server_running():
            self._log("???�버가 ?��? ?�행 중입?�다")
            return True

        self._log("???�버가 ?�행?��? ?�음")
        self._log("?? 개발 ?�버 ?�작 �?..")

        # Kill existing node
        subprocess.run('taskkill /f /im node.exe', shell=True, capture_output=True)
        time.sleep(2)

        # Start server
        subprocess.Popen(
            'npm run dev',
            shell=True,
            cwd=PROJECT_ROOT,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )

        # Wait for server
        self._log("???�버 준�??��?�?..")
        for i in range(30):
            if self.stop_flag:
                return False
            time.sleep(1)
            if self._is_server_running():
                self._log(f"???�버 준�??�료! ({i+1}�?")
                return True
            if i % 5 == 4:
                self._log(f"   ???��?�?.. ({i+1}�?")

        self._log("???�버 ?�작 ?�패!")
        return False

    def _run_scraper(self, region: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Run a single scraper with detailed checks"""
        import re
        script_path = os.path.join(PROJECT_ROOT, 'scrapers', region, f'{region}_scraper.py')

        # Initialize check results - based on actual scraper output patterns
        checks = {
            'script_exists': False,      # ?�크립트 ?�일 존재
            'process_ran': False,        # ?�로?�스 ?�행??            'no_timeout': False,         # ?�?�아???�음
            'returncode_ok': False,      # returncode=0
            'no_critical_error': False,  # Traceback/Exception ?�음
            'report_found': False,       # "?�크?�핑 ?�료 보고" 출력??            'saved_count': 0,            # ?�?�된 기사 ??            'skip_count': 0,             # ?�킵??기사 ??            'error_types': [],           # ?�러 ?�형??        }

        if not os.path.exists(script_path):
            return {'region': region, 'success': False, 'error': 'No script', 'articles': 0, 'checks': checks}

        checks['script_exists'] = True

        try:
            env = os.environ.copy()
            env['PLAYWRIGHT_HEADLESS'] = '1'

            cmd = [sys.executable, script_path, '--start', start_date, '--end', end_date]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600,
                                   cwd=os.path.join(PROJECT_ROOT, 'scrapers'), env=env)

            checks['process_ran'] = True
            checks['no_timeout'] = True

            stdout = result.stdout or ''
            stderr = result.stderr or ''

            # Check 1: returncode
            checks['returncode_ok'] = (result.returncode == 0)

            # Check 2: Critical errors in stderr (Python exceptions)
            critical_errors = ['Traceback', 'Exception', 'CRITICAL', 'FATAL']
            has_critical = any(err in stderr for err in critical_errors)
            checks['no_critical_error'] = not has_critical

            # Check 3: Parse actual scraper report format
            # Pattern: "처리: N�?/ ?�?? M�?/ ?�킵: K�?
            for line in stdout.split('\n'):
                # Look for the completion report
                if '?�크?�핑 ?�료 보고' in line:
                    checks['report_found'] = True

                # Parse: "처리: 10�?/ ?�?? 5�?/ ?�킵: 5�?
                if '?�??' in line and '�? in line:
                    saved_match = re.search(r'?�??:\s]*(\d+)\s*�?, line)
                    if saved_match:
                        checks['saved_count'] = int(saved_match.group(1))
                    skip_match = re.search(r'?�킵[:\s]*(\d+)\s*�?, line)
                    if skip_match:
                        checks['skip_count'] = int(skip_match.group(1))

                # Parse error types: "- CLOUDINARY_FAIL: 2�?
                err_type_match = re.search(r'-\s+(\w+_\w+):\s*(\d+)�?, line)
                if err_type_match:
                    checks['error_types'].append(f"{err_type_match.group(1)}:{err_type_match.group(2)}")

            # Determine success
            if result.returncode != 0:
                err_msg = stderr.strip().split('\n')[-1][:40] if stderr else 'returncode error'
                return {
                    'region': region,
                    'success': False,
                    'error': err_msg,
                    'articles': 0,
                    'checks': checks
                }

            if has_critical:
                err_lines = [l for l in stderr.split('\n') if any(e in l for e in critical_errors)]
                err_msg = err_lines[-1][:40] if err_lines else 'Critical error'
                return {
                    'region': region,
                    'success': False,
                    'error': err_msg,
                    'articles': 0,
                    'checks': checks
                }

            # Success case - return actual saved count
            return {
                'region': region,
                'success': True,
                'articles': checks['saved_count'],
                'skipped': checks['skip_count'],
                'checks': checks
            }

        except subprocess.TimeoutExpired:
            checks['no_timeout'] = False
            return {'region': region, 'success': False, 'error': 'Timeout(10m)', 'articles': 0, 'checks': checks}
        except Exception as e:
            return {'region': region, 'success': False, 'error': str(e)[:40], 'articles': 0, 'checks': checks}

    def _run_processing(self):
        """Main processing loop - Phase 1: Scraping, Phase 2: AI Processing"""
        self.processing = True

        if not self.supabase:
            self._log("??Supabase ?�결 ?�패!")
            self._set_status("???�류")
            return

        # =====================================================================
        # PHASE 1: SCRAPING
        # =====================================================================
        self._log("=" * 50)
        self._log("?�� PHASE 1: 기사 ?�크?�핑")
        self._log("=" * 50)
        self._set_status("?�� ?�크?�핑 �?..")

        today = datetime.now().strftime('%Y-%m-%d')
        self._log(f"?�� ?�짜: {today}")
        self._log(f"?�� 지?? {len(ALL_REGIONS)}�?)
        self._log("")

        scrape_results = []
        total_articles = 0

        # Run scrapers in parallel (5 workers)
        completed_count = 0
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_region = {
                    executor.submit(self._run_scraper, region, today, today): region
                    for region in ALL_REGIONS
                }

                for future in concurrent.futures.as_completed(future_to_region, timeout=900):
                    if self.stop_flag:
                        break

                    region = future_to_region[future]
                    completed_count += 1
                    try:
                        result = future.result(timeout=60)
                        scrape_results.append(result)
                        region_name = REGION_NAMES.get(region, region)[:8]

                        # Update status with progress
                        self._set_status(f"?�� ?�크?�핑 �?.. ({completed_count}/{len(ALL_REGIONS)})")

                        checks = result.get('checks', {})
                        check_str = self._format_checks(checks)

                        if result['success']:
                            total_articles += result.get('articles', 0)
                            skip_info = f"+{result.get('skipped', 0)}?�킵" if result.get('skipped', 0) > 0 else ""
                            self._log(f"  [{completed_count}/{len(ALL_REGIONS)}] ??{region_name}: {result.get('articles', 0)}�?skip_info}")
                            self._log(f"       {check_str}")
                        else:
                            self._log(f"  [{completed_count}/{len(ALL_REGIONS)}] ??{region_name}: {result.get('error', '?')}")
                            self._log(f"       {check_str}")
                    except concurrent.futures.TimeoutError:
                        self._log(f"  [{completed_count}/{len(ALL_REGIONS)}] ?�️ {region}: ?�?�아??)
                    except Exception as e:
                        self._log(f"  [{completed_count}/{len(ALL_REGIONS)}] ??{region}: {str(e)[:25]}")
        except concurrent.futures.TimeoutError:
            self._log("?�️ ?�체 ?�크?�핑 ?�?�아??(15�?")
        except Exception as e:
            self._log(f"?�️ ?�크?�핑 ?�류: {str(e)[:30]}")

        if self.stop_flag:
            self._log("?�� ?�크?�핑 중�???)
            self._set_status("?�� 중�???)
            self.processing = False
            return

        succeeded = sum(1 for r in scrape_results if r['success'])
        self._log("")
        self._log(f"?�� ?�크?�핑 ?�료: {succeeded}/{len(ALL_REGIONS)} ?�공, {total_articles}�?기사")

        # Detailed check summary
        if scrape_results:
            check_stats = {}
            for r in scrape_results:
                checks = r.get('checks', {})
                for k, v in checks.items():
                    if k not in check_stats:
                        check_stats[k] = {'pass': 0, 'fail': 0}
                    if v:
                        check_stats[k]['pass'] += 1
                    else:
                        check_stats[k]['fail'] += 1

            # Show failed checks summary
            failed_checks = [(k, v['fail']) for k, v in check_stats.items() if v['fail'] > 0]
            if failed_checks:
                self._log("")
                self._log("?�️ ?�패 체크 ?�약:")
                check_names = {
                    'script_exists': 'Script ?�음',
                    'process_ran': '?�행 ?�됨',
                    'no_timeout': '?�?�아??,
                    'returncode_ok': '비정??종료',
                    'no_critical_error': '?�각???�러',
                    'found_articles': '기사 ?�음',
                    'db_saved': 'DB ?�???�됨',
                }
                for check_key, fail_count in failed_checks:
                    self._log(f"   [x] {check_names.get(check_key, check_key)}: {fail_count}�?지??)

        # =====================================================================
        # PHASE 2: AI PROCESSING
        # =====================================================================
        self._log("")
        self._log("=" * 50)
        self._log("?�� PHASE 2: AI 기사 가�?)
        self._log("=" * 50)

        # Start server
        if not self._start_server():
            if self.stop_flag:
                self._log("?�� 중�???)
                self._set_status("?�� 중�???)
            else:
                self._log("???�버 ?�작 ?�패")
                self._set_status("???�버 ?�류")
            self.processing = False
            return

        time.sleep(1)

        api_url = 'http://localhost:3000/api/bot/process-single-article'
        total_processed = 0
        total_success = 0
        total_failed = 0
        batch_num = 0

        while not self.stop_flag:
            batch_num += 1
            self._log("")
            self._log(f"?�� 배치 {batch_num}: ?�인 ?��?기사 로드 �?..")

            try:
                result = self.supabase.table('posts').select(
                    'id, title, source, content'
                ).eq('status', 'draft').or_(
                    'ai_processed.is.null,ai_processed.eq.false'
                ).order('created_at', desc=True).limit(100).execute()

                if not result.data:
                    self._log("?�� 처리??기사가 ?�습?�다!")
                    break

                pending = result.data
                self._log(f"??{len(pending)}�?기사 발견")
                self._set_status(f"?�� 배치 {batch_num}: {len(pending)}�?처리 �?..")

                for idx, article in enumerate(pending):
                    if self.stop_flag:
                        break

                    article_id = article['id']
                    title = (article.get('title') or '')[:25]
                    content = article.get('content', '')
                    region = article.get('source', 'unknown')
                    region_name = REGION_NAMES.get(region, region)[:6]

                    if not content:
                        self._log(f"[{idx+1}/{len(pending)}] ?�️ ?�용?�음 | {title}")
                        total_failed += 1
                        continue

                    self._log(f"[{idx+1}/{len(pending)}] ?�� {region_name} | {title}... | {len(content)}??)
                    self._log(f"        ?�� AI ?�정 �?..")

                    try:
                        # Ollama API only needs articleId (content fetched from DB)
                        response = requests.post(api_url, json={
                            'articleId': article_id
                        }, timeout=180)

                        if response.status_code == 200:
                            data = response.json()
                            grade = data.get('grade', '?')
                            attempts = data.get('attempts', 1)
                            validation = data.get('validation', {})

                            # ========== ?��? 검�?체크리스??==========
                            self._log(f"        ?��??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�??)
                            self._log(f"        ???�트 검�?체크리스??(?�도:{attempts})          ??)
                            self._log(f"        ?��??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�??)

                            # Gemini API: numberCheck, quoteCheck
                            if 'numberCheck' in validation:
                                num_check = validation.get('numberCheck', {})
                                num_orig = num_check.get('originalCount', 0)
                                num_ai = num_check.get('aiCount', 0)
                                num_extra = len(num_check.get('extraNumbers', []))
                                num_pass = num_check.get('passed', num_extra == 0)
                                self._log(f"        ??{'[v]' if num_pass else '[x]'} ?�자검�? ?�본{num_orig}�?AI{num_ai}�?{'?�과' if num_pass else f'{num_extra}개추가'}  ??)

                                quote_check = validation.get('quoteCheck', {})
                                quote_orig = quote_check.get('originalCount', 0)
                                quote_ai = quote_check.get('aiCount', 0)
                                quote_extra = len(quote_check.get('extraQuotes', []))
                                quote_pass = quote_check.get('passed', quote_extra == 0)
                                self._log(f"        ??{'[v]' if quote_pass else '[x]'} ?�용검�? ?�본{quote_orig}�?AI{quote_ai}�?{'?�과' if quote_pass else f'{quote_extra}개추가'}  ??)

                                warn_count = len(validation.get('warnings', []))
                                self._log(f"        ??{'[v]' if warn_count == 0 else '[x]'} 경고?�수: {warn_count}�?{'?�상' if warn_count == 0 else '?�인?�요'}             ??)
                            else:
                                # Ollama API: layer1, layer3, layer4, layer5
                                layer1 = validation.get('layer1', {})
                                l1_pass = layer1.get('passed', True)
                                self._log(f"        ??{'[v]' if l1_pass else '[x]'} ?�트추출: {'?�과' if l1_pass else '?�락?�음'}                 ??)

                                layer3 = validation.get('layer3', {})
                                l3_pass = layer3.get('passed', True)
                                self._log(f"        ??{'[v]' if l3_pass else '[x]'} ?�루?�네?�션: {'?�조?�음' if l3_pass else '?�조감�?'}           ??)

                                layer4 = validation.get('layer4', {})
                                l4_pass = layer4.get('passed', True)
                                l4_score = layer4.get('score', 0)
                                self._log(f"        ??{'[v]' if l4_pass else '[x]'} 교차검�? ?�수{l4_score} {'?�과' if l4_pass else '미달'}         ??)

                                layer5 = validation.get('layer5', {})
                                l5_pass = layer5.get('passed', True)
                                l5_ratio = layer5.get('ratio', 100)
                                self._log(f"        ??{'[v]' if l5_pass else '[x]'} 길이비율: {l5_ratio}% {'충분' if l5_pass else '부�?}           ??)

                            # 최종 ?�급
                            self._log(f"        ?��??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�??)
                            grade_emoji = '[v]' if grade == 'A' else ('[!]' if grade == 'B' else '[x]')
                            grade_action = '발행' if grade == 'A' else '?�동검??
                            self._log(f"        ??{grade_emoji} 최종?�급: {grade} -> {grade_action}                  ??)
                            self._log(f"        ?��??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�??)

                            if data.get('success') or data.get('published'):
                                total_success += 1
                                self._log(f"        ???�� 발행 ?�료!")
                            else:
                                total_failed += 1
                                msg = data.get('message', data.get('error', ''))[:40]
                                self._log(f"        ???�� ?�시?�??(?�동검??: {msg}")
                        else:
                            total_failed += 1
                            self._log(f"        ????HTTP {response.status_code}")

                    except requests.exceptions.Timeout:
                        total_failed += 1
                        self._log(f"        ???�️ ?�?�아??)
                    except requests.exceptions.ConnectionError:
                        total_failed += 1
                        self._log(f"        ???�� ?�결?�패")
                    except Exception as e:
                        total_failed += 1
                        self._log(f"        ???�� {str(e)[:30]}")

                    total_processed += 1

                    # Rate limiting
                    if not self.stop_flag and idx < len(pending) - 1:
                        time.sleep(3)

                time.sleep(2)

            except Exception as e:
                self._log(f"??배치 ?�류: {str(e)[:50]}")
                break

        # Summary
        self._log("")
        self._log("=" * 50)
        self._log("?�� 처리 ?�료")
        self._log("=" * 50)
        self._log(f"  �?처리: {total_processed}�?)
        self._log(f"  ?�공: {total_success}�?)
        self._log(f"  ?�패: {total_failed}�?)

        if self.stop_flag:
            self._set_status(f"?�� 중�???(처리:{total_processed}, ?�공:{total_success})")
        else:
            self._set_status(f"???�료 (처리:{total_processed}, ?�공:{total_success})")

        self.processing = False
        self.after(0, lambda: self.stop_btn.configure(
            text="???�기",
            fg_color="#2fa572",
            hover_color="#1d7a52",
            state="normal",
            command=self.destroy
        ))


if __name__ == "__main__":
    app = AutoProcessorApp()
    app.mainloop()

"""
Korea NEWS Local Scheduler
- No admin permissions required
- Runs in background (no window needed)
- Reads schedule settings from Admin UI (/admin/bot/schedule)

Usage:
    Foreground: python scripts/local_scheduler.py
    Background: Double-click start-local-scheduler-hidden.vbs

To install dependencies:
    pip install schedule requests
"""

import os
import sys
import time
import schedule
import subprocess
import requests
import logging
from datetime import datetime

# Setup logging (for background mode)
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'local_scheduler.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout) if sys.stdout else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

def log(message, level='info'):
    """Log to both file and console (if available)"""
    if level == 'error':
        logger.error(message)
    elif level == 'warn':
        logger.warning(message)
    else:
        logger.info(message)
    # Also print if console is available
    try:
        print(message)
    except:
        pass

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Configuration
# LOCAL scheduler always uses localhost - this is for local development only
# Production scrapers use BOT_API_URL from .env, but local scheduler doesn't need it
API_BASE_URL = 'http://localhost:3000'
SCHEDULE_API = f"{API_BASE_URL}/api/bot/automation-schedule"
AUTOMATION_API = f"{API_BASE_URL}/api/bot/full-automation"

# Default fallback schedule (if API unavailable)
DEFAULT_SCHEDULE = {
    'startHour': 9,
    'endHour': 20,
    'intervalMinutes': 60,
    'runOnMinute': 30
}

def fetch_schedule_settings():
    """Fetch schedule settings from Admin API"""
    try:
        log(f"[DEBUG] Fetching from: {SCHEDULE_API}")

        # Get schedule settings
        schedule_resp = requests.get(SCHEDULE_API, timeout=5)
        log(f"[DEBUG] Schedule API status: {schedule_resp.status_code}")

        if schedule_resp.status_code == 200:
            schedule_data = schedule_resp.json()
            log(f"[DEBUG] Schedule data received: {schedule_data}")
        else:
            log(f"[WARN] Schedule API returned {schedule_resp.status_code}, using defaults", 'warn')
            schedule_data = DEFAULT_SCHEDULE

        # Get enabled status
        log(f"[DEBUG] Fetching from: {AUTOMATION_API}")
        automation_resp = requests.get(AUTOMATION_API, timeout=5)
        log(f"[DEBUG] Automation API status: {automation_resp.status_code}")

        if automation_resp.status_code == 200:
            automation_data = automation_resp.json()
            enabled = automation_data.get('enabled', False)
            log(f"[DEBUG] Automation data: enabled={enabled}")
        else:
            log(f"[WARN] Automation API returned {automation_resp.status_code}, enabled=False", 'warn')
            enabled = False

        return {
            'enabled': enabled,
            'startHour': schedule_data.get('startHour', DEFAULT_SCHEDULE['startHour']),
            'endHour': schedule_data.get('endHour', DEFAULT_SCHEDULE['endHour']),
            'intervalMinutes': schedule_data.get('intervalMinutes', DEFAULT_SCHEDULE['intervalMinutes']),
            'runOnMinute': schedule_data.get('runOnMinute', DEFAULT_SCHEDULE['runOnMinute'])
        }
    except Exception as e:
        log(f"[ERROR] Could not fetch settings from API: {e}", 'error')
        log("[WARN] Using default schedule settings", 'warn')
        return {
            'enabled': True,
            **DEFAULT_SCHEDULE
        }

def generate_schedule_times(settings):
    """Generate schedule times from settings"""
    times = []
    hour = settings['startHour']
    interval_hours = settings['intervalMinutes'] // 60
    if interval_hours < 1:
        interval_hours = 1

    while hour <= settings['endHour']:
        time_str = f"{str(hour).zfill(2)}:{str(settings['runOnMinute']).zfill(2)}"
        times.append(time_str)
        hour += interval_hours

    return times

# Timeout for automation script (10 minutes - reduced from 15 to prevent long hangs)
AUTOMATION_TIMEOUT = 10 * 60  # seconds

def run_full_automation():
    """Run the full automation script with timeout"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log(f"{'='*50}")
    log(f"[{timestamp}] Starting Full Automation...")
    log(f"{'='*50}")

    try:
        # Check if automation is still enabled
        try:
            resp = requests.get(AUTOMATION_API, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if not data.get('enabled', False):
                    log(f"[{datetime.now().strftime('%H:%M:%S')}] Automation is disabled in Admin. Skipping.")
                    return
        except:
            pass  # Continue if can't check

        # Run the full automation Python script
        automation_script = os.path.join(PROJECT_ROOT, "scripts", "full_automation.py")

        if os.path.exists(automation_script):
            start_time = datetime.now()
            log(f"[{start_time.strftime('%H:%M:%S')}] Running automation script (timeout: {AUTOMATION_TIMEOUT//60} min)...")

            try:
                result = subprocess.run(
                    [sys.executable, automation_script],
                    cwd=PROJECT_ROOT,
                    capture_output=False,
                    timeout=AUTOMATION_TIMEOUT
                )

                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()

                if result.returncode == 0:
                    log(f"[{end_time.strftime('%H:%M:%S')}] Automation completed successfully (took {duration:.0f}s)")
                else:
                    log(f"[{end_time.strftime('%H:%M:%S')}] Automation finished with code: {result.returncode} (took {duration:.0f}s)")

            except subprocess.TimeoutExpired:
                log(f"[{datetime.now().strftime('%H:%M:%S')}] TIMEOUT! Automation exceeded {AUTOMATION_TIMEOUT//60} minutes. Force killed.", 'error')
                # Kill any remaining Python processes from automation
                try:
                    if sys.platform == 'win32':
                        subprocess.run('taskkill /f /im python.exe /fi "WINDOWTITLE eq *full_automation*"',
                                      shell=True, capture_output=True)
                except:
                    pass
        else:
            log(f"[ERROR] Automation script not found: {automation_script}", 'error')

    except Exception as e:
        log(f"[ERROR] Failed to run automation: {str(e)}", 'error')

def setup_schedule():
    """Setup schedule based on Admin settings"""
    log("="*50)
    log("Korea NEWS Local Scheduler")
    log("="*50)
    log(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"Log file: {LOG_FILE}")
    log(f"Fetching settings from Admin...")

    settings = fetch_schedule_settings()

    if not settings['enabled']:
        log("[WARN] Automation is DISABLED in Admin!", 'warn')
        log("[WARN] Enable it at: http://localhost:3000/admin/bot/schedule", 'warn')
        log("[WARN] Scheduler will still run but skip execution until enabled.", 'warn')

    schedule_times = generate_schedule_times(settings)

    log(f"Schedule Settings (from Admin):")
    log(f"  - Start Hour: {settings['startHour']}:00")
    log(f"  - End Hour: {settings['endHour']}:00")
    log(f"  - Interval: {settings['intervalMinutes']} minutes")
    log(f"  - Run at: XX:{str(settings['runOnMinute']).zfill(2)}")
    log(f"Scheduled times:")

    for time_str in schedule_times:
        schedule.every().day.at(time_str).do(run_full_automation)
        log(f"  - {time_str}")

    log(f"Total: {len(schedule_times)} runs per day")
    log("="*50)

    return schedule_times

def main():
    log("="*60)
    log("LOCAL SCHEDULER STARTED")
    log("="*60)

    current_settings = fetch_schedule_settings()
    setup_schedule()

    # Show next run time
    next_job = schedule.next_run()
    if next_job:
        log(f"Next scheduled run: {next_job.strftime('%Y-%m-%d %H:%M:%S')}")

    log("Scheduler is running in background...")
    log(f"To stop: Run stop-local-scheduler.bat or kill pythonw.exe")
    log("[INFO] Settings will auto-reload when changed in Admin UI")

    # Run scheduler loop
    loop_count = 0
    while True:
        schedule.run_pending()
        loop_count += 1

        # Check for settings changes every 2 minutes (4 loops * 30 seconds)
        if loop_count % 4 == 0:
            try:
                new_settings = fetch_schedule_settings()
                # Compare key settings
                if (new_settings['runOnMinute'] != current_settings['runOnMinute'] or
                    new_settings['startHour'] != current_settings['startHour'] or
                    new_settings['endHour'] != current_settings['endHour'] or
                    new_settings['intervalMinutes'] != current_settings['intervalMinutes']):

                    log("="*50)
                    log("[RELOAD] Settings changed in Admin UI! Reloading schedule...")
                    log(f"  Old: XX:{str(current_settings['runOnMinute']).zfill(2)}")
                    log(f"  New: XX:{str(new_settings['runOnMinute']).zfill(2)}")

                    # Clear old schedule and set up new one
                    schedule.clear()
                    current_settings = new_settings
                    setup_schedule()

                    next_job = schedule.next_run()
                    if next_job:
                        log(f"Next scheduled run: {next_job.strftime('%Y-%m-%d %H:%M:%S')}")
                    log("="*50)
            except Exception as e:
                # Silently ignore check errors
                pass

        # Log heartbeat every 10 minutes (20 loops * 30 seconds)
        if loop_count % 20 == 0:
            next_job = schedule.next_run()
            if next_job:
                log(f"[HEARTBEAT] Scheduler alive. Next run: {next_job.strftime('%Y-%m-%d %H:%M:%S')}")

        time.sleep(30)  # Check every 30 seconds

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("[INFO] Scheduler stopped by user")
        sys.exit(0)
    except Exception as e:
        log(f"[FATAL] Scheduler crashed: {str(e)}", 'error')
        sys.exit(1)

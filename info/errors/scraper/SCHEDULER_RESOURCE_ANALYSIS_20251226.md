# Scheduler Resource Consumption Analysis Report

> **Date:** 2025-12-26
> **Analyst:** Claude
> **Target File:** `tools/scheduled_scraper.py`, `tools/job_logger.py`
> **Issue:** Scheduler crashes due to excessive resource consumption

---

## Executive Summary

| Category | Severity | Issue Count |
|----------|----------|-------------|
| Memory | P0 | 3 |
| CPU | P1 | 2 |
| I/O (Database) | P1 | 2 |
| Process Management | P2 | 3 |

**Root Cause:** Multiple resource-heavy operations running simultaneously without proper management:
1. 5 parallel Playwright browsers (1-2.5GB)
2. Ollama LLM server (2-4GB)
3. Node.js dev server (300-500MB)
4. GUI with 100ms update loop
5. 300-400 DB inserts per execution

**Peak Memory Estimate:** 4-8GB (dangerous on 8GB systems)

---

## Round 1: Code Structure Review

### 1.1 Concurrent Process Architecture

```
scheduled_scraper.py
    |
    +-- [STARTUP] Ollama server (subprocess.Popen)
    |       -> 2-4GB memory (LLM model)
    |
    +-- [STARTUP] Node.js dev server (subprocess.Popen)
    |       -> 300-500MB memory
    |
    +-- [MAIN] ThreadPoolExecutor (5 workers)
    |       -> Each worker spawns Playwright browser
    |       -> 5 x 200-500MB = 1-2.5GB
    |
    +-- [GUI] AILogWindow (CustomTkinter)
            -> 100ms update loop
            -> Continuous CPU usage
```

### 1.2 Resource Bottlenecks Identified

| Component | Location | Memory | CPU | I/O |
|-----------|----------|--------|-----|-----|
| Playwright browsers | line 890 | HIGH | MED | LOW |
| Ollama server | line 374-379 | **CRITICAL** | HIGH | LOW |
| Node.js server | line 439-444 | MED | MED | LOW |
| GUI update loop | line 183-189 | LOW | **HIGH** | LOW |
| JobLogger DB writes | job_logger.py:159 | LOW | LOW | **HIGH** |

---

## Round 2: Logging/Debugging Overhead Analysis

### 2.1 Triple Logging Pattern

Every log message goes to THREE destinations:

```python
# scheduled_scraper.py:497-502
def log_both(msg, level="info"):
    print(msg)                      # 1. Console (stdout)
    log_lines.append(...)           # 2. In-memory array
    if log_window:
        log_window.log(msg, level)  # 3. GUI window
```

**Impact:** Each operation triggers 3x I/O operations

### 2.2 Database INSERT Frequency

| Log Method | Calls per Run | DB INSERTs |
|------------|---------------|------------|
| `log_scraping_start()` | 26 | 26 |
| `log_scraping_page()` | ~130 | 130 |
| `log_article_collected()` | ~100 | 100 |
| `log_scraping_complete()` | 26 | 26 |
| `log_ai_article_start()` | ~50 | 50 |
| `log_ai_result()` | ~50 | 50 |
| **Total** | | **~380 INSERTs** |

**Network overhead:** Each INSERT = ~50-100ms latency

### 2.3 GUI Update Frequency

```python
# AILogWindow methods calling root.update()
_add_log()      -> self.root.update()   # Every log line
_update_stats() -> self.root.update()   # Every stat change
_update_progress() -> self.root.update() # Every progress change
```

**For 50 articles:**
- 50 x log_article_start() = 50 updates
- 50 x log_validation_step() = 50 updates (minimum)
- 50 x log_article_result() = 50 updates
- 50 x _update_stats() = 50 updates
- 50 x _update_progress() = 50 updates
- **Total: ~250+ GUI updates**

Plus the 100ms scheduled update loop (line 189):
```python
self.root.after(100, self._schedule_update)  # 10 updates/second
```

---

## Round 3: Memory/Process Leak Analysis

### 3.1 Peak Memory Usage Calculation

| Process | Min | Max | Notes |
|---------|-----|-----|-------|
| Python main | 100MB | 200MB | Includes job_logger, log arrays |
| Playwright x5 | 1GB | 2.5GB | 5 concurrent browsers |
| Ollama (qwen2.5:14b) | 2GB | 4GB | 14B parameter model |
| Node.js (Next.js) | 300MB | 500MB | Dev server |
| CustomTkinter GUI | 50MB | 100MB | |
| **TOTAL** | **3.45GB** | **7.3GB** | |

**Warning:** On 8GB RAM systems, this leaves only 0.7-4.55GB for OS and other applications.

### 3.2 Process Management Issues

**Issue 1: Orphaned Subprocess References**
```python
# line 374-379 - No reference kept
subprocess.Popen('ollama serve', ...)  # Lost reference
# Cannot track or kill later if needed
```

**Issue 2: Aggressive Process Killing**
```python
# line 434 - Kills ALL node.exe processes
subprocess.run('taskkill /f /im node.exe', ...)
# Affects other Node.js applications on the system
```

**Issue 3: Incomplete Thread Cancellation**
```python
# line 914-922 - Futures cancelled but threads continue
for future in not_done:
    future.cancel()  # Only prevents result retrieval
    # Underlying thread/process may still run!
```

### 3.3 Memory Accumulation Points

1. **log_lines array** (line 496): Grows unbounded during execution
2. **JobLogger.stats dict**: Accumulates all operation statistics
3. **GUI TextBox**: Appends text indefinitely without trimming

---

## Prioritized Fix Recommendations

### P0 - Critical (Must Fix)

| # | Issue | Fix | Estimated Impact |
|---|-------|-----|-----------------|
| 1 | Ollama 2-4GB memory | Run only when needed, stop between batches | -2-4GB memory |
| 2 | 5 concurrent browsers | Reduce MAX_WORKERS to 3 | -400MB-1GB memory |
| 3 | GUI 100ms update loop | Increase to 500ms or 1000ms | -80% CPU reduction |

### P1 - High (Should Fix)

| # | Issue | Fix | Estimated Impact |
|---|-------|-----|-----------------|
| 4 | 380 DB INSERTs | Batch inserts (every 10-20 logs) | -90% DB calls |
| 5 | Triple logging | Remove GUI logging in headless mode | -33% I/O |
| 6 | Node.js always running | Start only for AI processing, stop after | -300MB memory |

### P2 - Medium (Nice to Have)

| # | Issue | Fix | Estimated Impact |
|---|-------|-----|-----------------|
| 7 | Orphaned Popen | Store process references, proper cleanup | Better control |
| 8 | taskkill /f /im node.exe | Use process reference instead | No side effects |
| 9 | Incomplete thread cancel | Implement proper worker termination | Clean shutdown |

---

## Quick Win Implementations

### Quick Win 1: Reduce MAX_WORKERS

```python
# Before
MAX_WORKERS = 5

# After (30-40% memory reduction)
MAX_WORKERS = 3
```

### Quick Win 2: Increase GUI Update Interval

```python
# Before
self.root.after(100, self._schedule_update)

# After (80% CPU reduction)
self.root.after(500, self._schedule_update)
```

### Quick Win 3: Batch Database Logging

```python
# job_logger.py - Add batch buffer
class JobLogger:
    def __init__(self, supabase_client):
        self._log_buffer = []
        self._buffer_size = 20

    def _log(self, ...):
        self._log_buffer.append(log_entry)
        if len(self._log_buffer) >= self._buffer_size:
            self._flush_logs()

    def _flush_logs(self):
        if self._log_buffer:
            self.supabase.table('job_logs').insert(self._log_buffer).execute()
            self._log_buffer = []
```

### Quick Win 4: Disable GUI in Task Scheduler Mode

```python
# Add command line argument
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--headless', action='store_true')
args = parser.parse_args()

# Skip GUI creation
if not args.headless and GUI_AVAILABLE:
    log_window = AILogWindow()
```

---

## Monitoring Recommendations

### Add Resource Monitoring

```python
import psutil

def log_resource_usage():
    process = psutil.Process()
    mem_mb = process.memory_info().rss / 1024 / 1024
    cpu_pct = process.cpu_percent()
    print(f"[RESOURCE] Memory: {mem_mb:.0f}MB, CPU: {cpu_pct}%")
```

### Add Memory Warning Threshold

```python
MEMORY_WARNING_MB = 6000  # 6GB

def check_memory():
    mem_mb = psutil.Process().memory_info().rss / 1024 / 1024
    if mem_mb > MEMORY_WARNING_MB:
        print(f"[WARNING] High memory usage: {mem_mb}MB")
        # Consider pausing or reducing workers
```

---

## Conclusion

The scheduler crashes primarily due to:

1. **Memory exhaustion** from running 5 browsers + Ollama + Node.js simultaneously
2. **CPU saturation** from GUI update loop and triple logging
3. **I/O bottleneck** from 380+ database inserts per execution

**Recommended immediate actions:**
1. Reduce MAX_WORKERS from 5 to 3
2. Disable GUI when running from Task Scheduler
3. Implement batch database logging

---

*Report generated: 2025-12-26*
*Files analyzed: scheduled_scraper.py (1125 lines), job_logger.py (426 lines)*

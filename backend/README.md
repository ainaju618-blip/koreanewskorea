# Backend (backend/) AI Guide

> **Summary:** Legacy Python backend scripts and utilities for Korea NEWS.

---

## Key Files

| File | Description |
|------|-------------|
| `DEVELOPMENT_RULES.md` | Development rules and guidelines |
| `main_bot.py` | Main bot script |
| `ai_rewriter.py` | AI content rewriter |
| `rss_collector.py` | RSS feed collector |
| `db_loader.py` | Database loader utility |

---

## Subfolders

| Folder | Description |
|--------|-------------|
| `processors/` | Data processors (has its own README) |

---

## Script Categories

### Bot Scripts
| File | Description |
|------|-------------|
| `main_bot.py` | Main bot orchestration |
| `create_scheduler.py` | Scheduler creation |
| `run_pipeline.py` | Pipeline runner |

### Data Scripts
| File | Description |
|------|-------------|
| `db_loader.py` | Load data to database |
| `load_json_to_api.py` | Load JSON to API |
| `load_naju_data.py` | Naju specific loader |

### AI Scripts
| File | Description |
|------|-------------|
| `ai_rewriter.py` | AI content rewriting |
| `rss_collector.py` | RSS collection |

### Test Scripts
| File | Description |
|------|-------------|
| `test_*.py` | Various test scripts |

---

## Note

**This folder contains legacy Python scripts.**
Main scraper code is in `scrapers/` folder.

---

## FAQ

| Question | Answer |
|----------|--------|
| "Development rules?" | `DEVELOPMENT_RULES.md` |
| "Main bot script?" | `main_bot.py` |
| "AI rewriter?" | `ai_rewriter.py` |
| "Current scrapers?" | `scrapers/` folder (not here) |

---

## Related Documents

| Document | Path |
|----------|------|
| Scraper Guide | `scrapers/README.md` |
| Processors | `backend/processors/README.md` |

---

*Last updated: 2025-12-17*

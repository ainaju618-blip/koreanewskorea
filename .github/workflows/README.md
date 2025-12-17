# GitHub Actions Workflows AI Guide

> **Summary:** Automated CI/CD workflows for Korea NEWS - mainly scraper automation.

---

## Available Workflows

| Workflow | File | Description |
|----------|------|-------------|
| **Daily Scrape** | `daily_scrape.yml` | Automated news scraping |

---

## Daily Scrape Workflow

### Schedule (Auto-Run)
| Time (KST) | Cron (UTC) |
|------------|------------|
| 09:00 | `0 0 * * *` |
| 13:00 | `0 4 * * *` |
| 17:00 | `0 8 * * *` |

### Manual Trigger (workflow_dispatch)
| Input | Description | Default |
|-------|-------------|---------|
| `region` | Region to scrape (all, gwangju, naju, etc.) | `all` |
| `days` | Days to scrape (1-7) | `1` |
| `log_id` | Bot log ID for status updates | (optional) |

### Environment Variables (Secrets)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service key |
| `BOT_API_KEY` | Bot authentication key |
| `BOT_API_URL` | Bot API endpoint |
| `CLOUDINARY_*` | Image upload (currently disabled) |

### Execution Flow
1. Checkout code
2. Setup Python 3.11
3. Install dependencies + Playwright
4. Run 27 region scrapers sequentially
5. Each scraper: `continue-on-error: true` (failure doesn't stop others)

---

## FAQ

| Question | Answer |
|----------|--------|
| "When does auto-scrape run?" | 09:00, 13:00, 17:00 KST daily |
| "How to run manually?" | GitHub Actions > Daily News Scrape > Run workflow |
| "Can I run specific region?" | Yes, use `region` input (e.g., `naju`, `gwangju`) |
| "What if one scraper fails?" | Others continue (`continue-on-error: true`) |
| "Where are logs?" | GitHub Actions run logs + `/admin/bot/logs` in app |

---

## Related Systems

| System | Location | Description |
|--------|----------|-------------|
| **Local Scheduler** | `src/lib/scheduler.ts` | Alternative: runs on Vercel server |
| **Bot Admin UI** | `/admin/bot/run` | Manual control & monitoring |
| **Scraper Code** | `scrapers/` | Python scraper modules |

---

## Commands

```bash
# Check recent workflow runs
gh run list --workflow=daily_scrape.yml --limit=10

# Trigger manual run
gh workflow run daily_scrape.yml -f region=naju -f days=1

# View specific run logs
gh run view [run-id] --log
```

---

*Last updated: 2025-12-17*

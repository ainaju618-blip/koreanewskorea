# Scrapers AI Guide

> **Summary:** 27 regional press release scrapers for Jeonnam/Gwangju area with auto-scheduling system.

---

## Auto-Scheduling Systems (2 Types)

| System | Location | Method | Schedule |
|--------|----------|--------|----------|
| **GitHub Actions** | `.github/workflows/daily_scrape.yml` | Cloud (GitHub server) | 09:00, 13:00, 17:00 KST |
| **Local Scheduler** | `src/lib/scheduler.ts` + `/admin/bot/run` | Server (Vercel, node-cron) | 09:00, 13:00, 17:00 KST |

### Local Scheduler Control
- **UI Location:** `/admin/bot/run` page
- **Toggle:** ON/OFF switch available
- **API:** `/api/bot/schedule`

---

## Key Files & Folders

| Path | Role |
|------|------|
| `[region]/[region]_scraper.py` | Region-specific scraper (27 total) |
| `[region]/ALGORITHM.md` | Region-specific algorithm docs |
| `utils/api_client.py` | API submission (`send_article_to_server`) |
| `utils/scraper_utils.py` | Playwright helpers, `detect_category()` |
| `utils/local_image_saver.py` | Local image storage |
| `utils/telegram_notifier.py` | Telegram notifications |
| `templates/` | Scraper templates for new regions |
| `SCRAPER_GUIDE.md` | Full AI development guide (v3.3) |
| `STATUS.md` | Implementation status (26/26 complete) |

---

## FAQ

| Question | Answer |
|----------|--------|
| "Is there auto-scheduling?" | **Yes, 2 systems:** GitHub Actions + Local Scheduler (see above) |
| "How does the bot work?" | Scrape list page -> Visit detail -> Extract content/images -> POST to `/api/bot/ingest` -> DB |
| "How to run manually?" | `/admin/bot/run` page or `python scrapers/[region]/[region]_scraper.py --days 1` |
| "Telegram notification?" | Yes, `utils/telegram_notifier.py` sends alerts |
| "Image storage?" | Local: `scrapers/images/[region]/` (Cloudinary disabled) |
| "How to add new region?" | Copy `templates/base_scraper_template.py`, follow `SCRAPER_GUIDE.md` Section 8 |
| "자동예약 있어? 스케줄러?" | **2개 시스템:** GitHub Actions + Local Scheduler (위 표 참조) |
| "봇이 어떻게 작동해?" | 목록 페이지 수집 → 상세 페이지 방문 → 본문/이미지 추출 → `/api/bot/ingest`로 전송 → DB 저장 |
| "수동으로 실행하려면?" | `/admin/bot/run` 페이지 또는 `python scrapers/[지역]/[지역]_scraper.py --days 1` |
| "크롤러 어디 있어?" | `scrapers/[지역]/[지역]_scraper.py` (27개 지역) |
| "스크래퍼 상태?" | `STATUS.md` - 26/26 완료 |
| "새 스크래퍼 만들려면?" | `SCRAPER_GUIDE.md` Section 8 참조, `templates/` 복사 |
| "보도자료 수집 방법?" | Python Playwright로 각 지역 보도자료 페이지 크롤링 |
| "이미지는 어디 저장?" | `scrapers/images/[지역]/` (로컬 저장) |
| "텔레그램 알림?" | `utils/telegram_notifier.py` - 수집 완료/에러 알림 |
| "API로 전송하는 코드?" | `utils/api_client.py` - `send_article_to_server()` |
| "카테고리 자동 분류?" | `utils/scraper_utils.py` - `detect_category()` |
| "언제 자동 실행?" | 매일 09:00, 13:00, 17:00 KST |
| "GitHub Actions 어디?" | `.github/workflows/daily_scrape.yml` |
| "로컬 스케줄러 어디?" | `src/lib/scheduler.ts` + `/admin/bot/run` |
| "개발 가이드?" | `SCRAPER_GUIDE.md` (AI용), `SCRAPER_DEVELOPMENT_GUIDE.md` (외부 협업용) |

---

## Related Documents

| Document | Path |
|----------|------|
| Full Development Guide | `scrapers/SCRAPER_GUIDE.md` |
| External Partner Guide (EN) | `scrapers/SCRAPER_DEVELOPMENT_GUIDE.md` |
| External Partner Guide (KR) | `scrapers/scraper_development_guide_kr.md` |
| Implementation Status | `scrapers/STATUS.md` |
| Change Log | `scrapers/SCRAPER_CHANGELOG.md` |
| GitHub Actions Workflow | `.github/workflows/daily_scrape.yml` |
| Local Scheduler | `src/lib/scheduler.ts` |
| Bot Admin UI | `src/app/admin/bot/run/` |

---

## Quick Commands

```bash
# Run single region (local test)
python scrapers/naju/naju_scraper.py --days 1 --max-articles 3

# Verify all scrapers
python scrapers/verify_scrapers.py

# Test imports
python scrapers/test_imports.py
```

---

*Last updated: 2025-12-17*

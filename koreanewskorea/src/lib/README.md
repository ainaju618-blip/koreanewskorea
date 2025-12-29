# Library (src/lib) AI Guide

> **Summary:** Utility functions, services, and core business logic for Korea NEWS.

---

## Key Files

| File | Description | Important |
|------|-------------|-----------|
| `scheduler.ts` | **Local scheduler (node-cron)** - Auto scraping at 9/13/17 KST | **CRITICAL** |
| `bot-service.ts` | Bot/scraper service logic | **CRITICAL** |
| `supabase.ts` | Supabase client (basic) | Core |
| `supabase-admin.ts` | Supabase admin client (service role) | Core |
| `supabase-client.ts` | Supabase browser client | Core |
| `supabase-server.ts` | Supabase server-side client | Core |
| `permissions.ts` | Role-based permission system | Core |
| `category-constants.ts` | Category definitions and mappings | Core |
| `regions.ts` | 27 regions data (names, codes) | Core |

---

## Service Files

| File | Description |
|------|-------------|
| `ai-news-service.ts` | AI news collection service |
| `auto-assign.ts` | Auto-assign articles to categories |
| `article-history.ts` | Article edit history tracking |

---

## Utility Files

| File | Description |
|------|-------------|
| `contentUtils.ts` | Content manipulation utilities |
| `cookies.ts` | Cookie management |
| `geolocation.ts` | User location detection |
| `personalization.ts` | User personalization logic |
| `behaviorTracker.ts` | User behavior tracking |
| `cloudinary-utils.ts` | Cloudinary image utilities |

---

## Subfolders

| Folder | Description |
|--------|-------------|
| `admin/` | Admin-specific utilities |

---

## FAQ

| Question | Answer |
|----------|--------|
| "자동 예약? 스케줄러?" | `scheduler.ts` - node-cron, 9/13/17시 자동 실행 |
| "자동 수집 시스템?" | `scheduler.ts` + `.github/workflows/daily_scrape.yml` (2개 있음!) |
| "봇 서비스? 스크래퍼 로직?" | `bot-service.ts` |
| "DB 연결? Supabase?" | `supabase.ts`, `supabase-admin.ts`, `supabase-server.ts` |
| "권한 시스템? 역할 관리?" | `permissions.ts` |
| "카테고리 정의? 분류?" | `category-constants.ts` |
| "27개 지역 데이터?" | `regions.ts` |
| "AI 뉴스 수집?" | `ai-news-service.ts` |
| "기사 자동 분류?" | `auto-assign.ts` |
| "기사 수정 이력?" | `article-history.ts` |
| "사용자 위치 감지?" | `geolocation.ts` |
| "개인화 로직?" | `personalization.ts` |
| "사용자 행동 추적?" | `behaviorTracker.ts` |
| "이미지 업로드? Cloudinary?" | `cloudinary-utils.ts` |
| "쿠키 관리?" | `cookies.ts` |
| "콘텐츠 유틸리티?" | `contentUtils.ts` |

---

## Auto-Scheduling Systems (IMPORTANT)

Korea NEWS has **TWO** auto-scheduling systems:

| System | Location | Description |
|--------|----------|-------------|
| **Local Scheduler** | `src/lib/scheduler.ts` | node-cron based, runs on Vercel server |
| **GitHub Actions** | `.github/workflows/daily_scrape.yml` | Cloud-based, runs on GitHub |

**Local Scheduler Details:**
- Default cron: `0 9,13,17 * * *` (9:00, 13:00, 17:00 KST)
- ON/OFF toggle: `/admin/bot/run` page
- API: `/api/bot/schedule`

---

## Related Documents

| Document | Path |
|----------|------|
| Backend Guide | `info/backend.md` |
| Bot API | `src/app/api/README.md` |
| GitHub Actions | `.github/workflows/README.md` |
| Scraper Guide | `scrapers/README.md` |

---

*Last updated: 2025-12-17*

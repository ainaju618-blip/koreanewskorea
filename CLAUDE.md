# Korea NEWS Control Tower

> **Version:** v6.0 | **Updated:** 2025-12-29
> **Call user:** "joo-in-nim" (Master)

---

# DASHBOARD (Current Status)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROJECT STATUS                                              2025-12-29     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [PRODUCTION] koreanewsone.com ────────────────────────── ● RUNNING        │
│               src/ folder | Port 3000 | DO NOT TOUCH for other projects    │
│                                                                             │
│  [DEVELOPMENT] Regional Sites ─────────────────────────── ◐ IN PROGRESS    │
│               gwangju/ (Port 3001) | jeonnam/ (Port 3002)                  │
│               Spec: 로컬홈페이지작업.md                                      │
│                                                                             │
│  [PAUSED] HQ Homepage ─────────────────────────────────── ○ PAUSED         │
│               koreanewshq/ | Too complex, revisit later                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Active Work Queue

| Priority | Task | Domain | Spec Document | Status |
|:--------:|------|--------|---------------|:------:|
| **P1** | Gwangju Regional Site | `gwangju/` | [로컬홈페이지작업.md](로컬홈페이지작업.md) | 🔄 |
| **P2** | Jeonnam Regional Site | `jeonnam/` | [로컬홈페이지작업.md](로컬홈페이지작업.md) | ⏸️ |
| **--** | Main Site Bugs | `src/` | N/A | As needed |

> **Status Legend:** 🔄 Active | ⏸️ Waiting | ✅ Done | ❌ Blocked

## Quick Actions

| I want to... | Go to | Command |
|--------------|-------|---------|
| Work on regional site | `gwangju/` or `jeonnam/` | `cd gwangju && npm run dev` |
| Fix main site bug | `src/` | `npm run dev` (port 3000) |
| Check scraper status | `scrapers/` | `python scrapers/batch_scrape.py` |
| Deploy changes | - | `git push` (auto-deploy) |

---

# WORK ROUTING

## Before Any Work: Check Domain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER REQUEST                         →                    WORK DOMAIN      │
├─────────────────────────────────────────────────────────────────────────────┤
│  "gwangju site", "regional", "jeonnam"                     gwangju/ or      │
│  "local site", "subdomain"                                 jeonnam/         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  "fix bug", "main site error"                              src/             │
│  "production issue", "koreanewsone.com"                    (CAREFUL!)       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  "scraper", "data collection"                              scrapers/        │
│  "python", "crawler"                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  "HQ", "koreanewskorea.com"                                PAUSED           │
│  "headquarters"                                            (Do not work)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Domain Details

### Domain A: Regional Sites (ACTIVE)

| Item | gwangju/ | jeonnam/ |
|------|----------|----------|
| **Target** | gwangju.koreanewsone.com | jeonnam.koreanewsone.com |
| **Port** | 3001 | 3002 |
| **Status** | Active | Waiting |
| **Spec** | [로컬홈페이지작업.md](로컬홈페이지작업.md) | Same |

```bash
# Start development
cd gwangju && npm run dev    # Port 3001
cd jeonnam && npm run dev    # Port 3002
```

### Domain B: Main Site (PRODUCTION)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  src/ = PRODUCTION = koreanewsone.com                                   │
│                                                                             │
│  • DO NOT modify for regional site work                                    │
│  • Only bug fixes and maintenance                                          │
│  • Test thoroughly before any change                                       │
│  • Changes affect live users immediately                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Domain C: Paused

| Project | Folder | Reason |
|---------|--------|--------|
| HQ Homepage | `koreanewshq/` | Too complex |
| Old Regional | ~~`koreanewskorea/`~~ | Deprecated (deleted) |

---

# P0 RULES (Violation = REJECT)

## Absolute Rules

| # | Rule | Violation |
|:-:|------|-----------|
| 1 | **DO NOT modify src/ for regional work** | STOP |
| 2 | Call user "joo-in-nim" | Correction |
| 3 | No emojis in code | REJECT |
| 4 | No Korean in code/comments | REJECT |
| 5 | No `alert()`/`confirm()` | REJECT |
| 6 | Context7 for new libraries | REJECT |
| 7 | Error → Document in `info/errors/` | INCOMPLETE |
| 8 | Session → Log in `.claude/context/` | INVALID |

## Korean UI Rule

```
User-facing UI  →  Korean (저장, 취소, 실행)
Code/Comments   →  English only
```

> **Full Rules:** [.claude/rules/golden-rules.md](.claude/rules/golden-rules.md)

---

# REQUEST DISPATCH

| Keyword | Mode | Action |
|---------|------|--------|
| 제안해/추천해/아이디어 | Idea | Think → List options |
| 검토해/확인해/봐줘 | Review | Read → Analyze |
| 계획/설계/구상 | Plan | Think → Steps |
| **해줘/만들어/고쳐** | **Execute** | **Do work** |
| 현황/진행상황/어디까지 | Status | Check Dashboard |

---

# PROJECT INFO

## Features (Main Site)

| Feature | URL | Source |
|---------|-----|--------|
| Main News | `/` | `src/app/page.tsx` |
| Category | `/category/*` | `src/app/category/` |
| CosmicPulse | `/cosmos/` | `src/app/cosmos/` |
| Claude Hub | `/admin/claude-hub` | `src/app/admin/claude-hub/` |
| Reporter | `/reporter/*` | `src/app/reporter/` |
| Blog | `/blog/*` | `src/app/blog/` |
| Admin | `/admin/*` | `src/app/admin/` |

## Tech Stack

| Area | Tech |
|------|------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind 4 |
| Database | Supabase (PostgreSQL) |
| Scraper | Python + Playwright |
| Images | Cloudinary |

## Target Regions (27)

**Metro (2):** Gwangju, Jeonnam Province
**Cities (5):** Mokpo, Yeosu, Suncheon, Naju, Gwangyang
**Counties (17):** Damyang, Gokseong, Gurye, Goheung, Boseong, Hwasun, Jangheung, Gangjin, Haenam, Yeongam, Muan, Hampyeong, Yeonggwang, Jangseong, Wando, Jindo, Sinan
**Education (2):** Gwangju Ed, Jeonnam Ed

---

# REFERENCE LINKS

## Rules (Must Read)

| Document | Content |
|----------|---------|
| [Golden Rules](.claude/rules/golden-rules.md) | Do's & Don'ts |
| [Workflow](.claude/rules/workflow.md) | Session workflow |
| [Git & Deploy](.claude/rules/git-deploy.md) | Commit rules |
| [Tech Standards](.claude/rules/tech-standards.md) | Coding standards |
| [Admin UI](.claude/rules/admin-ui-rules.md) | Desktop-first, tables |

## Domain Guides

| Document | Content |
|----------|---------|
| [Frontend](info/frontend.md) | React, components |
| [Backend](info/backend.md) | API, Supabase |
| [Database](info/database.md) | Schema |
| [Design System](info/design-system.md) | Colors, fonts |
| [Scraper Guide](scrapers/SCRAPER_GUIDE.md) | Python scrapers |

## Error & Session

| Document | Content |
|----------|---------|
| [Error Catalog](info/errors/_catalog.md) | Search errors first! |
| [Session Log](.claude/context/session_log.md) | Session history |
| [Current Task](.claude/context/current_task.md) | Ongoing work |

---

# INFRASTRUCTURE

## Git Config

| Project | Email | Name |
|---------|-------|------|
| koreanews | kyh6412057153@gmail.com | yuhyang |

```bash
git config user.email "kyh6412057153@gmail.com"
git config user.name "yuhyang"
```

## Vercel

| Item | Value |
|------|-------|
| Project | `koreanewsone` |
| Team | `koreanews-projects` |
| Domain | koreanewsone.com |
| Deploy | `git push` (auto) |

## Commands

```bash
# Development
npm run dev              # Port 3000 (main site)
cd gwangju && npm run dev # Port 3001 (regional)

# Build & Deploy
npx tsc --noEmit         # Type check
git push                 # Auto deploy

# Verify
cat .vercel/project.json # Check linked project
```

---

# FAQ

| Question | Answer |
|----------|--------|
| Can I modify src/? | **NO** - Production site |
| Where to work on regional? | `gwangju/` or `jeonnam/` |
| New library? | Use **Context7** first |
| Error occurred? | Search `info/errors/_catalog.md` |
| Session complete? | Write to `.claude/context/session_log.md` |

---

*Korea NEWS Control Tower v6.0*
*Detailed rules delegated to `.claude/rules/` files*

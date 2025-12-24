# Korea NEWS AI Agent Instructions

> **Project:** Korea NEWS - Jeonnam/Gwangju Regional News Automation Platform
> **Role:** Project Execution Manager (Speed & Stability First)
> **Version:** v5.1
> **Last Updated:** 2025-12-25

---

# Part 0: Project Overview (MUST READ FIRST)

> **All AI agents MUST read this section on first entry.**

## 0.1 Project Identity

```
Official Name: 코리아NEWS (Gwangju City Hall Registered)

Domains:
  - koreanewskorea.com (Primary)
  - koreanewsone.com

Mission:
  Auto-collect press releases from 27 Jeonnam/Gwangju regions,
  process with AI, and deliver news to citizens.

Main Content:
  - Regional News (27 agency press releases)
  - Space/Science News (CosmicPulse)
  - AI Knowledge Management (Claude Hub)
  - Reporter Portal
  - Blog System
```

## 0.2 Feature Map

| Section | URL | Description | Target Users |
|---------|-----|-------------|--------------|
| **Main News** | `/` | Regional news home | Citizens |
| **Category News** | `/category/*` | Politics/Economy/Society/Culture | Citizens |
| **Regional News** | `/category/jeonnam/*` | 27 regional news | Citizens |
| **CosmicPulse** | `/cosmos/` | Space/Science News | Science fans |
| **Claude Hub** | `/admin/claude-hub` | AI Knowledge System | AI/Admin |
| **Reporter Portal** | `/reporter/*` | Reporter-only portal | Registered reporters |
| **Blog** | `/blog/*` | Blog system | Bloggers |
| **Admin** | `/admin/*` | Admin dashboard | Administrators |

## 0.3 Source Path Quick Reference

| Feature | URL | Source Path | API Path |
|---------|-----|-------------|----------|
| Blog | `/blog/*` | `src/app/blog/` | `/api/blog/` |
| CosmicPulse | `/cosmos/*` | `src/app/cosmos/` | - |
| Claude Hub | `/admin/claude-hub` | `src/app/admin/claude-hub/` | `/api/claude-hub/` |
| Reporter Portal | `/reporter/*` | `src/app/reporter/` | `/api/reporter/` |
| Admin | `/admin/*` | `src/app/admin/` | `/api/admin/` |

## 0.4 FAQ for AI

| Question | Answer |
|----------|--------|
| "Space-related content?" | **Yes, CosmicPulse at /cosmos/** |
| "Knowledge management?" | **Yes, Claude Hub at /admin/claude-hub** |
| "Can reporters write articles?" | **Yes, Reporter Portal at /reporter/** |
| "Blog feature?" | **Yes, blog system at /blog/** |
| "What's the scraper?" | **Python module auto-collecting 27 regional press releases** |
| "Dark mode?" | **Yes, `.admin-layout` class in globals.css** |
| "CSS/Styles location?" | **`src/app/globals.css` (main) + `tailwind.config.ts` (theme)** |
| "Where to find past errors?" | **`info/errors/_catalog.md` - search keywords first!** |
| "Where to record fixed errors?" | **`info/errors/[category]/` + add to `_catalog.md`** |
| "Session history?" | **`.claude/context/session_log.md`** |
| "Regional homepage business?" | **`koreanewskorea/plan/BUSINESS_STRATEGY.md`** |

## 0.5 Target Agencies (27)

- **Metro/Province (2):** Gwangju City, Jeonnam Province
- **Cities (5):** Mokpo, Yeosu, Suncheon, Naju, Gwangyang
- **Counties (17):** Damyang, Gokseong, Gurye, Goheung, Boseong, Hwasun, Jangheung, Gangjin, Haenam, Yeongam, Muan, Hampyeong, Yeonggwang, Jangseong, Wando, Jindo, Sinan
- **Education (2):** Gwangju Education Office, Jeonnam Education Office

---

# Critical Rules (P0 - Violation = REJECT)

| Rule | Violation Result |
|------|-----------------|
| Call user **"joo-in-nim"** (Master) | Immediate correction |
| **Part 0 not read** before answering | Answer **REJECT** |
| Reference docs not checked before work | Work **REJECT** |
| Session log not written | **Session invalid** |
| Using `alert()`/`confirm()` | Code review **REJECT** |
| **Context7 not used** (new tech/library) | Code review **REJECT** |
| **Emojis in code** | Code review **REJECT** (ASCII only) |
| **Korean in code/comments** | Code review **REJECT** (English only) |
| **Sub-agent not used** for repetitive tasks | **Warning** for slowness |
| **Creating new Vercel project** | Work **STOP** immediately |
| **Workarounds without approval** | Work **REJECT** + rollback |
| **Arbitrary execution during conversation** | **STOP** + conversation mode |
| **GNB/menu hardcoding** | Code review **REJECT** |
| **Same error 2+ times** | **STOP** + Full system review (not partial fix) |
| **Admin UI: cards/boxes for lists** | Code review **REJECT** (use tables) |
| **Admin UI: mobile-first design** | Code review **REJECT** (desktop-first only) |
| **Error not documented** after fix | Work **INCOMPLETE** - record in info/errors/ |
| **Session log not written** | Session **INVALID** |

> **Detail Rules:** See [.claude/rules/golden-rules.md](.claude/rules/golden-rules.md)

## Repeated Error Protocol (P0 - MUST)

```
When same/similar error occurs 2+ times:

1. STOP partial fixes immediately
2. Read ENTIRE related file(s) from top to bottom
3. Trace full data flow: Input -> Process -> Output
4. Identify ALL related functions/components
5. Create comprehensive fix plan BEFORE coding
6. Fix root cause, not symptoms
7. Verify fix doesn't break other parts

FORBIDDEN: Quick patch without full context review
```

## Work Completion Records (P0 - MUST)

> **Every work session MUST record the following. This is NOT optional.**

### 1. Error Documentation (When error fixed)

```
Location: info/errors/[category]/[error-name].md
Catalog:  info/errors/_catalog.md (add one line)

Categories:
  - backend/     : API, Supabase, server errors
  - frontend/    : React, UI, rendering errors
  - deploy/      : Vercel, build, CI/CD errors
  - scraper/     : Python scraper errors
  - database/    : Schema, query, migration errors

Format:
  # Error Title
  > Date, Severity, Category
  ## Symptom
  ## Error Message
  ## Root Cause
  ## Solution
  ## Prevention
  ## Related Files
```

### 2. Session Log (Every session)

```
Location: .claude/context/session_log.md

Format:
  ## [YYYY-MM-DD HH:MM] Session
  ### User Intent
  ### Work Done
  ### Errors Encountered (if any)
  ### Files Changed
  ### Deployment Status
```

### 3. Search Before Work

```
Before fixing any error:
1. Search info/errors/_catalog.md for keywords
2. If found -> Read existing solution -> Apply
3. If not found -> Fix -> Document new solution
```

---

# Quick Dispatch (Fast Response Routing)

| Keyword | Mode | Action | File Read |
|---------|------|--------|-----------|
| **Suggest/Recommend/Idea** | Idea | Think -> List options | NO |
| **Review/Check/Verify** | Review | Read minimal files -> Analyze | Minimal |
| **Plan/Design/Blueprint** | Plan | Think -> List steps | NO |
| **Do it/Make it/Fix it** | Execute | Perform work immediately | If needed |
| **Progress/Status/Current** | Status | Part 0 or STATUS file | Minimal |
| **What is/Is there/Where** | Question | Answer from Part 0 memory | NO |
| **External service/Env var/Token** | Lookup | info/backend.md Section 11 | MUST |

---

# Context Map (Action-Based Routing)

> **Detail rules are delegated to sub-files. Read relevant file before work.**

## Rule Files (.claude/rules/)

- **[Golden Rules (Do's & Don'ts)](.claude/rules/golden-rules.md)** - Immutable rules, conversation vs execution mode
- **[Workflow Rules](.claude/rules/workflow.md)** - Session start, work gates, error documentation
- **[Git & Deploy Rules](.claude/rules/git-deploy.md)** - Git commit, Vercel deployment rules
- **[Tech Standards](.claude/rules/tech-standards.md)** - Tech stack, encoding, SEO, Context7 usage
- **[Admin UI Rules](.claude/rules/admin-ui-rules.md)** - Admin page UI standards (desktop-first, tables over cards)

## Domain Guides (info/)

- **[Frontend Development](info/frontend.md)** - React, Next.js, Tailwind, components
- **[Backend Development](info/backend.md)** - API routes, Supabase, server logic
- **[Database Schema](info/database.md)** - Tables, columns, relationships
- **[Design System](info/design-system.md)** - Colors, fonts, theming
- **[Error Solutions](info/errors/_catalog.md)** - Searchable error solution catalog
- **[README Sync Guide](info/guides/README_SYNC_GUIDE.md)** - File add/delete FAQ sync rules
- **[GNB Menu Rules](info/guides/frontend/GNB_MENU_RULES.md)** - Menu hardcoding prohibition

## Scraper Guides (scrapers/)

- **[Scraper Development](scrapers/SCRAPER_GUIDE.md)** - New scraper development guide
- **[Region Algorithms](scrapers/[region]/ALGORITHM.md)** - Region-specific scraper logic

## Session Context (.claude/context/)

- **[Current Task](.claude/context/current_task.md)** - Ongoing work
- **[Session Log](.claude/context/session_log.md)** - Session history
- **[Decisions](.claude/context/decisions.md)** - Major decisions record

## Decision Log (.claude/decision_log/)

- **[Decision Log](.claude/decision_log/decision_log_01.md)** - Key discussions & decisions (latest at top, max 2000 lines/file)

---

# Operational Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npx tsc --noEmit         # Type check

# Deployment
git push                 # Triggers Vercel auto-deploy
vercel --prod            # Manual production deploy

# Verification
cat .vercel/project.json # Check Vercel project link
```

---

# Tech Stack Summary

| Area | Technology | Version |
|------|------------|---------|
| Framework | Next.js (App Router) | 16.0.7 |
| UI | React | 19.2.0 |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL) | - |
| Scraper | Python + Playwright | - |
| Image Storage | **Cloudinary** (P0) | - |

---

# Quick Reference Card

```
+-------------------------------------------------------------+
|  Quick Reference (Claude) - Speed & Stability First          |
|                                                              |
|  FEATURE KNOWLEDGE (P0):                                     |
|    - CosmicPulse (/cosmos/) = Space/Science news             |
|    - Claude Hub (/admin/claude-hub) = AI knowledge mgmt      |
|    - Reporter Portal (/reporter/*) = Reporter portal         |
|    - Blog (/blog/*) = Blog system                            |
|    -> Never answer "don't know" without reading Part 0!      |
|                                                              |
|  SPEED UP:                                                   |
|    - Do all work directly                                    |
|    - Repetitive tasks -> Sub-agent parallel processing       |
|                                                              |
|  STABILITY:                                                  |
|    - New tech -> Context7 lookup MUST                        |
|    - Before build -> tsc --noEmit type check                 |
|    - Errors -> Self-resolve then proceed                     |
|                                                              |
|  GIT COMMIT:                                                 |
|    - Default: Complete -> User approval -> Commit            |
|    - Exception: "Do it yourself" -> Autonomous commit        |
|                                                              |
|  REQUIRED RECORDS (P0):                                      |
|    1. BEFORE fixing error -> Search info/errors/_catalog.md  |
|    2. AFTER fixing error -> Write to info/errors/[cat]/      |
|    3. AFTER fixing error -> Add line to _catalog.md          |
|    4. EVERY session -> Write .claude/context/session_log.md  |
|                                                              |
|  PROHIBITED:                                                 |
|    - alert/confirm -> use useToast/useConfirm                |
|    - Emojis in code                                          |
|    - Korean in code/comments (UTF-8 encoding error)          |
|                                                              |
|  WORKAROUND BAN (P0):                                        |
|    - Try 3+ standard methods first                           |
|    - If all fail -> Report to user -> Proceed after approval |
|    - Unauthorized workaround = REJECT + rollback             |
+-------------------------------------------------------------+
```

---

# Document Hierarchy

```
koreanews/
+-- CLAUDE.md                    # This file - Control Tower
+-- .claude/rules/               # Delegated rule files
|   +-- golden-rules.md          # Do's & Don'ts
|   +-- workflow.md              # Session & task workflow
|   +-- git-deploy.md            # Git & Vercel rules
|   +-- tech-standards.md        # Tech stack & standards
+-- .claude/context/             # Session context
+-- info/                        # Domain guides
|   +-- frontend.md, backend.md, database.md, design-system.md
|   +-- errors/_catalog.md       # Error solution catalog
|   +-- guides/                  # Development guides
+-- scrapers/                    # Scraper modules
|   +-- SCRAPER_GUIDE.md         # Scraper development guide
+-- src/                         # Source code
    +-- README.md                # 82+ pages, 89 APIs documented
```

---

# Work Domains (Two Tracks)

> **AI agents work in two separate domains. Identify which domain before starting.**

## Domain A: New Development (Planning Required)

New features that require planning and specification before coding.

| Priority | Feature | Spec Document | Status |
|----------|---------|---------------|--------|
| **1** | **HQ Homepage (본사)** | [koreanewshq/plan/hq-homepage-spec.md](koreanewshq/plan/hq-homepage-spec.md) | **Active** |
| 2 | Regional Homepage System | [koreanewskorea/plan/regional-homepage-spec.md](koreanewskorea/plan/regional-homepage-spec.md) | Paused |

> **IMPORTANT - HQ Homepage uses SEPARATE infrastructure:**
> - Supabase: NEW account (not shared with koreanewsone)
> - Vercel: NEW account (not shared with koreanews-projects)
> - See "HQ Homepage Infrastructure" section below for details

> **Business Strategy:** [koreanewskorea/plan/BUSINESS_STRATEGY.md](koreanewskorea/plan/BUSINESS_STRATEGY.md)

**Workflow for Domain A:**
```
0. Read BUSINESS_STRATEGY.md (understand WHY)
1. Read the spec document (understand WHAT)
2. Check the checklist in the spec
3. Work only on items marked for current phase
4. Update checklist after completing work
5. Increment spec version if making significant changes
```

## Domain B: Existing Program Enhancement

Bug fixes, improvements, and maintenance of existing features.

**Workflow for Domain B:**
```
1. Identify the problem/enhancement
2. Read relevant source files
3. Fix/improve following existing patterns
4. Test locally before commit
5. Document in session log
```

## How to Identify Domain

| Signal | Domain |
|--------|--------|
| "New feature", "Build X from scratch" | **A - New Development** |
| "Fix bug", "Improve X", "Update X" | **B - Enhancement** |
| Spec document exists | **A - New Development** |
| Working on existing code | **B - Enhancement** |

---

# Active Specifications (Plan Documents)

> **Read these before working on new features**

| Priority | Document | Feature | Version | Status |
|----------|----------|---------|---------|--------|
| **1** | [koreanewshq/plan/hq-homepage-spec.md](koreanewshq/plan/hq-homepage-spec.md) | **HQ Homepage (본사)** | 0.1 | **Active** |
| 2 | [koreanewskorea/plan/BUSINESS_STRATEGY.md](koreanewskorea/plan/BUSINESS_STRATEGY.md) | Business Context (WHY) | 1.0 | Reference |
| 3 | [koreanewskorea/plan/regional-homepage-spec.md](koreanewskorea/plan/regional-homepage-spec.md) | Regional Homepage System | 0.4 | Paused |
| 4 | [plan/mainplan.md](plan/mainplan.md) | Master Strategy | 1.0 | Reference |

---

# Maintenance Policy

> **Self-Healing Clause**

When discrepancy found between rules and actual code:
1. Document the discrepancy
2. Propose update to relevant rule file
3. After user approval, update the rule
4. Record in session log

---

# Infrastructure by Project

## Project 1: Existing Main Site (src/)

| Item | Value |
|------|-------|
| **Project Name** | `koreanewsone` |
| **Team** | `koreanews-projects` |
| **Domain** | `koreanewsone.com` |
| **GitHub Repo** | `korea-news/koreanewsone` |
| **Supabase** | Shared with scrapers |
| **Status** | Maintenance mode |

> Deploy rule: `git push` triggers auto-deploy

---

## Project 2: HQ Homepage (koreanewshq/) - NEW

> **CRITICAL: Uses completely separate infrastructure from Project 1**

| Item | Value |
|------|-------|
| **Folder** | `koreanewshq/` |
| **Domain** | `koreanewskorea.com` |
| **Vercel Account** | NEW (TBD - user will provide) |
| **Vercel Project** | TBD |
| **Supabase Account** | NEW (TBD - user will provide) |
| **Supabase Project** | TBD |
| **GitHub Repo** | TBD (same repo or new?) |
| **Status** | **Active Development** |

### Why Separate Infrastructure?

```
1. 본사 = 독립 운영 (별도 결제, 별도 관리)
2. 장애 격리 (본사 장애가 지역에 영향 X)
3. 스케일링 독립 (본사 트래픽 vs 지역 트래픽)
4. 비용 분리 (명확한 비용 추적)
```

### Account Setup Checklist

- [ ] Vercel 새 계정 생성 or 팀 생성
- [ ] Supabase 새 프로젝트 생성
- [ ] 위 표에 실제 값 기입
- [ ] 환경변수 설정 (.env.local)
- [ ] 도메인 연결 (koreanewskorea.com)

---

## Project 3: Regional Subdomains (koreanewskorea/)

| Item | Value |
|------|-------|
| **Folder** | `koreanewskorea/` |
| **Domain Pattern** | `{region}.koreanewskorea.com` |
| **Infrastructure** | Shares with HQ Homepage (Project 2) |
| **Status** | Paused (after HQ completion) |

---

*This document is the control tower for AI agents working on Korea NEWS project.*
*Detailed rules are delegated to `.claude/rules/` files.*
*v5.2 - Added HQ Homepage project with separate infrastructure (2025-12-25)*

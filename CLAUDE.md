# Korea NEWS AI Agent Instructions

> **Project:** Korea NEWS - Jeonnam/Gwangju Regional News Automation Platform
> **Role:** Project Execution Manager (Speed & Stability First)
> **Version:** v5.0
> **Last Updated:** 2025-12-19

---

# Part 0: Project Overview (MUST READ FIRST)

> **All AI agents MUST read this section on first entry.**

## 0.1 Project Identity

```
Korea NEWS (koreanewsone.com)

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

> **Detail Rules:** See [.claude/rules/golden-rules.md](.claude/rules/golden-rules.md)

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

---

# Context Map (Action-Based Routing)

> **Detail rules are delegated to sub-files. Read relevant file before work.**

## Rule Files (.claude/rules/)

- **[Golden Rules (Do's & Don'ts)](.claude/rules/golden-rules.md)** - Immutable rules, conversation vs execution mode
- **[Workflow Rules](.claude/rules/workflow.md)** - Session start, work gates, error documentation
- **[Git & Deploy Rules](.claude/rules/git-deploy.md)** - Git commit, Vercel deployment rules
- **[Tech Standards](.claude/rules/tech-standards.md)** - Tech stack, encoding, SEO, Context7 usage

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
|  REQUIRED RECORDS:                                           |
|    - Error resolved -> info/errors/ + _catalog.md            |
|    - Session log -> .claude/context/session_log.md           |
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

# Maintenance Policy

> **Self-Healing Clause**

When discrepancy found between rules and actual code:
1. Document the discrepancy
2. Propose update to relevant rule file
3. After user approval, update the rule
4. Record in session log

---

# Vercel Project Info

| Item | Value |
|------|-------|
| **Project Name** | `koreanewsone` |
| **Team** | `koreanews-projects` |
| **Production Domain** | `www.koreanewsone.com` |
| **GitHub Repo** | `korea-news/koreanewsone` |

> **NEVER create new Vercel project! Deploy to existing project only.**

---

*This document is the control tower for AI agents working on Korea NEWS project.*
*Detailed rules are delegated to `.claude/rules/` files.*
*v5.0 - Restructured with AGENTS.md best practices (500-line limit, no emojis in rules, delegation)*

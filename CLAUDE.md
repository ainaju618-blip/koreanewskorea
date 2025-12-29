# Korea NEWS Control Tower

> **Version:** v8.0 | **Updated:** 2025-12-30
> **Call user:** "joo-in-nim" (Master)

---

# P0 PROTECTION (ABSOLUTE - READ FIRST)

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║   🛡️  1번작업 = Production (koreanewsone.com) = UNTOUCHABLE                ║
║                                                                             ║
║   위치: src/                                                                ║
║   포트: 3000                                                                ║
║                                                                             ║
║   ❌ 절대 금지:                                                             ║
║      - 2번작업 중 src/ 폴더 수정                                           ║
║      - koreanewsone.com에 영향 주는 어떤 변경도 금지                       ║
║      - 실험적 코드를 src/에 적용                                           ║
║                                                                             ║
║   ✅ 허용 (주인님 명시적 요청시만):                                         ║
║      - 버그 수정                                                            ║
║      - 긴급 보안 패치                                                       ║
║                                                                             ║
║   위반시: 즉시 작업 중단 + 롤백                                            ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║   🔵  2번작업 = koreanewskorea/ (통합 플랫폼)                               ║
║                                                                             ║
║   도메인: koreanewskorea.com                                                ║
║   포트: 3002                                                                ║
║                                                                             ║
║   URL 구조:                                                                 ║
║      /              → 중앙뉴스 (전국 정책, 정부 보도자료)                   ║
║      /policy/       → 정책 브리핑, KTV                                     ║
║      /tour/         → 전국 관광                                            ║
║      /gwangju/      → 광주 지역뉴스                                        ║
║      /mokpo/        → 목포/영암/무안/신안 지역뉴스                         ║
║      /yeosu/        → 여수 지역뉴스                                        ║
║      ... (9개 권역)                                                        ║
║                                                                             ║
║   ✅ koreanewskorea/ 폴더 자유롭게 개발 가능                                ║
║   ❌ src/ 폴더 절대 금지!                                                   ║
║   ❌ scrapers/ 폴더 수정 절대 금지!                                         ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║   ⚠️  DEPRECATED 폴더들                                                     ║
║      - jeonnam/      → koreanewskorea/로 통합됨                            ║
║      - koreanewshq/  → koreanewskorea/로 통합됨                            ║
║      - gwangju/      → 삭제 예정                                           ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║   🟠  scrapers/ = 스크래퍼 (별도 작업)                                      ║
║                                                                             ║
║   - 주인님이 별도로 지시시만 수정                                          ║
║   - 데이터는 Supabase 통해 공유                                            ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

# DASHBOARD (Current Status)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROJECT STATUS                                              2025-12-30     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [PRODUCTION] koreanewsone.com ────────────────────────── 🟢 PROTECTED     │
│               src/ folder | Port 3000 | 🛡️ DO NOT TOUCH                    │
│                                                                             │
│  [ACTIVE] koreanewskorea.com ─────────────────────────── 🔵 IN PROGRESS    │
│               koreanewskorea/ | Port 3002                                  │
│               통합 플랫폼: 중앙뉴스 + 9개 권역 지역뉴스                    │
│                                                                             │
│  [DEPRECATED] jeonnam/, koreanewshq/, gwangju/ ────────── ⚠️ MERGED        │
│               → koreanewskorea/로 통합됨                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# UNIFIED PLATFORM PROJECT (koreanewskorea.com)

## Architecture (2025-12-30 FINAL)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    koreanewskorea.com (통합 플랫폼)                         │
│                    폴더: koreanewskorea/                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   중앙뉴스 (National)                                                       │
│   ─────────────────                                                         │
│   /                    →  메인 (전국 정책, 정부 보도자료)                  │
│   /policy/             →  정책 브리핑, KTV                                 │
│   /tour/               →  전국 관광                                        │
│                                                                             │
│   지역뉴스 (Regional) - 9개 권역                                            │
│   ────────────────────                                                      │
│   /gwangju/            →  광주 지역뉴스                                    │
│   /mokpo/              →  목포/영암/무안/신안 지역뉴스                     │
│   /yeosu/              →  여수 지역뉴스                                    │
│   /suncheon/           →  순천 지역뉴스                                    │
│   /naju/               →  나주/화순 지역뉴스                               │
│   /gwangyang/          →  광양/곡성/구례 지역뉴스                          │
│   /damyang/            →  담양/함평/영광/장성 지역뉴스                     │
│   /goheung/            →  고흥/보성/장흥/강진 지역뉴스                     │
│   /haenam/             →  해남/완도/진도 지역뉴스                          │
│                                                                             │
│   IP Geolocation (Phase 2)                                                  │
│   ───────────────────────                                                   │
│   사용자 IP → MaxMind GeoLite2 → 지역 감지 → 자동 리다이렉트               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Work Progress Tracker

### Phase 1: Integration (90% Complete)

| # | Task | Status | Notes |
|:-:|------|:------:|-------|
| 1 | jeonnam/ → koreanewskorea/ 복사 | ✅ | Complete |
| 2 | koreanewshq/ policy, tour 병합 | ✅ | Complete |
| 3 | HQ 스타일 병합 (globals.css) | ✅ | Complete |
| 4 | package.json 업데이트 | ✅ | name: koreanewskorea |
| 5 | site-regions.ts 설정 | ✅ | 9 sites configured |
| 6 | 계획서/CLAUDE.md 업데이트 | ✅ | Complete |
| 7 | 빌드 테스트 | ⏳ | **NEXT** |
| 8 | 로컬 확인 | ⏳ | Pending |

### Phase 2: IP Geolocation (0% Complete)

| # | Task | Status | Notes |
|:-:|------|:------:|-------|
| 9 | MaxMind GeoLite2 설치 | ⏳ | Pending |
| 10 | IP 감지 미들웨어 | ⏳ | Pending |
| 11 | 지역 선택 팝업 | ⏳ | Pending |

### Phase 3: Deployment (0% Complete)

| # | Task | Status | Notes |
|:-:|------|:------:|-------|
| 12 | DNS 설정 | ⏳ | Pending |
| 13 | Vercel 배포 | ⏳ | Pending |
| 14 | 프로덕션 테스트 | ⏳ | Pending |

## Folder Status

| Folder | Status | Purpose |
|--------|:------:|---------|
| `koreanewskorea/` | 🔵 ACTIVE | 통합 플랫폼 (중앙+지역) |
| `jeonnam/` | ⚠️ DEPRECATED | koreanewskorea/로 통합됨 |
| `koreanewshq/` | ⚠️ DEPRECATED | koreanewskorea/로 통합됨 |
| `gwangju/` | ⚠️ DEPRECATED | 삭제 예정 |
| `gwangju/` | ⚠️ DEPRECATED | Will merge into jeonnam/, then delete |
| `src/` | 🛡️ PROTECTED | Production - DO NOT TOUCH |

## Quick Commands

```bash
# Regional site development (jeonnam/)
cd jeonnam && npm run dev    # Port 3002

# Change target region: Edit jeonnam/src/config/site-regions.ts
# Look for: export const CURRENT_SITE: SiteConfig = ALL_SITES['mokpo'];
# Change 'mokpo' to desired region key
```

---

# WORK NUMBER SYSTEM (P0 - MUST FOLLOW)

```
╔═════════════════════════════════════════════════════════════════════════════╗
║  작업 번호 시스템 - 주인님이 번호로 지시하면 즉시 해당 작업 영역 진행       ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  "1번작업" = Production (koreanewsone.com)                                  ║
║             위치: src/                                                      ║
║             포트: 3000                                                      ║
║             🛡️ P0 보호 대상 - 버그 수정/보안 패치만 허용                   ║
║                                                                             ║
║  "2번작업" = Development (통합 개발 영역)                                   ║
║             위치: jeonnam/, koreanewshq/                                    ║
║             포트: 3001 (HQ), 3002 (Regional)                                ║
║             ✅ jeonnam/ ↔ koreanewshq/ 상호 수정 가능                       ║
║             ❌ src/, scrapers/ 수정 절대 금지!                              ║
║             📊 Supabase 스크래핑 결과만 사용 (읽기 전용)                    ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

예시:
  주인님: "2번작업 진행해"  →  jeonnam/, koreanewshq/ 통합 개발 (스크래핑 결과 사용)
  주인님: "1번작업 버그 수정해"  →  src/ 폴더에서 Production 버그 수정 (승인 필요)
  주인님: "스크래퍼 수정해"  →  별도 지시로 scrapers/ 작업
```

---

# WORK ROUTING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER REQUEST                             →                WORK DOMAIN      │
├─────────────────────────────────────────────────────────────────────────────┤
│  "1번작업", "1번"                                          src/ (Production)│
│  "production", "koreanewsone.com"                         🛡️ P0 보호 대상  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  "2번작업", "2번", "개발"                                  통합 개발 영역   │
│  "지역 사이트", "권역", "HQ"                              jeonnam/         │
│  "mokpo", "yeosu" 등                                       koreanewshq/     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  "스크래퍼", "scraper" (별도 지시시만)                    scrapers/        │
│                                                            🟠 통합 관리     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# P0 RULES (Violation = REJECT)

| # | Rule | Violation |
|:-:|------|-----------|
| 1 | **src/ 수정 금지** (지역 작업시) | STOP + ROLLBACK |
| 2 | Call user "joo-in-nim" | Correction |
| 3 | No emojis in code | REJECT |
| 4 | No Korean in code/comments | REJECT |
| 5 | No `alert()`/`confirm()` | REJECT |
| 6 | Context7 for new libraries | REJECT |
| 7 | Error → Document in `info/errors/` | INCOMPLETE |
| 8 | Session → Log in `.claude/context/` | INVALID |
| 9 | **All logs → `logs/` folder** | REJECT |

```
Korean Rule:
  User-facing UI  →  Korean (저장, 취소, 실행)
  Code/Comments   →  English only

Log Rule:
  All log files   →  logs/ folder (project root)
  Log format      →  YYYY-MM-DD HH:MM:SS [ModuleName] Level: Message
  Required info   →  Date, Time, Module name (who is logging)
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
| 현황/진행상황/어디까지 | Status | Check DASHBOARD above |

---

# 9 REGIONAL SITES CONFIG

## Site-Regions Overview

| Site ID | Name | Primary Regions | Port |
|---------|------|-----------------|:----:|
| mokpo | 목포/영암/무안/신안 | 목포, 영암, 무안, 신안 | 3002 |
| yeosu | 여수 | 여수 | 3003 |
| suncheon | 순천 | 순천 | 3004 |
| naju | 나주/화순 | 나주, 화순 | 3005 |
| gwangyang | 광양/곡성/구례 | 광양, 곡성, 구례 | 3006 |
| damyang | 담양/함평/영광/장성 | 담양, 함평, 영광, 장성 | 3007 |
| goheung | 고흥/보성/장흥/강진 | 고흥, 보성, 장흥, 강진 | 3008 |
| haenam | 해남/완도/진도 | 해남, 완도, 진도 | 3009 |
| gwangju | 광주 | 광주 | 3010 |

## How to Switch Region

```typescript
// File: jeonnam/src/config/site-regions.ts

// Change this line to switch region:
export const CURRENT_SITE: SiteConfig = ALL_SITES['mokpo'];
//                                              ↑ Change to: yeosu, suncheon, etc.
```

---

# PROJECT INFO

## Main Site Features (koreanewsone.com)

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

## Target Regions (27 Total)

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
# Production (koreanewsone.com) - USE WITH CAUTION!
npm run dev              # Port 3000

# Regional Development (ACTIVE)
cd jeonnam && npm run dev # Port 3002

# Build & Deploy
npx tsc --noEmit         # Type check
git push                 # Auto deploy

# Verify
cat .vercel/project.json # Check linked project
```

---

# FUTURE PLANS (v2)

## Menu Type System (After Phase 1)

| Type | Regions | Menus |
|------|---------|-------|
| **A** | 광주, 전남 | 8개 (의회 포함) |
| **B** | 시 (5개) | 8개 |
| **C** | 군 (17개) | 7개 |

## IP Geolocation (Phase 3)

- MaxMind GeoLite2 integration
- Auto region detection
- User preference storage

## DB Schema Extension

- `regions` table
- `geo_lat`, `geo_lng` columns
- `region_type` field

---

# FAQ

| Question | Answer |
|----------|--------|
| src/ 수정해도 되나요? | **NO** - Production 보호 대상 |
| 지역 사이트 작업 어디서? | `jeonnam/` (Master Template) |
| gwangju/ 폴더는? | Deprecated, jeonnam/으로 통합 예정 |
| 새 라이브러리 쓸 때? | **Context7** 먼저 조회 |
| 에러 발생시? | `info/errors/_catalog.md` 검색 |
| 세션 완료시? | `.claude/context/session_log.md` 기록 |

---

# CHANGE LOG

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-30 | v7.2 | Work Number System added (1번~4번작업 shortcut) |
| 2025-12-29 | v7.1 | HQ Homepage ACTIVE (nationwide + policy + tour) |
| 2025-12-29 | v7.0 | P0 Protection rule, Regional integration to jeonnam/, Progress tracker |
| 2025-12-29 | v6.0 | Control Tower redesign |
| 2025-12-28 | v5.3 | Project reorganization |

---

*Korea NEWS Control Tower v7.2*
*P0: koreanewsone.com 보호 최우선*
*Active: jeonnam/ 권역별 통합 개발*

# Korea NEWS Regional Homepage System

> **Project:** koreanewskorea.com Regional Subdomains
> **Status:** Planning
> **Spec:** [plan/regional-homepage-spec.md](plan/regional-homepage-spec.md)

---

## CRITICAL: Separation Rule (P0)

```
THIS PROJECT IS COMPLETELY SEPARATE FROM THE EXISTING HOMEPAGE.

koreanews/
├── src/              # EXISTING - DO NOT TOUCH
├── koreanewskorea/   # NEW - THIS PROJECT (completely separate)
└── scrapers/         # SHARED - Both projects use same DB
```

**Rules:**
1. NEVER modify files in `src/` for this project
2. NEVER import from `src/` into this project
3. This folder can be extracted as separate repo later
4. Share ONLY database (Supabase) - no code sharing

---

## Folder Structure

```
koreanewskorea/
├── README.md               # This file
├── START_HERE.md           # Developer entry point
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript config
├── next.config.ts          # Next.js config
├── middleware.ts           # Subdomain routing (at root!)
│
├── plan/                   # Specifications
│   ├── regional-homepage-spec.md
│   ├── WORK_ORDER.md
│   ├── FIX_ORDER.md
│   └── regions/            # Region configs (24 files)
│       ├── README.md
│       └── *.md
│
├── common/                 # ALL shared code here
│   ├── README.md           # Colors, fonts, layouts
│   ├── components/         # UI components
│   ├── layouts/            # Tier layouts
│   ├── hooks/              # React hooks
│   ├── lib/                # Utilities
│   └── styles/             # CSS
│
└── app/                    # Next.js App Router
    ├── layout.tsx
    ├── page.tsx
    ├── news/[id]/page.tsx
    └── api/                # API routes
        ├── regions/route.ts
        └── region/[code]/...
```

**Key Design:**
- `common/` = ALL code lives here (DRY principle)
- `plan/regions/*.md` = Only special/unique configs per region
- Middleware detects subdomain -> loads region config -> renders

---

## Region Tiers (24 Total)

| Tier | Count | Regions | Layout |
|------|-------|---------|--------|
| **1** | 2 | gwangju, jeonnam | Full |
| **2** | 5 | mokpo, yeosu, suncheon, naju, gwangyang | Standard |
| **3** | 17 | damyang, gokseong, gurye, goheung, boseong, hwasun, jangheung, gangjin, haenam, yeongam, muan, hampyeong, yeonggwang, jangseong, wando, jindo, shinan | Compact |

---

## Quick Start

1. Read [plan/regional-homepage-spec.md](plan/regional-homepage-spec.md)
2. Read [common/README.md](common/README.md) for shared settings
3. Check [plan/regions/](plan/regions/) for region-specific configs

---

## Future: Extraction

When ready to deploy independently:
```bash
cp -r koreanewskorea/ ../koreanewskorea-standalone/
cd ../koreanewskorea-standalone
npm init -y && npm install next react react-dom
vercel link --project koreanewskorea
```

---

*Spec: [plan/regional-homepage-spec.md](plan/regional-homepage-spec.md)*

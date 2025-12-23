# Developer Work Order - Regional Homepage System

> **Version:** 1.0
> **Created:** 2025-12-23
> **Target:** Developers assigned to this project

---

## Project Summary

**Goal:** Build 24 regional homepages for koreanewskorea.com

**Strategy:** Build Gwangju (광주) first as template → Copy to other 23 regions

---

## Pre-Work Checklist

Before starting, read these documents:

- [ ] [koreanewskorea/README.md](../README.md) - Project overview & separation rule
- [ ] [regional-homepage-spec.md](regional-homepage-spec.md) - Full specification
- [ ] [common/README.md](../common/README.md) - Shared settings (colors, fonts)

---

## Phase 1: Gwangju Template (Priority)

### Task 1.1: Project Setup
```
Location: koreanewskorea/

1. Initialize Next.js project
   - npm init
   - npm install next react react-dom
   - npm install @supabase/supabase-js

2. Create folder structure:
   koreanewskorea/
   ├── app/                    # Next.js App Router
   │   ├── layout.tsx          # Root layout (imports from common/)
   │   ├── page.tsx            # Home page (dynamic by subdomain)
   │   ├── news/
   │   │   └── [id]/
   │   │       └── page.tsx    # Article detail
   │   └── api/                # API routes
   │       ├── regions/
   │       │   └── route.ts
   │       └── region/
   │           └── [code]/
   │               ├── route.ts
   │               ├── news/
   │               │   └── route.ts
   │               └── nearby/
   │                   └── route.ts
   │
   ├── middleware.ts           # Subdomain detection
   ├── package.json
   ├── tsconfig.json
   ├── next.config.ts
   └── tailwind.config.ts

   Note: Components/layouts are in common/ folder.
   Import like: import { Header } from '@/common/components/Header'
```

### Task 1.2: Middleware (Subdomain Routing)
```typescript
// koreanewskorea/middleware.ts

Purpose: Detect subdomain and set region context

Logic:
1. Extract subdomain from request host
2. Validate against allowed regions (24)
3. Set region cookie/header for page rendering
4. Invalid subdomain → redirect to gwangju.koreanewskorea.com
```

### Task 1.3: Region Config Loader
```typescript
// koreanewskorea/common/lib/regions.ts

Purpose: Load region-specific settings

Functions:
- getRegionConfig(code: string) → RegionConfig
- getNearbyRegions(code: string) → string[]
- getRegionTier(code: string) → 1 | 2 | 3
```

### Task 1.4: Shared Components
```
Location: koreanewskorea/common/components/

Build these components:
1. RegionalHeader.tsx   - Brand: "코리아뉴스 {지역명}"
2. RegionalHero.tsx     - Hero slider (Tier-based size)
3. NewsCard.tsx         - Article card
4. NewsList.tsx         - Article list
5. Sidebar.tsx          - Popular, Weather widgets
6. Footer.tsx           - Common footer
```

### Task 1.5: Layout Components
```
Location: koreanewskorea/common/layouts/

Build tier-based layouts:
1. FullLayout.tsx       - Tier 1 (Gwangju, Jeonnam)
2. StandardLayout.tsx   - Tier 2 (5 cities)
3. CompactLayout.tsx    - Tier 3 (17 counties)
```

### Task 1.6: Content Fetching
```typescript
// koreanewskorea/common/lib/content.ts

Purpose: Fetch articles with smart fill algorithm

Functions:
- getLocalNews(region, limit)      → 70% local
- getNearbyNews(region, limit)     → 20% nearby
- getNationalNews(limit)           → 10% national
- getSmartFilledNews(region)       → Combined with ratio
```

### Task 1.7: Gwangju Page
```
Location: koreanewskorea/app/page.tsx

Build the main page:
1. Detect region from middleware context
2. Load region config
3. Select layout based on tier
4. Fetch content with smart fill
5. Render with RegionalHeader
```

### Task 1.8: News Detail Page
```
Location: koreanewskorea/app/news/[id]/page.tsx

Build article detail:
1. Fetch article by ID
2. Show regional context (header)
3. Related articles from same region
```

---

## Phase 2: Vercel Configuration

### Task 2.1: Domain Setup
```
Vercel Dashboard → Domains

Add:
- *.koreanewskorea.com (wildcard)

Verify each subdomain works:
- gwangju.koreanewskorea.com
- jeonnam.koreanewskorea.com
- ... (24 total)
```

### Task 2.2: Environment Variables

Use the SAME values as existing koreanewsone.com project.
Both projects share the same Supabase database.

```
Required:
  NEXT_PUBLIC_SUPABASE_URL=<same as koreanewsone>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as koreanewsone>

Get values from:
  - Vercel Dashboard → koreanewsone → Settings → Environment Variables
  - Or from koreanews/.env.local file
```

---

## Phase 3: Other Regions (After Gwangju Complete)

Once Gwangju is working:

1. Test with Tier 2 city (e.g., mokpo)
2. Test with Tier 3 county (e.g., damyang)
3. Verify layout switching works per tier
4. Verify nearby content fill works

**No additional coding needed** - just config in `plan/regions/*.md`

---

## Testing Checklist

### Gwangju Template
- [ ] gwangju.koreanewskorea.com loads
- [ ] Header shows "코리아뉴스 광주"
- [ ] Hero slider displays local news
- [ ] Content ratio: 70% local / 20% nearby / 10% national
- [ ] News detail page works
- [ ] Mobile responsive

### Tier Switching
- [ ] Tier 1 shows Full layout
- [ ] Tier 2 shows Standard layout
- [ ] Tier 3 shows Compact layout

### Edge Cases
- [ ] Invalid subdomain redirects
- [ ] Empty local content → fills from nearby
- [ ] Region with no scraper → shows nearby only

---

## Reference: Region Configs

See `plan/regions/` for each region's special settings:
- Content sources (scraper paths)
- Nearby regions list
- Special features (if any)

---

## Questions?

Contact project owner or check:
- [regional-homepage-spec.md](regional-homepage-spec.md) for full details
- [common/README.md](../common/README.md) for design specs

---

*Start with Task 1.1 and proceed sequentially.*

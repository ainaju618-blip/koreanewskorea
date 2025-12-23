# Regional Homepage System Specification

> **Version:** 0.4 (Draft)
> **Created:** 2025-12-23
> **Status:** Planning Phase
> **Owner:** Korea NEWS Team
> **Location:** koreanewskorea/plan/

---

## CRITICAL: Separation Rule (P0)

```
THIS PROJECT IS COMPLETELY SEPARATE FROM THE EXISTING HOMEPAGE.

koreanews/
├── src/              # EXISTING HOMEPAGE - DO NOT TOUCH
│   └── (existing code for koreanewsone.com)
│
├── koreanewskorea/   # THIS PROJECT - COMPLETELY SEPARATE
│   ├── plan/         # Specifications (this folder)
│   ├── common/       # Shared components
│   └── app/          # Next.js App Router
│
└── scrapers/         # Shared (both projects use same data)
```

**Absolute Rules:**
1. NEVER modify files in `src/` for this project
2. NEVER import code from `src/` into this project
3. This folder can be extracted as separate repo later
4. Share ONLY database (Supabase) - no code sharing
5. Reference existing homepage for ideas, but DO NOT copy code

---

## Official Information (P0 - MUST KNOW)

| Item | Value |
|------|-------|
| **Registered Name** | 코리아NEWS (Gwangju City Hall registered) |
| **Domain 1 (Primary)** | koreanewskorea.com |
| **Domain 2** | koreanewsone.com (existing homepage - separate) |

---

## Document Purpose

This specification defines the regional homepage system for Korea NEWS.
Other developers should read this document before working on this feature.

**How to use this document:**
1. Read the entire spec before starting work
2. Check the checklist for current progress
3. Update checklist as you complete items
4. Increment version when making significant changes

---

## 1. Project Overview

### 1.1 Vision
Create independent-looking regional homepages under a unified platform.
Each region gets its own "newspaper" experience while sharing backend infrastructure.

### 1.2 Brand Naming
```
Format: 코리아뉴스 + [지역명]

Examples:
  - 코리아뉴스 광주 (Korea NEWS Gwangju)
  - 코리아뉴스 담양 (Korea NEWS Damyang)
  - 코리아뉴스 여수 (Korea NEWS Yeosu)
```

### 1.3 Architecture Principle
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Independent UI)            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ 광주    │  │ 담양    │  │ 여수    │  │ ...x24  │    │
│  │ Homepage│  │ Homepage│  │ Homepage│  │         │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (Shared)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Single CMS / Single Database / Single API      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.4 Folder Structure
```
koreanewskorea/
├── README.md
├── START_HERE.md          # Developer entry point
│
├── plan/
│   ├── regional-homepage-spec.md
│   ├── WORK_ORDER.md
│   ├── FIX_ORDER.md
│   └── regions/           # Config files only (not code)
│       ├── README.md
│       └── [region].md    # 24 files
│
├── common/                # ALL code here
│   ├── components/
│   ├── layouts/
│   ├── hooks/
│   ├── lib/
│   └── styles/
│
├── middleware.ts          # Subdomain detection (MUST be at project root)
└── app/                   # Next.js App Router
    ├── layout.tsx
    ├── page.tsx
    └── news/[id]/page.tsx
```

**Note:** NO individual region folders. All code in `common/`, configs in `plan/regions/*.md`.

---

## 2. Content Strategy

### 2.1 Content Distribution Ratio
```
┌────────────────────────────────────────┐
│  Local News (해당 지역)      70%       │
│  Nearby News (인접 지역)     20%       │
│  National News (전국/광역)   10%       │
└────────────────────────────────────────┘
```

### 2.2 Region Tier System (24 Subdomains)

Content volume varies significantly by region. Adaptive approach needed.

| Tier | Regions | Daily Articles | Layout Type |
|------|---------|----------------|-------------|
| **Tier 1** | 광주 (+ 광주교육청), 전남 (+ 전남교육청) | 15-25 | Full Layout |
| **Tier 2** | 목포, 여수, 순천, 나주, 광양 | 5-15 | Standard Layout |
| **Tier 3** | 17 Counties | 1-5 | Compact Layout |

**Total: 24 Subdomains** (Education offices included in metro/province)

### 2.3 Complete Subdomain List

```
Tier 1 (2):
  gwangju.koreanewskorea.com   - 광주광역시 + 광주교육청
  jeonnam.koreanewskorea.com   - 전라남도 + 전남교육청

Tier 2 (5):
  mokpo.koreanewskorea.com     - 목포시
  yeosu.koreanewskorea.com     - 여수시
  suncheon.koreanewskorea.com  - 순천시
  naju.koreanewskorea.com      - 나주시
  gwangyang.koreanewskorea.com - 광양시

Tier 3 (17):
  damyang.koreanewskorea.com   - 담양군
  gokseong.koreanewskorea.com  - 곡성군
  gurye.koreanewskorea.com     - 구례군
  goheung.koreanewskorea.com   - 고흥군
  boseong.koreanewskorea.com   - 보성군
  hwasun.koreanewskorea.com    - 화순군
  jangheung.koreanewskorea.com - 장흥군
  gangjin.koreanewskorea.com   - 강진군
  haenam.koreanewskorea.com    - 해남군
  yeongam.koreanewskorea.com   - 영암군
  muan.koreanewskorea.com      - 무안군
  hampyeong.koreanewskorea.com - 함평군
  yeonggwang.koreanewskorea.com - 영광군
  jangseong.koreanewskorea.com - 장성군
  wando.koreanewskorea.com     - 완도군
  jindo.koreanewskorea.com     - 진도군
  shinan.koreanewskorea.com    - 신안군
```

### 2.4 Smart Content Filling Algorithm
```
When local content < minimum threshold:
  1. First: Fill from nearby regions (same tier or higher)
  2. Then: Fill from province-level news (전남/광주)
  3. Finally: Fill from national news

Priority Order for Nearby:
  - Geographic proximity (adjacent regions first)
  - Same administrative type (city-city, county-county)
  - Content freshness (newer articles preferred)
```

---

## 3. Technical Decisions (CONFIRMED)

### 3.1 URL Structure
**DECIDED: Subdomain approach**

```
Format: [region].koreanewskorea.com

Examples:
  - gwangju.koreanewskorea.com
  - damyang.koreanewskorea.com
  - mokpo.koreanewskorea.com
  - yeosu.koreanewskorea.com

Main site: koreanewskorea.com (redirects to gwangju or shows aggregated)
```

**Why subdomain:**
- True independent newspaper feel per region
- Clear brand identity: "코리아NEWS 광주"
- Easy to market individual regions
- No route conflicts with existing paths

### 3.2 Routing Strategy (Subdomain)
```
Vercel Configuration:
  - Wildcard domain: *.koreanewskorea.com
  - Middleware detects subdomain
  - Routes to appropriate regional content

koreanewskorea/
  app/
    page.tsx            # Dynamic based on subdomain
    layout.tsx          # Regional layout with brand
    news/
      [id]/page.tsx     # News detail (regional context)

Middleware logic:
  1. Extract subdomain from host header
  2. Validate against region_config table
  3. Set region context for page rendering
  4. Invalid subdomain -> redirect to main
```

### 3.3 Shared Components vs Regional Components
```
SHARED (in koreanewskorea/common/):
  - Header/GNB structure
  - Footer
  - NewsCard component
  - Sidebar widgets
  - API calls

REGIONAL (configured per region):
  - Logo/Brand name
  - Color accent (optional)
  - Content sources (region filter)
  - Nearby regions list
  - Local ads/banners
```

---

## 4. Layout Specification

### 4.1 Full Layout (Tier 1: 광주, 전남)
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: 코리아뉴스 광주                                │
├─────────────────────────────────────────────────────────┤
│  HERO SLIDER (6 articles)                    │ AD      │
│  - Latest local news with images             │ BANNER  │
├──────────────────────────────────────────────┴─────────┤
│  ZONE 1: 광주 주요뉴스 (Local 70%)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Article │ │ Article │ │ Article │ │ Article │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────┤
│  ZONE 2: 전남 소식 (Nearby 20%)         │ SIDEBAR     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │ - Popular   │
│  │ Nearby  │ │ Nearby  │ │ Nearby  │   │ - Weather   │
│  └─────────┘ └─────────┘ └─────────┘   │ - Events    │
├─────────────────────────────────────────┴──────────────┤
│  ZONE 3: 전국 뉴스 (National 10%)                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Compact list: 5 national headlines                │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Standard Layout (Tier 2: 5 Cities)
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: 코리아뉴스 목포                                │
├─────────────────────────────────────────────────────────┤
│  HERO (3 articles)                           │ AD      │
├──────────────────────────────────────────────┴─────────┤
│  ZONE 1: 목포 소식 (Local - reduced grid)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ Article │ │ Article │ │ Article │   + Sidebar      │
│  └─────────┘ └─────────┘ └─────────┘                   │
├─────────────────────────────────────────────────────────┤
│  ZONE 2: 전남 & 광주 소식 (Combined nearby + national) │
│  - Mixed content from nearby regions                   │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Compact Layout (Tier 3: 17 Counties)
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: 코리아뉴스 담양                                │
├─────────────────────────────────────────────────────────┤
│  FEATURED (1 main article)                   │ AD      │
├──────────────────────────────────────────────┴─────────┤
│  담양 소식 (All local articles - list format)          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - Article title 1                      12-23 10:30│ │
│  │ - Article title 2                      12-23 09:15│ │
│  │ - Article title 3                      12-22 16:45│ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  전남 소식 (Nearby - fills the page)                   │
│  Grid of nearby region articles                        │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Development Phases

### Phase 1: Master Template (코리아뉴스 광주)
Build one perfect regional homepage for Gwangju.

**Deliverables:**
- [ ] Regional layout component system
- [ ] Dynamic content fetching by region
- [ ] Adaptive layout logic (content volume detection)
- [ ] Regional header with brand name
- [ ] Smart content filling algorithm
- [ ] Admin settings for region configuration

### Phase 2: Tier 2 Rollout (5 Cities)
Apply to Mokpo, Yeosu, Suncheon, Naju, Gwangyang.

**Deliverables:**
- [ ] Standard layout variant
- [ ] Nearby region mapping configuration
- [ ] Per-region color/theme options (optional)
- [ ] Testing across all 5 cities

### Phase 3: Tier 3 Rollout (17 Counties)
Apply to all remaining counties.

**Deliverables:**
- [ ] Compact layout variant
- [ ] Bulk region setup
- [ ] Performance optimization for 24 regions

---

## 6. Database Requirements

### 6.1 New Tables/Columns Needed

```sql
-- Region configuration table
CREATE TABLE region_config (
  region_code VARCHAR(20) PRIMARY KEY,
  region_name_ko VARCHAR(50) NOT NULL,
  region_name_en VARCHAR(50) NOT NULL,
  tier INTEGER DEFAULT 3,
  nearby_regions JSONB,  -- ["mokpo", "muan", "shinan"]
  theme_color VARCHAR(7),  -- "#A6121D"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Existing Tables to Modify

> [!WARNING]
> **Shared Database Impact**
>
> These changes affect the EXISTING `posts` table used by koreanewsone.com.
> Both projects share the same Supabase database.
>
> **Before applying:**
> 1. Backup the posts table
> 2. Test in development environment first
> 3. Apply during low-traffic hours
> 4. Verify koreanewsone.com still works after change
>
> **Impact Assessment:**
> - Adding INDEX: Safe, improves query performance
> - Adding COLUMN: Safe, nullable with default value

```sql
-- posts table: ensure region field is indexed
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);

-- Add region priority for sorting
ALTER TABLE posts ADD COLUMN IF NOT EXISTS region_priority INTEGER DEFAULT 0;
```

---

## 7. API Requirements

### 7.1 New Endpoints Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/region/[code]` | GET | Get region config |
| `/api/region/[code]/news` | GET | Get news for region (with smart fill) |
| `/api/region/[code]/nearby` | GET | Get nearby region news |
| `/api/regions` | GET | List all regions |

### 7.2 Query Parameters
```
/api/region/gwangju/news?
  limit=20
  &include_nearby=true
  &nearby_ratio=0.2
  &national_ratio=0.1
```

---

## 8. Checklist (Progress Tracking)

### Planning Phase
- [x] Define brand naming convention
- [x] Define content distribution ratio (70/20/10)
- [x] Define tier system
- [x] Define adaptive layout strategy
- [x] URL structure decision (subdomain)
- [x] Separation from existing homepage (P0 rule)
- [x] Folder structure design
- [ ] Define header/GNB design per region
- [ ] Define mobile layout strategy
- [ ] Create wireframes for each layout type
- [ ] Review and approve specification

### Folder Structure (DONE)
- [x] Create koreanewskorea/ root folder
- [x] Create koreanewskorea/README.md
- [x] Create koreanewskorea/common/README.md
- [x] Create koreanewskorea/plan/ folder
- [x] Create koreanewskorea/plan/regions/ folder
- [x] Create 24 region config files (plan/regions/*.md)
- [x] Create START_HERE.md
- [x] Create WORK_ORDER.md

### Development Phase 1 (Master Template)
- [ ] Create region routing structure
- [ ] Build RegionalLayout component
- [ ] Build RegionalHeader component
- [ ] Build RegionalHero component
- [ ] Implement content fetching with region filter
- [ ] Implement smart content filling
- [ ] Implement adaptive layout switching
- [ ] Create region_config table
- [ ] Build admin page for region settings
- [ ] Test with Gwangju data
- [ ] Performance optimization

### Development Phase 2 (Tier 2)
- [ ] Configure 5 city regions
- [ ] Test standard layout variant
- [ ] Verify nearby region logic
- [ ] QA across all Tier 2 regions

### Development Phase 3 (Tier 3)
- [ ] Bulk configure 17 counties
- [ ] Test compact layout variant
- [ ] Full system QA
- [ ] Performance testing with all 24 regions

---

## 9. Design Decisions (CONFIRMED)

### 9.1 Color Theme
**DECIDED: Universal, non-offensive color**

```
Primary:   #1E3A5F (Deep Navy Blue)
           - Trustworthy, professional, news-appropriate
           - Works for all 24 regions without bias
           - Not associated with any political party

Secondary: #F5F5F5 (Light Gray background)
Accent:    #2563EB (Blue for links/actions)
Text:      #1F2937 (Dark gray, not pure black)
```

**Why this palette:**
- Navy blue = universally trusted for news/media
- No regional color conflicts (avoids red/blue political associations)
- High readability, accessibility compliant
- Professional without being cold

### 9.2 Mobile Layout
**DECIDED: Responsive with simplified structure**

```
Desktop (1280px+):  Full tier-based layout
Tablet (768-1279):  2-column simplified
Mobile (< 768px):   Single column, stacked sections

Mobile simplifications:
- Hero: 1 article (not slider)
- Local news: List format (not grid)
- Sidebar: Collapsed to bottom
- Ads: Reduced frequency
```

**Why responsive (not separate mobile site):**
- Single codebase = easier maintenance
- No duplicate content issues
- Google Mobile-First indexing compatible
- Same URLs across all devices

### 9.3 SEO Strategy
**DECIDED: Unified with subdomain structure**

```
Sitemap strategy:
  - Main sitemap: koreanewskorea.com/sitemap.xml
  - Lists ALL subdomains and their pages
  - Each subdomain also has own sitemap

Google Search Console:
  - Register main domain as property
  - Add each subdomain as separate property
  - Use Domain property for unified view

Canonical URLs:
  - Each article has single canonical (original region)
  - Cross-region links use rel="alternate"
```

**Why unified approach:**
- Domain authority consolidated
- No duplicate content penalties
- Easier to manage 24 regions
- Single analytics view possible

### 9.4 Analytics
**DECIDED: Unified tracking with regional segments**

```
Google Analytics 4:
  - Single GA4 property for all subdomains
  - Cross-domain tracking enabled
  - Custom dimensions: region_code, region_tier

Segments:
  - By region (24 segments)
  - By tier (3 segments)
  - By content type (local/nearby/national)

Reports:
  - Unified dashboard (total traffic)
  - Regional comparison reports
  - Content performance by region
```

**Why unified (not separate per region):**
- Easy comparison across regions
- Single dashboard for management
- No data silos
- Cost-effective (one property)

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.4 | 2025-12-23 | Claude | Added separation rule (P0), moved to koreanewskorea/plan/, updated folder structure |
| 0.3 | 2025-12-23 | Claude | Confirmed all design decisions (URL, color, mobile, SEO, analytics) |
| 0.2 | 2025-12-23 | Claude | Added official registration info (domains, registered name) |
| 0.1 | 2025-12-23 | Claude | Initial draft from planning discussion |

---

*This document is the source of truth for the Regional Homepage feature.*
*All developers must read this before contributing to this feature.*

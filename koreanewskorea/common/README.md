# Common Configuration (All Regions)

> **Purpose:** Shared settings applied to ALL 24 regional subdomains
> **Usage:** Read this before any regional work

---

## Brand Identity

| Item | Value |
|------|-------|
| **Official Name** | 코리아NEWS |
| **Brand Format** | 코리아뉴스 + 지역명 |
| **Registered At** | Gwangju City Hall |
| **Primary Domain** | koreanewskorea.com |

---

## Color Theme (All Regions)

```css
/* Primary Colors */
--color-primary: #1E3A5F;        /* Deep Navy Blue */
--color-primary-hover: #2A4A73;
--color-primary-dark: #152B47;

/* Background */
--color-bg: #FFFFFF;
--color-bg-secondary: #F5F5F5;
--color-border: #E5E7EB;

/* Text */
--color-text: #1F2937;
--color-text-secondary: #6B7280;
--color-text-muted: #9CA3AF;

/* Accent */
--color-accent: #2563EB;
--color-accent-hover: #1D4ED8;

/* Status */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
```

---

## Typography

```css
/* Font Stack */
--font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
--font-serif: 'Noto Serif KR', Georgia, serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

---

## Layout Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 768px | Single column |
| Tablet | 768-1023px | 2 columns |
| Desktop | 1024-1279px | Full layout |
| Wide | 1280px+ | Max container |

---

## Content Distribution

| Type | Ratio | Description |
|------|-------|-------------|
| Local | 70% | This region's content |
| Nearby | 20% | Adjacent regions |
| National | 10% | Province-level news (Gwangju Metro + Jeonnam Province) |

> **Note:** "National" in this context means province-level (광역) news, not nationwide. Gwangju and Jeonnam are the top-tier regional sources.

---

## Shared Components (To Build)

```
common/
├── components/
│   ├── Header.tsx          # Regional header with brand
│   ├── Footer.tsx          # Common footer
│   ├── NewsCard.tsx        # Article card component
│   ├── NewsList.tsx        # Article list component
│   ├── Sidebar.tsx         # Sidebar with widgets
│   ├── AdBanner.tsx        # Advertisement slots
│   └── RegionBadge.tsx     # Region tier badge
│
├── layouts/
│   ├── FullLayout.tsx      # Tier 1 layout
│   ├── StandardLayout.tsx  # Tier 2 layout
│   └── CompactLayout.tsx   # Tier 3 layout
│
├── hooks/
│   ├── useRegion.ts        # Region context hook
│   └── useNearbyContent.ts # Nearby content fetcher
│
├── lib/
│   ├── supabase.ts         # Database client
│   └── regions.ts          # Region utilities
│
└── styles/
    └── globals.css         # Shared styles
```

---

## API Endpoints (Shared)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/regions` | GET | Get all region list |
| `/api/region/[code]` | GET | Get region config |
| `/api/region/[code]/news` | GET | Get news for region (with smart fill) |
| `/api/region/[code]/nearby` | GET | Get nearby region news |

---

## SEO Template

```html
<title>{Region Korean} | 코리아NEWS</title>
<meta name="description" content="{Region} 지역 뉴스" />
<meta property="og:title" content="코리아뉴스 {Region}" />
<link rel="canonical" href="https://{region}.koreanewskorea.com" />
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

---

*Parent: [koreanewskorea/README.md](../README.md)*

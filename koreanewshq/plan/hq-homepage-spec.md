# HQ Homepage Specification (본사 홈페이지)

> **Version:** 0.1
> **Created:** 2025-12-25
> **Status:** Active Development
> **Domain:** koreanewskorea.com

---

## 1. Project Identity

```
Project Name: Korea NEWS HQ (본사 홈페이지)
Purpose: Central hub for Korea NEWS brand
Target: B2G clients, advertisers, partners, general public
Differentiator: Curated news, brand presence, business portal
```

---

## 2. Infrastructure (SEPARATE from existing)

| Component | Value | Notes |
|-----------|-------|-------|
| **Folder** | `koreanewshq/` | Isolated from src/ and koreanewskorea/ |
| **Domain** | `koreanewskorea.com` | Primary brand domain |
| **Vercel** | NEW account | TBD - user will provide |
| **Supabase** | NEW account | TBD - user will provide |
| **Framework** | Next.js 15 (App Router) | Latest stable |

### Why Separate Infrastructure?

1. **Independence**: HQ operates as standalone entity
2. **Fault Isolation**: HQ outage doesn't affect regional sites
3. **Cost Tracking**: Clear billing separation
4. **Scale**: HQ traffic patterns differ from regional sites

---

## 3. Feature Priority (Recommended)

### Phase 1: Foundation (Week 1-2)

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| **P0** | Project Setup | Next.js, Tailwind, folder structure | Low |
| **P0** | Supabase Connection | New DB, env vars, client setup | Low |
| **P0** | Domain Setup | Vercel + koreanewskorea.com | Low |
| **P1** | Basic Layout | Header, Footer, Navigation | Medium |
| **P1** | Home Page | Hero, featured news, sections | Medium |

### Phase 2: Core Features (Week 3-4)

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| **P1** | News Gateway | All-region news aggregation | Medium |
| **P1** | Region Selector | 24 regions quick access | Low |
| **P1** | Category Pages | Politics, Economy, Society, Culture | Medium |
| **P2** | Search | Full-text search across all news | Medium |
| **P2** | About/Contact | Company info, contact form | Low |

### Phase 3: Business Features (Week 5-6)

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| **P2** | Ad Zones | Premium ad placements | Medium |
| **P2** | Partner Portal | B2G/B2B information page | Low |
| **P3** | Newsletter | Email subscription | Medium |
| **P3** | Press Kit | Media resources, brand assets | Low |

### Phase 4: Advanced (Week 7+)

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| **P3** | Analytics Dashboard | Traffic, engagement metrics | High |
| **P3** | Live News Ticker | Real-time news updates | Medium |
| **P3** | Mobile App Promo | App store links, QR codes | Low |

---

## 4. Page Structure

```
koreanewskorea.com/
├── /                     # Home (curated news, hero, sections)
├── /news/                # All news listing
├── /news/[id]            # News detail
├── /category/[slug]      # Category pages
├── /region/[code]        # Region gateway (links to subdomains)
├── /about                # About Korea NEWS
├── /contact              # Contact form
├── /advertise            # Advertising info (B2B)
├── /partner              # Partnership info (B2G)
└── /press                # Press kit, brand assets
```

---

## 5. Design Direction

### Brand Identity

```
Primary Color: #1E40AF (Royal Blue) - Trust, Authority
Secondary: #DC2626 (News Red) - Urgency, Breaking
Background: #FFFFFF / #F8FAFC
Text: #1E293B
```

### Design Principles

1. **Clean & Professional**: News portal, not flashy
2. **Information Dense**: Maximize content per viewport
3. **Fast Loading**: Performance first
4. **SEO Optimized**: Meta, structured data, sitemap
5. **Responsive**: Desktop-first, mobile-friendly

---

## 6. Differences from Regional Sites

| Aspect | HQ Homepage | Regional Sites |
|--------|-------------|----------------|
| **Content** | All regions, curated | Single region only |
| **Target** | B2G, advertisers, general | Local residents |
| **Ads** | Premium placements | Local business ads |
| **Design** | Brand-focused | Utility-focused |
| **Updates** | Editor-curated | Auto-generated |

---

## 7. Data Strategy

### Option A: Read from existing Supabase (koreanewsone)

```
Pros: Same data, no sync needed
Cons: Dependency on old infra, shared load
```

### Option B: Separate Supabase with sync

```
Pros: True independence, can customize schema
Cons: Need sync mechanism, possible data lag
```

**Recommendation:** Start with Option A (read-only), migrate to Option B later.

---

## 8. Development Checklist

### Setup Phase

- [ ] Create koreanewshq/ folder structure
- [ ] Initialize Next.js 15 project
- [ ] Configure Tailwind CSS
- [ ] Setup Supabase client (TBD which DB)
- [ ] Configure Vercel deployment
- [ ] Connect domain koreanewskorea.com

### Phase 1 Checklist

- [ ] Layout components (Header, Footer, Nav)
- [ ] Home page implementation
- [ ] Basic routing setup
- [ ] Responsive design
- [ ] SEO meta tags

### Phase 2 Checklist

- [ ] News listing page
- [ ] News detail page
- [ ] Category pages
- [ ] Region selector
- [ ] Search functionality

---

## 9. Questions to Resolve

1. **Supabase**: New project or read from existing?
2. **Vercel**: Account details needed
3. **GitHub**: Same repo (monorepo) or new repo?
4. **Content**: Auto-fetch or editor-curated?
5. **Design**: Use existing design system or new?

---

## 10. Next Steps

1. User provides new Vercel/Supabase account info
2. Update CLAUDE.md with actual values
3. Create project structure
4. Implement Phase 1 features
5. Deploy and connect domain

---

*Document Version: 0.1*
*Created: 2025-12-25*

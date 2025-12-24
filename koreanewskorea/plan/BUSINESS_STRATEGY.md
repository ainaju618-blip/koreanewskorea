# Korea NEWS Business Strategy

> **Version:** 1.0
> **Created:** 2025-12-25
> **Purpose:** Help developers understand WHY we build what we build

---

## READ THIS FIRST

**You are building more than just a website.**

This project is the **revenue engine** of Korea NEWS media group.
Understanding the business context will help you make better technical decisions.

---

## 1. Two-Track Structure (Why We Have Two Sites)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADQUARTERS (koreanewsone.com)                            │
│  ─────────────────────────────────────────────────────────  │
│  Role: Brand Authority & Trust Building                     │
│  Content: National news, central government, policy         │
│  Revenue: Indirect (brand value)                            │
│  Think of it as: The "face" of the company                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Brand Authority flows down
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  REGIONAL BRANCHES (*.koreanewskorea.com) ← YOU ARE HERE    │
│  ─────────────────────────────────────────────────────────  │
│  Role: Revenue Generation Engine                            │
│  Content: 22 city/county local news, regional events        │
│  Revenue: Direct (ads, B2G contracts, partnerships)         │
│  Think of it as: The "money-making arm" of the company      │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:** The regional sites inherit brand trust from HQ, but generate actual revenue through local engagement.

---

## 2. Why Subdomains? (Technical Decision Context)

```
Domain Strategy: [region].koreanewskorea.com

Examples:
  - gwangju.koreanewskorea.com  (Gwangju Metropolitan)
  - mokpo.koreanewskorea.com    (Mokpo City)
  - damyang.koreanewskorea.com  (Damyang County)
```

### SEO Benefits

| Benefit | Explanation |
|---------|-------------|
| **Domain Authority Sharing** | Regional sites inherit main domain's SEO score |
| **Local Keyword Targeting** | Each subdomain can rank for local searches ("광주 뉴스", "담양 소식") |
| **AI Search Optimization** | Google, Naver, Perplexity prioritize structured regional content |

### Why NOT Separate Domains?

- Separate domains (gwangjunews.com, mokponews.com) would start from zero authority
- Subdomains share the parent domain's trust score
- Single infrastructure, multiple brand presences

---

## 3. Revenue Model (Why Local News Matters)

The business model is **branch-centric revenue generation**:

```
┌─────────────────────────────────────────────────────────────┐
│  Revenue Stream 1: B2G (Business to Government)             │
│  ─────────────────────────────────────────────────────────  │
│  - 22 city/county administrative announcements              │
│  - Education office press releases                          │
│  - Government advertising contracts                         │
│  Target: 70% of total revenue                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Revenue Stream 2: Local Commerce                           │
│  ─────────────────────────────────────────────────────────  │
│  - Regional specialty products promotion                    │
│  - Local business native advertising                        │
│  - Event/festival coverage partnerships                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Revenue Stream 3: Data & AI (Future)                       │
│  ─────────────────────────────────────────────────────────  │
│  - Curated regional data as API                             │
│  - Local LLM training data supply                           │
│  - Analytics for regional businesses                        │
└─────────────────────────────────────────────────────────────┘
```

**Developer Implication:** Every feature you build should consider: "Does this help attract local readers or local advertisers?"

---

## 4. The 24 Regions (Content Strategy)

### Tier System Rationale

| Tier | Regions | Daily Articles | Why Different Layout? |
|------|---------|----------------|----------------------|
| **1** | Gwangju, Jeonnam | 15-25 | Content-rich, can fill full layout |
| **2** | 5 Cities | 5-15 | Moderate content, need some filler |
| **3** | 17 Counties | 1-5 | Limited content, heavy smart-fill needed |

### Smart Fill Algorithm (Business Logic)

When a region has insufficient local news:
1. Fill with **nearby regions** first (maintains local relevance)
2. Then fill with **province-level** news (still relevant)
3. Finally fill with **national** news (last resort)

**Why?** Local readers want local news. Empty pages = lost readers = lost revenue.

---

## 5. Roadmap (Where We Are)

```
Phase 1: Foundation (Current)
├── [x] 27 scrapers operational
├── [x] AI quality grading (Grade A/B)
├── [x] Basic regional homepage (gwangju)
└── [ ] Full 24-region rollout

Phase 2: Optimization (Q2 2025)
├── [ ] Google News registration
├── [ ] Naver News registration
├── [ ] Grade A rate > 70%
└── [ ] Local SEO dominance

Phase 3: Monetization (Q3-Q4 2025)
├── [ ] B2G contracts with municipalities
├── [ ] Local business advertising packages
├── [ ] AdSense approval
└── [ ] Monthly revenue 650,000+ KRW
```

---

## 6. KPIs (What Success Looks Like)

| Metric | Current | Target (Q4 2025) |
|--------|---------|------------------|
| Daily Articles | ~100 | 200+ |
| AI Grade A Rate | ~40% | 70%+ |
| Monthly Visitors | TBD | 50,000+ |
| Local News Market Share | TBD | 70%+ |
| Monthly Revenue | 0 | 650,000+ KRW |

---

## 7. For Developers: Decision Framework

When making technical decisions, ask yourself:

```
1. Does this improve LOCAL user experience?
   → Local readers are our primary audience

2. Does this help with LOCAL SEO?
   → Search visibility = traffic = revenue

3. Does this scale to 24 regions?
   → One codebase, 24 brand experiences

4. Does this reduce operational cost?
   → Automation > Manual work

5. Does this prepare for monetization?
   → Features should support future ad/partnership integration
```

---

## 8. Quick Reference

| Question | Answer |
|----------|--------|
| Why subdomains? | SEO authority sharing + local targeting |
| Why 24 separate pages? | Each region = independent brand = targeted ads |
| Why smart-fill algorithm? | Prevent empty pages in low-content regions |
| Why tier system? | Different content volumes need different layouts |
| What's the end goal? | Dominate Jeonnam/Gwangju local news market |

---

## Related Documents

- [Regional Homepage Spec](./regional-homepage-spec.md) - Technical specification
- [Main Plan](../plan/mainplan.md) - Master strategy document
- [CLAUDE.md](../../CLAUDE.md) - AI agent instructions

---

*This document helps developers understand the business context.*
*Technical decisions should align with business goals.*
*When in doubt, ask: "Does this help us dominate local news?"*

# Korea NEWS Execution Plan

> **Version:** 1.0
> **Created:** 2025-12-23
> **Parent:** mainplan.md

---

## Immediate Actions (This Week)

### 1. Scraper Health Check
Status: **COMPLETED**

| Region | Status | Issue |
|--------|--------|-------|
| Gwangju City | OK | - |
| Jeonnam Province | OK | - |
| Mokpo | OK | - |
| Yeosu | ATTENTION | playwright-stealth v2.0.0 |
| Suncheon | OK | - |
| Naju | OK | - |
| Gwangyang | OK | - |
| Damyang | OK | - |
| Gokseong | OK | - |
| Gurye | OK | - |
| Goheung | OK | - |
| Boseong | OK | - |
| Hwasun | OK | - |
| Jangheung | OK | - |
| Gangjin | ATTENTION | playwright-stealth v2.0.0 |
| Haenam | OK | - |
| Yeongam | OK | - |
| Muan | OK | - |
| Hampyeong | OK | - |
| Yeonggwang | OK | - |
| Jangseong | OK | - |
| Wando | OK | - |
| Jindo | OK | - |
| Sinan | OK | - |
| Gwangju Edu | OK | - |
| Jeonnam Edu | OK | - |

**Action Items:**
- [x] Check all 27 scraper files exist
- [ ] Fix yeosu scraper stealth compatibility
- [ ] Fix gangjin scraper stealth compatibility

### 2. AI Quality Dashboard
Status: **COMPLETED**

- Location: `/admin/ai-quality`
- Features:
  - Grade distribution (A/B/C/D percentages)
  - Trend analysis (daily/weekly/monthly)
  - Article list with search/filter
  - Pagination (25 items/page)

### 3. SEO Sitemap
Status: **COMPLETED**

- Enhanced sitemap.ts with all 27 regions
- Priority hierarchy implemented
- Dynamic content inclusion

---

## Weekly Execution Schedule

### Week 1 (Dec 23-29)
- [x] Complete scraper health audit
- [x] Deploy AI quality dashboard
- [x] Update sitemap for SEO
- [ ] Fix yeosu/gangjin stealth issues
- [ ] Verify all scrapers running in GitHub Actions

### Week 2 (Dec 30 - Jan 5)
- [ ] Monitor Grade A rate trend
- [ ] Optimize low-performing scrapers
- [ ] Set up automated health alerts
- [ ] Document scraper algorithms

### Week 3 (Jan 6-12)
- [ ] Prepare Google News application
- [ ] Create press kit for B2B outreach
- [ ] Audit content for quality issues

### Week 4 (Jan 13-19)
- [ ] Submit to Google News
- [ ] Submit to Naver News
- [ ] Begin B2B outreach to municipalities

---

## Multi-Key API Rotation

Status: **IMPLEMENTED**

### Key Configuration
| Label | Purpose | Daily Limit |
|-------|---------|-------------|
| main | Primary processing | 1,500 |
| multi618 | Secondary | 1,500 |
| naju | Tertiary | 1,500 |
| oksun | Quaternary | 1,500 |

**Total Capacity:** ~6,000 requests/day = ~3,000-6,000 articles/day

### Rotation Logic
- Round-robin selection across enabled keys
- Daily reset at midnight
- Automatic fallback on key failure

---

## B2B Target List

### Priority 1: Metropolitan/Province
- Gwangju Metropolitan City
- Jeonnam Province

### Priority 2: Major Cities
- Mokpo City
- Yeosu City
- Suncheon City
- Naju City
- Gwangyang City

### Priority 3: Counties (High Activity)
- Haenam County
- Wando County
- Boseong County
- Hwasun County

### Approach Strategy
1. Gather contact info for PR departments
2. Prepare portfolio showing coverage stats
3. Offer premium placement for annual contracts
4. Target: 10 contracts at 50,000 KRW/month = 500,000 KRW

---

## Technical Debt Backlog

| Item | Priority | Effort |
|------|----------|--------|
| Scraper error handling | P1 | 2h |
| API response caching | P2 | 3h |
| Image lazy loading | P2 | 1h |
| Database query optimization | P2 | 4h |
| Admin dark mode polish | P3 | 2h |

---

## Success Metrics Tracking

### Daily Metrics
- [ ] Articles collected per region
- [ ] AI processing success rate
- [ ] Grade distribution

### Weekly Metrics
- [ ] Total unique visitors
- [ ] Bounce rate
- [ ] Average session duration

### Monthly Metrics
- [ ] Revenue (when applicable)
- [ ] New reporter signups
- [ ] SEO ranking changes

---

*Last Updated: 2025-12-23*

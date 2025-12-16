# PageSpeed Performance Management

> **Purpose:** PageSpeed Insights performance tracking and optimization guide
> **Target URL:** https://www.koreanewsone.com/
> **Measurement Tool:** [PageSpeed Insights](https://pagespeed.web.dev/)
> **Last Updated:** 2025-12-17

---

## Quick Reference

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Performance** | 70+ | 52 | Needs Work |
| **Accessibility** | 90+ | 86 | Good |
| **Best Practices** | 90+ | 96 | Excellent |
| **SEO** | 90+ | 100 | Excellent |
| **LCP** | <2.5s | 13.7s | Critical |
| **TBT** | <200ms | 0ms | Excellent |
| **CLS** | <0.1 | 0.168 | Needs Work |

---

## Measurement History

### 2025-12-17 (Latest)

| Phase | Performance | Accessibility | TBT | LCP | Notes |
|-------|-------------|---------------|-----|-----|-------|
| Baseline | 56 | 75 | 70ms | 15.3s | Before optimization |
| Phase 1 | 55 | 86 | 20ms | 13.0s | Bundle optimization |
| Phase 2 | 52 | 86 | 0ms | 13.7s | Font/Image optimization |

**Phase 1 Changes:**
- Three.js dynamic import (~1.4MB reduction)
- TipTap editor dynamic import (~400KB reduction)
- Font weights reduced 8 to 3 (~120KB savings)
- GSAP dependency removed (unused)
- Viewport zoom restriction removed (accessibility)
- aria-labels added to Header icons

**Phase 2 Changes:**
- Font preload links added
- Hero image priority prop + sizes attribute
- NewsTicker dynamic import

---

## Optimization Checklist

### Bundle Size (JavaScript)

| Item | Status | Impact | Notes |
|------|--------|--------|-------|
| Three.js dynamic import | Done | ~1.4MB | StarField component |
| TipTap dynamic import | Done | ~400KB | Editor component |
| GSAP removal | Done | ~60KB | Was unused |
| React Three Fiber lazy | Pending | High | Only load on CosmicPulse |
| Unused dependencies audit | Pending | Medium | Check package.json |

### Images (LCP Critical)

| Item | Status | Impact | Notes |
|------|--------|--------|-------|
| next/Image usage | Done | High | All img tags converted |
| priority prop on hero | Done | Medium | First visible image |
| sizes attribute | Done | Medium | Responsive loading |
| WebP/AVIF format | Pending | ~592KB | Cloudinary transformation |
| Image CDN caching | Pending | High | Cloudinary settings |

### Fonts (FCP Critical)

| Item | Status | Impact | Notes |
|------|--------|--------|-------|
| Font weight reduction | Done | ~120KB | 8 to 3 weights |
| Font preload | Done | Medium | Regular + Bold |
| font-display: swap | Done | Medium | Already in CSS |
| Self-host consideration | Pending | Medium | vs CDN tradeoff |

### Accessibility

| Item | Status | Impact | Notes |
|------|--------|--------|-------|
| Viewport zoom allowed | Done | +11pts | maximumScale removed |
| aria-labels on icons | Done | - | Header social icons |
| Color contrast | Pending | Medium | PageSpeed warning |
| Touch target size | Pending | Medium | PageSpeed warning |
| Heading hierarchy | Pending | Low | h1-h6 order |

### Server/Infrastructure (Outside Code)

| Item | Status | Impact | Owner |
|------|--------|--------|-------|
| Edge caching | Pending | Critical | Vercel config |
| Image optimization | Pending | High | Cloudinary |
| API response time | Pending | High | Supabase |
| HSTS header | Pending | Low | Vercel headers |
| CSP header | Pending | Low | Security |

---

## How to Measure

### Manual Measurement

```
1. Open: https://pagespeed.web.dev/
2. Enter: https://www.koreanewsone.com/
3. Wait for analysis (~30-60 seconds)
4. Record metrics in this file
```

### Key Metrics to Record

| Metric | Description | Target |
|--------|-------------|--------|
| **Performance** | Overall score | 70+ |
| **LCP** | Largest Contentful Paint | <2.5s |
| **FCP** | First Contentful Paint | <1.8s |
| **TBT** | Total Blocking Time | <200ms |
| **CLS** | Cumulative Layout Shift | <0.1 |
| **SI** | Speed Index | <3.4s |

### Measurement Frequency

| Trigger | Action |
|---------|--------|
| After major deployment | Full measurement |
| Weekly (Monday) | Spot check Performance score |
| After adding new library | Full measurement |
| After image-heavy content | LCP check |

---

## Optimization Priorities

### P0 - Critical (Do Now)

| Issue | Expected Gain | Effort |
|-------|---------------|--------|
| Render-blocking requests | -3,130ms | High |
| Image optimization | -592KB | Medium |
| LCP image loading | Significant | Medium |

### P1 - Important (Next Sprint)

| Issue | Expected Gain | Effort |
|-------|---------------|--------|
| Unused JavaScript | -57KB | Low |
| DOM size optimization | Performance | Medium |
| Color contrast fix | Accessibility | Low |

### P2 - Nice to Have

| Issue | Expected Gain | Effort |
|-------|---------------|--------|
| Legacy JavaScript | -12KB | Low |
| Touch target sizing | Accessibility | Low |
| Third-party optimization | Variable | High |

---

## Code Patterns

### Dynamic Import Pattern

```typescript
// For heavy components (>50KB)
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    ssr: false,
    loading: () => <div className="animate-pulse" />
});
```

### Image Priority Pattern

```typescript
// For above-the-fold images
<Image
    src={url}
    alt={title}
    fill
    priority={isFirstVisible}
    sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Font Preload Pattern

```html
<!-- In layout.tsx <head> -->
<link
    rel="preload"
    href="font-url.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
/>
```

---

## Troubleshooting

### Performance Score Dropped

1. Check recent deployments for new dependencies
2. Run `npm run build` and check bundle size
3. Look for new images without optimization
4. Verify dynamic imports are working

### LCP Too High (>4s)

1. Check hero image loading strategy
2. Verify Cloudinary transformations
3. Check API response times
4. Consider server-side caching

### TBT Too High (>300ms)

1. Check for synchronous scripts
2. Look for heavy computations
3. Verify dynamic imports
4. Check third-party scripts

### CLS Too High (>0.25)

1. Check images without dimensions
2. Look for dynamically injected content
3. Verify font loading strategy
4. Check for ads or embeds

---

## References

- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

---

*Maintained by AI Agents (Claude/Gemini). Update after each optimization session.*

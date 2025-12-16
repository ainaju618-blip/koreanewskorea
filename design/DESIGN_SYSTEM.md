# Korea NEWS Design System

> **Version:** 1.0.0
> **Last Updated:** 2025-12-16
> **Author:** Claude (Design System Architect)

---

## Executive Summary

Korea NEWS 디자인 시스템의 현황 분석 및 통합 관리 문서입니다.

### Overall Score: 7.8 / 10

| 영역 | 점수 | 상태 |
|------|------|------|
| Brand Identity | 8/10 | Good - 명확한 정체성 |
| UI Components | 7.5/10 | Good - 일부 중복 개선 필요 |
| UX Consistency | 7/10 | Moderate - 페이지별 차이 존재 |
| Style System | 9/10 | Excellent - 체계적 구축 |
| Documentation | 6/10 | Needs Work - 분산되어 있음 |

### Recommendation: **점진적 보강** (Progressive Enhancement)

전면 개편이 아닌 **핵심 영역 집중 개선**을 권장합니다.

---

# Part 1: Brand Identity

## 1.1 Core Values

| 요소 | 현재 상태 | 정의 |
|------|----------|------|
| Mission | "전남에서 시작하여 한국을 대표하는 정론지" | 지역 기반 신뢰 언론 |
| Vision | 정직한 보도, 깊이 있는 분석 | E-E-A-T 원칙 준수 |
| Personality | 차분함, 정제됨, 신뢰감 | 과도한 디자인 배제 |

## 1.2 Color System

### Primary Palette

```
Primary Brand Colors
---------------------
Korea Red (Primary)     : #A6121D  - 메인 브랜드 컬러
Korea Red Dark          : #850F17  - Hover/Active 상태
Accent Red              : #C8161D  - 강조 요소

Deep Navy (Secondary)   : #0a192f  - 헤더, 권위감
Navy Dark               : #1a365d  - 그라데이션 끝

Neutral Base
------------
Background              : #f8f9fa  - 오프화이트 페이퍼
Surface                 : #ffffff  - 카드, 콘텐츠 영역
Text Primary            : slate-900 (#0f172a)
Text Secondary          : slate-600 (#475569)
Text Muted              : slate-400 (#94a3b8)
```

### Admin Dark Theme

```
Background Layers
-----------------
Base                    : #0d1117
Surface                 : #161b22
Elevated                : #1c2128
Overlay                 : #21262d

Accent Colors
-------------
Red                     : #f85149
Green                   : #3fb950
Blue                    : #58a6ff
Orange                  : #d29922
Purple                  : #a371f7
```

### Reporter Light Theme

```
Background
----------
Base                    : #FAFAF9  (Warm Off-White)
Surface                 : #FFFFFF
Elevated                : #F5F5F4
Hover                   : #F0F0EF
```

## 1.3 Typography

### Font Stack

| 용도 | 폰트 | 설명 |
|------|------|------|
| **Sans (본문)** | Pretendard | 현대적 가독성, 100-900 weight |
| **Serif (제목)** | ChosunilboMyungjo | 신문사 권위감, 명조체 |

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | Serif | 32px | Bold | tight |
| H2 | Serif | 24px | Bold | snug |
| H3 | Serif | 20px | SemiBold | snug |
| Body | Sans | 16px | Regular | 28px |
| Caption | Sans | 14px | Regular | normal |
| Small | Sans | 12px | Medium | normal |

## 1.4 Logo Assets

### Current Files

```
logo/
├── LOGO00.png    # 기본 로고
├── logo02.png    # 대안 버전
└── LOGO03.png    # 추가 버전
```

### Logo Usage (Header)

현재 텍스트 기반 로고 사용:
```
코리아NEWS
- "코리아" : #0a192f (Deep Navy)
- "NEWS"  : #A6121D (Korea Red)
- Font    : ChosunilboMyungjo
- Size    : text-4xl ~ text-5xl
```

### Needed Assets (TODO)

- [ ] Horizontal Logo (Header용)
- [ ] Symbol Only (Favicon용)
- [ ] Dark Mode Version
- [ ] OG Image (1200x630)

---

# Part 2: Layout System

## 2.1 Container Widths

| Context | Width | Usage |
|---------|-------|-------|
| **Main Container** | 1400px | Homepage, Category |
| **Article Detail** | 960px (max-w-4xl) | News Detail |
| **Full Width** | 100% | Admin, Reporter |
| **Sidebar** | 256px (fixed) | Admin, Idea |

## 2.2 Grid System

### Homepage Layout (72:28)

```
+------------------------------------------+
|              Hero Section                 |
+---------------------------+--------------+
|      Main Content         |   Sidebar    |
|      (72% - 1008px)       |   (28%)      |
|                           |              |
|  +-------+ +----------+   |  HOT Issue   |
|  | Main  | | Sub x 4  |   |  Latest      |
|  | Post  | |          |   |  QuickLinks  |
|  +-------+ +----------+   |              |
+---------------------------+--------------+
```

### Category Layout (75:25 / 9:3)

```
+--------------------------------------------+
|           Hero / Featured                   |
+--------------------------------+-----------+
|        Articles Grid           | Sidebar   |
|        (col-span-9)            | (col-3)   |
|                                |           |
|  +------+ +------+ +------+    | Popular   |
|  | Card | | Card | | Card |    | Tags      |
|  +------+ +------+ +------+    | AD        |
|                                |           |
|        Pagination              |           |
+--------------------------------+-----------+
```

### Article Detail Layout (Single Column)

```
+------------------------------------------+
|           Navigation (Sticky)             |
+------------------------------------------+
|                                          |
|  [Category] [Time] [Share]               |
|                                          |
|  Title (Serif, 40px)                     |
|  Subtitle                                |
|                                          |
|  +-- Author Info ----------------------+ |
|  | Name | Email | Created | Modified   | |
|  +-------------------------------------+ |
|                                          |
|  [AI Summary]                            |
|  [Thumbnail Image]                       |
|  [Article Body - Prose Style]            |
|                                          |
|  Related Articles                        |
|                                          |
+------------------------------------------+
```

## 2.3 Header Structure (4 Layers)

```
+------------------------------------------+
| Layer 1: Utility Bar (32px)              |
| [Social] [Date] [Subscribe] [Login]      |
| BG: #0a192f (Deep Navy)                  |
+------------------------------------------+
| Layer 2: Logo Zone (70px)                |
| [Ad 180px] [Logo Center] [Ad 180px]      |
| BG: White                                |
+------------------------------------------+
| Layer 3: GNB (55px) - STICKY             |
| [Home] [TV] [Categories...] [Search]     |
| Border: 2px #0a192f                      |
| Mega Menu: 640px dropdown                |
+------------------------------------------+
| Layer 4: News Ticker (45px)              |
| [Breaking News Scroll]                   |
+------------------------------------------+
```

## 2.4 Spacing Scale

```
Tailwind Standard (8px base):
- space-1  : 4px
- space-2  : 8px
- space-3  : 12px
- space-4  : 16px
- space-5  : 20px
- space-6  : 24px
- space-8  : 32px
- space-10 : 40px
- space-12 : 48px
```

---

# Part 3: Component Inventory

## 3.1 Component Summary

| Category | Count | Reusability |
|----------|-------|-------------|
| Global | 12 | Very High |
| UI Elements | 8 | Very High |
| Home Specific | 9 | Low |
| News/Article | 3 | High |
| Category | 4 | Medium |
| Region/Map | 3 | Low |
| Admin | 15 | Admin Only |
| **Total** | **54** | - |

## 3.2 Core Components

### Layout Components

| Component | Path | Purpose |
|-----------|------|---------|
| Header | `components/Header.tsx` | GNB, Mega Menu, Mobile Menu |
| Footer | `components/Footer.tsx` | Site Info, Admin Quick Access |
| Sidebar | `components/Sidebar.tsx` | HOT Issue, Latest, Links |
| AdminSidebar | `components/admin/AdminSidebar.tsx` | Admin Navigation |

### Content Components

| Component | Variants | Usage |
|-----------|----------|-------|
| NewsCard | horizontal, vertical, compact, overlay, list | All article lists |
| NewsGrid | 1+4 layout | Homepage sections |
| HeroSlider | Dynamic carousel | Homepage hero |
| Pagination | Standard | Category, Lists |

### UI Components

| Component | Path | Purpose |
|-----------|------|---------|
| Toast | `components/ui/Toast.tsx` | Notifications |
| ConfirmModal | `components/ui/ConfirmModal.tsx` | Confirmations |
| OptimizedImage | `components/ui/OptimizedImage.tsx` | Cloudinary Images |
| ShareButton | `components/news/ShareButton.tsx` | Social Sharing |

## 3.3 Component Issues

### Duplications Found

| Component | Locations | Action Needed |
|-----------|-----------|---------------|
| Pagination | `ui/`, `admin/shared/` | Merge into one |
| ConfirmModal | 3 versions | Unify interface |

### Missing Components

| Component | Need Level | Description |
|-----------|------------|-------------|
| Skeleton | High | Loading placeholders |
| Badge | Medium | Status indicators |
| Tabs | Medium | Tab navigation |
| Dropdown | Low | Select menus |

---

# Part 4: Page-by-Page Analysis

## 4.1 Homepage

| Aspect | Status | Score |
|--------|--------|-------|
| Layout Structure | Excellent | 9/10 |
| Component Reuse | Good | 8/10 |
| Performance | Excellent (Streaming) | 9/10 |
| Mobile | Good | 7/10 |

**Strengths:**
- Suspense + Streaming for fast loading
- Clear 72:28 grid structure
- Consistent NewsGrid usage

**Improvements:**
- Section spacing inconsistent (mb-8, mb-16 mixed)
- Hero section could be more impactful

## 4.2 Category Pages

| Aspect | Status | Score |
|--------|--------|-------|
| Layout Consistency | Moderate | 6/10 |
| Filter UX | Good | 7/10 |
| Pagination | Good | 8/10 |

**Issues:**
- 3 different layout patterns exist:
  - Type A: 9:3 + Sidebar (Correct)
  - Type B: 3-col cards, no sidebar
  - Type C: 1-col list, no sidebar

**Recommendation:** Unify to Type A pattern

## 4.3 Article Detail

| Aspect | Status | Score |
|--------|--------|-------|
| Typography | Excellent | 9/10 |
| SEO | Excellent | 9/10 |
| Readability | Excellent | 9/10 |
| Share Features | Good | 7/10 |

**Strengths:**
- JSON-LD structured data
- Newspaper-style serif typography
- AI summary integration

## 4.4 Admin Dashboard

| Aspect | Status | Score |
|--------|--------|-------|
| Dark Theme | Excellent | 9/10 |
| UX Flow | Good | 8/10 |
| Components | Good | 7/10 |

**Strengths:**
- Professional VS Code-style dark theme
- Well-structured sidebar navigation
- Comprehensive stat cards

---

# Part 5: Issues & Recommendations

## 5.1 Critical Issues (P0)

| Issue | Impact | Solution |
|-------|--------|----------|
| Category layout inconsistency | UX confusion | Unify to 9:3 pattern |
| Pagination duplication | Maintenance burden | Merge components |

## 5.2 High Priority (P1)

| Issue | Impact | Solution |
|-------|--------|----------|
| Missing loading skeletons | Perceived performance | Add Skeleton components |
| Section spacing variance | Visual inconsistency | Define spacing constants |
| Modal system fragmented | Code duplication | Create unified Modal system |

## 5.3 Medium Priority (P2)

| Issue | Impact | Solution |
|-------|--------|----------|
| Logo assets incomplete | Brand consistency | Create full logo kit |
| Mobile menu could improve | Mobile UX | Add gesture support |
| Search limited | Discoverability | Enhance search UX |

## 5.4 Low Priority (P3)

| Issue | Impact | Solution |
|-------|--------|----------|
| Animation inconsistency | Polish | Standardize animations |
| Icon usage mixed | Visual consistency | Standardize to lucide-react |

---

# Part 6: Action Plan

## Recommendation: Progressive Enhancement

**DO NOT** do a full redesign. The current system is **7.8/10** - good foundation.

### Phase 1: Quick Wins (1-2 weeks)

1. **Unify Category Layouts**
   - Apply 9:3 + Sidebar pattern to all category pages
   - Files: `CategoryPageTemplate.tsx`, `jeonnam-region/page.tsx`

2. **Merge Duplicate Components**
   - Pagination: Keep `ui/Pagination.tsx`, remove admin version
   - ConfirmModal: Create single `ui/Modal.tsx` with variants

3. **Define Spacing Constants**
   ```tsx
   // lib/design-tokens.ts
   export const SPACING = {
     section: 'mb-12',  // Between sections
     card: 'mb-6',      // Between cards
     content: 'mb-4',   // Within content
   }
   ```

### Phase 2: Foundation (2-4 weeks)

1. **Complete Logo Kit**
   - Generate all logo variants
   - Create favicon set
   - Design OG image template

2. **Add Missing UI Components**
   - Skeleton loading components
   - Unified Badge component
   - Tab component

3. **Document Design Tokens**
   - Export from globals.css to TypeScript
   - Create Storybook or component docs

### Phase 3: Enhancement (4-8 weeks)

1. **Mobile Experience**
   - Improve mobile menu gestures
   - Add pull-to-refresh
   - Optimize touch targets

2. **Performance**
   - Image lazy loading optimization
   - Bundle size analysis
   - Core Web Vitals monitoring

3. **Accessibility**
   - ARIA labels audit
   - Keyboard navigation
   - Screen reader testing

---

# Part 7: File Reference

## Design Documents

| File | Purpose | Status |
|------|---------|--------|
| `design/designplan.md` | Brand identity & guidelines | Complete |
| `design/logo.md` | Logo design plan | Planning |
| `design/logo_integration_plan.md` | Logo implementation | Planning |
| `design/algorithm_proposal.md` | Algorithm improvements | Planning |
| `design/DESIGN_SYSTEM.md` | This document | Active |

## Style Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens, themes, base styles |
| `postcss.config.mjs` | PostCSS + Tailwind v4 config |

## Component Directories

| Directory | Contents |
|-----------|----------|
| `src/components/` | Global components |
| `src/components/ui/` | UI primitives |
| `src/components/home/` | Homepage specific |
| `src/components/category/` | Category specific |
| `src/components/admin/` | Admin dashboard |
| `src/components/news/` | Article related |
| `src/components/maps/` | Map visualizations |

---

# Appendix: CSS Variables Reference

## Global Theme (@theme)

```css
--font-sans: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
--font-serif: "ChosunilboMyungjo", "Noto Serif KR", Georgia, serif;

--color-primary: #A6121D;
--color-primary-dark: #850F17;
--color-secondary: #0a192f;
--color-accent: #C8161D;
--color-background: #f8f9fa;
--color-surface: #ffffff;

--container-width: 1400px;
--header-height: 90px;

--shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
--backdrop-glass: blur(12px);
```

## Admin Theme (.admin-layout)

```css
--admin-bg-base: #0d1117;
--admin-bg-surface: #161b22;
--admin-bg-elevated: #1c2128;
--admin-bg-overlay: #21262d;

--admin-text-primary: #ffffff;
--admin-text-secondary: #c9d1d9;
--admin-text-tertiary: #8b949e;

--admin-border-default: #30363d;
--admin-border-muted: #21262d;
--admin-border-emphasis: #484f58;

--admin-accent-red: #f85149;
--admin-accent-green: #3fb950;
--admin-accent-blue: #58a6ff;
--admin-accent-orange: #d29922;
--admin-accent-purple: #a371f7;
```

## Reporter Theme (.reporter-layout)

```css
--reporter-bg-base: #FAFAF9;
--reporter-bg-surface: #FFFFFF;
--reporter-bg-elevated: #F5F5F4;
--reporter-bg-hover: #F0F0EF;

--reporter-text-primary: #1F2937;
--reporter-text-secondary: #6B7280;
--reporter-text-tertiary: #9CA3AF;

--reporter-accent-blue: #3B82F6;
--reporter-accent-green: #10B981;
--reporter-accent-amber: #F59E0B;
--reporter-accent-red: #EF4444;
```

---

*This document serves as the single source of truth for Korea NEWS design system.*
*Update this document when making design decisions.*

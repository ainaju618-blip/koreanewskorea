# Frontend/Page Domain Guide for AI

> **Purpose:** Quick reference for AI agents navigating the frontend codebase
> **Last Updated:** 2025-12-17
> **Maintainer:** Claude

---

## Overview

This guide provides a comprehensive map of the Korea NEWS frontend structure, helping AI agents quickly locate pages, components, and understand the project's architecture.

---

## 🗂️ Folder Structure Quick Reference

### 1. Pages (`src/app/`)

```
src/app/
├── (site)/              # Public-facing site pages (default layout)
│   ├── page.tsx         # Homepage (main news)
│   ├── about/           # About pages (history, organization, location)
│   ├── category/        # News categories
│   │   ├── [slug]/      # Dynamic category pages (e.g., /category/gwangju)
│   │   ├── jeonnam/     # Jeonnam region pages
│   │   │   └── [region]/ # 27 regions (naju, mokpo, etc.)
│   │   ├── ai/          # AI news section
│   │   ├── education/   # Education news
│   │   ├── opinion/     # Opinion articles
│   │   └── politics-economy/ # Politics & Economy
│   ├── news/            # News detail pages
│   │   ├── [id]/        # Individual article page
│   │   └── network/     # Regional news network
│   ├── map/             # Interactive map (Jeonnam regions)
│   ├── subscribe/       # Newsletter subscription
│   ├── contact/         # Contact form
│   ├── report/          # News tip submission
│   ├── privacy/         # Privacy policy
│   ├── terms/           # Terms of service
│   └── ethical-code/    # Journalism ethics code
│
├── admin/               # Admin dashboard (protected)
│   ├── page.tsx         # Main dashboard
│   ├── news/            # Article management
│   │   ├── page.tsx     # Article list
│   │   ├── write/       # New article editor
│   │   └── edit/[id]/   # Edit article
│   ├── bot/             # Scraper management
│   │   ├── run/         # Manual scraper execution
│   │   ├── logs/        # Scraper logs
│   │   ├── schedule/    # Auto-schedule settings
│   │   └── ai-news/     # AI news collection
│   ├── users/           # User management
│   │   ├── members/     # Members list
│   │   ├── reporters/   # Reporters list
│   │   └── roles/       # Role management
│   ├── settings/        # System settings
│   │   ├── general/     # General settings
│   │   ├── categories/  # Category management
│   │   ├── menus/       # Menu editor
│   │   ├── layouts/     # Layout settings
│   │   ├── hero-slider/ # Homepage slider
│   │   └── performance/ # Performance settings
│   ├── claude-hub/      # AI knowledge management
│   ├── idea/            # AI news idea system
│   ├── sources/         # News source management
│   ├── usage/           # Service usage dashboard
│   └── drafts/          # Draft articles
│
├── reporter/            # Reporter portal (auth required)
│   ├── page.tsx         # Reporter dashboard
│   ├── login/           # Reporter login
│   ├── write/           # Write new article
│   ├── edit/[id]/       # Edit article
│   ├── articles/        # My articles
│   ├── drafts/          # My drafts
│   ├── press-releases/  # Press release inbox
│   ├── notifications/   # Notification center
│   └── profile/         # Profile settings
│
├── blog/                # Blog system
│   ├── page.tsx         # Blog homepage
│   └── [slug]/          # Blog post detail
│
├── blogadmin/           # Blog admin (separate from main admin)
│   ├── page.tsx         # Blog dashboard
│   ├── posts/           # Blog post management
│   │   ├── page.tsx     # Post list
│   │   └── new/         # New post editor
│   └── ai-generator/    # AI blog post generator
│
├── cosmos/              # CosmicPulse (Space/Science News)
│   ├── page.tsx         # Cosmos homepage
│   └── [category]/      # Cosmos category pages
│
├── idea/                # AI News Idea System (public view)
│   ├── page.tsx         # Idea dashboard
│   ├── raw/             # Raw ideas
│   ├── processed/       # Processed ideas
│   ├── sources/         # News sources
│   └── settings/        # Settings
│
├── author/              # Author profile pages
│   └── [slug]/          # Author detail page
│
├── api/                 # API routes (see backend guide)
├── layout.tsx           # Root layout (global metadata, fonts)
├── globals.css          # Global styles (theme, typography)
├── robots.ts            # SEO robots.txt
└── sitemap.ts           # SEO sitemap
```

### 2. Components (`src/components/`)

```
src/components/
├── Header.tsx           # Global header (navigation, search)
├── Footer.tsx           # Global footer (links, copyright)
├── Sidebar.tsx          # Homepage sidebar (popular, categories)
├── NewsCard.tsx         # Article card component
├── NewsGrid.tsx         # Article grid section
├── MainSlider.tsx       # Homepage main slider
├── NewsTicker.tsx       # Scrolling news ticker
├── ArticleEditor.tsx    # Rich text editor (for articles)
├── Providers.tsx        # React context providers
├── ConfirmModal.tsx     # Global confirm modal
├── CookieConsentBanner.tsx # GDPR cookie banner
├── PWAInstallPrompt.tsx # PWA install prompt
│
├── admin/               # Admin-specific components
│   ├── AdminSidebar.tsx # Admin sidebar navigation
│   ├── NewsEditor.tsx   # News article editor
│   ├── AdminAuthGuard.tsx # Auth guard wrapper
│   ├── FloatingAdminPanel.tsx # Quick admin panel
│   ├── bot/             # Bot/scraper components
│   │   ├── RegionHeatmap.tsx # Region collection heatmap
│   │   ├── CollectionChart.tsx # Collection stats chart
│   │   └── AlertBanner.tsx # Alert banner
│   └── shared/          # Shared admin components (see README.md)
│       ├── StatusBadge.tsx
│       ├── ConfirmModal.tsx
│       ├── FilterTabs.tsx
│       ├── PageHeader.tsx
│       ├── Pagination.tsx
│       ├── SlidePanel.tsx
│       └── README.md    # **EXISTING GUIDE** (detailed API)
│
├── home/                # Homepage-specific components
│   ├── HomeHero.tsx     # Homepage hero section
│   ├── HeroSlider.tsx   # Hero slider with auto-play
│   ├── HeroFeature.tsx  # Featured article card
│   ├── MostViewed.tsx   # Most viewed articles widget
│   ├── NoticeBar.tsx    # Notice bar
│   ├── OpinionCard.tsx  # Opinion article card
│   ├── TabbedBoard.tsx  # Tabbed content board
│   └── VideoWidget.tsx  # Video widget
│
├── category/            # Category page components
│   ├── CategoryHeader.tsx # Category page header
│   ├── CategoryPageTemplate.tsx # Category page layout
│   ├── BoardSidebar.tsx # Category sidebar
│   └── ServerBoardSidebar.tsx # Server-side sidebar
│
├── news/                # News detail components
│   └── ShareButton.tsx  # Social share button
│
├── reporter/            # Reporter portal components
│   ├── NotificationDropdown.tsx # Notification dropdown
│   ├── ArticleHistory.tsx # Article revision history
│   └── ActivityFeed.tsx # Activity feed
│
├── blogadmin/           # Blog admin components
│   └── BlogAdminSidebar.tsx # Blog admin sidebar
│
├── author/              # Author page components
│   └── SubscribeButton.tsx # Author subscribe button
│
├── landing/             # Landing page components
│   └── CosmicScene.tsx  # 3D cosmic scene
│
├── maps/                # Map components
│   ├── JeonnamMap.tsx   # Jeonnam region map
│   └── NaverMap.tsx     # Naver Maps integration
│
└── ui/                  # UI primitives (reusable)
    ├── Toast.tsx        # Toast notification system
    ├── ConfirmModal.tsx # Confirm dialog
    ├── Pagination.tsx   # Pagination component
    ├── ShareToast.tsx   # Share success toast
    ├── CategoryIcon.tsx # Category icon
    ├── OptimizedImage.tsx # Image optimization wrapper
    ├── NoImageCard.tsx  # No image placeholder card
    └── NoImagePlaceholder.tsx # No image placeholder
```

---

## 📋 Page-to-Component Mapping

| Page Path | Main Components Used | Purpose |
|-----------|---------------------|---------|
| `/` (Homepage) | `HomeHero`, `NewsGrid`, `Sidebar` | Main news landing page |
| `/category/[slug]` | `CategoryHeader`, `CategoryPageTemplate`, `BoardSidebar` | Category listing page |
| `/news/[id]` | `ArticleEditor` (view mode), `ShareButton` | Article detail page |
| `/admin` | `AdminSidebar`, various stat cards | Admin dashboard |
| `/admin/news` | `NewsEditor`, `StatusBadge`, `Pagination` | Article management |
| `/admin/bot/run` | `RegionHeatmap`, `CollectionChart` | Scraper management |
| `/reporter` | `NotificationDropdown`, `ActivityFeed` | Reporter dashboard |
| `/reporter/write` | `ArticleEditor` | Article writing |
| `/blog/[slug]` | Blog-specific components | Blog post detail |
| `/cosmos` | Cosmos-specific components | Space/science news |

---

## 🎨 Key UI Patterns

### 1. Layout System

```tsx
// Root Layout (all pages)
// src/app/layout.tsx
<html lang="ko">
  <body>
    <Providers>        // Global providers (Toast, Confirm, etc.)
      {children}       // Page content
    </Providers>
  </body>
</html>

// Site Layout (public pages)
// src/app/(site)/layout.tsx
<>
  <Header />           // Global navigation
  {children}           // Page content
  <Footer />           // Global footer
</>

// Admin Layout
// src/app/admin/layout.tsx
<AdminAuthGuard>
  <div className="flex">
    <AdminSidebar />   // Admin sidebar
    <main>{children}</main>
  </div>
</AdminAuthGuard>

// Reporter Layout
// src/app/reporter/layout.tsx
<ReporterAuthGuard>
  <Header />
  {children}
  <Footer />
</ReporterAuthGuard>
```

### 2. Data Fetching Patterns

**Server Components (default)**
```tsx
// src/app/(site)/page.tsx
export default async function HomePage() {
  // Fetch data directly in component
  const articles = await fetchArticles();

  return <NewsGrid articles={articles} />;
}
```

**Client Components (interactive)**
```tsx
"use client";
// src/app/admin/news/page.tsx
export default function AdminNewsPage() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch('/api/posts').then(/* ... */);
  }, []);

  return <ArticleList articles={articles} />;
}
```

### 3. Styling System

**Tailwind CSS 4 (globals.css)**
```css
/* Color System */
--color-primary: #A6121D;      /* Korea NEWS red */
--color-navy: #0a192f;         /* Dark navy */
--color-text: #1e293b;         /* Slate 800 */

/* Typography */
font-sans: Pretendard (body text)
font-serif: Chosun Ilbo Myeongjo (headlines)
```

**Component Styling**
```tsx
// Prefer Tailwind classes
<div className="bg-white rounded-xl border border-slate-200 p-6">
  <h1 className="text-2xl font-bold text-slate-900">Title</h1>
</div>
```

---

## 🔍 Common Tasks for AI

### Task 1: Find a Specific Page

**Question:** "Where is the blog admin page?"

**Answer:**
- **Path:** `src/app/blogadmin/page.tsx`
- **Route:** `/blogadmin`
- **Components:** `BlogAdminSidebar.tsx`

### Task 2: Find Where a Component is Used

**Question:** "Which pages use `NewsCard`?"

**Steps:**
1. Search for imports: `import.*NewsCard`
2. Check:
   - `src/app/(site)/page.tsx` (Homepage)
   - `src/app/(site)/category/[slug]/page.tsx` (Category pages)
   - `src/components/NewsGrid.tsx` (Grid wrapper)

### Task 3: Understand a Feature's Implementation

**Question:** "How does the reporter article writing feature work?"

**Answer:**
- **Entry Page:** `src/app/reporter/write/page.tsx`
- **Editor Component:** `src/components/ArticleEditor.tsx`
- **API Endpoint:** `src/app/api/reporter/articles/route.ts`
- **Database:** `posts` table (see `info/database.md`)

### Task 4: Modify Global Styles

**Question:** "How do I change the primary color?"

**Answer:**
- **File:** `src/app/globals.css`
- **Section:** `:root` CSS variables
- **Example:**
  ```css
  :root {
    --color-primary: #A6121D; /* Change this */
  }
  ```

### Task 5: Add a New Page

**Question:** "How do I add a new public page?"

**Steps:**
1. Create `src/app/(site)/[new-page]/page.tsx`
2. Add metadata (SEO)
3. Import layout components (`Header`, `Footer` auto-applied)
4. Add navigation link in `Header.tsx`
5. Update `sitemap.ts` for SEO

---

## 📚 Related Documentation

| Topic | Document Path |
|-------|--------------|
| **Component API** | `src/components/admin/shared/README.md` (Admin shared components) |
| **Backend/API** | `info/backend.md` |
| **Database Schema** | `info/database.md` |
| **Design System** | `info/design-system.md` |
| **Full Project Guide** | `info/README.md` |
| **Source Structure** | `src/README.md` |

---

## 🚨 Important Rules (from CLAUDE.md)

1. **Encoding:** NO Korean in code comments (UTF-8 encoding issues on Vercel)
   - ✅ `// Category definition`
   - ❌ `// 카테고리 정의`

2. **System Modals:** NEVER use `alert()` or `confirm()`
   - ✅ Use `useToast()` and `useConfirm()` hooks

3. **Code Style:** NO emojis in code
   - ✅ `status: "success"`
   - ❌ `status: "✅ success"`

4. **UI Text:** Korean is ONLY allowed in user-facing strings
   - ✅ `<span>구독신청</span>`
   - ❌ `aria-label="메뉴 열기"` (use English)

---

## 🔧 Quick Debugging Tips

### Issue: Component Not Rendering

**Check:**
1. Is it a Server Component trying to use hooks? → Add `"use client"`
2. Is the file path correct? (case-sensitive)
3. Is there a layout.tsx wrapping it?

### Issue: Styles Not Applying

**Check:**
1. Tailwind classes correct? (check `tailwind.config.ts`)
2. CSS conflicts with globals.css?
3. Browser cache cleared?

### Issue: Data Not Fetching

**Check:**
1. API route exists? (`src/app/api/...`)
2. Fetch URL correct? (absolute vs relative)
3. CORS issues? (check Supabase RLS)

---

## 📝 Document Maintenance

**When to Update This Guide:**
- New page added to `src/app/`
- New major component created in `src/components/`
- Folder structure changes
- New UI pattern introduced

**How to Update:**
- Edit `info/guides/frontend/FRONTEND_GUIDE.md`
- Add new entries to relevant sections
- Update "Last Updated" date at top

---

*This guide is maintained by AI agents to help navigate the Korea NEWS frontend codebase efficiently.*

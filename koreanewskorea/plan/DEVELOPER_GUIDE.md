# Regional Homepage Developer Guide

> **Version:** 2.0
> **Created:** 2025-12-24
> **Status:** Production Ready Specification
> **For:** External Developers

---

## Document Purpose

This is the **COMPLETE** developer guide for building the Korea NEWS regional homepage system.
All developers MUST read this entire document before starting any work.

**Reading Time:** ~30 minutes
**Prerequisite Knowledge:** Next.js App Router, React, TypeScript, Supabase

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Critical Rules (P0)](#2-critical-rules-p0)
3. [Current State Analysis](#3-current-state-analysis)
4. [Environment Setup](#4-environment-setup)
5. [Architecture Guide](#5-architecture-guide)
6. [Development Phases](#6-development-phases)
7. [Component Specifications](#7-component-specifications)
8. [API Specifications](#8-api-specifications)
9. [Testing Requirements](#9-testing-requirements)
10. [Deployment Guide](#10-deployment-guide)
11. [Troubleshooting](#11-troubleshooting)
12. [Checklist](#12-checklist)

---

## 1. Project Overview

### 1.1 Mission

Build 24 independent regional news homepages under `*.koreanewskorea.com`.

```
gwangju.koreanewskorea.com   -> Gwangju News
mokpo.koreanewskorea.com     -> Mokpo News
damyang.koreanewskorea.com   -> Damyang News
... (24 total)
```

### 1.2 Architecture Concept

```
+----------------------------------------------------------+
|                    FRONTEND (24 Independent UIs)          |
|  +--------+ +--------+ +--------+ +--------+ +--------+  |
|  | Gwangju| | Jeonnam| | Mokpo  | |  ...   | | Shinan |  |
|  +--------+ +--------+ +--------+ +--------+ +--------+  |
+----------------------------------------------------------+
|                    BACKEND (Shared)                       |
|  +----------------------------------------------------+  |
|  |  Single Supabase DB  |  Single API  |  Single CMS  |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### 1.3 Region Tier System

| Tier | Regions | Count | Layout | Daily Articles |
|------|---------|-------|--------|----------------|
| **1** | Gwangju, Jeonnam | 2 | Full (3+ sections) | 15-25 |
| **2** | Mokpo, Yeosu, Suncheon, Naju, Gwangyang | 5 | Standard (2 sections) | 5-15 |
| **3** | 17 Counties | 17 | Compact (1 section) | 1-5 |

### 1.4 Content Distribution Ratio

| Tier | Local | Nearby | National |
|------|-------|--------|----------|
| **1** | 70% | 20% | 10% |
| **2** | 50% | 30% | 20% |
| **3** | 30% | 40% | 30% |

> **Note:** "National" = Province-level (Gwangju + Jeonnam), NOT nationwide.

---

## 2. Critical Rules (P0)

### 2.1 Separation Rule (ABSOLUTE)

```
koreanews/
├── src/                    # EXISTING HOMEPAGE - NEVER TOUCH
├── koreanewskorea/         # THIS PROJECT - COMPLETELY SEPARATE
└── scrapers/               # SHARED - Both projects use same data
```

**PROHIBITED:**
- Importing from `src/`
- Modifying files in `src/`
- Sharing React components between projects

**ALLOWED:**
- Sharing Supabase database
- Sharing scraper data
- Referencing `src/` for ideas (read-only)

### 2.2 Code Standards (MUST)

| Rule | Violation |
|------|-----------|
| English only in code/comments | Build REJECTED |
| No emojis in code | Build REJECTED |
| No `alert()`/`confirm()` | Code review REJECT |
| No hardcoded region data | Use repository |
| No silent error handling | Must show error UI |
| All routes must have error boundary | Deploy BLOCKED |

### 2.3 File Locations

| Type | Location | Example |
|------|----------|---------|
| Components | `common/components/` | `NewsCard.tsx` |
| Layouts | `common/layouts/` | `FullLayout.tsx` |
| Business Logic | `common/domain/` | `SmartFill.ts` |
| Data Access | `common/infrastructure/` | `ArticleRepository.ts` |
| Public API | `common/lib/` | `content.ts` |
| Pages | `app/` | `page.tsx` |
| API Routes | `app/api/` | `route.ts` |

---

## 3. Current State Analysis

### 3.1 What's Implemented (Working)

| Component | File | Status |
|-----------|------|--------|
| Domain Entities | `common/domain/entities/` | Complete |
| SmartFill Algorithm | `common/domain/usecases/SmartFill.ts` | Has bugs (see 3.2) |
| Article Repository | `common/infrastructure/repositories/ArticleRepository.ts` | Working |
| Region Repository | `common/infrastructure/repositories/RegionRepository.ts` | Working |
| Facade Layer | `common/lib/*.ts` | Working |
| Middleware | `middleware.ts` | Working |
| Home Page | `app/page.tsx` | Partial |
| Basic Components | `common/components/*.tsx` | Partial |
| Layouts | `common/layouts/*.tsx` | Partial |

### 3.2 Known Bugs (MUST FIX)

#### Bug 1: SmartFill Math Error
```typescript
// File: common/domain/usecases/SmartFill.ts
// Problem: Duplicate articles not properly filtered
// Fix: Dedupe by ID before merging arrays
```

#### Bug 2: RegionalHero Grid Logic
```typescript
// File: common/components/RegionalHero.tsx (line 92-94)
// Problem: Checks tier === 1 for ALL layouts
// Fix: Add proper tier 2 and tier 3 grid logic
```

#### Bug 3: Article Limits Mismatch
```typescript
// File: app/page.tsx (lines 30-43)
// Problem: Requests 14 local articles but hero takes 6
// Fix: Calculate limits AFTER reserving hero articles
```

### 3.3 What's Missing (CRITICAL)

| Item | Priority | Impact |
|------|----------|--------|
| `/news/[id]/page.tsx` | P0 | All article links broken |
| `/about/page.tsx` | P1 | Footer link broken |
| `/contact/page.tsx` | P1 | Footer link broken |
| `app/api/` routes | P1 | No REST API |
| Error boundaries | P0 | Blank screens on error |
| Loading states | P1 | Poor UX |
| Environment config | P0 | Build fails |
| Tests | P1 | No quality assurance |
| Responsive design | P1 | Mobile broken |

### 3.4 Silent Error Handling (MUST FIX)

Current pattern (BAD):
```typescript
if (error) {
  console.error('Error:', error);
  return [];  // Silent failure - user sees empty page
}
```

Required pattern (GOOD):
```typescript
if (error) {
  throw new ArticleRepositoryError('Failed to fetch articles', { cause: error });
}
// Component uses error boundary to show error UI
```

---

## 4. Environment Setup

### 4.1 Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### 4.2 Clone and Install

```bash
cd koreanews/koreanewskorea
npm install
```

### 4.3 Environment Variables

Create `.env.local`:

```env
# Supabase (REQUIRED - same as main project)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Development
NEXT_PUBLIC_ENV=development
```

> **Get values from:** Vercel Dashboard > koreanewsone > Settings > Environment Variables

### 4.4 Run Development Server

```bash
npm run dev
# Opens http://localhost:3000

# Test with region parameter:
# http://localhost:3000?region=gwangju
# http://localhost:3000?region=mokpo
# http://localhost:3000?region=damyang
```

### 4.5 Verify Setup

Checklist before starting development:

- [ ] `npm run dev` starts without errors
- [ ] Homepage loads with Gwangju content
- [ ] `?region=mokpo` shows Mokpo content
- [ ] Browser console has no errors
- [ ] Supabase connection works (articles appear)

---

## 5. Architecture Guide

### 5.1 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                         │
│  app/          - Next.js pages and routes               │
│  components/   - React components                       │
│  layouts/      - Tier-based layouts                     │
├─────────────────────────────────────────────────────────┤
│                    APPLICATION                          │
│  lib/          - Facade layer (public API)              │
│                 - Orchestrates domain + infrastructure  │
├─────────────────────────────────────────────────────────┤
│                    DOMAIN                               │
│  entities/     - Data structures (Article, Region)      │
│  usecases/     - Pure business logic (SmartFill)        │
├─────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                       │
│  repositories/ - Data access (Supabase queries)         │
│  supabase/     - Database client setup                  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Import Rules

```typescript
// CORRECT: Presentation imports from lib/ (facade)
import { getSmartFilledNews, getRegionConfig } from '@/common/lib';

// WRONG: Presentation imports from infrastructure
import { ArticleRepository } from '@/common/infrastructure'; // NO!

// CORRECT: lib/ imports from domain and infrastructure
import { SmartFill } from '@/common/domain';
import { ArticleRepository } from '@/common/infrastructure';
```

### 5.3 Data Flow

```
User visits gwangju.koreanewskorea.com
    │
    ▼
middleware.ts detects subdomain "gwangju"
    │
    ▼
Sets x-region header = "gwangju"
    │
    ▼
app/page.tsx reads header, calls lib/content.ts
    │
    ▼
lib/content.ts calls infrastructure/repositories
    │
    ▼
Repository queries Supabase, returns Article[]
    │
    ▼
lib/content.ts applies domain/usecases/SmartFill
    │
    ▼
Page renders with layouts/FullLayout + components
```

---

## 6. Development Phases

### Phase 0: Bug Fixes (MUST DO FIRST)

Before any new development, fix existing bugs:

#### Task 0.1: Fix SmartFill Algorithm
```typescript
// File: common/domain/usecases/SmartFill.ts

// Current (buggy):
const allArticles = [...localArticles, ...nearbyArticles, ...nationalArticles];
const uniqueIds = new Set(allArticles.map(a => a.id));

// Fixed:
const seen = new Set<string>();
const deduped: Article[] = [];
for (const article of [...localArticles, ...nearbyArticles, ...nationalArticles]) {
  if (!seen.has(article.id)) {
    seen.add(article.id);
    deduped.push(article);
  }
}
```

#### Task 0.2: Fix Hero Grid Logic
```typescript
// File: common/components/RegionalHero.tsx

// Current (buggy):
gridColumn: index === 0 && tier === 1 ? 'span 2' : 'span 1'

// Fixed:
const getGridColumn = (index: number, tier: number) => {
  if (tier === 1) return index === 0 ? 'span 2' : 'span 1';
  if (tier === 2) return 'span 1'; // 2x2 grid
  return 'span 1'; // Tier 3: simple list
};
```

#### Task 0.3: Fix Article Limits
```typescript
// File: app/page.tsx

// Current (buggy):
const heroLimit = tier === 1 ? 6 : tier === 2 ? 4 : 1;
const localLimit = Math.floor(20 * 0.7); // 14, but hero takes 6!

// Fixed:
const TOTAL_ARTICLES = 20;
const heroLimit = tier === 1 ? 6 : tier === 2 ? 4 : 1;
const remainingAfterHero = TOTAL_ARTICLES - heroLimit;
const localLimit = Math.floor(remainingAfterHero * ratios.local);
```

---

### Phase 1: Critical Missing Features (P0)

#### Task 1.1: Create Article Detail Page

**File:** `app/news/[id]/page.tsx`

```typescript
import { getArticleById, getRelatedArticles } from '@/common/lib/content';
import { getRegionConfig } from '@/common/lib/regions';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { RegionalHeader } from '@/common/components/RegionalHeader';
import { NewsCard } from '@/common/components/NewsCard';
import { Footer } from '@/common/components/Footer';

interface Props {
  params: { id: string };
}

export default async function ArticleDetailPage({ params }: Props) {
  const headersList = await headers();
  const region = headersList.get('x-region') || 'gwangju';
  const regionConfig = await getRegionConfig(region);

  const article = await getArticleById(params.id);
  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.id, region, 4);

  return (
    <div>
      <RegionalHeader region={regionConfig} />
      <main>
        <article>
          <h1>{article.title}</h1>
          <div className="meta">
            <span>{article.source}</span>
            <time>{article.published_at}</time>
          </div>
          {article.thumbnail_url && (
            <img src={article.thumbnail_url} alt={article.title} />
          )}
          <div className="content">
            {article.content || article.ai_summary}
          </div>
        </article>

        <section className="related">
          <h2>Related Articles</h2>
          <div className="grid">
            {relatedArticles.map(a => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const article = await getArticleById(params.id);
  if (!article) return { title: 'Not Found' };

  return {
    title: `${article.title} | Korea NEWS`,
    description: article.ai_summary || article.title,
    openGraph: {
      title: article.title,
      description: article.ai_summary,
      images: article.thumbnail_url ? [article.thumbnail_url] : [],
    },
  };
}
```

#### Task 1.2: Add Error Boundaries

**File:** `app/error.tsx`

```typescript
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>We apologize for the inconvenience.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**File:** `app/not-found.tsx`

```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">Go to Homepage</Link>
    </div>
  );
}
```

#### Task 1.3: Add Loading States

**File:** `app/loading.tsx`

```typescript
export default function Loading() {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}
```

#### Task 1.4: Fix Repository Error Handling

**File:** `common/infrastructure/repositories/ArticleRepository.ts`

```typescript
// Add custom error class
export class ArticleRepositoryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ArticleRepositoryError';
  }
}

// Update all methods to throw instead of return empty
static async findByRegion(region: string, limit = 20): Promise<Article[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('region', region)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new ArticleRepositoryError(
      `Failed to fetch articles for region: ${region}`,
      { cause: error }
    );
  }

  return data || [];
}
```

---

### Phase 2: API Routes

#### Task 2.1: Region List API

**File:** `app/api/regions/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAllRegions } from '@/common/lib/regions';

export async function GET() {
  try {
    const regions = await getAllRegions();
    return NextResponse.json({ data: regions });
  } catch (error) {
    console.error('GET /api/regions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}
```

#### Task 2.2: Region Config API

**File:** `app/api/region/[code]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRegionConfig } from '@/common/lib/regions';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const config = await getRegionConfig(params.code);
    if (!config) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: config });
  } catch (error) {
    console.error(`GET /api/region/${params.code} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch region config' },
      { status: 500 }
    );
  }
}
```

#### Task 2.3: Region News API

**File:** `app/api/region/[code]/news/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSmartFilledNews } from '@/common/lib/content';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const articles = await getSmartFilledNews(params.code, limit);
    return NextResponse.json({
      data: articles,
      meta: { count: articles.length, region: params.code }
    });
  } catch (error) {
    console.error(`GET /api/region/${params.code}/news error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Responsive Design

#### Task 3.1: Update globals.css

**File:** `common/styles/globals.css`

```css
@import "tailwindcss";

:root {
  /* Colors */
  --color-primary: #1E3A5F;
  --color-primary-hover: #2A4A73;
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-text: #1F2937;
  --color-text-secondary: #6B7280;
  --color-accent: #2563EB;
  --color-border: #E5E7EB;

  /* Typography */
  --font-sans: 'Pretendard', -apple-system, sans-serif;
  --font-serif: 'Noto Serif KR', Georgia, serif;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* Container */
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

/* Responsive Grid */
.grid-responsive {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Mobile Navigation */
.mobile-menu {
  display: none;
}

@media (max-width: 767px) {
  .desktop-nav {
    display: none;
  }
  .mobile-menu {
    display: block;
  }
}

/* Region Badges */
.region-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.region-badge--tier1 {
  background-color: #1E3A5F;
  color: white;
}

.region-badge--tier2 {
  background-color: #2563EB;
  color: white;
}

.region-badge--tier3 {
  background-color: #6B7280;
  color: white;
}

/* Error States */
.error-page,
.not-found-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: var(--spacing-xl);
}

/* Loading States */
.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Task 3.2: Add Mobile Header

**File:** `common/components/MobileMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Region } from '@/common/domain/entities/Region';

interface Props {
  region: Region;
}

export function MobileMenu({ region }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mobile-menu">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>

      {isOpen && (
        <nav className="mobile-nav">
          <Link href="/" onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <a href="#local" onClick={() => setIsOpen(false)}>
            {region.nameKo} News
          </a>
          <a href="#nearby" onClick={() => setIsOpen(false)}>
            Nearby
          </a>
        </nav>
      )}
    </div>
  );
}
```

---

### Phase 4: Testing

#### Task 4.1: Setup Testing Framework

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

#### Task 4.2: Write SmartFill Tests

**File:** `tests/domain/SmartFill.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { SmartFill } from '@/common/domain/usecases/SmartFill';
import { Article } from '@/common/domain/entities/Article';

describe('SmartFill', () => {
  const createArticle = (id: string, region: string): Article => ({
    id,
    title: `Article ${id}`,
    region,
    published_at: new Date().toISOString(),
  });

  it('should deduplicate articles by ID', () => {
    const local = [createArticle('1', 'gwangju')];
    const nearby = [createArticle('1', 'gwangju')]; // duplicate
    const national = [createArticle('2', 'jeonnam')];

    const result = SmartFill.merge(local, nearby, national);

    expect(result).toHaveLength(2);
    expect(result.map(a => a.id)).toEqual(['1', '2']);
  });

  it('should calculate correct limits for tier 1', () => {
    const limits = SmartFill.calculateLimits(1, 20);

    expect(limits.local).toBe(14);  // 70%
    expect(limits.nearby).toBe(4);  // 20%
    expect(limits.national).toBe(2); // 10%
  });

  it('should calculate correct limits for tier 3', () => {
    const limits = SmartFill.calculateLimits(3, 20);

    expect(limits.local).toBe(6);   // 30%
    expect(limits.nearby).toBe(8);  // 40%
    expect(limits.national).toBe(6); // 30%
  });
});
```

#### Task 4.3: Write Component Tests

**File:** `tests/components/NewsCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsCard } from '@/common/components/NewsCard';

describe('NewsCard', () => {
  const mockArticle = {
    id: '1',
    title: 'Test Article',
    region: 'gwangju',
    published_at: '2024-01-01T00:00:00Z',
    thumbnail_url: 'https://example.com/image.jpg',
    ai_summary: 'Test summary',
  };

  it('should render article title', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('should render thumbnail when available', () => {
    render(<NewsCard article={mockArticle} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockArticle.thumbnail_url);
  });

  it('should handle missing thumbnail gracefully', () => {
    const articleNoImage = { ...mockArticle, thumbnail_url: undefined };
    render(<NewsCard article={articleNoImage} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```

---

## 7. Component Specifications

### 7.1 Required Components

| Component | File | Props | Status |
|-----------|------|-------|--------|
| RegionalHeader | `components/RegionalHeader.tsx` | `{ region: Region }` | Needs mobile menu |
| RegionalHero | `components/RegionalHero.tsx` | `{ articles: Article[], tier: number }` | Needs grid fix |
| NewsCard | `components/NewsCard.tsx` | `{ article: Article, showRegion?: boolean }` | Needs responsive |
| NewsList | `components/NewsList.tsx` | `{ articles: Article[], title: string }` | Working |
| Footer | `components/Footer.tsx` | None | Working |
| MobileMenu | `components/MobileMenu.tsx` | `{ region: Region }` | **NEW - Create** |
| ErrorBoundary | `components/ErrorBoundary.tsx` | `{ children }` | **NEW - Create** |
| LoadingSpinner | `components/LoadingSpinner.tsx` | `{ size?: string }` | **NEW - Create** |

### 7.2 Required Layouts

| Layout | File | For Tier | Sections |
|--------|------|----------|----------|
| FullLayout | `layouts/FullLayout.tsx` | 1 | Hero + Local + Nearby + National + Sidebar |
| StandardLayout | `layouts/StandardLayout.tsx` | 2 | Hero + Mixed Content + Sidebar |
| CompactLayout | `layouts/CompactLayout.tsx` | 3 | Featured + List |

### 7.3 Required Pages

| Page | File | Status |
|------|------|--------|
| Home | `app/page.tsx` | Working (needs fixes) |
| Article Detail | `app/news/[id]/page.tsx` | **MISSING - Create** |
| About | `app/about/page.tsx` | **MISSING - Create** |
| Contact | `app/contact/page.tsx` | **MISSING - Create** |
| Error | `app/error.tsx` | **MISSING - Create** |
| Not Found | `app/not-found.tsx` | **MISSING - Create** |
| Loading | `app/loading.tsx` | **MISSING - Create** |

---

## 8. API Specifications

### 8.1 Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/regions` | GET | List all regions | `{ data: Region[] }` |
| `/api/region/[code]` | GET | Get region config | `{ data: Region }` |
| `/api/region/[code]/news` | GET | Get news for region | `{ data: Article[], meta: {...} }` |
| `/api/region/[code]/nearby` | GET | Get nearby region news | `{ data: Article[] }` |

### 8.2 Query Parameters

| Endpoint | Param | Type | Default | Description |
|----------|-------|------|---------|-------------|
| `/api/region/[code]/news` | limit | number | 20 | Max articles |
| `/api/region/[code]/news` | offset | number | 0 | Pagination offset |
| `/api/region/[code]/nearby` | limit | number | 10 | Max nearby articles |

### 8.3 Error Responses

```typescript
// 400 Bad Request
{ error: 'Invalid region code', code: 'INVALID_REGION' }

// 404 Not Found
{ error: 'Region not found', code: 'NOT_FOUND' }

// 500 Internal Server Error
{ error: 'Failed to fetch data', code: 'INTERNAL_ERROR' }
```

---

## 9. Testing Requirements

### 9.1 Minimum Coverage

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 80% | 0% |
| Component Tests | 70% | 0% |
| Integration Tests | 50% | 0% |
| E2E Tests | Key flows | 0% |

### 9.2 Required Test Cases

#### Domain Layer
- [ ] SmartFill.calculateLimits for all tiers
- [ ] SmartFill.merge deduplication
- [ ] SmartFill.merge ordering

#### Infrastructure Layer
- [ ] ArticleRepository.findByRegion
- [ ] ArticleRepository.findByRegions
- [ ] RegionRepository.getConfig
- [ ] Error handling for all repository methods

#### Components
- [ ] NewsCard renders correctly
- [ ] NewsCard handles missing fields
- [ ] RegionalHeader shows region name
- [ ] RegionalHero grid for each tier
- [ ] MobileMenu toggle

#### Pages
- [ ] Home page loads for each tier
- [ ] Article detail page displays content
- [ ] 404 page for invalid article
- [ ] Error boundary catches errors

### 9.3 Run Tests

```bash
npm test              # Run all tests
npm test:watch        # Watch mode
npm test:coverage     # Coverage report
```

---

## 10. Deployment Guide

### 10.1 Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set in Vercel
- [ ] Error boundaries in place
- [ ] Loading states in place

### 10.2 Vercel Configuration

**File:** `vercel.json` (create if not exists)

```json
{
  "regions": ["icn1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### 10.3 Domain Setup

1. Go to Vercel Dashboard > Domains
2. Add `*.koreanewskorea.com` (wildcard)
3. Configure DNS in domain registrar
4. Verify SSL certificate

### 10.4 Deployment

```bash
# Push to trigger auto-deploy
git add .
git commit -m "feat: regional homepage system"
git push

# Or manual deploy
vercel --prod
```

---

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank page | Silent error in repository | Check browser console, add error boundary |
| Wrong region content | Middleware not detecting subdomain | Check `?region=` param in dev |
| Build fails | TypeScript errors | Run `npx tsc --noEmit` |
| Supabase error | Missing env vars | Check `.env.local` |
| 404 on article | Missing `/news/[id]/page.tsx` | Create the page |

### 11.2 Debug Commands

```bash
# Check TypeScript
npx tsc --noEmit

# Check build
npm run build

# Check Supabase connection
node -e "require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).from('posts').select('id').limit(1).then(console.log)"
```

### 11.3 Contact

For questions not covered in this guide, contact the project owner.

---

## 12. Checklist

### Phase 0: Bug Fixes
- [ ] Fix SmartFill deduplication
- [ ] Fix RegionalHero grid logic
- [ ] Fix article limits calculation

### Phase 1: Critical Features
- [ ] Create `/news/[id]/page.tsx`
- [ ] Create `app/error.tsx`
- [ ] Create `app/not-found.tsx`
- [ ] Create `app/loading.tsx`
- [ ] Fix repository error handling

### Phase 2: API Routes
- [ ] Create `/api/regions/route.ts`
- [ ] Create `/api/region/[code]/route.ts`
- [ ] Create `/api/region/[code]/news/route.ts`
- [ ] Create `/api/region/[code]/nearby/route.ts`

### Phase 3: Responsive Design
- [ ] Update `globals.css` with responsive utilities
- [ ] Create `MobileMenu.tsx`
- [ ] Make `RegionalHeader` responsive
- [ ] Make `NewsCard` responsive
- [ ] Make all layouts mobile-friendly

### Phase 4: Testing
- [ ] Setup Vitest
- [ ] Write SmartFill tests
- [ ] Write component tests
- [ ] Achieve 80% coverage

### Phase 5: Deployment
- [ ] Set environment variables
- [ ] Configure Vercel domains
- [ ] Deploy to production
- [ ] Verify all 24 subdomains work

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-12-24 | Claude | Complete rewrite with critical analysis |
| 1.0 | 2025-12-23 | Claude | Initial WORK_ORDER.md |

---

*This document is the authoritative guide for regional homepage development.*
*Update this document as implementation progresses.*

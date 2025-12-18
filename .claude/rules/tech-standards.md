# Technical Standards

> Version: 1.0
> Last Updated: 2025-12-19

---

## Tech Stack

| Area | Technology | Version |
|------|------------|---------|
| Framework | Next.js (App Router) | 16.0.7 |
| UI | React | 19.2.0 |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL) | - |
| Scraper | Python + Playwright | - |
| Image Storage | **Cloudinary** (P0) | - |

---

## File Encoding Rules (P0)

> **Prevent UTF-8 encoding errors on Vercel build**

```
WARNING: No Korean in code files (.tsx, .ts, .js, .jsx)

Problem: Encoding corruption on Git commit -> Vercel build fail
Error: "stream did not contain valid UTF-8"

PROHIBITED:
  - Korean comments: // Category definition (X)
  - Korean variables: const name = "value" (X)
  - Korean aria-label: aria-label="Open menu" (X)

ALLOWED:
  - English comments: // Category definition
  - English variables: const name = "value"
  - English aria-label: aria-label="Open menu"
  - UI text (for rendering): <span>Subscribe</span>

EXCEPTION:
  - User-facing UI text in Korean is allowed
  - Korean values in JSON/config files are allowed
```

---

## System Modal Prohibition (P0)

```javascript
// P0 VIOLATION - PROHIBITED
alert('message');
confirm('confirm?');

// CORRECT usage
const { showSuccess } = useToast();
const { confirm } = useConfirm();
```

---

## Context7 Usage Rules (MUST)

> **Use Context7 MCP for new tech, libraries, or unfamiliar code.**

### When to Use Context7

| Situation | Use Context7 | Reason |
|-----------|--------------|--------|
| Introducing new library | **MUST** | Verify latest API |
| Updating existing library | **MUST** | Check breaking changes |
| Difficult error resolution | **SHOULD** | Official doc-based solution |
| Familiar code work | Optional | Reference if needed |

### Usage Method (2 Steps)

```
Step 1: resolve-library-id to get library ID
        Example: "Next.js" -> /vercel/next.js

Step 2: get-library-docs for latest docs
        Example: topic="App Router", mode="code"
```

---

## SEO & E-E-A-T Checklist

| Item | Application |
|------|-------------|
| **Meta tags** | title, description, og:image required |
| **Structured data** | Schema.org (Article, Person, Organization) |
| **Semantic HTML** | h1-h6 hierarchy |
| **Image optimization** | alt tags, next/image, WebP |

---

## Priority System

| Level | Meaning | Violation Result |
|-------|---------|------------------|
| **P0** | CRITICAL | Stop immediately, cannot restart |
| **P1** | MUST | Work REJECTED |
| **P2** | SHOULD | Warning, comply next time |

---

## Code Quality Standards

### TypeScript
- Run `tsc --noEmit` before build
- No `any` type unless absolutely necessary
- Proper interface/type definitions

### React/Next.js
- Use App Router patterns
- Prefer Server Components when possible
- Use `use client` directive only when needed

### Styling
- Tailwind CSS classes preferred
- CSS variables in `globals.css` @theme section
- Dark mode support via `.admin-layout` class

---

## Image Handling

### Cloudinary (P0 - MUST use)

```typescript
// Upload images to Cloudinary
// NEVER store images locally or in Git

// Use next/image with Cloudinary URLs
import Image from 'next/image';

<Image
  src="https://res.cloudinary.com/..."
  alt="Description"
  width={800}
  height={600}
/>
```

---

## Development Tools

### One-Click Dev Server Launcher

> **Location:** `C:\Users\user\OneDrive\Desktop\koreanews-dev.bat`

**Features:**
- Auto-kill existing dev server terminal
- Force kill port 3000 process
- Project path & Node.js verification
- Auto-delete Next.js cache (.next)
- Start dev server + auto-open browser

**Usage:**
```
Double-click koreanews-dev.bat on desktop
-> Port 3000 always fixed
-> http://localhost:3000 auto-opens
```

---

## Operational Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server

# Type checking
npx tsc --noEmit         # Type check without emit

# Deployment
git push                 # Triggers Vercel auto-deploy
vercel --prod            # Manual deploy to production

# Scraper
python scrapers/[region]/main.py  # Run specific scraper
```

---

## File Reference

| Info Type | Document Location |
|-----------|-------------------|
| **All pages/API list** | `src/README.md` (82+ pages, 89 APIs) |
| **Frontend dev** | `info/frontend.md` |
| **Backend/API** | `info/backend.md` |
| **DB schema** | `info/database.md` |
| **Scraper** | `scrapers/SCRAPER_GUIDE.md` |
| **Design system** | `info/design-system.md` |
| **CSS/Style files** | `src/app/globals.css` |
| **Tailwind config** | `tailwind.config.ts` |
| **Error solutions** | `info/errors/_catalog.md` |

---

*Reference: Main instructions in CLAUDE.md*

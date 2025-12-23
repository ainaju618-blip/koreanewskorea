# Document Fix Order (v2)

> **Created:** 2025-12-23
> **Updated:** 2025-12-23 (2nd review)
> **Priority:** Must fix before development starts

---

## Issue Summary

| # | Issue | Severity | File | Status |
|---|-------|----------|------|--------|
| 1 | ~~Folder structure diagram~~ | ~~CRITICAL~~ | ~~regional-homepage-spec.md~~ | DONE |
| 2 | ~~API endpoints inconsistent~~ | ~~HIGH~~ | ~~common/README.md~~ | DONE |
| 3 | ~~Checklist outdated~~ | ~~MEDIUM~~ | ~~regional-homepage-spec.md~~ | DONE |
| 4 | ~~National definition unclear~~ | ~~MEDIUM~~ | ~~common/README.md~~ | DONE |
| 5 | ~~Next.js app structure~~ | ~~HIGH~~ | ~~WORK_ORDER.md~~ | DONE |
| 6 | ~~middleware.ts location wrong~~ | ~~CRITICAL~~ | ~~regional-homepage-spec.md~~ | DONE |
| 7 | ~~README missing items~~ | ~~MEDIUM~~ | ~~koreanewskorea/README.md~~ | DONE |
| 8 | ~~[regions]/ wrong text~~ | ~~MEDIUM~~ | ~~regional-homepage-spec.md~~ | DONE |
| 9 | ~~Environment vars clarification~~ | ~~LOW~~ | ~~WORK_ORDER.md~~ | DONE |
| 10 | ~~DB modification impact~~ | ~~HIGH~~ | ~~regional-homepage-spec.md~~ | DONE |

---

## ✅ ALL FIXES COMPLETED (2025-12-23)

All 10 issues have been resolved. Documents are ready for development.

---

## Fix 6: middleware.ts Location (CRITICAL)

**File:** `plan/regional-homepage-spec.md`

**Location:** Section 1.4 folder structure (line 113-117)

**Current (WRONG):**
```
└── app/                   # Next.js App Router
    ├── layout.tsx
    ├── page.tsx
    ├── middleware.ts      ← WRONG LOCATION
    └── news/[id]/page.tsx
```

**Change to:**
```
├── middleware.ts          # Subdomain detection (MUST be at root)
└── app/                   # Next.js App Router
    ├── layout.tsx
    ├── page.tsx
    └── news/[id]/page.tsx
```

**Reason:** Next.js requires middleware.ts at project root, NOT inside app/ folder.

---

## Fix 7: README Missing Items (MEDIUM)

**File:** `koreanewskorea/README.md`

**Location:** Folder Structure section (line 30-50)

**Current:**
```
koreanewskorea/
├── README.md
├── plan/
│   ├── regional-homepage-spec.md
│   └── regions/
├── common/
│   ├── README.md
│   ├── components/
│   ├── layouts/
│   └── lib/
└── app/
```

**Change to:**
```
koreanewskorea/
├── README.md
├── START_HERE.md              # Developer entry point
├── package.json               # (to be created)
├── tsconfig.json              # (to be created)
├── next.config.ts             # (to be created)
├── tailwind.config.ts         # (to be created)
├── middleware.ts              # Subdomain routing (to be created)
│
├── plan/
│   ├── regional-homepage-spec.md
│   ├── WORK_ORDER.md
│   ├── FIX_ORDER.md
│   └── regions/
│       └── *.md (24 files)
│
├── common/
│   ├── README.md
│   ├── components/
│   ├── layouts/
│   ├── hooks/
│   ├── lib/
│   └── styles/
│
└── app/
    ├── layout.tsx
    ├── page.tsx
    ├── news/[id]/page.tsx
    └── api/
        ├── regions/route.ts
        └── region/[code]/...
```

---

## Fix 8: [regions]/ Wrong Text (MEDIUM)

**File:** `plan/regional-homepage-spec.md`

**Location:** Section "CRITICAL: Separation Rule" (line 20-26)

**Current (WRONG):**
```
├── koreanewskorea/   # THIS PROJECT - COMPLETELY SEPARATE
│   ├── plan/         # Specifications (this folder)
│   ├── common/       # Shared components
│   └── [regions]/    # Regional folders    ← WRONG
```

**Change to:**
```
├── koreanewskorea/   # THIS PROJECT - COMPLETELY SEPARATE
│   ├── plan/         # Specifications (this folder)
│   ├── common/       # Shared components
│   └── app/          # Next.js App Router
```

**Reason:** We decided NO individual region folders. All code in common/, configs in plan/regions/*.md.

---

## Fix 9: Environment Variables Clarification (LOW)

**File:** `plan/WORK_ORDER.md`

**Location:** Task 2.2 (line 167-171)

**Current:**
```
### Task 2.2: Environment Variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Change to:**
```
### Task 2.2: Environment Variables

Use the SAME values as existing koreanewsone.com project.
Both projects share the same Supabase database.

Required:
  NEXT_PUBLIC_SUPABASE_URL=<same as koreanewsone>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as koreanewsone>

Get values from:
  - Vercel Dashboard → koreanewsone → Settings → Environment Variables
  - Or from koreanews/.env.local file
```

---

## Fix 10: DB Modification Impact (HIGH)

**File:** `plan/regional-homepage-spec.md`

**Location:** Section 6.2 (line 381-389)

**Current:**
```
### 6.2 Existing Tables to Modify

-- posts table: ensure region field is indexed
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);

-- Add region priority for sorting
ALTER TABLE posts ADD COLUMN IF NOT EXISTS region_priority INTEGER DEFAULT 0;
```

**Add this warning BEFORE the SQL:**
```
### 6.2 Existing Tables to Modify

> ⚠️ **WARNING: Shared Database Impact**
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

-- posts table: ensure region field is indexed
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);

-- Add region priority for sorting
ALTER TABLE posts ADD COLUMN IF NOT EXISTS region_priority INTEGER DEFAULT 0;
```

---

## Verification After All Fixes

After completing fixes 6-10, verify:

- [ ] middleware.ts shown at project root (not inside app/)
- [ ] README.md shows all files including START_HERE, WORK_ORDER, config files
- [ ] [regions]/ text removed from separation diagram
- [ ] Environment variables reference existing project
- [ ] DB modification has impact warning

---

## Document Reading Order (Final)

When all fixes are done, developers should read in this order:

1. `START_HERE.md` - Entry point
2. `README.md` - Project overview
3. `common/README.md` - Shared settings
4. `plan/regional-homepage-spec.md` - Full specification
5. `plan/WORK_ORDER.md` - Task list
6. `plan/regions/gwangju.md` - Start with Gwangju config

---

*Complete these fixes before starting development.*

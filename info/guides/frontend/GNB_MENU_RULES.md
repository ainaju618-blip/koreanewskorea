# GNB/Menu Development Rules

> **Purpose:** Prevent hardcoding mistakes in navigation menus
> **Target:** All AI agents working on Header.tsx, navigation components
> **Priority:** P0 - MUST READ before modifying any menu/navigation code

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│  GNB/Menu = DB-driven Dynamic Rendering                      │
│                                                              │
│  Admin Category Settings ←→ API ←→ Frontend Menu             │
│                                                              │
│  This sync MUST be maintained at all times.                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Forbidden Patterns (P0 Violations)

### 1. Hardcoded Menu Items

```tsx
// ❌ FORBIDDEN - Hardcoded menu item
<Link href="/admin/claude-hub">
    <Database className="w-4 h-4" />
    <span>Claude Hub</span>
</Link>

// ❌ FORBIDDEN - Hardcoded array
const menuItems = [
    { name: 'Claude Hub', href: '/admin/claude-hub' },
    { name: 'CosmicPulse', href: '/cosmos' },
];
```

**Problem:** Admin category settings (GNB ON/OFF) will NOT affect these items.

### 2. Mixing Hardcoded and Dynamic Items

```tsx
// ❌ FORBIDDEN - Mixed approach
{categories.map(cat => <MenuItem key={cat.id} {...cat} />)}
<Link href="/special-page">Special</Link>  // Hardcoded!
```

**Problem:** Inconsistent behavior - some items respect admin settings, others don't.

### 3. Bypassing Category API

```tsx
// ❌ FORBIDDEN - Direct DB query for menu
const { data } = await supabase.from('categories').select('*');
// Missing: gnb=true filter, hierarchical inheritance check

// ✅ CORRECT - Use the API with proper filters
const res = await fetch('/api/categories?gnb=true&active=true');
```

---

## Required Patterns

### 1. Dynamic Menu from Category API

```tsx
// ✅ CORRECT - Fetch from API with GNB filter
useEffect(() => {
    fetch('/api/categories?gnb=true')
        .then(res => res.json())
        .then(data => setCategories(data.categories));
}, []);

// ✅ CORRECT - Render from state
{categories.map(cat => (
    <Link key={cat.id} href={`/category/${cat.slug}`}>
        {cat.name}
    </Link>
))}
```

### 2. Special Pages (Non-Category Items)

If you need special menu items that are NOT categories:

```tsx
// ✅ CORRECT - Create as category in admin with custom_url
// Admin > Categories > New Category:
//   - name: "Claude Hub"
//   - slug: "claude-hub"
//   - custom_url: "/admin/claude-hub"
//   - show_in_gnb: true/false (controllable!)

// Then it will appear/disappear based on admin settings
```

### 3. Hierarchical Inheritance

The system enforces:
- Parent GNB OFF → All children automatically OFF
- Parent is_active OFF → All children automatically OFF

```
Parent Category (GNB: OFF)
├── Child 1 (automatically hidden)
├── Child 2 (automatically hidden)
└── Child 3 (automatically hidden)
```

---

## Pre-Modification Checklist

Before modifying Header.tsx or any navigation component:

```
□ 1. Read this document (GNB_MENU_RULES.md)
□ 2. Check if the item should be a category (admin-controllable)
□ 3. If yes → Add via Admin > Categories, NOT code
□ 4. If truly special (e.g., Search, PWA button) → OK to hardcode UI elements
□ 5. Never hardcode navigation links that should be admin-controllable
```

---

## When Hardcoding IS Acceptable

| Item | Hardcode OK? | Reason |
|------|-------------|--------|
| Search input | ✅ Yes | UI element, not navigation |
| PWA install button | ✅ Yes | UI element, not navigation |
| Social media icons | ✅ Yes | External links, not site navigation |
| Logo | ✅ Yes | Brand element |
| Menu item (page link) | ❌ No | Should be category-controlled |
| Admin-only pages | ❌ No | Create category with admin visibility |

---

## Related Files

| File | Role |
|------|------|
| `src/components/Header.tsx` | Main navigation component |
| `src/app/api/categories/route.ts` | Category API (GNB filtering) |
| `src/app/api/categories/[id]/route.ts` | Category update (cascade logic) |
| `src/app/admin/settings/categories/page.tsx` | Admin category management |

---

## Error Case Study: Claude Hub Incident (2025-12-17)

**What happened:**
1. Claude Hub was hardcoded in Header.tsx
2. Admin set CosmicPulse GNB to OFF
3. CosmicPulse children still appeared (no hierarchical inheritance)
4. Claude Hub always appeared regardless of admin settings

**Root causes:**
1. Hardcoded menu item bypassed category API
2. GET API didn't filter children when parent GNB was OFF
3. PATCH API didn't cascade GNB changes to children

**Fixes applied:**
1. Removed hardcoded Claude Hub from Header.tsx
2. Added hierarchical filtering in GET API
3. Added cascade functions in PATCH API

**Lesson:** Never hardcode menu items. Always use category system.

---

*Last updated: 2025-12-17*
*Created after Claude Hub/GNB incident*

# Admin UI Rules (P0)

> Version: 1.0
> Last Updated: 2025-12-20

---

## Core Principle

**Admin pages are for DESKTOP power users, NOT mobile casual users.**

```
Priority: Information Density > Aesthetics > Responsiveness
```

---

## P0 Rules (Must Follow)

### 1. Desktop First (No Mobile Optimization)

```
WRONG:
  - Mobile-first responsive design
  - Large touch-friendly buttons
  - Single column layout on desktop

CORRECT:
  - Fixed desktop layout (min-width: 1280px)
  - Compact controls
  - Multi-column layout maximizing screen space
```

### 2. Tables Over Cards/Boxes

```
WRONG:
  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │  Card   │  │  Card   │  │  Card   │
  │  with   │  │  with   │  │  with   │
  │  info   │  │  info   │  │  info   │
  └─────────┘  └─────────┘  └─────────┘
  (3 items visible, lots of wasted space)

CORRECT:
  ┌────────────────────────────────────────────┐
  │ ID │ Title        │ Date   │ Status │ Act │
  ├────────────────────────────────────────────┤
  │ 1  │ Article A    │ 12-20  │ Active │ Edit│
  │ 2  │ Article B    │ 12-19  │ Draft  │ Edit│
  │ 3  │ Article C    │ 12-18  │ Active │ Edit│
  │ ... (20+ items visible at once)           │
  └────────────────────────────────────────────┘
```

### 3. Minimize Padding/Margins

```css
/* WRONG - Too much whitespace */
.admin-card {
  padding: 24px;
  margin: 16px;
  gap: 24px;
}

/* CORRECT - Compact layout */
.admin-table td {
  padding: 8px 12px;
}
.admin-section {
  margin-bottom: 16px;
}
```

### 4. Compact Form Controls

```
WRONG:
  Label
  ┌─────────────────────────────────┐
  │ Input (full width)              │
  └─────────────────────────────────┘
  (vertical stacking, one field per row)

CORRECT:
  ┌─────────────────────────────────────────────────┐
  │ Label: [input] │ Label: [input] │ Label: [input]│
  └─────────────────────────────────────────────────┘
  (inline labels, multiple fields per row)
```

### 5. Data-Dense Lists

```
WRONG:
  - Show 5-10 items per page
  - Large pagination controls
  - Lots of empty space

CORRECT:
  - Show 25-50 items per page (default)
  - Compact pagination
  - Minimal empty space
```

---

## Layout Guidelines

### Sidebar Navigation

```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │  Main Content Area                      │
│ (fixed)  │  (scrollable)                           │
│          │                                          │
│ - Menu1  │  ┌─────────────────────────────────────┐│
│ - Menu2  │  │ Header / Filters / Actions          ││
│ - Menu3  │  ├─────────────────────────────────────┤│
│          │  │ Data Table (25-50 rows visible)     ││
│          │  │                                      ││
│          │  │                                      ││
│          │  └─────────────────────────────────────┘│
└──────────┴─────────────────────────────────────────┘
```

### Action Buttons

```
WRONG:
  ┌─────────────────┐
  │    Edit Item    │  (large, text-only)
  └─────────────────┘

CORRECT:
  [✏️ Edit] [🗑️ Del] [👁️ View]  (compact, icon+text)
```

### Status Indicators

```
WRONG:
  ┌────────────────┐
  │ ● Active       │  (large badge)
  └────────────────┘

CORRECT:
  ● Active  (inline colored dot + text)
```

---

## Specific Components

### Data Tables (Primary Choice)

```typescript
// Required features
- Sortable columns
- Fixed header on scroll
- Compact row height (40-48px)
- Inline actions (edit, delete)
- Bulk selection checkbox
- 25-50 rows per page default
```

### Filters

```
WRONG:
  [Filter Panel - takes 200px height]

CORRECT:
  [Inline filters: Status ▼ | Date ▼ | Search 🔍 | Reset]
```

### Modals/Dialogs

```
- Use for forms, confirmations only
- NOT for displaying lists
- Compact padding
- Auto-focus first input
```

---

## CSS Class Reference

Use `.admin-layout` class for admin-specific styles.

```css
/* Already defined in globals.css */
.admin-layout {
  /* Dark mode admin styles */
}
```

---

## File Path Scope

These rules apply to:

```
src/app/admin/**/*
src/app/(admin)/**/*
src/components/admin/**/*
```

---

## Checklist Before Submitting Admin Code

- [ ] Using table instead of cards for lists?
- [ ] Showing 25+ items per page?
- [ ] Compact padding/margins?
- [ ] Inline form labels where possible?
- [ ] Desktop-optimized (no mobile breakpoints)?
- [ ] Information density maximized?

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Alternative |
|--------------|---------|-------------|
| Card grid for data | Low density | Table |
| Mobile-first design | Admin is desktop-only | Desktop-first |
| Large padding | Wastes space | Compact spacing |
| One field per row | Slow data entry | Multi-column forms |
| 10 items/page | Too much paging | 25-50 items/page |
| Full-width inputs | Wastes space | Appropriate width |

---

*Reference: Main instructions in CLAUDE.md*

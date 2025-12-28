# Category Components (src/components/category) AI Guide

> **Summary:** Category page components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `CategoryPageTemplate.tsx` | Main category page layout | All category pages |
| `CategoryHeader.tsx` | Category page header | Category pages |
| `BoardSidebar.tsx` | Category sidebar (client) | Category pages |
| `ServerBoardSidebar.tsx` | Category sidebar (server) | SSR category pages |

---

## CategoryPageTemplate

Main template for all category pages. Handles:
- Article listing
- Pagination
- Sidebar integration
- SEO metadata

---

## Sidebar Components

Two versions for different rendering strategies:
- `BoardSidebar.tsx` - Client-side rendering
- `ServerBoardSidebar.tsx` - Server-side rendering

---

## FAQ

| Question | Answer |
|----------|--------|
| "Category page template?" | `CategoryPageTemplate.tsx` |
| "Category header?" | `CategoryHeader.tsx` |
| "Sidebar component?" | `BoardSidebar.tsx` or `ServerBoardSidebar.tsx` |
| "카테고리 페이지 템플릿?" | `CategoryPageTemplate.tsx` |
| "카테고리 헤더?" | `CategoryHeader.tsx` |
| "사이드바?" | `BoardSidebar.tsx` (클라이언트) / `ServerBoardSidebar.tsx` (서버) |
| "카테고리별 기사 목록?" | `CategoryPageTemplate.tsx` |
| "분류 페이지 레이아웃?" | `CategoryPageTemplate.tsx` |
| "SSR 사이드바?" | `ServerBoardSidebar.tsx` |

---

## Related Documents

| Document | Path |
|----------|------|
| Components Guide | `src/components/README.md` |
| Category Pages | `src/app/(site)/category/` |

---

*Last updated: 2025-12-17*

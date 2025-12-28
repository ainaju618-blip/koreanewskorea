# Maps Components (src/components/maps) AI Guide

> **Summary:** Map components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `JeonnamMap.tsx` | Jeonnam region SVG map | Region selection |
| `NaverMap.tsx` | Naver Maps integration | Location pages |

---

## JeonnamMap

Interactive SVG map of Jeonnam region (27 areas).

**Features:**
- Clickable regions
- Hover effects
- Region highlighting

---

## NaverMap

Naver Maps API integration.

**Features:**
- Location markers
- Map navigation
- Address display

---

## FAQ

| Question | Answer |
|----------|--------|
| "Jeonnam region map?" | `JeonnamMap.tsx` |
| "Naver Maps?" | `NaverMap.tsx` |
| "Kakao Maps?" | Check `/map` page directly |
| "전남 지도?" | `JeonnamMap.tsx` - 27개 지역 SVG |
| "지역 선택 지도?" | `JeonnamMap.tsx` |
| "시군 클릭 지도?" | `JeonnamMap.tsx` |
| "네이버 지도?" | `NaverMap.tsx` |
| "지도 컴포넌트?" | `JeonnamMap.tsx` (지역), `NaverMap.tsx` (위치) |
| "오시는 길 지도?" | `NaverMap.tsx` 또는 `/location` 페이지 |

---

## Related Documents

| Document | Path |
|----------|------|
| Components Guide | `src/components/README.md` |
| Map Page | `src/app/(site)/map/` |
| Location Page | `src/app/(site)/location/` |

---

*Last updated: 2025-12-17*

# Constants (src/constants) AI Guide

> **Summary:** Application-wide constant values for Korea NEWS platform.

---

## Constant Files

| File | Description |
|------|-------------|
| `categories.ts` | Category definitions and hierarchy |
| `regions.ts` | 27 regions data (names, codes, slugs) |

---

## categories.ts

Contains category definitions for news classification.

**Main Categories:**
- Politics/Economy
- Society
- Culture/Life
- Education
- Opinion
- Jeonnam (regional)

---

## regions.ts

Contains 27 region data for Jeonnam/Gwangju area.

**Regions:**
- **Metro (2):** Gwangju, Jeonnam Province
- **Cities (5):** Mokpo, Yeosu, Suncheon, Naju, Gwangyang
- **Counties (17):** Damyang, Gokseong, Gurye, Goheung, Boseong, Hwasun, Jangheung, Gangjin, Haenam, Yeongam, Muan, Hampyeong, Yeonggwang, Jangseong, Wando, Jindo, Shinan
- **Education (2):** Gwangju Education, Jeonnam Education

---

## FAQ

| Question | Answer |
|----------|--------|
| "Category list?" | `categories.ts` |
| "Region data (27 regions)?" | `regions.ts` |
| "Region slugs?" | `regions.ts` - each region has `slug` field |
| "카테고리 목록?" | `categories.ts` |
| "카테고리 상수?" | `categories.ts` |
| "27개 지역 데이터?" | `regions.ts` |
| "지역 코드? 슬러그?" | `regions.ts` - slug 필드 |
| "전남/광주 지역 정보?" | `regions.ts` |
| "상수 정의 어디?" | 이 폴더 (`src/constants/`) |
| "시군 데이터?" | `regions.ts` - 시5, 군17, 광역2, 교육청2 |

---

## Related Files

| Related | Path |
|---------|------|
| Category Constants (lib) | `src/lib/category-constants.ts` |
| Regions (lib) | `src/lib/regions.ts` |

**Note:** Some constants are duplicated in `src/lib/` for historical reasons.

---

## Related Documents

| Document | Path |
|----------|------|
| Frontend Guide | `info/frontend.md` |
| Scraper Guide | `scrapers/README.md` |

---

*Last updated: 2025-12-17*

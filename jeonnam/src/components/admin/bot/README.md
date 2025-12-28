# Bot Components (src/components/admin/bot) AI Guide

> **Summary:** Bot/scraper monitoring components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `AlertBanner.tsx` | Alert/warning banner | Bot status alerts |
| `CollectionChart.tsx` | Collection statistics chart | Bot dashboard |
| `RegionHeatmap.tsx` | Region activity heatmap | Bot dashboard |
| `index.ts` | Barrel export file | Component exports |

---

## AlertBanner

Displays alerts for bot status.

**Features:**
- Error alerts
- Warning messages
- Success notifications

---

## CollectionChart

Shows scraping collection statistics.

**Features:**
- Daily/weekly/monthly views
- Region breakdown
- Trend visualization

---

## RegionHeatmap

Visualizes scraping activity by region.

**Features:**
- 27 region heatmap
- Activity intensity
- Click to filter

---

## FAQ

| Question | Answer |
|----------|--------|
| "Bot alert banner?" | `AlertBanner.tsx` |
| "Collection chart?" | `CollectionChart.tsx` |
| "Region heatmap?" | `RegionHeatmap.tsx` |
| "봇 알림 배너?" | `AlertBanner.tsx` - 에러, 경고, 성공 표시 |
| "스크래퍼 알림?" | `AlertBanner.tsx` |
| "수집 통계 차트?" | `CollectionChart.tsx` - 일/주/월 뷰 |
| "지역별 수집 현황?" | `CollectionChart.tsx`, `RegionHeatmap.tsx` |
| "지역 히트맵?" | `RegionHeatmap.tsx` - 27개 지역 활동량 |
| "봇 대시보드 UI?" | 이 폴더 - `AlertBanner`, `CollectionChart`, `RegionHeatmap` |

---

## Related Documents

| Document | Path |
|----------|------|
| Admin Components | `src/components/admin/README.md` |
| Bot Pages | `src/app/admin/bot/` |
| Bot API | `src/app/api/bot/` |
| Scheduler | `src/lib/scheduler.ts` |

---

*Last updated: 2025-12-17*

# Korea NEWS HQ Homepage Project

> **Domain:** koreanewskorea.com
> **Folder:** koreanewshq/
> **Status:** ACTIVE (2025-12-29)

---

## Project Direction (Confirmed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  본사 사이트 (koreanewskorea.com) 방향                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 템플릿: jeonnam/ 구조 그대로 재사용                                     │
│     - Header, Footer, Layout 동일                                          │
│     - 카테고리 뉴스 레이아웃 동일                                          │
│                                                                             │
│  2. 뉴스 범위: 대한민국 전체                                               │
│     - 정책브리핑 (korea.kr)                                                │
│     - 각 부처 보도자료                                                     │
│     - 정부/공공기관 보도자료                                               │
│                                                                             │
│  3. /policy/ 섹션 (신뢰 콘텐츠)                                            │
│     - KTV 영상 임베드 (YouTube iframe)                                     │
│     - 정책브리핑 뉴스                                                      │
│     - 공공누리 출처 표시 필수                                              │
│                                                                             │
│  4. /tour/ 섹션 (관광 안내)                                                │
│     - 한국관광공사 TourAPI 연동                                            │
│     - 전국 관광지, 축제, 맛집                                              │
│     - 지역별 필터링                                                        │
│                                                                             │
│  차별점:                                                                   │
│     지역 사이트 (jeonnam) = 27개 지자체 보도자료                           │
│     본사 (koreanewshq)   = 정부/부처 보도자료 (전국 단위)                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Site Structure

| Section | URL | Content | Source |
|---------|-----|---------|--------|
| **Main** | `/` | 정부 뉴스 메인 | Government PR |
| **Policy** | `/policy/` | KTV, 정책브리핑 | KTV YouTube, korea.kr |
| **Tour** | `/tour/` | 전국 관광 안내 | Korea Tourism API |
| **Category** | `/category/*` | 정책별 뉴스 | Ministry releases |

---

## Comparison: Regional vs HQ

| Item | Regional (jeonnam) | HQ (koreanewshq) |
|------|-------------------|------------------|
| Domain | {region}.koreanewskorea.com | koreanewskorea.com |
| News Scope | Jeonnam/Gwangju 27 agencies | All Korea (Government) |
| Tour Scope | Jeonnam/Gwangju area | Nationwide |
| Trust Content | - | /policy/ (KTV, Briefing) |
| Target Users | Local residents | All citizens + overseas |

---

## Infrastructure (SEPARATE)

| Item | Value |
|------|-------|
| **Folder** | `koreanewshq/` |
| **Domain** | koreanewskorea.com |
| **Account Email** | news@koreanewskorea.com |
| **Supabase Project** | aubjcabybfuhyrcaniyf |
| **Supabase URL** | https://aubjcabybfuhyrcaniyf.supabase.co |
| **Vercel Account** | koreanewskoreas-projects (Hobby) |
| **GitHub** | koreanewskorea/main |

---

## Work Progress

| # | Task | Status | Notes |
|:-:|------|:------:|-------|
| 1 | Project direction documented | DONE | This file |
| 2 | Base structure (globals.css, Header, Footer, Layout) | DONE | jeonnam-style adapted |
| 3 | Main page (/) | DONE | With Policy/Tour previews |
| 4 | /policy/ page | DONE | KTV cards, policy cards, KOGL credit |
| 5 | /tour/ page | DONE | Region filter, tour grid, badges |
| 6 | /news/ page | DONE | Category tabs, news grid |
| 7 | /category/ page | DONE | Category overview |
| 8 | Build test | DONE | All pages compiled |
| 9 | TourAPI integration | PENDING | Connect to Korea Tourism API |
| 10 | Supabase DB setup | PENDING | posts, categories tables |
| 11 | Vercel deploy | PENDING | Connect to koreanewskoreas-projects |

---

## Key Components to Create

### /policy/ Section
- `KTVEmbed.tsx` - YouTube iframe for KTV videos
- `PolicyCard.tsx` - Policy news card component
- `SourceCredit.tsx` - KOGL attribution display

### /tour/ Section
- `TourSpotCard.tsx` - Tourist spot card
- `RegionFilter.tsx` - Region selection
- `TourAPI.ts` - Korea Tourism API integration

---

## Related Documents

- [KTV Trust Strategy](../koreanewskorea/plan/KTV_TRUST_STRATEGY.md) - Trust building strategy
- [HQ Homepage Spec](plan/hq-homepage-spec.md) - Full specification

---

*Created: 2025-12-29*
*Last Updated: 2025-12-29*

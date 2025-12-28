# Home Components (src/components/home) AI Guide

> **Summary:** Homepage components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `HomeHero.tsx` | Main hero section | Homepage top |
| `HeroSlider.tsx` | Hero image slider | Homepage |
| `HeroFeature.tsx` | Featured article in hero | Homepage |
| `MostViewed.tsx` | Most viewed articles widget | Sidebar |
| `NoticeBar.tsx` | Notice/announcement bar | Homepage |
| `OpinionCard.tsx` | Opinion article card | Homepage |
| `TabbedBoard.tsx` | Tabbed content board | Homepage |
| `VideoWidget.tsx` | Video content widget | Homepage |

---

## Hero Section

The hero section consists of:
1. **HomeHero** - Container for hero area
2. **HeroSlider** - Image carousel
3. **HeroFeature** - Featured article display

---

## FAQ

| Question | Answer |
|----------|--------|
| "메인 페이지 상단?" | `HeroSlider.tsx` - 지역별 뉴스 자동 전환 슬라이더 |
| "메인 배너?" | `HeroSlider.tsx` |
| "지역 바꾸면서 뉴스 보여주는 거?" | `HeroSlider.tsx` - 시/군 자동 전환 |
| "시군 선택 슬라이더?" | `HeroSlider.tsx` |
| "메인 페이지 큰 이미지?" | `HeroSlider.tsx` |
| "Hero slider?" | `HeroSlider.tsx` |
| "인기 기사? 많이 본 뉴스?" | `MostViewed.tsx` |
| "Most viewed widget?" | `MostViewed.tsx` |
| "공지사항 바?" | `NoticeBar.tsx` |
| "Notice bar?" | `NoticeBar.tsx` |
| "동영상 위젯?" | `VideoWidget.tsx` |
| "Video widget?" | `VideoWidget.tsx` |
| "탭으로 구분된 게시판?" | `TabbedBoard.tsx` |
| "오피니언 카드?" | `OpinionCard.tsx` |
| "히어로 영역 전체?" | `HomeHero.tsx` - 컨테이너 |
| "추천 기사 표시?" | `HeroFeature.tsx` |

---

## Related Documents

| Document | Path |
|----------|------|
| Components Guide | `src/components/README.md` |
| Homepage | `src/app/(site)/page.tsx` |

---

*Last updated: 2025-12-17*

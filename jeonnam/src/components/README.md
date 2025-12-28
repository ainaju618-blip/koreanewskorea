# Components (src/components) AI Guide

> **Summary:** React components library for Korea NEWS platform.

---

## Folder Structure

| Folder | Description |
|--------|-------------|
| `admin/` | Admin dashboard components |
| `author/` | Author page components |
| `blogadmin/` | Blog admin components |
| `category/` | Category page components |
| `home/` | Homepage components |
| `landing/` | Landing page components |
| `maps/` | Map components (Kakao Maps) |
| `news/` | News article components |
| `reporter/` | Reporter portal components |
| `ui/` | Reusable UI components (buttons, modals, etc.) |

---

## Root Level Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `Header.tsx` | Main site header with navigation | All pages |
| `Footer.tsx` | Site footer | All pages |
| `Sidebar.tsx` | Sidebar navigation | Admin pages |
| `NewsCard.tsx` | News article card | News lists |
| `NewsGrid.tsx` | Grid layout for news | Homepage, category |
| `NewsTicker.tsx` | Breaking news ticker | Header |
| `MainSlider.tsx` | Hero image slider | Homepage |
| `ArticleEditor.tsx` | Rich text editor | Admin, Reporter |
| `ConfirmModal.tsx` | Confirmation dialog | Throughout app |
| `CookieConsentBanner.tsx` | GDPR cookie consent | All pages |
| `PWAInstallPrompt.tsx` | PWA install prompt | Mobile |
| `Providers.tsx` | React context providers | App root |

---

## FAQ

| Question | Answer |
|----------|--------|
| "헤더 어디 있어? 상단 메뉴?" | `Header.tsx` |
| "푸터? 하단?" | `Footer.tsx` |
| "사이드바? 왼쪽 메뉴?" | `Sidebar.tsx` |
| "뉴스 카드? 기사 목록 아이템?" | `NewsCard.tsx` |
| "뉴스 그리드? 기사 목록 레이아웃?" | `NewsGrid.tsx` |
| "속보 티커? 흐르는 뉴스?" | `NewsTicker.tsx` |
| "기사 작성 에디터?" | `ArticleEditor.tsx` |
| "쿠키 동의 배너?" | `CookieConsentBanner.tsx` |
| "PWA 설치 안내?" | `PWAInstallPrompt.tsx` |
| "메인 페이지 상단? 히어로?" | `home/` 폴더 → `HeroSlider.tsx` |
| "UI 컴포넌트? 버튼, 모달?" | `ui/` 폴더 |
| "관리자 컴포넌트?" | `admin/` 폴더 |
| "기자 포털 컴포넌트?" | `reporter/` 폴더 |
| "블로그 관리 컴포넌트?" | `blogadmin/` 폴더 |
| "지도 컴포넌트?" | `maps/` 폴더 |
| "카테고리 페이지 컴포넌트?" | `category/` 폴더 |
| "작가 페이지 컴포넌트?" | `author/` 폴더 |

---

## Component Naming Convention

- **PascalCase** for component files: `NewsCard.tsx`
- **Subfolder** for related components: `admin/`, `reporter/`
- **Index file** for barrel exports (optional)

---

## Related Documents

| Document | Path |
|----------|------|
| UI Components | `src/components/ui/README.md` |
| Admin Components | `src/components/admin/shared/README.md` |
| Design System | `info/design-system.md` |
| Frontend Guide | `info/frontend.md` |

---

*Last updated: 2025-12-17*

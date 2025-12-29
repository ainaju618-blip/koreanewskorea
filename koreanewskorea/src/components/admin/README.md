# Admin Components (src/components/admin) AI Guide

> **Summary:** Admin dashboard components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `AdminSidebar.tsx` | Admin navigation sidebar | All admin pages |
| `AdminAuthGuard.tsx` | Authentication guard | Admin route protection |
| `NewsEditor.tsx` | News article editor | Article create/edit |
| `FloatingAdminPanel.tsx` | Floating admin controls | Quick actions |

---

## Subfolders

| Folder | Description |
|--------|-------------|
| `bot/` | Bot/scraper monitoring components |
| `shared/` | Shared admin utilities (has its own README) |

---

## AdminSidebar

Main navigation for admin area.

**Sections:**
- Dashboard
- News Management
- User Management
- Bot/Scraper Control
- Settings

---

## AdminAuthGuard

Protects admin routes from unauthorized access.

**Features:**
- Role-based access
- Redirect to login
- Permission checking

---

## FAQ

| Question | Answer |
|----------|--------|
| "Admin sidebar?" | `AdminSidebar.tsx` |
| "Auth guard?" | `AdminAuthGuard.tsx` |
| "News editor?" | `NewsEditor.tsx` |
| "Bot monitoring?" | `bot/` folder |
| "Shared utilities?" | `shared/` folder (see shared/README.md) |
| "관리자 사이드바?" | `AdminSidebar.tsx` |
| "어드민 메뉴?" | `AdminSidebar.tsx` |
| "관리자 인증?" | `AdminAuthGuard.tsx` - 권한 체크, 로그인 리다이렉트 |
| "뉴스 에디터?" | `NewsEditor.tsx` |
| "기사 작성 에디터?" | `NewsEditor.tsx` |
| "봇 모니터링 컴포넌트?" | `bot/` 폴더 |
| "스크래퍼 대시보드 UI?" | `bot/` 폴더 |
| "공통 관리자 컴포넌트?" | `shared/` 폴더 (README.md 참조) |
| "플로팅 패널?" | `FloatingAdminPanel.tsx` |

---

## Related Documents

| Document | Path |
|----------|------|
| Components Guide | `src/components/README.md` |
| Shared Components | `src/components/admin/shared/README.md` |
| Admin Pages | `src/app/admin/` |

---

*Last updated: 2025-12-17*

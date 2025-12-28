# Frontend (src/app) AI Guide

> **Summary:** Next.js 16 App Router pages for Korea NEWS platform - news site, admin, blog, reporter portal, and more.

---

## Main Sections

| Section | Path | URL | Description |
|---------|------|-----|-------------|
| **Main Site** | `(site)/` | `/` | Public news pages |
| **Admin** | `admin/` | `/admin` | Admin dashboard |
| **Reporter** | `reporter/` | `/reporter` | Reporter portal |
| **Blog** | `blog/` | `/blog` | Blog system |
| **Blog Admin** | `blogadmin/` | `/blogadmin` | Blog management |
| **CosmicPulse** | `cosmos/` | `/cosmos` | Space/Science news |
| **Idea** | `idea/` | `/idea` | AI news collection planning |

---

## Key Pages by Section

### Main Site `(site)/`
| Page | Path | Description |
|------|------|-------------|
| Home | `page.tsx` | Main news page |
| News Detail | `news/[id]/page.tsx` | Article detail |
| Category | `category/[slug]/page.tsx` | Category listing |
| Regional | `category/jeonnam/[region]/page.tsx` | Regional news |
| About/Contact | `about/`, `contact/` | Info pages |

### Admin `admin/`
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `page.tsx` | Admin home |
| News Manage | `news/page.tsx` | Article management |
| **Bot Run** | `bot/run/page.tsx` | **Scraper control & scheduler** |
| Bot Logs | `bot/logs/page.tsx` | Scraper logs |
| Claude Hub | `claude-hub/page.tsx` | AI knowledge management |
| Users | `users/*/page.tsx` | User management |
| Settings | `settings/*/page.tsx` | System settings |

### Reporter `reporter/`
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `page.tsx` | Reporter home |
| Write | `write/page.tsx` | Article writing |
| My Articles | `articles/page.tsx` | Article list |
| Profile | `profile/page.tsx` | Profile settings |

---

## Components (`src/components/`)

| Component | Role |
|-----------|------|
| `Header.tsx` | Site header with navigation |
| `Footer.tsx` | Site footer |
| `Sidebar.tsx` | Sidebar navigation |
| `NewsCard.tsx` | News article card |
| `NewsGrid.tsx` | News grid layout |
| `MainSlider.tsx` | Hero slider |
| `NewsTicker.tsx` | Breaking news ticker |
| `ArticleEditor.tsx` | Rich text editor |
| `ConfirmModal.tsx` | Confirmation dialog |

---

## FAQ

| Question | Answer |
|----------|--------|
| "Where is main page?" | `src/app/(site)/page.tsx` |
| "Where is admin?" | `src/app/admin/page.tsx` |
| "Where is bot/scraper control?" | `src/app/admin/bot/run/page.tsx` |
| "Where is reporter portal?" | `src/app/reporter/page.tsx` |
| "Where is CosmicPulse?" | `src/app/cosmos/page.tsx` |
| "Where is Claude Hub?" | `src/app/admin/claude-hub/page.tsx` |
| "Where are shared components?" | `src/components/` |
| "Where is layout?" | `src/app/layout.tsx` |
| "Where is global CSS?" | `src/app/globals.css` |
| "메인 페이지 어디?" | `(site)/page.tsx` |
| "홈페이지 코드?" | `(site)/page.tsx` |
| "관리자 페이지?" | `admin/page.tsx` |
| "어드민 대시보드?" | `admin/page.tsx` |
| "봇 실행 페이지? 스크래퍼 컨트롤?" | `admin/bot/run/page.tsx` |
| "기자 포털?" | `reporter/page.tsx` |
| "기자가 기사 쓰는 곳?" | `reporter/write/page.tsx` |
| "우주 뉴스? 코스믹펄스?" | `cosmos/page.tsx` |
| "AI 지식 관리?" | `admin/claude-hub/page.tsx` |
| "클로드 허브?" | `admin/claude-hub/page.tsx` |
| "전체 레이아웃?" | `layout.tsx` |
| "글로벌 스타일? CSS?" | `globals.css` |
| "뉴스 상세 페이지?" | `(site)/news/[id]/page.tsx` |
| "카테고리 페이지?" | `(site)/category/[slug]/page.tsx` |
| "지역별 뉴스?" | `(site)/category/jeonnam/[region]/page.tsx` |
| "블로그 페이지?" | `blog/page.tsx` |
| "블로그 관리?" | `blogadmin/page.tsx` |
| "아이디어 시스템?" | `idea/page.tsx` |
| "설정 페이지?" | `admin/settings/*/page.tsx` |
| "사용자 관리?" | `admin/users/*/page.tsx` |

---

## Related Documents

| Document | Path |
|----------|------|
| Full Source Guide | `src/README.md` |
| Frontend Guide | `info/frontend.md` |
| Design System | `info/design-system.md` |
| Admin Components | `src/components/admin/shared/README.md` |

---

## Route Groups

- `(site)` - Public pages (no prefix in URL)
- `admin` - Admin pages (`/admin/*`)
- `api` - API routes (`/api/*`) - see `src/app/api/README.md`

---

*Last updated: 2025-12-17*

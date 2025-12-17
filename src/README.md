# src/ - Korea NEWS 메인 애플리케이션

> **기술 스택**: Next.js 16 + React 19 + Supabase + TypeScript

## 폴더 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (site)/            # 공개 사이트 (홈, 카테고리, 기사, 회사소개)
│   ├── admin/             # 관리자 페이지 (35개)
│   ├── reporter/          # 기자 포털 (11개)
│   ├── author/            # 기자 프로필 페이지
│   ├── blog/              # 블로그 시스템
│   ├── blogadmin/         # 블로그 관리
│   ├── cosmos/            # CosmicPulse (우주 뉴스)
│   ├── idea/              # AI 아이디어 시스템 (공개)
│   └── api/               # API 엔드포인트 (89개)
├── components/            # React 컴포넌트 (31개)
├── lib/                   # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
└── db/                    # 데이터베이스 스키마
```

---

## 라우팅 구조

### 공개 페이지 `(site)/`

#### 메인
| 경로 | 용도 |
|------|------|
| `/` | 홈페이지 |
| `/news/[id]` | 기사 상세 |
| `/news/network` | 뉴스 네트워크 |
| `/category/[slug]` | 카테고리 페이지 |
| `/category/[slug]/[subslug]` | 하위 카테고리 |
| `/category/jeonnam/[region]` | 전남 시군별 뉴스 |
| `/category/jeonnam-region` | 전남 지역 전체 |
| `/category/ai` | AI 뉴스 |
| `/category/education` | 교육 뉴스 |
| `/category/opinion` | 오피니언 |
| `/category/politics-economy` | 정치/경제 |
| `/author/[slug]` | 기자 프로필 |
| `/map` | 지역 지도 |

#### 회사 소개
| 경로 | 용도 |
|------|------|
| `/about` | 회사 소개 |
| `/organization` | 조직도 |
| `/history` | 연혁 |
| `/location` | 오시는 길 |
| `/contact` | 연락처 |
| `/ad-inquiry` | 광고 문의 |
| `/report` | 제보하기 |
| `/notice` | 공지사항 |
| `/subscribe` | 구독 신청 |

#### 정책/약관
| 경로 | 용도 |
|------|------|
| `/privacy` | 개인정보처리방침 |
| `/terms` | 이용약관 |
| `/ethical-code` | 윤리강령 |
| `/youth-policy` | 청소년보호정책 |

---

### Admin Pages `/admin/`

#### Dashboard & Main
| Path | Page | Description |
|------|------|-------------|
| `/admin` | Dashboard | Main dashboard with statistics, recent bot activity, system status, and service usage |
| `/admin/usage` | Service Usage | Service usage monitoring (Cloudinary, Supabase, Vercel, GitHub) |
| `/admin/design-preview` | Design Preview | Design system preview and testing |

#### Claude Hub (AI Knowledge System)
| Path | Page | Description |
|------|------|-------------|
| `/admin/claude-hub` | **Claude Hub** | AI 지식 관리 시스템 - 프로젝트별 노하우, 에러 해결법, 워크플로우 저장 |

**Claude Hub 탭 구성:**
| Tab | 기능 |
|-----|------|
| Dashboard | 프로젝트/지식 통계, 최근 세션 목록 |
| Projects | 프로젝트 CRUD (code, name, stack, description) |
| Knowledge | 지식 CRUD, 검색, 필터링 (scope × topic 분류) |
| Sessions | AI 세션 로그 조회, 세션별 상세 내용 |

**Knowledge 분류 체계:**
| Scope | 설명 |
|-------|------|
| Global | 전역 지식 (모든 프로젝트 공통) |
| Stack | 기술 스택별 지식 (Next.js, Python 등) |
| Project | 특정 프로젝트 전용 지식 |

| Topic | 설명 |
|-------|------|
| Prompting | AI 프롬프트 작성법 |
| Development | 개발 패턴, 코드 스니펫 |
| Troubleshooting | 에러 해결, 디버깅 |
| Workflow | 작업 흐름, 프로세스 |
| Reference | 참조 문서, 링크 |
| General | 기타 일반 지식 |

#### News Management
| Path | Page | Description |
|------|------|-------------|
| `/admin/news` | News List | Article list and management with status filtering |
| `/admin/news/write` | Write Article | Create new article with TipTap editor |
| `/admin/news/edit/[id]` | Edit Article | Edit existing article |
| `/admin/my-articles` | My Articles | User's own articles management |
| `/admin/drafts` | Article Drafts | Article drafts with HTML editor |

#### Bot Management
| Path | Page | Description |
|------|------|-------------|
| `/admin/bot` | Bot Overview | Bot management overview |
| `/admin/bot/run` | Manual Scraper | **Manual scraper execution by region** |
| `/admin/bot/schedule` | Scheduler Settings | Cron schedule configuration |
| `/admin/bot/logs` | Bot Logs | Scraper execution logs and history |
| `/admin/bot/logs/[id]` | Log Detail | Detailed log view for specific execution |
| `/admin/bot/sources` | Bot Sources | News source configuration for bot |
| `/admin/bot/ai-news` | AI News Bot | AI-powered news collection bot |

#### AI News Idea System
| Path | Page | Description |
|------|------|-------------|
| `/admin/idea` | Idea Overview | AI-generated news idea system overview |
| `/admin/idea/raw` | Raw Ideas | Raw AI-generated ideas before processing |
| `/admin/idea/processed` | Processed Ideas | Processed and refined AI ideas |
| `/admin/idea/sources` | Idea Sources | Configure AI news idea sources |
| `/admin/ai-news` | AI News List | AI-generated news articles list |

#### User Management
| Path | Page | Description |
|------|------|-------------|
| `/admin/users/members` | Members | Regular user management |
| `/admin/users/reporters` | Reporters | Reporter/journalist management |
| `/admin/users/roles` | Role Management | User role and permission management |

#### Source & Agency
| Path | Page | Description |
|------|------|-------------|
| `/admin/sources` | News Sources | News source directory with scraper status |
| `/admin/agencies` | Agency Directory | Government agency contact information |

#### System Settings
| Path | Page | Description |
|------|------|-------------|
| `/admin/settings` | Settings Overview | System settings overview |
| `/admin/settings/general` | General Settings | Site name, description, basic configuration |
| `/admin/settings/api` | API Settings | API key and external service configuration |
| `/admin/settings/categories` | Category Management | Article category configuration |
| `/admin/settings/menus` | Menu Management | Site navigation menu configuration |
| `/admin/settings/layouts` | Layout Settings | Page layout and component settings |
| `/admin/settings/hero-slider` | Hero Slider | Homepage hero slider management |
| `/admin/settings/performance` | Performance | Performance monitoring and optimization |

---

### Reporter Portal `/reporter/`

> **기자 전용 포털** - 기사 작성, 관리, 프로필, 보도자료 접수

| Path | Page | Description |
|------|------|-------------|
| `/reporter` | Dashboard | 기자 대시보드 (통계, 최근 기사) |
| `/reporter/login` | Login | 기자 로그인 |
| `/reporter/write` | Write Article | 기사 작성 (TipTap 에디터) |
| `/reporter/articles` | My Articles | 내 기사 목록 및 관리 |
| `/reporter/edit/[id]` | Edit Article | 기사 수정 |
| `/reporter/drafts` | Drafts | 임시저장 목록 |
| `/reporter/profile` | Profile | 프로필 관리 (사진, 소개, SNS) |
| `/reporter/notifications` | Notifications | 알림 센터 |
| `/reporter/press-releases` | Press Releases | 보도자료 접수 목록 |

**기자 포털 권한:**
- 기자 계정으로만 접근 가능
- 자신의 기사만 수정/삭제 가능
- 관리자 승인 전까지 '대기' 상태

---

### Blog System `/blog/`

> **CosmicPulse 블로그** - AI 생성 우주/과학 콘텐츠

| Path | Page | Description |
|------|------|-------------|
| `/blog` | Blog Home | 블로그 메인 (최신 포스트) |
| `/blog/[slug]` | Blog Post | 블로그 글 상세 |

---

### Blog Admin `/blogadmin/`

> **블로그 관리자** - 포스트 관리, AI 생성

| Path | Page | Description |
|------|------|-------------|
| `/blogadmin` | Dashboard | 블로그 대시보드 |
| `/blogadmin/posts` | Posts List | 포스트 목록 |
| `/blogadmin/posts/new` | New Post | 새 포스트 작성 |
| `/blogadmin/ai-generator` | AI Generator | AI 포스트 자동 생성 |

---

### CosmicPulse `/cosmos/`

> **우주/과학 뉴스 섹션** - NASA, SpaceX 등 우주 관련 콘텐츠

| Path | Page | Description |
|------|------|-------------|
| `/cosmos` | Cosmos Home | CosmicPulse 메인 |
| `/cosmos/[category]` | Category | 카테고리별 우주 뉴스 |

---

### Idea System `/idea/`

> **AI 뉴스 아이디어 시스템** (Public View) - Admin 외 공개 접근 가능

| Path | Page | Description |
|------|------|-------------|
| `/idea` | Idea Home | 아이디어 개요 |
| `/idea/raw` | Raw Ideas | 원본 아이디어 목록 |
| `/idea/processed` | Processed | 가공된 아이디어 |
| `/idea/sources` | Sources | 소스 목록 |
| `/idea/settings` | Settings | 설정 |

---

## 외부 시스템 연동

### Database - Supabase
| 항목 | 값 |
|------|-----|
| Provider | Supabase (PostgreSQL) |
| 연결 | `@supabase/ssr` (SSR Client) |
| 주요 테이블 | posts, users, categories, reporters, news_sources, claude_* |
| 인증 | Supabase Auth |

### Image Storage - Cloudinary
| 항목 | 값 |
|------|-----|
| Provider | Cloudinary |
| 용도 | 기사 이미지, 기자 프로필 사진, 썸네일 |
| 최적화 | 자동 WebP 변환, 리사이징 |
| API | `/api/upload`, `/api/upload/image`, `/api/upload/from-url` |

### Deployment - Vercel
| 항목 | 값 |
|------|-----|
| Project | `koreanewsone` |
| Team | `koreanews-projects` |
| Domain | `www.koreanewsone.com` |
| Git 연동 | `korea-news/koreanewsone` |

### AI Services - OpenAI
| 항목 | 값 |
|------|-----|
| Provider | OpenAI |
| 용도 | 기사 요약, 번역, AI 뉴스 생성 |
| API | `/api/ai/translate`, `/api/ai/rewrite` |

### Python Scrapers
| 항목 | 값 |
|------|-----|
| 위치 | `/scrapers/` |
| 기술 | Python + Playwright |
| 대상 | 27개 지자체 보도자료 |
| 실행 | `/api/bot/run` → Python subprocess |
| 가이드 | `scrapers/SCRAPER_GUIDE.md` |

### Version Control - GitHub
| 항목 | 값 |
|------|-----|
| Repository | `korea-news/koreanewsone` |
| Branch | `master` (main) |
| Workflow | Push → Vercel Auto Deploy |

---

## API 엔드포인트 (89개)

### Authentication `/api/auth/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### Admin `/api/admin/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/auth` | 관리자 인증 확인 |
| GET | `/api/admin/news` | 관리자 뉴스 목록 |
| POST | `/api/admin/redistribute` | 기사 재분배 |
| GET | `/api/admin/usage` | 서비스 사용량 |
| GET/POST | `/api/admin/performance` | 성능 모니터링 |
| GET | `/api/admin/performance/[id]` | 성능 상세 |
| POST | `/api/admin/pagespeed-check` | PageSpeed 체크 |

### Posts `/api/posts/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/posts` | 기사 목록/생성 |
| GET/PUT/DELETE | `/api/posts/[id]` | 기사 상세/수정/삭제 |
| POST | `/api/posts/[id]/view` | 조회수 증가 |
| DELETE | `/api/posts/bulk-delete` | 일괄 삭제 |
| GET | `/api/posts/popular` | 인기 기사 |
| GET | `/api/posts/stats/by-region` | 지역별 통계 |

### Bot/Scraper `/api/bot/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bot/run` | 스크래퍼 실행 |
| POST | `/api/bot/stop` | 봇 중지 |
| POST | `/api/bot/reset` | 봇 리셋 |
| POST | `/api/bot/ingest` | 수집 데이터 저장 |
| GET | `/api/bot/status` | 봇 상태 |
| GET | `/api/bot/health` | 헬스 체크 |
| GET | `/api/bot/stats` | 봇 통계 |
| GET | `/api/bot/logs` | 실행 로그 목록 |
| GET | `/api/bot/logs/[id]` | 로그 상세 |
| GET/POST | `/api/bot/sources` | 봇 소스 목록/생성 |
| GET/PUT/DELETE | `/api/bot/sources/[id]` | 소스 상세/수정/삭제 |
| GET/POST | `/api/bot/schedule` | 스케줄 조회/설정 |
| POST | `/api/bot/cron` | Cron 트리거 |
| POST | `/api/bot/test-schedule` | 스케줄 테스트 |
| GET | `/api/bot/scraper-status` | 스크래퍼 상태 |
| GET/POST | `/api/bot/ai-news` | AI 뉴스 수집 |

### Reporter Portal `/api/reporter/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reporter/reporters` | 기자 목록 |
| POST | `/api/reporter/write` | 기사 작성 |
| GET | `/api/reporter/articles` | 내 기사 목록 |
| GET/PUT/DELETE | `/api/reporter/articles/[id]` | 기사 상세/수정/삭제 |
| GET | `/api/reporter/articles/[id]/history` | 기사 수정 이력 |
| GET | `/api/reporter/stats` | 기자 통계 |
| GET | `/api/reporter/notifications` | 알림 목록 |
| GET | `/api/reporter/press-releases` | 보도자료 목록 |
| GET | `/api/reporter/activity` | 활동 내역 |

### Users `/api/users/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/users` | 사용자 목록/생성 |
| GET/PUT/DELETE | `/api/users/[id]` | 사용자 상세/수정/삭제 |
| GET/POST | `/api/users/reporters` | 기자 사용자 목록/생성 |
| GET/PUT/DELETE | `/api/users/reporters/[id]` | 기자 상세/수정/삭제 |

### Author (Public) `/api/author/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/author/[slug]` | 기자 프로필 (공개) |
| POST | `/api/author/subscribe` | 기자 구독 |

### Categories `/api/categories/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/categories` | 카테고리 목록/생성 |
| GET/PUT/DELETE | `/api/categories/[id]` | 카테고리 상세/수정/삭제 |
| POST | `/api/categories/reorder` | 순서 변경 |

### Sources `/api/sources/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/sources` | 뉴스 소스 목록/생성 |
| GET/PUT/DELETE | `/api/sources/[id]` | 소스 상세/수정/삭제 |

### Menus `/api/menus/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/menus` | 메뉴 목록/생성 |
| GET/PUT/DELETE | `/api/menus/[id]` | 메뉴 상세/수정/삭제 |

### Layouts `/api/layouts/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/layouts` | 레이아웃 목록/생성 |
| GET/PUT/DELETE | `/api/layouts/[id]` | 레이아웃 상세/수정/삭제 |

### Claude Hub `/api/claude-hub/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/claude-hub/projects` | 프로젝트 목록/생성 |
| GET/PUT/DELETE | `/api/claude-hub/projects/[code]` | 프로젝트 상세/수정/삭제 |
| GET/POST | `/api/claude-hub/knowledge` | 지식 목록/생성 (검색, 필터링 지원) |
| GET/PUT/DELETE | `/api/claude-hub/knowledge/[id]` | 지식 상세/수정/삭제 |
| POST | `/api/claude-hub/knowledge/[id]/usage` | 사용 횟수 증가 |
| GET | `/api/claude-hub/stats` | 통계 |
| GET/POST | `/api/claude-hub/sessions` | 세션 목록/생성 |
| GET/PUT | `/api/claude-hub/sessions/[id]` | 세션 상세/수정 |

### AI Services `/api/ai/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/translate` | 번역 |
| POST | `/api/ai/rewrite` | 기사 재작성 |

### Upload `/api/upload/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | 파일 업로드 |
| POST | `/api/upload/image` | 이미지 업로드 (Cloudinary) |
| POST | `/api/upload/from-url` | URL에서 이미지 가져오기 |

### Idea System `/api/idea/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/idea/collect` | 아이디어 수집 |

### Blog `/api/blog/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/blog/posts` | 블로그 포스트 목록/생성 |
| GET/PUT/DELETE | `/api/blog/posts/[id]` | 포스트 상세/수정/삭제 |
| GET | `/api/blog/stats` | 블로그 통계 |
| GET | `/api/blog/trending` | 인기 포스트 |
| POST | `/api/blog/generate` | AI 포스트 생성 |

### Personalization `/api/personalization/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/personalization/settings` | 개인화 설정 |
| GET/POST | `/api/personalization/profile` | 사용자 프로필 |
| GET/POST | `/api/personalization/weights` | 가중치 설정 |
| GET/POST | `/api/personalization/boost` | 부스트 목록/생성 |
| DELETE | `/api/personalization/boost/[id]` | 부스트 삭제 |
| POST | `/api/personalization/sync` | 동기화 |

### Other APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agencies` | 기관 목록 |
| GET/POST | `/api/memo` | 메모 목록/생성 |
| GET/PUT/DELETE | `/api/memo/[id]` | 메모 상세/수정/삭제 |
| GET/POST | `/api/site-settings` | 사이트 설정 |
| GET/POST | `/api/hero-slider` | 히어로 슬라이더 |
| GET | `/api/translation-usage` | 번역 사용량 |
| GET | `/api/location/detect` | 위치 감지 |
| GET | `/api/debug-env` | 환경변수 디버그 (개발용) |

## 핵심 라이브러리

| 패키지 | 용도 |
|--------|------|
| `@supabase/ssr` | Supabase SSR 클라이언트 |
| `@tiptap/react` | 기사 에디터 |
| `openai` | AI 기사 가공 |
| `cloudinary` | 이미지 업로드 |
| `node-cron` | 스케줄러 |
| `framer-motion` | 애니메이션 |

## 환경 변수

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 봇 API (필수)
BOT_API_KEY=

# OpenAI (선택)
OPENAI_API_KEY=
```

## 개발 시작

```bash
npm install
npm run dev
# http://localhost:3000
```

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 AI Agent 지침
- [scrapers/SCRAPER_GUIDE.md](../scrapers/SCRAPER_GUIDE.md) - 스크래퍼 개발 가이드
- [scrapers/STATUS.md](../scrapers/STATUS.md) - 스크래퍼 현황

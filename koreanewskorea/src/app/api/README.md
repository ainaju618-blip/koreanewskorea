# API (src/app/api) AI Guide

> **Summary:** Next.js API Routes for Korea NEWS platform - bot, posts, users, admin, reporter, blog, and more.

---

## API Categories

| Category | Path | Description |
|----------|------|-------------|
| **Bot/Scraper** | `bot/` | Scraper control, logs, scheduling |
| **Posts** | `posts/` | Article CRUD, stats |
| **Users** | `users/` | User management |
| **Auth** | `auth/` | Login, logout, session |
| **Admin** | `admin/` | Admin-specific APIs |
| **Reporter** | `reporter/` | Reporter portal APIs |
| **Blog** | `blog/` | Blog system APIs |
| **Claude Hub** | `claude-hub/` | AI knowledge management |
| **AI** | `ai/` | Translation, rewriting |
| **Upload** | `upload/` | Image/file upload |

---

## Key Endpoints by Category

### Bot/Scraper (`bot/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bot/run` | POST | Run scraper manually |
| `/api/bot/schedule` | GET/POST | Get/Set scheduler config |
| `/api/bot/ingest` | POST | **Main entry: Scraper submits articles here** |
| `/api/bot/logs` | GET | Get scraper logs |
| `/api/bot/logs/[id]` | GET/PATCH | Single log detail/update |
| `/api/bot/status` | GET | Scraper status |
| `/api/bot/stop` | POST | Stop running scraper |
| `/api/bot/cron` | GET | Cron trigger endpoint |
| `/api/bot/ai-news` | GET/POST | AI news collection |

### Posts (`posts/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts` | GET/POST | List/Create articles |
| `/api/posts/[id]` | GET/PATCH/DELETE | Single article CRUD |
| `/api/posts/[id]/view` | POST | Increment view count |
| `/api/posts/popular` | GET | Popular articles |
| `/api/posts/bulk-delete` | POST | Bulk delete |
| `/api/posts/stats/by-region` | GET | Stats by region |

### Auth (`auth/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Current user info |

### Reporter (`reporter/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reporter/write` | POST | Submit article |
| `/api/reporter/articles` | GET | Reporter's articles |
| `/api/reporter/articles/[id]` | GET/PATCH/DELETE | Single article |
| `/api/reporter/stats` | GET | Reporter statistics |
| `/api/reporter/notifications` | GET | Notifications |
| `/api/reporter/press-releases` | GET | Press releases |

### Claude Hub (`claude-hub/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claude-hub/knowledge` | GET/POST | Knowledge entries |
| `/api/claude-hub/knowledge/[id]` | GET/PATCH/DELETE | Single entry |
| `/api/claude-hub/projects` | GET/POST | Projects |
| `/api/claude-hub/sessions` | GET/POST | AI sessions |
| `/api/claude-hub/stats` | GET | Statistics |

### Upload (`upload/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | General upload |
| `/api/upload/image` | POST | Image upload |
| `/api/upload/from-url` | POST | Upload from URL |

---

## FAQ

| Question | Answer |
|----------|--------|
| "스크래퍼가 기사 저장하는 곳?" | `POST /api/bot/ingest` |
| "봇이 데이터 보내는 API?" | `POST /api/bot/ingest` |
| "스케줄러 설정 API?" | `GET/POST /api/bot/schedule` |
| "수동으로 스크래퍼 실행?" | `POST /api/bot/run` |
| "봇 로그 조회?" | `GET /api/bot/logs` |
| "봇 상태 확인?" | `GET /api/bot/status` |
| "로그인 API?" | `POST /api/auth/login` |
| "로그아웃?" | `POST /api/auth/logout` |
| "현재 사용자 정보?" | `GET /api/auth/me` |
| "기사 CRUD?" | `/api/posts/`, `/api/posts/[id]` |
| "기사 목록 조회?" | `GET /api/posts` |
| "기사 작성?" | `POST /api/posts` |
| "인기 기사?" | `GET /api/posts/popular` |
| "조회수 증가?" | `POST /api/posts/[id]/view` |
| "기자가 기사 제출?" | `POST /api/reporter/write` |
| "기자 기사 목록?" | `GET /api/reporter/articles` |
| "기자 알림?" | `GET /api/reporter/notifications` |
| "보도자료 목록?" | `GET /api/reporter/press-releases` |
| "이미지 업로드?" | `POST /api/upload/image` |
| "URL에서 이미지 가져오기?" | `POST /api/upload/from-url` |
| "AI 번역?" | `/api/ai/translate` |
| "AI 다시 쓰기?" | `/api/ai/rewrite` |
| "Claude Hub 지식?" | `/api/claude-hub/knowledge` |
| "블로그 API?" | `/api/blog/` |
| "카테고리 관리?" | `/api/categories/` |
| "메뉴 관리?" | `/api/menus/` |

---

## Related Documents

| Document | Path |
|----------|------|
| Backend Guide | `info/backend.md` |
| Bot Service Logic | `src/lib/bot-service.ts` |
| Scheduler Logic | `src/lib/scheduler.ts` |
| Database Schema | `info/database.md` |

---

## Common Patterns

### Authentication
Most admin/reporter APIs require authentication via cookie session.

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

*Last updated: 2025-12-17*

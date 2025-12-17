# Database (src/db) AI Guide

> **Summary:** SQL migration scripts and schema definitions for Korea NEWS (Supabase/PostgreSQL).

---

## SQL Files

| File | Description |
|------|-------------|
| `cms_schema_v2.sql` | Main CMS schema (posts, categories, etc.) |
| `users.sql` | User tables schema |
| `permission_system.sql` | Role-based permission system |
| `reporter_portal_v2.sql` | Reporter portal tables |
| `press_releases.sql` | Press releases tables |
| `scraper_sources.sql` | Scraper source configuration |
| `site_settings.sql` | Site settings table |
| `add_*.sql` | Column addition migrations |

---

## Main Tables

| Table | Description |
|-------|-------------|
| `posts` | News articles |
| `categories` | Article categories |
| `users` | User accounts |
| `reporters` | Reporter profiles |
| `bot_logs` | Scraper execution logs |
| `scraper_sources` | Scraper source configs |
| `system_settings` | App settings (scheduler, etc.) |

---

## FAQ

| Question | Answer |
|----------|--------|
| "Where is posts schema?" | `cms_schema_v2.sql` |
| "Where is user schema?" | `users.sql` |
| "Permission system?" | `permission_system.sql` |
| "How to add column?" | Create `add_[column].sql`, run in Supabase |
| "기사 테이블 스키마?" | `cms_schema_v2.sql` - posts 테이블 |
| "사용자 테이블?" | `users.sql` |
| "권한 시스템 SQL?" | `permission_system.sql` |
| "컬럼 추가하려면?" | `add_[컬럼명].sql` 생성 후 Supabase에서 실행 |
| "DB 마이그레이션?" | `.sql` 파일 작성 → Supabase SQL Editor에서 실행 |
| "기자 테이블?" | `reporter_portal_v2.sql` |
| "보도자료 테이블?" | `press_releases.sql` |
| "스크래퍼 소스 설정?" | `scraper_sources.sql` |
| "사이트 설정 테이블?" | `site_settings.sql` |
| "스키마 변경 이력?" | 이 폴더의 `.sql` 파일들 |

---

## Running Migrations

```sql
-- Run in Supabase SQL Editor
-- Copy content from .sql file and execute
```

---

## Related Documents

| Document | Path |
|----------|------|
| Database Guide | `info/database.md` |
| Backend Guide | `info/backend.md` |

---

## Important Notes

1. **Always backup before migrations**
2. **Test in development first**
3. **Document schema changes in `info/database.md`**

---

*Last updated: 2025-12-17*

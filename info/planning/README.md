# Planning (info/planning) AI Guide

> **Summary:** Feature planning and specification documents for Korea NEWS.

---

## Planning Documents

| File | Description |
|------|-------------|
| `permission-system.md` | Role-based permission system design |

---

## permission-system.md

Comprehensive design document for the permission system.

**Contents:**
- Role definitions (Admin, Editor, Reporter, etc.)
- Permission matrix
- API access control
- UI component visibility rules

---

## FAQ

| Question | Answer |
|----------|--------|
| "Permission system design?" | `permission-system.md` |
| "Role definitions?" | `permission-system.md` |
| "권한 시스템 설계?" | `permission-system.md` |
| "역할 정의?" | `permission-system.md` - Admin, Editor, Reporter 등 |
| "기획 문서?" | 이 폴더 (`info/planning/`) |
| "권한 구현 코드?" | `src/lib/permissions.ts` |
| "권한 DB 스키마?" | `src/db/permission_system.sql` |

---

## Related Documents

| Document | Path |
|----------|------|
| Permission Implementation | `src/lib/permissions.ts` |
| Database Schema | `src/db/permission_system.sql` |

---

*Last updated: 2025-12-17*

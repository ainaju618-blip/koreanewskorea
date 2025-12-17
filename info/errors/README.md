# Error Solutions AI Guide

> **Summary:** Error documentation and solutions database for Korea NEWS project.

---

## How to Use This Folder

### When Error Occurs:
1. **Search `_catalog.md`** first - keyword-based index
2. Find matching error file
3. Apply documented solution

### When Solving New Error:
1. Create file in appropriate subfolder
2. Add entry to `_catalog.md`
3. Follow standard format below

---

## Folder Structure

| Folder | Description |
|--------|-------------|
| `backend/` | API, Supabase, server-side errors |
| `frontend/` | React, TypeScript, Next.js errors |
| `deploy/` | Vercel, GitHub Actions errors |
| `scraper/` | Python scraper errors |
| `database/` | DB constraints, migration errors |

---

## Quick Search: `_catalog.md`

**Location:** `info/errors/_catalog.md`

Contains keyword-to-file mapping for fast lookup.

---

## Error Document Format

```markdown
# [Error Title]

> **Category:** [backend/frontend/deploy/scraper/database]
> **First Occurred:** YYYY-MM-DD
> **Resolved By:** [Name/AI]
> **Severity:** [Critical/High/Medium/Low]

## Symptoms
- Symptom 1
- Symptom 2

## Cause
[Root cause explanation]

## Solution
[Step-by-step solution with code]

## Prevention Rules
[How to prevent this error]
```

---

## FAQ

| Question | Answer |
|----------|--------|
| "Seen this error before?" | Search `_catalog.md` with keywords |
| "Where to add new error?" | Create in appropriate subfolder, update `_catalog.md` |
| "Error format?" | See template above |
| "이 에러 본 적 있어?" | `_catalog.md` 키워드 검색 |
| "에러 해결책?" | `_catalog.md`에서 찾아서 해당 파일 읽기 |
| "새 에러 문서 추가?" | 해당 폴더에 생성 → `_catalog.md` 업데이트 |
| "에러 문서 형식?" | 위 템플릿 참조 |
| "배포 에러?" | `deploy/` 폴더 |
| "프론트엔드 에러?" | `frontend/` 폴더 |
| "백엔드 에러?" | `backend/` 폴더 |
| "스크래퍼 에러?" | `scraper/` 폴더 |
| "DB 에러?" | `database/` 폴더 |

---

## Related Documents

| Document | Path |
|----------|------|
| Error Catalog | `info/errors/_catalog.md` |
| Troubleshooting Guide | `info/troubleshooting.md` |

---

*Last updated: 2025-12-17*

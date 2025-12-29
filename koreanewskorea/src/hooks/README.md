# Hooks (src/hooks) AI Guide

> **Summary:** Custom React hooks for Korea NEWS platform.

---

## Available Hooks

| Hook | Description | Usage |
|------|-------------|-------|
| `useBehaviorTracker.ts` | Track user behavior for personalization | News pages |

---

## Subfolders

| Folder | Description |
|--------|-------------|
| `admin/` | Admin-specific hooks (currently empty) |

---

## Hook Naming Convention

- Prefix with `use`: `useBehaviorTracker`, `useAuth`, etc.
- **camelCase** for hook names
- One hook per file

---

## FAQ

| Question | Answer |
|----------|--------|
| "User behavior tracking?" | `useBehaviorTracker.ts` |
| "Admin hooks?" | `admin/` folder (currently empty) |
| "사용자 행동 추적?" | `useBehaviorTracker.ts` |
| "개인화 훅?" | `useBehaviorTracker.ts` - 사용자 행동 기반 추천 |
| "커스텀 훅 어디?" | 이 폴더 (`src/hooks/`) |
| "관리자 전용 훅?" | `admin/` 폴더 |
| "훅 만드는 규칙?" | `use` 접두사, camelCase, 파일당 하나 |

---

## Related Documents

| Document | Path |
|----------|------|
| Frontend Guide | `info/frontend.md` |
| Components | `src/components/README.md` |

---

*Last updated: 2025-12-17*

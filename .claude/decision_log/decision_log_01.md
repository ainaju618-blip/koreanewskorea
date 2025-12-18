# Decision Log 01

> **Purpose:** Record key decisions and discussions for future reference
> **Rule:** Latest entries at TOP, max 2000 lines per file, then create next file

---

## [2025-12-19 15:45] Admin Menu Restructuring (15 → 8 Menus)

**Context:**
- User reported admin menus became disorganized and duplicated over time
- Menus were scattered without logical grouping
- Some features had redundant entries (e.g., "기사 초안" in both "메인" and "기사 관리")

**Problem:**
- 15 separate menu items across 5 categories
- Scraper-related items scattered (봇 관리, 수집처 관리)
- AI Idea only accessible from header, not sidebar
- Long labels reducing readability

**Decision:**
Consolidate into 6 logical categories with 8 main menus:

| Category | Before | After |
|----------|--------|-------|
| **메인** | 대시보드, 기사 초안, 수집처 관리 | 대시보드 only |
| **콘텐츠** | 기사 관리, 봇 관리, AI 뉴스, 이메일 | 기사 관리, AI 뉴스 |
| **수집 시스템** | (scattered) | 스크래퍼 (통합), 이메일 수집 |
| **AI 도구** | Claude Hub only | Claude Hub, AI Idea |
| **시스템** | 사용자 관리, 시스템 설정 | 사용자 관리, 설정 |
| **바로가기** | 2 items | 2 items (same) |

**Key Changes:**
1. "기사 초안" moved into "기사 관리" submenu
2. "수집처 관리" moved into "스크래퍼" submenu
3. "봇 관리 센터" renamed to "스크래퍼" (clearer purpose)
4. "AI 뉴스 관리" shortened to "AI 뉴스"
5. Added "AI Idea" to sidebar under "AI 도구"
6. Shortened many labels for better UX

**File Modified:**
- `src/components/admin/AdminSidebar.tsx`

---

## [2025-12-19 15:20] Decision Log System Created

**Context:**
- User wanted to record key discussions for future reference
- Considered real-time logging but decided against due to token inefficiency

**Decision:**
- Create `decision_log/` folder with numbered files
- Record only important decisions (not real-time)
- Latest entries at top (reverse chronological)
- Include timestamp (YYYY-MM-DD HH:MM)
- Max 2000 lines per file, then create new file
- Claude judges when to record OR user explicitly requests

**Structure:**
```
.claude/decision_log/
├── decision_log_01.md  # Current file
├── decision_log_02.md  # When 01 exceeds 2000 lines
└── ...
```

---

## [2025-12-19 15:00] CLAUDE.md System Restructuring with AGENTS.md Best Practices

**Context:**
- User found YouTube video about AGENTS.md standard (Linux Foundation's Agentic AI Foundation)
- Two reference files: `에이젼트.md` (transcript), `AGENTS_md_Master_Prompt_ghs8S.md` (template)

**Decision:**
- NOT replace existing system, but ENHANCE it with AGENTS.md best practices
- Apply "Control Tower + Delegation" architecture

**Changes Made:**
1. **CLAUDE.md slimmed down:** 1,334 lines → 270 lines (control tower only)
2. **Created `.claude/rules/` folder with 4 delegated rule files:**
   - `golden-rules.md` (132 lines) - Immutable rules, Do's/Don'ts
   - `workflow.md` (173 lines) - Session, gates, error docs
   - `git-deploy.md` (128 lines) - Git/Vercel rules
   - `tech-standards.md` (133 lines) - Tech stack, encoding

**Applied AGENTS.md Practices:**
- 500-line limit per file
- No emojis in rule files (token efficiency)
- Context Map with action-based routing (links, not tables)
- Golden Rules structure (Immutable / Do's / Don'ts)
- Operational Commands section
- Maintenance Policy (self-healing clause)

**Kept As-Is:**
- `info/*`, `scrapers/*`, `.claude/context/*` folders

---

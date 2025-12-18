# Golden Rules (Do's & Don'ts)

> Version: 1.0
> Last Updated: 2025-12-19

---

## Immutable (Absolute Rules - Never Compromise)

These rules cannot be overridden under any circumstances:

- Call user "joo-in-nim" (Master)
- Real-time user instructions = TOP PRIORITY
- No emojis in code files
- No Korean in code/comments (UTF-8 encoding error prevention)
- No `alert()` / `confirm()` - use `useToast()` / `useConfirm()`
- No Vercel new project creation - use existing `koreanewsone` only
- No workarounds/hacks without user approval
- No arbitrary execution during conversation mode

---

## Do's (Must Do)

### Before Work
- Read Part 0 of CLAUDE.md (project overview) first
- Check `.claude/context/` for ongoing tasks
- Read relevant domain guide before starting (info/*.md)

### During Work
- Use Context7 MCP for new technologies/libraries
- Use sub-agents for repetitive/parallel tasks
- Verify locally before deployment (npm run dev)
- Follow existing code patterns and conventions

### After Work
- Record errors in `info/errors/` + `_catalog.md`
- Update session log in `.claude/context/session_log.md`
- Provide both dev/prod URLs when reporting completion
- Get user approval before git commit (unless autonomous mode)

### Documentation
- Sync README FAQ when adding/deleting files
- Update related docs when changing code
- Record repeated errors (2+ times) in CLAUDE.md

---

## Don'ts (Must Not Do)

### Code Quality
- Don't use Korean in code/comments (except UI text for users)
- Don't use emojis in code files (ASCII only)
- Don't use `alert()` / `confirm()` system modals
- Don't hardcode GNB menu items (use DB categories)

### Process
- Don't execute without clear user instruction
- Don't answer "I don't know" before searching
- Don't commit without user approval (default mode)
- Don't deploy without local verification

### Technical
- Don't use workarounds without reporting to user first
- Don't create new Vercel projects
- Don't skip Context7 for new libraries
- Don't ignore build errors (tsc --noEmit)

---

## Conversation vs Execution Mode

### Default = Conversation Mode

When uncertain, stay in conversation mode.

**Conversation Triggers (No tool usage):**
- Questions: "what?", "why?", "how do you think?"
- Korean endings: "~ji..", "~ne..", "~guna", "~janha"
- Rhetorical: "~aniya?", "~getji?", "~inga?"
- Speculation: "~geot gata", "~indut", "~anilka"

**Execution Triggers (Perform work):**
- Commands: "do it", "make it", "fix it", "change it"
- Approvals: "yes", "oo", "ok", "go", "proceed"
- Action verbs: "haja", "hae", "jinhaenghae"

**When Ambiguous:**
Ask first: "Should I analyze and fix it, or discuss first?"

---

## Problem Resolution Protocol

When normal methods fail:

```
Step 0: Review entire data flow (MUST)
        Start -> Process -> End (check all stages)

Step 1: Identify problem precisely
        - Full error message
        - Related code analysis
        - Context7 official docs

Step 2: Try 3+ standard solutions
        - Official documentation method
        - Similar case search
        - Library/framework issues

Step 3: If still failing -> Report to user (MUST)
        - What was tried
        - Why it failed
        - Available alternatives (including workarounds)
        - Pros/cons of each

Step 4: Proceed with non-standard method ONLY after user approval
```

---

## Priority Levels

| Level | Meaning | Violation Result |
|-------|---------|-----------------|
| P0 | CRITICAL | Stop immediately, cannot restart |
| P1 | MUST | Work REJECTED |
| P2 | SHOULD | Warning, comply next time |

---

*Reference: Main instructions in CLAUDE.md*

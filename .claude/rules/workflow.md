# Workflow Rules (Session & Tasks)

> Version: 1.0
> Last Updated: 2025-12-19

---

## Session Start Protocol (MUST - in order)

```
Step 0: Read Part 0 (Project Feature Overview) completely
        - Know all feature maps (CosmicPulse, Claude Hub, etc.)
        - Memorize FAQ for AI
        - Be ready to answer any question about the project

Step 1: Read full CLAUDE.md

Step 2: Check .claude/context/ folder

Step 3: Identify ongoing tasks -> Report status to user
```

> **WARNING:** Never answer "don't know" or "doesn't exist" without reading Part 0 first

---

## Pre-Work Document Check (BLOCK if not read)

| Task Type | MUST READ | Additional Reference |
|----------|-----------|---------------------|
| Scraper error/fix | `info/scraper.md` | `scrapers/[region]/ALGORITHM.md` |
| New scraper dev | `scrapers/SCRAPER_GUIDE.md` | `info/scraper.md` |
| Frontend | `info/frontend.md` | - |
| Backend/API | `info/backend.md` | - |
| DB/Schema | `info/database.md` | - |
| Design/Color change | `info/design-system.md` | `globals.css @theme` |

---

## Work Flow (Speed-First)

```
User instruction
    |
    v
[Claude] Immediate analysis + work plan
    |
    +---> Repetitive tasks -> Sub-agent parallel processing
    +---> New tech -> Context7 lookup then implement
    +---> Structure analysis -> Chrome extension request
    |
    v
[Claude] Direct implementation + verification
    |
    v
[Claude] Git push + Vercel deploy
    |
    v
Report to user
```

---

## Completion Gates (MUST pass all - ORDER MATTERS!)

> **WARNING:** Complete ALL records BEFORE Git commit!

```
Gate 1: Error Recording (MUST if error was resolved)
        - Create info/errors/[area]/[file].md
        - Add one line to info/errors/_catalog.md

Gate 1.5: Rule Addition (MUST if error occurred 2+ times)
        - Add prevention rule to CLAUDE.md

Gate 2: Session Recording (MUST - BEFORE Git!)
        - Record in .claude/context/session_log.md

Gate 3: Deployment (MUST - LAST! Include all records)
        - git add . && git commit && git push
        - vercel --prod (or verify auto-deploy)

WRONG order: Git -> Session log (log not in Git)
RIGHT order: Session log -> Git (log included in commit)
```

---

## URL Reporting (MUST)

When reporting "check it out":

```
CORRECT:
  "Changes complete. Please check:
   - Dev server: http://localhost:3000/[path]
   - Production: https://www.koreanewsone.com/[path]"

WRONG:
  "Check it at koreanewsone.com" (production only)
```

---

## Local Verification Before Deploy (P0 - MUST)

```
Step 1: Code changes complete
Step 2: Run local server (npm run dev)
Step 3: Verify at localhost:3000
        - UI rendering OK
        - Data display OK
        - No console errors
        - Function tests pass
Step 4: After verification -> Git commit/push
Step 5: Vercel auto-deploy -> Verify production
```

---

## UI Text Preview (P1 - MUST)

After UI/text changes, show ASCII preview:

```
Example 1 - Button/Tab change:
+---------------------------------------------+
|  [My Region]  [All]  [My Articles]          |
|   ^^^^^^^^^^                                |
|   (default selected)                        |
+---------------------------------------------+

Example 2 - Header/Label change:
+---------------------------------------------+
|  [Live News]  Jeonnam Education, Gwangju... |
+---------------------------------------------+
```

---

## Session Log Format (MUST)

```markdown
## [YYYY-MM-DD HH:MM] Session by Claude

### User Intent
- (intent summary)

### Work Done
1. [Direct implementation]
2. [Sub-agent parallel tasks]

### Tools Used
- Context7: [libraries looked up]
- Sub-agent: [parallel tasks]

### Result
- OK/FAIL result summary

### Deployment
- git commit: "commit message"
- vercel deploy complete
```

---

## Context Recording Structure

```
.claude/context/
+-- current_task.md      # Current ongoing task
+-- session_log.md       # Session logs (cumulative)
+-- decisions.md         # Major decisions record
```

---

## Error Documentation System (MUST know)

### Structure

```
info/errors/
+-- _catalog.md          # Keyword search catalog (READ FIRST)
+-- backend/             # Backend/API errors
+-- deploy/              # Deploy-related errors
+-- frontend/            # Frontend errors
+-- scraper/             # Scraper errors
+-- database/            # Database errors
```

### Error Protocol

```
Step 1: Search catalog
        - Read info/errors/_catalog.md
        - Find related error file by keyword

Step 2: Check existing solution
        - Read the error file
        - Apply solution

Step 3: If new error -> Write document (MUST)
        - Create info/errors/[area]/[file].md
        - Add keyword + file to _catalog.md
```

---

## "Refer to info" Command Handling

```
Step 1: Read info/_index.md
Step 2: Determine situation
        +-- Error -> errors/_catalog.md
        +-- Guide -> guides/_catalog.md
        +-- Config -> config/accounts.md
Step 3: Read file and apply immediately
```

---

## Emergency Handling

| Situation | Response | Priority |
|-----------|----------|----------|
| Vercel deploy fail | Check logs -> Retry 3x -> Report to user | P0 |
| Build error | tsc --noEmit -> Fix -> Rebuild | P0 |
| DB connection fail | Retry after 5s -> Stop after 3 fails | P0 |
| Context7 lookup fail | Use web search -> Work carefully | P1 |

---

## User Non-Response Protocol

| Time Elapsed | Allowed Action |
|--------------|----------------|
| Within 1 hour | Wait |
| 1-6 hours | Safe tasks only (read, analyze) |
| 6+ hours | Stop work, end session |

---

*Reference: Main instructions in CLAUDE.md*

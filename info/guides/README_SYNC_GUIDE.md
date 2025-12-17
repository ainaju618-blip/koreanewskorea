# README FAQ Sync Guide (AI Required Reading)

> **Purpose:** Ensure README FAQ stays synchronized with actual codebase
> **Priority:** P1 (Must follow)
> **Target:** All AI agents working on this project

---

## Why This Guide Exists

README FAQ is a **static index** - it does NOT auto-sync with code changes.

| Problem | Result |
|---------|--------|
| Feature added, FAQ not updated | AI says "doesn't exist" (wrong) |
| Feature deleted, FAQ not updated | AI says "exists here" (wrong) |

---

## Part 1: When Adding Files/Features

### Trigger Conditions
- New component file created (`.tsx`, `.ts`)
- New API endpoint added
- New scraper added
- New utility/hook added
- New page added

### Required Actions

```
Step 1: Identify the parent folder's README.md
        Example: Added src/components/home/NewFeature.tsx
                 → Update src/components/home/README.md

Step 2: Add FAQ entry with Korean natural language keywords
        Format:
        | "Korean question?" | `filename.tsx` - description |

Step 3: If significant feature, also update parent folder README
        Example: Major home component
                 → Also update src/components/README.md
```

### FAQ Entry Template

```markdown
| "Feature Korean name?" | `filename.tsx` |
| "What does feature do?" | `filename.tsx` - brief description |
| "Alternative question?" | `filename.tsx` |
```

### Example: Adding HeroSlider.tsx

**File created:** `src/components/home/HeroSlider.tsx`

**Update:** `src/components/home/README.md`
```markdown
## FAQ
| Question | Answer |
|----------|--------|
| "HeroSlider?" | `HeroSlider.tsx` |
| "Main page top section?" | `HeroSlider.tsx` |
| "Hero banner?" | `HeroSlider.tsx` |
| "Main slider?" | `HeroSlider.tsx` |
```

---

## Part 2: When Deleting Files/Features

### Trigger Conditions
- Component file deleted
- API endpoint removed
- Scraper removed
- Utility/hook removed
- Page removed

### Required Actions

```
Step 1: Identify all README.md files that reference this file
        Use: Grep for filename across all README.md files

Step 2: Remove or update FAQ entries
        - If feature completely removed → Delete FAQ entry
        - If feature moved → Update path in FAQ entry

Step 3: Verify no orphan references remain
        Use: Grep again to confirm
```

### Example: Deleting HeroSlider.tsx

**File deleted:** `src/components/home/HeroSlider.tsx`

**Search:** `Grep "HeroSlider" in *.md files`

**Update:** Remove from `src/components/home/README.md`:
```markdown
## FAQ
| Question | Answer |
|----------|--------|
- | "HeroSlider?" | `HeroSlider.tsx` |           ← DELETE
- | "Main page top section?" | `HeroSlider.tsx` | ← DELETE
```

---

## Part 3: When Answering Questions (AI Verification)

### Before Answering "Feature exists at X"

```
Step 1: Found answer in README FAQ
        → "HeroSlider.tsx exists"

Step 2: VERIFY before answering (MUST)
        → Glob/Read to confirm file actually exists

Step 3: If file exists → Answer with confidence
        If file NOT exists → Report: "FAQ is outdated, file was deleted"
```

### Before Answering "Feature doesn't exist"

```
Step 1: No match in README FAQ
        → Tempted to say "doesn't exist"

Step 2: SEARCH before answering (MUST)
        → Glob for similar filenames/patterns

Step 3: If found → Answer with actual location + Note: "FAQ needs update"
        If not found → Answer: "Not found in codebase"
```

---

## Part 4: Checklist for Code Changes

### After Adding File/Feature
- [ ] Parent folder README.md FAQ updated
- [ ] Korean natural language keywords added
- [ ] Related parent folders updated (if significant)

### After Deleting File/Feature
- [ ] Grep for filename in all *.md files
- [ ] All FAQ references removed
- [ ] No orphan documentation remains

### When Answering Questions
- [ ] FAQ answer verified against actual codebase
- [ ] File existence confirmed before answering "exists"
- [ ] Codebase searched before answering "doesn't exist"

---

## Part 5: Error Messages

### If This Guide Not Found

If AI cannot find this guide at `info/guides/README_SYNC_GUIDE.md`:

```
[SYNC_GUIDE_NOT_FOUND]
README Sync Guide is missing.
Expected location: info/guides/README_SYNC_GUIDE.md
Please restore this file before proceeding with file operations.
```

### If FAQ Mismatch Detected

```
[FAQ_SYNC_ERROR]
README FAQ is out of sync with codebase.
- FAQ says: [filename] exists
- Reality: File not found
Action: Update README FAQ to remove outdated entry.
```

### If FAQ Missing Entry

```
[FAQ_MISSING_ENTRY]
File exists but not in README FAQ.
- File: [filepath]
- README: [readme path]
Action: Add FAQ entry for this file.
```

---

## Part 6: Changelog Timeline (MUST)

### Why Changelog?
- Track when files were added/deleted
- Detect if FAQ might be outdated
- Audit trail for AI agents

### Changelog Format

Each README.md should have a Changelog section at the bottom:

```markdown
---

## Changelog

| Date | Action | File | By |
|------|--------|------|-----|
| 2025-12-17 | Added | HeroSlider.tsx | Claude |
| 2025-12-18 | Deleted | OldBanner.tsx | Claude |
| 2025-12-18 | Renamed | Button.tsx → PrimaryButton.tsx | Claude |
```

### Action Types
- `Added` - New file created
- `Deleted` - File removed
- `Renamed` - File renamed
- `Moved` - File moved to different location

### When to Update Changelog
- Every time FAQ is modified due to file changes
- Include date, action, filename, and who made the change

### Example README with Changelog

```markdown
# Home Components (src/components/home)

## FAQ
| Question | Answer |
|----------|--------|
| "Hero slider?" | `HeroSlider.tsx` |

---

## Changelog

| Date | Action | File | By |
|------|--------|------|-----|
| 2025-12-17 | Added | HeroSlider.tsx | Claude |

---
*Last updated: 2025-12-17*
```

---

## Part 7: Git History Verification (Ultimate Source of Truth)

### Why Git?
- Git is the **absolute source of truth** for file history
- README/FAQ can be outdated, but Git never lies
- Git shows exact when, who, and what changed

### Essential Git Commands

```bash
# Check if file exists in history
git log --oneline --name-status -- "path/to/file.tsx"

# Check recent file changes in a folder
git log --oneline --name-status -20 -- "src/components/home/"

# Find when a file was deleted
git log --diff-filter=D --summary -- "path/to/deleted-file.tsx"

# Find when a file was added
git log --diff-filter=A --summary -- "path/to/file.tsx"

# Check all changes by a specific file pattern
git log --oneline --all -- "**/HeroSlider*"
```

### When to Use Git Verification

| Situation | Git Command | Purpose |
|-----------|-------------|---------|
| FAQ says file exists, but can't find it | `git log --diff-filter=D -- "file"` | Find when deleted |
| User asks about feature, FAQ has no entry | `git log --diff-filter=A -- "**/feature*"` | Find if ever existed |
| Conflicting information | `git log --oneline -10 -- "path/"` | See recent history |
| Need to know who changed what | `git log --format="%h %an %s" -- "file"` | Get author info |

### Integration with Answer Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Enhanced Verification Flow (MUST)                          │
│                                                              │
│  Step 1: Check README FAQ                                    │
│          → Found entry? → Go to Step 2                       │
│          → No entry? → Go to Step 3                          │
│                                                              │
│  Step 2: Verify with Glob/Read                               │
│          → File exists? → Answer confidently                 │
│          → File NOT exists? → Go to Step 4 (Git check)       │
│                                                              │
│  Step 3: Search codebase (Glob)                              │
│          → Found? → Answer + Note "FAQ needs update"         │
│          → Not found? → Go to Step 4 (Git check)             │
│                                                              │
│  Step 4: Git History Check (Ultimate verification)           │
│          → git log --oneline --all -- "**/filename*"         │
│          → If found in history:                              │
│             "File existed but was deleted on [date]"         │
│          → If never existed:                                 │
│             "File never existed in this project"             │
└─────────────────────────────────────────────────────────────┘
```

### Git Verification Examples

**Example 1: User asks "HeroSlider where?"**
```bash
# Step 1: FAQ says src/components/home/HeroSlider.tsx
# Step 2: Glob finds nothing
# Step 4: Git check
git log --oneline --diff-filter=D -- "**/HeroSlider*"
# Output: a1b2c3d Deleted HeroSlider.tsx (2025-12-15)

# Answer: "HeroSlider was deleted on 2025-12-15 (commit a1b2c3d). FAQ is outdated."
```

**Example 2: User asks "Is there a DarkMode toggle?"**
```bash
# Step 1: No FAQ entry
# Step 3: Glob finds nothing
# Step 4: Git check
git log --oneline --all -- "**/DarkMode*" "**/darkmode*" "**/dark-mode*"
# Output: (empty)

# Answer: "DarkMode feature has never been implemented in this project."
```

### Error Message for Git Verification

```
[GIT_VERIFICATION_RESULT]
File: [filename]
Status: [EXISTS | DELETED | NEVER_EXISTED]
Last commit: [commit hash] ([date])
Action: [action taken by AI]
```

---

## Quick Reference

| Action | What to Do |
|--------|------------|
| **Add file** | Add FAQ entry + Korean keywords + Changelog |
| **Delete file** | Grep & remove all FAQ references + Changelog |
| **Move file** | Update FAQ paths + Changelog |
| **Rename file** | Update FAQ filenames + Changelog |
| **Answer "exists"** | Verify file actually exists |
| **Answer "not exists"** | Search codebase first |
| **Ultimate verification** | Use Git log for definitive answer |

---

## Related Documents

| Document | Path |
|----------|------|
| CLAUDE.md | `CLAUDE.md` - Part G (Sync Rules) |
| Git Workflow | `info/git.md` |
| Components README | `src/components/README.md` |
| API README | `src/app/api/README.md` |

---

*Last updated: 2025-12-17*
*This guide is REQUIRED READING for all AI agents*
*Part 7 (Git Verification) added for ultimate source of truth*

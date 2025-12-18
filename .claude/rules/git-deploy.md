# Git & Deployment Rules

> Version: 1.0
> Last Updated: 2025-12-19

---

## Git Commit Rules (P0)

### Default Process

```
Work complete -> Report to user -> Get approval -> Git commit/push

Example:
  Claude: "Dark mode fix complete. May I commit?"
  User: "yes" or "oo" or "do it"
  Claude: git commit & push
```

### Exception: Autonomous Commit

```
When user says these -> Autonomous commit/deploy allowed:

  "Don't need to report", "Do it yourself", "Do as you like"
  "Commit it too", "Deploy it too", "Finish everything"
  "Night mode", "I'm tired, handle it yourself"

  -> Commit/push immediately after completion
  -> Only report completion (no approval wait)
```

---

## Vercel Deployment Rules (P0 - ABSOLUTE)

> **NEVER create new project! Deploy to existing project only.**

### Project Information

| Item | Value |
|------|-------|
| **Vercel Project Name** | `koreanewsone` |
| **Vercel Team** | `koreanews-projects` |
| **Production Domain** | `www.koreanewsone.com` |
| **GitHub Repo** | `korea-news/koreanewsone` |

### Pre-Deploy Verification (MUST)

```bash
# 1. Check current linked project (MUST)
cat .vercel/project.json

# Correct result:
# {"projectId":"prj_jGcGSBPpRihw9W4RVNHTAGJXwCMr","orgId":"team_tJHjAZNcQHsga5azoDPrGhPg"}

# 2. If incorrectly linked, relink
vercel link --yes --project koreanewsone
```

### Prohibited Actions

- NO selecting "create new project" during `vercel link`
- NO arbitrary `vercel` command deploy (creates new project)
- NO project name typos (`koreanews` etc.)

### Correct Deploy Method

```bash
# Auto-deploy after git push (recommended)
git push

# Or manual deploy (after project verification)
vercel --prod
```

---

## Git Config Per Project

| Project | Git Email | Git Name | Vercel Team |
|---------|-----------|----------|-------------|
| **koreanews** | `kyh6412057153@gmail.com` | yuhyang | koreanews-projects |
| **hobakflower** | `ko518533@gmail.com` | gwanghyuk | - |
| **CBT projects** | `multi618@gmail.com` | jung | - |

### Git Config Rules

```
IMPORTANT: Always get user approval before Git commit/push!

Before project work, verify:
1. git config user.email -> matches project email?
2. If mismatch -> git config user.email "correct@email"
3. Before commit -> "May I commit?" ask user
4. If Vercel deploy error after commit -> check commit author, amend
```

### Git Config Commands Per Project

```bash
# koreanews
git config user.email "kyh6412057153@gmail.com"
git config user.name "yuhyang"

# hobakflower
git config user.email "ko518533@gmail.com"
git config user.name "gwanghyuk"

# CBT projects
git config user.email "multi618@gmail.com"
git config user.name "jung"
```

---

## Local Verification Before Deploy (P0 - MUST)

> **All UI/function changes MUST be verified locally before deploy.**

```
Step 1: Code changes complete
Step 2: Run local server (npm run dev)
Step 3: Verify at localhost:3000
        +-- UI rendering normal
        +-- Data display normal
        +-- No console errors
        +-- Function test pass
Step 4: After verification -> Git commit/push
Step 5: Vercel auto-deploy -> Verify production
```

### Why This Rule Matters

| Problem | Result |
|---------|--------|
| Deploy without local check | Broken UI in production |
| Unchecked DB query error | Empty screen like "Preparing..." |
| Ignoring console errors | Degraded user experience |

### Local Server Run Methods

```bash
# Method 1: Direct run
npm run dev

# Method 2: Batch file (recommended)
koreanews-dev.bat
```

---

## Deployment Verification URLs

```
Development: http://localhost:3000
Production:  https://www.koreanewsone.com
```

---

## Deployment Error Handling

| Error Type | Action |
|------------|--------|
| Build fails | Check tsc --noEmit -> Fix type errors -> Retry |
| Deploy timeout | Wait 2 min -> Retry -> Report if fails 3x |
| 500 error on prod | Check Vercel logs -> Hotfix -> Redeploy |
| Missing env var | Check .env -> Add to Vercel dashboard |

---

*Reference: Main instructions in CLAUDE.md*

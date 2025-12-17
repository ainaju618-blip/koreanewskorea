# Vercel UTF-8 Build Error

> **Category:** Deploy / Encoding
> **First Occurred:** 2025-12-17
> **Resolved By:** Claude
> **Severity:** Critical (Build failure)

---

## Symptoms

- Vercel build fails with encoding error
- Error message: `stream did not contain valid UTF-8`
- Local build works fine, only Vercel fails
- Affected file: TSX/TS files with Korean comments

```
Error: stream did not contain valid UTF-8
   at ./src/components/Header.tsx
```

---

## Cause

### Git Commit Encoding Corruption

When committing files with Korean text in comments/code:
1. Git processes the file
2. Encoding gets corrupted during commit
3. Remote repository receives corrupted bytes
4. Vercel pulls corrupted file
5. Build fails on UTF-8 validation

### Different from PowerShell Encoding

- PowerShell encoding: Local file corruption
- This issue: Git commit/push corruption
- Local file looks fine, but remote is corrupted

---

## Solution

### 1. Identify Corrupted Files

```bash
# Check Vercel build log for affected files
# Look for "stream did not contain valid UTF-8" error
```

### 2. Rewrite File with English Comments

Replace all Korean comments with English:

```typescript
// Before (causes error)
// Category definition
const categories = []; // List of categories

// After (safe)
// Category definition
const categories = []; // List of categories
```

### 3. Commit and Push

```bash
git add <file>
git commit -m "fix: Replace Korean comments with English for UTF-8 compatibility"
git push
```

---

## Prevention Rules

### P0 Rule (Added to CLAUDE.md)

**No Korean in code files:**
- No Korean comments
- No Korean variable names
- No Korean aria-labels

**Allowed:**
- UI text for rendering: `<span>Korean Text</span>`
- JSON/config values

### Before Commit Checklist

1. Check for Korean comments
2. Replace with English equivalents
3. Verify build locally: `npm run build`

---

## Affected Files (2025-12-17)

- `src/components/Header.tsx`
  - Korean comments caused build failure
  - Fixed by replacing with English comments
  - Commit: 325ce66

---

## Related

- `frontend/powershell-encoding.md` - Different issue (local corruption)
- CLAUDE.md C.3 - Encoding rules section

---

*Last Updated: 2025-12-17*

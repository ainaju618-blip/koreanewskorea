# Supabase SELECT - Column Does Not Exist

> **Date:** 2025-12-21
> **Severity:** High
> **Category:** Backend / Database Query

---

## Symptom

- Reporter name not displaying (shows "코리아NEWS 취재팀" instead)
- Supabase query returns `data: null` silently
- Error only visible when destructuring `error` from response

---

## Error Message

```
column reporters.department does not exist
column reporters.career_years does not exist
column reporters.slug does not exist
```

---

## Root Cause

SELECT query includes columns that don't exist in the table:

```javascript
// WRONG - includes non-existent columns
.select('id, name, email, region, position, specialty, department,
         bio, profile_image, avatar_icon, career_years, slug,
         sns_twitter, sns_facebook, sns_linkedin')
```

Supabase returns `{ data: null, error: {...} }` but code ignores error:

```javascript
// Only destructures data, ignores error
const { data } = await supabaseAdmin.from('reporters').select(...);
reporter = data;  // null!
```

---

## Solution

### Step 1: Check actual table columns

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'reporters' ORDER BY ordinal_position;
```

### Step 2: Update SELECT to only existing columns

```javascript
// CORRECT - only existing columns
.select('id, name, email, region, position, specialty, bio,
         profile_image, avatar_icon, user_id')
```

### Step 3: Remove references to non-existent properties

```javascript
// WRONG
href={`/author/${reporter.slug || reporter.id}`}

// CORRECT
href={`/author/${reporter.id}`}
```

### Step 4: Type check before commit

```bash
npx tsc --noEmit
```

---

## Prevention

1. **Always destructure `error`** from Supabase response:
   ```javascript
   const { data, error } = await supabase.from('table').select(...);
   if (error) console.error('Query failed:', error.message);
   ```

2. **Run `tsc --noEmit`** before every commit

3. **Check table schema** before writing SELECT queries

---

## Related Files

- `src/app/(site)/news/[id]/page.tsx` - News detail page
- `src/lib/auto-assign.ts` - Reporter auto-assignment

---

*Documented: 2025-12-21*

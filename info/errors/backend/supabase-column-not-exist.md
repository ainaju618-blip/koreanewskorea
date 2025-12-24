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

## Case 2: koreanewskorea - source_url vs original_link

> **Date:** 2025-12-25
> **Project:** koreanewskorea (Regional Homepage)

### Symptom

- Regional homepage shows empty content (header/footer only)
- Vercel runtime logs show: `column posts.source_url does not exist`

### Error Message

```
[ArticleRepository.findByRegion] Error: {
  code: '42703',
  message: 'column posts.source_url does not exist'
}
```

### Root Cause

ArticleRepository.ts used `source_url` but actual DB column is `original_link`:

```typescript
// WRONG
const POST_FIELDS = '...source_url...';

// CORRECT
const POST_FIELDS = '...original_link...';
```

### Solution

1. Check `info/database.md` for actual column names
2. Update `ArticleRepository.ts` POST_FIELDS
3. Update `Article.ts` entity type
4. Update any component using `article.source_url`

### Files Changed

- `koreanewskorea/common/infrastructure/repositories/ArticleRepository.ts`
- `koreanewskorea/common/domain/entities/Article.ts`
- `koreanewskorea/app/news/[id]/page.tsx`

### How to Debug

```bash
# Check Vercel runtime logs
cd koreanewskorea
npx vercel logs https://koreanewskorea.vercel.app
```

---

*Documented: 2025-12-21, Updated: 2025-12-25*

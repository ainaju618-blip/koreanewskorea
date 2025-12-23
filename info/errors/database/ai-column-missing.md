# AI Column Missing in Posts Table

> **Category:** Database / Schema
> **Severity:** Critical (blocks AI processing)
> **Created:** 2025-12-23

---

## Symptoms

```
Error: Could not find the 'ai_validation_grade' column of 'posts' in the schema cache
```

- AI rewrite processing succeeds (Grade A/B/C/D determined)
- DB update fails at final step
- Log file shows: `[STEP-8-DB-UPDATE-FAILED]`

---

## Root Cause

The `posts` table is missing AI validation columns that the code expects:

| Column | Type | Purpose |
|--------|------|---------|
| `ai_validation_grade` | text | Grade A/B/C/D |
| `ai_double_validated` | boolean | Double validation passed |
| `ai_validation_warnings` | text[] | Warning messages array |
| `ai_processed` | boolean | AI processing applied |
| `ai_processed_at` | timestamptz | Processing timestamp |

The columns may be documented in `info/database.md` but not actually created in Supabase.

---

## Solution

Run this SQL in Supabase SQL Editor:

```sql
-- AI Validation columns for posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_validation_grade text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_double_validated boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_validation_warnings text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_processed boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_processed_at timestamptz;

-- Add check constraint for grade values
ALTER TABLE posts ADD CONSTRAINT posts_ai_validation_grade_check
  CHECK (ai_validation_grade IS NULL OR ai_validation_grade IN ('A', 'B', 'C', 'D'));

-- Comments for documentation
COMMENT ON COLUMN posts.ai_validation_grade IS 'AI validation grade: A=publish, B/C/D=hold as draft';
COMMENT ON COLUMN posts.ai_double_validated IS 'True if article passed double AI validation';
COMMENT ON COLUMN posts.ai_validation_warnings IS 'Array of validation warning messages';
COMMENT ON COLUMN posts.ai_processed IS 'True if AI rewrite was applied';
COMMENT ON COLUMN posts.ai_processed_at IS 'Timestamp when AI processing completed';
```

---

## How to Debug

1. Check log file: `logs/ai-rewrite.log`
2. Look for `[STEP-8-DB-UPDATE-FAILED]` entries
3. Error message will specify which column is missing

---

## Related Files

- `src/app/api/ai/rewrite/route.ts` - Uses these columns in DB update
- `src/lib/ai-output-parser.ts` - `toDBUpdate()` function
- `info/database.md` - Schema documentation

---

## Prevention

When adding new fields to AI processing:
1. Update `info/database.md` with new column
2. Run ALTER TABLE SQL in Supabase **immediately**
3. Test with actual AI rewrite before committing code

---

*Added: 2025-12-23*

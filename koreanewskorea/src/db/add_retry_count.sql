-- Add ai_retry_count column for retry processing
-- Run this in Supabase SQL Editor

-- Add column if not exists
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS ai_retry_count INTEGER DEFAULT 0;

-- Add index for efficient retry queries
CREATE INDEX IF NOT EXISTS idx_posts_retry
ON posts (ai_validation_grade, ai_retry_count)
WHERE status = 'draft';

-- Comment
COMMENT ON COLUMN posts.ai_retry_count IS 'Number of AI processing attempts (max 5)';

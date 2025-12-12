-- Add is_focus column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_focus BOOLEAN DEFAULT FALSE;

-- Optional: Create index for performance if querying by is_focus becomes frequent
CREATE INDEX IF NOT EXISTS idx_posts_is_focus ON posts(is_focus);

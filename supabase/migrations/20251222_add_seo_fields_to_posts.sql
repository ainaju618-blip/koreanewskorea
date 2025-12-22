-- Add SEO fields to posts table
-- Created: 2025-12-22

-- 1. Add columns if they don't exist
DO $$
BEGIN
    -- slug
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'slug') THEN
        ALTER TABLE posts ADD COLUMN slug TEXT;
        CREATE INDEX idx_posts_slug ON posts(slug);
    END IF;

    -- ai_summary (Meta Description)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'ai_summary') THEN
        ALTER TABLE posts ADD COLUMN ai_summary TEXT;
    END IF;

    -- keywords (Search Keywords)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'keywords') THEN
        ALTER TABLE posts ADD COLUMN keywords TEXT[] DEFAULT '{}';
    END IF;

    -- tags (Hashtags)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'tags') THEN
        ALTER TABLE posts ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- ai_processed flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'ai_processed') THEN
        ALTER TABLE posts ADD COLUMN ai_processed BOOLEAN DEFAULT false;
        CREATE INDEX idx_posts_ai_processed ON posts(ai_processed);
    END IF;

    -- ai_processed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'ai_processed_at') THEN
        ALTER TABLE posts ADD COLUMN ai_processed_at TIMESTAMPTZ;
    END IF;

    -- image_alt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'image_alt') THEN
        ALTER TABLE posts ADD COLUMN image_alt TEXT;
    END IF;

END $$;

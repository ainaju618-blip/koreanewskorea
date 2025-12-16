-- ============================================
-- CosmicPulse Blog Schema
-- SF/Space Blog System for KoreaNews
-- Created: 2025-12-16
-- ============================================

-- 1. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,

    -- Categorization
    category TEXT NOT NULL DEFAULT 'sf-entertainment',
    tags TEXT[] DEFAULT '{}',

    -- Media
    thumbnail_url TEXT,
    thumbnail_alt TEXT,

    -- SEO
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[],

    -- Source & AI
    source_url TEXT,
    source_name TEXT,
    ai_generated BOOLEAN DEFAULT false,
    ai_model TEXT,
    ai_prompt TEXT,

    -- WordPress Sync
    wordpress_id BIGINT,
    wordpress_url TEXT,
    wordpress_synced_at TIMESTAMPTZ,

    -- Status & Publishing
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'review', 'published', 'archived', 'trash')),
    published_at TIMESTAMPTZ,

    -- Metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- Author
    author_id UUID,
    author_name TEXT DEFAULT 'CosmicPulse AI',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3B82F6',
    parent_id UUID REFERENCES blog_categories(id),
    sort_order INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blog Sources (Crawling Sources)
CREATE TABLE IF NOT EXISTS blog_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reddit', 'rss', 'api', 'website')),

    -- Configuration
    enabled BOOLEAN DEFAULT true,
    crawl_interval INTEGER DEFAULT 3600, -- seconds
    selectors JSONB, -- CSS selectors for scraping

    -- Credentials (if needed)
    api_key TEXT,

    -- Status
    last_crawled_at TIMESTAMPTZ,
    last_error TEXT,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blog AI Generation Logs
CREATE TABLE IF NOT EXISTS blog_ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference
    post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    source_id UUID REFERENCES blog_sources(id) ON DELETE SET NULL,

    -- AI Details
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response_preview TEXT, -- First 500 chars

    -- Metrics
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    cost_usd DECIMAL(10, 6),
    duration_ms INTEGER,

    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Blog Settings Table
CREATE TABLE IF NOT EXISTS blog_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trending Topics Cache
CREATE TABLE IF NOT EXISTS blog_trending_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Topic Info
    topic TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    source TEXT NOT NULL,

    -- Metrics
    score DECIMAL(10, 2) DEFAULT 0,
    mentions INTEGER DEFAULT 0,

    -- Status
    used BOOLEAN DEFAULT false,
    post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,

    -- Timestamps
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- ============================================
-- Indexes
-- ============================================

-- Posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_generated ON blog_posts(ai_generated);

-- Sources
CREATE INDEX IF NOT EXISTS idx_blog_sources_enabled ON blog_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_blog_sources_type ON blog_sources(type);

-- AI Logs
CREATE INDEX IF NOT EXISTS idx_blog_ai_logs_post_id ON blog_ai_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_ai_logs_created_at ON blog_ai_logs(created_at DESC);

-- Trending
CREATE INDEX IF NOT EXISTS idx_blog_trending_expires ON blog_trending_topics(expires_at);
CREATE INDEX IF NOT EXISTS idx_blog_trending_used ON blog_trending_topics(used);

-- ============================================
-- Default Categories
-- ============================================

INSERT INTO blog_categories (name, slug, description, icon, color, sort_order) VALUES
    ('SF Entertainment', 'sf-entertainment', 'SF movies, dramas, games reviews and analysis', 'film', '#EF4444', 1),
    ('Space Science', 'space-science', 'NASA, ESA, space exploration news', 'rocket', '#3B82F6', 2),
    ('Astronomy', 'astronomy', 'Stars, galaxies, cosmic phenomena', 'star', '#8B5CF6', 3),
    ('Future Tech', 'future-tech', 'Space technology and innovations', 'cpu', '#10B981', 4),
    ('Space Industry', 'space-industry', 'SpaceX, Blue Origin, space business', 'building', '#F59E0B', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Default Settings
-- ============================================

INSERT INTO blog_settings (key, value) VALUES
    ('site_name', '"CosmicPulse"'),
    ('site_tagline', '"SF & Space for Korean Readers"'),
    ('posts_per_page', '10'),
    ('auto_publish', 'false'),
    ('wordpress_enabled', 'false'),
    ('ai_model', '"claude-3-haiku-20240307"'),
    ('default_author', '"CosmicPulse AI"')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Default Sources
-- ============================================

INSERT INTO blog_sources (name, url, type, enabled, crawl_interval) VALUES
    ('Reddit r/space', 'https://www.reddit.com/r/space', 'reddit', true, 3600),
    ('Reddit r/scifi', 'https://www.reddit.com/r/scifi', 'reddit', true, 3600),
    ('Space.com RSS', 'https://www.space.com/feeds/all', 'rss', true, 7200),
    ('NASA News', 'https://www.nasa.gov/news/releases', 'rss', true, 14400),
    ('Hacker News Space', 'https://hn.algolia.com/api/v1/search?tags=story&query=space', 'api', true, 3600)
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_trending_topics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON blog_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON blog_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON blog_sources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON blog_ai_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON blog_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON blog_trending_topics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read for published posts
CREATE POLICY "Public read published posts" ON blog_posts FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Public read categories" ON blog_categories FOR SELECT TO anon USING (true);

-- ============================================
-- Functions
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

DROP TRIGGER IF EXISTS blog_sources_updated_at ON blog_sources;
CREATE TRIGGER blog_sources_updated_at
    BEFORE UPDATE ON blog_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

-- Generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces with hyphens
    base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    -- Add timestamp for uniqueness
    final_slug := base_slug || '-' || to_char(NOW(), 'YYYYMMDD');

    -- Check for duplicates and add counter if needed
    WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || to_char(NOW(), 'YYYYMMDD') || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_blog_view(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE blog_posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Press Releases Table Migration
-- For receiving press releases from government agencies
-- =====================================================

-- Table: press_releases
CREATE TABLE IF NOT EXISTS press_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT NOT NULL,                    -- Source organization (e.g., "Naju City Planning Office")
    content TEXT,                            -- Full content
    content_preview TEXT,                    -- Preview/summary (first 200 chars)
    region TEXT NOT NULL,                    -- Region name (e.g., "Naju")
    received_at TIMESTAMPTZ DEFAULT NOW(),   -- When received
    original_link TEXT,                      -- Link to original press release
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'converted')),
    converted_article_id UUID REFERENCES posts(id) ON DELETE SET NULL,  -- If converted to article
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: press_release_reads (Track who read what)
CREATE TABLE IF NOT EXISTS press_release_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    press_release_id UUID NOT NULL REFERENCES press_releases(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(press_release_id, reporter_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_press_releases_region ON press_releases(region);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_received_at ON press_releases(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_press_release_reads_reporter ON press_release_reads(reporter_id);

-- RLS Policies
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_release_reads ENABLE ROW LEVEL SECURITY;

-- Press releases are readable by all authenticated users
CREATE POLICY "press_releases_select_authenticated" ON press_releases
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can insert/update/delete press releases
CREATE POLICY "press_releases_admin_all" ON press_releases
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM reporters r
            WHERE r.user_id = auth.uid()
            AND r.access_level IN ('admin', 'super_admin')
        )
    );

-- Reporters can read their own read records
CREATE POLICY "press_release_reads_select_own" ON press_release_reads
    FOR SELECT
    TO authenticated
    USING (
        reporter_id IN (
            SELECT id FROM reporters WHERE user_id = auth.uid()
        )
    );

-- Reporters can insert their own read records
CREATE POLICY "press_release_reads_insert_own" ON press_release_reads
    FOR INSERT
    TO authenticated
    WITH CHECK (
        reporter_id IN (
            SELECT id FROM reporters WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Sample Data (Optional - Comment out in production)
-- =====================================================

-- INSERT INTO press_releases (title, source, content_preview, region, status) VALUES
-- ('Example Press Release', 'City Hall', 'This is a sample press release...', 'Naju', 'new');

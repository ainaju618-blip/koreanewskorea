-- Publish Patterns Table for Adaptive Scheduling
-- Records article publish times to learn each region's posting patterns
-- Created: 2025-12-27

-- 1. Main pattern tracking table
CREATE TABLE IF NOT EXISTS publish_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_code TEXT NOT NULL,          -- e.g., 'gwangju', 'jeonnam', 'mokpo'
    hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Mon, 6=Sun
    article_count INT DEFAULT 0,        -- Cumulative count for this time slot
    last_article_at TIMESTAMPTZ,        -- Last article published in this slot
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(region_code, hour, day_of_week)
);

-- 2. Last scraped article ID per region (for change detection)
CREATE TABLE IF NOT EXISTS scraper_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_code TEXT NOT NULL UNIQUE,
    last_article_id TEXT,               -- Last scraped article ID
    last_article_url TEXT,              -- Last scraped article URL
    last_check_at TIMESTAMPTZ,          -- Last poll time
    last_article_at TIMESTAMPTZ,        -- Last new article found time
    total_articles INT DEFAULT 0,       -- Total articles collected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_publish_patterns_region ON publish_patterns(region_code);
CREATE INDEX IF NOT EXISTS idx_publish_patterns_hour ON publish_patterns(hour);
CREATE INDEX IF NOT EXISTS idx_publish_patterns_day ON publish_patterns(day_of_week);
CREATE INDEX IF NOT EXISTS idx_scraper_state_region ON scraper_state(region_code);

-- 4. RLS Policies
ALTER TABLE publish_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for publish_patterns" ON publish_patterns FOR ALL USING (true);
CREATE POLICY "Allow all for scraper_state" ON scraper_state FOR ALL USING (true);

-- 5. Helper function to update pattern on new article
CREATE OR REPLACE FUNCTION update_publish_pattern(
    p_region_code TEXT,
    p_publish_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID AS $$
DECLARE
    v_hour INT;
    v_dow INT;
BEGIN
    v_hour := EXTRACT(HOUR FROM p_publish_time);
    v_dow := EXTRACT(DOW FROM p_publish_time);

    -- Convert Sunday=0 to Monday=0 format
    v_dow := CASE WHEN v_dow = 0 THEN 6 ELSE v_dow - 1 END;

    INSERT INTO publish_patterns (region_code, hour, day_of_week, article_count, last_article_at)
    VALUES (p_region_code, v_hour, v_dow, 1, p_publish_time)
    ON CONFLICT (region_code, hour, day_of_week)
    DO UPDATE SET
        article_count = publish_patterns.article_count + 1,
        last_article_at = p_publish_time,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get peak hours for a region
CREATE OR REPLACE FUNCTION get_peak_hours(
    p_region_code TEXT,
    p_day_of_week INT DEFAULT NULL,
    p_threshold_percentile FLOAT DEFAULT 0.7
) RETURNS TABLE (
    hour INT,
    article_count INT,
    is_peak BOOLEAN
) AS $$
DECLARE
    v_threshold INT;
BEGIN
    -- Calculate threshold (top 30% of article counts)
    SELECT PERCENTILE_CONT(p_threshold_percentile) WITHIN GROUP (ORDER BY pp.article_count)
    INTO v_threshold
    FROM publish_patterns pp
    WHERE pp.region_code = p_region_code
      AND (p_day_of_week IS NULL OR pp.day_of_week = p_day_of_week);

    RETURN QUERY
    SELECT
        pp.hour,
        pp.article_count,
        (pp.article_count >= COALESCE(v_threshold, 0)) AS is_peak
    FROM publish_patterns pp
    WHERE pp.region_code = p_region_code
      AND (p_day_of_week IS NULL OR pp.day_of_week = p_day_of_week)
    ORDER BY pp.hour;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. 24-Hour Realtime Monitor Status Table
-- ============================================================
CREATE TABLE IF NOT EXISTS realtime_monitor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_running BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    started_by TEXT,
    total_checks INT DEFAULT 0,
    total_articles_found INT DEFAULT 0,
    total_articles_collected INT DEFAULT 0,
    last_check_at TIMESTAMPTZ,
    last_article_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one row allowed (singleton)
CREATE UNIQUE INDEX IF NOT EXISTS idx_realtime_monitor_singleton
ON realtime_monitor ((true));

-- Insert default row
INSERT INTO realtime_monitor (is_running, config)
VALUES (false, '{"peak_interval": 15, "default_interval": 60, "working_hours_start": 8, "working_hours_end": 19}'::jsonb)
ON CONFLICT DO NOTHING;

-- 8. Monitor activity log
CREATE TABLE IF NOT EXISTS monitor_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    region_code TEXT,
    message TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitor_activity_created ON monitor_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitor_activity_type ON monitor_activity_log(event_type);

ALTER TABLE realtime_monitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for realtime_monitor" ON realtime_monitor FOR ALL USING (true);
CREATE POLICY "Allow all for monitor_activity_log" ON monitor_activity_log FOR ALL USING (true);

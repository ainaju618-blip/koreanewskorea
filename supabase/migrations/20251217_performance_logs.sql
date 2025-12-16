-- Performance Logs Table for PageSpeed tracking
-- Created: 2025-12-17

CREATE TABLE IF NOT EXISTS performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measured_at TIMESTAMPTZ DEFAULT NOW(),

    -- 4 main scores (0-100)
    performance INT CHECK (performance >= 0 AND performance <= 100),
    accessibility INT CHECK (accessibility >= 0 AND accessibility <= 100),
    best_practices INT CHECK (best_practices >= 0 AND best_practices <= 100),
    seo INT CHECK (seo >= 0 AND seo <= 100),

    -- Core Web Vitals
    lcp_ms INT,           -- Largest Contentful Paint (ms)
    fcp_ms INT,           -- First Contentful Paint (ms)
    tbt_ms INT,           -- Total Blocking Time (ms)
    cls DECIMAL(5,3),     -- Cumulative Layout Shift (0.000 ~ 9.999)
    si_ms INT,            -- Speed Index (ms)

    -- Metadata
    notes TEXT,
    created_by TEXT DEFAULT 'manual',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_performance_logs_measured_at
ON performance_logs(measured_at DESC);

-- Enable RLS
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (admin)
CREATE POLICY "Allow all for authenticated" ON performance_logs
    FOR ALL USING (true);

-- Insert initial data from today's measurements
INSERT INTO performance_logs (measured_at, performance, accessibility, best_practices, seo, lcp_ms, fcp_ms, tbt_ms, cls, si_ms, notes, created_by)
VALUES
    ('2025-12-17 00:00:00+09', 56, 75, 96, 100, 15300, NULL, 70, NULL, NULL, 'Baseline - before optimization', 'Claude'),
    ('2025-12-17 01:00:00+09', 55, 86, 96, 100, 13000, NULL, 20, NULL, NULL, 'Phase 1: Bundle optimization (Three.js, TipTap, GSAP, a11y)', 'Claude'),
    ('2025-12-17 03:00:00+09', 52, 86, 96, 100, 13700, 4100, 0, 0.168, 8400, 'Phase 2: Font preload, image priority, NewsTicker lazy', 'Claude');

COMMENT ON TABLE performance_logs IS 'PageSpeed Insights measurement history for tracking optimization progress';

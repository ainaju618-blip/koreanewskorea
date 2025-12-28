-- ============================================
-- Korea NEWS - Full Automation Tables
-- Created: 2025-12-24
-- Purpose: Support for scheduled full automation
-- ============================================

-- ============================================
-- 1. automation_logs - Execution History
-- ============================================
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Run identification
    run_id VARCHAR(50) NOT NULL,           -- Unique run identifier (timestamp-based)

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Status: running, success, failed, partial, stopped
    status VARCHAR(20) DEFAULT 'running',

    -- Statistics
    regions_scraped INTEGER DEFAULT 0,      -- Number of regions processed
    articles_found INTEGER DEFAULT 0,       -- Total articles found
    articles_new INTEGER DEFAULT 0,         -- New articles (not duplicates)
    articles_processed INTEGER DEFAULT 0,   -- AI processed count
    articles_published INTEGER DEFAULT 0,   -- Grade A published
    articles_held INTEGER DEFAULT 0,        -- Grade B/C/D held as draft
    articles_failed INTEGER DEFAULT 0,      -- Processing failures

    -- Detailed breakdown per region
    region_results JSONB,                   -- { "gwangju": { found: 5, new: 3, published: 2 }, ... }

    -- Error information
    error_message TEXT,
    error_details JSONB,

    -- Host info (for debugging)
    host_name VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for automation_logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_started ON automation_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_run_id ON automation_logs(run_id);

-- ============================================
-- 2. automation_locks - Prevent Duplicate Runs
-- ============================================
CREATE TABLE IF NOT EXISTS automation_locks (
    id VARCHAR(50) PRIMARY KEY,             -- Lock identifier (e.g., 'full_automation')
    started_at TIMESTAMPTZ NOT NULL,        -- When lock was acquired
    expires_at TIMESTAMPTZ NOT NULL,        -- When lock auto-expires (safety)
    last_heartbeat TIMESTAMPTZ,             -- Last heartbeat timestamp (for stale detection)
    host_name VARCHAR(100),                 -- Which host acquired the lock
    run_id VARCHAR(50)                      -- Associated run_id for tracking
);

-- Add last_heartbeat column if table already exists (migration)
-- ALTER TABLE automation_locks ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- ============================================
-- 3. site_settings entries for automation
-- ============================================
INSERT INTO site_settings (key, value, description) VALUES
(
    'full_automation_enabled',
    'false',
    'Full automation master switch - true/false'
),
(
    'full_automation_schedule',
    '["09:30","10:30","11:30","12:30","13:30","14:30","15:30","16:30","17:30","18:30","19:30","20:30"]',
    'Scheduled execution times (12 times/day)'
),
(
    'full_automation_last_run',
    '{}',
    'Last run information - { timestamp, status, stats }'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON automation_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert for service" ON automation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for service" ON automation_logs FOR UPDATE USING (true);

ALTER TABLE automation_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service" ON automation_locks FOR ALL USING (true);

-- ============================================
-- Verification
-- ============================================
-- SELECT * FROM automation_logs ORDER BY started_at DESC LIMIT 10;
-- SELECT * FROM automation_locks;
-- SELECT * FROM site_settings WHERE key LIKE 'full_automation%';

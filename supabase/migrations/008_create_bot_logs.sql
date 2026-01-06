-- ============================================================================
-- Bot Logs Table for Scraper Execution Tracking
-- Created: 2026-01-06
-- Purpose: Track scraper execution status and results for each region
-- ============================================================================

CREATE TABLE IF NOT EXISTS bot_logs (
    id BIGSERIAL PRIMARY KEY,
    region VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout', 'success', 'pending', 'stopped')),
    log_message TEXT,
    articles_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bot_logs_region ON bot_logs(region);
CREATE INDEX IF NOT EXISTS idx_bot_logs_status ON bot_logs(status);
CREATE INDEX IF NOT EXISTS idx_bot_logs_created ON bot_logs(created_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_bot_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bot_logs_updated ON bot_logs;
CREATE TRIGGER trigger_bot_logs_updated
    BEFORE UPDATE ON bot_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_bot_logs_updated_at();

-- Enable RLS (optional, can be disabled if service role always used)
ALTER TABLE bot_logs ENABLE ROW LEVEL SECURITY;

-- Policy for service role to access all
CREATE POLICY "Service role can manage bot_logs" ON bot_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy for anon to read
CREATE POLICY "Anon can read bot_logs" ON bot_logs
    FOR SELECT
    TO anon
    USING (true);

COMMENT ON TABLE bot_logs IS 'Tracks scraper execution status and results for each region';

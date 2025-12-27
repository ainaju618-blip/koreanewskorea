-- Job Monitoring Tables for Real-time AI Processing Monitor
-- Created: 2025-12-25

-- ============================================================================
-- Table 1: job_sessions - Each automation run creates one session
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session info
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running',  -- running, completed, failed, cancelled
    trigger_type VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, manual, api

    -- Phase 1: Scraping stats
    scraping_total_regions INT DEFAULT 0,
    scraping_success INT DEFAULT 0,
    scraping_failed INT DEFAULT 0,
    scraping_skipped INT DEFAULT 0,
    scraping_articles_collected INT DEFAULT 0,
    scraping_articles_duplicate INT DEFAULT 0,
    scraping_duration_seconds INT,

    -- Phase 2: AI processing stats
    ai_total_articles INT DEFAULT 0,
    ai_processed INT DEFAULT 0,
    ai_grade_a INT DEFAULT 0,
    ai_grade_b INT DEFAULT 0,
    ai_grade_c INT DEFAULT 0,
    ai_grade_d INT DEFAULT 0,
    ai_published INT DEFAULT 0,
    ai_duration_seconds INT,

    -- Overall stats
    total_duration_seconds INT,
    error_count INT DEFAULT 0,

    -- Metadata for analysis
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table 2: job_logs - Detailed logs for each step
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES job_sessions(id) ON DELETE CASCADE,

    -- Log classification
    phase VARCHAR(20) NOT NULL,  -- scraping, ai_processing, system
    region VARCHAR(50),

    -- Log details
    log_level VARCHAR(10) DEFAULT 'info',  -- debug, info, warning, error
    log_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,

    -- Scraping specific
    article_count INT,
    skip_reason VARCHAR(100),

    -- AI processing specific
    article_id UUID,
    article_title TEXT,
    ai_attempt INT,
    ai_grade VARCHAR(1),
    ai_score INT,

    -- Layer details (for AI processing)
    layer_results JSONB,
    /*
    Example layer_results:
    {
        "layer1_2": {
            "original_facts": {"numbers": [...], "dates": [...], ...},
            "converted_facts": {...},
            "missing": [],
            "added": [],
            "passed": true
        },
        "layer3": {
            "hallucinations": [],
            "llm_response": "...",
            "passed": true
        },
        "layer4": {
            "accuracy": 38,
            "completeness": 28,
            "no_additions": 26,
            "total": 92,
            "passed": true
        },
        "layer5": {
            "ratio": 0.85,
            "passed": true
        }
    }
    */

    -- Performance
    duration_ms INT,

    -- Extra metadata
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for fast queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_job_logs_session ON job_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_phase ON job_logs(phase);
CREATE INDEX IF NOT EXISTS idx_job_logs_created ON job_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_logs_region ON job_logs(region);
CREATE INDEX IF NOT EXISTS idx_job_logs_log_type ON job_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_job_sessions_status ON job_sessions(status);
CREATE INDEX IF NOT EXISTS idx_job_sessions_started ON job_sessions(started_at DESC);

-- ============================================================================
-- Enable Realtime for job_logs table
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE job_logs;

-- ============================================================================
-- Update trigger for job_sessions
-- ============================================================================
CREATE OR REPLACE FUNCTION update_job_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_job_sessions_updated ON job_sessions;
CREATE TRIGGER trigger_job_sessions_updated
    BEFORE UPDATE ON job_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_job_sessions_updated_at();

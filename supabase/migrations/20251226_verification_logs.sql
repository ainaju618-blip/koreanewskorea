-- ============================================================================
-- Korea NEWS Hallucination Verification System
-- Created: 2025-12-26
-- Purpose: Track AI article verification with 4-grade system (A/B/C/D)
-- ============================================================================

-- 1. Verification logs table (each verification attempt)
CREATE TABLE IF NOT EXISTS verification_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    article_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    round INTEGER NOT NULL CHECK (round >= 1 AND round <= 5),
    grade CHAR(1) CHECK (grade IN ('A', 'B', 'C', 'D')),
    summary TEXT,
    improvement TEXT,
    model_used TEXT DEFAULT 'solar:10.7b',
    length_ratio DECIMAL(5,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add verification columns to posts table (if not exists)
DO $$
BEGIN
    -- Add verification_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE posts ADD COLUMN verification_status TEXT DEFAULT 'pending'
            CHECK (verification_status IN ('pending', 'approved', 'rejected', 'reverify'));
    END IF;

    -- Add verification_round column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'verification_round'
    ) THEN
        ALTER TABLE posts ADD COLUMN verification_round INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_article_id ON verification_logs(article_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_grade ON verification_logs(grade);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_verification_status ON posts(verification_status);

-- 4. View: Grade summary by model
CREATE OR REPLACE VIEW verification_grade_summary AS
SELECT
    model_used,
    grade,
    COUNT(*) as count,
    ROUND(AVG(round)::numeric, 2) as avg_round,
    ROUND(AVG(length_ratio)::numeric, 2) as avg_length_ratio,
    ROUND(AVG(processing_time_ms)::numeric, 0) as avg_processing_ms
FROM verification_logs
GROUP BY model_used, grade
ORDER BY model_used, grade;

-- 5. View: Daily pass rate (last 7 days)
CREATE OR REPLACE VIEW daily_pass_rate AS
SELECT
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) FILTER (WHERE grade = 'A')::float / NULLIF(COUNT(*), 0) * 100 as pass_rate,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE grade = 'A') as a_count,
    COUNT(*) FILTER (WHERE grade = 'B') as b_count,
    COUNT(*) FILTER (WHERE grade = 'C') as c_count,
    COUNT(*) FILTER (WHERE grade = 'D') as d_count
FROM verification_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- 6. View: Recent verification status
CREATE OR REPLACE VIEW recent_verifications AS
SELECT
    v.id,
    v.article_id,
    p.title,
    p.region,
    v.round,
    v.grade,
    v.summary,
    v.length_ratio,
    v.processing_time_ms,
    v.model_used,
    v.created_at
FROM verification_logs v
JOIN posts p ON v.article_id = p.id
ORDER BY v.created_at DESC
LIMIT 100;

-- 7. Function: Get verification stats for a date range
CREATE OR REPLACE FUNCTION get_verification_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_verifications BIGINT,
    a_grade_count BIGINT,
    b_grade_count BIGINT,
    c_grade_count BIGINT,
    d_grade_count BIGINT,
    pass_rate DECIMAL(5,2),
    avg_rounds DECIMAL(3,2),
    avg_processing_ms DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_verifications,
        COUNT(*) FILTER (WHERE grade = 'A')::BIGINT as a_grade_count,
        COUNT(*) FILTER (WHERE grade = 'B')::BIGINT as b_grade_count,
        COUNT(*) FILTER (WHERE grade = 'C')::BIGINT as c_grade_count,
        COUNT(*) FILTER (WHERE grade = 'D')::BIGINT as d_grade_count,
        ROUND((COUNT(*) FILTER (WHERE grade = 'A')::numeric / NULLIF(COUNT(*), 0) * 100), 2) as pass_rate,
        ROUND(AVG(round)::numeric, 2) as avg_rounds,
        ROUND(AVG(processing_time_ms)::numeric, 2) as avg_processing_ms
    FROM verification_logs
    WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- 8. Update bot_logs status check constraint (fix the 'success' issue)
DO $$
BEGIN
    -- Drop existing constraint if exists
    ALTER TABLE bot_logs DROP CONSTRAINT IF EXISTS bot_logs_status_check;

    -- Add new constraint with all valid statuses
    ALTER TABLE bot_logs ADD CONSTRAINT bot_logs_status_check
        CHECK (status IN ('running', 'completed', 'failed', 'timeout', 'success', 'pending'));
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, skip
        NULL;
END $$;

-- 9. Comment on tables
COMMENT ON TABLE verification_logs IS 'Stores each AI verification attempt with grade and feedback';
COMMENT ON VIEW verification_grade_summary IS 'Summary of grades by model for performance analysis';
COMMENT ON VIEW daily_pass_rate IS 'Daily A-grade pass rate for monitoring';
COMMENT ON VIEW recent_verifications IS 'Recent verification attempts with article details';

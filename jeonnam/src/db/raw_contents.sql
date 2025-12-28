-- Raw Contents Table for Claude Hub
-- Stores raw content/documents that can be converted to knowledge entries

CREATE TABLE IF NOT EXISTS raw_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'manual',
    project_code TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_raw_contents_project_code ON raw_contents(project_code);
CREATE INDEX IF NOT EXISTS idx_raw_contents_status ON raw_contents(status);
CREATE INDEX IF NOT EXISTS idx_raw_contents_created_at ON raw_contents(created_at DESC);

-- Row Level Security (optional, enable if needed)
-- ALTER TABLE raw_contents ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE raw_contents IS 'Stores raw content/documents for Claude Hub that can be converted to knowledge entries';
COMMENT ON COLUMN raw_contents.status IS 'Status: pending (not processed), processed (converted to knowledge), archived (not needed)';
COMMENT ON COLUMN raw_contents.source_type IS 'Type of source: manual, web, document, code, other';

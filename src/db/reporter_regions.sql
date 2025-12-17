-- Reporter Regions Junction Table
-- Allows reporters to be assigned to multiple regions
-- Created: 2025-12-18

-- Create junction table
CREATE TABLE IF NOT EXISTS reporter_regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Each reporter can only have one entry per region
    UNIQUE(reporter_id, region)
);

-- Index for fast lookups by reporter
CREATE INDEX IF NOT EXISTS idx_reporter_regions_reporter_id
ON reporter_regions(reporter_id);

-- Index for fast lookups by region
CREATE INDEX IF NOT EXISTS idx_reporter_regions_region
ON reporter_regions(region);

-- Ensure only one primary region per reporter
CREATE UNIQUE INDEX IF NOT EXISTS idx_reporter_regions_primary
ON reporter_regions(reporter_id)
WHERE is_primary = true;

-- Function to migrate existing reporter regions to junction table
-- Run this once after creating the table
DO $$
BEGIN
    -- Insert existing regions from reporters table
    INSERT INTO reporter_regions (reporter_id, region, is_primary)
    SELECT id, region, true
    FROM reporters
    WHERE region IS NOT NULL AND region != ''
    ON CONFLICT (reporter_id, region) DO NOTHING;

    RAISE NOTICE 'Migration complete: existing regions migrated to reporter_regions table';
END $$;

-- Helper view for easy querying
CREATE OR REPLACE VIEW reporter_all_regions AS
SELECT
    r.id as reporter_id,
    r.name as reporter_name,
    r.position,
    COALESCE(
        array_agg(rr.region ORDER BY rr.is_primary DESC, rr.region)
        FILTER (WHERE rr.region IS NOT NULL),
        ARRAY[]::text[]
    ) as regions,
    (SELECT region FROM reporter_regions WHERE reporter_id = r.id AND is_primary = true LIMIT 1) as primary_region
FROM reporters r
LEFT JOIN reporter_regions rr ON r.id = rr.reporter_id
GROUP BY r.id, r.name, r.position;

-- Example queries:
--
-- Get all regions for a reporter:
-- SELECT regions FROM reporter_all_regions WHERE reporter_id = 'uuid';
--
-- Get reporters for a specific region:
-- SELECT r.* FROM reporters r
-- JOIN reporter_regions rr ON r.id = rr.reporter_id
-- WHERE rr.region = '광주광역시';
--
-- Add a region to a reporter:
-- INSERT INTO reporter_regions (reporter_id, region, is_primary)
-- VALUES ('reporter-uuid', '전라남도', false);

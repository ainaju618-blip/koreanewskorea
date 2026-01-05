-- Migration: Add region columns to posts table
-- Date: 2026-01-04
-- Description: Add sido_code and sigungu_code for nationwide regional news support

-- Add region columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS sido_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS sigungu_code VARCHAR(30);

-- Add indexes for efficient regional queries
CREATE INDEX IF NOT EXISTS idx_posts_sido_code ON posts(sido_code);
CREATE INDEX IF NOT EXISTS idx_posts_sigungu_code ON posts(sigungu_code);
CREATE INDEX IF NOT EXISTS idx_posts_region_combined ON posts(sido_code, sigungu_code);

-- Add comments for documentation
COMMENT ON COLUMN posts.sido_code IS 'Province/City code (e.g., seoul, busan, gwangju, jeonnam)';
COMMENT ON COLUMN posts.sigungu_code IS 'District code (e.g., gangnam-gu, naju, mokpo)';

-- Update existing posts with region='gwangju' to new structure
UPDATE posts
SET sido_code = 'gwangju', sigungu_code = 'gwangju'
WHERE region = 'gwangju' AND sido_code IS NULL;

-- Update existing posts with region='national' to new structure
UPDATE posts
SET sido_code = 'national', sigungu_code = 'national'
WHERE region = 'national' AND sido_code IS NULL;

-- Update jeonnam regions
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'naju' WHERE region = 'naju' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'mokpo' WHERE region = 'mokpo' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'yeosu' WHERE region = 'yeosu' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'suncheon' WHERE region = 'suncheon' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'gwangyang' WHERE region = 'gwangyang' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'damyang' WHERE region = 'damyang' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'gokseong' WHERE region = 'gokseong' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'gurye' WHERE region = 'gurye' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'goheung' WHERE region = 'goheung' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'boseong' WHERE region = 'boseong' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'hwasun' WHERE region = 'hwasun' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'jangheung' WHERE region = 'jangheung' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'gangjin' WHERE region = 'gangjin' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'haenam' WHERE region = 'haenam' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'yeongam' WHERE region = 'yeongam' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'muan' WHERE region = 'muan' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'hampyeong' WHERE region = 'hampyeong' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'yeonggwang' WHERE region = 'yeonggwang' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'jangseong' WHERE region = 'jangseong' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'wando' WHERE region = 'wando' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'jindo' WHERE region = 'jindo' AND sido_code IS NULL;
UPDATE posts SET sido_code = 'jeonnam', sigungu_code = 'shinan' WHERE region = 'shinan' AND sido_code IS NULL;

-- Migration: Extend tour_spots table
-- Date: 2026-01-05
-- Description: tour_spots에 네비게이션 링크 필드 추가

-- 네비게이션 링크 추가
ALTER TABLE tour_spots
ADD COLUMN IF NOT EXISTS naver_map_url TEXT,
ADD COLUMN IF NOT EXISTS kakao_map_url TEXT,
ADD COLUMN IF NOT EXISTS naver_place_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS kakao_place_id VARCHAR(50);

-- 추가 정보
ALTER TABLE tour_spots
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS opening_hours_text TEXT,
ADD COLUMN IF NOT EXISTS homepage_url TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tour_spots_featured ON tour_spots(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_tour_spots_view_count ON tour_spots(view_count DESC);

-- 코멘트
COMMENT ON COLUMN tour_spots.naver_map_url IS '네이버 지도 길찾기 URL';
COMMENT ON COLUMN tour_spots.kakao_map_url IS '카카오맵 길찾기 URL';

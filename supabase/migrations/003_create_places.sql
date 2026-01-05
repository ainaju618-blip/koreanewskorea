-- Migration: Create places table
-- Date: 2026-01-05
-- Description: 관광명소/맛집/문화유적 테이블

CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    name VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT,

    -- 지역 정보
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region VARCHAR(50),

    -- 분류
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    tags TEXT[],

    -- 위치
    address TEXT NOT NULL,
    address_detail VARCHAR(200),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),

    -- 미디어
    thumbnail_url TEXT,
    images JSONB DEFAULT '[]',

    -- 영업 정보
    opening_hours JSONB,
    closed_days VARCHAR(100),
    price_range VARCHAR(50),
    phone VARCHAR(50),

    -- 네비게이션 링크
    naver_map_url TEXT,
    kakao_map_url TEXT,
    naver_place_id VARCHAR(50),
    kakao_place_id VARCHAR(50),

    -- 추가 정보
    website_url TEXT,
    instagram_url TEXT,

    -- 특산물/메뉴 (맛집용)
    specialties JSONB,
    menu JSONB,

    -- 문화재 정보 (문화유적용)
    heritage_type VARCHAR(50),
    heritage_number VARCHAR(50),
    designated_date DATE,

    -- 평점/리뷰
    rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,

    -- 상태
    status VARCHAR(20) DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,

    -- 출처
    source VARCHAR(100),
    source_id VARCHAR(100),

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_places_region ON places(sido_code, sigungu_code);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_sub_category ON places(sub_category);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_featured ON places(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_places_verified ON places(is_verified) WHERE is_verified = TRUE;

-- RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- 정책
DROP POLICY IF EXISTS "Allow public read places" ON places;
CREATE POLICY "Allow public read places" ON places
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Allow admin full access places" ON places;
CREATE POLICY "Allow admin full access places" ON places
    FOR ALL USING (true);

-- 코멘트
COMMENT ON TABLE places IS '관광명소/맛집/문화유적 정보 테이블';
COMMENT ON COLUMN places.category IS '장소 분류 (restaurant, attraction, heritage, cafe, accommodation)';
COMMENT ON COLUMN places.heritage_type IS '문화재 유형 (국보, 보물, 사적, 시도유형문화재 등)';

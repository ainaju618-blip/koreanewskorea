-- Tour Spots Table for Korea Tourism Organization data
-- Created: 2025-12-28
-- Total: ~3,634 records from TourAPI 4.0

CREATE TABLE IF NOT EXISTS tour_spots (
    id BIGSERIAL PRIMARY KEY,
    content_id VARCHAR(20) UNIQUE NOT NULL,  -- TourAPI contentid

    -- Basic Info
    title VARCHAR(200) NOT NULL,
    content_type VARCHAR(20) NOT NULL,       -- 12=관광지, 14=문화시설, 15=축제, 28=레포츠, 32=숙박, 38=쇼핑, 39=음식점
    content_type_name VARCHAR(50),           -- Korean name

    -- Location
    region_key VARCHAR(30) NOT NULL,         -- e.g., 'gwangju', 'mokpo', 'yeosu'
    region_name VARCHAR(30) NOT NULL,        -- e.g., '광주', '목포시', '여수시'
    area_code VARCHAR(5),                    -- 5=광주, 38=전남
    sigungu_code VARCHAR(5),
    address TEXT,
    zipcode VARCHAR(10),

    -- GPS Coordinates
    map_x DECIMAL(15, 10),                   -- Longitude
    map_y DECIMAL(15, 10),                   -- Latitude

    -- Images
    image_url TEXT,                          -- firstimage
    thumbnail_url TEXT,                      -- firstimage2

    -- Category codes
    cat1 VARCHAR(10),
    cat2 VARCHAR(10),
    cat3 VARCHAR(10),

    -- Timestamps from API
    api_created_at TIMESTAMP,
    api_modified_at TIMESTAMP,

    -- Our timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_tour_spots_region ON tour_spots(region_key);
CREATE INDEX idx_tour_spots_content_type ON tour_spots(content_type);
CREATE INDEX idx_tour_spots_region_type ON tour_spots(region_key, content_type);

-- Enable Row Level Security
ALTER TABLE tour_spots ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON tour_spots
    FOR SELECT USING (true);

-- Comment
COMMENT ON TABLE tour_spots IS 'Tourism spots from Korea Tourism Organization TourAPI 4.0 - Gwangju/Jeonnam region';

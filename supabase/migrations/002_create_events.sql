-- Migration: Create events table
-- Date: 2026-01-05
-- Description: 지역 행사/축제 테이블

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT,

    -- 지역 정보
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region VARCHAR(50),

    -- 일정
    event_date DATE NOT NULL,
    end_date DATE,
    event_time VARCHAR(100),

    -- 장소
    location VARCHAR(200),
    address TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),

    -- 미디어
    thumbnail_url TEXT,
    images JSONB DEFAULT '[]',

    -- 분류
    category VARCHAR(50),
    tags TEXT[],

    -- 연락처/링크
    contact VARCHAR(100),
    website_url TEXT,
    booking_url TEXT,

    -- 출처
    source VARCHAR(100),
    source_url TEXT,

    -- 상태
    status VARCHAR(20) DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_events_region ON events(sido_code, sigungu_code);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(event_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 정책
DROP POLICY IF EXISTS "Allow public read events" ON events;
CREATE POLICY "Allow public read events" ON events
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Allow admin full access events" ON events;
CREATE POLICY "Allow admin full access events" ON events
    FOR ALL USING (true);

-- 코멘트
COMMENT ON TABLE events IS '지역 행사/축제 정보 테이블';
COMMENT ON COLUMN events.sido_code IS '시/도 코드 (예: jeonnam, gwangju)';
COMMENT ON COLUMN events.sigungu_code IS '시/군/구 코드 (예: naju, jindo)';
COMMENT ON COLUMN events.category IS '행사 분류 (축제, 전시, 공연, 체육, 교육 등)';

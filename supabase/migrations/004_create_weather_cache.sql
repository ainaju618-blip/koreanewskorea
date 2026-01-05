-- Migration: Create weather_cache table
-- Date: 2026-01-05
-- Description: 날씨 캐시 테이블

CREATE TABLE IF NOT EXISTS weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 지역
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region_key VARCHAR(50) NOT NULL UNIQUE,

    -- 현재 날씨
    current_temp DECIMAL(4, 1),
    feels_like DECIMAL(4, 1),
    humidity INTEGER,
    wind_speed DECIMAL(4, 1),
    weather_code VARCHAR(20),
    weather_desc VARCHAR(100),
    weather_icon VARCHAR(20),

    -- 일일 정보
    temp_min DECIMAL(4, 1),
    temp_max DECIMAL(4, 1),
    sunrise TIME,
    sunset TIME,

    -- 대기질
    pm10 INTEGER,
    pm25 INTEGER,
    air_quality VARCHAR(20),

    -- 예보 데이터
    hourly_forecast JSONB,
    daily_forecast JSONB,

    -- 메타
    api_source VARCHAR(50),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 hours'),

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_weather_region ON weather_cache(sido_code, sigungu_code);
CREATE INDEX IF NOT EXISTS idx_weather_expires ON weather_cache(expires_at);

-- RLS
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- 정책
DROP POLICY IF EXISTS "Allow public read weather" ON weather_cache;
CREATE POLICY "Allow public read weather" ON weather_cache
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access weather" ON weather_cache;
CREATE POLICY "Allow admin full access weather" ON weather_cache
    FOR ALL USING (true);

-- 코멘트
COMMENT ON TABLE weather_cache IS '지역별 날씨 캐시 테이블';
COMMENT ON COLUMN weather_cache.region_key IS '복합키: sido_sigungu (예: jeonnam_naju)';
COMMENT ON COLUMN weather_cache.expires_at IS '캐시 만료 시간 (기본 3시간)';

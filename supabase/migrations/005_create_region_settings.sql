-- Migration: Create region_news_settings table
-- Date: 2026-01-05
-- Description: 지역별 뉴스 설정 테이블

CREATE TABLE IF NOT EXISTS region_news_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 지역
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region_key VARCHAR(50) NOT NULL UNIQUE,

    -- 표시 설정
    display_name VARCHAR(100),
    hero_image_url TEXT,
    hero_gradient VARCHAR(100),
    theme_color VARCHAR(20),

    -- 카테고리 매핑
    category_mapping JSONB DEFAULT '{}',

    -- 섹션 활성화
    sections_enabled JSONB DEFAULT '{
        "news": true,
        "weather": true,
        "events": true,
        "places": true,
        "food": true,
        "heritage": true
    }',

    -- SEO
    meta_title VARCHAR(200),
    meta_description TEXT,

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_region_settings_active ON region_news_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_region_settings_sido ON region_news_settings(sido_code);

-- RLS
ALTER TABLE region_news_settings ENABLE ROW LEVEL SECURITY;

-- 정책
DROP POLICY IF EXISTS "Allow public read region_settings" ON region_news_settings;
CREATE POLICY "Allow public read region_settings" ON region_news_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access region_settings" ON region_news_settings;
CREATE POLICY "Allow admin full access region_settings" ON region_news_settings
    FOR ALL USING (true);

-- 코멘트
COMMENT ON TABLE region_news_settings IS '지역별 뉴스 페이지 설정';

-- 초기 데이터: 나주, 진도
INSERT INTO region_news_settings (sido_code, sigungu_code, region_key, display_name, hero_image_url, hero_gradient, theme_color, meta_title, meta_description)
VALUES
    ('jeonnam', 'naju', 'jeonnam_naju', '나주시', '/images/hero/naju-hero.png', 'from-emerald-600 to-teal-500', 'emerald', '나주시 뉴스 - 코리아뉴스', '나주시 시정소식, 행사, 관광, 맛집 정보를 한눈에'),
    ('jeonnam', 'jindo', 'jeonnam_jindo', '진도군', '/images/hero/jindo-hero.png', 'from-teal-600 to-cyan-500', 'teal', '진도군 뉴스 - 코리아뉴스', '진도군 군정소식, 신비의 바닷길, 진도개, 진도아리랑 정보'),
    ('jeonnam', 'mokpo', 'jeonnam_mokpo', '목포시', '/images/hero/mokpo-hero.png', 'from-blue-600 to-cyan-500', 'blue', '목포시 뉴스 - 코리아뉴스', '목포시 시정소식, 항구도시의 맛과 멋'),
    ('jeonnam', 'yeosu', 'jeonnam_yeosu', '여수시', '/images/hero/yeosu-hero.png', 'from-indigo-600 to-purple-500', 'indigo', '여수시 뉴스 - 코리아뉴스', '여수시 시정소식, 여수밤바다와 해양관광'),
    ('jeonnam', 'suncheon', 'jeonnam_suncheon', '순천시', '/images/hero/suncheon-hero.png', 'from-emerald-600 to-green-500', 'green', '순천시 뉴스 - 코리아뉴스', '순천시 시정소식, 순천만 생태관광'),
    ('gwangju', 'gwangju', 'gwangju_gwangju', '광주광역시', '/images/hero/gwangju-hero.png', 'from-rose-600 to-pink-500', 'rose', '광주광역시 뉴스 - 코리아뉴스', '광주광역시 시정소식, 문화예술의 도시')
ON CONFLICT (region_key) DO NOTHING;

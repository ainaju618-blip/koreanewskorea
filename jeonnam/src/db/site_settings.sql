-- ============================================
-- Korea NEWS - site_settings 테이블
-- 히어로 슬라이더 등 사이트 전역 설정 저장
-- ============================================

-- site_settings 테이블 생성
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 설정 키 (고유)
    key TEXT UNIQUE NOT NULL,

    -- 설정 값 (JSON 형태로 저장)
    value JSONB NOT NULL DEFAULT '{}',

    -- 설명
    description TEXT,

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- RLS 정책
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON site_settings FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON site_settings FOR DELETE USING (true);

-- ============================================
-- 초기 데이터: 히어로 슬라이더 설정
-- ============================================
INSERT INTO site_settings (key, value, description) VALUES
(
    'hero_slider',
    '{
        "regions": ["gwangju", "jeonnam", "naju", "suncheon", "gwangyang", "gwangju"],
        "interval": 4000,
        "enabled": true
    }',
    'Hero Slider Settings - regions: region codes, interval: ms, enabled: on/off'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 확인
-- ============================================
-- SELECT * FROM site_settings;

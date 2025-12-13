-- =============================================
-- 홈페이지 개인화 시스템 DB 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 개인화 전역 설정
CREATE TABLE IF NOT EXISTS personalization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES reporters(id)
);

-- 초기 데이터
INSERT INTO personalization_settings (setting_key, setting_value) VALUES
('boost', '{"enabled": true, "priority": 1}'),
('geolocation', '{"enabled": true, "priority": 3, "weight": 1.5}'),
('behavior', '{"enabled": true, "priority": 4, "learningDays": 30, "minViewCount": 5}'),
('regionWeights', '{"enabled": true, "priority": 2}')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. 부스트 설정 (예약 시스템)
CREATE TABLE IF NOT EXISTS boost_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boost_type VARCHAR(20) NOT NULL,  -- 'region' | 'article' | 'category'
    target_value VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    repeat_type VARCHAR(20) DEFAULT 'none',  -- 'none' | 'daily' | 'weekly'
    repeat_days INTEGER[],
    memo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES reporters(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 지역별 상시 가중치
CREATE TABLE IF NOT EXISTS region_weights (
    region_code VARCHAR(20) PRIMARY KEY,
    region_name VARCHAR(20) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0.5 AND weight <= 3.0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 (24개 지역)
INSERT INTO region_weights (region_code, region_name, weight) VALUES
('gwangju', '광주광역시', 1.0),
('jeonnam', '전라남도', 1.0),
('naju', '나주시', 1.3),
('mokpo', '목포시', 1.0),
('yeosu', '여수시', 1.0),
('suncheon', '순천시', 1.0),
('gwangyang', '광양시', 1.0),
('damyang', '담양군', 1.0),
('gokseong', '곡성군', 1.0),
('gurye', '구례군', 1.0),
('goheung', '고흥군', 1.0),
('boseong', '보성군', 1.0),
('hwasun', '화순군', 1.0),
('jangheung', '장흥군', 1.0),
('gangjin', '강진군', 1.0),
('haenam', '해남군', 1.0),
('yeongam', '영암군', 1.0),
('muan', '무안군', 1.0),
('hampyeong', '함평군', 1.0),
('yeonggwang', '영광군', 1.0),
('jangseong', '장성군', 1.0),
('wando', '완도군', 1.0),
('jindo', '진도군', 1.0),
('shinan', '신안군', 1.0)
ON CONFLICT (region_code) DO NOTHING;

-- 4. 사용자 행동 로그 (비로그인: session_id, 로그인: user_id)
CREATE TABLE IF NOT EXISTS user_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100),
    user_id UUID,
    article_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    region_code VARCHAR(20),
    category VARCHAR(50),
    action VARCHAR(20) NOT NULL,  -- 'view' | 'click' | 'share'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_user_identity CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

-- 5. 로그인 사용자 개인화 프로필
CREATE TABLE IF NOT EXISTS user_personalization_profiles (
    user_id UUID PRIMARY KEY,
    preferred_region VARCHAR(20),
    region_views JSONB DEFAULT '{}',
    category_views JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_boost_active ON boost_schedules(is_active, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_behavior_session ON user_behavior_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_user ON user_behavior_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_article ON user_behavior_logs(article_id);

-- RLS 정책 (선택사항 - 필요시 활성화)
-- ALTER TABLE personalization_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE boost_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE region_weights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_behavior_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_personalization_profiles ENABLE ROW LEVEL SECURITY;

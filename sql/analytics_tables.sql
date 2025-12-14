-- ============================================================
-- 사용자 분석 시스템 - 데이터베이스 테이블 생성
-- Korea NEWS Project
-- 실행: Supabase SQL Editor
-- ============================================================

-- 1. 페이지뷰 로그 테이블
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 페이지 정보
    path TEXT NOT NULL,
    page_type TEXT,
    article_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    category TEXT,

    -- 사용자 식별 (익명)
    session_id TEXT NOT NULL,
    visitor_id TEXT,

    -- 유입 정보
    referrer TEXT,
    referrer_domain TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    -- 디바이스 정보
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,

    -- 위치 정보
    ip_hash TEXT,
    country TEXT,
    region TEXT,
    city TEXT,

    -- 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 체류 시간
    duration_seconds INTEGER,
    scroll_depth INTEGER
);

-- 2. 사용자 이벤트 로그 테이블
CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 이벤트 정보
    event_type TEXT NOT NULL,
    event_category TEXT,
    event_action TEXT,
    event_label TEXT,
    event_value INTEGER,

    -- 대상 정보
    target_path TEXT,
    target_element TEXT,
    article_id UUID REFERENCES posts(id) ON DELETE SET NULL,

    -- 사용자 식별
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    page_view_id UUID REFERENCES page_views(id) ON DELETE SET NULL,

    -- 컨텍스트
    current_path TEXT,

    -- 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 검색어 로그 테이블
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 검색 정보
    query TEXT NOT NULL,
    query_normalized TEXT,
    results_count INTEGER,

    -- 사용자 행동
    clicked_article_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    clicked_position INTEGER,

    -- 사용자 식별
    session_id TEXT NOT NULL,
    visitor_id TEXT,

    -- 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 인덱스 생성
-- ============================================================

-- page_views 인덱스
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON page_views(page_type);
CREATE INDEX IF NOT EXISTS idx_page_views_article_id ON page_views(article_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON page_views(device_type);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer_domain ON page_views(referrer_domain);

-- user_events 인덱스
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_article_id ON user_events(article_id);

-- search_logs 인덱스
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_query_normalized ON search_logs(query_normalized);

-- ============================================================
-- RLS 정책 (Row Level Security)
-- ============================================================

-- RLS 활성화
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- 서비스 역할에서 전체 접근 허용 (API 사용)
CREATE POLICY "Service role full access" ON page_views FOR ALL USING (true);
CREATE POLICY "Service role full access" ON user_events FOR ALL USING (true);
CREATE POLICY "Service role full access" ON search_logs FOR ALL USING (true);

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT 'Analytics tables created successfully!' as message;

-- scraper_sources 테이블 생성
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS scraper_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,                     -- 소스명 (예: "나주시청 보도자료")
    type TEXT NOT NULL DEFAULT 'web',       -- 'rss' or 'web'
    url TEXT NOT NULL,                      -- 수집 대상 URL
    region TEXT,                            -- 지역 태그 (naju, gwangju 등)
    category TEXT DEFAULT 'local',          -- 카테고리 (local, education 등)
    active BOOLEAN DEFAULT true,            -- 활성화 여부
    last_fetched_at TIMESTAMPTZ,            -- 마지막 수집 시각
    articles_count INTEGER DEFAULT 0,       -- 수집된 기사 수
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 (관리자 전용)
ALTER TABLE scraper_sources ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 인증 사용자
CREATE POLICY "Allow read for authenticated users" ON scraper_sources
    FOR SELECT USING (true);

-- 쓰기 정책: 인증된 사용자만
CREATE POLICY "Allow insert for authenticated users" ON scraper_sources
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON scraper_sources
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated users" ON scraper_sources
    FOR DELETE USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_scraper_sources_region ON scraper_sources(region);
CREATE INDEX IF NOT EXISTS idx_scraper_sources_active ON scraper_sources(active);

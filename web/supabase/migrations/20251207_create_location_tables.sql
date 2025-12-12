-- =========================================================
-- 남도 다이소 (Namdo Daeso) - 위치 기반 서비스 DB 스키마
-- Phase 1: Foundation - Location Tables
-- Author: Opus 4.5
-- Date: 2025-12-07
-- =========================================================

-- Note: PostGIS 익스텐션은 Supabase에서 기본 제공됨
-- 필요 시 다음 명령어로 활성화: CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================================================
-- 1. locations 테이블 (장소 정보)
-- =========================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 기본 정보
  name TEXT NOT NULL,                 -- 장소명 (예: "나주곰탕 하얀집")
  category TEXT NOT NULL CHECK (category IN ('FESTIVAL', 'FOOD', 'SPOT', 'STAY', 'OUTING')),
  
  -- 좌표 정보
  lat FLOAT8 NOT NULL,                -- 위도 (Latitude)
  lng FLOAT8 NOT NULL,                -- 경도 (Longitude)
  address TEXT,                        -- 전체 주소
  
  -- 미디어 및 태그
  images TEXT[],                       -- 이미지 URL 배열
  tags TEXT[],                         -- 검색 태그 (예: ['주차가능', '키즈존'])
  
  -- 부가 정보
  meta JSONB DEFAULT '{}',             -- 추가 데이터 (운영시간, 연락처, 행사일정 등)
  curation TEXT,                       -- 기자 큐레이션 코멘트 ("점심에 방문하기 좋음")
  
  -- 상태 관리
  region TEXT,                         -- 지역 코드 (예: 'naju', 'mokpo')
  is_verified BOOLEAN DEFAULT false,   -- 검증된 장소 여부
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(lat, lng);

-- =========================================================
-- 2. location_articles 테이블 (장소-기사 연결)
-- =========================================================
CREATE TABLE IF NOT EXISTS location_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  article_id BIGINT NOT NULL,         -- posts 테이블의 article_id 참조
  
  -- 연결 메타데이터  
  link_type TEXT DEFAULT 'manual',    -- 연결 유형: 'manual' (수동) | 'auto' (자동 태깅)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 중복 연결 방지
  UNIQUE(location_id, article_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_location_articles_location ON location_articles(location_id);
CREATE INDEX IF NOT EXISTS idx_location_articles_article ON location_articles(article_id);

-- =========================================================
-- 3. RLS 정책 (Row Level Security)
-- =========================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_articles ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자 허용 (공개 지도 서비스)
CREATE POLICY "Allow public read access to locations" ON locations 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to location_articles" ON location_articles 
  FOR SELECT USING (true);

-- 쓰기: 인증된 사용자만 허용 (관리자)
CREATE POLICY "Allow authenticated write access to locations" ON locations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write access to location_articles" ON location_articles 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 4. 업데이트 트리거 (updated_at 자동 갱신)
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 실행 완료 메시지
-- =========================================================
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요.
-- PostGIS가 필요한 경우: CREATE EXTENSION IF NOT EXISTS postgis;

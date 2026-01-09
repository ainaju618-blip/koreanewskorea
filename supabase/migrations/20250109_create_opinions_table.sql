-- =====================================================
-- 나주 인사이트 365 - opinions 테이블 생성
-- 에너지 밸리 파워 (60%) + 스마트 농업 리포트 (40%)
-- =====================================================

-- opinions 테이블 생성
CREATE TABLE IF NOT EXISTS opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  title TEXT NOT NULL,
  summary TEXT NOT NULL,  -- 3문장 요약 (헤밍웨이 스타일)
  content TEXT,           -- 전체 본문

  -- 기고자 정보
  author_name TEXT NOT NULL,
  author_position TEXT,   -- 직책 (사장, 본부장 등)
  author_organization TEXT, -- 소속 (한국전력공사, 농어촌공사 등)
  author_avatar TEXT,     -- 프로필 이미지 URL
  author_bio TEXT,        -- 기고자 소개

  -- 분류
  category TEXT NOT NULL CHECK (category IN ('energy', 'agriculture')),
  region TEXT DEFAULT 'naju',
  tags TEXT[],            -- 태그 배열

  -- 미디어
  thumbnail_url TEXT,

  -- 상태
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,

  -- 통계
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- 날짜
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_opinions_region ON opinions(region);
CREATE INDEX IF NOT EXISTS idx_opinions_category ON opinions(category);
CREATE INDEX IF NOT EXISTS idx_opinions_status ON opinions(status);
CREATE INDEX IF NOT EXISTS idx_opinions_published_at ON opinions(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opinions_is_featured ON opinions(is_featured);

-- RLS 정책
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Public read access for published opinions"
  ON opinions FOR SELECT
  USING (status = 'published');

-- 관리자 전체 접근 정책 (service_role)
CREATE POLICY "Service role full access"
  ON opinions FOR ALL
  USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_opinions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opinions_updated_at
  BEFORE UPDATE ON opinions
  FOR EACH ROW
  EXECUTE FUNCTION update_opinions_updated_at();

-- 코멘트
COMMENT ON TABLE opinions IS '나주 인사이트 365 오피니언 테이블';
COMMENT ON COLUMN opinions.category IS 'energy: 에너지 밸리 파워, agriculture: 스마트 농업 리포트';
COMMENT ON COLUMN opinions.summary IS '3문장 요약 (헤밍웨이 스타일 디지털 포맷)';

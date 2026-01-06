-- ============================================================
-- posts 테이블 생성 (koreanewskorea 전국판)
-- 실행: Supabase SQL Editor에서 직접 실행
-- ============================================================

-- 1. posts 테이블 생성
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    title VARCHAR(500) NOT NULL,
    content TEXT,
    original_link TEXT UNIQUE NOT NULL,

    -- 출처 정보
    source VARCHAR(100),
    department VARCHAR(100),

    -- 분류
    category VARCHAR(50) DEFAULT '뉴스',
    category_id UUID,

    -- 지역
    region VARCHAR(50),
    sido_code VARCHAR(20),
    sigungu_code VARCHAR(30),

    -- 미디어
    thumbnail_url TEXT,

    -- AI 처리
    ai_summary TEXT,
    ai_title TEXT,
    ai_keywords TEXT[],

    -- SEO
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords TEXT[],
    slug VARCHAR(300),

    -- 기자/작성자
    author_id UUID,
    author_name VARCHAR(100),
    reporter_id UUID,

    -- 상태
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected', 'archived', 'trash', 'hidden')),

    -- 통계
    view_count INTEGER DEFAULT 0,

    -- 날짜
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_region ON public.posts(region);
CREATE INDEX IF NOT EXISTS idx_posts_sido_code ON public.posts(sido_code);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_original_link ON public.posts(original_link);

-- 3. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS 정책
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용 (published만)
CREATE POLICY "Posts are viewable by everyone" ON public.posts
    FOR SELECT USING (status = 'published' OR status = 'draft');

-- Service role은 모든 작업 가능
CREATE POLICY "Service role has full access" ON public.posts
    FOR ALL USING (auth.role() = 'service_role');

-- 5. categories 테이블 (필요시)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 카테고리 삽입
INSERT INTO public.categories (name, slug, sort_order) VALUES
    ('정책', 'policy', 1),
    ('경제', 'economy', 2),
    ('사회', 'society', 3),
    ('문화', 'culture', 4),
    ('외교안보', 'diplomacy', 5),
    ('지역', 'region', 6)
ON CONFLICT (slug) DO NOTHING;

-- 완료 메시지
SELECT 'posts 테이블 생성 완료' as message;

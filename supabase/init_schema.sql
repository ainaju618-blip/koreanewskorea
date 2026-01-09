-- ============================================================
-- koreanewskorea 개발서버 전용 스키마
-- Supabase SQL Editor에서 실행
-- Project: ainaju618-blip's Project (ebagdrupjfwkawbwqjjg)
-- ============================================================

-- ============================================================
-- 1. profiles 테이블 (Supabase Auth 연동)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. reporters 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- 기본 정보
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'reporter',
    position VARCHAR(100) DEFAULT 'reporter',
    region VARCHAR(100) DEFAULT '전체',

    -- 연락처
    phone VARCHAR(50),
    email VARCHAR(255),

    -- 프로필
    bio TEXT,
    profile_image TEXT,
    avatar_icon VARCHAR(10) DEFAULT '👤',

    -- 로그인
    password_hash VARCHAR(255),

    -- 상태/권한
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    access_level INTEGER DEFAULT 1,

    -- E-E-A-T 필드
    slug VARCHAR(100) UNIQUE,
    department VARCHAR(100),
    specialties TEXT[],
    career_years INTEGER DEFAULT 0,
    awards TEXT[],

    -- SNS
    sns_twitter VARCHAR(200),
    sns_facebook VARCHAR(200),
    sns_linkedin VARCHAR(200),

    -- 공개 설정
    is_public BOOLEAN DEFAULT true,

    -- 통계
    subscriber_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,

    -- AI 설정
    ai_settings JSONB,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reporters_name ON public.reporters(name);
CREATE INDEX IF NOT EXISTS idx_reporters_region ON public.reporters(region);
CREATE INDEX IF NOT EXISTS idx_reporters_status ON public.reporters(status);
CREATE INDEX IF NOT EXISTS idx_reporters_slug ON public.reporters(slug);
CREATE INDEX IF NOT EXISTS idx_reporters_user_id ON public.reporters(user_id);

-- RLS
ALTER TABLE public.reporters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters are viewable by everyone" ON public.reporters
    FOR SELECT USING (true);
CREATE POLICY "Service role has full access to reporters" ON public.reporters
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. categories 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id),
    sort_order INTEGER DEFAULT 0,
    custom_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 기본 카테고리 삽입
INSERT INTO public.categories (name, slug, sort_order) VALUES
    ('정치', 'politics', 1),
    ('경제', 'economy', 2),
    ('사회', 'society', 3),
    ('문화', 'culture', 4),
    ('스포츠', 'sports', 5),
    ('인물', 'people', 6),
    ('오피니언', 'opinion', 7),
    ('AI', 'ai', 8),
    ('교육', 'edu', 9),
    ('전남', 'jeonnam', 10),
    ('광주', 'gwangju', 11),
    ('나주', 'naju', 12)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

-- ============================================================
-- 4. posts 테이블 (기사)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    title VARCHAR(500) NOT NULL,
    content TEXT,
    original_link TEXT UNIQUE,

    -- 출처 정보
    source VARCHAR(100),
    department VARCHAR(100),

    -- 분류
    category VARCHAR(50) DEFAULT '뉴스',
    category_id UUID REFERENCES public.categories(id),

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
    author_id UUID REFERENCES public.profiles(id),
    author_name VARCHAR(100),
    reporter_id UUID REFERENCES public.reporters(id),

    -- 상태
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected', 'archived', 'trash', 'hidden')),

    -- 통계
    view_count INTEGER DEFAULT 0,

    -- 날짜
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_region ON public.posts(region);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_source ON public.posts(source);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_reporter_id ON public.posts(reporter_id);

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (status = 'published' OR status = 'draft');
CREATE POLICY "Service role has full access to posts" ON public.posts
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. updated_at 자동 업데이트 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- posts 트리거
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reporters 트리거
DROP TRIGGER IF EXISTS update_reporters_updated_at ON public.reporters;
CREATE TRIGGER update_reporters_updated_at
    BEFORE UPDATE ON public.reporters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- profiles 트리거
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. site_settings 테이블 (사이트 설정)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings
    FOR SELECT USING (true);
CREATE POLICY "Service role has full access to site_settings" ON public.site_settings
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 7. bot_logs 테이블 (봇 로그)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_name VARCHAR(100),
    action VARCHAR(100),
    status VARCHAR(50),
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON public.bot_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_logs_bot_name ON public.bot_logs(bot_name);

-- RLS
ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot logs are viewable by everyone" ON public.bot_logs
    FOR SELECT USING (true);
CREATE POLICY "Service role has full access to bot_logs" ON public.bot_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '스키마 생성 완료!' as message,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;

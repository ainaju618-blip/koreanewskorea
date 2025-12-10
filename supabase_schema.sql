-- ================================================
-- Korea NEWS - posts 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. posts 테이블 생성
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    ai_summary TEXT,
    category TEXT DEFAULT 'News',
    original_link TEXT,
    source TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,  -- Phase 3: 조회수
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_original_link ON public.posts(original_link);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count DESC);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 - 누구나 읽기 가능
DROP POLICY IF EXISTS "Anyone can read posts" ON public.posts;
CREATE POLICY "Anyone can read posts" ON public.posts
    FOR SELECT USING (true);

-- 5. RLS 정책 - INSERT 허용
DROP POLICY IF EXISTS "Allow insert for anon" ON public.posts;
CREATE POLICY "Allow insert for anon" ON public.posts
    FOR INSERT WITH CHECK (true);

-- 6. RLS 정책 - UPDATE 허용
DROP POLICY IF EXISTS "Allow update for anon" ON public.posts;
CREATE POLICY "Allow update for anon" ON public.posts
    FOR UPDATE USING (true) WITH CHECK (true);

-- 7. RLS 정책 - DELETE 허용
DROP POLICY IF EXISTS "Allow delete for anon" ON public.posts;
CREATE POLICY "Allow delete for anon" ON public.posts
    FOR DELETE USING (true);

-- ================================================
-- Phase 3: 조회수 증가 함수
-- ================================================
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = post_id;
END;
$$;

-- 기존 테이블에 view_count 컬럼 추가 (마이그레이션용)
-- ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 확인 쿼리
SELECT 'posts 테이블이 성공적으로 생성되었습니다!' AS message;

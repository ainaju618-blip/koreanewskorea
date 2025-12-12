-- ================================================
-- Korea NEWS - view_count 컬럼 추가 (마이그레이션)
-- 기존 posts 테이블에 view_count 컬럼 추가
-- ================================================

-- 1. view_count 컬럼 추가
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. 인덱스 추가 (인기기사 정렬용)
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count DESC);

-- 3. 조회수 증가 RPC 함수
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

-- 확인
SELECT 'view_count 컬럼이 추가되었습니다!' AS message;

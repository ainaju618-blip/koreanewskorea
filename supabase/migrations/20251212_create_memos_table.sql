-- memos 테이블 생성
-- 실행: Supabase Dashboard > SQL Editor에서 실행

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '새 메모',
    content TEXT DEFAULT '',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_memos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_memos_updated_at ON public.memos;
CREATE TRIGGER trigger_memos_updated_at
    BEFORE UPDATE ON public.memos
    FOR EACH ROW
    EXECUTE FUNCTION update_memos_updated_at();

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON public.memos(user_id);
CREATE INDEX IF NOT EXISTS idx_memos_updated_at ON public.memos(updated_at DESC);

-- 4. RLS 활성화
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 (supabaseAdmin은 우회하므로 API에서 직접 사용 가능)
-- 일반 사용자용 정책
DROP POLICY IF EXISTS "memos_select_own" ON public.memos;
DROP POLICY IF EXISTS "memos_insert_own" ON public.memos;
DROP POLICY IF EXISTS "memos_update_own" ON public.memos;
DROP POLICY IF EXISTS "memos_delete_own" ON public.memos;

CREATE POLICY "memos_select_own" ON public.memos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "memos_insert_own" ON public.memos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memos_update_own" ON public.memos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "memos_delete_own" ON public.memos
    FOR DELETE USING (auth.uid() = user_id);

-- 확인
SELECT 'memos 테이블 생성 완료' as result;

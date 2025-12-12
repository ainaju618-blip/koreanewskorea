-- memos 테이블에 user_id 컬럼 추가 (본인만 조회 가능하도록)
-- 실행: Supabase Dashboard > SQL Editor에서 실행

-- 1. user_id 컬럼 추가
ALTER TABLE public.memos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON public.memos(user_id);

-- 3. RLS 정책 업데이트 (기존 정책 삭제 후 재생성)
DROP POLICY IF EXISTS "memos_select_policy" ON public.memos;
DROP POLICY IF EXISTS "memos_insert_policy" ON public.memos;
DROP POLICY IF EXISTS "memos_update_policy" ON public.memos;
DROP POLICY IF EXISTS "memos_delete_policy" ON public.memos;

-- 본인 메모만 조회
CREATE POLICY "memos_select_own" ON public.memos
    FOR SELECT USING (auth.uid() = user_id);

-- 본인 메모만 생성 (user_id 자동 설정)
CREATE POLICY "memos_insert_own" ON public.memos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 메모만 수정
CREATE POLICY "memos_update_own" ON public.memos
    FOR UPDATE USING (auth.uid() = user_id);

-- 본인 메모만 삭제
CREATE POLICY "memos_delete_own" ON public.memos
    FOR DELETE USING (auth.uid() = user_id);

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'memos';

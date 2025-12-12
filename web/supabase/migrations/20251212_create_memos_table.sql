-- ================================================
-- Korea NEWS - memos 테이블 생성 스크립트
-- 기사 초안 저장용 테이블
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. memos 테이블 생성
CREATE TABLE IF NOT EXISTS public.memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,                        -- 초안 제목
    content TEXT,                               -- 본문 (HTML 포함)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_memos_updated_at ON public.memos(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON public.memos(created_at DESC);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 - 누구나 읽기 가능
DROP POLICY IF EXISTS "Anyone can read memos" ON public.memos;
CREATE POLICY "Anyone can read memos" ON public.memos
    FOR SELECT USING (true);

-- 5. RLS 정책 - INSERT 허용
DROP POLICY IF EXISTS "Allow insert for memos" ON public.memos;
CREATE POLICY "Allow insert for memos" ON public.memos
    FOR INSERT WITH CHECK (true);

-- 6. RLS 정책 - UPDATE 허용
DROP POLICY IF EXISTS "Allow update for memos" ON public.memos;
CREATE POLICY "Allow update for memos" ON public.memos
    FOR UPDATE USING (true) WITH CHECK (true);

-- 7. RLS 정책 - DELETE 허용
DROP POLICY IF EXISTS "Allow delete for memos" ON public.memos;
CREATE POLICY "Allow delete for memos" ON public.memos
    FOR DELETE USING (true);

-- 8. updated_at 자동 업데이트 트리거
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

-- 확인
SELECT 'memos 테이블이 성공적으로 생성되었습니다!' AS message;

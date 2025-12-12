-- ================================================
-- Korea NEWS - agencies 테이블 생성 스크립트
-- 각 기관의 보도자료 URL 및 홍보담당자 정보 저장
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. agencies 테이블 생성
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_code TEXT UNIQUE NOT NULL,       -- 'gwangju', 'naju' 등 (스크래퍼 식별자)
    name TEXT NOT NULL,                     -- '광주광역시', '나주시' 등
    category TEXT DEFAULT '전남',            -- 분류 (광주/전남/교육청)
    base_url TEXT,                          -- 기관 홈페이지 URL
    press_release_url TEXT,                 -- 보도자료 페이지 URL (핵심!)
    contact_department TEXT,                -- 담당부서
    contact_person TEXT,                    -- 담당자명
    contact_phone TEXT,                     -- 전화번호
    contact_email TEXT,                     -- 이메일
    is_active BOOLEAN DEFAULT true,         -- 스크래핑 활성화 여부
    notes TEXT,                             -- 관리자 메모
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_agencies_region_code ON public.agencies(region_code);
CREATE INDEX IF NOT EXISTS idx_agencies_category ON public.agencies(category);
CREATE INDEX IF NOT EXISTS idx_agencies_is_active ON public.agencies(is_active);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 - 누구나 읽기 가능
DROP POLICY IF EXISTS "Anyone can read agencies" ON public.agencies;
CREATE POLICY "Anyone can read agencies" ON public.agencies
    FOR SELECT USING (true);

-- 5. RLS 정책 - INSERT 허용
DROP POLICY IF EXISTS "Allow insert for agencies" ON public.agencies;
CREATE POLICY "Allow insert for agencies" ON public.agencies
    FOR INSERT WITH CHECK (true);

-- 6. RLS 정책 - UPDATE 허용
DROP POLICY IF EXISTS "Allow update for agencies" ON public.agencies;
CREATE POLICY "Allow update for agencies" ON public.agencies
    FOR UPDATE USING (true) WITH CHECK (true);

-- 7. RLS 정책 - DELETE 허용
DROP POLICY IF EXISTS "Allow delete for agencies" ON public.agencies;
CREATE POLICY "Allow delete for agencies" ON public.agencies
    FOR DELETE USING (true);

-- 8. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_agencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agencies_updated_at ON public.agencies;
CREATE TRIGGER trigger_agencies_updated_at
    BEFORE UPDATE ON public.agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_agencies_updated_at();

-- 확인
SELECT 'agencies 테이블이 성공적으로 생성되었습니다!' AS message;

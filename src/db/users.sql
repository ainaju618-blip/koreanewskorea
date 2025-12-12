-- users 테이블 생성 (회원 관리용)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,             -- 사용자 이메일
    name TEXT,                              -- 실명
    role TEXT DEFAULT 'subscriber',         -- 'admin', 'reporter', 'subscriber'
    status TEXT DEFAULT 'active',           -- 'active', 'suspended'
    phone TEXT,                             -- 연락처
    avatar_url TEXT,                        -- 프로필 이미지 URL
    last_login_at TIMESTAMPTZ,              -- 마지막 로그인
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated users" ON users FOR DELETE USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

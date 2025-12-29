-- ============================================
-- Korea NEWS - Permission System Migration
-- Version: 1.0
-- Date: 2025-12-17
-- Description: RBAC + Auto-assign reporter
-- ============================================

-- ============================================
-- 1. reporters 테이블에 role 컬럼 추가
-- ============================================

-- role 컬럼 추가 (position과 별개로 실제 권한용)
ALTER TABLE reporters
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'reporter';

-- role 체크 제약조건 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reporters_role_check'
    ) THEN
        ALTER TABLE reporters ADD CONSTRAINT reporters_role_check
        CHECK (role IN ('super_admin', 'admin', 'editor', 'reporter', 'contributor'));
    END IF;
END $$;

-- access_level 기본값 설정
ALTER TABLE reporters ALTER COLUMN access_level SET DEFAULT 40;

-- ============================================
-- 2. 기존 데이터 마이그레이션 (position 기반)
-- ============================================

-- super_admin (주필)
UPDATE reporters SET role = 'super_admin', access_level = 100
WHERE position = 'editor_in_chief' AND (role IS NULL OR role = 'reporter');

-- admin (지사장)
UPDATE reporters SET role = 'admin', access_level = 80
WHERE position = 'branch_manager' AND (role IS NULL OR role = 'reporter');

-- editor (편집국장, 취재부장)
UPDATE reporters SET role = 'editor', access_level = 60
WHERE position IN ('editor_chief', 'news_chief') AND (role IS NULL OR role = 'reporter');

-- reporter (수석기자, 기자) - 기본값이므로 명시적 업데이트
UPDATE reporters SET role = 'reporter', access_level = 40
WHERE position IN ('senior_reporter', 'reporter') AND role IS NULL;

-- contributor (수습기자, 시민기자)
UPDATE reporters SET role = 'contributor', access_level = 20
WHERE position IN ('intern_reporter', 'citizen_reporter') AND (role IS NULL OR role = 'reporter');

-- ============================================
-- 3. 기본 시스템 계정 생성 (news@koreanewsone.com)
-- ============================================

INSERT INTO reporters (
    name,
    email,
    type,
    position,
    role,
    access_level,
    region,
    status,
    avatar_icon,
    bio
) VALUES (
    'Korea NEWS',
    'news@koreanewsone.com',
    'AI Bot',
    'editor_in_chief',
    'super_admin',
    100,
    NULL,
    'Active',
    'newspaper',
    'Korea NEWS System Account - Default reporter for auto-assignment'
) ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    access_level = 100,
    status = 'Active';

-- ============================================
-- 4. posts 테이블에 승인 정보 컬럼 추가
-- ============================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES reporters(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ============================================
-- 5. audit_logs 테이블 생성 (감사 로그)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES reporters(id),
    user_name TEXT,
    action TEXT NOT NULL,           -- 'article.publish', 'article.assign', 'user.create', etc.
    target_type TEXT,               -- 'post', 'reporter', 'settings'
    target_id TEXT,                 -- Target ID
    details JSONB,                  -- Additional info (assign reason, etc.)
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- RLS 정책
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow read for authenticated" ON audit_logs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow insert for service role" ON audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. site_settings에 자동 배정 설정 추가
-- ============================================

INSERT INTO site_settings (key, value, description) VALUES
(
    'auto_assign_reporter',
    'true',
    'Auto-assign reporter on article approval (true=enabled, false=manual selection)'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 7. reporters 테이블 인덱스 추가
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reporters_role ON reporters(role);
CREATE INDEX IF NOT EXISTS idx_reporters_access_level ON reporters(access_level);
CREATE INDEX IF NOT EXISTS idx_reporters_region ON reporters(region);

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT id, name, email, position, role, access_level, region, status
-- FROM reporters ORDER BY access_level DESC;
--
-- SELECT * FROM site_settings WHERE key = 'auto_assign_reporter';
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'reporters';

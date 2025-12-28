-- ============================================
-- 커스텀 링크 기능 추가 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. categories 테이블에 custom_url 필드 추가
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS custom_url TEXT,
ADD COLUMN IF NOT EXISTS link_target TEXT DEFAULT '_self' CHECK (link_target IN ('_self', '_blank'));

-- custom_url이 있으면 해당 URL로, 없으면 /category/slug로 이동
-- link_target: '_self' = 같은 탭, '_blank' = 새 탭

-- 예시: 
-- UPDATE categories SET custom_url = '/map', link_target = '_self' WHERE slug = 'map';
-- UPDATE categories SET custom_url = 'https://forms.google.com/xxx', link_target = '_blank' WHERE slug = 'contact';

SELECT 'Migration completed: custom_url field added to categories table' as result;

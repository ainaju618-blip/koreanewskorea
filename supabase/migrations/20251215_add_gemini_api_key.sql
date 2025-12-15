-- Gemini API 키를 기자별로 저장하기 위한 컬럼 추가
-- 2025-12-15 생성

-- reporters 테이블에 gemini_api_key 컬럼 추가
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS gemini_api_key VARCHAR(100);

-- 주석 추가
COMMENT ON COLUMN reporters.gemini_api_key IS 'Google Gemini API 키 (기자별 개인 키)';

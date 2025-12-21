-- news_sources 테이블에 ai_rewrite_enabled 컬럼 추가
-- 수집처별 AI 재가공 활성화 여부 설정

ALTER TABLE news_sources
ADD COLUMN IF NOT EXISTS ai_rewrite_enabled BOOLEAN DEFAULT false;

-- 설명 추가
COMMENT ON COLUMN news_sources.ai_rewrite_enabled IS 
'해당 수집처의 기사 AI 재가공 활성화 여부. true일 경우 수집 시 자동으로 AI 재가공이 적용됩니다.';

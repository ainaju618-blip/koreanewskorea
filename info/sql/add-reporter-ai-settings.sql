-- reporters 테이블에 ai_settings 컬럼 추가
-- 기자 개인 AI 설정 (프로바이더, API 키, 활성화 여부)

ALTER TABLE reporters
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT NULL;

-- 설명 추가
COMMENT ON COLUMN reporters.ai_settings IS 
'AI 설정: { 
  enabled: boolean,
  provider: "gemini" | "claude" | "grok",
  api_keys: { gemini?: string, claude?: string, grok?: string }
}';

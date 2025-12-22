-- AI Usage Logs 테이블 생성
-- AI 재가공 사용량 추적을 위한 테이블

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    region VARCHAR(50),
    provider VARCHAR(20) NOT NULL,  -- gemini, claude, grok
    call_count INTEGER DEFAULT 1,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    article_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_region ON ai_usage_logs(region);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_logs(provider);

-- RLS 활성화
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능 정책
CREATE POLICY "Admin access only" ON ai_usage_logs
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- 서비스 역할은 삽입 가능
CREATE POLICY "Service role insert" ON ai_usage_logs
    FOR INSERT
    WITH CHECK (true);

-- 코멘트
COMMENT ON TABLE ai_usage_logs IS 'AI 재가공 사용량 로그';
COMMENT ON COLUMN ai_usage_logs.date IS '사용 일자';
COMMENT ON COLUMN ai_usage_logs.region IS '지역 코드';
COMMENT ON COLUMN ai_usage_logs.provider IS 'AI 프로바이더 (gemini, claude, grok)';
COMMENT ON COLUMN ai_usage_logs.call_count IS '호출 횟수';
COMMENT ON COLUMN ai_usage_logs.input_tokens IS '입력 토큰 수';
COMMENT ON COLUMN ai_usage_logs.output_tokens IS '출력 토큰 수';
COMMENT ON COLUMN ai_usage_logs.article_id IS '관련 기사 ID';

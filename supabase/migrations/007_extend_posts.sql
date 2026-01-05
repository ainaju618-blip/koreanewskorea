-- Migration: Extend posts table
-- Date: 2026-01-05
-- Description: posts에 콘텐츠 분류 필드 추가

-- 콘텐츠 타입 추가
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'news',
ADD COLUMN IF NOT EXISTS source_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 0;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_source_category ON posts(source_category);
CREATE INDEX IF NOT EXISTS idx_posts_importance ON posts(importance DESC);

-- 코멘트
COMMENT ON COLUMN posts.content_type IS '콘텐츠 유형 (news, press, council, education)';
COMMENT ON COLUMN posts.source_category IS '출처 분류 (시청, 의회, 교육청, 경찰서 등)';
COMMENT ON COLUMN posts.importance IS '중요도 점수 (0-100)';

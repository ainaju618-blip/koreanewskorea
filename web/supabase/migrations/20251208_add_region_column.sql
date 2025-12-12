-- posts 테이블에 region 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS region TEXT;

-- 기존 나주 기사에 region 설정
UPDATE posts SET region = 'naju', status = 'published' WHERE source LIKE '%나주%';

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);

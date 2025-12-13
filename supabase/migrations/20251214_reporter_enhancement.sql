-- ============================================
-- Reporter Page Enhancement & Subscription System
-- Date: 2025-12-14
-- ============================================

-- 1. Reporters Table Extension (E-E-A-T Fields)
-- ============================================
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS career_years INTEGER DEFAULT 0;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS awards TEXT[];
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS sns_twitter VARCHAR(200);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS sns_facebook VARCHAR(200);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS sns_linkedin VARCHAR(200);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS subscriber_count INTEGER DEFAULT 0;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- Slug Unique Constraint (After data migration strategy)
-- 기존 데이터에 임시 Slug 생성 (이름-난수 조합으로 충돌 방지)
UPDATE reporters 
SET slug = regexp_replace(lower(name), '\s+', '-', 'g') || '-' || substr(md5(random()::text), 1, 4)
WHERE slug IS NULL;

-- Slug에 Unique 제약조건 추가
ALTER TABLE reporters ADD CONSTRAINT reporters_slug_key UNIQUE (slug);
CREATE INDEX IF NOT EXISTS idx_reporters_slug ON reporters(slug);


-- 2. Reporter Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS reporter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 한 유저가 같은 기자를 중복 구독 불가
    CONSTRAINT reporter_subscriptions_uniq UNIQUE(subscriber_id, reporter_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON reporter_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_reporter ON reporter_subscriptions(reporter_id);


-- 3. RLS Policies
-- ============================================
ALTER TABLE reporter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 구독 목록을 볼 수 있음
CREATE POLICY "Users can see their own subscriptions" 
ON reporter_subscriptions FOR SELECT 
USING (auth.uid() = subscriber_id);

-- 유저는 구독할 수 있음 (자신의 ID로만)
CREATE POLICY "Users can subscribe" 
ON reporter_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = subscriber_id);

-- 유저는 구독 취소할 수 있음
CREATE POLICY "Users can unsubscribe" 
ON reporter_subscriptions FOR DELETE 
USING (auth.uid() = subscriber_id);


-- 4. Subscriber Count Auto-Update Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_reporter_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE reporters 
        SET subscriber_count = subscriber_count + 1 
        WHERE id = NEW.reporter_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE reporters 
        SET subscriber_count = subscriber_count - 1 
        WHERE id = OLD.reporter_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reporter_subscriber_count ON reporter_subscriptions;

CREATE TRIGGER trg_update_reporter_subscriber_count
AFTER INSERT OR DELETE ON reporter_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_reporter_subscriber_count();

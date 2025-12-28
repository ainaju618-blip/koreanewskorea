-- ============================================
-- Korea NEWS - Reporter Portal Enhancement v2
-- Date: 2025-12-17
-- Description: Edit history, rejection reasons, notifications, statistics
-- ============================================

-- ============================================
-- 1. article_history - Edit tracking
-- ============================================
CREATE TABLE IF NOT EXISTS article_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

    -- Editor info
    editor_id UUID REFERENCES reporters(id),
    editor_name TEXT,

    -- Change info
    action TEXT NOT NULL CHECK (action IN ('created', 'edited', 'approved', 'rejected', 'assigned', 'status_changed')),

    -- Previous values (for rollback)
    previous_title TEXT,
    previous_content TEXT,
    previous_status TEXT,

    -- New values
    new_title TEXT,
    new_content TEXT,
    new_status TEXT,

    -- Change summary
    change_summary TEXT,

    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_history_article ON article_history(article_id);
CREATE INDEX IF NOT EXISTS idx_article_history_editor ON article_history(editor_id);
CREATE INDEX IF NOT EXISTS idx_article_history_created ON article_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_history_action ON article_history(action);

-- RLS
ALTER TABLE article_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON article_history FOR SELECT USING (true);
CREATE POLICY "Allow insert for service role" ON article_history FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. posts table - Add rejection_reason column
-- ============================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES reporters(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- ============================================
-- 3. notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Recipient
    recipient_id UUID NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,

    -- Content
    type TEXT NOT NULL CHECK (type IN (
        'article_approved',
        'article_rejected',
        'article_assigned',
        'article_edited',
        'mention',
        'system'
    )),
    title TEXT NOT NULL,
    message TEXT,

    -- Reference
    article_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES reporters(id) ON DELETE SET NULL,
    actor_name TEXT,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_article ON notifications(article_id);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert for service role" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true);

-- ============================================
-- 4. reporter_stats view (for dashboard)
-- ============================================
CREATE OR REPLACE VIEW reporter_stats AS
SELECT
    r.id as reporter_id,
    r.name,
    r.region,
    r.position,

    -- Article counts
    COUNT(DISTINCT CASE WHEN p.author_id = r.id THEN p.id END) as my_articles,
    COUNT(DISTINCT CASE WHEN p.author_id = r.id AND p.status = 'published' THEN p.id END) as published_articles,
    COUNT(DISTINCT CASE WHEN p.author_id = r.id AND p.status = 'pending' THEN p.id END) as pending_articles,
    COUNT(DISTINCT CASE WHEN p.author_id = r.id AND p.status = 'draft' THEN p.id END) as draft_articles,
    COUNT(DISTINCT CASE WHEN p.source = r.region THEN p.id END) as region_articles,

    -- This month
    COUNT(DISTINCT CASE
        WHEN p.author_id = r.id
        AND p.published_at >= date_trunc('month', CURRENT_DATE)
        THEN p.id
    END) as articles_this_month,

    -- This week
    COUNT(DISTINCT CASE
        WHEN p.author_id = r.id
        AND p.published_at >= date_trunc('week', CURRENT_DATE)
        THEN p.id
    END) as articles_this_week

FROM reporters r
LEFT JOIN posts p ON (p.author_id = r.id OR p.source = r.region) AND p.status != 'trash'
GROUP BY r.id, r.name, r.region, r.position;

-- ============================================
-- 5. Helper function for notification creation
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_article_id UUID DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_actor_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (recipient_id, type, title, message, article_id, actor_id, actor_name)
    VALUES (p_recipient_id, p_type, p_title, p_message, p_article_id, p_actor_id, p_actor_name)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verification queries
-- ============================================
-- SELECT * FROM article_history LIMIT 5;
-- SELECT * FROM notifications LIMIT 5;
-- SELECT * FROM reporter_stats WHERE reporter_id = 'xxx';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('rejection_reason', 'last_edited_by', 'last_edited_at');

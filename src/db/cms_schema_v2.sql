-- ============================================
-- Korea NEWS CMS 아키텍처 v2.0
-- Phase 1: 핵심 테이블 생성
-- ============================================
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================

-- 1. CATEGORIES 테이블 (계층형 카테고리)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- 계층 구조
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    depth INT DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
    path TEXT,  -- 'gwangju' or 'jeonnam/mokpo'
    
    -- 표시 설정
    order_index INT DEFAULT 0,
    icon TEXT,
    color TEXT DEFAULT '#3B82F6',
    
    -- 스크래퍼 연동
    scraper_slug TEXT,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    show_in_gnb BOOLEAN DEFAULT true,
    show_in_main BOOLEAN DEFAULT true,
    
    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
CREATE INDEX IF NOT EXISTS idx_categories_depth ON categories(depth);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index);

-- RLS 정책
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON categories FOR DELETE USING (true);


-- 2. MENUS 테이블 (GNB 상단 메뉴)
-- ============================================
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 메뉴 정보
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'category', 'custom', 'external')),
    
    -- 링크
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    custom_url TEXT,
    target TEXT DEFAULT '_self' CHECK (target IN ('_self', '_blank')),
    
    -- 구조
    parent_id UUID REFERENCES menus(id) ON DELETE CASCADE,
    order_index INT DEFAULT 0,
    
    -- 메가메뉴
    is_mega BOOLEAN DEFAULT false,
    mega_columns INT DEFAULT 2,
    
    -- 스타일
    icon TEXT,
    highlight BOOLEAN DEFAULT false,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_menus_parent ON menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_order ON menus(order_index);
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category_id);

-- RLS 정책
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON menus FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated" ON menus FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON menus FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON menus FOR DELETE USING (true);


-- 3. LAYOUTS 테이블 (페이지 레이아웃)
-- ============================================
CREATE TABLE IF NOT EXISTS layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 페이지 식별
    page_type TEXT NOT NULL CHECK (page_type IN ('home', 'category')),
    page_slug TEXT,
    
    -- 섹션 정보
    section_name TEXT NOT NULL,
    section_type TEXT NOT NULL CHECK (section_type IN (
        'hero_carousel', 'grid_4', 'grid_3', 'grid_2', 
        'split_2', 'list', 'magazine', 'banner', 'custom'
    )),
    
    -- 콘텐츠 소스
    source_type TEXT NOT NULL CHECK (source_type IN (
        'latest', 'category', 'categories_multi', 'tag', 'manual'
    )),
    source_category_ids UUID[],
    
    -- 표시 설정
    order_index INT DEFAULT 0,
    items_count INT DEFAULT 4,
    title TEXT,
    title_icon TEXT,
    show_more_link BOOLEAN DEFAULT true,
    more_link_url TEXT,
    
    -- 스타일
    background TEXT DEFAULT 'white' CHECK (background IN ('white', 'gray', 'gradient')),
    padding TEXT DEFAULT 'normal' CHECK (padding IN ('none', 'small', 'normal', 'large')),
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_layouts_page ON layouts(page_type, page_slug);
CREATE INDEX IF NOT EXISTS idx_layouts_order ON layouts(order_index);

-- RLS 정책
ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON layouts FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated" ON layouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON layouts FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON layouts FOR DELETE USING (true);


-- 4. POSTS 테이블 수정 (category_id FK 추가)
-- ============================================
-- 주의: 이미 category_id 컬럼이 있으면 에러 발생 → 무시하고 진행
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE posts ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        CREATE INDEX idx_posts_category_id ON posts(category_id);
    END IF;
END $$;


-- ============================================
-- 초기 데이터 삽입
-- ============================================

-- 대메뉴 (depth=0)
INSERT INTO categories (name, slug, depth, path, order_index, color, scraper_slug, icon) VALUES
    ('광주', 'gwangju', 0, 'gwangju', 1, '#3B82F6', 'gwangju', 'Building2'),
    ('전남', 'jeonnam', 0, 'jeonnam', 2, '#22C55E', 'jeonnam', 'MapPin'),
    ('AI', 'ai', 0, 'ai', 3, '#8B5CF6', 'ai', 'Cpu'),
    ('교육', 'education', 0, 'education', 4, '#6366F1', 'education', 'GraduationCap'),
    ('정치경제', 'politics-economy', 0, 'politics-economy', 5, '#EF4444', NULL, 'Landmark'),
    ('오피니언', 'opinion', 0, 'opinion', 6, '#64748B', NULL, 'MessageSquare')
ON CONFLICT (slug) DO NOTHING;

-- 전남 하위 카테고리 (depth=1)
INSERT INTO categories (name, slug, parent_id, depth, path, order_index, scraper_slug)
SELECT name, slug, parent_id, 1, 'jeonnam/' || slug, order_idx, slug FROM (
    SELECT '나주시' as name, 'naju' as slug, id as parent_id, 1 as order_idx FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '목포시', 'mokpo', id, 2 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '여수시', 'yeosu', id, 3 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '순천시', 'suncheon', id, 4 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '광양시', 'gwangyang', id, 5 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '담양군', 'damyang', id, 6 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '곡성군', 'gokseong', id, 7 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '구례군', 'gurye', id, 8 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '고흥군', 'goheung', id, 9 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '보성군', 'boseong', id, 10 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '화순군', 'hwasun', id, 11 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '장흥군', 'jangheung', id, 12 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '강진군', 'gangjin', id, 13 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '해남군', 'haenam', id, 14 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '영암군', 'yeongam', id, 15 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '무안군', 'muan', id, 16 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '함평군', 'hampyeong', id, 17 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '영광군', 'yeonggwang', id, 18 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '장성군', 'jangseong', id, 19 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '완도군', 'wando', id, 20 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '진도군', 'jindo', id, 21 FROM categories WHERE slug = 'jeonnam'
    UNION ALL SELECT '신안군', 'shinan', id, 22 FROM categories WHERE slug = 'jeonnam'
) sub
ON CONFLICT (slug) DO NOTHING;

-- GNB 메뉴 초기 데이터
INSERT INTO menus (name, type, custom_url, order_index) VALUES
    ('홈', 'home', '/', 0)
ON CONFLICT DO NOTHING;

INSERT INTO menus (name, type, category_id, order_index, is_mega)
SELECT '광주', 'category', id, 1, false FROM categories WHERE slug = 'gwangju'
ON CONFLICT DO NOTHING;

INSERT INTO menus (name, type, category_id, order_index, is_mega)
SELECT '전남', 'category', id, 2, true FROM categories WHERE slug = 'jeonnam'
ON CONFLICT DO NOTHING;

INSERT INTO menus (name, type, category_id, order_index, is_mega)
SELECT '교육', 'category', id, 3, false FROM categories WHERE slug = 'education'
ON CONFLICT DO NOTHING;

INSERT INTO menus (name, type, category_id, order_index, is_mega)
SELECT 'AI', 'category', id, 4, false FROM categories WHERE slug = 'ai'
ON CONFLICT DO NOTHING;

INSERT INTO menus (name, type, category_id, order_index, is_mega)
SELECT '정치경제', 'category', id, 5, false FROM categories WHERE slug = 'politics-economy'
ON CONFLICT DO NOTHING;

INSERT INTO menus (name, type, category_id, order_index, is_mega)
SELECT '오피니언', 'category', id, 6, false FROM categories WHERE slug = 'opinion'
ON CONFLICT DO NOTHING;

-- 메인 페이지 레이아웃 초기 데이터
INSERT INTO layouts (page_type, section_name, section_type, source_type, order_index, items_count, title, background) VALUES
    ('home', 'hero', 'hero_carousel', 'latest', 1, 5, NULL, 'white'),
    ('home', 'focus_naju', 'grid_4', 'category', 2, 4, 'Focus 나주시', 'gray'),
    ('home', 'regional', 'split_2', 'categories_multi', 3, 4, NULL, 'gray'),
    ('home', 'education_ai', 'magazine', 'categories_multi', 4, 6, NULL, 'white')
ON CONFLICT DO NOTHING;

-- 레이아웃에 카테고리 연결 (나주)
UPDATE layouts 
SET source_category_ids = ARRAY(SELECT id FROM categories WHERE slug = 'naju')
WHERE section_name = 'focus_naju';

-- 레이아웃에 카테고리 연결 (광주/전남)
UPDATE layouts 
SET source_category_ids = ARRAY(SELECT id FROM categories WHERE slug IN ('gwangju', 'jeonnam') ORDER BY order_index)
WHERE section_name = 'regional';

-- 레이아웃에 카테고리 연결 (교육/AI)
UPDATE layouts 
SET source_category_ids = ARRAY(SELECT id FROM categories WHERE slug IN ('education', 'ai') ORDER BY order_index)
WHERE section_name = 'education_ai';


-- ============================================
-- 기존 posts.category → category_id 마이그레이션
-- ============================================
UPDATE posts p
SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL
  AND (
    LOWER(p.category) = LOWER(c.slug) 
    OR LOWER(p.category) = LOWER(c.name)
    OR LOWER(p.category) = LOWER(c.scraper_slug)
    OR (LOWER(p.category) = '나주' AND c.slug = 'naju')
    OR (LOWER(p.category) = '전남' AND c.slug = 'jeonnam')
    OR (LOWER(p.category) = '광주' AND c.slug = 'gwangju')
    OR (LOWER(p.category) = 'global ai' AND c.slug = 'ai')
  );

-- ============================================
-- 완료
-- ============================================
-- 확인: SELECT * FROM categories ORDER BY depth, order_index;
-- 확인: SELECT * FROM menus ORDER BY order_index;
-- 확인: SELECT * FROM layouts WHERE page_type = 'home' ORDER BY order_index;

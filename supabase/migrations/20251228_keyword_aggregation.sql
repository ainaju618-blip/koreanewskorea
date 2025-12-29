-- ============================================================
-- Dynamic Keyword Aggregation for Sub-Menu Generation
-- ============================================================
-- Purpose: Extract top keywords from article titles by region
-- Usage: SELECT * FROM get_top_keywords('mokpo', 30);
-- ============================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_top_keywords(text, integer);
DROP FUNCTION IF EXISTS get_keyword_stats(text, integer);

-- ============================================================
-- 1. Main Function: Get Top Keywords
-- ============================================================
CREATE OR REPLACE FUNCTION get_top_keywords(
    p_region TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    keyword TEXT,
    count BIGINT,
    sample_title TEXT
) AS $$
DECLARE
    v_keywords TEXT[];
BEGIN
    -- Static keywords per region (same as TypeScript config)
    v_keywords := CASE p_region
        -- Metro
        WHEN 'gwangju' THEN ARRAY['문화', '예술', '전시', '민주', '인권', '5.18', '개발', '도시', '교통', '교육', '복지', '청년', 'AI', 'ACC']

        -- Province
        WHEN 'jeonnam' THEN ARRAY['도정', '정책', '농업', '수산', '관광', '축제', '발전', '투자', '기업']

        -- Cities
        WHEN 'mokpo' THEN ARRAY['해양', '항구', '케이블카', '갯벌', '근대', '역사', '원도심', '개발', '신도심']
        WHEN 'yeosu' THEN ARRAY['관광', '밤바다', '엑스포', '오동도', '수산', '항만', '산단', '화학']
        WHEN 'suncheon' THEN ARRAY['순천만', '정원', '습지', '생태', '낙안읍성', '선암사', '철도']
        WHEN 'naju' THEN ARRAY['에너지', '전력', '한전', '빛가람', '배', '쌀', '농업', '목사고을']
        WHEN 'gwangyang' THEN ARRAY['제철', '포스코', '항만', '매화', '축제', '봄']

        -- Counties
        WHEN 'damyang' THEN ARRAY['대나무', '죽녹원', '메타세쿼이아', '문화', '가사문학', '소쇄원', '딸기']
        WHEN 'gokseong' THEN ARRAY['섬진강', '기차마을', '장미', '멜론', '토란', '도림사']
        WHEN 'gurye' THEN ARRAY['지리산', '화엄사', '산수유', '피아골', '오미자']
        WHEN 'goheung' THEN ARRAY['우주', '나로', '발사', '로켓', '유자', '소록도']
        WHEN 'boseong' THEN ARRAY['녹차', '다원', '차밭', '벌교', '꼬막', '태백산맥']
        WHEN 'hwasun' THEN ARRAY['고인돌', '유네스코', '온천', '힐링', '복숭아']
        WHEN 'jangheung' THEN ARRAY['정남진', '천관산', '문학', '이청준', '한우', '표고']
        WHEN 'gangjin' THEN ARRAY['다산', '정약용', '초당', '청자', '도자기', '딸기']
        WHEN 'haenam' THEN ARRAY['땅끝', '대흥사', '미황사', '고구마', '배추', '김치']
        WHEN 'yeongam' THEN ARRAY['월출산', '왕인', '도갑사', 'F1', '서킷', '레이싱']
        WHEN 'muan' THEN ARRAY['연꽃', '백련', '황토', '갯벌', '공항', '무안공항']
        WHEN 'hampyeong' THEN ARRAY['나비', '축제', '국화', '한우', '생태']
        WHEN 'yeonggwang' THEN ARRAY['굴비', '법성포', '불갑사', '원불교', '백수', '낙조']
        WHEN 'jangseong' THEN ARRAY['백양사', '단풍', '편백', '축령산', '황룡강']
        WHEN 'wando' THEN ARRAY['청해진', '장보고', '보길도', '청산도', '전복', '김', '미역']
        WHEN 'jindo' THEN ARRAY['바닷길', '신비', '진도개', '운림산방', '아리랑']
        WHEN 'shinan' THEN ARRAY['퍼플섬', '천사', '갯벌', '염전', '소금', '새우젓']

        -- Education
        WHEN 'gwangju_edu' THEN ARRAY['정책', '학교', '학생', '진로', '진학', '급식', '돌봄']
        WHEN 'jeonnam_edu' THEN ARRAY['정책', '학교', '학생', '작은학교', '농촌', '급식', '돌봄']

        ELSE ARRAY['정책', '행정', '복지', '교육', '문화', '관광', '축제', '안전']
    END;

    RETURN QUERY
    WITH keyword_matches AS (
        SELECT
            k.keyword,
            p.title,
            p.created_at
        FROM
            posts p,
            unnest(v_keywords) AS k(keyword)
        WHERE
            p.region = p_region
            AND p.created_at >= NOW() - (p_days || ' days')::INTERVAL
            AND p.title ILIKE '%' || k.keyword || '%'
    ),
    keyword_counts AS (
        SELECT
            keyword,
            COUNT(*) as cnt,
            MAX(title) as sample
        FROM keyword_matches
        GROUP BY keyword
    )
    SELECT
        kc.keyword,
        kc.cnt,
        kc.sample
    FROM keyword_counts kc
    ORDER BY kc.cnt DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Stats Function: Get Region Article Statistics
-- ============================================================
CREATE OR REPLACE FUNCTION get_keyword_stats(
    p_region TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_articles BIGINT,
    articles_with_keywords BIGINT,
    top_keyword TEXT,
    top_keyword_count BIGINT,
    coverage_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT COUNT(*) as total
        FROM posts
        WHERE region = p_region
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    top_kw AS (
        SELECT keyword, count
        FROM get_top_keywords(p_region, p_days)
        LIMIT 1
    ),
    kw_articles AS (
        SELECT COUNT(DISTINCT p.id) as with_kw
        FROM posts p
        WHERE p.region = p_region
        AND p.created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND EXISTS (
            SELECT 1 FROM get_top_keywords(p_region, p_days) kw
            WHERE p.title ILIKE '%' || kw.keyword || '%'
        )
    )
    SELECT
        s.total,
        ka.with_kw,
        COALESCE(tk.keyword, 'N/A'),
        COALESCE(tk.count, 0),
        CASE WHEN s.total > 0
            THEN ROUND((ka.with_kw::NUMERIC / s.total) * 100, 1)
            ELSE 0
        END
    FROM stats s
    CROSS JOIN kw_articles ka
    LEFT JOIN top_kw tk ON true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Grant Permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION get_top_keywords(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_keywords(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_keyword_stats(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_keyword_stats(text, integer) TO anon;

-- ============================================================
-- Test Query (comment out in production)
-- ============================================================
-- SELECT * FROM get_top_keywords('mokpo', 30);
-- SELECT * FROM get_keyword_stats('mokpo', 30);

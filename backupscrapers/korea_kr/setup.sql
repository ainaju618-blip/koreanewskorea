-- ============================================================================
-- korea.kr (Government Press Release) Setup SQL
-- Version: 1.0
-- Created: 2025-12-25
-- ============================================================================

-- 1. Add agency to agencies table
-- ============================================================================

INSERT INTO agencies (region_code, name, category, base_url, press_release_url)
VALUES (
    'korea_kr',
    '정책브리핑(정부)',
    '전국',
    'https://www.korea.kr',
    'https://www.korea.kr/briefing/pressReleaseList.do'
)
ON CONFLICT (region_code) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    base_url = EXCLUDED.base_url,
    press_release_url = EXCLUDED.press_release_url;


-- 2. Verify agency was added
-- ============================================================================

SELECT * FROM agencies WHERE region_code = 'korea_kr';


-- 3. Sample test data (for testing only)
-- ============================================================================
-- Note: Run this only for testing. Production data should come from scraper.

/*
INSERT INTO posts (
    title,
    subtitle,
    content,
    original_link,
    source,
    category,
    region,
    status,
    published_at,
    thumbnail_url
)
VALUES (
    '2025년 온실농가 난방비 지원사업 시행',
    '농림축산식품부, 에너지 비용 절감 위한 지원책 발표',
    '농림축산식품부는 2025년 온실농가 난방비 지원사업을 시행한다고 밝혔다. 이번 지원사업은 최근 에너지 가격 상승으로 어려움을 겪고 있는 온실농가를 돕기 위한 것으로, 전국 온실농가를 대상으로 한다.

주요 지원 내용은 다음과 같다:
- 난방유 구매 비용 일부 보조
- 에너지 효율화 시설 설치 지원
- 신재생에너지 전환 농가 추가 지원

신청은 2025년 1월 2일부터 각 지역 농업기술센터에서 가능하며, 예산 소진 시 조기 마감될 수 있다.',
    'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156736831',
    '농림축산식품부',
    '전국',
    'korea_kr',
    'published',
    '2025-12-25T09:00:00+09:00',
    NULL
);
*/


-- 4. Check existing korea_kr posts
-- ============================================================================

SELECT id, title, source, published_at, status
FROM posts
WHERE region = 'korea_kr'
ORDER BY published_at DESC
LIMIT 10;


-- 5. Count by region (to verify)
-- ============================================================================

SELECT region, COUNT(*) as count
FROM posts
GROUP BY region
ORDER BY count DESC;

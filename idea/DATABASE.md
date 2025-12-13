# 데이터베이스 스키마

> AI 뉴스 수집 시스템의 데이터베이스 설계

---

## 1. 테이블 구조

### 1.1 ai_news_raw (원문 저장)

```sql
-- AI 뉴스 원문 저장 테이블
CREATE TABLE IF NOT EXISTS ai_news_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 소스 정보
    source_code VARCHAR(50) NOT NULL,      -- 'techcrunch', 'openai_blog'
    source_name VARCHAR(100) NOT NULL,     -- 'TechCrunch', 'OpenAI Blog'
    source_url TEXT NOT NULL,              -- 원문 URL

    -- 중복 체크
    url_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256(url)

    -- 원문 콘텐츠
    title TEXT NOT NULL,
    content TEXT,                          -- 원문 본문
    summary TEXT,                          -- 요약 (RSS의 경우)
    author VARCHAR(200),
    thumbnail_url TEXT,

    -- 시간
    published_at TIMESTAMPTZ,              -- 원문 발행일
    collected_at TIMESTAMPTZ DEFAULT NOW(),

    -- 상태
    status VARCHAR(20) DEFAULT 'pending',  -- pending | processing | done | error
    error_message TEXT,

    -- 인덱스용
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_ai_news_raw_source ON ai_news_raw(source_code);
CREATE INDEX idx_ai_news_raw_status ON ai_news_raw(status);
CREATE INDEX idx_ai_news_raw_collected ON ai_news_raw(collected_at DESC);
CREATE INDEX idx_ai_news_raw_url_hash ON ai_news_raw(url_hash);
```

### 1.2 ai_news_processed (가공된 기사)

```sql
-- AI 뉴스 가공 결과 테이블
CREATE TABLE IF NOT EXISTS ai_news_processed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 원문 참조
    raw_id UUID NOT NULL REFERENCES ai_news_raw(id) ON DELETE CASCADE,

    -- 번역 결과
    title_ko TEXT,                         -- 번역된 제목
    content_ko TEXT,                       -- 번역된 본문

    -- 추출된 사실 (JSON)
    facts JSONB,
    /*
    {
        "who": "OpenAI",
        "what": "GPT-5 발표",
        "when": "2025-01-15",
        "where": "샌프란시스코",
        "why": "AI 성능 향상",
        "how": "추론 능력 강화",
        "numbers": ["100배 빠름"],
        "key_facts": ["핵심1", "핵심2"]
    }
    */

    -- 재작성 결과
    rewritten_title TEXT,                  -- 재작성된 제목
    rewritten_content TEXT,                -- 재작성된 본문

    -- 품질 검사
    similarity_score DECIMAL(5,4),         -- 원문 유사도 (0.0000 ~ 1.0000)
    quality_passed BOOLEAN DEFAULT FALSE,
    quality_notes TEXT,

    -- 처리 모드
    process_mode VARCHAR(20),              -- 'reference' | 'rewrite'

    -- 시간
    processed_at TIMESTAMPTZ DEFAULT NOW(),

    -- 발행 연결
    post_id BIGINT REFERENCES posts(id),   -- 발행된 경우 posts 테이블 참조

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_ai_news_processed_raw ON ai_news_processed(raw_id);
CREATE INDEX idx_ai_news_processed_quality ON ai_news_processed(quality_passed);
CREATE INDEX idx_ai_news_processed_post ON ai_news_processed(post_id);
```

### 1.3 ai_news_sources (수집처 설정)

```sql
-- AI 뉴스 수집처 설정 (news_sources 테이블 확장 또는 별도)
-- 기존 news_sources 테이블에 region='AI'로 추가하거나,
-- 별도 테이블로 관리

-- 옵션 A: 기존 news_sources 활용
-- INSERT INTO news_sources (name, code, region, org_type, ...)
-- VALUES ('TechCrunch', 'techcrunch', 'AI', 'AI매체', ...);

-- 옵션 B: AI 전용 설정 테이블
CREATE TABLE IF NOT EXISTS ai_news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    name VARCHAR(100) NOT NULL,            -- 'TechCrunch'
    code VARCHAR(50) NOT NULL UNIQUE,      -- 'techcrunch'

    -- 수집 설정
    collection_type VARCHAR(20) NOT NULL,  -- 'rss' | 'scraping' | 'api'
    feed_url TEXT,                         -- RSS URL
    scrape_url TEXT,                       -- 스크래핑 URL
    api_endpoint TEXT,                     -- API 엔드포인트

    -- 스크래핑 셀렉터 (scraping 타입인 경우)
    selectors JSONB,
    /*
    {
        "list": "article.post",
        "title": "h2.title",
        "content": "div.content",
        "date": "time.published",
        "author": "span.author",
        "thumbnail": "img.featured"
    }
    */

    -- 처리 설정
    default_mode VARCHAR(20) DEFAULT 'rewrite',  -- 'reference' | 'rewrite'
    auto_process BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 5,            -- 1=최우선, 10=최하위

    -- 상태
    enabled BOOLEAN DEFAULT TRUE,
    last_collected_at TIMESTAMPTZ,
    last_error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO ai_news_sources (name, code, collection_type, feed_url, priority) VALUES
('TechCrunch AI', 'techcrunch', 'rss',
 'https://techcrunch.com/category/artificial-intelligence/feed/', 1),
('The Verge AI', 'theverge', 'rss',
 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 2),
('VentureBeat AI', 'venturebeat', 'rss',
 'https://venturebeat.com/category/ai/feed/', 3),
('OpenAI Blog', 'openai_blog', 'scraping',
 'https://openai.com/blog', 4),
('Google AI Blog', 'google_ai', 'scraping',
 'https://blog.google/technology/ai/', 5)
ON CONFLICT (code) DO NOTHING;
```

---

## 2. 관계도

```
┌─────────────────┐
│ ai_news_sources │  설정/수집처 정보
└────────┬────────┘
         │ source_code
         ▼
┌─────────────────┐
│  ai_news_raw    │  원문 저장 (법적 증빙)
└────────┬────────┘
         │ raw_id
         ▼
┌─────────────────┐
│ai_news_processed│  가공 결과
└────────┬────────┘
         │ post_id
         ▼
┌─────────────────┐
│     posts       │  최종 발행 (기존 테이블)
└─────────────────┘
```

---

## 3. 쿼리 예시

### 3.1 수집된 원문 조회

```sql
-- 최근 수집된 원문
SELECT
    r.id,
    r.source_name,
    r.title,
    r.published_at,
    r.status
FROM ai_news_raw r
ORDER BY r.collected_at DESC
LIMIT 20;
```

### 3.2 가공 대기 기사

```sql
-- 아직 처리되지 않은 원문
SELECT r.*
FROM ai_news_raw r
LEFT JOIN ai_news_processed p ON r.id = p.raw_id
WHERE r.status = 'pending'
  AND p.id IS NULL
ORDER BY r.collected_at ASC;
```

### 3.3 품질 통과 기사

```sql
-- 발행 가능한 재작성 기사
SELECT
    p.id,
    p.rewritten_title,
    p.rewritten_content,
    p.similarity_score,
    r.source_name,
    r.source_url
FROM ai_news_processed p
JOIN ai_news_raw r ON p.raw_id = r.id
WHERE p.quality_passed = TRUE
  AND p.post_id IS NULL
ORDER BY p.processed_at DESC;
```

### 3.4 소스별 통계

```sql
-- 수집처별 수집/가공 현황
SELECT
    s.name,
    s.code,
    COUNT(r.id) AS total_collected,
    COUNT(p.id) AS total_processed,
    COUNT(CASE WHEN p.quality_passed THEN 1 END) AS quality_passed,
    s.last_collected_at
FROM ai_news_sources s
LEFT JOIN ai_news_raw r ON s.code = r.source_code
LEFT JOIN ai_news_processed p ON r.id = p.raw_id
WHERE s.enabled = TRUE
GROUP BY s.id
ORDER BY s.priority;
```

---

## 4. 마이그레이션

### 4.1 생성 스크립트

```sql
-- 파일: supabase/migrations/20251214_create_ai_news_tables.sql

-- 1. ai_news_raw 테이블
CREATE TABLE IF NOT EXISTS ai_news_raw (
    -- ... (위 스키마 참조)
);

-- 2. ai_news_processed 테이블
CREATE TABLE IF NOT EXISTS ai_news_processed (
    -- ... (위 스키마 참조)
);

-- 3. ai_news_sources 테이블 (선택)
CREATE TABLE IF NOT EXISTS ai_news_sources (
    -- ... (위 스키마 참조)
);

-- 4. RLS 정책 (필요시)
ALTER TABLE ai_news_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_news_processed ENABLE ROW LEVEL SECURITY;
```

---

## 5. 기존 테이블 연동

### posts 테이블과 연동

AI 뉴스가 발행되면 기존 `posts` 테이블에 저장:

```sql
-- AI 뉴스 발행 시
INSERT INTO posts (
    title,
    content,
    category,
    source,
    source_url,
    thumbnail_url,
    status,
    published_at
)
SELECT
    p.rewritten_title,
    p.rewritten_content,
    'AI',                          -- 카테고리
    r.source_name,                 -- 출처
    r.source_url,                  -- 원문 URL
    r.thumbnail_url,
    'draft',                       -- 초안으로 저장
    NOW()
FROM ai_news_processed p
JOIN ai_news_raw r ON p.raw_id = r.id
WHERE p.id = :processed_id
  AND p.quality_passed = TRUE
RETURNING id;

-- 발행 후 processed 테이블 업데이트
UPDATE ai_news_processed
SET post_id = :new_post_id
WHERE id = :processed_id;
```

---

*이 문서는 AI 뉴스 시스템의 데이터베이스 구조를 정의합니다.*

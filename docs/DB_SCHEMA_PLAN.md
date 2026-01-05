# Supabase DB 스키마 총괄 계획서

> **최종 업데이트**: 2026-01-05
> **프로젝트**: koreanewskorea (전국판)
> **목적**: 전국판 지역 뉴스 + 생활정보 포털

---

## 현재 테이블 현황

### 핵심 콘텐츠 테이블

| 테이블명 | 설명 | 상태 | 비고 |
|----------|------|:---:|------|
| `posts` | 뉴스 기사 | ✅ | sido_code, sigungu_code 추가됨 |
| `categories` | 카테고리 | ✅ | |
| `tour_spots` | 관광지 (한국관광공사) | ✅ | 3,634건 |
| `blog_posts` | 블로그 게시물 | ✅ | |

### 사용자/기자 테이블

| 테이블명 | 설명 | 상태 |
|----------|------|:---:|
| `users` | 사용자 | ✅ |
| `reporters` | 기자 | ✅ |
| `reporter_regions` | 기자-지역 매핑 | ✅ |
| `reporter_subscriptions` | 기자 구독 | ✅ |
| `profiles` | 프로필 | ✅ |

### 봇/자동화 테이블

| 테이블명 | 설명 | 상태 |
|----------|------|:---:|
| `bot_logs` | 봇 실행 로그 | ✅ |
| `scraper_sources` | 스크래퍼 소스 | ✅ |
| `scraper_state` | 스크래퍼 상태 | ✅ |
| `automation_logs` | 자동화 로그 | ✅ |
| `job_sessions` | 작업 세션 | ✅ |
| `job_logs` | 작업 로그 | ✅ |

### 설정/시스템 테이블

| 테이블명 | 설명 | 상태 |
|----------|------|:---:|
| `site_settings` | 사이트 설정 | ✅ |
| `system_settings` | 시스템 설정 | ✅ |
| `menus` | 메뉴 | ✅ |
| `layouts` | 레이아웃 | ✅ |
| `agencies` | 기관 | ✅ |
| `news_sources` | 뉴스 소스 | ✅ |

### 개인화/분석 테이블

| 테이블명 | 설명 | 상태 |
|----------|------|:---:|
| `personalization_settings` | 개인화 설정 | ✅ |
| `region_weights` | 지역 가중치 | ✅ |
| `boost_schedules` | 부스트 스케줄 | ✅ |
| `user_personalization_profiles` | 사용자 프로필 | ✅ |
| `ai_usage_logs` | AI 사용 로그 | ✅ |
| `performance_logs` | 성능 로그 | ✅ |

---

## 신규 필요 테이블 (전국판 확장)

### 1. `events` - 지역 행사/축제 ⭐ 필수

```sql
-- 지역 행사 테이블
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT,                         -- 상세 내용

    -- 지역 정보
    sido_code VARCHAR(20) NOT NULL,       -- 시/도 코드
    sigungu_code VARCHAR(30),             -- 시/군/구 코드
    region VARCHAR(50),                   -- 기존 region 호환용

    -- 일정
    event_date DATE NOT NULL,             -- 시작일
    end_date DATE,                        -- 종료일 (NULL이면 당일)
    event_time VARCHAR(100),              -- 시간 정보 (예: "10:00~18:00")

    -- 장소
    location VARCHAR(200),                -- 장소명
    address TEXT,                         -- 주소
    lat DECIMAL(10, 8),                   -- 위도
    lng DECIMAL(11, 8),                   -- 경도

    -- 미디어
    thumbnail_url TEXT,
    images JSONB DEFAULT '[]',            -- 추가 이미지 배열

    -- 분류
    category VARCHAR(50),                 -- 축제, 전시, 공연, 체육, 교육 등
    tags TEXT[],                          -- 태그 배열

    -- 연락처/링크
    contact VARCHAR(100),                 -- 연락처
    website_url TEXT,                     -- 공식 웹사이트
    booking_url TEXT,                     -- 예약 링크

    -- 출처
    source VARCHAR(100),                  -- 데이터 출처
    source_url TEXT,                      -- 원본 URL

    -- 상태
    status VARCHAR(20) DEFAULT 'published', -- draft, published, cancelled
    is_featured BOOLEAN DEFAULT FALSE,    -- 메인 노출 여부
    view_count INTEGER DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_events_region ON events(sido_code, sigungu_code);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_date_range ON events(event_date, end_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON events FOR SELECT USING (status = 'published');
```

### 2. `places` - 관광명소/맛집/문화유적 ⭐ 필수

```sql
-- 관광명소/맛집/문화유적 테이블
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    name VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT,                         -- 상세 설명

    -- 지역 정보
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region VARCHAR(50),                   -- 기존 호환용

    -- 분류
    category VARCHAR(50) NOT NULL,        -- restaurant, attraction, heritage, cafe, accommodation
    sub_category VARCHAR(50),             -- 세부 분류
    tags TEXT[],

    -- 위치
    address TEXT NOT NULL,
    address_detail VARCHAR(200),          -- 상세 주소
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),

    -- 미디어
    thumbnail_url TEXT,
    images JSONB DEFAULT '[]',

    -- 영업 정보 (맛집/카페용)
    opening_hours JSONB,                  -- {"mon": "09:00-21:00", ...}
    closed_days VARCHAR(100),             -- 휴무일
    price_range VARCHAR(50),              -- $, $$, $$$
    phone VARCHAR(50),

    -- 네비게이션 링크
    naver_map_url TEXT,
    kakao_map_url TEXT,
    naver_place_id VARCHAR(50),
    kakao_place_id VARCHAR(50),

    -- 추가 정보
    website_url TEXT,
    instagram_url TEXT,

    -- 특산물/메뉴 (맛집용)
    specialties JSONB,                    -- ["나주곰탕", "홍어삼합"]
    menu JSONB,                           -- [{"name": "곰탕", "price": 12000}]

    -- 문화재 정보 (문화유적용)
    heritage_type VARCHAR(50),            -- 국보, 보물, 사적, 시도유형문화재 등
    heritage_number VARCHAR(50),          -- 문화재 번호
    designated_date DATE,                 -- 지정일

    -- 평점/리뷰
    rating DECIMAL(2, 1),                 -- 평균 평점
    review_count INTEGER DEFAULT 0,

    -- 상태
    status VARCHAR(20) DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,    -- 검증 여부
    view_count INTEGER DEFAULT 0,

    -- 출처
    source VARCHAR(100),
    source_id VARCHAR(100),               -- 외부 API ID

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_places_region ON places(sido_code, sigungu_code);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_location ON places USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);  -- PostGIS 필요
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_featured ON places(is_featured) WHERE is_featured = TRUE;

-- RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON places FOR SELECT USING (status = 'published');
```

### 3. `weather_cache` - 날씨 캐시

```sql
-- 날씨 캐시 테이블
CREATE TABLE IF NOT EXISTS weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 지역
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region_key VARCHAR(50) NOT NULL UNIQUE,  -- 복합키: "jeonnam_naju"

    -- 현재 날씨
    current_temp DECIMAL(4, 1),           -- 현재 기온
    feels_like DECIMAL(4, 1),             -- 체감 온도
    humidity INTEGER,                      -- 습도 %
    wind_speed DECIMAL(4, 1),             -- 풍속 m/s
    weather_code VARCHAR(20),             -- 날씨 코드
    weather_desc VARCHAR(100),            -- 날씨 설명 (맑음, 흐림 등)
    weather_icon VARCHAR(20),             -- 아이콘 코드

    -- 일일 정보
    temp_min DECIMAL(4, 1),
    temp_max DECIMAL(4, 1),
    sunrise TIME,
    sunset TIME,

    -- 대기질
    pm10 INTEGER,                         -- 미세먼지
    pm25 INTEGER,                         -- 초미세먼지
    air_quality VARCHAR(20),              -- 좋음, 보통, 나쁨, 매우나쁨

    -- 예보 데이터
    hourly_forecast JSONB,                -- 시간별 예보
    daily_forecast JSONB,                 -- 일별 예보

    -- 메타
    api_source VARCHAR(50),               -- 기상청, OpenWeather 등
    fetched_at TIMESTAMPTZ NOT NULL,      -- API 호출 시간
    expires_at TIMESTAMPTZ NOT NULL,      -- 캐시 만료 시간

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_weather_region ON weather_cache(sido_code, sigungu_code);
CREATE UNIQUE INDEX idx_weather_region_key ON weather_cache(region_key);
CREATE INDEX idx_weather_expires ON weather_cache(expires_at);

-- RLS
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON weather_cache FOR SELECT USING (true);
```

### 4. `region_news_settings` - 지역별 뉴스 설정

```sql
-- 지역별 뉴스 설정 테이블
CREATE TABLE IF NOT EXISTS region_news_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 지역
    sido_code VARCHAR(20) NOT NULL,
    sigungu_code VARCHAR(30),
    region_key VARCHAR(50) NOT NULL UNIQUE,

    -- 표시 설정
    display_name VARCHAR(100),            -- 표시명 (예: "나주시 뉴스")
    hero_image_url TEXT,                  -- 히어로 이미지
    hero_gradient VARCHAR(100),           -- 그라데이션 색상
    theme_color VARCHAR(20),              -- 테마 색상

    -- 카테고리 매핑
    category_mapping JSONB,               -- {"시정": "나주", "의회": "나주의회"}

    -- 섹션 활성화
    sections_enabled JSONB DEFAULT '{
        "news": true,
        "weather": true,
        "events": true,
        "places": true,
        "food": true,
        "heritage": true
    }',

    -- SEO
    meta_title VARCHAR(200),
    meta_description TEXT,

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE UNIQUE INDEX idx_region_settings_key ON region_news_settings(region_key);
CREATE INDEX idx_region_settings_active ON region_news_settings(is_active);
```

---

## 기존 테이블 필드 추가/수정

### 1. `posts` 테이블 - 추가 필드

```sql
-- 이미 추가됨 (001_add_region_columns.sql)
-- sido_code VARCHAR(20)
-- sigungu_code VARCHAR(30)

-- 추가 고려 필드
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'news',  -- news, press, council, education
ADD COLUMN IF NOT EXISTS source_category VARCHAR(50),              -- 시청, 의회, 교육청 등
ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 0;             -- 중요도 점수
```

### 2. `tour_spots` 테이블 - 확장

```sql
-- 네비게이션 링크 추가
ALTER TABLE tour_spots
ADD COLUMN IF NOT EXISTS naver_map_url TEXT,
ADD COLUMN IF NOT EXISTS kakao_map_url TEXT,
ADD COLUMN IF NOT EXISTS naver_place_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS kakao_place_id VARCHAR(50);

-- 추가 정보
ALTER TABLE tour_spots
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS homepage_url TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
```

---

## 테이블 관계도

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           콘텐츠 레이어                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   posts (뉴스)              events (행사)           places (장소)        │
│   ├── sido_code ───────────├── sido_code ──────────├── sido_code        │
│   ├── sigungu_code ────────├── sigungu_code ───────├── sigungu_code     │
│   └── category             └── category            └── category          │
│         │                        │                       │               │
│         └────────────────────────┴───────────────────────┘               │
│                                  │                                       │
│                                  ▼                                       │
│                     region_news_settings (지역 설정)                     │
│                     └── region_key (sido_sigungu)                        │
│                                                                          │
│   tour_spots (관광공사)     weather_cache (날씨)                         │
│   └── region_key            └── region_key                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           사용자 레이어                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   users ──────────── reporters ──────────── reporter_regions            │
│     │                    │                       │                       │
│     │                    │                       └── region (sido/sigungu)│
│     │                    │                                               │
│     └──── personalization_profiles                                       │
│                └── preferred_regions                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 마이그레이션 실행 순서

### Phase 1: 핵심 테이블 (즉시 실행)

| 순서 | 파일명 | 설명 |
|:---:|--------|------|
| 1 | `002_create_events.sql` | 행사 테이블 |
| 2 | `003_create_places.sql` | 장소 테이블 |
| 3 | `004_create_weather_cache.sql` | 날씨 캐시 |
| 4 | `005_create_region_settings.sql` | 지역 설정 |

### Phase 2: 기존 테이블 확장

| 순서 | 파일명 | 설명 |
|:---:|--------|------|
| 5 | `006_extend_posts.sql` | posts 필드 추가 |
| 6 | `007_extend_tour_spots.sql` | tour_spots 네비 링크 |

### Phase 3: 데이터 마이그레이션

| 순서 | 파일명 | 설명 |
|:---:|--------|------|
| 7 | `008_seed_region_settings.sql` | 지역 설정 초기값 |
| 8 | `009_migrate_existing_data.sql` | 기존 데이터 매핑 |

---

## API 엔드포인트 매핑

### 신규 API (테이블 생성 후 구현)

| 엔드포인트 | 메서드 | 테이블 | 설명 |
|------------|:------:|--------|------|
| `/api/region/[code]/events` | GET | events | 지역 행사 목록 |
| `/api/region/[code]/places` | GET | places | 지역 장소 목록 |
| `/api/region/[code]/weather` | GET | weather_cache | 지역 날씨 |
| `/api/region/[code]/settings` | GET | region_news_settings | 지역 설정 |
| `/api/events/[id]` | GET | events | 행사 상세 |
| `/api/places/[id]` | GET | places | 장소 상세 |

### 기존 API 확장

| 엔드포인트 | 변경 내용 |
|------------|----------|
| `/api/region/[code]/news` | sigungu_code 지원 추가 |
| `/api/news/personalized` | 지역 기반 개인화 강화 |

---

## 데이터 수집 계획

### 행사 데이터 (`events`)

| 출처 | 방법 | 주기 |
|------|------|------|
| 지자체 홈페이지 | 스크래퍼 | 일 1회 |
| 문화포털 API | API 연동 | 일 1회 |
| 한국관광공사 축제 API | API 연동 | 주 1회 |

### 장소 데이터 (`places`)

| 출처 | 방법 | 주기 |
|------|------|------|
| 한국관광공사 TourAPI | API 연동 | 주 1회 |
| 네이버 플레이스 | 수동 입력 | 필요시 |
| 카카오맵 | 수동 입력 | 필요시 |
| 문화재청 API | API 연동 | 월 1회 |

### 날씨 데이터 (`weather_cache`)

| 출처 | 방법 | 주기 |
|------|------|------|
| 기상청 단기예보 API | API 연동 | 3시간 |
| 에어코리아 대기질 API | API 연동 | 1시간 |

---

## 우선순위 정리

### P0: 즉시 실행 (1일)
1. ✅ posts.sido_code, sigungu_code (완료)
2. ⬜ `events` 테이블 생성
3. ⬜ `places` 테이블 생성

### P1: 단기 (3일)
4. ⬜ `weather_cache` 테이블 생성
5. ⬜ `region_news_settings` 테이블 생성
6. ⬜ tour_spots 네비게이션 링크 추가

### P2: 중기 (1주)
7. ⬜ 지역 행사 API 구현
8. ⬜ 지역 장소 API 구현
9. ⬜ 날씨 API 연동

### P3: 장기 (2주)
10. ⬜ 스크래퍼 연동 (행사)
11. ⬜ 외부 API 연동 (관광공사, 문화재청)
12. ⬜ 네비게이션 연동 (카카오맵, 네이버맵)

---

*이 문서는 koreanewskorea 전국판의 DB 스키마 총괄 계획서입니다.*
*MASTER_PLAN.md, DEVELOPMENT_PLAN.md와 연계하여 관리됩니다.*

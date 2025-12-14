# 기자 페이지 SEO 및 UI/UX 기획안

## 1. 현황 분석
*   **현재 상태:**
    *   단순 이메일(`news@koreanewsone.com`)만 노출.
    *   기자 개인 정보(경력, 전문분야 등) 부재로 **E-E-A-T(Experience, Expertise, Authoritativeness, Trustworthiness)** 점수가 매우 낮음.
*   **벤치마킹 (중앙일보 등):**
    *   프로필 사진, 상세 소속, 이메일, 자기소개 제공.
    *   응원/구독 기능 및 큐레이션된 기사 목록 제공.

## 2. SEO 목표 (E-E-A-T 강화)
| 요소 | 목표 | 구현 방안 |
| :--- | :--- | :--- |
| **Experience** | 취재 경력, 현장 경험 강조 | `career_years`, 자기소개 내 경력 서술 |
| **Expertise** | 전문 분야 명시 | `specialties` (태그 형태 노출) |
| **Authoritativeness** | 기사 수, 구독자 수 | `subscriber_count`, `total_views`, 기사 목록 카운트 |
| **Trustworthiness** | 신원 확인 및 소통 | 프로필 사진, SNS 링크, 실제 연락처, 윤리강령 준수 문구 |

## 3. 페이지 구조 설계
### 3.1 URL 구조
*   **Profile:** `/author/[slug]` (예: `/author/hong-gildong`)
*   **List:** `/author/[slug]/articles` (필요 시 분리, 기본은 단일 페이지 내 탭/무한스크롤)

### 3.2 레이아웃 (Wireframe)
```
┌─────────────────────────────────────────────────────────────┐
│  [Header Area]                                              │
│  ┌─────────┐                                                │
│  │  Photo  │  홍길동 기자                    [공유] [구독]   │
│  │ 120x120 │  정치부 | 탐사보도팀                           │
│  └─────────┘  hong@koreanewsone.com                           │
│                                                              │
│  "지역의 목소리를 전국에 전합니다" (Bio)                      │
│                                                              │
│  취재 경력 15년 | 기사 1,234건 | 구독자 567명               │
├─────────────────────────────────────────────────────────────┤
│  [Tabs: 최신 기사 | 인기 기사 | 상세 프로필]                  │
├─────────────────────────────────────────────────────────────┤
│  [Left: Main Content]                  │ [Right: Sidebar]    │
│  ┌──────────────────────────────┐     │ **전문 분야**        │
│  │ [Article Card]                │     │ #정치 #탐사 #지자체  │
│  │ Title, Summary, Date, Views  │     │                     │
│  └──────────────────────────────┘     │ **수상 이력**        │
│                                        │ - 2024 한국기자상   │
│  ┌──────────────────────────────┐     │                     │
│  │ [Article Card]                │     │ **SNS**             │
│  └──────────────────────────────┘     │ [Twitter] [FB]      │
└─────────────────────────────────────────────────────────────┘
```

## 4. 데이터 구조 (Schema & DB)

### 4.1 Table Schema Extension (`reporters`)
```sql
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS specialties TEXT[]; -- or JSONB
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS career_years INTEGER;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS awards TEXT[]; -- or JSONB
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS sns_twitter VARCHAR(200);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS sns_facebook VARCHAR(200);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS sns_linkedin VARCHAR(200);
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS subscriber_count INTEGER DEFAULT 0;
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
```

### 4.2 Structured Data (JSON-LD)
`@type: Person` 스키마를 사용하여 검색엔진이 기자의 정보를 명확히 이해하도록 함.
*   `knowsAbout`: 전문 분야
*   `worksFor`: 소속 언론사
*   `award`: 수상 이력

### 4.3 Meta Tags
*   `title`: 홍길동 기자 (정치부) - 코리아NEWS
*   `description`: 15년 경력의 정치부 기자... (Bio 활용)
*   `og:image`: 기자 프로필 사진

## 5. 구현 우선순위
1.  **DB Schema:** `reporters` 테이블 확장이 최우선.
2.  **Page UI:** `/author/[slug]` 페이지 개발 (frontend).
3.  **SEO:** Metadata & JSON-LD 주입.
4.  **Backend:** 기자 정보 + 기사 목록 조회 API (`GET /api/reporters/[slug]`).

# 코리아NEWS SEO/AI 최적화 종합 계획서

> **작성일**: 2026-01-02
> **목표**: 구글 뉴스 퍼블리셔 등록, 네이버 뉴스 등록, AI 검색 노출 최적화
> **예상 기간**: 2-3주

---

## 목차

1. [현황 분석](#1-현황-분석)
2. [구글 뉴스 등록 최적화](#2-구글-뉴스-등록-최적화)
3. [네이버 뉴스 등록 최적화](#3-네이버-뉴스-등록-최적화)
4. [AI 검색 노출 최적화 (GEO)](#4-ai-검색-노출-최적화-geo)
5. [기술적 구현 계획](#5-기술적-구현-계획)
6. [실행 로드맵](#6-실행-로드맵)
7. [체크리스트](#7-체크리스트)

---

## 1. 현황 분석

### 1.1 페이지 현황

| 분류 | 개수 | 상태 |
|------|------|------|
| **총 페이지** | 97개 | - |
| **공개 페이지** | ~25개 | SEO 대상 |
| **관리자 페이지** | 32개 | 차단 필요 |
| **기자 페이지** | 8개 | 차단 필요 |
| **내부용 페이지** | 10개+ | noindex 필요 |
| **컨텐츠 미완성** | 0개 | ✅ 양호 |

### 1.2 현재 SEO 구현 상태

#### ✅ 이미 구현됨
- 메타데이터 (title, description, og, twitter)
- NewsArticle JSON-LD 구조화 데이터
- 동적 Sitemap (sitemap.ts)
- PWA Manifest
- 이미지 최적화 (AVIF/WebP)
- Canonical URL
- 시맨틱 HTML (article, section, figure)

#### ❌ 미구현 (작업 필요)
- robots.txt 파일
- News Sitemap (뉴스 전용)
- Organization 스키마
- BreadcrumbList 스키마
- FAQ 스키마
- Google Search Console 인증
- Naver Search Advisor 인증
- AI 크롤러 허용 설정

### 1.3 차단 필요 경로

```
/admin/*        - 관리자 페이지 (32개)
/reporter/*     - 기자 페이지 (8개)
/api/*          - API 엔드포인트
/idea/*         - 내부용 아이디어
/blogadmin/*    - 블로그 관리
/popup/*        - 팝업 페이지
/yu-1/admin     - yu-1 관리
```

---

## 2. 구글 뉴스 등록 최적화

### 2.1 Google News Publisher Center 요구사항

| 요구사항 | 현재 상태 | 조치 |
|---------|----------|------|
| 사이트맵 제출 | ✅ 있음 | News Sitemap 추가 |
| robots.txt | ❌ 없음 | **생성 필요** |
| 뉴스 콘텐츠 구조 | ✅ 있음 | - |
| 저자 정보 | ✅ 있음 | 프로필 페이지 강화 |
| 발행일/수정일 | ✅ 있음 | - |
| 고유 URL | ✅ 있음 | - |
| HTTPS | ✅ 있음 | - |

### 2.2 News Sitemap 생성

```xml
<!-- 뉴스 전용 사이트맵 형식 -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://www.koreanewsone.com/news/12345</loc>
    <news:news>
      <news:publication>
        <news:name>코리아NEWS</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>2026-01-02T09:00:00+09:00</news:publication_date>
      <news:title>기사 제목</news:title>
      <news:keywords>키워드1, 키워드2</news:keywords>
    </news:news>
  </url>
</urlset>
```

### 2.3 기사 페이지 메타태그 강화

```html
<!-- 추가 필요한 메타태그 -->
<meta name="news_keywords" content="키워드1, 키워드2, 키워드3" />
<meta property="article:published_time" content="2026-01-02T09:00:00+09:00" />
<meta property="article:modified_time" content="2026-01-02T10:00:00+09:00" />
<meta property="article:author" content="https://www.koreanewsone.com/author/reporter-name" />
<meta property="article:section" content="정치" />
<meta property="article:tag" content="국회, 법안" />
```

### 2.4 NewsArticle Schema 강화

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "기사 제목",
  "description": "기사 요약",
  "image": ["이미지URL"],
  "datePublished": "2026-01-02T09:00:00+09:00",
  "dateModified": "2026-01-02T10:00:00+09:00",
  "author": {
    "@type": "Person",
    "name": "기자 이름",
    "url": "https://www.koreanewsone.com/author/reporter-name",
    "jobTitle": "기자",
    "worksFor": {
      "@type": "NewsMediaOrganization",
      "name": "코리아NEWS"
    }
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "코리아NEWS",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.koreanewsone.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.koreanewsone.com/news/12345"
  },
  "articleSection": "정치",
  "keywords": ["국회", "법안", "정책"],
  "wordCount": 1500,
  "isAccessibleForFree": true
}
```

---

## 3. 네이버 뉴스 등록 최적화

### 3.1 네이버 뉴스 검색 파트너 요구사항

| 요구사항 | 현재 상태 | 조치 |
|---------|----------|------|
| 네이버 서치어드바이저 등록 | ❌ 없음 | **등록 필요** |
| 사이트 소유 확인 | ❌ 없음 | **인증 필요** |
| RSS/Atom 피드 | ❌ 없음 | **생성 필요** |
| 신디케이션 | ⚠️ 검토 | 옵션 |
| 뉴스스탠드 입점 | ⚠️ 별도 | 추후 신청 |

### 3.2 네이버 서치어드바이저 설정

```html
<!-- 사이트 인증 메타태그 -->
<meta name="naver-site-verification" content="인증코드" />
```

### 3.3 RSS 피드 생성

```
경로: /api/rss 또는 /rss.xml
형식: RSS 2.0 또는 Atom 1.0

포함 내용:
- 최신 뉴스 50개
- 제목, 요약, 본문 일부
- 발행일, 저자
- 카테고리
- 썸네일 이미지
```

### 3.4 네이버 뉴스 SEO 특화

```html
<!-- 네이버 최적화 메타태그 -->
<meta property="og:type" content="article" />
<meta property="og:article:author" content="기자이름" />
<meta property="og:article:published_time" content="발행시간" />

<!-- 네이버 검색에 유리한 요소 -->
- 명확한 제목 (50자 이내)
- 요약 (150자 이내)
- 카테고리 명시
- 키워드 태그
```

---

## 4. AI 검색 노출 최적화 (GEO)

### 4.1 AI 크롤러 현황 (2025-2026)

| 크롤러명 | 운영사 | 용도 | 허용 권장 |
|---------|--------|------|----------|
| **GPTBot** | OpenAI | ChatGPT 학습/검색 | ✅ 허용 |
| **OAI-SearchBot** | OpenAI | ChatGPT 실시간 검색 | ✅ 허용 |
| **ChatGPT-User** | OpenAI | 사용자 요청 시 접근 | ✅ 허용 |
| **ClaudeBot** | Anthropic | Claude AI | ✅ 허용 |
| **anthropic-ai** | Anthropic | Claude 크롤링 | ✅ 허용 |
| **PerplexityBot** | Perplexity | Perplexity AI | ✅ 허용 |
| **Google-Extended** | Google | Gemini/AI Overview | ✅ 허용 |

### 4.2 robots.txt AI 크롤러 설정

```txt
# AI 크롤러 허용 (뉴스 노출을 위해 필수)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

### 4.3 AI 인용률 높이는 콘텐츠 전략

#### E-E-A-T 강화

| 요소 | 현재 | 개선 방안 |
|------|------|----------|
| **Experience** | ⚠️ 보통 | 지역 취재 경험 강조, 현장 사진 |
| **Expertise** | ⚠️ 보통 | 기자 프로필 강화, 전문 분야 명시 |
| **Authoritativeness** | ⚠️ 보통 | 외부 인용, 공식 출처 링크 |
| **Trustworthiness** | ✅ 양호 | 팩트체크, 정정보도 시스템 |

#### 콘텐츠 구조화

```
✅ AI가 인용하기 좋은 형식:
- 명확한 제목과 부제목 (H1-H6)
- 핵심 요약 (TL;DR) 상단 배치
- 불릿 포인트 / 번호 목록
- Q&A 형식 FAQ
- 인용구 명확히 구분
- 출처 및 참고 링크 명시
```

### 4.4 FAQ Schema 추가

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "코리아NEWS는 어떤 뉴스를 다루나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "코리아NEWS는 전국 27개 지역의 로컬 뉴스와 세계 뉴스를 AI 기술로 연결하는 디지털 저널리즘 플랫폼입니다."
      }
    }
  ]
}
```

### 4.5 Organization Schema 추가 (홈페이지)

```json
{
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "name": "코리아NEWS",
  "alternateName": "KoreaNews",
  "url": "https://www.koreanewsone.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.koreanewsone.com/logo.png",
    "width": 600,
    "height": 60
  },
  "sameAs": [
    "https://twitter.com/koreanews",
    "https://facebook.com/koreanews"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "contact@koreanewsone.com"
  },
  "foundingDate": "2024",
  "description": "로컬과 세계를 잇는 AI 저널리즘 플랫폼",
  "slogan": "로컬과 세계를 잇는 AI 저널리즘",
  "ethicsPolicy": "https://www.koreanewsone.com/ethical-code",
  "correctionsPolicy": "https://www.koreanewsone.com/corrections",
  "masthead": "https://www.koreanewsone.com/organizational",
  "ownershipFundingInfo": "https://www.koreanewsone.com/about"
}
```

### 4.6 BreadcrumbList Schema 추가

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "홈",
      "item": "https://www.koreanewsone.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "정치",
      "item": "https://www.koreanewsone.com/category/politics"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "기사 제목",
      "item": "https://www.koreanewsone.com/news/12345"
    }
  ]
}
```

---

## 5. 기술적 구현 계획

### 5.1 파일 생성/수정 목록

| 파일 | 작업 | 우선순위 |
|------|------|---------|
| `public/robots.txt` | 새로 생성 | **P0** |
| `src/app/news-sitemap.xml/route.ts` | 새로 생성 | **P1** |
| `src/app/rss.xml/route.ts` | 새로 생성 | **P1** |
| `src/app/layout.tsx` | 인증코드 추가 | **P1** |
| `src/app/(site)/page.tsx` | Organization 스키마 | **P2** |
| `src/app/(site)/news/[id]/page.tsx` | 스키마 강화 | **P2** |
| `src/components/Breadcrumb.tsx` | 새로 생성 | **P2** |
| `src/components/FAQSchema.tsx` | 새로 생성 | **P3** |

### 5.2 robots.txt 생성 계획

```txt
# 코리아NEWS robots.txt
# Updated: 2026-01-02

# 기본 크롤러 설정
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /reporter/
Disallow: /api/
Disallow: /idea/
Disallow: /blogadmin/
Disallow: /popup/
Disallow: /yu-1/admin
Disallow: /*?preview=
Disallow: /*?draft=

# AI 크롤러 허용 (명시적)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# 사이트맵
Sitemap: https://www.koreanewsone.com/sitemap.xml
Sitemap: https://www.koreanewsone.com/news-sitemap.xml
```

### 5.3 성능 요구사항

| 지표 | 목표값 | 현재 | 조치 |
|------|--------|------|------|
| **LCP** | < 2.5초 | 측정 필요 | 이미지 최적화 |
| **FID** | < 100ms | 측정 필요 | JS 최적화 |
| **CLS** | < 0.1 | 측정 필요 | 레이아웃 안정화 |
| **TTFB** | < 200ms | 측정 필요 | 서버 최적화 |

---

## 6. 실행 로드맵

### Phase 1: 기초 인프라 (Week 1)

| 일차 | 작업 | 담당 |
|------|------|------|
| Day 1 | robots.txt 생성 및 배포 | Claude |
| Day 1 | Google Search Console 등록 | 사용자 |
| Day 1 | Naver Search Advisor 등록 | 사용자 |
| Day 2 | 인증 코드 적용 | Claude |
| Day 2 | News Sitemap 생성 | Claude |
| Day 3 | RSS 피드 생성 | Claude |

### Phase 2: 스키마 강화 (Week 1-2)

| 일차 | 작업 | 담당 |
|------|------|------|
| Day 4 | Organization 스키마 추가 | Claude |
| Day 5 | BreadcrumbList 스키마 추가 | Claude |
| Day 6 | NewsArticle 스키마 강화 | Claude |
| Day 7 | FAQ 스키마 추가 (주요 페이지) | Claude |

### Phase 3: 검증 및 등록 (Week 2-3)

| 일차 | 작업 | 담당 |
|------|------|------|
| Day 8-10 | 구조화 데이터 테스트 (Rich Results Test) | Claude |
| Day 11-12 | Google News Publisher Center 신청 | 사용자 |
| Day 13-14 | 네이버 뉴스 검색 파트너 신청 | 사용자 |
| Day 15+ | 모니터링 및 개선 | 공동 |

---

## 7. 체크리스트

### 7.1 구글 뉴스 등록 체크리스트

```
[ ] robots.txt 생성 및 배포
[ ] Google Search Console 등록
[ ] 사이트 소유권 인증
[ ] 일반 Sitemap 제출
[ ] News Sitemap 생성 및 제출
[ ] NewsArticle Schema 검증 (모든 기사)
[ ] 저자 프로필 페이지 확인
[ ] 발행일/수정일 메타태그 확인
[ ] Google News Publisher Center 신청
[ ] 심사 통과 대기
```

### 7.2 네이버 뉴스 등록 체크리스트

```
[ ] 네이버 서치어드바이저 등록
[ ] 사이트 소유권 인증
[ ] Sitemap 제출
[ ] RSS 피드 생성 및 제출
[ ] 웹마스터 도구 설정
[ ] 네이버 뉴스 검색 파트너 신청 (선택)
[ ] 뉴스스탠드 입점 신청 (선택)
```

### 7.3 AI 검색 최적화 체크리스트

```
[ ] robots.txt에 AI 크롤러 허용
[ ] Organization Schema 추가
[ ] FAQ Schema 추가
[ ] BreadcrumbList Schema 추가
[ ] E-E-A-T 요소 강화
[ ] 콘텐츠 구조화 (H1-H6, 리스트)
[ ] 저자 정보 페이지 강화
[ ] 출처 및 참고 링크 명시
[ ] Core Web Vitals 최적화
[ ] SSR 렌더링 확인
```

### 7.4 기술 검증 도구

| 도구 | 용도 | URL |
|------|------|-----|
| Rich Results Test | 구조화 데이터 검증 | https://search.google.com/test/rich-results |
| Schema Markup Validator | 스키마 검증 | https://validator.schema.org |
| PageSpeed Insights | 성능 측정 | https://pagespeed.web.dev |
| Google Search Console | 검색 모니터링 | https://search.google.com/search-console |
| Naver Search Advisor | 네이버 검색 | https://searchadvisor.naver.com |

---

## 부록: 참고 자료

### AI 크롤러 관련
- [AI Bots and Robots.txt - Paul Calvano](https://paulcalvano.com/2025-08-21-ai-bots-and-robots-txt/)
- [List of Top AI Search Crawlers](https://momenticmarketing.com/blog/ai-search-crawlers-bots)

### GEO (Generative Engine Optimization)
- [How to Rank on ChatGPT, Perplexity](https://almcorp.com/blog/how-to-rank-on-chatgpt-perplexity-ai-search-engines-complete-guide-generative-engine-optimization/)
- [AI Search Optimization 2025](https://firstpagesage.com/seo-blog/ai-search-optimization-strategy-and-best-practices/)

### 구조화 데이터
- [Schema.org NewsArticle](https://schema.org/NewsArticle)
- [Google News Publisher Center](https://publishercenter.google.com)

---

*이 계획서는 코리아NEWS의 SEO 및 AI 검색 최적화를 위한 종합 가이드입니다.*

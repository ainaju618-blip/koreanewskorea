# 홈페이지 개인화 시스템 기획서

> **문서 버전:** v1.1
> **작성일:** 2025-12-14
> **상태:** 기획 완료, 구현 대기

---

## 1. 개요

### 1.1 목적
Korea NEWS 홈페이지에 개인화 시스템을 도입하여:
1. **영업 활용**: 특정 지역 방문 시 해당 지역 기사 부스트
2. **독자 만족**: 위치 기반 맞춤 뉴스 제공
3. **체류시간 증가**: 관심 지역/카테고리 우선 노출

### 1.2 사용자 유형별 지원

```
┌─────────────────────────────────────────────────────────────┐
│  🔑 핵심 원칙: 로그인 여부와 관계없이 모든 사용자 지원       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  비로그인 사용자                                             │
│  ├─ 식별: sessionId (쿠키, 자동생성)                        │
│  ├─ 위치 기반: ✅ IP Geolocation                            │
│  ├─ 행동 기반: ✅ LocalStorage + 쿠키                       │
│  ├─ 부스트: ✅ (전체 공통 적용)                             │
│  └─ 데이터 지속: 브라우저 한정, 최대 1년                    │
│                                                              │
│  로그인 사용자                                               │
│  ├─ 식별: user_id (DB)                                      │
│  ├─ 위치 기반: ✅ IP + 프로필 설정                          │
│  ├─ 행동 기반: ✅ DB 저장 (디바이스 간 동기화)              │
│  ├─ 부스트: ✅ (전체 공통 적용)                             │
│  └─ 데이터 지속: 영구, 기기 간 동기화                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 핵심 기능

| 기능 | 설명 | 비로그인 | 로그인 | 관리자 설정 |
|------|------|---------|--------|------------|
| **부스트 시스템** | 특정 기사/지역 상단 고정 | ✅ | ✅ | ✅ |
| **위치 기반** | 접속 지역 기사 우선 | ✅ IP | ✅ IP+설정 | ✅ |
| **행동 기반** | 자주 본 지역/카테고리 학습 | ✅ Local | ✅ DB | ✅ |
| **상시 가중치** | 특정 지역 기본 노출 비율 조정 | ✅ | ✅ | ✅ |

---

## 2. 관리자 설정 인터페이스

### 2.1 개인화 방식 선택 (신규)

관리자가 **어떤 개인화 방식을 활성화할지** 선택 가능

```
┌─────────────────────────────────────────────────────────────┐
│  [관리자] > [홈 관리] > [개인화 설정]                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 개인화 방식 선택                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  ☑️ 부스트 시스템                                     │   │
│  │     특정 기사/지역을 예약된 시간에 상단 노출           │   │
│  │     └ 우선순위: [높음 ▼] (다른 방식보다 우선)         │   │
│  │                                                       │   │
│  │  ☑️ 위치 기반 (IP Geolocation)                        │   │
│  │     접속 지역의 기사를 자동으로 상단 노출              │   │
│  │     └ 가중치: [1.5 ▼] (기본 1.0 대비 1.5배)          │   │
│  │                                                       │   │
│  │  ☑️ 행동 기반 (쿠키/LocalStorage)                     │   │
│  │     자주 본 지역/카테고리 기사 우선 노출               │   │
│  │     └ 학습 기간: [30일 ▼]                            │   │
│  │     └ 최소 조회수: [5회 ▼] (이상 본 지역만 반영)      │   │
│  │                                                       │   │
│  │  ☑️ 상시 가중치                                       │   │
│  │     특정 지역의 기본 노출 비율 상향                    │   │
│  │     └ [상세 설정 →]                                  │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚙️ 우선순위 (충돌 시 적용 순서)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 부스트 (최우선)                                   │   │
│  │  2. 상시 가중치                                       │   │
│  │  3. 위치 기반                                         │   │
│  │  4. 행동 기반                                         │   │
│  │                                    [순서 변경]        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│                              [저장]  [초기화]                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 개인화 설정 데이터 구조

```typescript
interface PersonalizationSettings {
  // 각 방식 활성화 여부
  boost: {
    enabled: boolean;
    priority: number;  // 1 = 최우선
  };

  geolocation: {
    enabled: boolean;
    priority: number;
    weight: number;    // 1.0 ~ 3.0
  };

  behavior: {
    enabled: boolean;
    priority: number;
    learningDays: number;     // 학습 기간 (일)
    minViewCount: number;     // 최소 조회수
  };

  regionWeights: {
    enabled: boolean;
    priority: number;
    weights: Record<string, number>;  // { naju: 1.3, gwangju: 1.1 }
  };
}
```

---

## 3. 데이터베이스 설계

### 3.1 테이블 구조

```sql
-- 1. 개인화 전역 설정
CREATE TABLE personalization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES reporters(id)
);

-- 초기 데이터
INSERT INTO personalization_settings (setting_key, setting_value) VALUES
('boost', '{"enabled": true, "priority": 1}'),
('geolocation', '{"enabled": true, "priority": 3, "weight": 1.5}'),
('behavior', '{"enabled": true, "priority": 4, "learningDays": 30, "minViewCount": 5}'),
('regionWeights', '{"enabled": true, "priority": 2, "weights": {"naju": 1.3, "gwangju": 1.1}}');

-- 2. 부스트 설정 (예약 시스템)
CREATE TABLE boost_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 부스트 대상
    boost_type VARCHAR(20) NOT NULL,  -- 'region' | 'article' | 'category'
    target_value VARCHAR(100) NOT NULL, -- 'yeongam' | 'post-uuid' | 'AI'

    -- 부스트 강도 (1~10)
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

    -- 스케줄
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,

    -- 반복 설정 (선택)
    repeat_type VARCHAR(20),  -- 'none' | 'daily' | 'weekly'
    repeat_days INTEGER[],    -- [1,2,3,4,5] = 월~금

    -- 메타
    memo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES reporters(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 지역별 상시 가중치
CREATE TABLE region_weights (
    region_code VARCHAR(20) PRIMARY KEY,
    region_name VARCHAR(20) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0.5 AND weight <= 3.0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 (전체 지역)
INSERT INTO region_weights (region_code, region_name, weight) VALUES
('gwangju', '광주광역시', 1.1),
('jeonnam', '전라남도', 1.0),
('naju', '나주시', 1.3),
('mokpo', '목포시', 1.0),
('yeosu', '여수시', 1.0),
('suncheon', '순천시', 1.0),
('gwangyang', '광양시', 1.0),
('damyang', '담양군', 1.0),
('gokseong', '곡성군', 1.0),
('gurye', '구례군', 1.0),
('goheung', '고흥군', 1.0),
('boseong', '보성군', 1.0),
('hwasun', '화순군', 1.0),
('jangheung', '장흥군', 1.0),
('gangjin', '강진군', 1.0),
('haenam', '해남군', 1.0),
('yeongam', '영암군', 1.0),
('muan', '무안군', 1.0),
('hampyeong', '함평군', 1.0),
('yeonggwang', '영광군', 1.0),
('jangseong', '장성군', 1.0),
('wando', '완도군', 1.0),
('jindo', '진도군', 1.0),
('shinan', '신안군', 1.0);

-- 4. 사용자 행동 로그 (비로그인: session_id, 로그인: user_id)
CREATE TABLE user_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 사용자 식별 (둘 중 하나 필수)
    session_id VARCHAR(100),        -- 비로그인 사용자
    user_id UUID REFERENCES auth.users(id),  -- 로그인 사용자

    -- 행동 데이터
    article_id UUID REFERENCES posts(id),
    region_code VARCHAR(20),
    category VARCHAR(20),
    action VARCHAR(20) NOT NULL,  -- 'view' | 'click' | 'share'
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 최소 하나의 식별자 필수
    CONSTRAINT check_user_identity CHECK (
        session_id IS NOT NULL OR user_id IS NOT NULL
    )
);

-- 5. 로그인 사용자 개인화 프로필 (DB 동기화용)
CREATE TABLE user_personalization_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),

    -- 선호 지역 (직접 설정)
    preferred_region VARCHAR(20),

    -- 학습된 행동 데이터 (LocalStorage → DB 동기화)
    region_views JSONB DEFAULT '{}',     -- { "naju": 25, "gwangju": 12 }
    category_views JSONB DEFAULT '{}',   -- { "광주": 15, "AI": 8 }

    -- 메타
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_boost_active ON boost_schedules(is_active, start_at, end_at);
CREATE INDEX idx_behavior_session ON user_behavior_logs(session_id, created_at);
CREATE INDEX idx_behavior_user ON user_behavior_logs(user_id, created_at);
```

---

## 4. 점수 계산 알고리즘

### 4.1 사용자 컨텍스트 조회 (로그인/비로그인 통합)

```typescript
// 사용자 컨텍스트를 가져오는 통합 함수
async function getUserContext(request: Request): Promise<UserContext> {
  const cookies = parseCookies(request);
  const session = await getSession(request);  // Supabase Auth

  // 기본 컨텍스트 (비로그인)
  const context: UserContext = {
    isLoggedIn: false,
    userId: null,
    sessionId: cookies.sessionId || generateSessionId(),
    userRegion: null,
    userBehavior: null,
    preferredRegion: cookies.preferredRegion || null,
  };

  // 1. 위치 감지 (로그인/비로그인 공통)
  context.userRegion = await detectRegionByIP(request);

  // 2. 로그인 사용자: DB에서 프로필 조회
  if (session?.user) {
    context.isLoggedIn = true;
    context.userId = session.user.id;

    const profile = await getPersonalizationProfile(session.user.id);
    if (profile) {
      // 사용자가 직접 설정한 선호 지역 > IP 감지 지역
      context.preferredRegion = profile.preferred_region || context.userRegion;
      context.userBehavior = {
        regionViews: profile.region_views,
        categoryViews: profile.category_views,
      };
    }
  }
  // 3. 비로그인 사용자: 쿠키/LocalStorage에서 조회 (클라이언트에서 전달)
  else {
    context.userBehavior = request.body?.userBehavior || null;
  }

  return context;
}
```

### 4.2 최종 점수 공식

```typescript
function calculateArticleScore(article, context: UserContext) {
  const settings = await getPersonalizationSettings();
  let finalScore = getBaseTimeScore(article.published_at);  // 기본 시간 점수

  // 활성화된 방식들을 우선순위 순으로 정렬
  const activeMethods = getActiveMethods(settings).sort((a, b) => a.priority - b.priority);

  for (const method of activeMethods) {
    switch (method.type) {
      case 'boost':
        const boostMultiplier = getActiveBoostMultiplier(article);
        if (boostMultiplier > 1) {
          finalScore *= boostMultiplier;  // 부스트는 곱셈
        }
        break;

      case 'regionWeights':
        const regionWeight = settings.regionWeights.weights[article.source] || 1.0;
        finalScore *= regionWeight;
        break;

      case 'geolocation':
        // 선호 지역 또는 IP 감지 지역 사용
        const targetRegion = context.preferredRegion || context.userRegion;
        if (targetRegion === article.source) {
          finalScore *= settings.geolocation.weight;
        }
        break;

      case 'behavior':
        // 로그인: DB 데이터, 비로그인: 클라이언트 전달 데이터
        if (context.userBehavior) {
          const behaviorScore = calculateBehaviorScore(article, context.userBehavior);
          finalScore += behaviorScore;  // 행동 기반은 덧셈
        }
        break;
    }
  }

  return finalScore;
}

// 기본 시간 점수 (1시간=100, 감쇠)
function getBaseTimeScore(publishedAt) {
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  return Math.max(100 - (hoursAgo * 2), 10);  // 최소 10점
}

// 부스트 배수 (활성 부스트 있으면 priority * 10)
function getActiveBoostMultiplier(article) {
  const now = new Date();
  const activeBoost = boostSchedules.find(b =>
    b.is_active &&
    b.start_at <= now &&
    b.end_at >= now &&
    matchesTarget(b, article)
  );
  return activeBoost ? activeBoost.priority * 10 : 1;
}

// 행동 기반 점수
function calculateBehaviorScore(article, userBehavior) {
  if (!userBehavior) return 0;

  let score = 0;
  const regionViews = userBehavior.regionViews[article.source] || 0;
  const categoryViews = userBehavior.categoryViews[article.category] || 0;

  score += Math.min(regionViews * 3, 30);   // 지역 최대 +30
  score += Math.min(categoryViews * 2, 20); // 카테고리 최대 +20

  return score;
}
```

### 4.2 점수 계산 예시

```
시나리오: 나주시 기사, 영암군 부스트 중, 해남 사용자

기본 점수 (2시간 전 기사): 100 - 4 = 96점

1. 부스트 체크: 나주시 ≠ 영암군 → 배수 1
2. 상시 가중치: 나주시 = 1.3 → 96 × 1.3 = 124.8점
3. 위치 기반: 해남 ≠ 나주 → 변동 없음
4. 행동 기반: 나주 10회 조회 → +30점

최종: 124.8 + 30 = 154.8점


시나리오: 영암군 기사, 영암군 부스트 중 (priority: 8)

기본 점수: 90점
1. 부스트: 영암 = 영암 → 90 × 80 = 7200점 (최상단 확정)

최종: 7200점
```

---

## 5. 사용자 데이터 수집

### 5.1 수집 방식별 데이터

| 저장소 | 데이터 | 서버 접근 | 지속성 |
|--------|--------|----------|--------|
| **쿠키** | preferredRegion, sessionId | ✅ | 1년 |
| **LocalStorage** | 조회 기록, 행동 데이터 | ❌ | 영구 |
| **서버 DB** | 집계 통계 (익명) | ✅ | 영구 |

### 5.2 쿠키 구조

```typescript
// 쿠키에 저장 (서버에서 읽기 가능)
interface CookieData {
  preferredRegion: string;   // 'naju' - 선호 지역
  detectedRegion: string;    // 'haenam' - IP 감지 지역
  sessionId: string;         // 익명 세션 ID
  consent: 'all' | 'essential' | 'none';  // 쿠키 동의
}
```

### 5.3 LocalStorage 구조

```typescript
// LocalStorage에 저장 (클라이언트 전용)
interface UserBehavior {
  regionViews: Record<string, number>;    // { naju: 25, gwangju: 12 }
  categoryViews: Record<string, number>;  // { '광주': 15, 'AI': 8 }
  recentArticles: string[];               // 최근 본 기사 ID (최대 100개)
  lastVisit: string;                      // ISO 날짜
  visitCount: number;
}
```

### 5.4 개인정보 보호

```
┌─────────────────────────────────────────────────────────────┐
│  🍪 쿠키 동의 배너                                           │
│                                                              │
│  코리아NEWS는 더 나은 서비스를 위해 쿠키를 사용합니다.       │
│                                                              │
│  • 필수 쿠키: 사이트 기본 기능 (동의 불필요)                 │
│  • 기능 쿠키: 맞춤 뉴스 추천 (동의 필요)                     │
│                                                              │
│  [모두 허용]  [필수만]  [자세히]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 관리자 UI 상세

### 6.1 부스트 관리 화면

```
┌─────────────────────────────────────────────────────────────┐
│  [관리자] > [홈 관리] > [부스트 관리]                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔥 현재 활성 부스트                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 영암군 | 14:00~18:00 | 우선순위 8 | 영암군청 방문     │ ✕ │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  📅 예약된 부스트                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 내일 10:00 | 나주시 | 우선순위 6 | 나주시 행사        │ ✎ │
│  │ 12/20 09:00 | 광주 | 우선순위 7 | 광주 전시회         │ ✎ │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ➕ 새 부스트 추가                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 유형:  ○ 지역  ○ 특정 기사  ○ 카테고리              │   │
│  │ 대상:  [영암군 ▼] 또는 [기사 검색...]                │   │
│  │                                                       │   │
│  │ 시작:  [2025-01-15] [14:00]                          │   │
│  │ 종료:  [2025-01-15] [18:00]                          │   │
│  │                                                       │   │
│  │ 우선순위: [8] ━━━━━━━━●━━ (1~10, 높을수록 상단)       │   │
│  │                                                       │   │
│  │ 반복:  ○ 없음  ○ 매일  ○ 매주 [월 화 수 목 금]      │   │
│  │                                                       │   │
│  │ 메모:  [영암군청 담당자 방문 예정____________]        │   │
│  │                                                       │   │
│  │                              [미리보기]  [등록]       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 상시 가중치 설정 화면

```
┌─────────────────────────────────────────────────────────────┐
│  [관리자] > [홈 관리] > [상시 가중치]                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 지역별 노출 가중치 (1.0 = 기본)                          │
│                                                              │
│  광역/도                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 광주광역시  [1.1] ━━━━●━━━━━━━━━━━━━━━               │   │
│  │ 전라남도    [1.0] ━━━●━━━━━━━━━━━━━━━━               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  시                                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 나주시 ⭐   [1.3] ━━━━━━━●━━━━━━━━━━━ (주 활동지)    │   │
│  │ 목포시      [1.0] ━━━●━━━━━━━━━━━━━━━━               │   │
│  │ 여수시      [1.0] ━━━●━━━━━━━━━━━━━━━━               │   │
│  │ 순천시      [1.0] ━━━●━━━━━━━━━━━━━━━━               │   │
│  │ 광양시      [1.0] ━━━●━━━━━━━━━━━━━━━━               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  군 (17개)                           [모두 펼치기]           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 담양군 [1.0]  곡성군 [1.0]  구례군 [1.0]  ...        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  💡 팁: 1.3 이상은 부스트와 유사한 효과                      │
│                                                              │
│                                    [저장]  [초기화]          │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. API 설계

### 7.1 엔드포인트 목록

| Method | Endpoint | 용도 | 인증 |
|--------|----------|------|------|
| GET | `/api/personalization/settings` | 전체 설정 조회 | 관리자 |
| PUT | `/api/personalization/settings` | 설정 업데이트 | 관리자 |
| GET | `/api/personalization/boost` | 부스트 목록 | 관리자 |
| POST | `/api/personalization/boost` | 부스트 생성 | 관리자 |
| PUT | `/api/personalization/boost/[id]` | 부스트 수정 | 관리자 |
| DELETE | `/api/personalization/boost/[id]` | 부스트 삭제 | 관리자 |
| GET | `/api/personalization/weights` | 가중치 조회 | 관리자 |
| PUT | `/api/personalization/weights` | 가중치 수정 | 관리자 |
| POST | `/api/personalization/sync` | 행동 데이터 DB 동기화 | 로그인 |
| GET | `/api/personalization/profile` | 내 개인화 프로필 | 로그인 |
| PUT | `/api/personalization/profile` | 선호 지역 설정 | 로그인 |
| GET | `/api/location/detect` | IP 위치 감지 | 공개 |
| POST | `/api/posts?personalize=true` | 개인화된 기사 목록 | 공개 |

### 7.2 사용자 프로필 동기화 API (로그인 사용자)

```typescript
// POST /api/personalization/sync
// 로그인 사용자가 LocalStorage 데이터를 DB에 동기화
// (로그인 직후 또는 주기적으로 호출)

// Request
{
  regionViews: { "naju": 25, "gwangju": 12 },
  categoryViews: { "광주": 15, "AI": 8 }
}

// Response
{
  success: true,
  merged: {  // 기존 DB 데이터와 병합된 결과
    regionViews: { "naju": 30, "gwangju": 15 },
    categoryViews: { "광주": 20, "AI": 10 }
  }
}
```

### 7.3 기사 목록 API 확장

```typescript
// GET /api/posts?personalize=true
// Headers: Cookie (preferredRegion, sessionId)
// Authorization: Bearer <token> (로그인 시)

// POST Body (비로그인 사용자, 행동 데이터 포함)
{
  userBehavior: {
    regionViews: { "naju": 10 },
    categoryViews: { "AI": 5 }
  }
}

// Response
{
  posts: [
    {
      id: "uuid",
      title: "...",
      score: 154.8,  // 개인화 점수
      scoreBreakdown: {  // 디버그용 (관리자만)
        base: 96,
        boost: 1,
        regionWeight: 1.3,
        geolocation: 1,
        behavior: 30
      }
    }
  ],
  meta: {
    isLoggedIn: false,           // 로그인 여부
    userRegion: "haenam",        // IP 감지 지역
    preferredRegion: null,       // 설정된 선호 지역
    activeBoosts: ["yeongam"],
    appliedMethods: ["regionWeights", "behavior"]
  }
}
```

---

## 8. 구현 로드맵

### Phase 1: 기반 구축 (1주)
- [ ] DB 테이블 생성
- [ ] 개인화 설정 API
- [ ] 관리자 설정 UI (기본)
- [ ] 부스트 CRUD

### Phase 2: 위치 기반 (1주)
- [ ] IP Geolocation 연동
- [ ] 쿠키 동의 배너
- [ ] 지역 감지 API
- [ ] 메인 페이지 적용

### Phase 3: 행동 기반 (1주)
- [ ] LocalStorage 행동 추적
- [ ] 개인화 점수 계산
- [ ] 클라이언트 재정렬
- [ ] 관리자 설정 고도화

### Phase 4: 고도화 (선택)
- [ ] 부스트 캘린더 뷰
- [ ] 효과 분석 대시보드
- [ ] A/B 테스트
- [ ] 반복 부스트

---

## 9. 비즈니스 활용

### 9.1 영업 시나리오

| 상황 | 설정 | 효과 |
|------|------|------|
| 영암군 방문 | 방문 2시간 전 부스트 예약 | 담당자에게 어필 |
| 나주시 상시 | 가중치 1.3 설정 | 주 활동 지역 강조 |
| 광고 캠페인 | 광고주 지역 1주일 부스트 | 광고 가치 증명 |

### 9.2 독자 경험 개선

| 기능 | 독자 혜택 |
|------|----------|
| 위치 기반 | 내 지역 뉴스 바로 확인 |
| 행동 기반 | 관심사 맞춤 뉴스 |
| 지역 선택 | 원하는 지역 고정 가능 |

---

## 10. 참고

### 10.1 관련 파일 (구현 후)
```
src/app/admin/home/
├── page.tsx                 # 홈 관리 대시보드
├── personalization/
│   └── page.tsx             # 개인화 설정
├── boost/
│   └── page.tsx             # 부스트 관리
└── weights/
    └── page.tsx             # 가중치 설정

src/lib/
├── personalization.ts       # 개인화 로직
└── geolocation.ts           # 위치 감지

src/app/api/personalization/
├── settings/route.ts
├── boost/route.ts
├── weights/route.ts
└── ...
```

### 10.2 외부 서비스
- IP Geolocation: ip-api.com (무료 45,000건/월)
- 대안: ipinfo.io, MaxMind GeoLite2

---

## 11. 작업지시서

> **대상:** Gemini Antigravity 또는 개발자
> **우선순위:** Phase 1 → 2 → 3 순서

---

### 📋 Phase 1: 기반 구축 (DB + 관리자 설정 API)

#### 작업 1-1: DB 마이그레이션
```
목표: Supabase에 개인화 관련 테이블 생성

실행할 SQL:
1. personalization_settings 테이블 (전역 설정)
2. boost_schedules 테이블 (부스트 예약)
3. region_weights 테이블 (지역 가중치)
4. user_behavior_logs 테이블 (행동 로그)
5. user_personalization_profiles 테이블 (로그인 사용자 프로필)

참조: 이 문서 섹션 3.1의 SQL 전체

완료 조건:
- [ ] 모든 테이블 생성됨
- [ ] 초기 데이터 삽입됨 (24개 지역 가중치 1.0)
- [ ] 인덱스 생성됨
```

#### 작업 1-2: 개인화 설정 API
```
목표: 관리자가 개인화 방식을 켜고 끌 수 있는 API

파일 생성:
- src/app/api/personalization/settings/route.ts

엔드포인트:
GET /api/personalization/settings
- 응답: { boost: {...}, geolocation: {...}, behavior: {...}, regionWeights: {...} }

PUT /api/personalization/settings
- Body: { settingKey: 'boost', value: { enabled: true, priority: 1 } }
- 응답: { success: true }

인증: 관리자 전용 (role='admin' 또는 적절한 권한 체크)

완료 조건:
- [ ] GET 요청으로 전체 설정 조회 가능
- [ ] PUT 요청으로 개별 설정 변경 가능
- [ ] 비관리자 접근 시 403 반환
```

#### 작업 1-3: 부스트 CRUD API
```
목표: 부스트 스케줄 생성/조회/수정/삭제

파일 생성:
- src/app/api/personalization/boost/route.ts (GET, POST)
- src/app/api/personalization/boost/[id]/route.ts (PUT, DELETE)

GET /api/personalization/boost
- 쿼리: ?active=true (현재 활성만), ?upcoming=true (예약된 것만)
- 응답: { boosts: [...], total: 10 }

POST /api/personalization/boost
- Body: { boost_type, target_value, priority, start_at, end_at, memo }
- 검증: start_at < end_at, priority 1~10 범위

PUT /api/personalization/boost/[id]
- Body: 수정할 필드만

DELETE /api/personalization/boost/[id]
- Soft delete (is_active = false) 또는 Hard delete

완료 조건:
- [ ] 부스트 생성 가능
- [ ] 부스트 목록 조회 (활성/예약 필터)
- [ ] 부스트 수정/삭제 가능
```

#### 작업 1-4: 가중치 API
```
목표: 지역별 상시 가중치 조회/수정

파일 생성:
- src/app/api/personalization/weights/route.ts

GET /api/personalization/weights
- 응답: { weights: [{ region_code, region_name, weight }, ...] }

PUT /api/personalization/weights
- Body: { region_code: 'naju', weight: 1.3 }
- 검증: weight 0.5~3.0 범위

완료 조건:
- [ ] 24개 지역 가중치 목록 조회
- [ ] 개별 지역 가중치 변경 가능
```

---

### 📋 Phase 2: 위치 기반 + 쿠키 시스템

#### 작업 2-1: IP Geolocation API
```
목표: 접속자 IP 기반 지역 감지

파일 생성:
- src/lib/geolocation.ts
- src/app/api/location/detect/route.ts

geolocation.ts 함수:
async function detectRegionByIP(ip: string): Promise<string | null>
- ip-api.com/json/{ip}?fields=city,regionName 호출
- 응답의 city/regionName을 region_code로 매핑
- 예: "나주시" → "naju", "광주광역시" → "gwangju"
- 매핑 실패 시 null 반환

GET /api/location/detect
- 요청자 IP 추출 (x-forwarded-for 또는 socket)
- 응답: { region_code: 'naju', region_name: '나주시', detected: true }

주의사항:
- 로컬 개발 시 IP가 127.0.0.1이면 기본값 반환
- 외부 API 호출 실패 시 null 반환 (서비스 중단 방지)

완료 조건:
- [ ] IP로 지역 감지 가능
- [ ] 24개 전남/광주 지역 코드 매핑 완료
- [ ] API 응답 지연 시 타임아웃 처리 (3초)
```

#### 작업 2-2: 쿠키 설정 시스템
```
목표: 서버에서 읽을 수 있는 개인화 쿠키

파일 생성/수정:
- src/lib/cookies.ts (유틸리티)
- src/components/CookieConsentBanner.tsx (동의 배너)

쿠키 구조:
- kn_session: 익명 세션 ID (자동 생성, 1년)
- kn_region: 감지된 지역 코드 (7일)
- kn_pref_region: 사용자 선택 선호 지역 (1년)
- kn_consent: 쿠키 동의 상태 ('all'|'essential', 1년)

cookies.ts 함수:
- getPersonalizationCookies(request): CookieData
- setPersonalizationCookie(name, value, options): void
- generateSessionId(): string

CookieConsentBanner.tsx:
- 첫 방문 시 표시
- "모두 허용" / "필수만" 선택
- 선택 후 kn_consent 쿠키 설정

완료 조건:
- [ ] 쿠키 읽기/쓰기 유틸리티 완성
- [ ] 쿠키 동의 배너 UI 구현
- [ ] 세션 ID 자동 생성
```

#### 작업 2-3: 행동 추적 (LocalStorage)
```
목표: 클라이언트에서 사용자 행동 추적

파일 생성:
- src/lib/behaviorTracker.ts
- src/hooks/useBehaviorTracker.ts

behaviorTracker.ts:
interface UserBehavior {
  regionViews: Record<string, number>;
  categoryViews: Record<string, number>;
  recentArticles: string[];  // 최근 100개
  lastVisit: string;
  visitCount: number;
}

함수:
- getBehavior(): UserBehavior
- trackArticleView(articleId, regionCode, category): void
- getTopRegions(limit: number): string[]
- clearBehavior(): void

useBehaviorTracker.ts (React Hook):
- 페이지 로드 시 자동 추적
- 기사 상세 페이지에서 trackArticleView 호출

완료 조건:
- [ ] LocalStorage에 행동 데이터 저장
- [ ] 기사 조회 시 자동 추적
- [ ] 30일 이상 된 데이터 자동 정리
```

#### 작업 2-4: 홈페이지 개인화 적용
```
목표: 메인 페이지에서 개인화된 기사 목록 표시

파일 수정:
- src/app/(site)/page.tsx
- src/app/api/posts/route.ts

api/posts/route.ts 수정:
POST /api/posts?personalize=true
- 요청 Body에서 userBehavior 추출 (비로그인)
- 쿠키에서 kn_region, kn_pref_region 추출
- 로그인 시 DB에서 프로필 조회
- 개인화 점수 계산 후 정렬
- 응답에 meta 정보 포함

page.tsx 수정:
- 클라이언트 컴포넌트로 변경 (또는 하이브리드)
- LocalStorage에서 행동 데이터 로드
- POST 요청으로 개인화된 기사 조회
- 로딩 중 스켈레톤 표시

완료 조건:
- [ ] 위치 기반 기사 상단 노출
- [ ] 행동 기반 가중치 적용
- [ ] 부스트 활성 시 최상단 노출
- [ ] meta 정보로 개인화 상태 확인 가능
```

---

### 📋 Phase 3: 로그인 사용자 동기화 + 관리자 UI

#### 작업 3-1: 사용자 프로필 API
```
목표: 로그인 사용자의 개인화 프로필 관리

파일 생성:
- src/app/api/personalization/profile/route.ts
- src/app/api/personalization/sync/route.ts

GET /api/personalization/profile
- 인증: 로그인 필수
- 응답: { preferred_region, region_views, category_views }

PUT /api/personalization/profile
- Body: { preferred_region: 'naju' }
- 사용자가 직접 선호 지역 설정

POST /api/personalization/sync
- Body: { regionViews: {...}, categoryViews: {...} }
- LocalStorage 데이터를 DB에 병합
- 병합 로직: 더 큰 값 유지 (Math.max)
- 응답: { merged: {...} }

완료 조건:
- [ ] 로그인 사용자 프로필 조회/수정
- [ ] LocalStorage → DB 동기화
- [ ] 로그인 직후 자동 동기화 호출
```

#### 작업 3-2: 관리자 개인화 설정 UI
```
목표: 관리자가 개인화 방식을 선택/설정하는 페이지

파일 생성:
- src/app/admin/home/personalization/page.tsx

UI 구성 (이 문서 섹션 2.1 참조):
1. 체크박스로 각 방식 활성화/비활성화
   - 부스트 시스템 ☑️
   - 위치 기반 ☑️
   - 행동 기반 ☑️
   - 상시 가중치 ☑️

2. 각 방식별 상세 설정
   - 부스트: 우선순위 선택
   - 위치 기반: 가중치 슬라이더 (1.0~3.0)
   - 행동 기반: 학습 기간, 최소 조회수
   - 상시 가중치: [상세 설정] 버튼

3. 우선순위 순서 변경 (드래그 또는 숫자 입력)

4. 저장/초기화 버튼

사용 훅:
- useToast() (성공/오류 메시지)
- useSWR 또는 React Query (설정 조회)

완료 조건:
- [ ] 4가지 방식 토글 가능
- [ ] 각 방식 상세 설정 가능
- [ ] 우선순위 변경 가능
- [ ] 저장 시 API 호출 + 토스트 메시지
```

#### 작업 3-3: 부스트 관리 UI
```
목표: 부스트 예약 생성/관리 페이지

파일 생성:
- src/app/admin/home/boost/page.tsx

UI 구성 (이 문서 섹션 6.1 참조):
1. 현재 활성 부스트 목록 (삭제 가능)
2. 예약된 부스트 목록 (수정/삭제 가능)
3. 새 부스트 추가 폼
   - 유형: 지역/특정 기사/카테고리 (라디오)
   - 대상: 드롭다운 또는 기사 검색
   - 시작/종료 일시: DateTimePicker
   - 우선순위: 슬라이더 1~10
   - 반복: 없음/매일/매주
   - 메모: 텍스트 입력

4. 미리보기 버튼 (선택 시 홈페이지 프리뷰)

완료 조건:
- [ ] 부스트 목록 조회 (활성/예약 구분)
- [ ] 부스트 생성 폼 동작
- [ ] 부스트 수정/삭제 가능
- [ ] 유효성 검증 (시작 < 종료 등)
```

#### 작업 3-4: 가중치 설정 UI
```
목표: 지역별 상시 가중치 설정 페이지

파일 생성:
- src/app/admin/home/weights/page.tsx

UI 구성 (이 문서 섹션 6.2 참조):
1. 광역/도 (2개) - 슬라이더
2. 시 (5개) - 슬라이더
3. 군 (17개) - 접기/펼치기 + 슬라이더

각 슬라이더:
- 범위: 0.5 ~ 3.0 (0.1 단위)
- 현재 값 표시
- 1.0 기본선 표시

4. 저장/초기화 버튼
5. 도움말: "1.3 이상은 부스트와 유사한 효과"

완료 조건:
- [ ] 24개 지역 가중치 조회/표시
- [ ] 슬라이더로 가중치 변경
- [ ] 일괄 저장 기능
- [ ] 초기화 (모두 1.0) 기능
```

---

### 📋 Phase 4: 고도화 (선택)

#### 작업 4-1: 부스트 캘린더 뷰
- FullCalendar 또는 유사 라이브러리
- 예약된 부스트를 달력에 표시
- 드래그로 시간 변경

#### 작업 4-2: 효과 분석 대시보드
- 개인화 적용 전/후 지표 비교
- 지역별 조회수, 체류시간 차트
- 부스트 효과 분석

#### 작업 4-3: A/B 테스트
- 일부 사용자에게만 개인화 적용
- 효과 비교 측정

---

*작업지시서 끝*

---

*이 문서는 Korea NEWS 개인화 시스템의 기획 및 작업지시서입니다.*

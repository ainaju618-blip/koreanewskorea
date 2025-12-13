# 홈페이지 개인화 시스템 구현 작업지시서

> **프로젝트:** Korea NEWS
> **기획 문서:** `docs/features/PERSONALIZATION_SYSTEM.md`
> **대상:** Gemini Antigravity
> **우선순위:** Phase 1 → 2 → 3 순서대로 진행

---

## 시스템 개요

홈페이지에 4가지 개인화 방식을 도입합니다:
1. **부스트 시스템**: 특정 기사/지역을 예약 시간에 상단 노출 (영업용)
2. **위치 기반**: IP로 접속 지역 감지하여 해당 지역 기사 우선 노출
3. **행동 기반**: 자주 본 지역/카테고리 학습하여 우선 노출
4. **상시 가중치**: 특정 지역의 기본 노출 비율 상향 조정

**핵심 원칙:** 로그인/비로그인 사용자 모두 지원

---

## Phase 1: 기반 구축 (DB + 관리자 설정 API)

### 작업 1-1: DB 마이그레이션

Supabase SQL 에디터에서 실행:

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
    boost_type VARCHAR(20) NOT NULL,  -- 'region' | 'article' | 'category'
    target_value VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    repeat_type VARCHAR(20),  -- 'none' | 'daily' | 'weekly'
    repeat_days INTEGER[],
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

-- 초기 데이터 (24개 지역)
INSERT INTO region_weights (region_code, region_name, weight) VALUES
('gwangju', '광주광역시', 1.0),
('jeonnam', '전라남도', 1.0),
('naju', '나주시', 1.0),
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
    session_id VARCHAR(100),
    user_id UUID REFERENCES auth.users(id),
    article_id UUID REFERENCES posts(id),
    region_code VARCHAR(20),
    category VARCHAR(20),
    action VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_user_identity CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

-- 5. 로그인 사용자 개인화 프로필
CREATE TABLE user_personalization_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    preferred_region VARCHAR(20),
    region_views JSONB DEFAULT '{}',
    category_views JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_boost_active ON boost_schedules(is_active, start_at, end_at);
CREATE INDEX idx_behavior_session ON user_behavior_logs(session_id, created_at);
CREATE INDEX idx_behavior_user ON user_behavior_logs(user_id, created_at);
```

**완료 조건:**
- [ ] 5개 테이블 생성됨
- [ ] 24개 지역 가중치 초기 데이터 삽입됨
- [ ] 인덱스 생성됨

---

### 작업 1-2: 개인화 설정 API

**파일 생성:** `src/app/api/personalization/settings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 전체 설정 조회
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('personalization_settings')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 배열을 객체로 변환 { boost: {...}, geolocation: {...}, ... }
  const settings = data.reduce((acc, item) => {
    acc[item.setting_key] = item.setting_value;
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json(settings);
}

// PUT: 설정 업데이트
export async function PUT(request: NextRequest) {
  // TODO: 관리자 권한 체크 추가

  const body = await request.json();
  const { settingKey, value } = body;

  if (!settingKey || !value) {
    return NextResponse.json({ error: 'settingKey와 value 필요' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('personalization_settings')
    .update({
      setting_value: value,
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', settingKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**완료 조건:**
- [ ] GET으로 4가지 설정 모두 조회 가능
- [ ] PUT으로 개별 설정 변경 가능

---

### 작업 1-3: 부스트 CRUD API

**파일 생성:** `src/app/api/personalization/boost/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 부스트 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const upcoming = searchParams.get('upcoming');

  let query = supabaseAdmin
    .from('boost_schedules')
    .select('*')
    .eq('is_active', true)
    .order('start_at', { ascending: true });

  const now = new Date().toISOString();

  if (active === 'true') {
    query = query.lte('start_at', now).gte('end_at', now);
  } else if (upcoming === 'true') {
    query = query.gt('start_at', now);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boosts: data, total: data.length });
}

// POST: 부스트 생성
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { boost_type, target_value, priority, start_at, end_at, memo, repeat_type, repeat_days } = body;

  // 유효성 검증
  if (!boost_type || !target_value || !start_at || !end_at) {
    return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
  }

  if (new Date(start_at) >= new Date(end_at)) {
    return NextResponse.json({ error: '시작 시간은 종료 시간보다 이전이어야 합니다' }, { status: 400 });
  }

  if (priority && (priority < 1 || priority > 10)) {
    return NextResponse.json({ error: '우선순위는 1~10 범위' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('boost_schedules')
    .insert({
      boost_type,
      target_value,
      priority: priority || 5,
      start_at,
      end_at,
      memo,
      repeat_type: repeat_type || 'none',
      repeat_days
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, boost: data });
}
```

**파일 생성:** `src/app/api/personalization/boost/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT: 부스트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { error } = await supabaseAdmin
    .from('boost_schedules')
    .update(body)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: 부스트 삭제 (Soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('boost_schedules')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**완료 조건:**
- [ ] 부스트 생성 가능 (유효성 검증 포함)
- [ ] 활성/예약 부스트 필터 조회 가능
- [ ] 부스트 수정/삭제 가능

---

### 작업 1-4: 가중치 API

**파일 생성:** `src/app/api/personalization/weights/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: 모든 지역 가중치 조회
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('region_weights')
    .select('*')
    .order('region_code');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ weights: data });
}

// PUT: 가중치 수정
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { region_code, weight } = body;

  if (!region_code || weight === undefined) {
    return NextResponse.json({ error: 'region_code와 weight 필요' }, { status: 400 });
  }

  if (weight < 0.5 || weight > 3.0) {
    return NextResponse.json({ error: 'weight는 0.5~3.0 범위' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('region_weights')
    .update({
      weight,
      updated_at: new Date().toISOString()
    })
    .eq('region_code', region_code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**완료 조건:**
- [ ] 24개 지역 가중치 목록 조회
- [ ] 개별 가중치 수정 가능 (0.5~3.0 범위 검증)

---

## Phase 2: 위치 기반 + 쿠키 시스템

### 작업 2-1: IP Geolocation

**파일 생성:** `src/lib/geolocation.ts`

```typescript
// 지역 이름 → 코드 매핑
const REGION_MAP: Record<string, string> = {
  '광주': 'gwangju', '광주광역시': 'gwangju',
  '전남': 'jeonnam', '전라남도': 'jeonnam',
  '나주': 'naju', '나주시': 'naju',
  '목포': 'mokpo', '목포시': 'mokpo',
  '여수': 'yeosu', '여수시': 'yeosu',
  '순천': 'suncheon', '순천시': 'suncheon',
  '광양': 'gwangyang', '광양시': 'gwangyang',
  '담양': 'damyang', '담양군': 'damyang',
  '곡성': 'gokseong', '곡성군': 'gokseong',
  '구례': 'gurye', '구례군': 'gurye',
  '고흥': 'goheung', '고흥군': 'goheung',
  '보성': 'boseong', '보성군': 'boseong',
  '화순': 'hwasun', '화순군': 'hwasun',
  '장흥': 'jangheung', '장흥군': 'jangheung',
  '강진': 'gangjin', '강진군': 'gangjin',
  '해남': 'haenam', '해남군': 'haenam',
  '영암': 'yeongam', '영암군': 'yeongam',
  '무안': 'muan', '무안군': 'muan',
  '함평': 'hampyeong', '함평군': 'hampyeong',
  '영광': 'yeonggwang', '영광군': 'yeonggwang',
  '장성': 'jangseong', '장성군': 'jangseong',
  '완도': 'wando', '완도군': 'wando',
  '진도': 'jindo', '진도군': 'jindo',
  '신안': 'shinan', '신안군': 'shinan',
};

export async function detectRegionByIP(ip: string): Promise<{ code: string; name: string } | null> {
  // 로컬 개발 환경
  if (ip === '127.0.0.1' || ip === '::1') {
    return { code: 'gwangju', name: '광주광역시' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await response.json();

    if (data.status !== 'success') return null;

    // city 또는 regionName에서 지역 코드 찾기
    const city = data.city || '';
    const region = data.regionName || '';

    for (const [name, code] of Object.entries(REGION_MAP)) {
      if (city.includes(name) || region.includes(name)) {
        return { code, name };
      }
    }

    return null;
  } catch (error) {
    console.error('IP Geolocation 실패:', error);
    return null;
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}
```

**파일 생성:** `src/app/api/location/detect/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { detectRegionByIP, getClientIP } from '@/lib/geolocation';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const region = await detectRegionByIP(ip);

  if (!region) {
    return NextResponse.json({
      detected: false,
      region_code: null,
      region_name: null
    });
  }

  return NextResponse.json({
    detected: true,
    region_code: region.code,
    region_name: region.name
  });
}
```

**완료 조건:**
- [ ] IP로 지역 감지 가능
- [ ] 24개 지역 코드 매핑 완료
- [ ] 타임아웃 3초 처리

---

### 작업 2-2: 쿠키 시스템

**파일 생성:** `src/lib/cookies.ts`

```typescript
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export interface PersonalizationCookies {
  sessionId: string;
  region: string | null;
  preferredRegion: string | null;
  consent: 'all' | 'essential' | null;
}

export async function getPersonalizationCookies(): Promise<PersonalizationCookies> {
  const cookieStore = await cookies();

  return {
    sessionId: cookieStore.get('kn_session')?.value || '',
    region: cookieStore.get('kn_region')?.value || null,
    preferredRegion: cookieStore.get('kn_pref_region')?.value || null,
    consent: cookieStore.get('kn_consent')?.value as 'all' | 'essential' | null,
  };
}

export function generateSessionId(): string {
  return uuidv4();
}
```

**파일 생성:** `src/components/CookieConsentBanner.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { setCookie, getCookie } from 'cookies-next';

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getCookie('kn_consent');
    if (!consent) {
      setShow(true);
    }

    // 세션 ID 없으면 생성
    if (!getCookie('kn_session')) {
      setCookie('kn_session', crypto.randomUUID(), { maxAge: 365 * 24 * 60 * 60 });
    }
  }, []);

  const handleAccept = (type: 'all' | 'essential') => {
    setCookie('kn_consent', type, { maxAge: 365 * 24 * 60 * 60 });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">🍪 쿠키 사용 안내</p>
          <p>코리아NEWS는 맞춤 뉴스 추천을 위해 쿠키를 사용합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAccept('essential')}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            필수만
          </button>
          <button
            onClick={() => handleAccept('all')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            모두 허용
          </button>
        </div>
      </div>
    </div>
  );
}
```

**RootLayout에 추가:** `src/app/layout.tsx`

```tsx
import CookieConsentBanner from '@/components/CookieConsentBanner';

// ... 기존 코드 ...

<body>
  <Providers>
    {children}
    <CookieConsentBanner />
  </Providers>
</body>
```

**완료 조건:**
- [ ] 첫 방문 시 쿠키 동의 배너 표시
- [ ] 세션 ID 자동 생성
- [ ] 쿠키 읽기/쓰기 유틸리티 완성

---

### 작업 2-3: 행동 추적 (LocalStorage)

**파일 생성:** `src/lib/behaviorTracker.ts`

```typescript
const STORAGE_KEY = 'kn_behavior';
const MAX_RECENT_ARTICLES = 100;

export interface UserBehavior {
  regionViews: Record<string, number>;
  categoryViews: Record<string, number>;
  recentArticles: string[];
  lastVisit: string;
  visitCount: number;
}

export function getBehavior(): UserBehavior {
  if (typeof window === 'undefined') {
    return getEmptyBehavior();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getEmptyBehavior();
    return JSON.parse(stored);
  } catch {
    return getEmptyBehavior();
  }
}

export function trackArticleView(articleId: string, regionCode: string, category: string) {
  if (typeof window === 'undefined') return;

  const behavior = getBehavior();

  // 지역 조회수 증가
  behavior.regionViews[regionCode] = (behavior.regionViews[regionCode] || 0) + 1;

  // 카테고리 조회수 증가
  behavior.categoryViews[category] = (behavior.categoryViews[category] || 0) + 1;

  // 최근 기사 추가 (중복 제거)
  behavior.recentArticles = [
    articleId,
    ...behavior.recentArticles.filter(id => id !== articleId)
  ].slice(0, MAX_RECENT_ARTICLES);

  // 방문 정보 업데이트
  behavior.lastVisit = new Date().toISOString();
  behavior.visitCount += 1;

  saveBehavior(behavior);
}

export function getTopRegions(limit: number = 5): string[] {
  const behavior = getBehavior();
  return Object.entries(behavior.regionViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([code]) => code);
}

export function clearBehavior() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

function getEmptyBehavior(): UserBehavior {
  return {
    regionViews: {},
    categoryViews: {},
    recentArticles: [],
    lastVisit: new Date().toISOString(),
    visitCount: 0
  };
}

function saveBehavior(behavior: UserBehavior) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(behavior));
}
```

**파일 생성:** `src/hooks/useBehaviorTracker.ts`

```typescript
'use client';

import { useEffect } from 'react';
import { trackArticleView, getBehavior, UserBehavior } from '@/lib/behaviorTracker';

export function useBehaviorTracker() {
  const track = (articleId: string, regionCode: string, category: string) => {
    trackArticleView(articleId, regionCode, category);
  };

  const behavior = getBehavior();

  return { track, behavior };
}

// 기사 상세 페이지에서 사용하는 훅
export function useArticleViewTracker(
  articleId: string,
  regionCode: string,
  category: string
) {
  useEffect(() => {
    trackArticleView(articleId, regionCode, category);
  }, [articleId, regionCode, category]);
}
```

**완료 조건:**
- [ ] LocalStorage에 행동 데이터 저장
- [ ] 기사 조회 시 자동 추적

---

### 작업 2-4: 홈페이지 개인화 적용

**파일 생성:** `src/lib/personalization.ts`

```typescript
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserBehavior } from './behaviorTracker';

interface PersonalizationContext {
  isLoggedIn: boolean;
  userId: string | null;
  sessionId: string;
  userRegion: string | null;
  preferredRegion: string | null;
  userBehavior: UserBehavior | null;
}

interface ArticleWithScore {
  id: string;
  title: string;
  score: number;
  [key: string]: any;
}

export async function getPersonalizedPosts(
  context: PersonalizationContext,
  limit: number = 20
): Promise<{ posts: ArticleWithScore[]; meta: any }> {
  // 1. 설정 조회
  const { data: settingsData } = await supabaseAdmin
    .from('personalization_settings')
    .select('*');

  const settings = settingsData?.reduce((acc, item) => {
    acc[item.setting_key] = item.setting_value;
    return acc;
  }, {} as Record<string, any>) || {};

  // 2. 활성 부스트 조회
  const now = new Date().toISOString();
  const { data: activeBoosts } = await supabaseAdmin
    .from('boost_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now);

  // 3. 가중치 조회
  const { data: weights } = await supabaseAdmin
    .from('region_weights')
    .select('*');

  const weightMap = weights?.reduce((acc, w) => {
    acc[w.region_code] = w.weight;
    return acc;
  }, {} as Record<string, number>) || {};

  // 4. 기사 조회
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit * 2); // 정렬 후 자를 것이므로 넉넉히

  if (!posts) return { posts: [], meta: {} };

  // 5. 점수 계산
  const scoredPosts = posts.map(post => {
    let score = getBaseTimeScore(post.published_at);

    // 부스트 적용
    if (settings.boost?.enabled) {
      const boost = activeBoosts?.find(b =>
        (b.boost_type === 'region' && b.target_value === post.source) ||
        (b.boost_type === 'article' && b.target_value === post.id) ||
        (b.boost_type === 'category' && b.target_value === post.category)
      );
      if (boost) {
        score *= boost.priority * 10;
      }
    }

    // 가중치 적용
    if (settings.regionWeights?.enabled) {
      const weight = weightMap[post.source] || 1.0;
      score *= weight;
    }

    // 위치 기반 적용
    if (settings.geolocation?.enabled) {
      const targetRegion = context.preferredRegion || context.userRegion;
      if (targetRegion === post.source) {
        score *= settings.geolocation.weight || 1.5;
      }
    }

    // 행동 기반 적용
    if (settings.behavior?.enabled && context.userBehavior) {
      const regionViews = context.userBehavior.regionViews[post.source] || 0;
      const categoryViews = context.userBehavior.categoryViews[post.category] || 0;
      score += Math.min(regionViews * 3, 30);
      score += Math.min(categoryViews * 2, 20);
    }

    return { ...post, score };
  });

  // 6. 점수순 정렬 및 반환
  const sorted = scoredPosts.sort((a, b) => b.score - a.score).slice(0, limit);

  return {
    posts: sorted,
    meta: {
      isLoggedIn: context.isLoggedIn,
      userRegion: context.userRegion,
      preferredRegion: context.preferredRegion,
      activeBoosts: activeBoosts?.map(b => b.target_value) || [],
      appliedMethods: Object.entries(settings)
        .filter(([, v]) => (v as any)?.enabled)
        .map(([k]) => k)
    }
  };
}

function getBaseTimeScore(publishedAt: string): number {
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  return Math.max(100 - (hoursAgo * 2), 10);
}
```

**파일 수정:** `src/app/api/posts/route.ts` (기존 파일에 개인화 로직 추가)

```typescript
// 기존 GET 핸들러에 personalize 쿼리 파라미터 처리 추가

import { getPersonalizedPosts } from '@/lib/personalization';
import { getPersonalizationCookies } from '@/lib/cookies';
import { detectRegionByIP, getClientIP } from '@/lib/geolocation';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('personalize') === 'true') {
    const body = await request.json().catch(() => ({}));
    const cookies = await getPersonalizationCookies();
    const ip = getClientIP(request);
    const region = await detectRegionByIP(ip);

    const context = {
      isLoggedIn: false, // TODO: 세션 체크 추가
      userId: null,
      sessionId: cookies.sessionId,
      userRegion: region?.code || null,
      preferredRegion: cookies.preferredRegion,
      userBehavior: body.userBehavior || null,
    };

    const result = await getPersonalizedPosts(context);
    return NextResponse.json(result);
  }

  // 기존 로직...
}
```

**완료 조건:**
- [ ] POST /api/posts?personalize=true 동작
- [ ] 점수 계산 알고리즘 적용
- [ ] meta 정보 반환

---

## Phase 3: 로그인 사용자 동기화 + 관리자 UI

### 작업 3-1: 사용자 프로필 API

**파일 생성:** `src/app/api/personalization/profile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('user_personalization_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || {
    preferred_region: null,
    region_views: {},
    category_views: {}
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const body = await request.json();
  const { preferred_region } = body;

  const { error } = await supabaseAdmin
    .from('user_personalization_profiles')
    .upsert({
      user_id: user.id,
      preferred_region,
      updated_at: new Date().toISOString()
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**파일 생성:** `src/app/api/personalization/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const body = await request.json();
  const { regionViews, categoryViews } = body;

  // 기존 프로필 조회
  const { data: existing } = await supabaseAdmin
    .from('user_personalization_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 병합 (더 큰 값 유지)
  const mergedRegionViews = { ...existing?.region_views };
  for (const [key, value] of Object.entries(regionViews || {})) {
    mergedRegionViews[key] = Math.max(mergedRegionViews[key] || 0, value as number);
  }

  const mergedCategoryViews = { ...existing?.category_views };
  for (const [key, value] of Object.entries(categoryViews || {})) {
    mergedCategoryViews[key] = Math.max(mergedCategoryViews[key] || 0, value as number);
  }

  // 저장
  const { error } = await supabaseAdmin
    .from('user_personalization_profiles')
    .upsert({
      user_id: user.id,
      region_views: mergedRegionViews,
      category_views: mergedCategoryViews,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    merged: {
      regionViews: mergedRegionViews,
      categoryViews: mergedCategoryViews
    }
  });
}
```

**완료 조건:**
- [ ] 프로필 조회/수정 API 동작
- [ ] LocalStorage → DB 동기화 API 동작

---

### 작업 3-2 ~ 3-4: 관리자 UI

관리자 UI는 Phase 1-2 API 완료 후 진행합니다.

**생성할 페이지:**
- `src/app/admin/home/personalization/page.tsx` - 개인화 설정 (4가지 방식 토글)
- `src/app/admin/home/boost/page.tsx` - 부스트 관리 (생성/목록/수정/삭제)
- `src/app/admin/home/weights/page.tsx` - 가중치 설정 (24개 지역 슬라이더)

UI 구현 시 참조:
- 기획 문서의 와이어프레임 (섹션 2.1, 6.1, 6.2)
- 기존 관리자 페이지 스타일 참고 (`src/app/admin/` 하위)
- useToast() 훅 사용 (시스템 alert 금지)

---

## 완료 체크리스트

### Phase 1
- [ ] DB 테이블 5개 생성
- [ ] `/api/personalization/settings` GET/PUT
- [ ] `/api/personalization/boost` CRUD
- [ ] `/api/personalization/weights` GET/PUT

### Phase 2
- [ ] `src/lib/geolocation.ts` IP 감지
- [ ] `/api/location/detect` API
- [ ] `src/lib/cookies.ts` + 동의 배너
- [ ] `src/lib/behaviorTracker.ts` LocalStorage 추적
- [ ] `src/lib/personalization.ts` 점수 계산
- [ ] `/api/posts?personalize=true` 개인화 기사 목록

### Phase 3
- [ ] `/api/personalization/profile` GET/PUT
- [ ] `/api/personalization/sync` POST
- [ ] 관리자 UI 3개 페이지

---

*작업지시서 끝 - 문의사항은 Claude에게*

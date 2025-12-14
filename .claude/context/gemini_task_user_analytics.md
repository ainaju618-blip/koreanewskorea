# Gemini 작업지시서: 사용자 분석 시스템 구축

> **작성일:** 2025-12-14
> **프로젝트:** Korea NEWS
> **작업 목적:** 사용자 행동 데이터 수집 및 분석 대시보드 구축

---

## 1. 작업 개요

사용자 행동 데이터를 자체 DB에 수집하고, 관리자가 다양한 조건으로 검색·분석할 수 있는 대시보드를 구축한다.

### 핵심 요구사항
1. **데이터 수집**: 페이지뷰, 클릭, 체류시간, 검색어 등 자동 수집
2. **실시간 저장**: Supabase에 로그 테이블 생성 및 저장
3. **분석 대시보드**: 관리자 페이지에서 다양한 조건으로 검색/필터링
4. **시각화**: 차트, 그래프로 트렌드 파악

---

## 2. 데이터베이스 설계

### 2.1 페이지뷰 로그 테이블

```sql
-- Supabase SQL Editor에서 실행

-- 페이지뷰 로그 테이블
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 페이지 정보
    path TEXT NOT NULL,                    -- 방문 경로 (예: /news/123)
    page_type TEXT,                        -- 페이지 타입 (home, article, category, author)
    article_id UUID REFERENCES posts(id),  -- 기사 페이지인 경우 기사 ID
    category TEXT,                         -- 카테고리

    -- 사용자 식별 (익명)
    session_id TEXT NOT NULL,              -- 세션 ID (쿠키 기반)
    visitor_id TEXT,                       -- 방문자 ID (로컬스토리지 기반, 장기 추적)

    -- 유입 정보
    referrer TEXT,                         -- 유입 경로
    referrer_domain TEXT,                  -- 유입 도메인 (naver, google, direct 등)
    utm_source TEXT,                       -- UTM 소스
    utm_medium TEXT,                       -- UTM 매체
    utm_campaign TEXT,                     -- UTM 캠페인

    -- 디바이스 정보
    user_agent TEXT,                       -- User-Agent 원본
    device_type TEXT,                      -- mobile, tablet, desktop
    browser TEXT,                          -- Chrome, Safari, Firefox 등
    os TEXT,                               -- Windows, macOS, iOS, Android 등

    -- 위치 정보 (IP 기반)
    ip_hash TEXT,                          -- IP 해시 (개인정보 보호)
    country TEXT,                          -- 국가
    region TEXT,                           -- 지역 (광주, 전남 등)
    city TEXT,                             -- 도시

    -- 시간 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 체류 시간 (나중에 업데이트)
    duration_seconds INTEGER,              -- 체류 시간 (초)
    scroll_depth INTEGER,                  -- 스크롤 깊이 (%)

    -- 인덱스용
    created_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- 인덱스 생성
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_created_date ON page_views(created_date);
CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_page_type ON page_views(page_type);
CREATE INDEX idx_page_views_article_id ON page_views(article_id);
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_device_type ON page_views(device_type);
CREATE INDEX idx_page_views_referrer_domain ON page_views(referrer_domain);
CREATE INDEX idx_page_views_region ON page_views(region);
```

### 2.2 이벤트 로그 테이블

```sql
-- 사용자 이벤트 로그 (클릭, 공유, 검색 등)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 이벤트 정보
    event_type TEXT NOT NULL,              -- click, share, search, scroll, video_play 등
    event_category TEXT,                   -- article, navigation, social, search
    event_action TEXT,                     -- 구체적 행동 (예: share_kakao, click_related)
    event_label TEXT,                      -- 추가 라벨 (예: 기사 제목)
    event_value INTEGER,                   -- 수치 값 (예: 스크롤 %)

    -- 대상 정보
    target_path TEXT,                      -- 클릭한 링크 경로
    target_element TEXT,                   -- 클릭한 요소 (버튼명 등)
    article_id UUID REFERENCES posts(id),  -- 관련 기사 ID

    -- 사용자 식별
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    page_view_id UUID REFERENCES page_views(id), -- 해당 페이지뷰 연결

    -- 컨텍스트
    current_path TEXT,                     -- 이벤트 발생 페이지

    -- 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- 인덱스 생성
CREATE INDEX idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_session_id ON user_events(session_id);
CREATE INDEX idx_user_events_article_id ON user_events(article_id);
```

### 2.3 검색어 로그 테이블

```sql
-- 검색어 로그
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 검색 정보
    query TEXT NOT NULL,                   -- 검색어
    query_normalized TEXT,                 -- 정규화된 검색어 (소문자, 공백 제거)
    results_count INTEGER,                 -- 검색 결과 수

    -- 사용자 행동
    clicked_article_id UUID,               -- 클릭한 기사 ID
    clicked_position INTEGER,              -- 클릭한 순위

    -- 사용자 식별
    session_id TEXT NOT NULL,
    visitor_id TEXT,

    -- 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- 인덱스 생성
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_search_logs_query_normalized ON search_logs(query_normalized);
```

### 2.4 기사별 통계 테이블 (집계용)

```sql
-- 기사별 일간 통계 (배치 집계)
CREATE TABLE article_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES posts(id),
    stat_date DATE NOT NULL,

    -- 조회 통계
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- 체류 통계
    avg_duration_seconds INTEGER DEFAULT 0,
    avg_scroll_depth INTEGER DEFAULT 0,

    -- 유입 통계
    from_direct INTEGER DEFAULT 0,
    from_search INTEGER DEFAULT 0,
    from_social INTEGER DEFAULT 0,
    from_referral INTEGER DEFAULT 0,

    -- 디바이스 통계
    from_mobile INTEGER DEFAULT 0,
    from_desktop INTEGER DEFAULT 0,
    from_tablet INTEGER DEFAULT 0,

    -- 이벤트 통계
    shares INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(article_id, stat_date)
);

-- 인덱스
CREATE INDEX idx_article_daily_stats_date ON article_daily_stats(stat_date DESC);
CREATE INDEX idx_article_daily_stats_article ON article_daily_stats(article_id);
```

### 2.5 실시간 통계 뷰

```sql
-- 오늘의 실시간 통계 뷰
CREATE OR REPLACE VIEW today_stats AS
SELECT
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT article_id) FILTER (WHERE article_id IS NOT NULL) as articles_viewed,
    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_views,
    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_views,
    AVG(duration_seconds) FILTER (WHERE duration_seconds > 0) as avg_duration
FROM page_views
WHERE created_date = CURRENT_DATE;

-- 시간대별 통계 뷰
CREATE OR REPLACE VIEW hourly_stats AS
SELECT
    date_trunc('hour', created_at) as hour,
    COUNT(*) as views,
    COUNT(DISTINCT session_id) as sessions
FROM page_views
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hour DESC;
```

---

## 3. 프론트엔드 수집 코드

### 3.1 분석 유틸리티 생성

**파일 생성:** `src/lib/analytics.ts`

```typescript
// 세션 ID 관리
function getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

// 방문자 ID 관리 (장기 추적)
function getVisitorId(): string {
    let visitorId = localStorage.getItem('analytics_visitor_id');
    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('analytics_visitor_id', visitorId);
    }
    return visitorId;
}

// 디바이스 타입 감지
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
}

// 브라우저 감지
function getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('SamsungBrowser')) return 'Samsung';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Other';
}

// OS 감지
function getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Other';
}

// Referrer 도메인 추출
function getReferrerDomain(): string {
    if (!document.referrer) return 'direct';
    try {
        const url = new URL(document.referrer);
        const hostname = url.hostname;
        if (hostname.includes('google')) return 'google';
        if (hostname.includes('naver')) return 'naver';
        if (hostname.includes('daum')) return 'daum';
        if (hostname.includes('facebook')) return 'facebook';
        if (hostname.includes('instagram')) return 'instagram';
        if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
        if (hostname.includes('kakao')) return 'kakao';
        if (hostname === window.location.hostname) return 'internal';
        return hostname;
    } catch {
        return 'unknown';
    }
}

// UTM 파라미터 추출
function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
    const params = new URLSearchParams(window.location.search);
    return {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
    };
}

// 페이지 타입 감지
function getPageType(path: string): string {
    if (path === '/') return 'home';
    if (path.startsWith('/news/')) return 'article';
    if (path.startsWith('/category/') || path.startsWith('/gwangju') || path.startsWith('/jeonnam')) return 'category';
    if (path.startsWith('/author/')) return 'author';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/admin')) return 'admin';
    return 'other';
}

// 기사 ID 추출
function getArticleId(path: string): string | null {
    const match = path.match(/\/news\/([a-f0-9-]+)/);
    return match ? match[1] : null;
}

// 페이지뷰 기록
export async function trackPageView(): Promise<string | null> {
    const path = window.location.pathname;
    const utm = getUTMParams();

    const data = {
        path,
        page_type: getPageType(path),
        article_id: getArticleId(path),
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        referrer: document.referrer || null,
        referrer_domain: getReferrerDomain(),
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
    };

    try {
        const response = await fetch('/api/analytics/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        return result.id || null;
    } catch (error) {
        console.error('Failed to track pageview:', error);
        return null;
    }
}

// 체류시간 및 스크롤 업데이트
export async function updatePageViewMetrics(pageViewId: string, duration: number, scrollDepth: number): Promise<void> {
    try {
        await fetch('/api/analytics/pageview/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: pageViewId,
                duration_seconds: Math.round(duration / 1000),
                scroll_depth: scrollDepth,
            }),
        });
    } catch (error) {
        console.error('Failed to update pageview metrics:', error);
    }
}

// 이벤트 기록
export async function trackEvent(
    eventType: string,
    eventCategory: string,
    eventAction: string,
    eventLabel?: string,
    eventValue?: number,
    targetPath?: string,
    articleId?: string
): Promise<void> {
    const data = {
        event_type: eventType,
        event_category: eventCategory,
        event_action: eventAction,
        event_label: eventLabel,
        event_value: eventValue,
        target_path: targetPath,
        article_id: articleId,
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        current_path: window.location.pathname,
    };

    try {
        await fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error('Failed to track event:', error);
    }
}

// 검색어 기록
export async function trackSearch(query: string, resultsCount: number): Promise<void> {
    const data = {
        query,
        query_normalized: query.toLowerCase().trim().replace(/\s+/g, ' '),
        results_count: resultsCount,
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
    };

    try {
        await fetch('/api/analytics/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error('Failed to track search:', error);
    }
}
```

### 3.2 분석 프로바이더 컴포넌트

**파일 생성:** `src/components/AnalyticsProvider.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, updatePageViewMetrics } from '@/lib/analytics';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const pageViewIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const maxScrollRef = useRef<number>(0);

    useEffect(() => {
        // 페이지 변경 시 페이지뷰 기록
        startTimeRef.current = Date.now();
        maxScrollRef.current = 0;

        trackPageView().then((id) => {
            pageViewIdRef.current = id;
        });

        // 스크롤 추적
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
            maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // 페이지 이탈 시 체류시간 업데이트
        const handleBeforeUnload = () => {
            if (pageViewIdRef.current) {
                const duration = Date.now() - startTimeRef.current;
                // sendBeacon 사용 (페이지 이탈 시에도 전송 보장)
                navigator.sendBeacon(
                    '/api/analytics/pageview/update',
                    JSON.stringify({
                        id: pageViewIdRef.current,
                        duration_seconds: Math.round(duration / 1000),
                        scroll_depth: maxScrollRef.current,
                    })
                );
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // 클린업 시에도 업데이트 (SPA 네비게이션)
            if (pageViewIdRef.current) {
                const duration = Date.now() - startTimeRef.current;
                updatePageViewMetrics(pageViewIdRef.current, duration, maxScrollRef.current);
            }
        };
    }, [pathname]);

    return <>{children}</>;
}
```

### 3.3 레이아웃에 프로바이더 추가

**파일 수정:** `src/app/layout.tsx`

```tsx
import AnalyticsProvider from '@/components/AnalyticsProvider';

// body 내부에 추가
<Providers>
    <AnalyticsProvider>
        {children}
    </AnalyticsProvider>
</Providers>
```

---

## 4. API 엔드포인트

### 4.1 페이지뷰 기록 API

**파일 생성:** `src/app/api/analytics/pageview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // IP 해시 (개인정보 보호)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const ipHash = await hashIP(ip);

        const { data: pageView, error } = await supabaseAdmin
            .from('page_views')
            .insert({
                ...data,
                ip_hash: ipHash,
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, id: pageView.id });
    } catch (error) {
        console.error('Pageview tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

async function hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + process.env.IP_HASH_SALT || 'default-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
```

### 4.2 페이지뷰 업데이트 API

**파일 생성:** `src/app/api/analytics/pageview/update/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const { id, duration_seconds, scroll_depth } = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('page_views')
            .update({
                duration_seconds,
                scroll_depth,
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Pageview update error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
```

### 4.3 이벤트 기록 API

**파일 생성:** `src/app/api/analytics/event/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const { error } = await supabaseAdmin
            .from('user_events')
            .insert(data);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Event tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
```

### 4.4 검색어 기록 API

**파일 생성:** `src/app/api/analytics/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const { error } = await supabaseAdmin
            .from('search_logs')
            .insert(data);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Search tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
```

---

## 5. 관리자 분석 대시보드

### 5.1 분석 데이터 조회 API

**파일 생성:** `src/app/api/admin/analytics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const pageType = searchParams.get('pageType');
    const deviceType = searchParams.get('deviceType');
    const referrerDomain = searchParams.get('referrerDomain');
    const region = searchParams.get('region');
    const articleId = searchParams.get('articleId');
    const groupBy = searchParams.get('groupBy') || 'date'; // date, hour, page, device, referrer, region

    try {
        // 기본 쿼리
        let query = supabaseAdmin
            .from('page_views')
            .select('*', { count: 'exact' })
            .gte('created_date', startDate)
            .lte('created_date', endDate);

        // 필터 적용
        if (pageType) query = query.eq('page_type', pageType);
        if (deviceType) query = query.eq('device_type', deviceType);
        if (referrerDomain) query = query.eq('referrer_domain', referrerDomain);
        if (region) query = query.eq('region', region);
        if (articleId) query = query.eq('article_id', articleId);

        const { data, count, error } = await query.order('created_at', { ascending: false }).limit(1000);

        if (error) throw error;

        // 통계 계산
        const stats = calculateStats(data || []);

        return NextResponse.json({
            success: true,
            data,
            count,
            stats,
        });
    } catch (error) {
        console.error('Analytics query error:', error);
        return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 });
    }
}

function calculateStats(data: any[]) {
    const totalViews = data.length;
    const uniqueSessions = new Set(data.map(d => d.session_id)).size;
    const uniqueVisitors = new Set(data.map(d => d.visitor_id)).size;

    const avgDuration = data.filter(d => d.duration_seconds > 0)
        .reduce((sum, d) => sum + d.duration_seconds, 0) /
        data.filter(d => d.duration_seconds > 0).length || 0;

    const avgScrollDepth = data.filter(d => d.scroll_depth > 0)
        .reduce((sum, d) => sum + d.scroll_depth, 0) /
        data.filter(d => d.scroll_depth > 0).length || 0;

    // 디바이스별 분포
    const deviceStats = {
        mobile: data.filter(d => d.device_type === 'mobile').length,
        desktop: data.filter(d => d.device_type === 'desktop').length,
        tablet: data.filter(d => d.device_type === 'tablet').length,
    };

    // 유입처별 분포
    const referrerStats: Record<string, number> = {};
    data.forEach(d => {
        const domain = d.referrer_domain || 'unknown';
        referrerStats[domain] = (referrerStats[domain] || 0) + 1;
    });

    // 페이지타입별 분포
    const pageTypeStats: Record<string, number> = {};
    data.forEach(d => {
        const type = d.page_type || 'unknown';
        pageTypeStats[type] = (pageTypeStats[type] || 0) + 1;
    });

    // 일별 추이
    const dailyStats: Record<string, number> = {};
    data.forEach(d => {
        const date = d.created_date;
        dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // 시간대별 분포
    const hourlyStats: Record<number, number> = {};
    data.forEach(d => {
        const hour = new Date(d.created_at).getHours();
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    return {
        totalViews,
        uniqueSessions,
        uniqueVisitors,
        avgDuration: Math.round(avgDuration),
        avgScrollDepth: Math.round(avgScrollDepth),
        deviceStats,
        referrerStats,
        pageTypeStats,
        dailyStats,
        hourlyStats,
    };
}
```

### 5.2 인기 검색어 API

**파일 생성:** `src/app/api/admin/analytics/searches/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // 검색어 빈도 집계 (RPC 함수 또는 직접 쿼리)
        const { data, error } = await supabaseAdmin
            .from('search_logs')
            .select('query_normalized, query')
            .gte('created_at', startDate);

        if (error) throw error;

        // 빈도 계산
        const freq: Record<string, { count: number; original: string }> = {};
        (data || []).forEach(d => {
            const key = d.query_normalized;
            if (!freq[key]) {
                freq[key] = { count: 0, original: d.query };
            }
            freq[key].count++;
        });

        // 정렬
        const sorted = Object.entries(freq)
            .map(([normalized, { count, original }]) => ({ query: original, normalized, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return NextResponse.json({ success: true, data: sorted });
    } catch (error) {
        console.error('Search analytics error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
```

### 5.3 인기 기사 API

**파일 생성:** `src/app/api/admin/analytics/popular/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 기사별 조회수 집계
        const { data, error } = await supabaseAdmin
            .from('page_views')
            .select('article_id')
            .not('article_id', 'is', null)
            .gte('created_date', startDate);

        if (error) throw error;

        // 빈도 계산
        const freq: Record<string, number> = {};
        (data || []).forEach(d => {
            freq[d.article_id] = (freq[d.article_id] || 0) + 1;
        });

        // 상위 기사 ID 추출
        const topArticleIds = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id, count]) => ({ id, count }));

        // 기사 정보 조회
        const { data: articles } = await supabaseAdmin
            .from('posts')
            .select('id, title, category, published_at, thumbnail_url')
            .in('id', topArticleIds.map(a => a.id));

        // 결과 조합
        const result = topArticleIds.map(({ id, count }) => {
            const article = articles?.find(a => a.id === id);
            return { ...article, views: count };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Popular articles error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
```

---

## 6. 관리자 대시보드 페이지

### 6.1 분석 대시보드 메인

**파일 생성:** `src/app/admin/analytics/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3, Users, Eye, Clock, MousePointer,
    Search, TrendingUp, Monitor, Smartphone, Tablet,
    Globe, ArrowUpRight, Calendar, Filter
} from 'lucide-react';

export default function AnalyticsDashboard() {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filters, setFilters] = useState({
        pageType: '',
        deviceType: '',
        referrerDomain: '',
    });
    const [stats, setStats] = useState<any>(null);
    const [popularArticles, setPopularArticles] = useState<any[]>([]);
    const [topSearches, setTopSearches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 초기 날짜 설정 (최근 7일)
    useEffect(() => {
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setDateRange({ start, end });
    }, []);

    // 데이터 로드
    useEffect(() => {
        if (!dateRange.start || !dateRange.end) return;
        loadData();
    }, [dateRange, filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 메인 통계
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end,
                ...filters,
            });

            const [statsRes, popularRes, searchesRes] = await Promise.all([
                fetch(`/api/admin/analytics?${params}`),
                fetch(`/api/admin/analytics/popular?days=7`),
                fetch(`/api/admin/analytics/searches?days=7`),
            ]);

            const statsData = await statsRes.json();
            const popularData = await popularRes.json();
            const searchesData = await searchesRes.json();

            setStats(statsData.stats);
            setPopularArticles(popularData.data || []);
            setTopSearches(searchesData.data || []);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">로딩 중...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    사용자 분석
                </h1>

                {/* 날짜 필터 */}
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="border rounded px-3 py-2 text-sm"
                        />
                        <span>~</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="border rounded px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* 필터 */}
            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={filters.pageType}
                    onChange={(e) => setFilters(prev => ({ ...prev, pageType: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm"
                >
                    <option value="">모든 페이지</option>
                    <option value="home">홈</option>
                    <option value="article">기사</option>
                    <option value="category">카테고리</option>
                    <option value="author">기자</option>
                    <option value="search">검색</option>
                </select>
                <select
                    value={filters.deviceType}
                    onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm"
                >
                    <option value="">모든 디바이스</option>
                    <option value="mobile">모바일</option>
                    <option value="desktop">데스크톱</option>
                    <option value="tablet">태블릿</option>
                </select>
                <select
                    value={filters.referrerDomain}
                    onChange={(e) => setFilters(prev => ({ ...prev, referrerDomain: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm"
                >
                    <option value="">모든 유입처</option>
                    <option value="direct">직접 방문</option>
                    <option value="naver">네이버</option>
                    <option value="google">구글</option>
                    <option value="daum">다음</option>
                    <option value="kakao">카카오</option>
                    <option value="facebook">페이스북</option>
                </select>
            </div>

            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Eye className="w-5 h-5" />}
                    label="총 페이지뷰"
                    value={stats?.totalViews?.toLocaleString() || '0'}
                    color="blue"
                />
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="순 방문자"
                    value={stats?.uniqueVisitors?.toLocaleString() || '0'}
                    color="green"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="평균 체류시간"
                    value={`${Math.floor((stats?.avgDuration || 0) / 60)}분 ${(stats?.avgDuration || 0) % 60}초`}
                    color="purple"
                />
                <StatCard
                    icon={<MousePointer className="w-5 h-5" />}
                    label="평균 스크롤"
                    value={`${stats?.avgScrollDepth || 0}%`}
                    color="orange"
                />
            </div>

            {/* 상세 분석 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 디바이스 분포 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        디바이스별 분포
                    </h3>
                    <div className="space-y-3">
                        <DeviceBar
                            icon={<Smartphone className="w-4 h-4" />}
                            label="모바일"
                            count={stats?.deviceStats?.mobile || 0}
                            total={stats?.totalViews || 1}
                        />
                        <DeviceBar
                            icon={<Monitor className="w-4 h-4" />}
                            label="데스크톱"
                            count={stats?.deviceStats?.desktop || 0}
                            total={stats?.totalViews || 1}
                        />
                        <DeviceBar
                            icon={<Tablet className="w-4 h-4" />}
                            label="태블릿"
                            count={stats?.deviceStats?.tablet || 0}
                            total={stats?.totalViews || 1}
                        />
                    </div>
                </div>

                {/* 유입처 분포 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        유입처별 분포
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(stats?.referrerStats || {})
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 8)
                            .map(([domain, count]) => (
                                <div key={domain} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">{domain}</span>
                                    <span className="font-medium">{(count as number).toLocaleString()}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* 인기 기사 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        인기 기사 TOP 10
                    </h3>
                    <div className="space-y-3">
                        {popularArticles.slice(0, 10).map((article, idx) => (
                            <div key={article.id} className="flex items-start gap-3">
                                <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{article.title}</p>
                                    <p className="text-xs text-gray-500">{article.category} · {article.views}회</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 인기 검색어 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        인기 검색어 TOP 10
                    </h3>
                    <div className="space-y-2">
                        {topSearches.slice(0, 10).map((search, idx) => (
                            <div key={search.normalized} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-400 w-6">{idx + 1}</span>
                                    <span className="text-sm">{search.query}</span>
                                </div>
                                <span className="text-sm text-gray-500">{search.count}회</span>
                            </div>
                        ))}
                        {topSearches.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">검색 데이터가 없습니다</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 일별 추이 차트 (간단한 바 차트) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-bold mb-4">일별 페이지뷰 추이</h3>
                <div className="flex items-end gap-1 h-40">
                    {Object.entries(stats?.dailyStats || {})
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([date, count]) => {
                            const maxCount = Math.max(...Object.values(stats?.dailyStats || { '': 1 }));
                            const height = ((count as number) / maxCount) * 100;
                            return (
                                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-blue-500 rounded-t"
                                        style={{ height: `${height}%` }}
                                        title={`${date}: ${count}회`}
                                    />
                                    <span className="text-xs text-gray-500 rotate-45 origin-left">
                                        {date.slice(5)}
                                    </span>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
}

// 통계 카드 컴포넌트
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}

// 디바이스 바 컴포넌트
function DeviceBar({ icon, label, count, total }: { icon: React.ReactNode; label: string; count: number; total: number }) {
    const percent = Math.round((count / total) * 100);

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                    {icon}
                    {label}
                </span>
                <span className="font-medium">{count.toLocaleString()} ({percent}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
```

---

## 7. 관리자 메뉴 추가

**파일 수정:** 관리자 사이드바에 메뉴 추가

```tsx
// 관리자 메뉴에 추가
{
    label: '사용자 분석',
    href: '/admin/analytics',
    icon: <BarChart3 className="w-4 h-4" />
}
```

---

## 8. 체크리스트

### 데이터베이스
- [ ] page_views 테이블 생성
- [ ] user_events 테이블 생성
- [ ] search_logs 테이블 생성
- [ ] article_daily_stats 테이블 생성
- [ ] 인덱스 생성
- [ ] 뷰 생성

### 프론트엔드 수집
- [ ] analytics.ts 유틸리티 생성
- [ ] AnalyticsProvider 컴포넌트 생성
- [ ] layout.tsx에 프로바이더 추가

### API
- [ ] /api/analytics/pageview 생성
- [ ] /api/analytics/pageview/update 생성
- [ ] /api/analytics/event 생성
- [ ] /api/analytics/search 생성
- [ ] /api/admin/analytics 생성
- [ ] /api/admin/analytics/searches 생성
- [ ] /api/admin/analytics/popular 생성

### 관리자 페이지
- [ ] /admin/analytics 대시보드 페이지 생성
- [ ] 사이드바 메뉴 추가

### 테스트
- [ ] 페이지뷰 수집 테스트
- [ ] 이벤트 수집 테스트
- [ ] 검색어 수집 테스트
- [ ] 대시보드 필터링 테스트

---

## 9. 참고 파일

| 파일 | 용도 |
|------|------|
| `src/lib/analytics.ts` | 분석 유틸리티 (신규) |
| `src/components/AnalyticsProvider.tsx` | 수집 프로바이더 (신규) |
| `src/app/api/analytics/*` | 수집 API (신규) |
| `src/app/api/admin/analytics/*` | 분석 API (신규) |
| `src/app/admin/analytics/page.tsx` | 대시보드 (신규) |
| `src/app/layout.tsx` | 프로바이더 추가 |

---

## 10. 주의사항

1. **개인정보 보호**: IP는 해시 처리, 개인 식별 정보 수집 금지
2. **성능**: 수집 API는 비동기로 처리, 사용자 경험에 영향 없도록
3. **데이터 보존**: 오래된 로그는 주기적으로 정리 (예: 90일 이상)
4. **시스템 모달 금지**: useToast 사용

---

*작성자: Claude Code*
*검토 요청: 주인님*

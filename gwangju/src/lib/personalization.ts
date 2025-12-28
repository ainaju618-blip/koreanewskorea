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

interface PersonalizationResult {
    posts: ArticleWithScore[];
    meta: {
        isLoggedIn: boolean;
        userRegion: string | null;
        preferredRegion: string | null;
        activeBoosts: string[];
        appliedMethods: string[];
    };
}

/**
 * 개인화된 기사 목록 조회
 */
export async function getPersonalizedPosts(
    context: PersonalizationContext,
    limit: number = 20
): Promise<PersonalizationResult> {
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
        acc[w.region_code] = parseFloat(w.weight);
        return acc;
    }, {} as Record<string, number>) || {};

    // 4. 기사 조회
    const { data: posts } = await supabaseAdmin
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit * 2); // 정렬 후 자를 것이므로 넉넉히

    if (!posts) return { posts: [], meta: getEmptyMeta(context) };

    // 5. 점수 계산
    const scoredPosts = posts.map(post => {
        let score = getBaseTimeScore(post.published_at);

        // 부스트 적용 (최고 우선순위)
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
            if (targetRegion && targetRegion === post.source) {
                score *= settings.geolocation.weight || 1.5;
            }
        }

        // 행동 기반 적용
        if (settings.behavior?.enabled && context.userBehavior) {
            const regionViews = context.userBehavior.regionViews[post.source] || 0;
            const categoryViews = context.userBehavior.categoryViews[post.category] || 0;
            // 최대 30점 추가 (지역), 20점 추가 (카테고리)
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

/**
 * 시간 기반 기본 점수 (최신순)
 * - 1시간 전: 98점
 * - 24시간 전: 52점
 * - 최소: 10점
 */
function getBaseTimeScore(publishedAt: string): number {
    const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
    return Math.max(100 - (hoursAgo * 2), 10);
}

/**
 * 빈 메타 정보 생성
 */
function getEmptyMeta(context: PersonalizationContext) {
    return {
        isLoggedIn: context.isLoggedIn,
        userRegion: context.userRegion,
        preferredRegion: context.preferredRegion,
        activeBoosts: [],
        appliedMethods: []
    };
}

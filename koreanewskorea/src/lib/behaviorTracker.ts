const STORAGE_KEY = 'kn_behavior';
const MAX_RECENT_ARTICLES = 100;

export interface UserBehavior {
    regionViews: Record<string, number>;
    categoryViews: Record<string, number>;
    recentArticles: string[];
    lastVisit: string;
    visitCount: number;
}

/**
 * LocalStorage에서 행동 데이터 가져오기
 */
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

/**
 * 기사 조회 추적
 */
export function trackArticleView(articleId: string, regionCode: string, category: string) {
    if (typeof window === 'undefined') return;

    const behavior = getBehavior();

    // 지역 조회수 증가
    if (regionCode) {
        behavior.regionViews[regionCode] = (behavior.regionViews[regionCode] || 0) + 1;
    }

    // 카테고리 조회수 증가
    if (category) {
        behavior.categoryViews[category] = (behavior.categoryViews[category] || 0) + 1;
    }

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

/**
 * 상위 N개 지역 가져오기 (조회수 기준)
 */
export function getTopRegions(limit: number = 5): string[] {
    const behavior = getBehavior();
    return Object.entries(behavior.regionViews)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([code]) => code);
}

/**
 * 상위 N개 카테고리 가져오기
 */
export function getTopCategories(limit: number = 5): string[] {
    const behavior = getBehavior();
    return Object.entries(behavior.categoryViews)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([category]) => category);
}

/**
 * 행동 데이터 초기화
 */
export function clearBehavior() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * 빈 행동 데이터 생성
 */
function getEmptyBehavior(): UserBehavior {
    return {
        regionViews: {},
        categoryViews: {},
        recentArticles: [],
        lastVisit: new Date().toISOString(),
        visitCount: 0
    };
}

/**
 * 행동 데이터 저장
 */
function saveBehavior(behavior: UserBehavior) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(behavior));
}

'use client';

import { useEffect, useCallback } from 'react';
import { trackArticleView, getBehavior, UserBehavior } from '@/lib/behaviorTracker';

/**
 * 행동 추적 훅
 */
export function useBehaviorTracker() {
    const track = useCallback((articleId: string, regionCode: string, category: string) => {
        trackArticleView(articleId, regionCode, category);
    }, []);

    const behavior = getBehavior();

    return { track, behavior };
}

/**
 * 기사 상세 페이지에서 자동 추적하는 훅
 */
export function useArticleViewTracker(
    articleId: string | undefined,
    regionCode: string | undefined,
    category: string | undefined
) {
    useEffect(() => {
        if (articleId && regionCode && category) {
            trackArticleView(articleId, regionCode, category);
        }
    }, [articleId, regionCode, category]);
}

/**
 * 개인화 데이터를 서버에 동기화하는 훅
 */
export function useBehaviorSync(isLoggedIn: boolean) {
    useEffect(() => {
        if (!isLoggedIn) return;

        const behavior = getBehavior();

        // 조회 데이터가 있으면 서버에 동기화
        if (Object.keys(behavior.regionViews).length > 0 || Object.keys(behavior.categoryViews).length > 0) {
            fetch('/api/personalization/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    regionViews: behavior.regionViews,
                    categoryViews: behavior.categoryViews
                })
            }).catch(console.error);
        }
    }, [isLoggedIn]);
}

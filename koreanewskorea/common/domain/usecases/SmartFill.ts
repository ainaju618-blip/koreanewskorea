/**
 * SmartFill Use Case
 * Pure business logic - no external dependencies (DB, API)
 * 
 * This file contains the core algorithm for:
 * - Calculating content limits based on tier
 * - Merging articles from different sources with deduplication
 */

import { Article, TIER_RATIOS } from '../entities';

/**
 * Calculate article limits for each content type based on tier
 */
export function calculateLimits(totalLimit: number, tier: 1 | 2 | 3) {
    const ratio = TIER_RATIOS[tier];
    return {
        localLimit: Math.ceil(totalLimit * ratio.local),
        nearbyLimit: Math.ceil(totalLimit * ratio.nearby),
        nationalLimit: Math.ceil(totalLimit * ratio.national),
    };
}

/**
 * Merge articles from local, nearby, and national sources
 * with deduplication by article ID
 * 
 * @param local - Articles from the target region
 * @param nearby - Articles from nearby regions
 * @param national - Articles from national/provincial level
 * @param totalLimit - Maximum number of articles to return
 * @returns Merged and deduplicated articles
 */
export function mergeArticles(
    local: Article[],
    nearby: Article[],
    national: Article[],
    totalLimit: number
): Article[] {
    const combined: Article[] = [...local];
    const seenIds = new Set(local.map((a) => a.id));

    // Add nearby articles (exclude duplicates)
    for (const article of nearby) {
        if (!seenIds.has(article.id)) {
            combined.push(article);
            seenIds.add(article.id);
        }
    }

    // Add national articles (exclude duplicates)
    for (const article of national) {
        if (!seenIds.has(article.id)) {
            combined.push(article);
            seenIds.add(article.id);
        }
    }

    return combined.slice(0, totalLimit);
}

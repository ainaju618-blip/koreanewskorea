/**
 * Content Fetching with Smart Fill Algorithm
 * 
 * This file now acts as a FACADE/WRAPPER for the clean architecture layers.
 * Maintains backward compatibility with existing code.
 * 
 * Internal structure:
 * - Domain: entities, usecases (pure logic)
 * - Infrastructure: repositories (data access)
 */

// Re-export Article type for backward compatibility
export type { Article } from '../domain/entities';

// Import from clean architecture layers
import { ArticleRepository, RegionRepository } from '../infrastructure/repositories';
import { calculateLimits, mergeArticles } from '../domain/usecases';

/**
 * Fetch local news for a specific region
 */
export async function getLocalNews(
    regionCode: string,
    limit: number = 10
) {
    return ArticleRepository.findByRegion(regionCode, limit);
}

/**
 * Fetch news from nearby regions
 */
export async function getNearbyNews(
    regionCode: string,
    limit: number = 5
) {
    const nearbyRegions = RegionRepository.getNearby(regionCode);
    if (nearbyRegions.length === 0) {
        return [];
    }
    return ArticleRepository.findByRegions(nearbyRegions, limit);
}

/**
 * Fetch national/provincial news (gwangju + jeonnam)
 */
export async function getNationalNews(limit: number = 3) {
    return ArticleRepository.findByRegions(['gwangju', 'jeonnam'], limit);
}

/**
 * Smart Fill Algorithm
 * Content ratios vary by tier:
 * - Tier 1: 70% local / 20% nearby / 10% national (content sufficient)
 * - Tier 2: 50% local / 30% nearby / 20% national (medium)
 * - Tier 3: 30% local / 40% nearby / 30% national (smart fill heavy)
 */
export async function getSmartFilledNews(
    regionCode: string,
    totalLimit: number = 20,
    tier: 1 | 2 | 3 = 1
) {
    // Use domain layer for pure logic
    const limits = calculateLimits(totalLimit, tier);

    // Use infrastructure layer for data access
    const [localNews, nearbyNews, nationalNews] = await Promise.all([
        getLocalNews(regionCode, limits.localLimit),
        getNearbyNews(regionCode, limits.nearbyLimit),
        getNationalNews(limits.nationalLimit),
    ]);

    // Use domain layer for merging logic
    return mergeArticles(localNews, nearbyNews, nationalNews, totalLimit);
}

/**
 * Fetch single article by ID
 */
export async function getArticleById(id: string) {
    return ArticleRepository.findById(id);
}

/**
 * Get related articles from same region
 */
export async function getRelatedArticles(
    articleId: string,
    regionCode: string,
    limit: number = 5
) {
    return ArticleRepository.findRelated(articleId, regionCode, limit);
}

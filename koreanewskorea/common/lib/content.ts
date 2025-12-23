/**
 * Content Fetching with Smart Fill Algorithm
 * 70% local / 20% nearby / 10% national
 */

import { supabase } from './supabase';
import { getNearbyRegions } from './regions';

export interface Article {
    id: string;
    title: string;
    content?: string;
    ai_summary?: string;
    thumbnail_url?: string;
    region: string;
    category?: string;
    source?: string;
    published_at: string;
    created_at?: string;
    author_name?: string;
}

// Common select fields matching actual DB schema
const POST_FIELDS = 'id, title, content, ai_summary, thumbnail_url, region, category, source, published_at, created_at, author_name';

/**
 * Fetch local news for a specific region
 */
export async function getLocalNews(
    regionCode: string,
    limit: number = 10
): Promise<Article[]> {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .eq('region', regionCode)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[getLocalNews] Error:', error);
        return [];
    }

    return data ?? [];
}

/**
 * Fetch news from nearby regions
 */
export async function getNearbyNews(
    regionCode: string,
    limit: number = 5
): Promise<Article[]> {
    const nearbyRegions = getNearbyRegions(regionCode);

    if (nearbyRegions.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .in('region', nearbyRegions)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[getNearbyNews] Error:', error);
        return [];
    }

    return data ?? [];
}

/**
 * Fetch national/provincial news (gwangju + jeonnam)
 */
export async function getNationalNews(limit: number = 3): Promise<Article[]> {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .in('region', ['gwangju', 'jeonnam'])
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[getNationalNews] Error:', error);
        return [];
    }

    return data ?? [];
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
): Promise<Article[]> {
    // Tier-based ratios
    const ratios = {
        1: { local: 0.7, nearby: 0.2, national: 0.1 },
        2: { local: 0.5, nearby: 0.3, national: 0.2 },
        3: { local: 0.3, nearby: 0.4, national: 0.3 },
    };

    const ratio = ratios[tier];
    const localLimit = Math.ceil(totalLimit * ratio.local);
    const nearbyLimit = Math.ceil(totalLimit * ratio.nearby);
    const nationalLimit = Math.ceil(totalLimit * ratio.national);

    const [localNews, nearbyNews, nationalNews] = await Promise.all([
        getLocalNews(regionCode, localLimit),
        getNearbyNews(regionCode, nearbyLimit),
        getNationalNews(nationalLimit),
    ]);

    // If local news is insufficient, fill from nearby/national
    const combined: Article[] = [...localNews];

    // Add nearby news (exclude duplicates)
    const localIds = new Set(localNews.map((a) => a.id));
    for (const article of nearbyNews) {
        if (!localIds.has(article.id)) {
            combined.push(article);
        }
    }

    // Add national news (exclude duplicates)
    const combinedIds = new Set(combined.map((a) => a.id));
    for (const article of nationalNews) {
        if (!combinedIds.has(article.id)) {
            combined.push(article);
        }
    }

    return combined.slice(0, totalLimit);
}

/**
 * Fetch single article by ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .eq('id', id)
        .single();

    if (error) {
        console.error('[getArticleById] Error:', error);
        return null;
    }

    return data;
}

/**
 * Get related articles from same region
 */
export async function getRelatedArticles(
    articleId: string,
    regionCode: string,
    limit: number = 5
): Promise<Article[]> {
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, thumbnail_url, region, published_at')
        .eq('region', regionCode)
        .eq('status', 'published')
        .neq('id', articleId)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[getRelatedArticles] Error:', error);
        return [];
    }

    return data ?? [];
}

// src/lib/weighted-articles.ts
// Weighted Article System for Regional News Sites
// Implements scoring: score = regionWeight × timeWeight

import { createClient } from '@/lib/supabase-server';
import { CURRENT_SITE, getRegionType, type RegionType, type SiteConfig } from '@/config/site-regions';

export interface Article {
    id: string;
    title: string;
    ai_summary?: string;
    content?: string;
    thumbnail_url?: string;
    category?: string;
    region?: string;
    published_at?: string;
    created_at: string;
    view_count?: number;
    author?: string;
    source_url?: string;
}

export interface WeightedArticle extends Article {
    regionType: RegionType;
    regionWeight: number;
    timeWeight: number;
    score: number;
}

/**
 * Calculate time weight based on article age
 * - Within 6 hours: 1.0
 * - Within 24 hours: 0.9
 * - Within 3 days: 0.7
 * - Within 7 days: 0.5
 * - Older: 0.3
 */
function calculateTimeWeight(publishedAt: string | undefined, createdAt: string): number {
    const articleDate = new Date(publishedAt || createdAt);
    const now = new Date();
    const hoursAgo = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);

    if (hoursAgo <= 6) return 1.0;
    if (hoursAgo <= 24) return 0.9;
    if (hoursAgo <= 72) return 0.7;  // 3 days
    if (hoursAgo <= 168) return 0.5; // 7 days
    return 0.3;
}

/**
 * Apply weights to an article based on region and time
 */
function applyWeights(article: Article, config: SiteConfig = CURRENT_SITE): WeightedArticle {
    const regionType = getRegionType(article.category || null, article.region || null, config);
    const regionWeight = config.weights[regionType];
    const timeWeight = calculateTimeWeight(article.published_at, article.created_at);
    const score = regionWeight * timeWeight;

    return {
        ...article,
        regionType,
        regionWeight,
        timeWeight,
        score,
    };
}

/**
 * Build region filter for Supabase query
 * Returns OR filter string matching all regions in the site config
 */
function buildRegionFilter(config: SiteConfig = CURRENT_SITE): string {
    const allRegions = [
        ...config.regions.primary.names,
        ...config.regions.adjacent1.names,
        ...config.regions.adjacent2.names,
        ...config.regions.province.names,
    ];

    // Build OR conditions for category.ilike and region.eq
    const conditions = allRegions.flatMap(name => [
        `category.ilike.%${name}%`,
        `region.eq.${name.toLowerCase()}`,
    ]);

    return conditions.join(',');
}

export interface FetchOptions {
    limit?: number;
    offset?: number;
    includeContent?: boolean;
    config?: SiteConfig;
}

/**
 * Fetch weighted articles for the current site
 * Articles are scored based on region relevance and freshness
 */
export async function getWeightedArticles(options: FetchOptions = {}): Promise<WeightedArticle[]> {
    const {
        limit = 50,
        offset = 0,
        includeContent = false,
        config = CURRENT_SITE,
    } = options;

    const supabase = await createClient();

    // Fetch articles matching any of our regions
    let articles: Article[] = [];

    if (includeContent) {
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, ai_summary, content, thumbnail_url, category, region, published_at, created_at, view_count, author, source_url')
            .eq('status', 'published')
            .or(buildRegionFilter(config))
            .order('published_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching weighted articles:', error);
            return [];
        }
        articles = (data || []) as Article[];
    } else {
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
            .eq('status', 'published')
            .or(buildRegionFilter(config))
            .order('published_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching weighted articles:', error);
            return [];
        }
        articles = (data || []) as Article[];
    }

    if (articles.length === 0) {
        return [];
    }

    // Apply weights and sort by score
    const weightedArticles = articles
        .map(article => applyWeights(article, config))
        .sort((a, b) => b.score - a.score);

    return weightedArticles;
}

/**
 * Fetch articles for hero carousel
 * Ensures minimum primary region articles while mixing in adjacent regions
 */
export async function getHeroArticles(options: FetchOptions = {}): Promise<WeightedArticle[]> {
    const {
        config = CURRENT_SITE,
    } = options;

    const articleCount = config.hero.articleCount;
    const primaryMinCount = config.hero.primaryMinCount;

    const supabase = await createClient();

    // First, get primary region articles
    const primaryFilter = config.regions.primary.names
        .flatMap(name => [`category.ilike.%${name}%`, `region.eq.${name.toLowerCase()}`])
        .join(',');

    const { data: primaryArticles } = await supabase
        .from('posts')
        .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
        .eq('status', 'published')
        .or(primaryFilter)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(primaryMinCount + 5); // Extra buffer for variety

    // Get adjacent region articles
    const adjacentFilter = [
        ...config.regions.adjacent1.names,
        ...config.regions.adjacent2.names,
    ].flatMap(name => [`category.ilike.%${name}%`, `region.eq.${name.toLowerCase()}`])
        .join(',');

    const { data: adjacentArticles } = await supabase
        .from('posts')
        .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
        .eq('status', 'published')
        .or(adjacentFilter)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(articleCount);

    // Apply weights
    const weightedPrimary = (primaryArticles || [])
        .map(a => applyWeights(a as Article, config));
    const weightedAdjacent = (adjacentArticles || [])
        .map(a => applyWeights(a as Article, config));

    // Ensure minimum primary articles, fill rest with best adjacent
    const selectedPrimary = weightedPrimary.slice(0, primaryMinCount);
    const remainingSlots = articleCount - selectedPrimary.length;

    // Combine remaining primary and adjacent, sort by score, take top N
    const otherArticles = [
        ...weightedPrimary.slice(primaryMinCount),
        ...weightedAdjacent,
    ].filter(a => !selectedPrimary.some(p => p.id === a.id))
        .sort((a, b) => b.score - a.score)
        .slice(0, remainingSlots);

    // Final hero articles sorted by score
    return [...selectedPrimary, ...otherArticles].sort((a, b) => b.score - a.score);
}

/**
 * Fetch articles for a specific region type
 */
export async function getArticlesByRegionType(
    regionType: RegionType,
    options: FetchOptions = {}
): Promise<WeightedArticle[]> {
    const {
        limit = 10,
        config = CURRENT_SITE,
    } = options;

    const regions = config.regions[regionType];
    const supabase = await createClient();

    const filter = regions.names
        .flatMap(name => [`category.ilike.%${name}%`, `region.eq.${name.toLowerCase()}`])
        .join(',');

    const { data: articles, error } = await supabase
        .from('posts')
        .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
        .eq('status', 'published')
        .or(filter)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error || !articles) {
        return [];
    }

    return articles.map(a => applyWeights(a as Article, config));
}

/**
 * Fetch most viewed articles with region weighting
 */
export async function getMostViewedArticles(options: FetchOptions = {}): Promise<WeightedArticle[]> {
    const {
        limit = 10,
        config = CURRENT_SITE,
    } = options;

    const supabase = await createClient();

    const { data: articles, error } = await supabase
        .from('posts')
        .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
        .eq('status', 'published')
        .or(buildRegionFilter(config))
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(limit * 2); // Fetch more to allow weighting influence

    if (error || !articles) {
        return [];
    }

    // Apply weights but keep view_count as primary factor
    const weighted = articles.map(a => {
        const wa = applyWeights(a as Article, config);
        // Boost score by view count (normalized)
        const maxViews = Math.max(...articles.map(x => x.view_count || 0), 1);
        const viewBoost = ((a.view_count || 0) / maxViews) * 0.5;
        return {
            ...wa,
            score: wa.score + viewBoost,
        };
    });

    return weighted.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Fetch latest articles with region weighting
 */
export async function getLatestArticles(options: FetchOptions = {}): Promise<WeightedArticle[]> {
    const {
        limit = 10,
        config = CURRENT_SITE,
    } = options;

    const supabase = await createClient();

    const { data: articles, error } = await supabase
        .from('posts')
        .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
        .eq('status', 'published')
        .or(buildRegionFilter(config))
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error || !articles) {
        return [];
    }

    return articles.map(a => applyWeights(a as Article, config));
}

/**
 * Get articles grouped by region for region grid display
 */
export async function getArticlesByRegions(
    regionNames: string[],
    articlesPerRegion: number = 3,
    config: SiteConfig = CURRENT_SITE
): Promise<Record<string, WeightedArticle[]>> {
    const supabase = await createClient();
    const result: Record<string, WeightedArticle[]> = {};

    // Fetch for each region
    for (const regionName of regionNames) {
        const filter = [
            `category.ilike.%${regionName}%`,
            `region.eq.${regionName.toLowerCase()}`,
        ].join(',');

        const { data: articles } = await supabase
            .from('posts')
            .select('id, title, ai_summary, thumbnail_url, category, region, published_at, created_at, view_count')
            .eq('status', 'published')
            .or(filter)
            .order('published_at', { ascending: false, nullsFirst: false })
            .limit(articlesPerRegion);

        result[regionName] = (articles || []).map(a => applyWeights(a as Article, config));
    }

    return result;
}

/**
 * Get interval duration for hero carousel based on region type
 */
export function getCarouselInterval(regionType: RegionType, config: SiteConfig = CURRENT_SITE): number {
    return config.hero.intervals[regionType];
}

/**
 * Get region display name for UI
 */
export function getRegionDisplayName(
    category: string | null,
    region: string | null,
    config: SiteConfig = CURRENT_SITE
): string {
    const cat = category?.toLowerCase() || '';
    const reg = region?.toLowerCase() || '';

    // Check all region groups
    const allGroups = [
        config.regions.primary,
        config.regions.adjacent1,
        config.regions.adjacent2,
        config.regions.province,
    ];

    for (const group of allGroups) {
        for (const name of group.names) {
            if (cat.includes(name.toLowerCase()) || reg.includes(name.toLowerCase())) {
                return name;
            }
        }
    }

    return '전남';
}

/**
 * Keyword Service
 * ===============
 * Combines static keyword mapping with dynamic database aggregation
 * for generating region-specific sub-menus.
 *
 * Usage:
 *   // Get sub-menus for a region (auto-selects best method)
 *   const menus = await getRegionSubMenus('mokpo');
 *
 *   // Force static method (fast, offline)
 *   const menus = await getRegionSubMenus('mokpo', { method: 'static' });
 *
 *   // Force dynamic method (accurate, requires DB)
 *   const menus = await getRegionSubMenus('mokpo', { method: 'dynamic' });
 */

import { createClient } from '@/lib/supabase-server';
import {
    REGION_KEYWORDS,
    getRegionKeywords,
    SubMenuItem,
    RegionKeywordConfig
} from '@/config/region-keywords';

// ============================================================
// Types
// ============================================================

export interface SubMenuWithCount extends SubMenuItem {
    articleCount: number;
    isActive: boolean;
}

export interface RegionMenuResult {
    region: string;
    regionName: string;
    method: 'static' | 'dynamic' | 'hybrid';
    subMenus: SubMenuWithCount[];
    totalArticles: number;
    generatedAt: string;
}

export interface KeywordAggregation {
    keyword: string;
    count: number;
    sample_title: string;
}

export interface GetSubMenusOptions {
    method?: 'static' | 'dynamic' | 'auto';
    days?: number;
    minArticles?: number;
}

// ============================================================
// Static Method (Fast - from config)
// ============================================================

/**
 * Get sub-menus using static keyword configuration
 * Fast, no database required
 */
export function getStaticSubMenus(regionCode: string): SubMenuWithCount[] {
    const config = getRegionKeywords(regionCode);
    if (!config) {
        return getDefaultSubMenus();
    }

    return config.subMenus.map(menu => ({
        ...menu,
        articleCount: 0,  // Unknown without DB
        isActive: true,   // Assume active
    }));
}

/**
 * Default sub-menus when region not found
 */
function getDefaultSubMenus(): SubMenuWithCount[] {
    return [
        { name: '정책행정', slug: 'policy', keywords: ['정책', '행정'], articleCount: 0, isActive: true },
        { name: '문화관광', slug: 'culture', keywords: ['문화', '관광'], articleCount: 0, isActive: true },
        { name: '복지교육', slug: 'welfare', keywords: ['복지', '교육'], articleCount: 0, isActive: true },
        { name: '지역소식', slug: 'local', keywords: ['지역', '소식'], articleCount: 0, isActive: true },
    ];
}

// ============================================================
// Dynamic Method (Accurate - from database)
// ============================================================

/**
 * Get top keywords from database using RPC function
 */
export async function getDynamicKeywords(
    regionCode: string,
    days: number = 30
): Promise<KeywordAggregation[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .rpc('get_top_keywords', {
                p_region: regionCode,
                p_days: days
            });

        if (error) {
            console.error('[KeywordService] RPC error:', error.message);
            return [];
        }

        return (data || []) as KeywordAggregation[];
    } catch (err) {
        console.error('[KeywordService] Dynamic fetch failed:', err);
        return [];
    }
}

/**
 * Get sub-menus with article counts from database
 */
export async function getDynamicSubMenus(
    regionCode: string,
    days: number = 30,
    minArticles: number = 3
): Promise<SubMenuWithCount[]> {
    const config = getRegionKeywords(regionCode);
    if (!config) {
        return getDefaultSubMenus();
    }

    try {
        const supabase = await createClient();

        // Get article counts per sub-menu
        const subMenusWithCounts: SubMenuWithCount[] = [];

        for (const menu of config.subMenus) {
            // Build keyword pattern for SQL
            const keywordPatterns = menu.keywords.map(k => `%${k}%`);

            // Count articles matching any keyword
            const { count, error } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('region', regionCode)
                .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
                .or(keywordPatterns.map(p => `title.ilike.${p}`).join(','));

            const articleCount = error ? 0 : (count || 0);

            subMenusWithCounts.push({
                ...menu,
                articleCount,
                isActive: articleCount >= minArticles,
            });
        }

        // Sort by article count (most popular first)
        return subMenusWithCounts.sort((a, b) => b.articleCount - a.articleCount);

    } catch (err) {
        console.error('[KeywordService] Dynamic sub-menu fetch failed:', err);
        // Fallback to static
        return getStaticSubMenus(regionCode);
    }
}

// ============================================================
// Hybrid Method (Best of both)
// ============================================================

/**
 * Get sub-menus using hybrid approach:
 * 1. Start with static configuration
 * 2. Enrich with dynamic counts from database
 * 3. Filter out inactive menus (below threshold)
 */
export async function getHybridSubMenus(
    regionCode: string,
    days: number = 30,
    minArticles: number = 3
): Promise<SubMenuWithCount[]> {
    // Start with static config
    const staticMenus = getStaticSubMenus(regionCode);

    try {
        // Get dynamic keyword data
        const dynamicKeywords = await getDynamicKeywords(regionCode, days);

        if (dynamicKeywords.length === 0) {
            // No dynamic data, return static
            return staticMenus;
        }

        // Create keyword -> count map
        const keywordCounts = new Map<string, number>();
        for (const kw of dynamicKeywords) {
            keywordCounts.set(kw.keyword.toLowerCase(), kw.count);
        }

        // Enrich static menus with counts
        const enrichedMenus = staticMenus.map(menu => {
            let totalCount = 0;
            for (const keyword of menu.keywords) {
                totalCount += keywordCounts.get(keyword.toLowerCase()) || 0;
            }
            return {
                ...menu,
                articleCount: totalCount,
                isActive: totalCount >= minArticles,
            };
        });

        // Sort by count and return
        return enrichedMenus.sort((a, b) => b.articleCount - a.articleCount);

    } catch (err) {
        console.error('[KeywordService] Hybrid fetch failed:', err);
        return staticMenus;
    }
}

// ============================================================
// Main API
// ============================================================

/**
 * Get region sub-menus with auto-selection of best method
 *
 * @param regionCode - Region code (e.g., 'mokpo', 'yeosu')
 * @param options - Configuration options
 * @returns RegionMenuResult with sub-menus and metadata
 */
export async function getRegionSubMenus(
    regionCode: string,
    options: GetSubMenusOptions = {}
): Promise<RegionMenuResult> {
    const {
        method = 'auto',
        days = 30,
        minArticles = 3,
    } = options;

    const config = getRegionKeywords(regionCode);
    const regionName = config?.name || regionCode;

    let subMenus: SubMenuWithCount[];
    let usedMethod: 'static' | 'dynamic' | 'hybrid';

    switch (method) {
        case 'static':
            subMenus = getStaticSubMenus(regionCode);
            usedMethod = 'static';
            break;

        case 'dynamic':
            subMenus = await getDynamicSubMenus(regionCode, days, minArticles);
            usedMethod = 'dynamic';
            break;

        case 'auto':
        default:
            // Use hybrid for best results
            subMenus = await getHybridSubMenus(regionCode, days, minArticles);
            usedMethod = 'hybrid';
            break;
    }

    // Calculate total articles
    const totalArticles = subMenus.reduce((sum, m) => sum + m.articleCount, 0);

    return {
        region: regionCode,
        regionName,
        method: usedMethod,
        subMenus: subMenus.filter(m => m.isActive),  // Only active menus
        totalArticles,
        generatedAt: new Date().toISOString(),
    };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get all regions with their sub-menu counts
 * Useful for admin dashboard
 */
export async function getAllRegionsMenuStats(): Promise<{
    region: string;
    name: string;
    menuCount: number;
    totalKeywords: number;
}[]> {
    return Object.entries(REGION_KEYWORDS).map(([code, config]) => ({
        region: code,
        name: config.name,
        menuCount: config.subMenus.length,
        totalKeywords: config.subMenus.reduce((sum, m) => sum + m.keywords.length, 0),
    }));
}

/**
 * Check if region has keyword configuration
 */
export function hasRegionConfig(regionCode: string): boolean {
    return regionCode in REGION_KEYWORDS;
}

/**
 * Get region display name
 */
export function getRegionName(regionCode: string): string {
    return REGION_KEYWORDS[regionCode]?.name || regionCode;
}

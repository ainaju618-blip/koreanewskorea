// GET /api/news/personalized
// Returns personalized news based on user's region

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidRegionCode, getRegionName, getNearbyRegions, DEFAULT_REGION, RegionCode } from '@/lib/location';

export const dynamic = 'force-dynamic';

interface Article {
    id: string;
    title: string;
    content: string;
    thumbnail_url: string | null;
    source: string;
    region: string;
    category: string;
    published_at: string;
    created_at: string;
    ai_summary?: string;
}

interface PersonalizedNewsResponse {
    myRegion: {
        code: string;
        name: string;
        articles: Article[];
        total: number;
    };
    nearby: {
        regions: string[];
        articles: Article[];
    };
    featured: Article[];
}

// Get articles by region
async function getArticlesByRegion(regionCode: string, limit: number = 5): Promise<Article[]> {
    const { data, error } = await supabaseAdmin
        .from('posts')
        .select('id, title, content, thumbnail_url, source, region, category, published_at, created_at, ai_summary')
        .eq('region', regionCode)
        .in('status', ['published', 'limited'])
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error(`[Personalized API] Error fetching articles for ${regionCode}:`, error);
        return [];
    }

    return data || [];
}

// Get total count for a region
async function getRegionArticleCount(regionCode: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('region', regionCode)
        .in('status', ['published', 'limited']);

    if (error) {
        console.error(`[Personalized API] Error counting articles for ${regionCode}:`, error);
        return 0;
    }

    return count || 0;
}

// Get nearby region articles
async function getNearbyArticles(nearbyRegions: RegionCode[], perRegion: number = 2): Promise<Article[]> {
    const articles: Article[] = [];

    for (const regionCode of nearbyRegions) {
        const regionArticles = await getArticlesByRegion(regionCode, perRegion);
        articles.push(...regionArticles);
    }

    return articles;
}

// Get featured articles (high view count or recent important news)
async function getFeaturedArticles(limit: number = 5): Promise<Article[]> {
    const { data, error } = await supabaseAdmin
        .from('posts')
        .select('id, title, content, thumbnail_url, source, region, category, published_at, created_at, ai_summary')
        .in('status', ['published', 'limited'])
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .order('view_count', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Personalized API] Error fetching featured articles:', error);
        return [];
    }

    return data || [];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const regionParam = searchParams.get('region') || DEFAULT_REGION;

        // Validate region code
        const regionCode = isValidRegionCode(regionParam) ? regionParam : DEFAULT_REGION;
        const regionName = getRegionName(regionCode);

        // Get nearby regions (4 by default)
        const nearbyRegions = getNearbyRegions(regionCode, 4);

        // Fetch data in parallel
        const [myArticles, totalCount, nearbyArticles, featuredArticles] = await Promise.all([
            getArticlesByRegion(regionCode, 5),
            getRegionArticleCount(regionCode),
            getNearbyArticles(nearbyRegions, 2),
            getFeaturedArticles(5),
        ]);

        const response: PersonalizedNewsResponse = {
            myRegion: {
                code: regionCode,
                name: regionName,
                articles: myArticles,
                total: totalCount,
            },
            nearby: {
                regions: nearbyRegions,
                articles: nearbyArticles,
            },
            featured: featuredArticles,
        };

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', // 5 min cache
            },
        });
    } catch (error) {
        console.error('[API] /api/news/personalized error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch personalized news' },
            { status: 500 }
        );
    }
}

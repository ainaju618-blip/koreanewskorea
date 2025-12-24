/**
 * Article Repository
 * Infrastructure layer - handles all database operations for articles
 */

import { supabase } from '../supabase/client';
import { Article } from '../../domain/entities';

// Common select fields matching actual DB schema
const POST_FIELDS = 'id, title, content, ai_summary, thumbnail_url, region, category, source, source_url, published_at, created_at, author_name';

/**
 * Find articles by a single region
 */
export async function findByRegion(
    regionCode: string,
    limit: number
): Promise<Article[]> {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .eq('region', regionCode)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[ArticleRepository.findByRegion] Error:', error);
        return [];
    }

    return data ?? [];
}

/**
 * Find articles by multiple regions
 */
export async function findByRegions(
    regionCodes: string[],
    limit: number
): Promise<Article[]> {
    if (regionCodes.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .in('region', regionCodes)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[ArticleRepository.findByRegions] Error:', error);
        return [];
    }

    return data ?? [];
}

/**
 * Find a single article by ID
 */
export async function findById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .eq('id', id)
        .single();

    if (error) {
        console.error('[ArticleRepository.findById] Error:', error);
        return null;
    }

    return data;
}

/**
 * Find related articles from the same region (excluding current article)
 */
export async function findRelated(
    articleId: string,
    regionCode: string,
    limit: number
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
        console.error('[ArticleRepository.findRelated] Error:', error);
        return [];
    }

    return (data ?? []) as Article[];
}

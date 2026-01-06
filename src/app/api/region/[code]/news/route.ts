/**
 * GET /api/region/[code]/news
 * 특정 지역의 뉴스 목록 조회
 *
 * Query Params:
 * - limit: number (default: 10)
 * - offset: number (default: 0)
 * - category: string (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');

    // Build query
    let query = supabaseAdmin
      .from('posts')
      .select(
        'id, title, content, thumbnail_url, source, region, category, published_at, created_at, ai_summary, view_count',
        { count: 'exact' }
      )
      .in('status', ['published', 'limited'])
      .order('published_at', { ascending: false });

    // 지역 필터: naju인 경우 naju, naju_edu 등 관련 region 모두 포함
    if (code === 'naju') {
      query = query.or('region.eq.naju,region.like.naju_%');
    } else if (code === 'jindo') {
      query = query.or('region.eq.jindo,region.like.jindo_%');
    } else {
      query = query.eq('region', code);
    }

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`[Region API] Error fetching news for ${code}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch news', details: error.message },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const articles = (data || []).map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.ai_summary || article.content?.substring(0, 150) + '...',
      thumbnail: article.thumbnail_url,
      category: article.category,
      source: article.source,
      publishedAt: article.published_at,
      viewCount: article.view_count || 0,
    }));

    return NextResponse.json(
      {
        region: code,
        articles,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[API] /api/region/[code]/news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/region/naju/opinions
 * 나주 인사이트 365 - 오피니언 데이터 조회
 * 에너지 밸리 (60%) + 스마트 농업 (40%)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'energy' | 'agriculture' | null
    const limit = parseInt(searchParams.get('limit') || '20');

    // opinions 테이블에서 조회 (향후 실제 테이블 생성 시)
    // 현재는 샘플 데이터 반환
    let query = supabaseAdmin
      .from('opinions')
      .select('*')
      .eq('region', 'naju')
      .eq('status', 'published');

    // 카테고리 필터링
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      // 테이블이 없을 경우 빈 배열 반환 (샘플 데이터는 프론트에서 처리)
      console.log('Opinions query note:', error.message);
      return NextResponse.json({ articles: [], count: 0 });
    }

    // 데이터 변환
    const articles = (data || []).map((opinion) => ({
      id: opinion.id,
      title: opinion.title,
      summary: opinion.summary,
      content: opinion.content,
      author: {
        name: opinion.author_name,
        position: opinion.author_position,
        organization: opinion.author_organization,
        avatar: opinion.author_avatar,
      },
      category: opinion.category, // 'energy' | 'agriculture'
      publishedAt: opinion.published_at,
      thumbnail: opinion.thumbnail_url,
      viewCount: opinion.view_count || 0,
      shareCount: opinion.share_count || 0,
    }));

    return NextResponse.json({ articles, count: articles.length });
  } catch (error: unknown) {
    // 테이블이 없거나 에러 발생 시 빈 배열 반환
    console.log('Opinions API note:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ articles: [], count: 0 });
  }
}

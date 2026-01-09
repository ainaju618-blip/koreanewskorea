import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/region/naju/opinions/[id]
 * 개별 오피니언 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('opinions')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      return NextResponse.json({ article: null }, { status: 404 });
    }

    // 조회수 증가
    await supabaseAdmin
      .from('opinions')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);

    const article = {
      id: data.id,
      title: data.title,
      summary: data.summary,
      content: data.content,
      author: {
        name: data.author_name,
        position: data.author_position,
        organization: data.author_organization,
        avatar: data.author_avatar,
        bio: data.author_bio,
      },
      category: data.category,
      publishedAt: data.published_at,
      thumbnail: data.thumbnail_url,
      viewCount: data.view_count || 0,
      shareCount: data.share_count || 0,
      tags: data.tags || [],
    };

    return NextResponse.json({ article });
  } catch (error: unknown) {
    console.log('Opinion detail API note:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ article: null }, { status: 404 });
  }
}

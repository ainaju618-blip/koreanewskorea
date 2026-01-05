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
    const upcoming = searchParams.get('upcoming') === 'true';

    // 기본 쿼리
    let query = supabaseAdmin
      .from('events')
      .select(
        'id, title, description, thumbnail_url, location, address, event_date, end_date, event_time, category, tags, is_featured, view_count',
        { count: 'exact' }
      )
      .or(`sigungu_code.eq.${code},region.eq.${code}`)
      .eq('status', 'published');

    // 다가오는 행사만 필터
    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('event_date', today);
    }

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category);
    }

    // 정렬 및 페이지네이션
    query = query
      .order('is_featured', { ascending: false })
      .order('event_date', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // 응답 데이터 변환
    const events = (data || []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      thumbnail: event.thumbnail_url,
      location: event.location,
      address: event.address,
      eventDate: event.event_date,
      endDate: event.end_date,
      eventTime: event.event_time,
      category: event.category,
      tags: event.tags,
      isFeatured: event.is_featured,
      viewCount: event.view_count,
    }));

    return NextResponse.json({
      events,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

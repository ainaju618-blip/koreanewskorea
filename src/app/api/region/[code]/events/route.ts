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

    // 기본 쿼리 - 최소 필수 컬럼만 조회 (start_date 사용)
    let query = supabaseAdmin
      .from('events')
      .select(
        'id, title, description, location, start_date, end_date, category, is_featured, sido_code, sigungu_code, region, status',
        { count: 'exact' }
      )
      .or(`sigungu_code.eq.${code},region.eq.${code}`)
      .eq('status', 'published');

    // 다가오는 행사만 필터
    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('start_date', today);
    }

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category);
    }

    // 정렬 및 페이지네이션
    query = query
      .order('is_featured', { ascending: false })
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // 응답 데이터 변환 (eventDate는 페이지 호환용)
    const events = (data || []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.start_date,
      startDate: event.start_date,
      endDate: event.end_date,
      category: event.category,
      isFeatured: event.is_featured,
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

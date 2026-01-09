import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/region/naju/places
 * 나주 지역 장소 데이터 조회 (맛집, 여행, 문화유적 등)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query = supabaseAdmin
      .from('places')
      .select('*')
      .or('sigungu_code.eq.naju,region.eq.naju')
      .eq('status', 'published');

    // 카테고리 필터링
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Places query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 변환
    const places = (data || []).map((place) => ({
      id: place.id,
      name: place.name,
      description: place.description,
      thumbnail: place.thumbnail_url,
      address: place.address,
      category: place.category,
      phone: place.phone,
      rating: place.rating,
      naverMapUrl: place.naver_map_url,
      kakaoMapUrl: place.kakao_map_url,
      lat: place.lat,
      lng: place.lng,
      tags: place.tags,
      specialties: place.specialties,
    }));

    return NextResponse.json({ places, count: places.length });
  } catch (error: any) {
    console.error('Places API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

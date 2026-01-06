import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
}

// content_type 코드 → 카테고리 매핑
const CONTENT_TYPE_MAP: Record<string, string> = {
  '12': 'attraction',   // 관광지
  '14': 'heritage',     // 문화시설
  '15': 'event',        // 축제/행사
  '28': 'leisure',      // 레포츠
  '32': 'accommodation', // 숙박
  '39': 'restaurant',   // 음식점
};

// 카테고리 → content_type 코드 역매핑
const CATEGORY_TO_TYPE: Record<string, string[]> = {
  'attraction': ['12'],
  'heritage': ['14'],
  'restaurant': ['39'],
  'cafe': ['39'], // 카페도 음식점으로 분류
  'accommodation': ['32'],
  'event': ['15'],
  'leisure': ['28'],
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category'); // restaurant, attraction, heritage, cafe
    const featured = searchParams.get('featured') === 'true';

    // tour_spots 테이블 조회
    let query = supabaseAdmin
      .from('tour_spots')
      .select(
        'id, content_id, title, content_type, content_type_name, region_key, region_name, address, image_url, thumbnail_url, map_x, map_y',
        { count: 'exact' }
      )
      .eq('region_key', code);

    // 카테고리 필터 (content_type으로 변환)
    if (category) {
      const contentTypes = CATEGORY_TO_TYPE[category];
      if (contentTypes && contentTypes.length > 0) {
        query = query.in('content_type', contentTypes);
      }
    }

    // featured 필터는 tour_spots에 없으므로 무시 (추후 추가 가능)
    // 정렬 및 페이지네이션
    query = query
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('tour_spots fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch places' },
        { status: 500 }
      );
    }

    // 응답 데이터 변환 (places 형식에 맞게)
    const places = (data || []).map((spot) => ({
      id: spot.id,
      name: spot.title,
      description: '', // tour_spots에는 설명이 없음
      thumbnail: spot.image_url || spot.thumbnail_url || null,
      address: spot.address,
      lat: spot.map_y ? parseFloat(spot.map_y) : null,
      lng: spot.map_x ? parseFloat(spot.map_x) : null,
      category: CONTENT_TYPE_MAP[spot.content_type] || 'attraction',
      phone: null,
      rating: null,
      isFeatured: false,
      contentId: spot.content_id, // TourAPI content_id (상세 조회용)
    }));

    return NextResponse.json({
      places,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

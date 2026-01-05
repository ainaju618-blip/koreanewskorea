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
    const category = searchParams.get('category'); // restaurant, attraction, heritage, cafe
    const featured = searchParams.get('featured') === 'true';

    // 기본 쿼리
    let query = supabaseAdmin
      .from('places')
      .select(
        'id, name, description, thumbnail_url, address, lat, lng, category, sub_category, tags, phone, rating, review_count, naver_map_url, kakao_map_url, is_featured, is_verified, view_count, specialties, heritage_type',
        { count: 'exact' }
      )
      .or(`sigungu_code.eq.${code},region.eq.${code}`)
      .eq('status', 'published');

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category);
    }

    // 추천 장소만
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // 정렬 및 페이지네이션
    query = query
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Places fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch places' },
        { status: 500 }
      );
    }

    // 응답 데이터 변환
    const places = (data || []).map((place) => ({
      id: place.id,
      name: place.name,
      description: place.description,
      thumbnail: place.thumbnail_url,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      category: place.category,
      subCategory: place.sub_category,
      tags: place.tags,
      phone: place.phone,
      rating: place.rating,
      reviewCount: place.review_count,
      naverMapUrl: place.naver_map_url,
      kakaoMapUrl: place.kakao_map_url,
      isFeatured: place.is_featured,
      isVerified: place.is_verified,
      viewCount: place.view_count,
      specialties: place.specialties,
      heritageType: place.heritage_type,
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

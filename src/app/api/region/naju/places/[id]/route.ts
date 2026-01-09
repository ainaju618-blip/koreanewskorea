import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/region/naju/places/[id]
 * 나주 지역 개별 장소 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Place query error:', error);
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // 데이터 변환
    const place = {
      id: data.id,
      name: data.name,
      description: data.description,
      thumbnail: data.thumbnail_url,
      address: data.address,
      category: data.category,
      phone: data.phone,
      rating: data.rating,
      naverMapUrl: data.naver_map_url,
      kakaoMapUrl: data.kakao_map_url,
      lat: data.lat,
      lng: data.lng,
      tags: data.tags || [],
      specialties: data.specialties || [],
      heritageType: data.heritage_type,
    };

    return NextResponse.json({ place });
  } catch (error: any) {
    console.error('Place API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

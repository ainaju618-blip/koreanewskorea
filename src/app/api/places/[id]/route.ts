import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
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

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // tour_spots 테이블에서 조회
    const { data, error } = await supabaseAdmin
      .from('tour_spots')
      .select('id, content_id, title, content_type, content_type_name, region_key, region_name, address, image_url, thumbnail_url, map_x, map_y')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    // tour_spots 데이터를 place 형식으로 변환
    const place = {
      id: data.id,
      name: data.title,
      description: '', // tour_spots에는 설명 필드 없음
      thumbnail: data.image_url || data.thumbnail_url || null,
      address: data.address,
      lat: data.map_y ? parseFloat(data.map_y) : null,
      lng: data.map_x ? parseFloat(data.map_x) : null,
      category: CONTENT_TYPE_MAP[data.content_type] || 'attraction',
      categoryName: data.content_type_name,
      phone: null,
      rating: null,
      openingHours: null,
      website: null,
      isFeatured: false,
      contentId: data.content_id, // TourAPI content_id (추가 상세정보 조회용)
      regionKey: data.region_key,
      regionName: data.region_name,
    };

    return NextResponse.json({ place });
  } catch (error) {
    console.error('Place detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

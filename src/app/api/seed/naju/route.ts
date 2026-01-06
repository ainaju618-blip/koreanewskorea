/**
 * 나주시 데이터 시드 API
 * GET /api/seed/naju - 나주시 관광지, 맛집, 행사 데이터 시드
 *
 * 주의: 개발용 API입니다.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================
// 나주시 관광지 데이터
// ============================================
const NAJU_PLACES = [
  // 관광지
  {
    name: '국립나주박물관',
    description: '전남 지역 마한·백제 문화유산을 전시하는 국립박물관입니다. 반남 고분군 출토 유물과 영산강 유역 고대 문화를 만나볼 수 있습니다.',
    category: 'attraction',
    address: '전남 나주시 반남면 고분로 747',
    phone: '061-330-7800',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9833,
    lng: 126.7167,
    is_featured: true,
    status: 'published',
  },
  {
    name: '나주목문화관',
    description: '조선시대 나주목의 역사와 문화를 체험할 수 있는 문화관입니다. 나주목 관아 복원과 전통문화 체험 프로그램을 운영합니다.',
    category: 'attraction',
    address: '전남 나주시 금계동 8-5',
    phone: '061-339-8687',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9894,
    lng: 126.7111,
    is_featured: true,
    status: 'published',
  },
  {
    name: '금성관',
    description: '조선시대 나주목 객사로, 현존하는 객사 중 가장 큰 규모를 자랑합니다. 국가 지정 보물 제2037호입니다.',
    category: 'heritage',
    address: '전남 나주시 금계동 8-1',
    phone: '061-339-8687',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9889,
    lng: 126.7108,
    is_featured: true,
    status: 'published',
  },
  {
    name: '나주향교',
    description: '고려시대에 창건된 향교로, 대성전과 명륜당 등 유서 깊은 건물들이 보존되어 있습니다.',
    category: 'heritage',
    address: '전남 나주시 향교길 38',
    phone: '061-332-4692',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9922,
    lng: 126.7183,
    is_featured: false,
    status: 'published',
  },
  {
    name: '영산포 등대',
    description: '1915년 건립된 근대문화유산으로, 영산강 포구의 역사를 보여주는 상징적인 건축물입니다.',
    category: 'attraction',
    address: '전남 나주시 영산동 1-15',
    phone: '061-339-8687',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9556,
    lng: 126.7000,
    is_featured: true,
    status: 'published',
  },
  {
    name: '황포돛배',
    description: '영산강에서 운항하는 전통 황포돛배 체험입니다. 나주의 아름다운 강변 풍경을 감상할 수 있습니다.',
    category: 'attraction',
    address: '전남 나주시 영산동 영산강변',
    phone: '061-339-8916',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9561,
    lng: 126.6994,
    is_featured: true,
    status: 'published',
  },
  {
    name: '나주 배 테마공원',
    description: '나주의 특산물인 배를 테마로 한 공원입니다. 배 수확 체험과 배꽃 축제가 열립니다.',
    category: 'attraction',
    address: '전남 나주시 금천면 배꽃길 100',
    phone: '061-330-8253',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9500,
    lng: 126.7500,
    is_featured: false,
    status: 'published',
  },
  {
    name: '반남 고분군',
    description: '마한시대 대규모 고분군으로, 옹관묘와 다양한 출토품이 발견된 역사적 유적지입니다.',
    category: 'heritage',
    address: '전남 나주시 반남면 대안리',
    phone: '061-330-7800',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9750,
    lng: 126.7250,
    is_featured: false,
    status: 'published',
  },
  // 맛집
  {
    name: '하얀집 나주곰탕',
    description: '60년 전통의 나주곰탕 원조집입니다. 담백하고 깊은 맛의 곰탕이 일품입니다.',
    category: 'restaurant',
    address: '전남 나주시 금계동 110-1',
    phone: '061-333-4292',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9883,
    lng: 126.7139,
    is_featured: true,
    status: 'published',
  },
  {
    name: '남평국밥',
    description: '현지인들이 사랑하는 나주곰탕집입니다. 소머리 곰탕이 특히 인기입니다.',
    category: 'restaurant',
    address: '전남 나주시 남평읍 남평리 123',
    phone: '061-332-1234',
    thumbnail_url: '/images/region/나주.png',
    lat: 35.0167,
    lng: 126.7833,
    is_featured: false,
    status: 'published',
  },
  {
    name: '영산포 홍어식당',
    description: '삭힌 홍어를 전문으로 합니다. 홍어삼합, 홍어찜 등 다양한 요리를 맛볼 수 있습니다.',
    category: 'restaurant',
    address: '전남 나주시 영산동 홍어거리 15',
    phone: '061-333-5678',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9556,
    lng: 126.7000,
    is_featured: true,
    status: 'published',
  },
  {
    name: '나주읍성 한정식',
    description: '나주 향토 음식을 한상으로 즐길 수 있는 한정식 전문점입니다.',
    category: 'restaurant',
    address: '전남 나주시 금계동 200',
    phone: '061-332-9012',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9890,
    lng: 126.7120,
    is_featured: false,
    status: 'published',
  },
  {
    name: '빛가람 카페거리',
    description: '나주 혁신도시의 트렌디한 카페 모음입니다. 다양한 디저트와 음료를 즐길 수 있습니다.',
    category: 'cafe',
    address: '전남 나주시 빛가람동 카페거리',
    phone: '061-339-1234',
    thumbnail_url: '/images/region/나주.png',
    lat: 35.0150,
    lng: 126.7900,
    is_featured: false,
    status: 'published',
  },
  // 숙박
  {
    name: '그랜드 나주관광호텔',
    description: '나주 시내 중심에 위치한 관광호텔입니다. 깔끔한 시설과 친절한 서비스를 제공합니다.',
    category: 'accommodation',
    address: '전남 나주시 금계동 300-1',
    phone: '061-332-1000',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9875,
    lng: 126.7150,
    is_featured: true,
    status: 'published',
  },
  {
    name: '나주 혁신도시 스테이',
    description: '나주 혁신도시 내 모던한 숙박시설입니다. 출장객과 관광객 모두에게 적합합니다.',
    category: 'accommodation',
    address: '전남 나주시 빛가람동 123',
    phone: '061-339-2000',
    thumbnail_url: '/images/region/나주.png',
    lat: 35.0150,
    lng: 126.7900,
    is_featured: false,
    status: 'published',
  },
  {
    name: '영산강 펜션',
    description: '영산강변에 위치한 아늑한 펜션입니다. 황포돛배 체험과 함께 이용하기 좋습니다.',
    category: 'accommodation',
    address: '전남 나주시 영산동 50-3',
    phone: '061-333-3000',
    thumbnail_url: '/images/region/나주.png',
    lat: 34.9560,
    lng: 126.7010,
    is_featured: false,
    status: 'published',
  },
];

// ============================================
// 나주시 행사/축제 데이터
// ============================================
const NAJU_EVENTS = [
  {
    title: '나주 영산강 문화축제',
    description: '영산강의 역사와 문화를 기리는 나주 대표 축제입니다. 황포돛배 퍼레이드, 공연, 체험행사가 진행됩니다.',
    start_date: '2026-05-01',
    end_date: '2026-05-05',
    location: '영산포 일원',
    image_url: '/images/region/naju-hero.png',
    phone: '061-339-8916',
    category: 'festival',
    is_featured: true,
  },
  {
    title: '나주 배꽃축제',
    description: '나주의 특산물 배꽃이 만개하는 4월에 열리는 봄 축제입니다. 배꽃 감상과 함께 다양한 체험행사가 열립니다.',
    start_date: '2026-04-05',
    end_date: '2026-04-13',
    location: '나주 배 테마공원',
    image_url: '/images/region/naju-hero.png',
    phone: '061-330-8253',
    category: 'festival',
    is_featured: true,
  },
  {
    title: '영산포 홍어축제',
    description: '나주 영산포의 명물 홍어를 테마로 한 음식축제입니다. 홍어요리 경연, 시식행사가 진행됩니다.',
    start_date: '2026-09-20',
    end_date: '2026-09-22',
    location: '영산포 홍어거리',
    image_url: '/images/region/naju-hero.png',
    phone: '061-339-8916',
    category: 'festival',
    is_featured: false,
  },
  {
    title: '나주 빛가람 공연',
    description: '나주 혁신도시 빛가람동에서 열리는 정기 문화공연입니다. 매월 셋째 주 토요일에 열립니다.',
    start_date: '2026-01-18',
    end_date: '2026-12-19',
    location: '빛가람 혁신도시 광장',
    image_url: '/images/region/naju-hero.png',
    phone: '061-339-8000',
    category: 'performance',
    is_featured: false,
  },
  {
    title: '나주 역사문화탐방',
    description: '금성관, 나주향교 등 역사유적지를 둘러보는 문화해설사 투어입니다. 매주 토요일 진행됩니다.',
    start_date: '2026-01-04',
    end_date: '2026-12-26',
    location: '금성관 출발',
    image_url: '/images/region/naju-hero.png',
    phone: '061-339-8687',
    category: 'tour',
    is_featured: false,
  },
];

// 테이블 생성 SQL
const CREATE_PLACES_SQL = `
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sido_code VARCHAR(20) DEFAULT 'jeonnam',
    sigungu_code VARCHAR(30),
    region VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    tags TEXT[],
    address TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    thumbnail_url TEXT,
    images JSONB DEFAULT '[]',
    phone VARCHAR(50),
    rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,
    naver_map_url TEXT,
    kakao_map_url TEXT,
    specialties JSONB,
    heritage_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const CREATE_EVENTS_SQL = `
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    sido_code VARCHAR(20) DEFAULT 'jeonnam',
    sigungu_code VARCHAR(30),
    region VARCHAR(50),
    start_date DATE,
    end_date DATE,
    location VARCHAR(200),
    image_url TEXT,
    phone VARCHAR(100),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase credentials not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results = { places: 0, events: 0, tablesCreated: false, errors: [] as string[] };

  // 1. 테이블이 없으면 생성
  try {
    // places 테이블 생성 시도
    const { error: createPlacesError } = await supabase.rpc('exec_sql', {
      query: CREATE_PLACES_SQL
    }).single();

    if (createPlacesError && !createPlacesError.message.includes('already exists')) {
      // RPC가 없으면 직접 SQL 실행 시도
      console.log('RPC not available, tables might need manual creation');
    }

    // events 테이블 생성 시도
    const { error: createEventsError } = await supabase.rpc('exec_sql', {
      query: CREATE_EVENTS_SQL
    }).single();

    if (!createPlacesError && !createEventsError) {
      results.tablesCreated = true;
    }
  } catch (e) {
    console.log('Table creation via RPC not available');
  }

  try {
    // 1. Places 시드
    const places = NAJU_PLACES.map((place) => ({
      ...place,
      region: 'naju',
      sigungu_code: 'naju',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 기존 나주 데이터 삭제
    const { error: deletePlacesError } = await supabase
      .from('places')
      .delete()
      .eq('sigungu_code', 'naju');

    if (deletePlacesError) {
      results.errors.push(`Delete places error: ${deletePlacesError.message}`);
    }

    // 새 데이터 삽입
    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .insert(places)
      .select();

    if (placesError) {
      results.errors.push(`Insert places error: ${placesError.message}`);
    } else {
      results.places = placesData?.length || 0;
    }

    // 2. Events 시드
    const events = NAJU_EVENTS.map((event) => ({
      ...event,
      region: 'naju',
      sigungu_code: 'naju',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 기존 나주 데이터 삭제
    const { error: deleteEventsError } = await supabase
      .from('events')
      .delete()
      .eq('sigungu_code', 'naju');

    if (deleteEventsError) {
      results.errors.push(`Delete events error: ${deleteEventsError.message}`);
    }

    // 새 데이터 삽입
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .insert(events)
      .select();

    if (eventsError) {
      results.errors.push(`Insert events error: ${eventsError.message}`);
    } else {
      results.events = eventsData?.length || 0;
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: '나주시 데이터 시드 완료',
      results: {
        places: `${results.places}개 장소 추가`,
        events: `${results.events}개 행사 추가`,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}

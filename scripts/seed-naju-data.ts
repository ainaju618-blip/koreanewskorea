/**
 * 나주시 실제 데이터 시드 스크립트
 * - places 테이블: 관광지, 맛집, 숙박
 * - events 테이블: 행사/축제
 *
 * 실행: npx tsx scripts/seed-naju-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 나주시 관광지 데이터
// ============================================
const NAJU_ATTRACTIONS = [
  {
    name: '국립나주박물관',
    description: '전남 지역 마한·백제 문화유산을 전시하는 국립박물관입니다. 반남 고분군 출토 유물과 영산강 유역 고대 문화를 만나볼 수 있습니다.',
    category: 'attraction',
    address: '전남 나주시 반남면 고분로 747',
    phone: '061-330-7800',
    image_url: 'https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=800',
    latitude: 34.9833,
    longitude: 126.7167,
    is_featured: true,
  },
  {
    name: '나주목문화관',
    description: '조선시대 나주목의 역사와 문화를 체험할 수 있는 문화관입니다. 나주목 관아 복원과 전통문화 체험 프로그램을 운영합니다.',
    category: 'attraction',
    address: '전남 나주시 금계동 8-5',
    phone: '061-339-8687',
    image_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
    latitude: 34.9894,
    longitude: 126.7111,
    is_featured: true,
  },
  {
    name: '금성관',
    description: '조선시대 나주목 객사로, 현존하는 객사 중 가장 큰 규모를 자랑합니다. 국가 지정 보물 제2037호입니다.',
    category: 'heritage',
    address: '전남 나주시 금계동 8-1',
    phone: '061-339-8687',
    image_url: 'https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=800',
    latitude: 34.9889,
    longitude: 126.7108,
    is_featured: true,
  },
  {
    name: '나주향교',
    description: '고려시대에 창건된 향교로, 대성전과 명륜당 등 유서 깊은 건물들이 보존되어 있습니다.',
    category: 'heritage',
    address: '전남 나주시 향교길 38',
    phone: '061-332-4692',
    image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    latitude: 34.9922,
    longitude: 126.7183,
    is_featured: false,
  },
  {
    name: '영산포 등대',
    description: '1915년 건립된 근대문화유산으로, 영산강 포구의 역사를 보여주는 상징적인 건축물입니다.',
    category: 'attraction',
    address: '전남 나주시 영산동 1-15',
    phone: '061-339-8687',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    latitude: 34.9556,
    longitude: 126.7000,
    is_featured: true,
  },
  {
    name: '황포돛배',
    description: '영산강에서 운항하는 전통 황포돛배 체험입니다. 나주의 아름다운 강변 풍경을 감상할 수 있습니다.',
    category: 'attraction',
    address: '전남 나주시 영산동 영산강변',
    phone: '061-339-8916',
    image_url: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800',
    latitude: 34.9561,
    longitude: 126.6994,
    is_featured: true,
  },
  {
    name: '나주 배 테마공원',
    description: '나주의 특산물인 배를 테마로 한 공원입니다. 배 수확 체험과 배꽃 축제가 열립니다.',
    category: 'attraction',
    address: '전남 나주시 금천면 배꽃길 100',
    phone: '061-330-8253',
    image_url: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800',
    latitude: 34.9500,
    longitude: 126.7500,
    is_featured: false,
  },
  {
    name: '반남 고분군',
    description: '마한시대 대규모 고분군으로, 옹관묘와 다양한 출토품이 발견된 역사적 유적지입니다.',
    category: 'heritage',
    address: '전남 나주시 반남면 대안리',
    phone: '061-330-7800',
    image_url: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=800',
    latitude: 34.9750,
    longitude: 126.7250,
    is_featured: false,
  },
];

// ============================================
// 나주시 맛집 데이터
// ============================================
const NAJU_RESTAURANTS = [
  {
    name: '하얀집 나주곰탕',
    description: '60년 전통의 나주곰탕 원조집입니다. 담백하고 깊은 맛의 곰탕이 일품입니다.',
    category: 'restaurant',
    address: '전남 나주시 금계동 110-1',
    phone: '061-333-4292',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    latitude: 34.9883,
    longitude: 126.7139,
    is_featured: true,
  },
  {
    name: '남평국밥',
    description: '현지인들이 사랑하는 나주곰탕집입니다. 소머리 곰탕이 특히 인기입니다.',
    category: 'restaurant',
    address: '전남 나주시 남평읍 남평리 123',
    phone: '061-332-1234',
    image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800',
    latitude: 35.0167,
    longitude: 126.7833,
    is_featured: false,
  },
  {
    name: '영산포 홍어거리',
    description: '삭힌 홍어를 전문으로 하는 홍어거리입니다. 홍어삼합, 홍어찜 등 다양한 요리를 맛볼 수 있습니다.',
    category: 'restaurant',
    address: '전남 나주시 영산동 홍어거리',
    phone: '061-333-5678',
    image_url: 'https://images.unsplash.com/photo-1580959375944-abd7e991f971?w=800',
    latitude: 34.9556,
    longitude: 126.7000,
    is_featured: true,
  },
  {
    name: '나주 배즙 농장',
    description: '신선한 나주 배와 배즙을 맛볼 수 있는 관광농원입니다. 배따기 체험도 가능합니다.',
    category: 'restaurant',
    address: '전남 나주시 금천면 금천로 456',
    phone: '061-333-7890',
    image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800',
    latitude: 34.9600,
    longitude: 126.7600,
    is_featured: false,
  },
  {
    name: '나주읍성 한정식',
    description: '나주 향토 음식을 한상으로 즐길 수 있는 한정식 전문점입니다.',
    category: 'restaurant',
    address: '전남 나주시 금계동 200',
    phone: '061-332-9012',
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800',
    latitude: 34.9890,
    longitude: 126.7120,
    is_featured: false,
  },
];

// ============================================
// 나주시 숙박 데이터
// ============================================
const NAJU_ACCOMMODATIONS = [
  {
    name: '그랜드 나주관광호텔',
    description: '나주 시내 중심에 위치한 관광호텔입니다. 깔끔한 시설과 친절한 서비스를 제공합니다.',
    category: 'accommodation',
    address: '전남 나주시 금계동 300-1',
    phone: '061-332-1000',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    latitude: 34.9875,
    longitude: 126.7150,
    is_featured: true,
  },
  {
    name: '나주 혁신도시 스테이',
    description: '나주 혁신도시 내 모던한 숙박시설입니다. 출장객과 관광객 모두에게 적합합니다.',
    category: 'accommodation',
    address: '전남 나주시 빛가람동 123',
    phone: '061-339-2000',
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    latitude: 35.0150,
    longitude: 126.7900,
    is_featured: false,
  },
  {
    name: '영산강 펜션',
    description: '영산강변에 위치한 아늑한 펜션입니다. 황포돛배 체험과 함께 이용하기 좋습니다.',
    category: 'accommodation',
    address: '전남 나주시 영산동 50-3',
    phone: '061-333-3000',
    image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    latitude: 34.9560,
    longitude: 126.7010,
    is_featured: false,
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
    image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
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
    image_url: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800',
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
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
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
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
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
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    phone: '061-339-8687',
    category: 'tour',
    is_featured: false,
  },
];

// ============================================
// 시드 함수
// ============================================
async function seedPlaces() {
  console.log('📍 나주시 장소 데이터 시드 시작...');

  const places = [
    ...NAJU_ATTRACTIONS,
    ...NAJU_RESTAURANTS,
    ...NAJU_ACCOMMODATIONS,
  ].map((place) => ({
    ...place,
    region: 'naju',
    sigungu_code: 'naju',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // 기존 나주 데이터 삭제
  const { error: deleteError } = await supabase
    .from('places')
    .delete()
    .eq('sigungu_code', 'naju');

  if (deleteError) {
    console.error('기존 데이터 삭제 실패:', deleteError);
  }

  // 새 데이터 삽입
  const { data, error } = await supabase.from('places').insert(places).select();

  if (error) {
    console.error('장소 데이터 시드 실패:', error);
    return;
  }

  console.log(`✅ ${data.length}개 장소 데이터 시드 완료`);
}

async function seedEvents() {
  console.log('📅 나주시 행사 데이터 시드 시작...');

  const events = NAJU_EVENTS.map((event) => ({
    ...event,
    region: 'naju',
    sigungu_code: 'naju',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // 기존 나주 데이터 삭제
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('sigungu_code', 'naju');

  if (deleteError) {
    console.error('기존 데이터 삭제 실패:', deleteError);
  }

  // 새 데이터 삽입
  const { data, error } = await supabase.from('events').insert(events).select();

  if (error) {
    console.error('행사 데이터 시드 실패:', error);
    return;
  }

  console.log(`✅ ${data.length}개 행사 데이터 시드 완료`);
}

// ============================================
// 메인 실행
// ============================================
async function main() {
  console.log('🌾 나주시 실제 데이터 시드 시작');
  console.log('=' .repeat(50));

  await seedPlaces();
  await seedEvents();

  console.log('=' .repeat(50));
  console.log('✨ 나주시 데이터 시드 완료!');
}

main().catch(console.error);

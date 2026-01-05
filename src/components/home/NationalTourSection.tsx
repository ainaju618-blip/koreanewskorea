import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';

/**
 * National Tour Section - 본사(전국판) 전국 여행정보 섹션
 * =========================================================
 * 한국관광공사 TourAPI 데이터 기반
 * 전국 인기 관광지/맛집/축제 정보 표시
 */

interface TourSpot {
  id: number;
  content_id: string;
  title: string;
  content_type: string;
  region_name: string;
  image_url?: string;
  addr1?: string;
  tel?: string;
  map_x?: number;
  map_y?: number;
}

// 콘텐츠 타입별 아이콘 (숫자 코드 기반)
const CONTENT_TYPE_ICONS: Record<string, string> = {
  '12': '🏛️',  // 관광지
  '14': '🎭',  // 문화시설
  '15': '🎪',  // 축제공연행사
  '28': '⛳',  // 레포츠
  '32': '🏨',  // 숙박
  '38': '🛍️',  // 쇼핑
  '39': '🍽️',  // 음식점
};

// 콘텐츠 타입별 색상 (숫자 코드 기반)
const CONTENT_TYPE_COLORS: Record<string, string> = {
  '12': '#2563EB',  // 관광지
  '14': '#7C3AED',  // 문화시설
  '15': '#EA580C',  // 축제공연행사
  '28': '#059669',  // 레포츠
  '32': '#0891B2',  // 숙박
  '38': '#DB2777',  // 쇼핑
  '39': '#DC2626',  // 음식점
};

// 콘텐츠 타입 코드 (한국관광공사 TourAPI)
const CONTENT_TYPE_CODES = {
  관광지: '12',
  문화시설: '14',
  축제공연행사: '15',
  레포츠: '28',
  숙박: '32',
  쇼핑: '38',
  음식점: '39',
};

async function getNationalTourData(): Promise<{
  attractions: TourSpot[];
  restaurants: TourSpot[];
  festivals: TourSpot[];
}> {
  const supabase = await createClient();

  // 관광지 (content_type = '12')
  const { data: attractions } = await supabase
    .from('tour_spots')
    .select('*')
    .eq('content_type', CONTENT_TYPE_CODES.관광지)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(6);

  // 음식점 (content_type = '39')
  const { data: restaurants } = await supabase
    .from('tour_spots')
    .select('*')
    .eq('content_type', CONTENT_TYPE_CODES.음식점)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(4);

  // 축제/행사 (content_type = '15')
  const { data: festivals } = await supabase
    .from('tour_spots')
    .select('*')
    .eq('content_type', CONTENT_TYPE_CODES.축제공연행사)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(4);

  return {
    attractions: attractions || [],
    restaurants: restaurants || [],
    festivals: festivals || [],
  };
}

export default async function NationalTourSection() {
  const { attractions, restaurants, festivals } = await getNationalTourData();

  // 데이터가 하나도 없으면 렌더링 안함
  if (attractions.length === 0 && restaurants.length === 0 && festivals.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#059669]" />
          <h2 className="text-2xl font-bold text-slate-900">전국 여행정보</h2>
          <span className="text-sm text-slate-500">Travel Guide</span>
        </div>
        <Link
          href="/travel"
          className="text-sm text-[#059669] hover:underline flex items-center gap-1"
        >
          더보기 →
        </Link>
      </div>

      {/* 인기 관광지 */}
      {attractions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏛️</span>
            <h3 className="text-lg font-semibold text-slate-800">인기 관광지</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {attractions.map((spot) => (
              <TourSpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        </div>
      )}

      {/* 맛집 & 축제 2단 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 맛집 */}
        {restaurants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🍽️</span>
              <h3 className="text-lg font-semibold text-slate-800">전국 맛집</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {restaurants.map((spot) => (
                <TourSpotCard key={spot.id} spot={spot} compact />
              ))}
            </div>
          </div>
        )}

        {/* 축제/행사 */}
        {festivals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎪</span>
              <h3 className="text-lg font-semibold text-slate-800">축제/행사</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {festivals.map((spot) => (
                <TourSpotCard key={spot.id} spot={spot} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Separation */}
      <div className="w-full h-px bg-slate-200 mt-8" />
    </section>
  );
}

// 관광 스팟 카드 컴포넌트
function TourSpotCard({ spot, compact = false }: { spot: TourSpot; compact?: boolean }) {
  const icon = CONTENT_TYPE_ICONS[spot.content_type] || '📍';
  const color = CONTENT_TYPE_COLORS[spot.content_type] || '#6B7280';

  // 카카오맵 길찾기 URL
  const naviUrl = spot.map_x && spot.map_y
    ? `https://map.kakao.com/link/to/${encodeURIComponent(spot.title)},${spot.map_y},${spot.map_x}`
    : null;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      {/* 이미지 */}
      <div className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[3/2]'} overflow-hidden`}>
        {spot.image_url ? (
          <Image
            src={spot.image_url}
            alt={spot.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-3xl">{icon}</span>
          </div>
        )}
        {/* 지역 뱃지 */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 text-xs font-medium rounded text-slate-700">
          {spot.region_name}
        </span>
      </div>

      {/* 정보 */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-slate-900 line-clamp-1 mb-1 group-hover:text-[#059669] transition-colors">
          {spot.title}
        </h4>
        {spot.addr1 && !compact && (
          <p className="text-xs text-slate-500 line-clamp-1 mb-2">
            {spot.addr1}
          </p>
        )}
        {naviUrl && (
          <a
            href={naviUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color }}
          >
            <span>🧭</span>
            길찾기
          </a>
        )}
      </div>
    </div>
  );
}

import type { NewsArticle, WeatherData, EventData, PlaceData, RegionInfo } from '@/types/region';
import { supabaseAdmin } from './supabase-admin';

// 뉴스 데이터는 운영서버(koreanewsone.com)에서 가져옴
const PRODUCTION_API = 'https://www.koreanewsone.com';

/**
 * 지역 데이터 통합 페칭
 * SSR에서 사용 - 서버 측 데이터 페칭
 */
export interface RegionPageData {
  news: NewsArticle[];
  weather: WeatherData | null;
  events: EventData[];           // 전국 축제
  regionalEvents: EventData[];   // 지역 축제 (전남+광주)
  places: PlaceData[];
}

/**
 * 지역 페이지 데이터 통합 페칭
 * - 뉴스: 운영서버(koreanewsone.com)
 * - places/events: 로컬 Supabase
 */
export async function fetchRegionData(regionCode: string): Promise<RegionPageData> {
  try {
    // 1. 뉴스/날씨는 운영서버에서 가져옴
    const [newsRes, weatherRes] = await Promise.all([
      fetch(`${PRODUCTION_API}/api/region/${regionCode}/news?limit=100`, {
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch(`${PRODUCTION_API}/api/region/${regionCode}/weather`, {
        next: { revalidate: 300 },
      }).catch(() => null),
    ]);

    // 2. places는 로컬 Supabase에서 직접 가져옴
    const placesPromise = supabaseAdmin
      .from('places')
      .select('*')
      .or(`sigungu_code.eq.${regionCode},region.eq.${regionCode}`)
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(150);

    // 3. 전국 축제 (sigungu_code = 'national')
    const eventsPromise = supabaseAdmin
      .from('events')
      .select('*')
      .eq('sigungu_code', 'national')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(20);

    // 4. 지역 축제 (전남 + 광주 지역) - sido_code로 필터
    const regionalEventsPromise = supabaseAdmin
      .from('events')
      .select('*')
      .or('sido_code.eq.jeonnam,sido_code.eq.gwangju')
      .neq('sigungu_code', 'national')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(20);

    const [placesResult, eventsResult, regionalEventsResult] = await Promise.all([
      placesPromise,
      eventsPromise,
      regionalEventsPromise,
    ]);

    // Process responses
    const news = newsRes?.ok ? (await newsRes.json()).articles || [] : [];
    const weather = weatherRes?.ok ? (await weatherRes.json()).weather || null : null;

    // places 데이터 변환 (이미지 없는 장소 필터링)
    const places: PlaceData[] = (placesResult.data || [])
      .filter((place) => place.thumbnail_url) // 이미지가 있는 장소만 노출
      .map((place) => ({
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

    // 전국 축제 (이미지 있는 것만)
    const events: EventData[] = (eventsResult.data || [])
      .filter((event) => event.image_url)
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.start_date,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        category: event.category,
        imageUrl: event.image_url,
        phone: event.phone,
      }));

    // 지역 축제 - 전남+광주 (이미지 있는 것만)
    const regionalEvents: EventData[] = (regionalEventsResult.data || [])
      .filter((event) => event.image_url)
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.start_date,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        category: event.category,
        imageUrl: event.image_url,
        phone: event.phone,
      }));

    return { news, weather, events, regionalEvents, places };
  } catch (error) {
    console.error(`Failed to fetch region data for ${regionCode}:`, error);
    return { news: [], weather: null, events: [], regionalEvents: [], places: [] };
  }
}

/**
 * 지역 정보 가져오기
 */
export function getRegionInfo(regionCode: string): RegionInfo | null {
  const regions: Record<string, RegionInfo> = {
    naju: {
      code: 'naju',
      name: '나주시',
      nameEn: 'Naju',
      sido: '전남',
      slogan: '천년 역사의 배고을',
      sidoSlogan: '전남 생명의 땅, 으뜸 전남',
      heroImage: '/images/hero/naju-hero.png',
      description: '천년의 역사를 간직한 영산강의 도시, 나주배와 곰탕의 고장입니다.',
      themeColor: 'emerald',
    },
    jindo: {
      code: 'jindo',
      name: '진도군',
      nameEn: 'Jindo',
      sido: '전남',
      slogan: '신비의 바닷길',
      sidoSlogan: '전남 생명의 땅, 으뜸 전남',
      heroImage: '/images/hero/jindo-hero.png',
      description: '신비의 바닷길과 진도개의 고장, 국악과 예술의 섬입니다.',
      themeColor: 'cyan',
    },
    gwangju: {
      code: 'gwangju',
      name: '광주광역시',
      nameEn: 'Gwangju',
      sido: '광주',
      slogan: '빛고을 광주',
      sidoSlogan: '문화수도 광주',
      heroImage: '/images/hero/gwangju-hero.png',
      description: '민주, 인권, 평화의 도시, 문화와 예술이 살아 숨쉬는 빛고을입니다.',
      themeColor: 'purple',
    },
  };

  return regions[regionCode] || null;
}

/**
 * 뉴스 카테고리 정규화
 * Legacy categories → 3단계 정규화 (government/council/education)
 */
export function normalizeNewsCategory(article: NewsArticle): string {
  const source = article.source?.toLowerCase() || '';
  const category = article.category?.toLowerCase() || '';

  // 의회 판별
  if (category === '의회' || source.includes('의회') || source.includes('의원')) {
    return 'council';
  }

  // 교육 판별
  if (category === '교육' || source.includes('교육') || source.includes('학교')) {
    return 'education';
  }

  // 기본값: 시군청 (government)
  return 'government';
}

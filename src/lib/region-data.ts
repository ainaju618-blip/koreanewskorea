import type { NewsArticle, WeatherData, EventData, PlaceData, RegionInfo } from '@/types/region';

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || '';
// 운영서버에서 뉴스 데이터 가져오기
const PRODUCTION_API = 'https://www.koreanewsone.com';

/**
 * 지역 데이터 통합 페칭
 * SSR에서 사용 - 서버 측 데이터 페칭
 */
export interface RegionPageData {
  news: NewsArticle[];
  weather: WeatherData | null;
  events: EventData[];
  places: PlaceData[];
}

/**
 * 지역 페이지 데이터 통합 페칭
 * 뉴스: 운영서버(koreanewsone.com)에서 가져옴
 * 기타: 로컬 API 사용
 */
export async function fetchRegionData(regionCode: string): Promise<RegionPageData> {
  const baseUrl = API_BASE || 'http://localhost:3001';

  try {
    // Parallel fetch all data
    // 뉴스는 운영서버에서, 나머지는 로컬에서
    const [newsRes, weatherRes, eventsRes, placesRes] = await Promise.all([
      fetch(`${PRODUCTION_API}/api/region/${regionCode}/news?limit=30`, {
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch(`${baseUrl}/api/region/${regionCode}/weather`, {
        next: { revalidate: 300 }, // Weather updates less frequently
      }).catch(() => null),
      fetch(`${baseUrl}/api/region/${regionCode}/events?limit=5&upcoming=true`, {
        next: { revalidate: 3600 }, // Events update hourly
      }).catch(() => null),
      fetch(`${baseUrl}/api/region/${regionCode}/places?limit=150`, {
        next: { revalidate: 3600 }, // Places update hourly
      }).catch(() => null),
    ]);

    // Process responses
    const news = newsRes?.ok ? (await newsRes.json()).articles || [] : [];
    const weather = weatherRes?.ok ? (await weatherRes.json()).weather || null : null;
    const events = eventsRes?.ok ? (await eventsRes.json()).events || [] : [];
    const places = placesRes?.ok ? (await placesRes.json()).places || [] : [];

    return { news, weather, events, places };
  } catch (error) {
    console.error(`Failed to fetch region data for ${regionCode}:`, error);
    return { news: [], weather: null, events: [], places: [] };
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

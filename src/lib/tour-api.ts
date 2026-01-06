/**
 * 한국관광공사 TourAPI 연동 라이브러리
 * - 관광지, 맛집, 숙박, 행사 정보 조회
 * - API: https://api.visitkorea.or.kr
 *
 * 나주시 지역코드: 38 (전라남도), 시군구코드: 13 (나주시)
 */

// 지역 코드 매핑
export const REGION_CODES: Record<string, { areaCode: number; sigunguCode: number }> = {
  naju: { areaCode: 38, sigunguCode: 13 },      // 전남 나주시
  jindo: { areaCode: 38, sigunguCode: 18 },     // 전남 진도군
  gwangju: { areaCode: 5, sigunguCode: 0 },     // 광주광역시
  mokpo: { areaCode: 38, sigunguCode: 7 },      // 전남 목포시
  suncheon: { areaCode: 38, sigunguCode: 10 },  // 전남 순천시
  yeosu: { areaCode: 38, sigunguCode: 11 },     // 전남 여수시
};

// 콘텐츠 타입
export const CONTENT_TYPE = {
  ATTRACTION: 12,    // 관광지
  CULTURE: 14,       // 문화시설
  FESTIVAL: 15,      // 축제/공연/행사
  TRAVEL_COURSE: 25, // 여행코스
  LEISURE: 28,       // 레포츠
  ACCOMMODATION: 32, // 숙박
  SHOPPING: 38,      // 쇼핑
  RESTAURANT: 39,    // 음식점
} as const;

export interface TourApiConfig {
  serviceKey: string;
  baseUrl?: string;
  mobileOS?: string;
  mobileApp?: string;
}

export interface TourSpot {
  contentId: string;
  contentTypeId: string;
  title: string;
  address: string;
  firstImage: string;
  firstImage2: string;
  tel: string;
  mapX: string;
  mapY: string;
  overview?: string;
  homepage?: string;
}

export interface TourEvent {
  contentId: string;
  title: string;
  address: string;
  firstImage: string;
  eventStartDate: string;
  eventEndDate: string;
  tel: string;
}

interface TourApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: T | T[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

/**
 * 한국관광공사 TourAPI 클라이언트
 */
export class TourApiClient {
  private serviceKey: string;
  private baseUrl: string;
  private mobileOS: string;
  private mobileApp: string;

  constructor(config: TourApiConfig) {
    this.serviceKey = config.serviceKey;
    this.baseUrl = config.baseUrl || 'https://apis.data.go.kr/B551011/KorService1';
    this.mobileOS = config.mobileOS || 'WEB';
    this.mobileApp = config.mobileApp || 'koreanewskorea';
  }

  private async fetchApi<T>(endpoint: string, params: Record<string, string | number>): Promise<T[]> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    // 기본 파라미터
    url.searchParams.append('serviceKey', this.serviceKey);
    url.searchParams.append('MobileOS', this.mobileOS);
    url.searchParams.append('MobileApp', this.mobileApp);
    url.searchParams.append('_type', 'json');

    // 추가 파라미터
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`TourAPI error: ${response.status}`);
      }

      const data: TourApiResponse<T> = await response.json();

      if (data.response.header.resultCode !== '0000') {
        throw new Error(`TourAPI error: ${data.response.header.resultMsg}`);
      }

      const items = data.response.body?.items?.item;
      if (!items) return [];

      return Array.isArray(items) ? items : [items];
    } catch (error) {
      console.error(`TourAPI fetch error (${endpoint}):`, error);
      return [];
    }
  }

  /**
   * 지역 기반 관광정보 조회
   */
  async getAreaBasedList(options: {
    regionCode: string;
    contentTypeId?: number;
    numOfRows?: number;
    pageNo?: number;
  }): Promise<TourSpot[]> {
    const codes = REGION_CODES[options.regionCode];
    if (!codes) {
      console.error(`Unknown region code: ${options.regionCode}`);
      return [];
    }

    const params: Record<string, string | number> = {
      areaCode: codes.areaCode,
      numOfRows: options.numOfRows || 10,
      pageNo: options.pageNo || 1,
      listYN: 'Y',
      arrange: 'A', // 제목순
    };

    if (codes.sigunguCode > 0) {
      params.sigunguCode = codes.sigunguCode;
    }

    if (options.contentTypeId) {
      params.contentTypeId = options.contentTypeId;
    }

    return this.fetchApi<TourSpot>('areaBasedList1', params);
  }

  /**
   * 관광지 목록 조회
   */
  async getAttractions(regionCode: string, limit: number = 10): Promise<TourSpot[]> {
    return this.getAreaBasedList({
      regionCode,
      contentTypeId: CONTENT_TYPE.ATTRACTION,
      numOfRows: limit,
    });
  }

  /**
   * 맛집 목록 조회
   */
  async getRestaurants(regionCode: string, limit: number = 10): Promise<TourSpot[]> {
    return this.getAreaBasedList({
      regionCode,
      contentTypeId: CONTENT_TYPE.RESTAURANT,
      numOfRows: limit,
    });
  }

  /**
   * 숙박 목록 조회
   */
  async getAccommodations(regionCode: string, limit: number = 10): Promise<TourSpot[]> {
    return this.getAreaBasedList({
      regionCode,
      contentTypeId: CONTENT_TYPE.ACCOMMODATION,
      numOfRows: limit,
    });
  }

  /**
   * 문화시설 목록 조회
   */
  async getCultureFacilities(regionCode: string, limit: number = 10): Promise<TourSpot[]> {
    return this.getAreaBasedList({
      regionCode,
      contentTypeId: CONTENT_TYPE.CULTURE,
      numOfRows: limit,
    });
  }

  /**
   * 축제/행사 목록 조회
   */
  async getFestivals(regionCode: string, eventStartDate?: string): Promise<TourEvent[]> {
    const codes = REGION_CODES[regionCode];
    if (!codes) return [];

    const params: Record<string, string | number> = {
      areaCode: codes.areaCode,
      numOfRows: 20,
      pageNo: 1,
      listYN: 'Y',
      arrange: 'A',
    };

    if (codes.sigunguCode > 0) {
      params.sigunguCode = codes.sigunguCode;
    }

    if (eventStartDate) {
      params.eventStartDate = eventStartDate;
    }

    return this.fetchApi<TourEvent>('searchFestival1', params);
  }

  /**
   * 상세정보 조회
   */
  async getDetailInfo(contentId: string, contentTypeId: number): Promise<TourSpot | null> {
    const items = await this.fetchApi<TourSpot>('detailCommon1', {
      contentId,
      contentTypeId,
      defaultYN: 'Y',
      firstImageYN: 'Y',
      addrinfoYN: 'Y',
      mapinfoYN: 'Y',
      overviewYN: 'Y',
    });

    return items[0] || null;
  }
}

/**
 * TourAPI 클라이언트 싱글톤 인스턴스 생성
 */
let tourApiClient: TourApiClient | null = null;

export function getTourApiClient(): TourApiClient | null {
  const serviceKey = process.env.TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY;

  if (!serviceKey) {
    console.warn('TOUR_API_KEY is not configured');
    return null;
  }

  if (!tourApiClient) {
    tourApiClient = new TourApiClient({ serviceKey });
  }

  return tourApiClient;
}

/**
 * TourSpot → DB용 Place 변환
 */
export function tourSpotToPlace(spot: TourSpot, regionCode: string, category: string) {
  return {
    name: spot.title,
    description: spot.overview || '',
    category,
    address: spot.address,
    phone: spot.tel || null,
    image_url: spot.firstImage || spot.firstImage2 || null,
    latitude: spot.mapY ? parseFloat(spot.mapY) : null,
    longitude: spot.mapX ? parseFloat(spot.mapX) : null,
    region: regionCode,
    sigungu_code: regionCode,
    content_id: spot.contentId,
    content_type_id: spot.contentTypeId,
    homepage: spot.homepage || null,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * TourEvent → DB용 Event 변환
 */
export function tourEventToEvent(event: TourEvent, regionCode: string) {
  return {
    title: event.title,
    description: '',
    start_date: formatDateString(event.eventStartDate),
    end_date: formatDateString(event.eventEndDate),
    location: event.address,
    image_url: event.firstImage || null,
    phone: event.tel || null,
    region: regionCode,
    sigungu_code: regionCode,
    content_id: event.contentId,
    category: 'festival',
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * 날짜 문자열 포맷 (YYYYMMDD → YYYY-MM-DD)
 */
function formatDateString(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

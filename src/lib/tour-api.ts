/**
 * 한국관광공사 TourAPI 연동 라이브러리 (KorService2)
 * - 관광지, 맛집, 숙박, 행사 정보 조회
 * - API: https://apis.data.go.kr/B551011/KorService2
 *
 * 전라남도(38) 시군구코드: 나주시=6, 진도군=21, 목포시=8, 순천시=11, 여수시=13
 * 2026-01-07: KorService1 → KorService2 마이그레이션, 시군구코드 수정
 */

// 지역 코드 매핑 (KorService2 기준, 2026-01-07 수정)
export const REGION_CODES: Record<string, { areaCode: number; sigunguCode: number }> = {
  naju: { areaCode: 38, sigunguCode: 6 },       // 전남 나주시 ✓
  jindo: { areaCode: 38, sigunguCode: 21 },     // 전남 진도군 ✓
  gwangju: { areaCode: 5, sigunguCode: 0 },     // 광주광역시
  mokpo: { areaCode: 38, sigunguCode: 8 },      // 전남 목포시 ✓
  suncheon: { areaCode: 38, sigunguCode: 11 },  // 전남 순천시 ✓
  yeosu: { areaCode: 38, sigunguCode: 13 },     // 전남 여수시 ✓
  gangiin: { areaCode: 38, sigunguCode: 1 },    // 전남 강진군
  goheung: { areaCode: 38, sigunguCode: 2 },    // 전남 고흥군
  gokseong: { areaCode: 38, sigunguCode: 3 },   // 전남 곡성군
  gwangyang: { areaCode: 38, sigunguCode: 4 },  // 전남 광양시
  gurye: { areaCode: 38, sigunguCode: 5 },      // 전남 구례군
  damyang: { areaCode: 38, sigunguCode: 7 },    // 전남 담양군
  muan: { areaCode: 38, sigunguCode: 9 },       // 전남 무안군
  boseong: { areaCode: 38, sigunguCode: 10 },   // 전남 보성군
  sinan: { areaCode: 38, sigunguCode: 12 },     // 전남 신안군
  yeonggwang: { areaCode: 38, sigunguCode: 16 },// 전남 영광군
  yeongam: { areaCode: 38, sigunguCode: 17 },   // 전남 영암군
  wando: { areaCode: 38, sigunguCode: 18 },     // 전남 완도군
  jangseong: { areaCode: 38, sigunguCode: 19 }, // 전남 장성군
  jangheung: { areaCode: 38, sigunguCode: 20 }, // 전남 장흥군
  hampyeong: { areaCode: 38, sigunguCode: 22 }, // 전남 함평군
  haenam: { areaCode: 38, sigunguCode: 23 },    // 전남 해남군
  hwasun: { areaCode: 38, sigunguCode: 24 },    // 전남 화순군
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
  contentid: string;      // KorService2: 소문자
  contenttypeid: string;  // KorService2: 소문자
  title: string;
  addr1: string;          // KorService2: addr1 (address 아님)
  addr2?: string;
  firstimage: string;     // KorService2: 소문자
  firstimage2: string;    // KorService2: 소문자
  tel: string;
  mapx: string;           // KorService2: 소문자
  mapy: string;           // KorService2: 소문자
  overview?: string;
  homepage?: string;
}

export interface TourEvent {
  contentid: string;        // KorService2: 소문자
  title: string;
  addr1: string;            // KorService2: addr1
  firstimage: string;       // KorService2: 소문자
  eventstartdate: string;   // KorService2: 소문자
  eventenddate: string;     // KorService2: 소문자
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
    // KorService1 → KorService2 변경 (2026-01-07)
    this.baseUrl = config.baseUrl || 'https://apis.data.go.kr/B551011/KorService2';
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
      console.log(`[TourAPI] Requesting: ${url.toString().replace(this.serviceKey, '***KEY***')}`);

      const response = await fetch(url.toString());

      // 에러 응답 시 상세 로깅 (주인님 가이드에 따라)
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TourAPI] HTTP ${response.status} Error:`);
        console.error(`[TourAPI] Response Headers:`, Object.fromEntries(response.headers.entries()));
        console.error(`[TourAPI] Response Body:`, errorText);
        throw new Error(`TourAPI HTTP ${response.status}: ${errorText}`);
      }

      // 응답 텍스트 먼저 받아서 파싱 시도
      const responseText = await response.text();

      // XML 응답인지 확인 (에러 시 XML로 오는 경우)
      if (responseText.startsWith('<?xml') || responseText.startsWith('<')) {
        console.error(`[TourAPI] XML Response received (check for errors):`, responseText.substring(0, 500));
        // XML 에러 응답 파싱
        const errCodeMatch = responseText.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/);
        const errMsgMatch = responseText.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/);
        if (errCodeMatch || errMsgMatch) {
          throw new Error(`TourAPI Auth Error: ${errCodeMatch?.[1] || 'unknown'} - ${errMsgMatch?.[1] || 'unknown'}`);
        }
      }

      const data = JSON.parse(responseText);

      // KorService2 에러 응답 처리 (플랫 형식: {resultCode, resultMsg, responseTime})
      if ('resultCode' in data && data.resultCode !== '0000' && !data.response) {
        console.error(`[TourAPI] KorService2 Error: ${data.resultCode} - ${data.resultMsg}`);
        throw new Error(`TourAPI error: ${data.resultMsg}`);
      }

      // 정상 응답 처리 (중첩 형식: {response: {header, body}})
      if (data.response?.header?.resultCode !== '0000') {
        console.error(`[TourAPI] API Error: ${data.response?.header?.resultCode} - ${data.response?.header?.resultMsg}`);
        throw new Error(`TourAPI error: ${data.response?.header?.resultMsg}`);
      }

      const items = data.response.body?.items?.item;
      if (!items) {
        console.log(`[TourAPI] No items in response for ${endpoint}`);
        return [];
      }

      const result = Array.isArray(items) ? items : [items];
      console.log(`[TourAPI] Success: ${result.length} items from ${endpoint}`);
      return result;
    } catch (error) {
      console.error(`[TourAPI] Fetch error (${endpoint}):`, error);
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
      // listYN: 'Y', // KorService2에서 미지원 - 2026-01-07 제거
      arrange: 'A', // 제목순
    };

    if (codes.sigunguCode > 0) {
      params.sigunguCode = codes.sigunguCode;
    }

    if (options.contentTypeId) {
      params.contentTypeId = options.contentTypeId;
    }

    return this.fetchApi<TourSpot>('areaBasedList2', params);
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
   * 레포츠/자연경관 목록 조회
   */
  async getLeisure(regionCode: string, limit: number = 10): Promise<TourSpot[]> {
    return this.getAreaBasedList({
      regionCode,
      contentTypeId: CONTENT_TYPE.LEISURE,
      numOfRows: limit,
    });
  }

  /**
   * 축제/행사 목록 조회 (전국 축제)
   * - 지역 축제가 적으므로 전국 축제를 가져와서 1월 축제 등을 안내
   * - areaCode 없이 호출하면 전국 축제 조회
   */
  async getFestivals(regionCode: string, eventStartDate?: string): Promise<TourEvent[]> {
    // regionCode는 참고용으로만 사용 (전국 축제 조회)

    // KorService2: eventStartDate 필수 파라미터 (2026-01-07)
    // 기본값: 이번 달 1일부터 (현재 진행 중인 축제 + 예정 축제)
    const today = new Date();
    const defaultStartDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;

    const params: Record<string, string | number> = {
      // areaCode 없이 전국 축제 검색 (100개 가져와서 지역 필터링)
      numOfRows: 100,
      pageNo: 1,
      arrange: 'A',
      eventStartDate: eventStartDate || defaultStartDate,
    };

    return this.fetchApi<TourEvent>('searchFestival2', params);
  }

  /**
   * 특정 지역 축제/행사 목록 조회
   */
  async getRegionalFestivals(regionCode: string, eventStartDate?: string): Promise<TourEvent[]> {
    const codes = REGION_CODES[regionCode];
    if (!codes) return [];

    const today = new Date();
    const defaultStartDate = `${today.getFullYear()}0101`;

    const params: Record<string, string | number> = {
      areaCode: codes.areaCode,
      numOfRows: 20,
      pageNo: 1,
      arrange: 'A',
      eventStartDate: eventStartDate || defaultStartDate,
    };

    if (codes.sigunguCode > 0) {
      params.sigunguCode = codes.sigunguCode;
    }

    return this.fetchApi<TourEvent>('searchFestival2', params);
  }

  /**
   * 시도 전체 축제 조회 (sigunguCode 없이)
   * 전남 전체, 광주 전체 등
   */
  async getSidoFestivals(areaCode: number, eventStartDate?: string): Promise<TourEvent[]> {
    const today = new Date();
    const defaultStartDate = `${today.getFullYear()}0101`;

    const params: Record<string, string | number> = {
      areaCode,
      numOfRows: 30,
      pageNo: 1,
      arrange: 'A',
      eventStartDate: eventStartDate || defaultStartDate,
    };

    return this.fetchApi<TourEvent>('searchFestival2', params);
  }

  /**
   * 상세정보 조회
   */
  async getDetailInfo(contentId: string, contentTypeId: number): Promise<TourSpot | null> {
    const items = await this.fetchApi<TourSpot>('detailCommon2', {
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
 * TourSpot → DB용 Place 변환 (KorService2 필드명: 소문자, addr1)
 */
export function tourSpotToPlace(spot: TourSpot, regionCode: string, category: string) {
  return {
    name: spot.title,
    description: spot.overview || '',
    category,
    address: spot.addr1 || '주소 미등록',  // KorService2: addr1, null 방지
    phone: spot.tel || null,
    thumbnail_url: spot.firstimage || spot.firstimage2 || null,  // KorService2: 소문자
    lat: spot.mapy ? parseFloat(spot.mapy) : null,  // KorService2: mapy (소문자)
    lng: spot.mapx ? parseFloat(spot.mapx) : null,  // KorService2: mapx (소문자)
    region: regionCode,
    sigungu_code: regionCode,
    is_featured: false,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * TourEvent → DB용 Event 변환 (KorService2 필드명: 소문자, addr1)
 */
export function tourEventToEvent(event: TourEvent, regionCode: string) {
  // 시도 코드 결정 (전남 지역은 jeonnam, 광주는 gwangju)
  const sidoCode = regionCode === 'gwangju' ? 'gwangju' : 'jeonnam';

  return {
    title: event.title,
    description: '',
    start_date: formatDateString(event.eventstartdate),  // KorService2: 소문자
    end_date: formatDateString(event.eventenddate),      // KorService2: 소문자
    location: event.addr1 || '장소 미등록',              // KorService2: addr1
    image_url: event.firstimage || null,                 // KorService2: 소문자
    phone: event.tel || null,
    sido_code: sidoCode,
    region: regionCode,
    sigungu_code: regionCode,
    category: 'festival',
    status: 'published',
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

/**
 * 기상청 날씨 API 연동 라이브러리
 * - 단기예보, 초단기실황 조회
 * - API: https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0
 *
 * 나주시 격자 좌표: nx=54, ny=76
 */

// 지역별 격자 좌표 매핑 (기상청 격자 좌표)
export const WEATHER_GRID: Record<string, { nx: number; ny: number; name: string }> = {
  naju: { nx: 54, ny: 76, name: '나주시' },
  jindo: { nx: 43, ny: 65, name: '진도군' },
  gwangju: { nx: 58, ny: 74, name: '광주광역시' },
  mokpo: { nx: 50, ny: 67, name: '목포시' },
  suncheon: { nx: 70, ny: 70, name: '순천시' },
  yeosu: { nx: 73, ny: 66, name: '여수시' },
  seoul: { nx: 60, ny: 127, name: '서울특별시' },
  busan: { nx: 98, ny: 76, name: '부산광역시' },
  daegu: { nx: 89, ny: 90, name: '대구광역시' },
  incheon: { nx: 55, ny: 124, name: '인천광역시' },
  daejeon: { nx: 67, ny: 100, name: '대전광역시' },
  ulsan: { nx: 102, ny: 84, name: '울산광역시' },
  sejong: { nx: 66, ny: 103, name: '세종특별자치시' },
  jeju: { nx: 52, ny: 38, name: '제주특별자치도' },
};

// 하늘상태 코드
export const SKY_CODE: Record<string, string> = {
  '1': '맑음',
  '3': '구름많음',
  '4': '흐림',
};

// 강수형태 코드
export const PTY_CODE: Record<string, string> = {
  '0': '없음',
  '1': '비',
  '2': '비/눈',
  '3': '눈',
  '4': '소나기',
  '5': '빗방울',
  '6': '빗방울눈날림',
  '7': '눈날림',
};

// 날씨 아이콘 매핑
export function getWeatherIcon(sky: string, pty: string): string {
  // 강수가 있으면 강수 아이콘
  if (pty !== '0') {
    switch (pty) {
      case '1':
      case '4':
      case '5':
        return '🌧️'; // 비
      case '2':
      case '6':
        return '🌨️'; // 비/눈
      case '3':
      case '7':
        return '❄️'; // 눈
      default:
        return '🌧️';
    }
  }

  // 하늘 상태에 따른 아이콘
  switch (sky) {
    case '1':
      return '☀️'; // 맑음
    case '3':
      return '⛅'; // 구름많음
    case '4':
      return '☁️'; // 흐림
    default:
      return '☀️';
  }
}

// 날씨 설명 텍스트
export function getWeatherDescription(sky: string, pty: string): string {
  if (pty !== '0') {
    return PTY_CODE[pty] || '강수';
  }
  return SKY_CODE[sky] || '맑음';
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  sky: string;
  pty: string;
  icon: string;
  description: string;
  windSpeed: number;
  windDirection: string;
  precipitation: string;
  forecastTime: string;
  baseDate: string;
  baseTime: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  icon: string;
  description: string;
  precipitation: string;
}

export interface WeatherApiConfig {
  serviceKey: string;
  baseUrl?: string;
}

interface WeatherApiItem {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
  baseDate: string;
  baseTime: string;
}

interface WeatherApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body?: {
      items?: {
        item: WeatherApiItem[];
      };
    };
  };
}

/**
 * 기상청 날씨 API 클라이언트
 */
export class WeatherApiClient {
  private serviceKey: string;
  private baseUrl: string;

  constructor(config: WeatherApiConfig) {
    this.serviceKey = config.serviceKey;
    this.baseUrl = config.baseUrl || 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
  }

  /**
   * API 기본 호출
   */
  private async fetchApi(endpoint: string, params: Record<string, string | number>): Promise<WeatherApiItem[]> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    url.searchParams.append('serviceKey', this.serviceKey);
    url.searchParams.append('dataType', 'JSON');
    url.searchParams.append('numOfRows', '1000');
    url.searchParams.append('pageNo', '1');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherApiResponse = await response.json();

      if (data.response.header.resultCode !== '00') {
        throw new Error(`Weather API error: ${data.response.header.resultMsg}`);
      }

      return data.response.body?.items?.item || [];
    } catch (error) {
      console.error(`Weather API fetch error (${endpoint}):`, error);
      return [];
    }
  }

  /**
   * 단기예보 조회용 base_time 계산
   * 단기예보 발표시각: 02, 05, 08, 11, 14, 17, 20, 23시
   */
  private getBaseDateTime(): { baseDate: string; baseTime: string } {
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);

    const hours = kstDate.getUTCHours();
    const minutes = kstDate.getUTCMinutes();

    // 발표 시각 배열 (최신 발표시각부터)
    const baseTimes = [23, 20, 17, 14, 11, 8, 5, 2];

    // 현재 시각에서 가장 최근 발표 시각 찾기
    // API 발표 후 약 10분 후에 데이터가 준비됨
    let baseHour = 2;
    const currentMinutes = hours * 60 + minutes;

    for (const bt of baseTimes) {
      // 발표 후 10분 여유
      if (currentMinutes >= bt * 60 + 10) {
        baseHour = bt;
        break;
      }
    }

    // 만약 현재 시각이 02:10 이전이면 전날 23시 기준
    let baseDate = kstDate.toISOString().slice(0, 10).replace(/-/g, '');
    if (currentMinutes < 2 * 60 + 10) {
      const yesterday = new Date(kstDate.getTime() - 24 * 60 * 60 * 1000);
      baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
      baseHour = 23;
    }

    return {
      baseDate,
      baseTime: String(baseHour).padStart(2, '0') + '00',
    };
  }

  /**
   * 단기예보 조회
   */
  async getShortTermForecast(regionCode: string): Promise<WeatherData | null> {
    const grid = WEATHER_GRID[regionCode];
    if (!grid) {
      console.error(`Unknown region code: ${regionCode}`);
      return null;
    }

    const { baseDate, baseTime } = this.getBaseDateTime();

    const items = await this.fetchApi('getVilageFcst', {
      base_date: baseDate,
      base_time: baseTime,
      nx: grid.nx,
      ny: grid.ny,
    });

    if (items.length === 0) {
      return null;
    }

    // 가장 가까운 예보 시간대 데이터 추출
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentHour = String(kstDate.getUTCHours()).padStart(2, '0') + '00';
    const currentDate = kstDate.toISOString().slice(0, 10).replace(/-/g, '');

    // 현재 시간대 또는 다음 예보 시간대 찾기
    const weatherMap: Record<string, string> = {};
    let targetTime = currentHour;
    let targetDate = currentDate;

    for (const item of items) {
      const key = `${item.fcstDate}_${item.fcstTime}_${item.category}`;

      // 현재 시간 이후의 가장 가까운 예보 찾기
      if (item.fcstDate >= currentDate) {
        if (item.fcstDate === currentDate && item.fcstTime >= currentHour) {
          targetTime = item.fcstTime;
          targetDate = item.fcstDate;
        } else if (item.fcstDate > currentDate && !weatherMap[`${item.fcstDate}_${item.fcstTime}_TMP`]) {
          targetTime = item.fcstTime;
          targetDate = item.fcstDate;
        }
      }

      weatherMap[key] = item.fcstValue;
    }

    // 데이터 추출
    const prefix = `${targetDate}_${targetTime}_`;
    const tmp = weatherMap[prefix + 'TMP'] || weatherMap[prefix + 'T1H'] || '0';
    const sky = weatherMap[prefix + 'SKY'] || '1';
    const pty = weatherMap[prefix + 'PTY'] || '0';
    const reh = weatherMap[prefix + 'REH'] || '0';
    const wsd = weatherMap[prefix + 'WSD'] || '0';
    const vec = weatherMap[prefix + 'VEC'] || '0';
    const pcp = weatherMap[prefix + 'PCP'] || '강수없음';

    return {
      temperature: parseInt(tmp, 10),
      humidity: parseInt(reh, 10),
      sky,
      pty,
      icon: getWeatherIcon(sky, pty),
      description: getWeatherDescription(sky, pty),
      windSpeed: parseFloat(wsd),
      windDirection: this.getWindDirection(parseInt(vec, 10)),
      precipitation: pcp,
      forecastTime: `${targetTime.slice(0, 2)}:00`,
      baseDate,
      baseTime,
    };
  }

  /**
   * 시간별 예보 조회
   */
  async getHourlyForecast(regionCode: string, hours: number = 12): Promise<HourlyForecast[]> {
    const grid = WEATHER_GRID[regionCode];
    if (!grid) return [];

    const { baseDate, baseTime } = this.getBaseDateTime();

    const items = await this.fetchApi('getVilageFcst', {
      base_date: baseDate,
      base_time: baseTime,
      nx: grid.nx,
      ny: grid.ny,
    });

    if (items.length === 0) return [];

    // 시간대별로 데이터 그룹화
    const forecastMap: Record<string, Record<string, string>> = {};

    for (const item of items) {
      const key = `${item.fcstDate}_${item.fcstTime}`;
      if (!forecastMap[key]) {
        forecastMap[key] = { date: item.fcstDate, time: item.fcstTime };
      }
      forecastMap[key][item.category] = item.fcstValue;
    }

    // 현재 시간 이후 데이터만 추출
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentDate = kstDate.toISOString().slice(0, 10).replace(/-/g, '');
    const currentHour = kstDate.getUTCHours();

    const forecasts: HourlyForecast[] = [];

    for (const [key, data] of Object.entries(forecastMap)) {
      if (forecasts.length >= hours) break;

      const fcstDate = data.date;
      const fcstTime = data.time;
      const fcstHour = parseInt(fcstTime.slice(0, 2), 10);

      // 현재 시간 이후만
      if (fcstDate > currentDate || (fcstDate === currentDate && fcstHour >= currentHour)) {
        const sky = data['SKY'] || '1';
        const pty = data['PTY'] || '0';
        const tmp = data['TMP'] || '0';
        const pcp = data['PCP'] || '강수없음';

        forecasts.push({
          time: `${fcstTime.slice(0, 2)}:00`,
          temperature: parseInt(tmp, 10),
          icon: getWeatherIcon(sky, pty),
          description: getWeatherDescription(sky, pty),
          precipitation: pcp,
        });
      }
    }

    return forecasts.slice(0, hours);
  }

  /**
   * 풍향 코드 → 방향 텍스트 변환
   */
  private getWindDirection(vec: number): string {
    const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
    const index = Math.round((vec % 360) / 45) % 8;
    return directions[index];
  }
}

/**
 * WeatherAPI 클라이언트 싱글톤 인스턴스
 */
let weatherApiClient: WeatherApiClient | null = null;

export function getWeatherApiClient(): WeatherApiClient | null {
  const serviceKey = process.env.WEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY;

  if (!serviceKey) {
    console.warn('WEATHER_API_KEY is not configured');
    return null;
  }

  if (!weatherApiClient) {
    weatherApiClient = new WeatherApiClient({ serviceKey });
  }

  return weatherApiClient;
}

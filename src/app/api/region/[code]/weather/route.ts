import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
}

// 지역 코드 → 시/도 매핑
const REGION_SIDO_MAP: Record<string, string> = {
  // 전남
  naju: 'jeonnam',
  jindo: 'jeonnam',
  mokpo: 'jeonnam',
  yeosu: 'jeonnam',
  suncheon: 'jeonnam',
  gwangyang: 'jeonnam',
  // 광주
  gwangju: 'gwangju',
  // 기타 지역 추가 가능
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { code } = await params;
    const sidoCode = REGION_SIDO_MAP[code] || 'jeonnam';
    const regionKey = `${sidoCode}_${code}`;

    // 캐시에서 날씨 데이터 조회
    const { data: cached, error: cacheError } = await supabaseAdmin
      .from('weather_cache')
      .select('*')
      .eq('region_key', regionKey)
      .single();

    // 캐시가 있고 만료되지 않았으면 반환
    if (cached && !cacheError) {
      const expiresAt = new Date(cached.expires_at);
      if (expiresAt > new Date()) {
        return NextResponse.json({
          weather: formatWeatherResponse(cached),
          cached: true,
          expiresAt: cached.expires_at,
        });
      }
    }

    // 캐시가 없거나 만료된 경우 - 샘플 데이터 반환 (실제 API 연동 전)
    const sampleWeather = getSampleWeather(code);

    // 캐시 저장 (3시간)
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    await supabaseAdmin
      .from('weather_cache')
      .upsert({
        region_key: regionKey,
        sido_code: sidoCode,
        sigungu_code: code,
        ...sampleWeather,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'region_key',
      });

    return NextResponse.json({
      weather: formatWeatherResponse(sampleWeather),
      cached: false,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatWeatherResponse(data: Record<string, unknown>) {
  return {
    current: {
      temp: data.current_temp,
      feelsLike: data.feels_like,
      humidity: data.humidity,
      windSpeed: data.wind_speed,
      weatherCode: data.weather_code,
      weatherDesc: data.weather_desc,
      weatherIcon: data.weather_icon,
    },
    daily: {
      tempMin: data.temp_min,
      tempMax: data.temp_max,
      sunrise: data.sunrise,
      sunset: data.sunset,
    },
    airQuality: {
      pm10: data.pm10,
      pm25: data.pm25,
      grade: data.air_quality,
    },
    forecast: {
      hourly: data.hourly_forecast,
      daily: data.daily_forecast,
    },
  };
}

function getSampleWeather(code: string) {
  // 지역별 약간씩 다른 샘플 데이터
  const baseTemp = code === 'jindo' ? 3 : code === 'naju' ? 2 : code === 'gwangju' ? 2 : 1;

  return {
    current_temp: baseTemp,
    feels_like: baseTemp - 2,
    humidity: 65,
    wind_speed: 2.5,
    weather_code: 'clear',
    weather_desc: '맑음',
    weather_icon: '01d',
    temp_min: baseTemp - 3,
    temp_max: baseTemp + 5,
    sunrise: '07:42',
    sunset: '17:48',
    pm10: 35,
    pm25: 18,
    air_quality: '좋음',
    hourly_forecast: [
      { time: '09:00', temp: baseTemp, icon: '01d' },
      { time: '12:00', temp: baseTemp + 3, icon: '01d' },
      { time: '15:00', temp: baseTemp + 5, icon: '01d' },
      { time: '18:00', temp: baseTemp + 2, icon: '01n' },
      { time: '21:00', temp: baseTemp, icon: '01n' },
    ],
    daily_forecast: [
      { date: '오늘', tempMin: baseTemp - 3, tempMax: baseTemp + 5, icon: '01d' },
      { date: '내일', tempMin: baseTemp - 2, tempMax: baseTemp + 6, icon: '02d' },
      { date: '모레', tempMin: baseTemp - 1, tempMax: baseTemp + 4, icon: '03d' },
    ],
    api_source: 'sample',
  };
}

'use client';

import WeatherWidget from '@/components/region/WeatherWidget';
import type { WeatherData } from '@/types/region';

interface WeatherWidgetWrapperProps {
  regionName: string;
  weather: WeatherData | null;
}

/**
 * 날씨 위젯 래퍼
 * 서버에서 받은 데이터를 클라이언트 컴포넌트에 전달
 */
export default function WeatherWidgetWrapper({ regionName, weather }: WeatherWidgetWrapperProps) {
  return (
    <WeatherWidget
      regionName={regionName}
      weather={weather}
      isLoading={false}
    />
  );
}

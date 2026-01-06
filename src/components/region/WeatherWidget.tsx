'use client';

import { MapPin, Sun, Cloud, CloudRain, Moon, Wind, Droplets } from 'lucide-react';
import type { WeatherData } from '@/types/region';

interface WeatherWidgetProps {
  regionName: string;
  weather: WeatherData | null;
  isLoading?: boolean;
}

// Weather icon mapping
function WeatherIcon({ type, className }: { type: string; className?: string }) {
  const iconType = type.includes('01') ? 'sunny'
    : type.includes('02') || type.includes('03') || type.includes('04') ? 'cloudy'
    : type.includes('09') || type.includes('10') || type.includes('11') ? 'rain'
    : type.includes('night') || type.includes('n') ? 'night'
    : 'sunny';

  switch (iconType) {
    case 'sunny': return <Sun className={className} />;
    case 'cloudy': return <Cloud className={className} />;
    case 'rain': return <CloudRain className={className} />;
    case 'night': return <Moon className={className} />;
    default: return <Sun className={className} />;
  }
}

// Default hourly weather for fallback
const DEFAULT_HOURLY = [
  { time: '14:00', icon: 'sunny', temp: 24 },
  { time: '15:00', icon: 'cloudy', temp: 23 },
  { time: '16:00', icon: 'cloudy', temp: 22 },
  { time: '17:00', icon: 'rain', temp: 21 },
  { time: '18:00', icon: 'night', temp: 20 },
];

/**
 * 날씨 위젯 컴포넌트
 * 클라이언트 컴포넌트 - 동적 업데이트 지원
 */
export default function WeatherWidget({ regionName, weather, isLoading }: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <section className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 p-5 shadow-lg shadow-blue-500/20 text-white animate-pulse">
          <div className="h-4 bg-white/20 rounded w-40 mb-2" />
          <div className="h-8 bg-white/20 rounded w-32 mb-2" />
          <div className="h-4 bg-white/20 rounded w-56" />
        </div>
      </section>
    );
  }

  const hasWeather = weather && weather.current;
  const hourlyData = weather?.forecast?.hourly || DEFAULT_HOURLY;

  return (
    <section className="p-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 p-5 shadow-lg shadow-blue-500/20 text-white">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Sun className="w-20 h-20" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium opacity-90">{regionName}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {hasWeather ? (
                <>{weather.current.weatherDesc} {weather.current.temp}°C</>
              ) : (
                <>맑음 24°C</>
              )}
            </h2>
            <p className="text-sm font-medium opacity-90 flex items-center gap-2 flex-wrap">
              {hasWeather ? (
                <>
                  <span>미세먼지 <span className="font-bold">{weather.airQuality.grade}</span></span>
                  <span className="w-1 h-1 bg-white rounded-full" />
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> {weather.current.humidity}%
                  </span>
                  <span className="w-1 h-1 bg-white rounded-full" />
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3" /> {weather.current.windSpeed}m/s
                  </span>
                </>
              ) : (
                <>
                  <span>미세먼지 <span className="font-bold">좋음</span></span>
                  <span className="w-1 h-1 bg-white rounded-full" />
                  <span>습도 45%</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto hide-scrollbar text-center text-xs opacity-90">
          {hourlyData.map((hour) => (
            <div key={hour.time} className="flex flex-col items-center gap-1 min-w-[3rem]">
              <span>{hour.time}</span>
              <WeatherIcon type={hour.icon} className="w-5 h-5" />
              <span>{hour.temp}°</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

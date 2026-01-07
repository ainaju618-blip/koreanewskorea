'use client';

import React from 'react';

interface WeatherData {
  location: string;
  district: string;
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  airQuality: '좋음' | '보통' | '나쁨' | '매우나쁨';
  icon?: 'sunny' | 'partly_cloudy_day' | 'cloudy' | 'rainy' | 'snowy' | 'thunderstorm';
}

interface WeatherWidgetProps {
  data?: WeatherData;
  className?: string;
}

const defaultWeatherData: WeatherData = {
  location: '서울',
  district: '마포구',
  condition: '맑음',
  temperature: 18,
  humidity: 45,
  windSpeed: 2,
  airQuality: '좋음',
  icon: 'sunny',
};

const iconMap: Record<string, string> = {
  sunny: 'sunny',
  partly_cloudy_day: 'partly_cloudy_day',
  cloudy: 'cloud',
  rainy: 'rainy',
  snowy: 'ac_unit',
  thunderstorm: 'thunderstorm',
};

const airQualityColor: Record<string, string> = {
  좋음: 'text-green-200',
  보통: 'text-yellow-200',
  나쁨: 'text-orange-200',
  매우나쁨: 'text-red-200',
};

export default function WeatherWidget({
  data = defaultWeatherData,
  className = '',
}: WeatherWidgetProps) {
  const { location, district, condition, temperature, humidity, windSpeed, airQuality, icon } = data;

  return (
    <div
      className={`bg-gradient-to-br from-[#4facfe] to-[#00f2fe] dark:from-[#2d6a9f] dark:to-[#0099a8] text-white p-6 rounded-2xl shadow-md ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-lg">
            {location} {district}
          </h4>
          <p className="text-sm opacity-90">{condition}</p>
        </div>
        <span className="material-symbols-outlined text-4xl">
          {iconMap[icon || 'sunny']}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-4">
        <span className="text-5xl font-bold">{temperature}°</span>
        <span className="mb-1 text-lg opacity-90">C</span>
      </div>
      <div className="flex justify-between text-sm opacity-90 border-t border-white/30 pt-3">
        <div className="flex flex-col items-center">
          <span>습도</span>
          <span className="font-bold">{humidity}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span>풍속</span>
          <span className="font-bold">{windSpeed}m/s</span>
        </div>
        <div className="flex flex-col items-center">
          <span>미세먼지</span>
          <span className={`font-bold ${airQualityColor[airQuality]}`}>{airQuality}</span>
        </div>
      </div>
    </div>
  );
}

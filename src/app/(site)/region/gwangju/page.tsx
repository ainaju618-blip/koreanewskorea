'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Sun, Cloud, CloudRain, Moon,
  Megaphone, Map, Navigation, UtensilsCrossed,
  BookOpen, Landmark, ChevronRight,
  Star, PlusCircle, Loader2, Wind, Droplets, Quote
} from 'lucide-react';
import { SIDO_SLOGANS } from '@/lib/slogans';

// 뉴스 데이터 타입
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  category: string;
  source: string;
  publishedAt: string;
  viewCount: number;
}

// 날씨 데이터 타입
interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherDesc: string;
  };
  daily: {
    tempMin: number;
    tempMax: number;
  };
  airQuality: {
    pm10: number;
    pm25: number;
    grade: string;
  };
  forecast: {
    hourly: { time: string; temp: number; icon: string }[];
  };
}

// 행사 데이터 타입
interface EventData {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  category: string;
}

// 장소 데이터 타입
interface PlaceData {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  category: string;
  rating: number;
  naverMapUrl: string | null;
  kakaoMapUrl: string | null;
}

// 날씨 아이콘 매핑
const WeatherIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'sunny': return <Sun className={className} />;
    case 'cloudy': return <Cloud className={className} />;
    case 'rain': return <CloudRain className={className} />;
    case 'night': return <Moon className={className} />;
    default: return <Sun className={className} />;
  }
};

// 시간별 날씨 데이터
const HOURLY_WEATHER = [
  { time: '14:00', icon: 'sunny', temp: 25 },
  { time: '15:00', icon: 'sunny', temp: 24 },
  { time: '16:00', icon: 'cloudy', temp: 23 },
  { time: '17:00', icon: 'cloudy', temp: 22 },
  { time: '18:00', icon: 'night', temp: 20 },
];

// 주요 소식 데이터
const MAIN_NEWS = [
  {
    id: 1,
    category: '광주시정',
    emoji: '🏛️',
    categoryColor: 'bg-purple-100 text-purple-600',
    title: '광주광역시, 2026 AI·미래차 허브도시 비전 발표',
    time: '2시간 전',
    source: '광주시청',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop',
  },
  {
    id: 2,
    category: '광주문화',
    emoji: '🎭',
    categoryColor: 'bg-purple-100 text-purple-600',
    title: '국립아시아문화전당, 설 맞이 특별 문화행사 개최',
    time: '4시간 전',
    source: 'ACC',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=200&h=200&fit=crop',
  },
  {
    id: 3,
    category: '광주경제',
    emoji: '💼',
    categoryColor: 'bg-purple-100 text-purple-600',
    title: '광주형 일자리, 전기차 협력업체 추가 모집 시작',
    time: '어제',
    source: '광주경제통상진흥원',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=200&h=200&fit=crop',
  },
];

// 여행 명소 데이터
const TRAVEL_SPOTS = [
  {
    id: 1,
    name: '무등산 국립공원',
    category: '자연명소',
    rating: 4.9,
    description: '광주의 상징, 무등산. 주상절리와 아름다운 등산로로 사계절 내내 사랑받는 명산입니다.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: '국립아시아문화전당',
    category: '문화시설',
    rating: 4.7,
    description: '아시아 문화를 한눈에. 전시, 공연, 체험을 즐길 수 있는 복합문화공간입니다.',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop',
  },
];

// 맛집 데이터
const FOOD_SPOTS = [
  {
    id: 1,
    name: '무등산보리밥',
    location: '충장로',
    category: '한식',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=200&h=200&fit=crop',
  },
  {
    id: 2,
    name: '송정떡갈비',
    location: '송정동',
    category: '한식',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop',
  },
  {
    id: 3,
    name: '양동시장 국밥',
    location: '양동',
    category: '국밥',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop',
  },
];

// 행사 데이터
const EVENTS = [
  {
    id: 1,
    month: 'JAN',
    day: 15,
    title: '광주 빛고을 겨울축제',
    location: '국립아시아문화전당',
    color: 'bg-purple-50 text-purple-500',
  },
  {
    id: 2,
    month: 'FEB',
    day: 8,
    title: '무등산 설 맞이 해맞이 행사',
    location: '무등산 정상',
    color: 'bg-blue-50 text-blue-500',
  },
  {
    id: 3,
    month: 'MAR',
    day: 1,
    title: '3.1절 기념 평화마라톤',
    location: '5.18민주광장',
    color: 'bg-red-50 text-red-500',
  },
];

// 상대 시간 포맷팅
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 카테고리별 색상 및 이모지
function getCategoryStyle(category: string): { color: string; emoji: string } {
  const styles: Record<string, { color: string; emoji: string }> = {
    '시정': { color: 'bg-purple-100 text-purple-600', emoji: '🏛️' },
    '의회': { color: 'bg-purple-100 text-purple-600', emoji: '🗳️' },
    '교육': { color: 'bg-purple-100 text-purple-600', emoji: '🏫' },
    '문화': { color: 'bg-pink-100 text-pink-600', emoji: '🎭' },
    '경제': { color: 'bg-green-100 text-green-600', emoji: '💰' },
    '사회': { color: 'bg-orange-100 text-orange-600', emoji: '👥' },
    '스포츠': { color: 'bg-blue-100 text-blue-600', emoji: '⚽' },
  };
  return styles[category] || { color: 'bg-gray-100 text-gray-600', emoji: '📰' };
}

export default function GwangjuRegionPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'news' | 'heritage'>('events');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const [hasWeatherData, setHasWeatherData] = useState(false);
  const [hasEventsData, setHasEventsData] = useState(false);
  const [hasPlacesData, setHasPlacesData] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch news, weather, events, places in parallel
        const [newsRes, weatherRes, eventsRes, placesRes] = await Promise.all([
          fetch('/api/region/gwangju/news?limit=5'),
          fetch('/api/region/gwangju/weather'),
          fetch('/api/region/gwangju/events?limit=5&upcoming=true'),
          fetch('/api/region/gwangju/places?limit=6&featured=true'),
        ]);

        // Process news
        if (newsRes.ok) {
          const data = await newsRes.json();
          if (data.articles && data.articles.length > 0) {
            setNews(data.articles);
            setHasRealData(true);
          }
        }

        // Process weather
        if (weatherRes.ok) {
          const data = await weatherRes.json();
          if (data.weather) {
            setWeather(data.weather);
            setHasWeatherData(true);
          }
        }

        // Process events
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          if (data.events && data.events.length > 0) {
            setEvents(data.events);
            setHasEventsData(true);
          }
        }

        // Process places
        if (placesRes.ok) {
          const data = await placesRes.json();
          if (data.places && data.places.length > 0) {
            setPlaces(data.places);
            setHasPlacesData(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Background Image */}
      <section className="relative text-white py-16 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/hero/gwangju-hero.png"
          alt="광주 무등산과 국립아시아문화전당 풍경"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay - 보라색/분홍 테마 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/85 to-fuchsia-500/70" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-6 h-6" />
            <span className="text-purple-200 text-sm font-medium">GWANGJU</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">광주광역시</h1>
          <p className="text-purple-100 max-w-2xl mb-4">
            빛고을 광주, 민주와 예술의 도시. 무등산의 기상과 문화예술의 중심지입니다.
          </p>
          {/* 슬로건 배지 */}
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <Quote className="w-3.5 h-3.5" />
              <span className="font-medium">{SIDO_SLOGANS.gwangju.slogan}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-purple-500/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-purple-100">
              <span>광역시 | 빛고을</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto pb-8">
        {/* Desktop: Two Column Layout */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:px-4 lg:py-6">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2">
            {/* Weather Section */}
            <section className="p-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-500 p-5 shadow-lg shadow-purple-500/20 text-white">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Sun className="w-20 h-20" />
                </div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium opacity-90">광주광역시 동구</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                      {hasWeatherData && weather ? (
                        <>{weather.current.weatherDesc} {weather.current.temp}°C</>
                      ) : (
                        <>맑음 25°C</>
                      )}
                    </h2>
                    <p className="text-sm font-medium opacity-90 flex items-center gap-2">
                      {hasWeatherData && weather ? (
                        <>
                          <span>미세먼지 <span className="font-bold">{weather.airQuality.grade}</span></span>
                          <span className="w-1 h-1 bg-white rounded-full"></span>
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" /> {weather.current.humidity}%
                          </span>
                          <span className="w-1 h-1 bg-white rounded-full"></span>
                          <span className="flex items-center gap-1">
                            <Wind className="w-3 h-3" /> {weather.current.windSpeed}m/s
                          </span>
                        </>
                      ) : (
                        <>
                          <span>미세먼지 <span className="font-bold">보통</span></span>
                          <span className="w-1 h-1 bg-white rounded-full"></span>
                          <span>습도 50%</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 overflow-x-auto hide-scrollbar text-center text-xs opacity-90">
                  {hasWeatherData && weather?.forecast?.hourly ? (
                    weather.forecast.hourly.map((hour) => (
                      <div key={hour.time} className="flex flex-col items-center gap-1 min-w-[3rem]">
                        <span>{hour.time}</span>
                        <WeatherIcon type={hour.icon.includes('01') ? 'sunny' : hour.icon.includes('02') || hour.icon.includes('03') ? 'cloudy' : 'rain'} className="w-5 h-5" />
                        <span>{hour.temp}°</span>
                      </div>
                    ))
                  ) : (
                    HOURLY_WEATHER.map((hour) => (
                      <div key={hour.time} className="flex flex-col items-center gap-1 min-w-[3rem]">
                        <span>{hour.time}</span>
                        <WeatherIcon type={hour.icon} className="w-5 h-5" />
                        <span>{hour.temp}°</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Administrative News Section */}
            <section className="px-4 mb-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-500" />
                  광주 주요 소식
                </h3>
                {hasRealData && (
                  <Link href="/region/gwangju" className="text-gray-500 text-xs font-medium hover:text-purple-500">
                    더보기 &gt;
                  </Link>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  <span className="ml-2 text-gray-500 text-sm">뉴스를 불러오는 중...</span>
                </div>
              )}

              {/* Real Data from API */}
              {!isLoading && hasRealData && (
                <div className="flex flex-col gap-3">
                  {news.map((article) => {
                    const style = getCategoryStyle(article.category);
                    return (
                      <Link
                        key={article.id}
                        href={`/news/${article.id}`}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block"
                      >
                        <div className="flex gap-4">
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-2 ${style.color}`}>
                                {style.emoji} {article.category || '광주'}
                              </span>
                              <h4 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                                {article.title}
                              </h4>
                            </div>
                            <p className="text-gray-500 text-xs mt-2">
                              {formatRelativeTime(article.publishedAt)} · {article.source || '광주시'}
                            </p>
                          </div>
                          {article.thumbnail && (
                            <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-200 overflow-hidden relative">
                              <Image
                                src={article.thumbnail}
                                alt={article.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Fallback Sample Data */}
              {!isLoading && !hasRealData && (
                <div className="flex flex-col gap-3">
                  {MAIN_NEWS.map((newsItem) => (
                    <article
                      key={newsItem.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-2 ${newsItem.categoryColor}`}>
                              {newsItem.emoji} {newsItem.category}
                            </span>
                            <h4 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                              {newsItem.title}
                            </h4>
                          </div>
                          <p className="text-gray-500 text-xs mt-2">{newsItem.time} · {newsItem.source}</p>
                        </div>
                        <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-200 overflow-hidden relative">
                          <Image
                            src={newsItem.image}
                            alt={newsItem.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                  <p className="text-center text-xs text-gray-400 mt-2">
                    * 샘플 데이터입니다. 실제 뉴스 연동 시 업데이트됩니다.
                  </p>
                </div>
              )}
            </section>

            {/* Divider */}
            <div className="h-2 bg-gray-100 my-6 lg:hidden"></div>

            {/* Travel Section */}
            <section className="mb-2">
              <div className="px-4 flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Map className="w-5 h-5 text-purple-500" />
                  광주 여행 &amp; 명소
                </h3>
                <Link href="#" className="text-gray-500 text-xs font-medium hover:text-purple-500">
                  더보기 &gt;
                </Link>
              </div>
              <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4 lg:grid lg:grid-cols-2">
                {TRAVEL_SPOTS.map((spot) => (
                  <div
                    key={spot.id}
                    className="min-w-[280px] lg:min-w-0 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 w-full relative">
                      <Image
                        src={spot.image}
                        alt={spot.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                        {spot.category}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{spot.name}</h4>
                        <div className="flex items-center text-yellow-500 text-xs font-bold gap-0.5">
                          <Star className="w-4 h-4 fill-yellow-500" />
                          {spot.rating}
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                        {spot.description}
                      </p>
                      <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <Navigation className="w-4 h-4" />
                        길찾기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1">
            {/* Divider (Mobile) */}
            <div className="h-2 bg-gray-100 my-6 lg:hidden"></div>

            {/* Food Section */}
            <section className="px-4 mb-2 lg:bg-white lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100 lg:mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-purple-500" />
                  광주의 맛
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FOOD_SPOTS.map((food) => (
                  <div
                    key={food.id}
                    className="bg-white lg:bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={food.image}
                        alt={food.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <h5 className="font-bold text-gray-900 text-sm truncate">{food.name}</h5>
                      <p className="text-gray-500 text-xs mt-1">{food.location} · {food.category}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center items-center aspect-square cursor-pointer hover:bg-gray-100 transition-colors">
                  <PlusCircle className="w-8 h-8 text-purple-500 mb-1" />
                  <span className="text-gray-500 text-xs font-bold">더보기</span>
                </div>
              </div>
            </section>

            {/* Divider (Mobile) */}
            <div className="h-2 bg-gray-100 my-6 lg:hidden"></div>

            {/* Events Section */}
            <section className="px-4 mb-8 lg:bg-white lg:rounded-xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100">
              <div className="flex items-center gap-6 mb-4 border-b border-gray-200 overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
                    activeTab === 'events'
                      ? 'border-purple-500 text-purple-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  📅 행사일정
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
                    activeTab === 'news'
                      ? 'border-purple-500 text-purple-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  📰 동네소식
                </button>
                <button
                  onClick={() => setActiveTab('heritage')}
                  className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
                    activeTab === 'heritage'
                      ? 'border-purple-500 text-purple-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🏛️ 문화유적
                </button>
              </div>

              {activeTab === 'events' && (
                <div className="flex flex-col gap-3">
                  {hasEventsData && events.length > 0 ? (
                    events.map((event) => {
                      const eventDate = new Date(event.eventDate);
                      const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      const day = eventDate.getDate();
                      const colorMap: Record<string, string> = {
                        'festival': 'bg-purple-50 text-purple-500',
                        'culture': 'bg-pink-50 text-pink-500',
                        'sports': 'bg-blue-50 text-blue-500',
                        'education': 'bg-green-50 text-green-500',
                      };
                      const color = colorMap[event.category] || 'bg-gray-50 text-gray-500';
                      return (
                        <div
                          key={event.id}
                          className="flex items-center bg-white lg:bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className={`${color} rounded-lg p-2 flex flex-col items-center justify-center w-14 shrink-0 mr-4`}>
                            <span className="text-[10px] font-bold">{month}</span>
                            <span className="text-xl font-black">{day}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-gray-900 font-bold text-sm mb-1">{event.title}</h4>
                            <p className="text-gray-500 text-xs">{event.location}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      );
                    })
                  ) : (
                    EVENTS.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center bg-white lg:bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className={`${event.color} rounded-lg p-2 flex flex-col items-center justify-center w-14 shrink-0 mr-4`}>
                          <span className="text-[10px] font-bold">{event.month}</span>
                          <span className="text-xl font-black">{event.day}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gray-900 font-bold text-sm mb-1">{event.title}</h4>
                          <p className="text-gray-500 text-xs">{event.location}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'news' && (
                <div className="py-8 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>동네소식을 준비 중입니다.</p>
                </div>
              )}

              {activeTab === 'heritage' && (
                <div className="flex flex-col gap-3">
                  {hasPlacesData && places.filter(p => p.category === 'heritage').length > 0 ? (
                    places.filter(p => p.category === 'heritage').map((place) => (
                      <div
                        key={place.id}
                        className="flex items-center bg-white lg:bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        {place.thumbnail && (
                          <div className="w-14 h-14 shrink-0 mr-4 rounded-lg overflow-hidden relative">
                            <Image src={place.thumbnail} alt={place.name} fill className="object-cover" />
                          </div>
                        )}
                        {!place.thumbnail && (
                          <div className="w-14 h-14 shrink-0 mr-4 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Landmark className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-gray-900 font-bold text-sm mb-1">{place.name}</h4>
                          <p className="text-gray-500 text-xs line-clamp-1">{place.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          {place.rating}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <Landmark className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>문화유적 정보를 준비 중입니다.</p>
                    </div>
                  )}
                </div>
              )}

              <button className="w-full mt-4 py-3 text-gray-500 text-sm font-medium bg-gray-50 lg:bg-gray-100 rounded-lg hover:bg-gray-100 lg:hover:bg-gray-200 transition-colors">
                전체 일정 보기
              </button>
            </section>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

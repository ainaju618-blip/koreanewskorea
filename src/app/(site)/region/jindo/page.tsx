'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Sun, Cloud, CloudRain, Moon,
  Megaphone, Map, Navigation, UtensilsCrossed,
  BookOpen, Landmark, ChevronRight,
  Star, PlusCircle, Waves, Dog, Music, Loader2,
  Wind, Droplets, Quote
} from 'lucide-react';
import { JEONNAM_SLOGANS, SIDO_SLOGANS } from '@/lib/slogans';

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
  { time: '14:00', icon: 'sunny', temp: 18 },
  { time: '15:00', icon: 'cloudy', temp: 17 },
  { time: '16:00', icon: 'cloudy', temp: 16 },
  { time: '17:00', icon: 'cloudy', temp: 15 },
  { time: '18:00', icon: 'night', temp: 14 },
];

// 주요 소식 데이터
const MAIN_NEWS = [
  {
    id: 1,
    category: '진도군정',
    emoji: '🏛️',
    categoryColor: 'bg-teal-100 text-teal-600',
    title: '2026 진도 신비의 바닷길 축제, 역대 최대 규모로 개최 예정',
    time: '2시간 전',
    source: '진도군청',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbbcX6G2cK3kZ-BGkbSCcZ32IeSqo9I0bS_BJ23xkLj13fTC5kgn8JMB_t-VJuKvxxXejC37tzzllML7okZ_08elHlwa6Mk3vpDNHM2NfXCCfAHrjiVFFjT6CcC2VSMDRo84bl8cXickZPwigSbfPBls7OrqsLgAq0qsPmm4kXGHBvwE4UQlQn2zGN-ASaQ5CTw-EOBjZLg9mVcn3JK3VXuhjSjmpB17JZ0FXUIc73XfQGe8FBgKpr4cTmYvGeiuQka0ivXm2W_OCj',
  },
  {
    id: 2,
    category: '진도문화',
    emoji: '🎶',
    categoryColor: 'bg-teal-100 text-teal-600',
    title: '진도아리랑 유네스코 등재 추진, 국제학술대회 개최',
    time: '5시간 전',
    source: '문화관광과',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJqgIjiTxPXdygoCTsz4tr1ZRVROC_ulipdEtpWynt3t_RUY0msuC2s9nm1DGla6Oc0Eb_4CV6EBJWtQLALUX8E8rpuxH7myRoJ-Sb2Q6qT0x5r7tlkMAxgZj9jDrDnwbW-Ht97wI4BT8Cwj-aee1ba7DFjFA-t42n7mwoX6UhFiZx71dBxnrxTM_VZHU6u7hDZbANSTZd9E_DVJ2D7woEf33g3Vu9ey7JI_lmXeyk9NdUb1OA5esjxXpyVREXTje8_dsXqwjmNUgd',
  },
  {
    id: 3,
    category: '진도농업',
    emoji: '🌾',
    categoryColor: 'bg-teal-100 text-teal-600',
    title: '진도 대파·구기자 수출 역대 최고 기록, 일본·동남아 시장 확대',
    time: '어제',
    source: '농업기술센터',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDULIV9e7RvbEFZUpplSHb2FqUz0vOCeifIdkXsKhS7eZ1xEMKHxO1uqfFzvkbq4MouEYIrhcpljDpIPKxYur8jVoWTZZJZz5gE3OpncOEq1KAoFivJHdR9AL3xDpMWoRsaD92AFGjUqwvykSUtaaWicEOI-c82PdULVpGGVNJPY4wUrnEDAQO0RrFQVYCJn2C-vh2wdzYnsxrZ22x2R8WsDc-4SWXu9G82ZcEgJSbL-1sIjEKmCOvJDpU1w-DOBjOGhCDIKY35C1Is',
  },
];

// 여행 명소 데이터
const TRAVEL_SPOTS = [
  {
    id: 1,
    name: '신비의 바닷길',
    category: '자연경관',
    rating: 4.9,
    description: '모세의 기적이라 불리는 진도의 대표 관광지. 매년 봄, 바다가 갈라지는 장관을 볼 수 있습니다.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhFQ6wIf78kuUUkFMyVHvmkqVIJy33_7ipKnosGPsLrTeBPVHEZXPI1DEf11ATErMjIgTanGIojtRfncSLQFibcadV0ww8P9cbTbvnNn-VaqkVUSPtMCGHM2xNOdQuM4SQzM-9c3nDgMIspAs0rXRXOEEoQfzqpDrjImgv5C3dRgD-LHTFHcgqQmN-xKaHIwR0xposYV1pSjWPwpwcj3xbULuXABD41PsaY83nf5QZO2c4HDo_CN4hHqiDWk_bGYIdrTmiJtdTOgKO',
  },
  {
    id: 2,
    name: '운림산방',
    category: '역사유적',
    rating: 4.7,
    description: '조선 후기 남종화의 대가 허련이 말년을 보낸 곳. 아름다운 연못과 정원이 어우러진 명소입니다.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0dZnKfSx_FIc5y55WHb9LDByD-L2hc9Tw6uVGF_PqZgcIRjW3uL7OtQFbV2vt1_Xl0PiS8sLNWhtaZPYgXDdqd3Lbyhh9k6jV3XHfa0aPtp9uuib0yZIuNkeMwmXxlQw3LX90mCWQBimdisNaDTD0FPiyhXcXNqy0PH1feJnUXRkVL9NhL1h-kr4PpuTCqZ86ZpLW481RfCIP9UOkzeoQT18LWO-u-O8vwj2T7Tzr0H8sZ-c7WHiU9NOat1TocfIo93t9pOF2GHQi',
  },
  {
    id: 3,
    name: '진도개 테마파크',
    category: '체험관광',
    rating: 4.5,
    description: '천연기념물 진도개를 만나볼 수 있는 테마파크. 진도개 공연과 체험 프로그램이 준비되어 있습니다.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWtgI8ccCTyCGYXksTUGB8Zt6i26R99e3kyNkI0EWYV2qgE87eZTB8MjX8Z9d72ttmtLqOIaaL7D-mP4QRK-dJ26IdHgmaj_AChtM5WiOQsSwU7HRSt3BaUXTm49AxRRCyFEQPDeh0B47sRtIfpdMfvycBPJa2M7JOJdPRXVejx-6ja9xLnZk7qTEfGNcei9Hw9ms4Tx8aKwp8cvI9s0WIX4qAuwh9GVYVT5yXg-r58Qw4s3Oq-2Tx1UVfqDzaeL0r_KLoLdjlxE9C',
  },
];

// 맛집 데이터
const FOOD_SPOTS = [
  {
    id: 1,
    name: '진도 흑염소탕',
    location: '진도읍',
    category: '보양식',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvHdQdcQx-5jvN4xNJ1vQ4t0Met4osDEilNIT9y5ucqkXmVOsnDRZPWNLPGeoxR9gtPKbBNyOBNXe5_kxd--4fbginVVMexRFgv_Vj7keXGTQa55QE3CICPKKwUi8LzLY0dTx3YnqCUJnuUv5vIWSX8gbqEoxAVjJ6_ZADX-qY4Chatdxf4Altm7tIugZKqNfUoFBfu1VTUTBAgCZFE8BnYHVgZbkCWET41yGfwgJRX6FoaKtTu4qEj77DoqITtgMKmlGFtwAQW9qo',
  },
  {
    id: 2,
    name: '해녀의집 해물탕',
    location: '의신면',
    category: '해산물',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSdRJZtJzU1hqqjIIQV7RL5QpfFbACiOaT0zla67WBUbk311Ja1lON--CNVrL1MvGvItuNtX-ORO7Zd0rzHjXEEi7maSK8o1O9xqDfaaAViHqNL_-oAQ7P9m-Y7clDZ08l6lqzijhAvxjVgMIuZSfmqbjJy-7lx2LONpRwq4C9tiT0MdAV7dn0fS044G7rsohWjCsg1HETaDSArBxkpLLdtFscsu9TmzxhlWnDVkVJgEBiinq1wEOpvecnJfS7YqVOQ7S9xw5Vxmqe',
  },
  {
    id: 3,
    name: '진도 홍주 양조장',
    location: '진도읍',
    category: '특산물',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbbcX6G2cK3kZ-BGkbSCcZ32IeSqo9I0bS_BJ23xkLj13fTC5kgn8JMB_t-VJuKvxxXejC37tzzllML7okZ_08elHlwa6Mk3vpDNHM2NfXCCfAHrjiVFFjT6CcC2VSMDRo84bl8cXickZPwigSbfPBls7OrqsLgAq0qsPmm4kXGHBvwE4UQlQn2zGN-ASaQ5CTw-EOBjZLg9mVcn3JK3VXuhjSjmpB17JZ0FXUIc73XfQGe8FBgKpr4cTmYvGeiuQka0ivXm2W_OCj',
  },
];

// 행사 데이터
const EVENTS = [
  {
    id: 1,
    month: 'APR',
    day: 15,
    title: '2026 진도 신비의 바닷길 축제',
    location: '고군면 회동리 일원',
    color: 'bg-cyan-50 text-cyan-500',
  },
  {
    id: 2,
    month: 'OCT',
    day: 10,
    title: '제45회 진도 아리랑제',
    location: '진도읍 문화예술회관',
    color: 'bg-purple-50 text-purple-500',
  },
  {
    id: 3,
    month: 'NOV',
    day: 5,
    title: '진도 홍주 담그기 체험',
    location: '진도 홍주 전통주 체험관',
    color: 'bg-red-50 text-red-500',
  },
];

// 진도 고유 콘텐츠
const JINDO_SPECIALS = [
  {
    icon: Waves,
    title: '신비의 바닷길',
    desc: '매년 음력 2월 영등날, 바다가 갈라지는 기적',
  },
  {
    icon: Dog,
    title: '진도개',
    desc: '천연기념물 제53호, 충직한 한국 토종견',
  },
  {
    icon: Music,
    title: '진도아리랑',
    desc: '한국 3대 아리랑, 무형문화재',
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
    '군정': { color: 'bg-teal-100 text-teal-600', emoji: '🏛️' },
    '문화': { color: 'bg-teal-100 text-teal-600', emoji: '🎶' },
    '농업': { color: 'bg-teal-100 text-teal-600', emoji: '🌾' },
    '관광': { color: 'bg-cyan-100 text-cyan-600', emoji: '🏖️' },
    '경제': { color: 'bg-green-100 text-green-600', emoji: '💰' },
    '사회': { color: 'bg-orange-100 text-orange-600', emoji: '👥' },
  };
  return styles[category] || { color: 'bg-gray-100 text-gray-600', emoji: '📰' };
}

export default function JindoRegionPage() {
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
          fetch('/api/region/jindo/news?limit=5'),
          fetch('/api/region/jindo/weather'),
          fetch('/api/region/jindo/events?limit=5&upcoming=true'),
          fetch('/api/region/jindo/places?limit=6&featured=true'),
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
          src="/images/hero/jindo-hero.png"
          alt="진도 신비의 바닷길과 진도개"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay - 해양 테마 */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/85 to-cyan-500/70" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-6 h-6" />
            <span className="text-teal-200 text-sm font-medium">JINDO</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">진도군</h1>
          <p className="text-teal-100 max-w-2xl mb-4">
            신비의 바닷길과 진도개의 고장, 진도아리랑이 울려 퍼지는 전통문화의 보고입니다.
          </p>
          {/* 슬로건 배지 */}
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <Quote className="w-3.5 h-3.5" />
              <span className="font-medium">{JEONNAM_SLOGANS.jindo.slogan}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-teal-600/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-teal-100">
              <span>전남 | {SIDO_SLOGANS.jeonnam.slogan}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 진도 고유 콘텐츠 배너 */}
      <section className="bg-gradient-to-r from-teal-500 to-cyan-500 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4">
            {JINDO_SPECIALS.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white">
                <item.icon className="w-8 h-8 opacity-90" />
                <div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <p className="text-xs opacity-80 hidden sm:block">{item.desc}</p>
                </div>
              </div>
            ))}
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
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 p-5 shadow-lg shadow-teal-500/20 text-white">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Sun className="w-20 h-20" />
                </div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium opacity-90">전라남도 진도군 진도읍</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                      {hasWeatherData && weather ? (
                        <>{weather.current.weatherDesc} {weather.current.temp}°C</>
                      ) : (
                        <>맑음 18°C</>
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
                          <span>해풍 <span className="font-bold">약함</span></span>
                          <span className="w-1 h-1 bg-white rounded-full"></span>
                          <span>습도 65%</span>
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
                  <Megaphone className="w-5 h-5 text-teal-500" />
                  진도 주요 소식
                </h3>
                {hasRealData && (
                  <Link href="/region/jeonnam/jindo" className="text-gray-500 text-xs font-medium hover:text-teal-500">
                    더보기 &gt;
                  </Link>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
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
                                {style.emoji} {article.category || '진도'}
                              </span>
                              <h4 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                                {article.title}
                              </h4>
                            </div>
                            <p className="text-gray-500 text-xs mt-2">
                              {formatRelativeTime(article.publishedAt)} · {article.source || '진도군'}
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
                  <Map className="w-5 h-5 text-teal-500" />
                  진도 여행 &amp; 명소
                </h3>
                <Link href="#" className="text-gray-500 text-xs font-medium hover:text-teal-500">
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
                      <button className="w-full bg-teal-50 hover:bg-teal-100 text-teal-600 text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
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
                  <UtensilsCrossed className="w-5 h-5 text-teal-500" />
                  진도의 맛
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
                  <PlusCircle className="w-8 h-8 text-teal-500 mb-1" />
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
                      ? 'border-teal-500 text-teal-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  📅 축제일정
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
                    activeTab === 'news'
                      ? 'border-teal-500 text-teal-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  📰 섬소식
                </button>
                <button
                  onClick={() => setActiveTab('heritage')}
                  className={`pb-2 border-b-2 font-medium text-base px-1 whitespace-nowrap transition-colors ${
                    activeTab === 'heritage'
                      ? 'border-teal-500 text-teal-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🏛️ 문화유산
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
                        'festival': 'bg-cyan-50 text-cyan-500',
                        'culture': 'bg-purple-50 text-purple-500',
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
                  <p>섬소식을 준비 중입니다.</p>
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
                      <p>문화유산 정보를 준비 중입니다.</p>
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

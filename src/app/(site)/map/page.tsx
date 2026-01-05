'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Map, TrendingUp, Bell, Eye, MessageCircle, Heart, MapPin, Layers, Navigation } from 'lucide-react';

// 지역 데이터
const REGIONS = [
  { id: 'seoul', name: '서울', x: 30, y: 20, size: 'lg', count: 128, trending: true },
  { id: 'gyeonggi', name: '경기', x: 55, y: 25, size: 'md', count: 85 },
  { id: 'gangwon', name: '강원', x: 75, y: 18, size: 'sm', count: 32 },
  { id: 'chungcheong', name: '충청', x: 40, y: 45, size: 'md', count: 54 },
  { id: 'gyeongsang', name: '경상', x: 70, y: 55, size: 'md', count: 76, hot: true },
  { id: 'jeolla', name: '전라', x: 30, y: 65, size: 'md', count: 48 },
  { id: 'jeju', name: '제주', x: 25, y: 90, size: 'sm', count: 41 },
];

// 인기 지역 랭킹
const RANKINGS = [
  { rank: 1, region: '서울', trend: '급상승', trendUp: true },
  { rank: 2, region: '부산', trend: '관심도 80%' },
  { rank: 3, region: '제주', trend: '여행 이슈' },
  { rank: 4, region: '경기', trend: '부동산' },
];

// 실시간 속보
const BREAKING_NEWS = [
  {
    id: '1',
    region: '서울',
    time: '방금 전',
    title: '강남대로 침수 피해 복구 작업 90% 완료, 차량 통제 해제',
    views: 1200,
    comments: 42,
    thumbnail: '/images/placeholder-news.jpg',
    isLive: true,
  },
  {
    id: '2',
    region: '부산',
    time: '5분 전',
    title: '부산국제영화제 개막식, 역대 최다 인파 몰려... 티켓 매진 행렬',
    views: 850,
    icon: 'movie',
  },
  {
    id: '3',
    region: '제주',
    time: '1시간 전',
    title: '주말 제주 항공권 특가, 여행객 급증 예상',
    views: 3500,
    likes: 120,
    thumbnail: '/images/travel/jeju.jpg',
  },
  {
    id: '4',
    region: '대구',
    time: '2시간 전',
    title: '대구 지역 스타트업 지원 정책 발표, 투자 유치 설명회 개최',
    views: 420,
    compact: true,
  },
];

function formatNumber(num: number) {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

export default function NewsMapPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>('seoul');
  const [activeTab, setActiveTab] = useState<'popular' | 'breaking'>('popular');

  const selectedRegionData = REGIONS.find(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              Interactive
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-7 h-7 text-primary" />
            대한민국 뉴스 지도
          </h1>
          <p className="text-slate-500 mt-2">
            지역을 클릭하여 실시간 이슈를 확인하세요.{' '}
            <span className="text-primary font-medium">지금 서울이 가장 뜨겁습니다!</span>
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Interactive Map */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                {/* SVG Korea Map */}
                <svg viewBox="0 0 400 500" className="w-full h-full">
                  {/* Seoul/Gyeonggi */}
                  <path
                    className={`cursor-pointer transition-all duration-300 ${selectedRegion === 'seoul' ? 'fill-primary' : 'fill-slate-200 hover:fill-primary/30'}`}
                    d="M120,80 Q160,60 200,80 T240,120 T200,160 T140,140 Z"
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => setSelectedRegion('seoul')}
                  />
                  {/* Gangwon */}
                  <path
                    className={`cursor-pointer transition-all duration-300 ${selectedRegion === 'gangwon' ? 'fill-primary' : 'fill-slate-200 hover:fill-primary/30'}`}
                    d="M200,80 Q250,60 300,90 T320,160 T240,180 T200,160 Z"
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => setSelectedRegion('gangwon')}
                  />
                  {/* Chungcheong */}
                  <path
                    className={`cursor-pointer transition-all duration-300 ${selectedRegion === 'chungcheong' ? 'fill-primary' : 'fill-slate-200 hover:fill-primary/30'}`}
                    d="M140,140 Q200,160 240,180 T220,240 T140,220 T100,180 Z"
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => setSelectedRegion('chungcheong')}
                  />
                  {/* Gyeongsang */}
                  <path
                    className={`cursor-pointer transition-all duration-300 ${selectedRegion === 'gyeongsang' ? 'fill-primary' : 'fill-slate-200 hover:fill-primary/30'}`}
                    d="M240,180 Q300,160 340,200 T320,300 T240,280 T220,240 Z"
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => setSelectedRegion('gyeongsang')}
                  />
                  {/* Jeolla */}
                  <path
                    className={`cursor-pointer transition-all duration-300 ${selectedRegion === 'jeolla' ? 'fill-primary' : 'fill-slate-200 hover:fill-primary/30'}`}
                    d="M100,180 Q140,220 220,240 T200,320 T120,340 T80,260 Z"
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => setSelectedRegion('jeolla')}
                  />
                  {/* Jeju */}
                  <path
                    className={`cursor-pointer transition-all duration-300 ${selectedRegion === 'jeju' ? 'fill-primary' : 'fill-slate-200 hover:fill-primary/30'}`}
                    d="M120,380 Q160,370 180,400 T140,430 Z"
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => setSelectedRegion('jeju')}
                  />

                  {/* Region Labels */}
                  <text x="165" y="115" className="text-xs font-bold fill-slate-700 pointer-events-none">서울</text>
                  <text x="255" y="125" className="text-xs font-bold fill-slate-700 pointer-events-none">강원</text>
                  <text x="165" y="195" className="text-xs font-bold fill-slate-700 pointer-events-none">충청</text>
                  <text x="275" y="245" className="text-xs font-bold fill-slate-700 pointer-events-none">경상</text>
                  <text x="145" y="285" className="text-xs font-bold fill-slate-700 pointer-events-none">전라</text>
                  <text x="145" y="405" className="text-xs font-bold fill-slate-700 pointer-events-none">제주</text>
                </svg>

                {/* Interactive Markers */}
                {REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      selectedRegion === region.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                    }`}
                    style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  >
                    {region.trending && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                    {region.hot && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                    <div className={`
                      rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold
                      ${region.size === 'lg' ? 'w-10 h-10 text-sm' : region.size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'}
                      ${selectedRegion === region.id ? 'bg-primary' : region.hot ? 'bg-red-500' : 'bg-slate-400'}
                    `}>
                      {region.count > 100 ? '99+' : region.count}
                    </div>
                  </button>
                ))}

                {/* Floating Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                    <Navigation className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                    <Layers className="w-5 h-5" />
                  </button>
                </div>

                {/* LIVE Indicator */}
                {selectedRegionData && (
                  <div className="absolute bottom-4 left-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-slate-500">LIVE</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedRegionData.name}: {selectedRegionData.count}건의 뉴스
                    </p>
                  </div>
                )}
              </div>

              {/* Tab Switcher */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setActiveTab('popular')}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      activeTab === 'popular'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ✨ 인기 지역
                  </button>
                  <button
                    onClick={() => setActiveTab('breaking')}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      activeTab === 'breaking'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    🔔 실시간 속보
                  </button>
                </div>
              </div>
            </div>

            {/* Rankings Section */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  인기 지역 랭킹
                </h3>
                <Link href="/category/trending" className="text-sm text-primary font-medium hover:underline">
                  전체보기
                </Link>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {RANKINGS.map((item) => (
                  <button
                    key={item.rank}
                    onClick={() => setSelectedRegion(item.region.toLowerCase())}
                    className="flex-shrink-0 flex items-center gap-3 pl-1 pr-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      item.rank === 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.rank}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-slate-900">{item.region}</span>
                      <span className={`text-[10px] ${item.trendUp ? 'text-red-500' : 'text-slate-500'}`}>
                        {item.trendUp && '▲ '}{item.trend}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* News Feed Section */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-500 animate-pulse" />
                  지역별 실시간 속보
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {BREAKING_NEWS.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.id}`}
                    className={`block p-4 hover:bg-slate-50 transition-colors ${news.compact ? '' : 'flex gap-4'}`}
                  >
                    {news.compact ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {news.region}
                          </span>
                          <span className="text-xs text-slate-400">{news.time}</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 truncate">{news.title}</h4>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              news.isLive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {news.region}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              {news.isLive && <span className="w-1 h-1 bg-red-500 rounded-full"></span>}
                              {news.time}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {news.title}
                          </h4>
                          <div className="mt-2 flex items-center gap-3">
                            {news.views && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {formatNumber(news.views)}
                              </span>
                            )}
                            {news.comments && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> {news.comments}
                              </span>
                            )}
                            {news.likes && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {news.likes}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-20 h-20 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden relative">
                          {news.thumbnail ? (
                            <Image
                              src={news.thumbnail}
                              alt={news.title}
                              fill
                              className="object-cover"
                            />
                          ) : news.icon ? (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                              <MapPin className="w-8 h-8" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100">
                <Link
                  href="/news/realtime"
                  className="block w-full py-3 rounded-lg bg-slate-100 text-center text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  더 많은 뉴스 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

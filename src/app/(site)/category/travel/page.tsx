'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Map, MapPin, Star, Navigation, Calendar, Clock, Users, Heart,
  ChevronRight, Filter, Grid, List, TrendingUp
} from 'lucide-react';

// 여행지 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체', count: 128 },
  { id: 'nature', label: '자연', count: 42 },
  { id: 'history', label: '역사', count: 35 },
  { id: 'culture', label: '문화', count: 28 },
  { id: 'activity', label: '액티비티', count: 23 },
];

// 인기 여행지
const FEATURED_DESTINATIONS = [
  {
    id: 1,
    name: '금성관',
    location: '나주시',
    region: '전라남도',
    rating: 4.8,
    reviews: 324,
    category: '역사유적',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhFQ6wIf78kuUUkFMyVHvmkqVIJy33_7ipKnosGPsLrTeBPVHEZXPI1DEf11ATErMjIgTanGIojtRfncSLQFibcadV0ww8P9cbTbvnNn-VaqkVUSPtMCGHM2xNOdQuM4SQzM-9c3nDgMIspAs0rXRXOEEoQfzqpDrjImgv5C3dRgD-LHTFHcgqQmN-xKaHIwR0xposYV1pSjWPwpwcj3xbULuXABD41PsaY83nf5QZO2c4HDo_CN4hHqiDWk_bGYIdrTmiJtdTOgKO',
    description: '조선시대 객사 건물로 나주의 대표적인 문화유산입니다.',
    isFeatured: true,
  },
  {
    id: 2,
    name: '영산강 황포돛배',
    location: '나주시',
    region: '전라남도',
    rating: 4.6,
    reviews: 186,
    category: '체험',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0dZnKfSx_FIc5y55WHb9LDByD-L2hc9Tw6uVGF_PqZgcIRjW3uL7OtQFbV2vt1_Xl0PiS8sLNWhtaZPYgXDdqd3Lbyhh9k6jV3XHfa0aPtp9uuib0yZIuNkeMwmXxlQw3LX90mCWQBimdisNaDTD0FPiyhXcXNqy0PH1feJnUXRkVL9NhL1h-kr4PpuTCqZ86ZpLW481RfCIP9UOkzeoQT18LWO-u-O8vwj2T7Tzr0H8sZ-c7WHiU9NOat1TocfIo93t9pOF2GHQi',
    description: '영산강의 정취를 느끼며 유람선을 타고 떠나는 특별한 시간 여행.',
  },
  {
    id: 3,
    name: '국립나주박물관',
    location: '나주시',
    region: '전라남도',
    rating: 4.7,
    reviews: 412,
    category: '박물관',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA98QEUEiJD5kyfLsNOzjIBrOTlpgX4g1PSOpJyffIh1NdV2xVGPMOT6xkZdtDbzgCNSPKMbnuHWSy85K99SUZPLRHQRGCuu8Gq1qGRTF_zOBYbaO14Kmo3HStx6DNWb9Bpez_1m0Ai54XREg8iEnmHTWeIPGwUqNlLAwHeKrqoWDFhLXZuICGNWFLbAE44L23CWJcWMPehc-W1KBPUeK4amZhFWI4J3h1GXWFUFQvzqmvb-EhxXHaxAnD2h_VamG_xHXXQOfmChSMH',
    description: '반남고분군에서 출토된 유물과 마한 문화를 만나보세요.',
  },
];

// 최근 여행 뉴스
const TRAVEL_NEWS = [
  {
    id: 1,
    title: '나주 배꽃 축제, 4월 개최 예정... 10만 방문객 예상',
    excerpt: '올해로 15회를 맞이하는 나주 배꽃 축제가 4월 첫째 주에 개최됩니다.',
    date: '2시간 전',
    image: '/images/placeholder-news.jpg',
    views: 1240,
  },
  {
    id: 2,
    title: '전남 해안도로 드라이브 코스 TOP 5',
    excerpt: '봄맞이 드라이브 코스로 추천하는 전남 해안도로 베스트 5를 소개합니다.',
    date: '5시간 전',
    image: '/images/placeholder-news.jpg',
    views: 892,
  },
  {
    id: 3,
    title: '광주-나주 KTX 연결 추진, 관광 활성화 기대',
    excerpt: 'KTX 광주송정역과 나주역 연결이 추진되며 지역 관광 활성화가 기대됩니다.',
    date: '어제',
    image: '/images/placeholder-news.jpg',
    views: 2103,
  },
];

// 추천 여행 코스
const TRAVEL_COURSES = [
  { id: 1, name: '나주 역사문화 탐방', duration: '1일', spots: 5 },
  { id: 2, name: '영산강 자전거 투어', duration: '반나절', spots: 3 },
  { id: 3, name: '전남 맛집 투어', duration: '2일', spots: 8 },
];

export default function TravelCategoryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Background Image */}
      <section className="relative text-white py-16 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/hero/travel-hero.png"
          alt="한국 전통 마을 풍경"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/85 to-blue-600/70" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Map className="w-6 h-6" />
            <span className="text-cyan-200 text-sm font-medium">TRAVEL</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">대한민국 여행</h1>
          <p className="text-cyan-100 max-w-2xl">
            전국 곳곳의 숨겨진 명소부터 인기 여행지까지, 코리아NEWS가 엄선한 여행 정보를 만나보세요.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Category Tabs & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat.label}
                    <span className="ml-1 text-xs opacity-70">({cat.count})</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-cyan-100 text-cyan-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-cyan-100 text-cyan-600' : 'text-gray-400'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Featured Destinations */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                인기 여행지
              </h2>
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {FEATURED_DESTINATIONS.map((dest) => (
                  <article
                    key={dest.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-[16/10]'}`}>
                      <Image
                        src={dest.image}
                        alt={dest.name}
                        fill
                        className="object-cover"
                      />
                      {dest.isFeatured && (
                        <span className="absolute top-3 left-3 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded">
                          추천
                        </span>
                      )}
                      <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{dest.category}</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {dest.location}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{dest.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{dest.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900">{dest.rating}</span>
                          <span className="text-gray-400">({dest.reviews})</span>
                        </div>
                        <button className="flex items-center gap-1 text-cyan-600 text-sm font-medium hover:text-cyan-700">
                          <Navigation className="w-4 h-4" />
                          길찾기
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Travel News */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">여행 뉴스</h2>
              <div className="space-y-4">
                {TRAVEL_NEWS.map((news) => (
                  <article
                    key={news.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{news.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{news.date}</span>
                          <span>조회 {news.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Recommended Courses */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                추천 여행 코스
              </h3>
              <div className="space-y-3">
                {TRAVEL_COURSES.map((course) => (
                  <Link
                    key={course.id}
                    href="#"
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-cyan-50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{course.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {course.duration} · {course.spots}곳
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Filter */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-cyan-500" />
                지역별 보기
              </h3>
              <div className="space-y-2">
                {['서울', '경기', '전라남도', '경상북도', '제주'].map((region) => (
                  <button
                    key={region}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-2">여행 뉴스레터</h3>
              <p className="text-sm text-cyan-100 mb-4">매주 엄선된 여행 정보를 받아보세요</p>
              <input
                type="email"
                placeholder="이메일 주소"
                className="w-full px-4 py-2 rounded-lg text-gray-900 text-sm mb-2"
              />
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                구독하기
              </button>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

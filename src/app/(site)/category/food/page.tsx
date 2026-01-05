'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UtensilsCrossed, MapPin, Star, Navigation, Clock, Heart,
  ChevronRight, Grid, List, TrendingUp, Flame, Award
} from 'lucide-react';

// 음식 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체', count: 256 },
  { id: 'korean', label: '한식', count: 98 },
  { id: 'local', label: '향토음식', count: 45 },
  { id: 'cafe', label: '카페', count: 67 },
  { id: 'street', label: '길거리음식', count: 46 },
];

// 인기 맛집
const FEATURED_RESTAURANTS = [
  {
    id: 1,
    name: '하얀집 나주곰탕',
    location: '중앙동',
    region: '나주시',
    rating: 4.9,
    reviews: 1247,
    category: '곰탕/수육',
    priceRange: '1만원대',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWtgI8ccCTyCGYXksTUGB8Zt6i26R99e3kyNkI0EWYV2qgE87eZTB8MjX8Z9d72ttmtLqOIaaL7D-mP4QRK-dJ26IdHgmaj_AChtM5WiOQsSwU7HRSt3BaUXTm49AxRRCyFEQPDeh0B47sRtIfpdMfvycBPJa2M7JOJdPRXVejx-6ja9xLnZk7qTEfGNcei9Hw9ms4Tx8aKwp8cvI9s0WIX4qAuwh9GVYVT5yXg-r58Qw4s3Oq-2Tx1UVfqDzaeL0r_KLoLdjlxE9C',
    description: '60년 전통의 진한 육수, 나주곰탕의 원조 맛집입니다.',
    isHot: true,
    tags: ['주차가능', '단체석'],
  },
  {
    id: 2,
    name: '사랑채 숯불구이',
    location: '빛가람동',
    region: '나주시',
    rating: 4.7,
    reviews: 532,
    category: '한우/숯불구이',
    priceRange: '3만원대',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvHdQdcQx-5jvN4xNJ1vQ4t0Met4osDEilNIT9y5ucqkXmVOsnDRZPWNLPGeoxR9gtPKbBNyOBNXe5_kxd--4fbginVVMexRFgv_Vj7keXGTQa55QE3CICPKKwUi8LzLY0dTx3YnqCUJnuUv5vIWSX8gbqEoxAVjJ6_ZADX-qY4Chatdxf4Altm7tIugZKqNfUoFBfu1VTUTBAgCZFE8BnYHVgZbkCWET41yGfwgJRX6FoaKtTu4qEj77DoqITtgMKmlGFtwAQW9qo',
    description: '신선한 한우와 숯불의 풍미를 느낄 수 있는 프리미엄 구이 전문점.',
    tags: ['예약필수', '룸'],
  },
  {
    id: 3,
    name: '나주배 직판장',
    location: '금천면',
    region: '나주시',
    rating: 4.8,
    reviews: 892,
    category: '특산물/과일',
    priceRange: '2만원대',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSdRJZtJzU1hqqjIIQV7RL5QpfFbACiOaT0zla67WBUbk311Ja1lON--CNVrL1MvGvItuNtX-ORO7Zd0rzHjXEEi7maSK8o1O9xqDfaaAViHqNL_-oAQ7P9m-Y7clDZ08l6lqzijhAvxjVgMIuZSfmqbjJy-7lx2LONpRwq4C9tiT0MdAV7dn0fS044G7rsohWjCsg1HETaDSArBxkpLLdtFscsu9TmzxhlWnDVkVJgEBiinq1wEOpvecnJfS7YqVOQ7S9xw5Vxmqe',
    description: '달콤하고 시원한 나주배를 농가에서 직접 구매하세요.',
    isHot: true,
    tags: ['택배가능', '시식'],
  },
];

// 맛집 뉴스
const FOOD_NEWS = [
  {
    id: 1,
    title: '나주곰탕거리 맛집 탐방기... 원조 vs 신생 비교 리뷰',
    date: '3시간 전',
    views: 2340,
  },
  {
    id: 2,
    title: '전남 숨은 맛집 TOP 10, 현지인만 아는 그 곳',
    date: '어제',
    views: 4521,
  },
  {
    id: 3,
    title: '나주배 수확철 맞아 관광농원 인기 급상승',
    date: '2일 전',
    views: 1876,
  },
];

// 실시간 인기 메뉴
const TRENDING_MENUS = [
  { rank: 1, name: '나주곰탕', change: 'up' },
  { rank: 2, name: '한우 꽃등심', change: 'same' },
  { rank: 3, name: '나주배 주스', change: 'up' },
  { rank: 4, name: '홍어삼합', change: 'down' },
  { rank: 5, name: '영산포 장어구이', change: 'new' },
];

export default function FoodCategoryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Background Image */}
      <section className="relative text-white py-16 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/hero/food-hero.png"
          alt="한국 전통 음식 상차림"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/85 to-red-500/70" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-6 h-6" />
            <span className="text-orange-200 text-sm font-medium">FOOD</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">대한민국 맛집</h1>
          <p className="text-orange-100 max-w-2xl">
            전국 방방곡곡의 숨은 맛집부터 인기 식당까지, 미식 여행을 떠나보세요.
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
                        ? 'bg-orange-500 text-white'
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
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Featured Restaurants */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                인기 맛집
              </h2>
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {FEATURED_RESTAURANTS.map((restaurant) => (
                  <article
                    key={restaurant.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-[16/10]'}`}>
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                      />
                      {restaurant.isHot && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <Flame className="w-3 h-3" /> HOT
                        </span>
                      )}
                      <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{restaurant.category}</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {restaurant.location}
                        </span>
                        <span>{restaurant.priceRange}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{restaurant.description}</p>
                      {restaurant.tags && (
                        <div className="flex gap-1 mb-3">
                          {restaurant.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900">{restaurant.rating}</span>
                          <span className="text-gray-400">({restaurant.reviews})</span>
                        </div>
                        <button className="flex items-center gap-1 text-orange-600 text-sm font-medium hover:text-orange-700">
                          <Navigation className="w-4 h-4" />
                          길찾기
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Food News */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">맛집 뉴스</h2>
              <div className="space-y-3">
                {FOOD_NEWS.map((news) => (
                  <article
                    key={news.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="font-bold text-gray-900 mb-2">{news.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{news.date}</span>
                      <span>조회 {news.views.toLocaleString()}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending Menus */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                실시간 인기 메뉴
              </h3>
              <div className="space-y-3">
                {TRENDING_MENUS.map((menu) => (
                  <div key={menu.rank} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      menu.rank <= 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {menu.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-900">{menu.name}</span>
                    <span className={`text-xs ${
                      menu.change === 'up' ? 'text-red-500' :
                      menu.change === 'down' ? 'text-blue-500' :
                      menu.change === 'new' ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {menu.change === 'up' ? '▲' :
                       menu.change === 'down' ? '▼' :
                       menu.change === 'new' ? 'NEW' : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Hours Notice */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                영업시간 안내
              </h3>
              <p className="text-sm text-gray-500">
                각 매장의 영업시간은 상이할 수 있습니다. 방문 전 전화 확인을 권장합니다.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-2">맛집 제보하기</h3>
              <p className="text-sm text-orange-100 mb-4">숨겨진 맛집을 알려주세요!</p>
              <Link
                href="/report"
                className="block w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium text-center transition-colors"
              >
                제보하기
              </Link>
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

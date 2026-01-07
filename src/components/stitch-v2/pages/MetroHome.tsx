'use client';

import { useState } from 'react';

// Props interface
interface MetroHomeProps {
  regionName: string; // e.g., "gwangju"
  regionCode: string; // e.g., "Gwangju Metropolitan City"
  accentColor: string; // e.g., "#00A651"
}

// Quick Menu Item interface
interface QuickMenuItem {
  icon: string;
  label: string;
  href: string;
  bgColor: string;
  darkBgColor: string;
  iconColor: string;
  darkIconColor: string;
}

// News Item interface
interface NewsItem {
  id: number;
  category: string;
  categoryColor: string;
  categoryDarkColor: string;
  categoryBgColor: string;
  categoryDarkBgColor: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

// Category filter data
const categories = ['all', 'politics', 'economy', 'society', 'culture', 'opinion'];
const categoryLabels: Record<string, string> = {
  all: '전체',
  politics: '정치',
  economy: '경제',
  society: '사회',
  culture: '문화',
  opinion: '오피니언',
};

// Quick menu items
const quickMenuItems: QuickMenuItem[] = [
  {
    icon: 'apartment',
    label: '시청',
    href: '#',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-900/30',
    iconColor: 'text-primary',
    darkIconColor: 'dark:text-blue-400',
  },
  {
    icon: 'work',
    label: '일자리',
    href: '#',
    bgColor: 'bg-green-50',
    darkBgColor: 'dark:bg-green-900/30',
    iconColor: 'text-green-600',
    darkIconColor: 'dark:text-green-400',
  },
  {
    icon: 'real_estate_agent',
    label: '부동산',
    href: '#',
    bgColor: 'bg-orange-50',
    darkBgColor: 'dark:bg-orange-900/30',
    iconColor: 'text-orange-600',
    darkIconColor: 'dark:text-orange-400',
  },
  {
    icon: 'directions_bus',
    label: '교통',
    href: '#',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-900/30',
    iconColor: 'text-purple-600',
    darkIconColor: 'dark:text-purple-400',
  },
];

// Sample news data
const sampleNewsItems: NewsItem[] = [
  {
    id: 1,
    category: '사회',
    categoryColor: 'text-primary',
    categoryDarkColor: 'dark:text-blue-300',
    categoryBgColor: 'bg-blue-50',
    categoryDarkBgColor: 'dark:bg-blue-900/40',
    date: '2023.10.27',
    title: '광주 도시철도 2호선 2단계 공사 본격화, 교통난 해소 기대',
    description:
      '광주광역시가 도시철도 2호선 2단계 구간 공사를 본격적으로 시작하며 시민들의 기대감이 높아지고 있습니다. 2029년 완공을 목표로...',
    imageUrl: '/placeholder/news-1.jpg',
    imageAlt: 'Subway construction site with engineers',
  },
  {
    id: 2,
    category: '경제',
    categoryColor: 'text-green-600',
    categoryDarkColor: 'dark:text-green-300',
    categoryBgColor: 'bg-green-50',
    categoryDarkBgColor: 'dark:bg-green-900/40',
    date: '2023.10.27',
    title: '지역 전통시장 활성화 대책 발표, 청년 상인 지원 확대',
    description:
      '침체된 지역 경제를 살리기 위해 광주시가 전통시장 현대화 사업과 함께 청년 상인 육성 프로젝트를 대대적으로...',
    imageUrl: '/placeholder/news-2.jpg',
    imageAlt: 'Traditional market alley with colorful stalls',
  },
  {
    id: 3,
    category: '문화',
    categoryColor: 'text-purple-600',
    categoryDarkColor: 'dark:text-purple-300',
    categoryBgColor: 'bg-purple-50',
    categoryDarkBgColor: 'dark:bg-purple-900/40',
    date: '2023.10.26',
    title: '광주 비엔날레 가을 특별전 개막, 전 세계 예술가 집결',
    description:
      "아시아 최대의 현대미술 축제인 광주 비엔날레 특별전이 오늘부터 시작됩니다. 이번 전시는 '물처럼 부드럽고 여리게'를 주제로...",
    imageUrl: '/placeholder/news-3.jpg',
    imageAlt: 'Modern art gallery exhibition space',
  },
  {
    id: 4,
    category: '환경',
    categoryColor: 'text-orange-600',
    categoryDarkColor: 'dark:text-orange-300',
    categoryBgColor: 'bg-orange-50',
    categoryDarkBgColor: 'dark:bg-orange-900/40',
    date: '2023.10.26',
    title: '무등산 국립공원, 가을 단풍 절정... 주말 등산객 북적',
    description:
      '무등산의 가을 단풍이 절정을 맞이했습니다. 이번 주말 맑은 날씨가 예보되면서 많은 시민들과 관광객들이...',
    imageUrl: '/placeholder/news-4.jpg',
    imageAlt: 'Autumn forest landscape with colorful trees',
  },
];

// Nav items
const navItems = [
  { icon: 'home', label: '홈', href: '#', active: true },
  { icon: 'map', label: '지도', href: '#', active: false },
  { icon: 'forum', label: '소통', href: '#', active: false },
  { icon: 'person', label: 'MY', href: '#', active: false },
];

// Header Component
function Header({ regionName, regionCode }: { regionName: string; regionCode: string }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white/95 dark:bg-[#111318]/95 backdrop-blur-sm p-4 border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
      <div className="flex size-10 shrink-0 items-center justify-start cursor-pointer text-[#111318] dark:text-white">
        <span className="material-symbols-outlined text-3xl">menu</span>
      </div>
      <div className="flex flex-col items-center flex-1">
        <h1 className="font-display text-xl font-bold leading-none tracking-tight text-[#111318] dark:text-white">
          코리아뉴스 <span className="text-primary">{regionName}판</span>
        </h1>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5 uppercase">
          {regionCode}
        </span>
      </div>
      <div className="flex size-10 items-center justify-end">
        <button className="flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white">
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
        </button>
      </div>
    </header>
  );
}

// Hero Section Component
function HeroSection({
  regionName,
  accentColor,
}: {
  regionName: string;
  accentColor: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary to-blue-600 dark:from-blue-900 dark:to-slate-900 px-4 py-8 pb-12 shadow-sm">
      {/* Decorative Pattern */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-6 items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 border border-white/30">
          <span className="material-symbols-outlined text-white text-sm mr-1.5">verified</span>
          <p className="text-white text-xs font-medium tracking-wide">행정/생활 정보의 중심</p>
        </div>
        {/* Headline */}
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-white text-3xl font-bold leading-tight tracking-tight drop-shadow-sm">
            {regionName}광역시,
            <br />
            AI 중심 도시로 도약
          </h2>
          <p className="text-blue-100 text-sm font-normal opacity-90">
            시민과 함께 만드는 내일, 빛나는 {regionName}
          </p>
        </div>
        {/* Search Bar */}
        <div className="w-full max-w-md mt-2">
          <label className="relative flex w-full items-center">
            <span className="absolute left-4 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              className="flex h-12 w-full rounded-xl border-none bg-white py-3 pl-12 pr-4 text-sm text-[#111318] shadow-lg shadow-blue-900/10 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="관심있는 뉴스를 검색하세요"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </div>
      </div>
    </section>
  );
}

// Quick Menu Component
function QuickMenu({ items }: { items: QuickMenuItem[] }) {
  return (
    <section className="bg-white dark:bg-[#111318] rounded-b-3xl -mt-4 relative z-20 px-4 pt-6 pb-2 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, index) => (
          <a key={index} className="flex flex-col items-center gap-2 group" href={item.href}>
            <div
              className={`flex size-12 items-center justify-center rounded-2xl ${item.bgColor} ${item.darkBgColor} ${item.iconColor} ${item.darkIconColor} transition-transform group-active:scale-95`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
          </a>
        ))}
      </div>
      {/* Thin Divider */}
      <div className="mt-6 mb-2 h-px w-full bg-gray-100 dark:bg-gray-800" />
    </section>
  );
}

// Category Filter Component
function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className="sticky top-[73px] z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-3 border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex w-full gap-2 overflow-x-auto px-4 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>
    </div>
  );
}

// News Card Component
function NewsCard({ news }: { news: NewsItem }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl bg-white dark:bg-[#1a2230] p-4 shadow-card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md ${news.categoryBgColor} ${news.categoryDarkBgColor} px-2 py-0.5 text-xs font-bold ${news.categoryColor} ${news.categoryDarkColor}`}
            >
              {news.category}
            </span>
            <span className="text-xs text-gray-400">{news.date}</span>
          </div>
          <h4 className="font-display text-lg font-bold leading-snug text-[#111318] dark:text-white line-clamp-2">
            {news.title}
          </h4>
          <p className="text-sm font-normal leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
            {news.description}
          </p>
        </div>
        <div className="shrink-0">
          <div className="size-20 overflow-hidden rounded-lg bg-gray-200">
            <div
              className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
              aria-label={news.imageAlt}
            >
              <span className="material-symbols-outlined text-gray-500 text-2xl">image</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// News Section Component
function NewsSection({ news }: { news: NewsItem[] }) {
  return (
    <main className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-xl font-bold text-[#111318] dark:text-white flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full" />
          실시간 주요 뉴스
        </h3>
        <span className="text-xs font-medium text-gray-400">updated 10m ago</span>
      </div>
      {news.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </main>
  );
}

// Bottom Navigation Component
function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318] px-2 pb-6 pt-2 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => (
          <a
            key={index}
            className={`flex min-w-[64px] flex-col items-center gap-1 rounded-lg p-1 ${
              item.active
                ? 'active-nav-item text-primary'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            href={item.href}
          >
            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
            <span className={`text-[10px] ${item.active ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

// Main MetroHome Component
export default function MetroHome({
  regionName = '광주',
  regionCode = 'Gwangju Metropolitan City',
  accentColor = '#00A651',
}: MetroHomeProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-body antialiased selection:bg-primary/20">
      <Header regionName={regionName} regionCode={regionCode} />
      <HeroSection regionName={regionName} accentColor={accentColor} />
      <QuickMenu items={quickMenuItems} />
      <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <NewsSection news={sampleNewsItems} />
      <BottomNav />

      {/* Custom styles for Material Symbols and scrollbar */}
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .active-nav-item .material-symbols-outlined {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

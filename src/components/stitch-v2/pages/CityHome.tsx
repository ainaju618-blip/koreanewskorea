'use client';

import React, { useState } from 'react';

// ============================================
// Types
// ============================================
interface CityHomeProps {
  cityName: string; // e.g., "나주"
  provinceName: string; // e.g., "전라남도"
  accentColor?: string; // default: "#3c83f6"
}

interface NewsItem {
  id: string;
  category: string;
  categoryColor: 'blue' | 'red' | 'green' | 'orange';
  date: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageAlt: string;
}

interface QuickMenuItem {
  icon: string;
  label: string;
  href: string;
}

interface CategoryChip {
  id: string;
  label: string;
}

// ============================================
// Constants
// ============================================
const CATEGORIES: CategoryChip[] = [
  { id: 'all', label: '전체' },
  { id: 'city', label: '시청' },
  { id: 'council', label: '의회' },
  { id: 'education', label: '교육' },
  { id: 'welfare', label: '복지' },
];

const QUICK_MENU_ITEMS: QuickMenuItem[] = [
  { icon: 'campaign', label: '공지사항', href: '#' },
  { icon: 'gavel', label: '민원/행정', href: '#' },
  { icon: 'apartment', label: '부동산/일자리', href: '#' },
  { icon: 'map', label: '관광/지도', href: '#' },
];

const CATEGORY_COLORS = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-primary',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
};

// Mock data - replace with actual data fetching
const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    category: '시청',
    categoryColor: 'blue',
    date: '2024-05-20',
    title: '2024년도 나주시 농업 보조금 지원 사업 공고 상세 안내',
    excerpt: '농업 경쟁력 강화를 위한 신규 보조금 지원 계획이 발표되었습니다. 신청 기간과 방법을 확인하세요.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVY0NX6NHiCXarSMzUA9RpA8QQAjGOfCQOZFa21MObV8qloaRQR3KJims-52tR3mrPDdY1PLVQRl3P0wR8Sa_5-ZMYbCnLGENoLKj-21Ju2ShYS7z8jZOxNduyr-8aGRSvUn5ic77um6CW3D40oKE77xGm13M6NjzyO2GPZCd0EGy4MuhbaL5y9YziPMhzSbsMTWZCdbEFTBZ3e9QZKKYvFTkzLEuPUA4hm2bU7dGWPU6z60n1yIisel7KyWFQ_KFWNOeYRRsD8cU',
    imageAlt: 'Green rice fields in Naju representing agriculture support',
  },
  {
    id: '2',
    category: '의회',
    categoryColor: 'red',
    date: '2024-05-19',
    title: '나주시의회, 스마트시티 기반 조성 추경 예산안 최종 통과',
    excerpt: '빛가람 혁신도시 스마트 인프라 확장을 위한 300억 규모 예산안이 시의회를 통과했습니다.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXbMeCtYeaB_Q7bMxsWrZmCkm8Ri8fNC_EIsF7jLqxiTysq9kbqu3VXY1oD3KPY7h2GwZeejyBTW-ro08hIKeJeEhaeuTcXf0bCH0ffrIGN-i3d3BkM_bCB5eF13EzxIQNcRGdaC-sbvzqfBHz0JsZTXsSsWciNgfuYMaRV_q-0_lxisTzwdCNNK9TxnfVbCrCMAKB_6OXxDDnd2rFfkc6QGnM1-xDIMnUrAELJuVQyCzdDSyPhKu2V_VPRWITfaKPsYMAcsCbVuQ',
    imageAlt: 'Modern council meeting room blurred background',
  },
  {
    id: '3',
    category: '교육',
    categoryColor: 'green',
    date: '2024-05-18',
    title: '빛가람초등학교 증축 계획 확정, 내년 3월 착공',
    excerpt: '과밀 학급 해소를 위한 교실 증축 및 다목적 강당 건립 계획이 교육청 승인을 받았습니다.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9991rFEQ8EY_uuf7tuUEJfa5WxvjPH-mJwCYdLEDOQikhoQF0WSDBR7BsjRwPe9RHdtvGH_etZ-rOQPGKeF7oz_T50eYsiTBOPUZu-MTYvCAQ-RuVMjALMDY_pGsFL3zbeS_G3cF5miWEd7qGvWi_3WdUV0bZ2GTOdVf0pl90HG83o5F9gqyHX8e9NwYVXcYAFQXv31Y4LeqSWrXCfXGSx1S0-tA9PrdTq9f6syW0Nl235Wsk3EGp2ogokIFkXp9owVBl7hBI8Vk',
    imageAlt: 'Exterior of a modern elementary school building',
  },
  {
    id: '4',
    category: '생활',
    categoryColor: 'orange',
    date: '2024-05-17',
    title: '2024 영산강 유채꽃 축제 기간 중 교통 통제 구간 안내',
    excerpt: '축제 기간 중 영산대교 남단부터 체육공원 입구까지 차량 통제가 실시됩니다.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-NMTVzrZSSqSsPBjO_QjzWCq03GXgogffOrzqWI0Aly8GNknRbocg3NUJuS4uyNeXXVKyezf3g0_6YrYb1-cjvjG_mOtAYWd2iq4ESht4xRMF-xilYVtXZeBScMVn_anPYexwQMetPGw_vY0LI2T-ZQBNLSY_Bn2IApWB3pMFpBpr4nTF2FoQ23eWmOH737x0SfqjsCEv7Gl3kd8kgOC3eQ_FDoJA4wJL_fZ5G5r2Pkew4ij-7SbBF_T49mdBbRjY-q6EiXHQ-EQ',
    imageAlt: 'Yellow canola flowers blooming by the river',
  },
];

// ============================================
// Sub Components
// ============================================

// TopAppBar Component
function TopAppBar({ cityName, provinceName }: { cityName: string; provinceName: string }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white dark:bg-[#101722] p-4 border-b border-gray-100 dark:border-gray-800">
      <div className="flex size-10 shrink-0 items-center justify-center cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
        <span className="material-symbols-outlined text-[#111418] dark:text-white text-[24px]">menu</span>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
          코리아뉴스 {cityName}판
        </h2>
        <div className="flex items-center gap-1">
          <span
            className="material-symbols-outlined text-primary text-[12px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          <span className="text-xs text-gray-500 font-medium">{provinceName} {cityName}시</span>
        </div>
      </div>
      <div className="flex w-10 items-center justify-end">
        <button className="flex cursor-pointer items-center justify-center rounded-full size-10 hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="material-symbols-outlined text-[#111418] dark:text-white text-[24px]">account_circle</span>
        </button>
      </div>
    </header>
  );
}

// HeroSection Component
function HeroSection({
  cityName,
  accentColor = '#3c83f6'
}: {
  cityName: string;
  accentColor?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  return (
    <section className="@container">
      <div className="relative flex min-h-[260px] flex-col gap-6 items-center justify-center p-6 overflow-hidden bg-primary">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDp3aqNNYK3hJdBUvOdlukbjNMVNMwbx7RUbmFNxfkAxDemKr8hM_cIKVT0MFPlPuXtV8pXdMZjUQHFAtGFeu3yOj6vRVutbC1AQGENgVifcdczcdlbeZQZv86qwrkkqsTDPqYOeq_O9ERkak9RLgJsUvjvPbSGPzPQ_Q4hJPkuD9udQZI5jW2u6UooN2E4xIrjgqlVo2kgMrzbV2hRjrNaeEIjwdsrgQjMoR2diDyzTboKpu-RwyRSpy3puaESa4gZRlfULM-_TnM")',
          }}
          aria-hidden="true"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary" />

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-2 text-center mt-2">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium w-fit mx-auto border border-white/30 backdrop-blur-sm">
            행정/생활 정보의 중심
          </span>
          <h1 className="text-white text-3xl font-black leading-tight tracking-tight">
            {cityName}, 역사와 미래가<br />공존하는 도시
          </h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative z-10 flex flex-col w-full max-w-[480px]">
          <div className="flex w-full items-stretch rounded-xl h-12 shadow-lg">
            <div className="text-primary flex bg-white dark:bg-[#1e293b] items-center justify-center pl-4 rounded-l-xl border-r-0">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#111418] dark:text-white focus:outline-0 bg-white dark:bg-[#1e293b] h-full placeholder:text-gray-400 px-3 text-sm font-normal leading-normal"
              placeholder={`${cityName} 지역 뉴스 및 정보 검색`}
            />
            <div className="flex items-center justify-center rounded-r-xl bg-white dark:bg-[#1e293b] pr-2">
              <button
                type="submit"
                className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-colors"
              >
                <span className="truncate">검색</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

// QuickMenu Component
function QuickMenu({ items }: { items: QuickMenuItem[] }) {
  return (
    <section className="py-6 px-4 bg-white dark:bg-[#101722]">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-2 group">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
              <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
            </div>
            <span className="text-xs font-medium text-[#111418] dark:text-gray-300">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// CategoryChips Component
function CategoryChips({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <div className="sticky top-[73px] z-40 bg-white dark:bg-[#101722] border-b border-gray-100 dark:border-gray-800">
      <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full transition-colors ${
                isActive
                  ? 'bg-[#111418] dark:bg-white text-white dark:text-[#111418]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// NewsCard Component
function NewsCard({ news }: { news: NewsItem }) {
  const colorClasses = CATEGORY_COLORS[news.categoryColor];

  return (
    <article className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex flex-1 flex-col justify-start gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded ${colorClasses.bg} ${colorClasses.text} text-xs font-bold`}>
            {news.category}
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">{news.date}</span>
        </div>
        <h4 className="text-[#111418] dark:text-gray-100 text-[17px] font-bold leading-snug line-clamp-2">
          {news.title}
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-relaxed line-clamp-2">
          {news.excerpt}
        </p>
      </div>
      <div className="shrink-0">
        <div
          className="bg-center bg-no-repeat bg-cover rounded-lg h-24 w-24 bg-gray-200"
          style={{ backgroundImage: `url("${news.imageUrl}")` }}
          aria-label={news.imageAlt}
        />
      </div>
    </article>
  );
}

// NewsList Component
function NewsList({ news }: { news: NewsItem[] }) {
  return (
    <section className="flex flex-col bg-white dark:bg-[#101722] pb-24">
      {/* Header for section */}
      <div className="px-4 pt-5 pb-1">
        <h3 className="text-[#111418] dark:text-white text-lg font-bold">실시간 주요 뉴스</h3>
      </div>
      {/* News Items */}
      {news.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </section>
  );
}

// BottomNav Component
function BottomNav() {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', icon: 'home', label: '홈' },
    { id: 'map', icon: 'map', label: '지도' },
    { id: 'community', icon: 'forum', label: '소통' },
    { id: 'my', icon: 'person', label: 'MY' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white dark:bg-[#101722] border-t border-gray-100 dark:border-gray-800 pb-safe">
      <div className="flex justify-between items-center px-6 h-[60px]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-12 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500 hover:text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================
// Main Component
// ============================================
export default function CityHome({
  cityName,
  provinceName,
  accentColor = '#3c83f6'
}: CityHomeProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white overflow-x-hidden">
      {/* Wrapper for max width on desktop */}
      <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-[#101722] shadow-xl">
        <TopAppBar cityName={cityName} provinceName={provinceName} />
        <HeroSection cityName={cityName} accentColor={accentColor} />
        <QuickMenu items={QUICK_MENU_ITEMS} />
        {/* Divider */}
        <div className="h-2 bg-gray-50 dark:bg-[#1a2230]" />
        <CategoryChips activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <NewsList news={MOCK_NEWS} />
        <BottomNav />
      </div>

      {/* Custom styles for scrollbar hiding */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </div>
  );
}

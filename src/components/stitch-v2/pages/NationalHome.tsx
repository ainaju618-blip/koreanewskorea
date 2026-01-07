'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Types
interface NewsItem {
  id: number;
  title: string;
  timeAgo: string;
  category: string;
  categoryColor: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface CategoryTab {
  id: string;
  label: string;
  href: string;
}

interface WidgetItem {
  id: string;
  icon: string;
  label: string;
  bgColor: string;
  iconColor: string;
  hoverBg: string;
}

interface RegionButton {
  id: string;
  label: string;
  isActive?: boolean;
  colSpan?: number;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  href: string;
  filled?: boolean;
}

// Mock Data
const categoryTabs: CategoryTab[] = [
  { id: 'home', label: '종합', href: '#' },
  { id: 'politics', label: '정치/행정', href: '#' },
  { id: 'economy', label: '경제/농업', href: '#' },
  { id: 'education', label: '교육/복지', href: '#' },
  { id: 'travel', label: '여행/축제', href: '#' },
  { id: 'opinion', label: '오피니언', href: '#' },
];

const widgetItems: WidgetItem[] = [
  {
    id: 'farming',
    icon: 'agriculture',
    label: '귀농지원',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverBg: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40',
  },
  {
    id: 'tourmap',
    icon: 'map',
    label: '관광지도',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    hoverBg: 'group-hover:bg-green-100 dark:group-hover:bg-green-900/40',
  },
  {
    id: 'notice',
    icon: 'campaign',
    label: '고시공고',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    hoverBg: 'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40',
  },
  {
    id: 'realestate',
    icon: 'home_work',
    label: '부동산',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    hoverBg: 'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40',
  },
];

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: '3분기 지방의회 정례회 결과: 주요 조례안 15건 통과',
    timeAgo: '1시간 전',
    category: '의회',
    categoryColor: 'text-primary',
    imageUrl: 'https://picsum.photos/seed/council/200/200',
    imageAlt: 'Gavel and blocks on a wooden table representing council meeting',
  },
  {
    id: 2,
    title: '이번 주말 가볼만한 전국 가을 축제 BEST 5',
    timeAgo: '2시간 전',
    category: '여행',
    categoryColor: 'text-green-600',
    imageUrl: 'https://picsum.photos/seed/autumn/200/200',
    imageAlt: 'Colorful autumn leaves in a forest representing travel destinations',
  },
  {
    id: 3,
    title: '지방 소멸 대응 기금, 올해 집행률 90% 달성 목표',
    timeAgo: '3시간 전',
    category: '행정',
    categoryColor: 'text-blue-600',
  },
];

const regionButtons: RegionButton[] = [
  { id: 'gyeonggi', label: '경기/인천' },
  { id: 'seoul', label: '서울', isActive: true },
  { id: 'gangwon', label: '강원' },
  { id: 'chungnam', label: '충남' },
  { id: 'sejong', label: '세종/대전' },
  { id: 'chungbuk', label: '충북' },
  { id: 'jeonbuk', label: '전북' },
  { id: 'gwangju', label: '광주/전남' },
  { id: 'gyeongbuk', label: '경북/대구' },
  { id: 'gyeongnam', label: '경남/부산/울산', colSpan: 2 },
  { id: 'jeju', label: '제주' },
];

const bottomNavItems: NavItem[] = [
  { id: 'home', icon: 'home', label: '홈', href: '#', filled: true },
  { id: 'region', icon: 'location_on', label: '내 지역', href: '#' },
  { id: 'scrap', icon: 'bookmark', label: '스크랩', href: '#' },
  { id: 'menu', icon: 'menu', label: '전체', href: '#' },
];

// Sub Components

// 1. UtilityBar - Date & Breaking News
function UtilityBar() {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 text-xs font-medium border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center px-4 py-2 gap-3 max-w-md mx-auto w-full">
        <span className="text-primary font-bold whitespace-nowrap">2023.10.27</span>
        <div className="h-3 w-px bg-slate-300 dark:bg-slate-600" />
        <div className="flex items-center gap-1.5 overflow-hidden text-text-main dark:text-slate-200">
          <span className="material-symbols-outlined text-red-500 text-[16px] animate-pulse">
            emergency_home
          </span>
          <p className="truncate">전국 농작물 수확량 보고서 발표, 귀농 지원 확대 논의...</p>
        </div>
      </div>
    </div>
  );
}

// Main Header with Navigation Tabs
function StickyHeader() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-center px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button className="text-text-main dark:text-white p-1 -ml-1" aria-label="Open menu">
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
            <Link href="#" className="flex flex-col leading-none">
              <span className="text-primary font-black text-xl tracking-tighter">KOREA NEWS</span>
              <span className="text-[10px] text-text-sub font-bold tracking-widest uppercase">
                National Edition
              </span>
            </Link>
          </div>
          {/* Action Icons */}
          <div className="flex gap-1">
            <button
              className="p-2 text-text-main dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Search"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
            <button
              className="p-2 text-text-main dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
            </button>
            <button
              className="p-2 text-text-main dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Account"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 min-w-max pb-3">
            {categoryTabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center text-sm group ${
                  activeTab === tab.id
                    ? 'text-text-main dark:text-white font-bold'
                    : 'text-text-sub dark:text-slate-400 font-medium hover:text-primary'
                } transition-colors`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute -bottom-3 w-full h-[3px] bg-text-main dark:bg-white rounded-t-sm" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

// 2. HeroSection - TOP NEWS badge, image, headline, summary
function HeroSection() {
  return (
    <section className="bg-white dark:bg-slate-900 pb-6 pt-4">
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            TOP NEWS
          </span>
          <span className="text-text-sub dark:text-slate-400 text-xs font-medium">
            10분 전 업데이트
          </span>
        </div>
        {/* Hero Article */}
        <div className="group cursor-pointer">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative mb-4 shadow-sm">
            <Image
              src="https://picsum.photos/seed/farming/800/450"
              alt="Wide green agricultural field under a blue sky representing rural farming policy"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          </div>
          <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-snug tracking-tight mb-2">
            정부, 귀농·귀촌 희망자 위한 신규 보조금 정책 대폭 확대 발표
          </h2>
          <p className="text-text-sub dark:text-slate-400 text-base leading-relaxed line-clamp-2 mb-3">
            내년부터 농촌 정착 지원금이 20% 인상되며, 초기 정착을 돕는 '귀촌 도우미' 서비스가 전국
            80개 지자체로 확대됩니다.
          </p>
          <div className="flex items-center text-xs text-text-sub dark:text-slate-500 font-medium gap-2">
            <span>정책브리핑</span>
            <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
            <span>전국</span>
            <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
            <span>댓글 42</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// 3. SecondaryNewsList - News card list (thumbnail + title + category/time)
function SecondaryNewsList() {
  return (
    <section className="bg-white dark:bg-slate-900 py-2">
      {newsItems.map((item, index) => (
        <div
          key={item.id}
          className={`px-4 py-3 flex gap-4 items-start active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer ${
            index < newsItems.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
          }`}
        >
          <div className="flex-1 flex flex-col justify-between min-h-[72px]">
            <h3 className="text-text-main dark:text-slate-100 text-[16px] font-semibold leading-tight line-clamp-2 mb-1">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-text-sub dark:text-slate-500 mt-1">
              <span className={`${item.categoryColor} font-bold`}>{item.category}</span>
              <span>·</span>
              <span>{item.timeAgo}</span>
            </div>
          </div>
          {item.imageUrl && (
            <div className="w-[72px] h-[72px] rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0 relative overflow-hidden">
              <Image
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

// 4. RegionMapSection - Region selection map (button grid)
function RegionMapSection() {
  const [selectedRegion, setSelectedRegion] = useState('seoul');

  return (
    <section className="bg-slate-50 dark:bg-slate-800/50 py-8 px-4 mt-2">
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">public</span>
            지역 선택
          </h2>
          <p className="text-sm text-text-sub dark:text-slate-400 mt-1">
            거주하시는 지역의 소식을 확인하세요
          </p>
        </div>
        <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
          전체보기
        </button>
      </div>
      {/* Abstract Map Visualization */}
      <div className="relative w-full aspect-[4/3] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 overflow-hidden">
        {/* Decorative background map pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3c83f6_1px,transparent_1px)] [background-size:16px_16px]" />
        {/* Current Location Indicator */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-text-sub dark:text-slate-500 tracking-wider">
            Current Location
          </span>
          <div className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            <span className="text-sm font-bold">서울 종로구</span>
          </div>
        </div>
        {/* Stylized Region Buttons Grid representing a Map */}
        <div className="absolute inset-0 flex items-center justify-center pt-8">
          <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
            {regionButtons.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`${region.colSpan === 2 ? 'col-span-2' : ''} ${
                  selectedRegion === region.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105 z-10'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-text-sub hover:border-primary hover:text-primary'
                } border rounded-lg py-2 text-sm font-bold shadow-sm transition-all`}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 5. WidgetsSection - Lifestyle & Public Data (4-column icon grid)
function WidgetsSection() {
  return (
    <section className="bg-white dark:bg-slate-900 py-6 px-4">
      <h3 className="text-[18px] font-bold text-text-main dark:text-white mb-4">
        생활 정보 &amp; 공공 데이터
      </h3>
      <div className="grid grid-cols-4 gap-4 text-center">
        {widgetItems.map((widget) => (
          <Link key={widget.id} href="#" className="flex flex-col items-center gap-2 group">
            <div
              className={`w-14 h-14 rounded-2xl ${widget.bgColor} flex items-center justify-center ${widget.iconColor} ${widget.hoverBg} transition-colors`}
            >
              <span className="material-symbols-outlined text-[28px]">{widget.icon}</span>
            </div>
            <span className="text-xs font-medium text-text-sub dark:text-slate-400 group-hover:text-primary">
              {widget.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// 6. NewsletterSection - Newsletter subscription form
function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <section className="px-4 py-8">
      <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-center text-white">
        <p className="text-sm text-slate-300 mb-2">놓치면 안되는 지역 소식</p>
        <h3 className="text-xl font-bold mb-4">매일 아침, 뉴스레터로 받아보세요</h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary"
            placeholder="이메일 주소"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            구독
          </button>
        </form>
      </div>
    </section>
  );
}

// Bottom Navigation
function BottomNav() {
  const [activeNav, setActiveNav] = useState('home');

  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-[60px] px-2">
        {/* Home */}
        <Link
          href={bottomNavItems[0].href}
          onClick={() => setActiveNav(bottomNavItems[0].id)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
            activeNav === bottomNavItems[0].id
              ? 'text-primary'
              : 'text-text-sub dark:text-slate-400 hover:text-primary dark:hover:text-white'
          } transition-colors`}
        >
          <span className="material-symbols-outlined text-[24px]">{bottomNavItems[0].icon}</span>
          <span className="text-[10px] font-medium">{bottomNavItems[0].label}</span>
        </Link>

        {/* My Region */}
        <Link
          href={bottomNavItems[1].href}
          onClick={() => setActiveNav(bottomNavItems[1].id)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
            activeNav === bottomNavItems[1].id
              ? 'text-primary'
              : 'text-text-sub dark:text-slate-400 hover:text-primary dark:hover:text-white'
          } transition-colors`}
        >
          <span className="material-symbols-outlined text-[24px]">{bottomNavItems[1].icon}</span>
          <span className="text-[10px] font-medium">{bottomNavItems[1].label}</span>
        </Link>

        {/* FAB (Add) Button */}
        <Link
          href="#"
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-text-sub dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
        >
          <div className="bg-primary rounded-full p-2 -mt-6 shadow-lg shadow-primary/40 border-4 border-white dark:border-slate-900">
            <span className="material-symbols-outlined text-white text-[24px]">add</span>
          </div>
        </Link>

        {/* Scrap */}
        <Link
          href={bottomNavItems[2].href}
          onClick={() => setActiveNav(bottomNavItems[2].id)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
            activeNav === bottomNavItems[2].id
              ? 'text-primary'
              : 'text-text-sub dark:text-slate-400 hover:text-primary dark:hover:text-white'
          } transition-colors`}
        >
          <span className="material-symbols-outlined text-[24px]">{bottomNavItems[2].icon}</span>
          <span className="text-[10px] font-medium">{bottomNavItems[2].label}</span>
        </Link>

        {/* Menu */}
        <Link
          href={bottomNavItems[3].href}
          onClick={() => setActiveNav(bottomNavItems[3].id)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
            activeNav === bottomNavItems[3].id
              ? 'text-primary'
              : 'text-text-sub dark:text-slate-400 hover:text-primary dark:hover:text-white'
          } transition-colors`}
        >
          <span className="material-symbols-outlined text-[24px]">{bottomNavItems[3].icon}</span>
          <span className="text-[10px] font-medium">{bottomNavItems[3].label}</span>
        </Link>
      </div>
      {/* Safe Area Spacing for iOS Home Indicator */}
      <div className="h-1 bg-white dark:bg-slate-900 w-full" />
    </nav>
  );
}

// Main Component
export default function NationalHome() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display antialiased pb-24">
      {/* Utility Bar (Date & Breaking News) */}
      <UtilityBar />

      {/* Main Header */}
      <StickyHeader />

      <main className="max-w-md mx-auto w-full flex flex-col gap-2">
        {/* Hero Section: Featured News */}
        <HeroSection />

        {/* Secondary News List */}
        <SecondaryNewsList />

        {/* Region Selection / Map Section */}
        <RegionMapSection />

        {/* Lifestyle / Public Data Widgets */}
        <WidgetsSection />

        {/* Newsletter / Footer Teaser */}
        <NewsletterSection />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

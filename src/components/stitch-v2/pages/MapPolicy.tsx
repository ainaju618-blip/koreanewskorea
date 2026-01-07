'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Types
interface RegionHotspot {
  id: string;
  label: string;
  position: { top?: string; left?: string; right?: string; bottom?: string };
  indicatorColor: string;
  isActive?: boolean;
}

interface StatCard {
  id: string;
  icon: string;
  label: string;
  value: string;
  description: string;
  iconColor: string;
}

interface FilterChip {
  id: string;
  label: string;
  isActive?: boolean;
}

interface PolicyCard {
  id: number;
  region: string;
  regionColor: {
    bg: string;
    text: string;
  };
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  views: string;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  href: string;
  isActive?: boolean;
  filled?: boolean;
}

// Mock Data
const regionHotspots: RegionHotspot[] = [
  {
    id: 'seoul',
    label: 'Seoul',
    position: { top: '30%', left: '25%' },
    indicatorColor: 'bg-red-500',
  },
  {
    id: 'daejeon',
    label: 'Daejeon',
    position: { top: '45%', left: '40%' },
    indicatorColor: 'bg-green-500',
  },
  {
    id: 'busan',
    label: 'Busan',
    position: { bottom: '20%', right: '20%' },
    indicatorColor: 'bg-yellow-300',
    isActive: true,
  },
];

const statCards: StatCard[] = [
  {
    id: 'new-policy',
    icon: 'campaign',
    label: 'NEW POLICY',
    value: '12',
    description: 'Nationwide total',
    iconColor: 'text-primary',
  },
  {
    id: 'rural-inquiry',
    icon: 'trending_up',
    label: 'RURAL INQUIRY',
    value: '+8.4%',
    description: 'Compared to last month',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'rainfall',
    icon: 'water_drop',
    label: 'AVG RAINFALL',
    value: '45mm',
    description: 'Crop management notice',
    iconColor: 'text-blue-500',
  },
];

const filterChips: FilterChip[] = [
  { id: 'all', label: 'All', isActive: true },
  { id: 'housing', label: 'Housing/Support' },
  { id: 'finance', label: 'Finance/Tax' },
  { id: 'farming', label: 'Agriculture/Rural' },
];

const policyCards: PolicyCard[] = [
  {
    id: 1,
    region: 'Nationwide',
    regionColor: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    title: '2024 Rural Settlement Support Fund Guide Expansion',
    summary:
      'Initial settlement support increased from 300 million to max 500 million won. Eligible age extended to 65 for those dreaming of post-retirement farming...',
    source: 'Ministry of Agriculture',
    timeAgo: '2 hours ago',
    views: '1.2k',
  },
  {
    id: 2,
    region: 'Busan Metropolitan',
    regionColor: {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
    },
    title: 'Small Business Digital Transformation Support Additional Recruitment',
    summary:
      'Supporting kiosk installation and online marketing costs up to 2 million won for small businesses operating for 5+ years in Busan area.',
    source: 'Busan City Hall',
    timeAgo: '5 hours ago',
    views: '850',
  },
  {
    id: 3,
    region: 'Gangwon Special',
    regionColor: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
    },
    title: 'Forest Fire Prevention Period Mountain Access Control Notice',
    summary:
      'Some major hiking trails will be closed during the dry autumn season. Fines will be imposed for violations, so please check before hiking.',
    source: 'Korea Forest Service',
    timeAgo: '1 day ago',
    views: '2.4k',
  },
];

const bottomNavItems: NavItem[] = [
  { id: 'home', icon: 'home', label: 'Home', href: '#' },
  { id: 'map', icon: 'map', label: 'Map', href: '#', isActive: true, filled: true },
  { id: 'news', icon: 'article', label: 'News', href: '#' },
  { id: 'my', icon: 'person', label: 'My', href: '#' },
];

// Sub Components
function TopAppBar() {
  return (
    <header className="sticky top-0 z-50 bg-gray-50/95 dark:bg-[#101722]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center p-4 justify-between max-w-lg mx-auto">
        <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] flex-1">
          Map &amp; Policy Briefing
        </h2>
        <div className="flex items-center justify-end gap-3">
          <button className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">
            <span className="material-symbols-outlined text-2xl">search</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function InteractiveMapSection() {
  return (
    <section className="relative w-full h-[450px] bg-[#eef4ff] dark:bg-[#1a222d] overflow-hidden group/map">
      {/* Map Instruction Overlay */}
      <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">touch_app</span>
            Select your region
          </span>
        </div>
      </div>

      {/* Map Image/Visual */}
      <div className="w-full h-full flex items-center justify-center p-6">
        <div
          className="relative w-full h-full bg-contain bg-center bg-no-repeat opacity-90 transition-transform duration-300"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC1H6GIYdLTcW3SrZjDFTiCGeSe5b54VaNLVjegh-lGVfcQaEX3Y8yFikC-BoigAUDs29SqUCvLxn_U2_oBKDnKXiDsaPFXB_t24mHAAUd5Kf1JY_n6u5eGcqstataqANVH8psWyc13F5QyrmnHrC8cS9__x90uW5mdxcdMC0j1DpNL4sG8pm1IPOiaIQ-qoYnZqNlAilt4KNH-dLu3tc05yKOkcH4Ms2bFRvThZ_TGD7KZ0LFdp7n_XRZI7kS21eoktlu-rWlnz5s')",
          }}
        >
          {/* Region Hotspots */}
          {regionHotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              className={`absolute shadow-lg p-2 rounded-xl flex flex-col items-center gap-1 hover:scale-110 transition-transform cursor-pointer ${
                hotspot.isActive
                  ? 'bg-primary shadow-primary/30 ring-2 ring-white dark:ring-gray-900'
                  : 'bg-white dark:bg-gray-800 border border-primary/20'
              }`}
              style={{
                top: hotspot.position.top,
                left: hotspot.position.left,
                right: hotspot.position.right,
                bottom: hotspot.position.bottom,
              }}
            >
              <span
                className={`text-xs font-bold ${
                  hotspot.isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {hotspot.label}
              </span>
              <div
                className={`h-1.5 w-1.5 rounded-full ${hotspot.indicatorColor} ${
                  hotspot.isActive ? 'animate-pulse' : ''
                }`}
              ></div>
            </button>
          ))}
        </div>
      </div>

      {/* Map Controls (FABs) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-3">
        <button
          aria-label="Zoom In"
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg border border-gray-100 dark:border-gray-600 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          aria-label="Zoom Out"
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg border border-gray-100 dark:border-gray-600 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button
          aria-label="Reset View"
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-lg border border-gray-100 dark:border-gray-600 active:scale-95 transition-transform mt-2"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 dark:text-white tracking-tight text-xl font-bold leading-tight">
          Key Indicators Today
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">As of 2023.10.24</span>
      </div>
      <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x">
        {statCards.map((stat) => (
          <div
            key={stat.id}
            className="snap-start shrink-0 w-40 bg-white dark:bg-[#1a222d] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-2"
          >
            <div className={`flex items-center gap-2 ${stat.iconColor}`}>
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PolicyBriefingSection() {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <section className="px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 dark:text-white tracking-tight text-xl font-bold leading-tight">
          Key Policy Briefings
        </h3>
        <button className="text-primary text-sm font-semibold flex items-center">
          View All <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveFilter(chip.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === chip.id
                ? 'bg-primary text-white shadow-md shadow-primary/20 font-bold'
                : 'bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Policy Card List */}
      <div className="flex flex-col gap-3">
        {policyCards.map((card) => (
          <article
            key={card.id}
            className="bg-white dark:bg-[#1a222d] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded ${card.regionColor.bg} ${card.regionColor.text} text-xs font-bold w-fit`}
                >
                  {card.region}
                </span>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mt-1">
                  {card.title}
                </h4>
              </div>
              <button className="text-gray-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">bookmark_add</span>
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
              {card.summary}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-gray-900 dark:text-gray-300">{card.source}</span>
                <span>-</span>
                <span>{card.timeAgo}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="material-symbols-outlined text-sm">visibility</span>
                {card.views}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a222d] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto pb-4">
        {bottomNavItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              item.isActive
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl ${item.filled ? 'filled' : ''}`}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] ${item.isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        ))}

        {/* Center FAB Button */}
        <div className="relative -top-5 order-2">
          <button className="bg-primary text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-gray-50 dark:border-[#101722]">
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// Main Component
export default function MapPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101722] font-sans antialiased text-gray-900 dark:text-white pb-20">
      <TopAppBar />
      <main className="max-w-lg mx-auto flex flex-col gap-6">
        <InteractiveMapSection />
        <StatsSection />
        <PolicyBriefingSection />
      </main>
      <BottomNavigation />

      {/* Custom Styles */}
      <style jsx global>{`
        /* Hide scrollbar for horizontal scroll areas */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Safe area padding for iOS */
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }

        /* Material Icon filled state */
        .material-symbols-outlined.filled {
          font-variation-settings:
            'FILL' 1,
            'wght' 400,
            'GRAD' 0,
            'opsz' 24;
        }
      `}</style>
    </div>
  );
}

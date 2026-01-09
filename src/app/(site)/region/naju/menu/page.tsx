'use client';

import Link from 'next/link';
import {
  Home,
  Newspaper,
  Building2,
  Users,
  GraduationCap,
  MapPin,
  Briefcase,
  Lightbulb,
  UtensilsCrossed,
  Map,
  ChevronRight,
  Globe,
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
}

const NEWS_MENUS: MenuItem[] = [
  {
    name: '전체 뉴스',
    href: '/region/naju/news',
    icon: Newspaper,
    description: '나주시 관련 모든 뉴스',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    name: '나주시 소식',
    href: '/region/naju/government',
    icon: Building2,
    description: '시청 보도자료 및 시정 소식',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    name: '의회 소식',
    href: '/region/naju/council',
    icon: Users,
    description: '나주시의회 소식',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: '교육 소식',
    href: '/region/naju/education',
    icon: GraduationCap,
    description: '나주교육지원청 소식',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: '읍면동 소식',
    href: '/region/naju/emd',
    icon: MapPin,
    description: '읍면동 지역 소식',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    name: '기업 소식',
    href: '/region/naju/business',
    icon: Briefcase,
    description: '나주 기업 및 경제 소식',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
  {
    name: '오피니언',
    href: '/region/naju/opinion',
    icon: Lightbulb,
    description: '칼럼 및 기고문',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
];

const LIFE_MENUS: MenuItem[] = [
  {
    name: '맛집',
    href: '/region/naju/food',
    icon: UtensilsCrossed,
    description: '나주 맛집 정보',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    name: '여행',
    href: '/region/naju/travel',
    icon: Map,
    description: '나주 관광 명소',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
];

export default function NajuMenuPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">전체 메뉴</h1>
          <p className="text-emerald-100 mt-1">코리아NEWS 나주</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* 홈 */}
        <section>
          <Link
            href="/region/naju"
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">홈</h3>
              <p className="text-sm text-gray-500">메인 페이지로 이동</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </Link>
        </section>

        {/* 뉴스 섹션 */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
            뉴스
          </h2>
          <div className="space-y-3">
            {NEWS_MENUS.map((menu) => {
              const Icon = menu.icon;
              return (
                <Link
                  key={menu.name}
                  href={menu.href}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 ${menu.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${menu.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{menu.name}</h3>
                    <p className="text-sm text-gray-500">{menu.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* 생활 섹션 */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
            생활
          </h2>
          <div className="space-y-3">
            {LIFE_MENUS.map((menu) => {
              const Icon = menu.icon;
              return (
                <Link
                  key={menu.name}
                  href={menu.href}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 ${menu.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${menu.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{menu.name}</h3>
                    <p className="text-sm text-gray-500">{menu.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* 외부 링크 */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
            외부 링크
          </h2>
          <a
            href="https://www.koreanewsone.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">전국판 바로가기</h3>
              <p className="text-sm text-gray-500">koreanewsone.com</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </a>
        </section>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase, MapPin, TrendingUp, Building2, Users, DollarSign,
  ChevronRight, Grid, List, Clock, Eye, Bookmark, Share2,
  Factory, Store, Landmark, Lightbulb, Award
} from 'lucide-react';

// 비즈니스 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체', count: 312 },
  { id: 'startup', label: '스타트업', count: 78 },
  { id: 'industry', label: '산업/제조', count: 95 },
  { id: 'commerce', label: '상업/유통', count: 82 },
  { id: 'policy', label: '정책/지원', count: 57 },
];

// 주요 기업 뉴스
const FEATURED_BUSINESS = [
  {
    id: 1,
    title: '나주 에너지밸리, 2026년 신재생에너지 허브로 도약',
    company: '한국전력공사',
    location: '빛가람동',
    region: '나주시',
    category: '에너지',
    date: '2시간 전',
    views: 3420,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWtgI8ccCTyCGYXksTUGB8Zt6i26R99e3kyNkI0EWYV2qgE87eZTB8MjX8Z9d72ttmtLqOIaaL7D-mP4QRK-dJ26IdHgmaj_AChtM5WiOQsSwU7HRSt3BaUXTm49AxRRCyFEQPDeh0B47sRtIfpdMfvycBPJa2M7JOJdPRXVejx-6ja9xLnZk7qTEfGNcei9Hw9ms4Tx8aKwp8cvI9s0WIX4qAuwh9GVYVT5yXg-r58Qw4s3Oq-2Tx1UVfqDzaeL0r_KLoLdjlxE9C',
    description: '전남 나주 에너지밸리가 신재생에너지 연구개발 및 산업화의 중심지로 성장하며 지역 경제 활성화에 기여하고 있다.',
    isHot: true,
    tags: ['신재생에너지', '일자리창출'],
  },
  {
    id: 2,
    title: '지역 농산물 직거래 플랫폼 "나주장터" 론칭',
    company: '나주시농업기술센터',
    location: '중앙동',
    region: '나주시',
    category: '농업/유통',
    date: '5시간 전',
    views: 1890,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvHdQdcQx-5jvN4xNJ1vQ4t0Met4osDEilNIT9y5ucqkXmVOsnDRZPWNLPGeoxR9gtPKbBNyOBNXe5_kxd--4fbginVVMexRFgv_Vj7keXGTQa55QE3CICPKKwUi8LzLY0dTx3YnqCUJnuUv5vIWSX8gbqEoxAVjJ6_ZADX-qY4Chatdxf4Altm7tIugZKqNfUoFBfu1VTUTBAgCZFE8BnYHVgZbkCWET41yGfwgJRX6FoaKtTu4qEj77DoqITtgMKmlGFtwAQW9qo',
    description: '나주시가 지역 농가와 소비자를 직접 연결하는 온라인 직거래 플랫폼을 출시했다.',
    tags: ['로컬푸드', '온라인'],
  },
  {
    id: 3,
    title: '전남테크노파크, AI 기반 스마트팜 실증단지 조성',
    company: '전남테크노파크',
    location: '산포면',
    region: '나주시',
    category: '스마트농업',
    date: '어제',
    views: 2156,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSdRJZtJzU1hqqjIIQV7RL5QpfFbACiOaT0zla67WBUbk311Ja1lON--CNVrL1MvGvItuNtX-ORO7Zd0rzHjXEEi7maSK8o1O9xqDfaaAViHqNL_-oAQ7P9m-Y7clDZ08l6lqzijhAvxjVgMIuZSfmqbjJy-7lx2LONpRwq4C9tiT0MdAV7dn0fS044G7rsohWjCsg1HETaDSArBxkpLLdtFscsu9TmzxhlWnDVkVJgEBiinq1wEOpvecnJfS7YqVOQ7S9xw5Vxmqe',
    description: '인공지능과 IoT 기술을 활용한 스마트팜 실증단지가 나주에 들어선다.',
    isHot: true,
    tags: ['AI', '스마트팜'],
  },
];

// 기업 지원 정책
const SUPPORT_POLICIES = [
  {
    id: 1,
    title: '2026년 청년창업 지원사업',
    organization: '나주시',
    deadline: '2026.02.28',
    amount: '최대 5천만원',
    type: '창업지원',
  },
  {
    id: 2,
    title: '중소기업 디지털 전환 지원',
    organization: '전남도',
    deadline: '2026.03.15',
    amount: '최대 3천만원',
    type: '기술지원',
  },
  {
    id: 3,
    title: '지역특화산업 육성 지원금',
    organization: '중소벤처기업부',
    deadline: '상시모집',
    amount: '최대 1억원',
    type: '산업지원',
  },
];

// 실시간 경제 지표
const ECONOMIC_INDICATORS = [
  { label: '코스피', value: '2,847.32', change: '+1.2%', isUp: true },
  { label: '코스닥', value: '921.45', change: '-0.3%', isUp: false },
  { label: '환율(USD)', value: '1,298.50', change: '+0.1%', isUp: true },
  { label: '금(g)', value: '98,420', change: '+0.5%', isUp: true },
];

// 지역 기업 순위
const TOP_COMPANIES = [
  { rank: 1, name: '한국전력공사', industry: '에너지', employees: '2,500+' },
  { rank: 2, name: '한전KDN', industry: 'IT서비스', employees: '1,200+' },
  { rank: 3, name: '전력거래소', industry: '에너지', employees: '800+' },
  { rank: 4, name: '나주시농협', industry: '농업', employees: '500+' },
  { rank: 5, name: '동신대학교', industry: '교육', employees: '400+' },
];

export default function BusinessCategoryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Background Image */}
      <section className="relative text-white py-16 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/hero/business-hero.png"
          alt="현대적인 비즈니스 도심 스카이라인"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700/85 to-gray-600/70" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-6 h-6" />
            <span className="text-slate-300 text-sm font-medium">BUSINESS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">비즈니스 뉴스</h1>
          <p className="text-slate-200 max-w-2xl">
            지역 경제 동향, 기업 소식, 창업 지원 정책까지 비즈니스의 모든 것을 한눈에.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Economic Indicators Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
            <span className="text-sm font-bold text-gray-500 shrink-0">실시간 경제지표</span>
            {ECONOMIC_INDICATORS.map((indicator) => (
              <div key={indicator.label} className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-gray-600">{indicator.label}</span>
                <span className="font-bold text-gray-900">{indicator.value}</span>
                <span className={`text-xs font-medium ${indicator.isUp ? 'text-red-500' : 'text-blue-500'}`}>
                  {indicator.change}
                </span>
              </div>
            ))}
          </div>
        </div>

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
                        ? 'bg-slate-800 text-white'
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
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-gray-400'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-gray-400'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Featured Business News */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-700" />
                주요 비즈니스 뉴스
              </h2>
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {FEATURED_BUSINESS.map((news) => (
                  <article
                    key={news.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-[16/10]'}`}>
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover"
                      />
                      {news.isHot && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{news.category}</span>
                        <span className="flex items-center gap-0.5">
                          <Building2 className="w-3 h-3" />
                          {news.company}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{news.description}</p>
                      {news.tags && (
                        <div className="flex gap-1 mb-3">
                          {news.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {news.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {news.views.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:text-slate-700 transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:text-slate-700 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Support Policies */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                기업 지원 정책
              </h2>
              <div className="space-y-3">
                {SUPPORT_POLICIES.map((policy) => (
                  <article
                    key={policy.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                            {policy.type}
                          </span>
                          <span className="text-xs text-gray-400">{policy.organization}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{policy.title}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            마감: <span className="text-red-500 font-medium">{policy.deadline}</span>
                          </span>
                          <span className="text-gray-500">
                            지원금: <span className="text-slate-700 font-bold">{policy.amount}</span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    </div>
                  </article>
                ))}
              </div>
              <Link
                href="/business/policies"
                className="mt-4 block text-center py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                전체 지원사업 보기
              </Link>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Top Companies */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-slate-700" />
                지역 주요 기업
              </h3>
              <div className="space-y-3">
                {TOP_COMPANIES.map((company) => (
                  <div key={company.rank} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      company.rank <= 3 ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {company.rank}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-400">{company.industry} · {company.employees}명</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Categories Quick Links */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">산업별 보기</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/business/energy" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Factory className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-gray-700">에너지</span>
                </Link>
                <Link href="/business/it" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-gray-700">IT/기술</span>
                </Link>
                <Link href="/business/agriculture" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Store className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-gray-700">농업</span>
                </Link>
                <Link href="/business/finance" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Landmark className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-gray-700">금융</span>
                </Link>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-2">기업 홍보하기</h3>
              <p className="text-sm text-slate-300 mb-4">귀사의 소식을 지역과 함께 나누세요.</p>
              <Link
                href="/business/submit"
                className="block w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium text-center transition-colors"
              >
                뉴스 등록하기
              </Link>
            </div>

            {/* Newsletter */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">비즈니스 뉴스레터</h3>
              <p className="text-sm text-gray-500 mb-3">매주 지역 경제 소식을 받아보세요.</p>
              <form className="space-y-2">
                <input
                  type="email"
                  placeholder="이메일 주소"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  구독하기
                </button>
              </form>
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

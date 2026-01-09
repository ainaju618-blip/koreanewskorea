/**
 * A안: 포털형 로고 + 신문사 스타일 메뉴 + 신문 콘텐츠
 *
 * 타이포그래피 기준 (신문사 표준):
 * - 상단 메뉴: 14px (text-sm)
 * - 섹션 타이틀: 18px (text-lg)
 * - 헤드라인 제목: 20px (text-xl) / 모바일: 18px (text-lg)
 * - 일반 뉴스 제목: 14px (text-sm)
 * - 본문/요약: 14px (text-sm)
 * - 메타정보: 12px (text-xs)
 *
 * 반응형 브레이크포인트:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 */

import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Search,
  ChevronRight,
  ChevronDown,
  Newspaper,
  Quote,
  Globe,
  Utensils,
  Landmark,
  Menu,
  X,
} from 'lucide-react';
import MobileMenu from './MobileMenu';

export const metadata: Metadata = {
  title: '나주NEWS | 코리아뉴스',
  description: '나주시 지역 뉴스 - 시정, 의회, 교육, 생활 소식',
};

export const revalidate = 60;

// 데이터 페칭
async function fetchNajuNews() {
  const { data: allNews } = await supabaseAdmin
    .from('posts')
    .select('id, title, content, thumbnail_url, source, category, published_at, ai_summary, view_count, importance')
    .or('region.eq.naju,region.like.naju_%')
    .in('status', ['published', 'limited'])
    .order('published_at', { ascending: false })
    .limit(30);

  return allNews || [];
}

export default async function NajuSampleAPage() {
  const allNews = await fetchNajuNews();

  // 데이터 분류 (지역 뉴스 특성에 맞게)
  const headline = allNews[0];
  const latestNews = allNews.slice(1, 6);

  // 출처 기반 분류
  const cityNews = allNews.filter(n =>
    n.source?.includes('시청') || n.category === '행정' || n.category === '정책'
  ).slice(0, 4);
  const councilNews = allNews.filter(n =>
    n.source?.includes('의회') || n.category === '의회'
  ).slice(0, 4);
  const eduNews = allNews.filter(n =>
    n.source?.includes('교육') || n.category === '교육'
  ).slice(0, 4);

  // 부족하면 최신순으로 채우기
  const fillNews = (arr: typeof allNews, target: number) => {
    if (arr.length >= target) return arr.slice(0, target);
    const used = new Set(arr.map(n => n.id));
    const remaining = allNews.filter(n => !used.has(n.id)).slice(0, target - arr.length);
    return [...arr, ...remaining].slice(0, target);
  };

  const city = fillNews(cityNews, 4);
  const council = fillNews(councilNews, 4);
  const edu = fillNews(eduNews, 4);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== 헤더 ===== */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-40">
        {/* 상단 바 - 모바일에서 간소화 */}
        <div className="bg-gray-900 text-gray-300 text-xs py-1">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="flex-shrink-0">2026.01.07</span>
              <span className="hidden sm:inline text-cyan-400 truncate">
                {headline?.title?.substring(0, 40) || '오늘의 주요 뉴스'}...
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs flex-shrink-0">
              <Link href="#" className="hover:text-white">로그인</Link>
              <Link href="#" className="hidden sm:inline hover:text-white">회원가입</Link>
            </div>
          </div>
        </div>

        {/* 메인 네비게이션 */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-12">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
              <Newspaper className="w-6 h-6 text-red-600" />
              <span className="text-lg font-bold text-gray-900">
                코리아<span className="text-red-600">NEWS</span>
              </span>
            </Link>

            {/* 데스크톱: 신문 카테고리 메뉴 - 14px 표준 */}
            <nav className="hidden lg:flex items-center">
              {[
                { label: '시정', href: '/city' },
                { label: '의회', href: '/council' },
                { label: '교육', href: '/education' },
                { label: '생활', href: '/life' },
                { label: '오피니언', href: '/opinion' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <span className="text-gray-300 mx-1">|</span>
              <Link href="/travel" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors">
                <Globe className="w-4 h-4" />
                여행
              </Link>
              <Link href="/food" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors">
                <Utensils className="w-4 h-4" />
                맛집
              </Link>
              <Link href="/heritage" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors">
                <Landmark className="w-4 h-4" />
                문화유적
              </Link>
            </nav>

            {/* 오른쪽 영역: 지역선택 + 모바일메뉴 */}
            <div className="flex items-center gap-2">
              {/* 데스크톱: 지역 선택 */}
              <div className="hidden lg:block relative group">
                <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>나주</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <MapPin className="w-3.5 h-3.5" />전국
                  </Link>
                  <Link href="/region/gwangju" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <MapPin className="w-3.5 h-3.5" />광주
                  </Link>
                  <Link href="/region/naju" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 font-medium">
                    <MapPin className="w-3.5 h-3.5" />나주
                  </Link>
                  <Link href="/region/jindo" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <MapPin className="w-3.5 h-3.5" />진도
                  </Link>
                </div>
              </div>

              {/* 모바일: 햄버거 메뉴 */}
              <MobileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* ===== 지역 배너 ===== */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium tracking-wider opacity-80">NAJU</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">나주시</h1>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5 sm:mt-1">천년 역사의 배고을</p>
            </div>
            {/* 검색: 모바일에서는 아이콘만 */}
            <button className="md:hidden flex items-center justify-center w-10 h-10 bg-white/10 rounded-full">
              <Search className="w-5 h-5 text-white/80" />
            </button>
            <div className="hidden md:flex items-center bg-white/10 rounded px-3 py-2">
              <Search className="w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="뉴스 검색"
                className="bg-transparent text-sm text-white placeholder-white/60 outline-none ml-2 w-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 메인 콘텐츠 ===== */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5">

        {/* 헤드라인 + 최신뉴스 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-5 sm:mb-6">
          {/* 메인 헤드라인 */}
          {headline && (
            <Link href={`/news/${headline.id}`} className="lg:col-span-2 bg-white rounded border border-gray-200 overflow-hidden group">
              <div className="relative aspect-[16/9] sm:aspect-[2/1]">
                {headline.thumbnail_url ? (
                  <Image
                    src={headline.thumbnail_url}
                    alt={headline.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Newspaper className="w-10 sm:w-12 h-10 sm:h-12 text-gray-300" />
                  </div>
                )}
                <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-red-600 text-white px-2 py-0.5 text-xs font-bold">
                  {headline.source || '나주시'}
                </span>
              </div>
              <div className="p-3 sm:p-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                  {headline.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1.5 sm:mt-2 line-clamp-2">
                  {headline.ai_summary || headline.content?.substring(0, 120)}
                </p>
                <span className="text-xs text-gray-400 mt-1.5 sm:mt-2 block">
                  {new Date(headline.published_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                </span>
              </div>
            </Link>
          )}

          {/* 최신뉴스 */}
          <div className="bg-white rounded border border-gray-200 p-3 sm:p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2.5 sm:mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              최신뉴스
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {latestNews.map((item) => (
                <li key={item.id}>
                  <Link href={`/news/${item.id}`} className="group flex items-start gap-2 py-0.5">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 group-hover:text-red-600 line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <span className="text-xs text-gray-400">
                        {item.source}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 카테고리별 뉴스 - 모바일: 1열, 태블릿 이상: 3열 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-5 sm:mb-6">
          <NewsSection title="시정" news={city} color="red" />
          <NewsSection title="의회" news={council} color="blue" />
          <NewsSection title="교육" news={edu} color="emerald" />
        </section>

        {/* 오피니언 */}
        <section className="mb-5 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-2">
            <span className="w-1 h-4 sm:h-5 bg-purple-600 rounded"></span>
            오피니언
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                <Quote className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">칼럼</span>
              </div>
              <div className="flex gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-base sm:text-lg">✍️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5 sm:mb-1">기다림의 연금술</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    겨울 아침, 창가에 맺힌 성에를 바라보며 기다림의 의미를 되새긴다...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">우미옥</span> · 나주시니어신문
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded border border-gray-200 p-3 sm:p-4">
              <span className="inline-block bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded mb-2">사설</span>
              <h3 className="text-sm font-bold text-gray-900 mb-0.5 sm:mb-1">에너지밸리, 지역 상생의 모델이 되려면</h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                나주 에너지밸리가 2단계 사업에 본격 착수한다. 진정한 성공을 위해서는...
              </p>
            </div>
          </div>
        </section>

        {/* 생활/문화 퀵링크 - 모바일: 1열, 태블릿: 3열 */}
        <section className="mb-5 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-2">
            <span className="w-1 h-4 sm:h-5 bg-orange-500 rounded"></span>
            생활/문화
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <QuickLink icon="🍜" title="맛집" items={['나주곰탕거리', '영산포홍어', '빛가람카페']} />
            <QuickLink icon="🗺️" title="여행" items={['금성관', '영산강황포돛배', '나주목문화관']} />
            <QuickLink icon="📅" title="행사" items={['나주배축제', '영산강문화제', '빛축제']} />
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-gray-400 py-5 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center">
          <p className="text-sm font-bold text-white mb-1">
            코리아<span className="text-red-500">NEWS</span> 나주
          </p>
          <p className="text-xs">© 2026 코리아NEWS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// 뉴스 섹션 컴포넌트
function NewsSection({
  title,
  news,
  color
}: {
  title: string;
  news: any[];
  color: 'red' | 'blue' | 'emerald';
}) {
  const colors = {
    red: { bar: 'bg-red-600', hover: 'group-hover:text-red-600' },
    blue: { bar: 'bg-blue-600', hover: 'group-hover:text-blue-600' },
    emerald: { bar: 'bg-emerald-600', hover: 'group-hover:text-emerald-600' },
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-3 sm:p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-2.5 sm:mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
        <span className={`w-1 h-4 ${colors[color].bar} rounded`}></span>
        {title}
      </h3>
      <ul className="space-y-2 sm:space-y-2.5">
        {news.map((item, idx) => (
          <li key={item.id}>
            <Link href={`/news/${item.id}`} className="group flex gap-2 sm:gap-2.5 py-0.5">
              {item.thumbnail_url && idx === 0 ? (
                <div className="w-14 h-10 sm:w-16 sm:h-12 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={item.thumbnail_url}
                    alt=""
                    width={64}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-gray-700 ${colors[color].hover} line-clamp-2 leading-snug`}>
                  {item.title}
                </p>
                <span className="text-xs text-gray-400">
                  {new Date(item.published_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 퀵링크 컴포넌트 - 모바일에서는 가로 배치
function QuickLink({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="bg-white rounded border border-gray-200 p-2.5 sm:p-3">
      <h3 className="text-sm font-bold text-gray-900 mb-1.5 sm:mb-2 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </h3>
      {/* 모바일: 가로 나열, 태블릿: 세로 나열 */}
      <ul className="flex flex-wrap gap-x-3 gap-y-1 sm:flex-col sm:space-y-1 sm:gap-0">
        {items.map((item, idx) => (
          <li key={idx}>
            <Link href="#" className="text-xs text-gray-600 hover:text-red-600 py-1 inline-block">
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

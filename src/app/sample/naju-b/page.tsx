/**
 * B안: 완전 신문사 스타일 (메뉴 + 콘텐츠)
 * - 상단 메뉴: 전통 신문사 스타일 (정치, 사회, 경제, 오피니언, 시청, 의회)
 * - 콘텐츠: 클래식 신문 레이아웃
 */

import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  MapPin,
  ChevronRight,
  Quote,
  Utensils,
  Map,
  Calendar,
  Search,
  User,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'B안: 완전 신문사 스타일 | 나주NEWS 샘플',
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
    .limit(50);

  return allNews || [];
}

export default async function NajuSampleBPage() {
  const allNews = await fetchNajuNews();

  // 날짜 포맷
  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  });

  // 데이터 분류
  const headline = allNews[0];
  const breaking = allNews.slice(1, 6);

  // 카테고리별 분류
  const filterByCategory = (keywords: string[]) => {
    return allNews.filter(n =>
      keywords.some(k =>
        n.category?.includes(k) || n.source?.includes(k)
      )
    ).slice(0, 4);
  };

  const politicsNews = filterByCategory(['행정', '정책', '시청', '시장']);
  const societyNews = filterByCategory(['사회', '교육', '복지', '안전']);
  const economyNews = filterByCategory(['경제', '산업', '농업', '에너지']);
  const councilNews = filterByCategory(['의회', '의원', '조례']);

  // 부족한 카테고리는 전체에서 채우기
  const fillNews = (arr: typeof allNews, exclude: typeof allNews[], target: number) => {
    if (arr.length >= target) return arr.slice(0, target);
    const excludeIds = new Set(exclude.flat().map(n => n.id));
    const remaining = allNews.filter(n => !excludeIds.has(n.id) && !arr.includes(n));
    return [...arr, ...remaining].slice(0, target);
  };

  const politics = fillNews(politicsNews, [], 4);
  const society = fillNews(societyNews, [politics], 4);
  const economy = fillNews(economyNews, [politics, society], 4);
  const council = fillNews(councilNews, [politics, society, economy], 4);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== 신문사 스타일 헤더 ===== */}
      <header className="bg-white border-b-4 border-red-700">
        {/* 최상단 바 */}
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {dateStr}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-red-700">로그인</Link>
              <Link href="#" className="hover:text-red-700">회원가입</Link>
              <Link href="#" className="hover:text-red-700">광고문의</Link>
            </div>
          </div>
        </div>

        {/* 로고 */}
        <div className="py-6 text-center border-b border-gray-100">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-black tracking-tight">
              <span className="text-red-700">나주</span>
              <span className="text-gray-900">NEWS</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 tracking-widest">
              천년의 역사, 영산강의 고장
            </p>
          </Link>
        </div>

        {/* 메인 네비게이션 - 신문사 스타일 */}
        <nav className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center">
              {[
                { label: '전체', href: '/', active: true },
                { label: '정치/행정', href: '/politics' },
                { label: '사회/교육', href: '/society' },
                { label: '경제/산업', href: '/economy' },
                { label: '오피니언', href: '/opinion' },
                { label: '생활/문화', href: '/life', dropdown: true },
                { label: '시청소식', href: '/city' },
                { label: '의회소식', href: '/council' },
                { label: '교육청', href: '/education' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    item.active
                      ? 'border-red-700 text-red-700'
                      : 'border-transparent text-gray-700 hover:text-red-700 hover:border-red-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {/* 검색 버튼 */}
              <button className="ml-4 p-2 text-gray-500 hover:text-red-700">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        {/* 지역 선택 서브바 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">나주시</span>
                <span className="text-gray-400">|</span>
                <Link href="#" className="text-gray-600 hover:text-red-600">전국</Link>
                <Link href="#" className="text-gray-600 hover:text-red-600">광주</Link>
                <Link href="#" className="text-gray-600 hover:text-red-600">목포</Link>
                <Link href="#" className="text-gray-600 hover:text-red-600">순천</Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>오늘 {allNews.length}건</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== 메인 콘텐츠 ===== */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* 헤드라인 영역 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 메인 뉴스 */}
          {headline && (
            <Link
              href={`/news/${headline.id}`}
              className="lg:col-span-2 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 group"
            >
              <div className="relative aspect-[16/9]">
                {headline.thumbnail_url ? (
                  <Image
                    src={headline.thumbnail_url}
                    alt={headline.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-6xl">📰</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-red-700 text-white px-3 py-1 text-sm font-bold">
                    {headline.category || '주요뉴스'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-red-700 transition-colors">
                  {headline.title}
                </h2>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {headline.ai_summary || headline.content?.substring(0, 200)}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{headline.source}</span>
                  <span>·</span>
                  <span>
                    {new Date(headline.published_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* 속보 + 날씨 */}
          <div className="flex flex-col gap-4">
            {/* 속보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex-1">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-red-700">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                속보
              </h3>
              <ul className="space-y-4">
                {breaking.map((item, idx) => (
                  <li key={item.id} className="group">
                    <Link href={`/news/${item.id}`} className="flex items-start gap-3">
                      <span className="text-xs font-bold text-red-600 mt-0.5">{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 group-hover:text-red-700 line-clamp-2 leading-relaxed">
                          {item.title}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {getTimeAgo(item.published_at)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4단 뉴스 그리드 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <NewsColumn title="정치/행정" news={politics} color="red" />
          <NewsColumn title="사회/교육" news={society} color="blue" />
          <NewsColumn title="경제/산업" news={economy} color="emerald" />
          <NewsColumn title="의회소식" news={council} color="purple" />
        </section>

        {/* 오피니언 섹션 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-7 bg-purple-700 rounded"></span>
            <h2 className="text-xl font-bold text-gray-900">오피니언</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 칼럼 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600 tracking-wide">COLUMN</span>
              </div>
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
                    <User className="w-10 h-10 text-purple-300" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-purple-700 cursor-pointer">
                    기다림의 연금술
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    겨울 아침, 창가에 맺힌 성에를 바라보며 기다림의 의미를 되새긴다.
                    우리 삶에서 기다림이란 무엇일까...
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900">우미옥</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">논설위원</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400">나주시니어신문</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 사설 + 기자수첩 */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <span className="inline-block bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded mb-3">
                  사설
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-gray-700 cursor-pointer">
                  에너지밸리, 지역 상생의 모델이 되려면
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  나주 에너지밸리가 2단계 사업에 본격 착수한다. 그러나 진정한 성공을 위해서는...
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded mb-3">
                  기자수첩
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-1 hover:text-amber-600 cursor-pointer">
                  빛가람 10년, 성적표를 보다
                </h3>
                <p className="text-sm text-gray-500">김철수 기자</p>
              </div>
            </div>
          </div>
        </section>

        {/* 생활/문화 간소화 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-7 bg-orange-500 rounded"></span>
            <h2 className="text-xl font-bold text-gray-900">생활/문화</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LifestyleCard
              icon={<Utensils className="w-5 h-5 text-orange-500" />}
              title="맛집"
              items={[
                { name: '나주곰탕거리', desc: '70년 전통' },
                { name: '영산포 홍어거리', desc: '삭힌 홍어' },
                { name: '빛가람 카페거리', desc: '신도시 핫플' },
              ]}
            />
            <LifestyleCard
              icon={<Map className="w-5 h-5 text-cyan-500" />}
              title="여행"
              items={[
                { name: '금성관', desc: '사적 제337호' },
                { name: '영산강 황포돛배', desc: '전통 뱃놀이' },
                { name: '나주목문화관', desc: '천년 목사골' },
              ]}
            />
            <LifestyleCard
              icon={<Calendar className="w-5 h-5 text-purple-500" />}
              title="축제/행사"
              items={[
                { name: '나주배축제', desc: '10월' },
                { name: '영산강 문화제', desc: '5월' },
                { name: '빛가람 빛축제', desc: '12월' },
              ]}
            />
          </div>
        </section>

        {/* 광고 배너 */}
        <section className="mb-8">
          <div className="bg-gray-200 rounded-lg h-24 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
            광고 배너 영역
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-white mb-2">
                <span className="text-red-500">나주</span>NEWS
              </h2>
              <p className="text-sm">천년의 역사, 영산강의 고장</p>
              <p className="text-sm mt-1">전라남도 나주시 빛가람로 000</p>
            </div>
            <div className="text-center md:text-right text-sm">
              <p>대표전화: 061-000-0000 | 팩스: 061-000-0001</p>
              <p>이메일: news@najunews.com</p>
              <p className="mt-2">© 2026 나주NEWS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 뉴스 컬럼 컴포넌트
function NewsColumn({
  title,
  news,
  color
}: {
  title: string;
  news: any[];
  color: 'red' | 'blue' | 'emerald' | 'purple';
}) {
  const colors = {
    red: { bar: 'bg-red-700', border: 'border-red-700', hover: 'hover:text-red-700' },
    blue: { bar: 'bg-blue-600', border: 'border-blue-600', hover: 'hover:text-blue-600' },
    emerald: { bar: 'bg-emerald-600', border: 'border-emerald-600', hover: 'hover:text-emerald-600' },
    purple: { bar: 'bg-purple-600', border: 'border-purple-600', hover: 'hover:text-purple-600' },
  };

  const firstNews = news[0];
  const restNews = news.slice(1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className={`px-4 py-3 border-b-2 ${colors[color].border}`}>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>

      {/* 첫 번째 뉴스 (썸네일) */}
      {firstNews && (
        <Link href={`/news/${firstNews.id}`} className="block group">
          <div className="relative aspect-[16/10]">
            {firstNews.thumbnail_url ? (
              <Image
                src={firstNews.thumbnail_url}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-3xl">📰</span>
              </div>
            )}
          </div>
          <div className="p-4 border-b border-gray-100">
            <h4 className={`font-bold text-gray-900 line-clamp-2 ${colors[color].hover}`}>
              {firstNews.title}
            </h4>
          </div>
        </Link>
      )}

      {/* 나머지 뉴스 */}
      <ul className="divide-y divide-gray-100">
        {restNews.map((item) => (
          <li key={item.id}>
            <Link
              href={`/news/${item.id}`}
              className={`block px-4 py-3 text-sm text-gray-700 ${colors[color].hover} line-clamp-2`}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 생활 카드 컴포넌트
function LifestyleCard({
  icon,
  title,
  items
}: {
  icon: React.ReactNode;
  title: string;
  items: { name: string; desc: string }[];
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
        {icon}
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <Link href="#" className="text-sm text-gray-700 hover:text-gray-900">
              {item.name}
            </Link>
            <span className="text-xs text-gray-400">{item.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 시간 경과 계산
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
}

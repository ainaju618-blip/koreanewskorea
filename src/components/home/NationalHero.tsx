import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * National Hero Section - 본사(전국판) 전용
 * =========================================
 * 정부기관 보도자료 기반 전국 뉴스만 표시
 * region='korea_kr' 필터 적용
 *
 * 레이아웃:
 * - 좌측 60%: 메인 헤드라인 (전국 TOP 뉴스)
 * - 우측 40%: 전국 뉴스 리스트 (최신순)
 */

interface Article {
  id: string;
  title: string;
  content?: string;
  ai_summary?: string;
  thumbnail_url?: string;
  category?: string;
  published_at: string;
}

// Server-side data fetching
async function getNationalHeroData() {
  const supabase = await createClient();

  // 전국 뉴스만 가져오기 (region='korea_kr')
  const { data: nationalNews } = await supabase
    .from('posts')
    .select('id, title, content, ai_summary, thumbnail_url, category, published_at')
    .eq('status', 'published')
    .eq('region', 'korea_kr')
    .order('published_at', { ascending: false })
    .limit(10);

  const articles = nationalNews || [];

  // 첫 번째 기사 = 메인 헤드라인, 나머지 = 리스트
  const mainArticle = articles[0] || null;
  const sideArticles = articles.slice(1);

  return {
    mainArticle,
    sideArticles,
  };
}

export default async function NationalHero() {
  const { mainArticle, sideArticles } = await getNationalHeroData();

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#A6121D]" />
          <h2 className="text-2xl font-bold text-slate-900">전국 뉴스</h2>
          <span className="text-sm text-slate-500">National News</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
            정책브리핑
          </span>
        </div>
        <Link
          href="https://koreanewskorea.com"
          target="_blank"
          className="text-sm text-[#A6121D] hover:underline flex items-center gap-1"
        >
          지역뉴스 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Headline (Left 66% - 8:4 ratio for emphasis) */}
        <div className="lg:col-span-8">
          {mainArticle ? (
            <Link href={`/news/${mainArticle.id}`} className="group block">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-lg">
                {mainArticle.thumbnail_url ? (
                  <Image
                    src={mainArticle.thumbnail_url}
                    alt={mainArticle.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {mainArticle.category && (
                    <span className="inline-block px-3 py-1 bg-[#A6121D] text-white text-xs font-medium rounded mb-3">
                      {mainArticle.category}
                    </span>
                  )}
                  <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 group-hover:text-slate-200 transition-colors">
                    {mainArticle.title}
                  </h3>
                  {mainArticle.ai_summary && (
                    <p className="text-slate-200 text-sm line-clamp-2 mb-3">
                      {mainArticle.ai_summary}
                    </p>
                  )}
                  <time className="text-xs text-slate-300">
                    {formatDistanceToNow(new Date(mainArticle.published_at), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </time>
                </div>
              </div>
            </Link>
          ) : (
            <div className="aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center">
              <p className="text-slate-500">전국 뉴스를 준비 중입니다</p>
            </div>
          )}
        </div>

        {/* Side News List (Right 33% - 8:4 ratio) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-50 rounded-xl p-5 h-full">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <span className="text-lg font-bold text-slate-900">최신 뉴스</span>
              <span className="text-xs text-slate-500">Latest</span>
            </div>

            <div className="space-y-3">
              {sideArticles.length > 0 ? (
                sideArticles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="flex items-start gap-3 group"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-[#A6121D] text-white text-xs font-bold rounded flex items-center justify-center">
                      {index + 2}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-slate-700 group-hover:text-[#A6121D] line-clamp-2 transition-colors font-medium">
                        {article.title}
                      </h4>
                      <time className="text-xs text-slate-400 mt-1 block">
                        {formatDistanceToNow(new Date(article.published_at), {
                          addSuffix: true,
                          locale: ko
                        })}
                      </time>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  뉴스 준비중...
                </p>
              )}
            </div>

            {/* Branch Link */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <Link
                href="https://koreanewskorea.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white rounded-lg border border-slate-200 hover:border-[#A6121D] hover:text-[#A6121D] transition-all text-sm"
              >
                <span>📍 광주/전남 지역뉴스</span>
                <span className="text-xs text-slate-400">koreanewskorea.com</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Separation */}
      <div className="w-full h-px bg-slate-200 mt-8" />
    </section>
  );
}
